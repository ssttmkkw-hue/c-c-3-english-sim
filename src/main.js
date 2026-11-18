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

let yaw = 0.4;
let pitch = 0.55;
let dist = 6.2;
let now = 0;
let session = null;
let playToken = 0;
let micHeld = false;

hud.setMic(speech.supported ? 'idle' : 'unsupported');
speech.setHandler((info) => {
  hud.setMic(speech.supported ? info.status : 'unsupported');
  if (info.status === 'listening') hud.setInterim(`${info.finalText} ${info.interim}`.trim());
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
    if (hud.ttsEnabled()) speakLine(line.text, voiceOf(line.speaker));
    await wait(Math.min(2800, 900 + line.text.length * 22));
  }
  if (token !== playToken) return;
  hud.setChoices(turn.choices || []);
  session.ended = !!turn.ended;
  session.busy = false;
  if (turn.ended) hud.addLog('System', 'Press Esc or Leave when you want to step away.', 'you');
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
  const turn = await engine.start(session.context);
  await playTurn(turn, token);
}

function closeConversation() {
  if (!session) return;
  playToken += 1;
  for (const npc of session.members) {
    if (npc.def.group && groups[npc.def.group]) groups[npc.def.group].paused = false;
  }
  session = null;
  stopSpeaking();
  if (micHeld) {
    speech.stop();
    micHeld = false;
  }
  hud.showChat(false);
  hud.setChoices([]);
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

  if (!session) {
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
  for (const npc of npcs) {
    const locked = session && session.members.includes(npc);
    npc.update(dt, now, locked);
    if (locked) npc.face(pos.x, pos.z);
  }
  updateAmbient(dt, pos.x, pos.z);

  const zone = zoneAt(pos.x, pos.z);
  hud.setZone(zone.name);

  const head = pos.clone();
  head.y = 1.45;
  const cosP = Math.cos(pitch);
  camera.position.set(
    pos.x + Math.sin(yaw) * dist * cosP,
    pos.y + 1.2 + Math.sin(pitch) * dist,
    pos.z + Math.cos(yaw) * dist * cosP,
  );
  camera.lookAt(head);

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
    if (group && Math.hypot(group.zone.anchor[0] - pos.x, group.zone.anchor[1] - pos.z) < 8) {
      hud.setAmbient(group.recent);
    } else hud.setAmbient([]);
    if (group && keyboard.consume('KeyE')) openConversation(group.zone.dialogue, 'group', group.members);
    if (solo && keyboard.consume('KeyF')) openConversation(solo.def.solo, 'solo', [solo]);
    hud.joinBtn.onclick = () => { if (group) openConversation(group.zone.dialogue, 'group', group.members); };
    hud.talkBtn.onclick = () => { if (solo) openConversation(solo.def.solo, 'solo', [solo]); };
  }

  renderer.render(scene, camera);
}

const clock = new THREE.Clock();
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
window.addEventListener('touchstart', () => touch.show(), { once: true, passive: true });
requestAnimationFrame(loop);
