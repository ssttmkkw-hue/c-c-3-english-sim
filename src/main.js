import * as THREE from 'three';
import { createScene } from './world/scene.js';
import { zoneAt } from './world/zones.js';
import { ZONES } from './world/zones.js';
import { CHARACTERS } from './data/characters.js';
import { AMBIENT, GRAPHS } from './data/conversations.js';
import { createPlayer } from './avatars/player.js';
import { createNPC } from './avatars/npc.js';
import { createKeyboard } from './input/keyboard.js';
import { createPointer } from './input/pointer.js';
import { createTouch } from './input/touch.js';
import { createSpeechInput, speakLine, stopSpeaking } from './input/speech.js';
import { createHUD } from './ui/hud.js';
import { DialogueEngine } from './dialogue/DialogueEngine.js';
import { ScriptedProvider } from './dialogue/ScriptedProvider.js';
// AIProvider in ./dialogue/AIProvider.js is an unwired stub (no API key).

const canvas = document.querySelector('#view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const { scene, colliders } = createScene();
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 120);

const zoneById = Object.fromEntries(ZONES.map((zone) => [zone.id, zone]));
const GROUP_ZONE = { cafe: 'cafe', park: 'park', class: 'classroom', shop: 'shop' };

const player = createPlayer(colliders);
scene.add(player.avatar.root);

const npcs = CHARACTERS.map((def) => {
  const zone = zoneById[GROUP_ZONE[def.group]] || zoneById[def.zone];
  const anchor = def.home || (zone && zone.anchor) || [0, 0];
  const npc = createNPC(def, def.group ? zone.anchor : anchor, colliders);
  scene.add(npc.avatar.root);
  return npc;
});
const byName = new Map(npcs.map((npc) => [npc.def.name, npc]));

const groups = {};
for (const [groupId, zoneKey] of Object.entries(GROUP_ZONE)) {
  const zone = zoneById[zoneKey];
  groups[groupId] = {
    id: groupId,
    zone,
    members: npcs.filter((npc) => npc.def.group === groupId),
    lines: AMBIENT[zone.ambient],
    index: 0,
    timer: 1.5 + Math.random(),
    paused: false,
    recent: [],
  };
}

const keyboard = createKeyboard();
const pointer = createPointer(canvas);
const touch = createTouch(document.body);
const speech = createSpeechInput();
const hud = createHUD();
const engine = new DialogueEngine(new ScriptedProvider(GRAPHS));

let yaw = 2.2;
let pitch = 0.55;
let dist = 6.2;
let now = 0;
let session = null;
let playToken = 0;
let micHeld = false;
let lastNpcLine = '';
let choiceList = [];

const camDesired = new THREE.Vector3();
const bubbleAnchor = new THREE.Vector3();
const mapCanvas = document.querySelector('#minimap');
const mapCtx = mapCanvas.getContext('2d');

hud.setMic(speech.supported ? 'idle' : 'unsupported');
speech.setHandler((info) => {
  hud.setMic(speech.supported ? info.status : 'unsupported');
  if (info.status === 'listening') hud.setTranscript(`${info.finalText} ${info.interim}`.trim());
  else hud.setTranscript('');
});

function wait(ms) {
  return new Promise((resolve) => { setTimeout(resolve, ms); });
}

function voiceOf(name) {
  const npc = byName.get(name);
  return npc ? npc.def.voice : 0;
}

async function playTurn(turn, token) {
  if (!session || token !== playToken) return;
  session.busy = true;
  hud.setChoices([]);
  for (const line of turn.npcLines) {
    if (token !== playToken) return;
    const npc = byName.get(line.speaker);
    if (npc) {
      npc.say(line.text, now);
      npc.react(turn.reaction || 'nod');
    }
    hud.addLog(line.speaker, line.text, 'npc');
    lastNpcLine = `${line.speaker}: ${line.text}`;
    session.speaker = line.speaker;
    if (hud.ttsEnabled()) speakLine(line.text, voiceOf(line.speaker));
    await wait(Math.min(2800, 900 + line.text.length * 22));
  }
  if (token !== playToken) return;
  if (turn.heard) hud.addHeard(turn.heard);
  choiceList = turn.choices || [];
  hud.setChoices(choiceList);
  session.ended = !!turn.ended;
  session.busy = false;
  if (turn.ended) {
    hud.addRecap(turn.phrases || []);
    hud.addLog('System', 'Press Esc or Leave when you want to step away.', 'you');
  }
}

function formCircle(members) {
  const p = player.avatar.root.position;
  const radius = Math.max(1.5, 0.9 + members.length * 0.22);
  const cx = p.x;
  const cz = p.z - radius;
  session.center = new THREE.Vector3(cx, 1.25, cz);
  const slots = members.length + 1;
  members.forEach((npc, i) => {
    const ang = (Math.PI * 2 * (i + 1)) / slots;
    npc.setGoal(cx + Math.sin(ang) * radius, cz + Math.cos(ang) * radius, cx, cz);
    npc.face(cx, cz);
  });
}

async function openConversation(conversationId, mode, members) {
  if (session) return;
  playToken += 1;
  const token = playToken;
  const zone = zoneAt(player.avatar.root.position.x, player.avatar.root.position.z);
  session = {
    conversationId,
    mode,
    members,
    busy: true,
    ended: false,
    context: {
      conversationId,
      zoneId: zone.id,
      speakers: members.map((npc) => npc.def.name),
      mode,
    },
  };
  for (const npc of members) {
    if (npc.def.group && groups[npc.def.group]) groups[npc.def.group].paused = true;
  }
  hud.setPrompt([]);
  hud.setActions({ join: null, talk: null });
  hud.setAmbient([]);
  hud.showChat(true);
  formCircle(members);
  const turn = await engine.start(session.context);
  await playTurn(turn, token);
}

function closeConversation() {
  if (!session) return;
  playToken += 1;
  for (const npc of session.members) {
    if (npc.def.group && groups[npc.def.group]) groups[npc.def.group].paused = false;
    npc.clearGoal();
    npc.clearLook();
  }
  choiceList = [];
  session = null;
  stopSpeaking();
  if (micHeld) {
    speech.stop();
    micHeld = false;
  }
  hud.showChat(false);
  hud.setChoices([]);
  hud.setTranscript('');
}

async function submitText(text) {
  if (!session || session.busy || session.ended) return;
  const token = playToken;
  session.busy = true;
  hud.addLog('You', text, 'you');
  const turn = await engine.respond(text, session.context);
  await playTurn(turn, token);
}

hud.onChoice((text) => { submitText(text); });
hud.onSend((text) => { submitText(text); });
hud.onLeave(() => closeConversation());

function holdMic() {
  if (!session || !speech.supported || micHeld) return;
  micHeld = true;
  speech.start();
}
function releaseMic() {
  if (!micHeld) return;
  micHeld = false;
  const text = speech.stop();
  if (text) submitText(text);
}
hud.micBtn.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  holdMic();
});
hud.micBtn.addEventListener('pointerup', releaseMic);
hud.micBtn.addEventListener('pointerleave', releaseMic);

window.addEventListener('keydown', (event) => {
  if (event.repeat) return;
  if (event.code === 'Space' && session && !keyboard.typing()) holdMic();
});
window.addEventListener('keyup', (event) => {
  if (event.code === 'Space') releaseMic();
  if (event.code === 'Escape') closeConversation();
});

function nearestGroup(x, z) {
  let best = null;
  let bestDist = 6.2;
  for (const group of Object.values(groups)) {
    const [ax, az] = group.zone.anchor;
    const distAnchor = Math.hypot(ax - x, az - z);
    const distMember = Math.min(...group.members.map((npc) => npc.distanceTo(x, z)));
    const dist = Math.min(distAnchor, distMember + 1.2);
    if (dist < bestDist) {
      bestDist = dist;
      best = group;
    }
  }
  return best;
}

function updateAmbient(dt, x, z) {
  for (const group of Object.values(groups)) {
    if (group.paused) continue;
    group.timer -= dt;
    if (group.timer > 0) continue;
    group.timer = 3.6;
    const line = group.lines[group.index % group.lines.length];
    group.index += 1;
    const npc = byName.get(line.speaker);
    if (npc) {
      npc.say(line.text, now);
      npc.react('nod');
      const [ax, az] = group.zone.anchor;
      npc.face(ax, az);
    }
    group.recent.push(line);
    if (group.recent.length > 3) group.recent.shift();
    if (hud.ttsEnabled() && !session) {
      const near = Math.hypot(group.zone.anchor[0] - x, group.zone.anchor[1] - z) < 7;
      if (near) speakLine(line.text, voiceOf(line.speaker));
    }
  }
}

function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05);
  now += dt;
  const look = pointer.read();
  yaw -= look.dx * 0.005;
  pitch = Math.min(1.2, Math.max(0.25, pitch + look.dy * 0.003));
  dist = Math.min(9, Math.max(3.2, dist + look.wheel * 0.45));

  if (!keyboard.typing()) {
    if (keyboard.consume('Digit1')) player.react('wave');
    if (keyboard.consume('Digit2')) player.react('nod');
    if (keyboard.consume('Digit3')) player.react('jump');
  }

  if (!session && !keyboard.typing()) {
    let ix = touch.vector.x;
    let iz = touch.vector.y;
    if (keyboard.heldAny('KeyA', 'ArrowLeft')) ix -= 1;
    if (keyboard.heldAny('KeyD', 'ArrowRight')) ix += 1;
    if (keyboard.heldAny('KeyW', 'ArrowUp')) iz -= 1;
    if (keyboard.heldAny('KeyS', 'ArrowDown')) iz += 1;
    const sin = Math.sin(yaw);
    const cos = Math.cos(yaw);
    const moveX = ix * cos + iz * sin;
    const moveZ = -ix * sin + iz * cos;
    const run = keyboard.heldAny('ShiftLeft', 'ShiftRight');
    player.update(dt, { x: moveX, z: moveZ }, run);
  }

  const pos = player.avatar.root.position;
  const speakerNpc = session && session.speaker ? byName.get(session.speaker) : null;
  for (const npc of npcs) {
    const locked = session && session.members.includes(npc);
    npc.update(dt, now, locked);
    if (locked && session.mode === 'solo') npc.face(pos.x, pos.z);
    else if (locked && session.center) npc.face(session.center.x, session.center.z);
    if (locked) {
      const target = speakerNpc && speakerNpc !== npc ? speakerNpc.avatar.root.position : pos;
      npc.lookAt(target.x, target.z);
    } else npc.clearLook();
  }
  updateAmbient(dt, pos.x, pos.z);

  const zone = zoneAt(pos.x, pos.z);
  hud.setZone(zone.name);

  const focus = session && session.center ? session.center : pos;
  const useDist = session ? Math.max(dist, 7.4) : dist;
  const usePitch = session ? Math.max(pitch, 0.58) : pitch;
  const cosP = Math.cos(usePitch);
  camDesired.set(
    focus.x + Math.sin(yaw) * useDist * cosP,
    1.25 + Math.sin(usePitch) * useDist,
    focus.z + Math.cos(yaw) * useDist * cosP,
  );
  if (!camera.userData.ready) {
    camera.position.copy(camDesired);
    camera.userData.ready = true;
  } else {
    camera.position.lerp(camDesired, 1 - Math.exp(-7 * dt));
  }
  camera.lookAt(focus.x, 1.35, focus.z);
  for (const npc of npcs) fitBubble(npc);

  if (!session) {
    const group = nearestGroup(pos.x, pos.z);
    let solo = null;
    let soloDist = 2.55;
    for (const npc of npcs) {
      if (!npc.def.solo) continue;
      const d = npc.distanceTo(pos.x, pos.z);
      if (d < soloDist) {
        soloDist = d;
        solo = npc;
      }
    }
    const lines = [];
    if (group) lines.push('Press E to join conversation');
    if (solo) lines.push(`Press F to chat 1-on-1 with ${solo.def.name}`);
    hud.setPrompt(lines);
    hud.setActions({
      join: group ? 'Join conversation' : null,
      talk: solo ? 'Talk 1-on-1' : null,
    });
    if (group && Math.hypot(group.zone.anchor[0] - pos.x, group.zone.anchor[1] - pos.z) < 15) {
      hud.setAmbient(group.recent.slice(-2));
    } else hud.setAmbient([]);
    if (group && keyboard.consume('KeyE')) openConversation(group.zone.dialogue, 'group', group.members);
    if (solo && keyboard.consume('KeyF')) openConversation(solo.def.solo, 'solo', [solo]);
    hud.joinBtn.onclick = () => { if (group) openConversation(group.zone.dialogue, 'group', group.members); };
    hud.talkBtn.onclick = () => { if (solo) openConversation(solo.def.solo, 'solo', [solo]); };
  }

  drawMinimap(pos);
  renderer.render(scene, camera);
}

function fitBubble(npc) {
  const spr = npc.avatar.bubble;
  if (now >= npc.bubbleUntil()) {
    spr.visible = false;
    return;
  }
  npc.avatar.root.getWorldPosition(bubbleAnchor);
  const away = bubbleAnchor.distanceTo(camera.position);
  if (away > 15) {
    spr.visible = false;
    return;
  }
  spr.visible = true;
  const s = Math.min(4.6, Math.max(1.85, away * 0.27));
  spr.scale.set(s * 1.15, s * 0.43, 1);
}

function drawMinimap(pos) {
  const S = 160;
  const span = 48;
  const toX = (x) => ((x + 24) / span) * S;
  const toY = (z) => ((z + 24) / span) * S;
  mapCtx.clearRect(0, 0, S, S);
  mapCtx.fillStyle = '#d7ccc8';
  mapCtx.fillRect(0, 0, S, S);
  for (const zone of ZONES) {
    mapCtx.fillStyle = `#${zone.floor.toString(16).padStart(6, '0')}`;
    const x0 = toX(zone.minX);
    const y0 = toY(zone.minZ);
    mapCtx.fillRect(x0, y0, toX(zone.maxX) - x0, toY(zone.maxZ) - y0);
  }
  mapCtx.fillStyle = '#ffffff';
  mapCtx.font = '10px sans-serif';
  for (const zone of ZONES) {
    mapCtx.fillText(zone.name.split(' ')[0], toX(zone.anchor[0]) - 14, toY(zone.anchor[1]));
    mapCtx.beginPath();
    mapCtx.arc(toX(zone.anchor[0]), toY(zone.anchor[1]), 3.5, 0, Math.PI * 2);
    mapCtx.fill();
  }
  mapCtx.fillStyle = '#263238';
  for (const npc of npcs) {
    const p = npc.avatar.root.position;
    mapCtx.fillRect(toX(p.x) - 1.5, toY(p.z) - 1.5, 3, 3);
  }
  mapCtx.fillStyle = '#0277bd';
  mapCtx.beginPath();
  mapCtx.arc(toX(pos.x), toY(pos.z), 4.5, 0, Math.PI * 2);
  mapCtx.fill();
}

function nearestSolo() {
  const pos = player.avatar.root.position;
  let solo = null;
  let soloDist = 2.55;
  for (const npc of npcs) {
    if (!npc.def.solo) continue;
    const d = npc.distanceTo(pos.x, pos.z);
    if (d < soloDist) {
      soloDist = d;
      solo = npc;
    }
  }
  return solo;
}

function tryJoin() {
  if (session) return;
  const pos = player.avatar.root.position;
  const group = nearestGroup(pos.x, pos.z);
  if (group) openConversation(group.zone.dialogue, 'group', group.members);
}

function tryChat() {
  if (session) return;
  const solo = nearestSolo();
  if (solo) openConversation(solo.def.solo, 'solo', [solo]);
}

function teleportTo(zoneOrGroupId) {
  const key = String(zoneOrGroupId || '').trim().toLowerCase();
  if (key === 'plaza' || key === 'center') {
    player.avatar.root.position.set(0, 0, 0);
    return;
  }
  const zoneKey = GROUP_ZONE[key] || (key === 'classroom' ? 'classroom' : key);
  const zone = zoneById[zoneKey] || ZONES.find((item) => item.name.toLowerCase() === key);
  if (zone && zone.anchor) {
    player.avatar.root.position.set(zone.anchor[0], 0, zone.anchor[1] + 3.5);
    return;
  }
  const npc = npcs.find((item) => item.def.id === key || item.def.name.toLowerCase() === key);
  if (npc) {
    const p = npc.avatar.root.position;
    player.avatar.root.position.set(p.x + 1.35, 0, p.z + 0.4);
  }
}

window.__sim = {
  getState() {
    const pos = player.avatar.root.position;
    const zone = zoneAt(pos.x, pos.z);
    const nearNames = [];
    const group = nearestGroup(pos.x, pos.z);
    if (group) nearNames.push(group.id);
    for (const npc of npcs) {
      if (npc.distanceTo(pos.x, pos.z) < 6) nearNames.push(npc.def.name);
    }
    return {
      zone: zone.name,
      playerPos: { x: pos.x, y: pos.y, z: pos.z },
      nearby: nearNames,
      inConversation: !!session,
      conversationId: session ? session.conversationId : null,
      lastNpcLine,
      choices: choiceList.map((choice) => choice.text),
    };
  },
  teleportTo,
  join: tryJoin,
  chat: tryChat,
  say(text) { submitText(String(text || '')); },
  choose(index) {
    const choice = choiceList[index];
    if (choice) submitText(choice.text);
  },
  leave: closeConversation,
};

const clock = new THREE.Clock();
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
window.addEventListener('touchstart', () => touch.show(), { once: true, passive: true });
requestAnimationFrame(loop);
