import * as THREE from 'three';
import { createScene } from './world/scene.js';
import { zoneAt } from './world/zones.js';
import { ZONES } from './world/zones.js';
import { CHARACTERS } from './data/characters.js';
import { AMBIENT, GRAPHS, VISITOR_LINES } from './data/conversations.js';
import { setAvatarOpacity } from './avatars/avatar.js';
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
renderer.shadowMap.type = THREE.PCFShadowMap;
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
let pendingReply = null;
const STATS_KEY = 'plaza-english-stats';
const stats = loadStats();

function loadStats() {
  try {
    const saved = JSON.parse(localStorage.getItem(STATS_KEY) || '{}');
    return {
      conversations: Number(saved.conversations) || 0,
      voiceMatches: Number(saved.voiceMatches) || 0,
    };
  } catch (err) {
    return { conversations: 0, voiceMatches: 0 };
  }
}

function saveStats() {
  hud.setStats(stats.conversations, stats.voiceMatches);
  try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch (err) { /* ignore */ }
}

const camDesired = new THREE.Vector3();
const lookDesired = new THREE.Vector3(0, 1.2, 0);
const lookSmoothed = new THREE.Vector3(0, 1.2, 0);
const bubbleAnchor = new THREE.Vector3();
const tagAnchor = new THREE.Vector3();
const projA = new THREE.Vector3();
const projB = new THREE.Vector3();
let camGain = 6.2;
let aimBias = 0;
let eatKey = '';
saveStats();
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

function applyTurn(turn, token, source) {
  if (!turn || !session || token !== playToken) return;
  session.busy = true;
  session.ended = !!turn.ended;
  choiceList = [];
  hud.setChoices([]);
  hud.setTyping(!turn.ended || (turn.npcLines && turn.npcLines.length > 0));
  hud.setWaiting(false);
  hud.showEnd(false);
  playTurn(turn, token, source);
}

async function playTurn(turn, token, source) {
  if (!session || token !== playToken) return;
  const lines = turn.npcLines || [];
  if (lines.length) hud.setTyping(true);
  for (const line of lines) {
    if (token !== playToken || !session) return;
    const key = `${line.speaker}|${line.text}`;
    if (key === session.lastLineKey) continue;
    session.lastLineKey = key;
    const npc = byName.get(line.speaker);
    for (const other of npcs) {
      if (other !== npc) other.silence(now);
    }
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
  if (token !== playToken || !session) return;
  if (turn.heard) {
    hud.addHeard(turn.heard);
    if (source === 'voice') {
      stats.voiceMatches += 1;
      saveStats();
    }
  }
  hud.setTyping(false);
  session.busy = false;
  if (turn.ended) {
    choiceList = [];
    hud.setChoices([]);
    hud.addRecap(turn.phrases || []);
    hud.showEnd(true);
    if (!session.counted) {
      session.counted = true;
      stats.conversations += 1;
      saveStats();
    }
    pendingReply = null;
    hud.setWaiting(false);
    return;
  }
  choiceList = (turn.choices || []).map((choice) => ({
    text: choice.text,
    keywords: choice.keywords || [],
  }));
  hud.setChoices(choiceList);
  if (pendingReply) {
    const next = pendingReply;
    pendingReply = null;
    hud.setWaiting(false);
    submitText(next.text, next.source);
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
  hud.showEnd(false);
  hud.setTyping(true);
  hud.setWaiting(false);
  choiceList = [];
  pendingReply = null;
  const turn = engine.start(session.context);
  if (turn && typeof turn.then === 'function') turn.then((value) => applyTurn(value, token, 'script'));
  else applyTurn(turn, token, 'script');
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
  pendingReply = null;
  session = null;
  stopSpeaking();
  if (micHeld) {
    speech.stop();
    micHeld = false;
  }
  hud.showChat(false);
  hud.sayEl.blur();
  hud.setChoices([]);
  hud.setTyping(false);
  hud.setWaiting(false);
  hud.showEnd(false);
  hud.setTranscript('');
}

function talkAgain() {
  if (!session || !session.ended) return;
  const { conversationId, mode, members } = session;
  closeConversation();
  openConversation(conversationId, mode, members);
}

function submitText(text, source) {
  const clean = String(text || '').trim();
  if (!session || !clean || session.ended) return;
  if (session.busy) {
    pendingReply = { text: clean, source: source || 'text' };
    hud.setWaiting(true);
    return;
  }
  const token = playToken;
  choiceList = [];
  hud.setChoices([]);
  hud.showEnd(false);
  session.busy = true;
  hud.setTyping(true);
  hud.addLog('You', clean, 'you');
  const turn = engine.respond(clean, session.context);
  if (turn && typeof turn.then === 'function') turn.then((value) => applyTurn(value, token, source || 'text'));
  else applyTurn(turn, token, source || 'text');
}

hud.onChoice((text) => { submitText(text, 'choice'); });
hud.onSend((text) => { submitText(text, 'text'); });
hud.onLeave(() => closeConversation());
hud.onAgain(() => talkAgain());

function holdMic() {
  if (!session || !speech.supported || micHeld) return;
  micHeld = true;
  speech.start();
}
function releaseMic() {
  if (!micHeld) return;
  micHeld = false;
  const text = speech.stop();
  if (text) submitText(text, 'voice');
}
hud.micBtn.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  holdMic();
});
hud.micBtn.addEventListener('pointerup', releaseMic);
hud.micBtn.addEventListener('pointerleave', releaseMic);

function keyName(event) {
  if (event.code === 'Escape' || event.key === 'Escape') return 'esc';
  if (event.code === 'KeyH' || event.key === 'h' || event.key === 'H' || event.key === '?') return 'help';
  if (event.code === 'Space' || event.key === ' ') return 'space';
  return '';
}

window.addEventListener('keydown', (event) => {
  if (event.repeat) return;
  const name = keyName(event);
  if (hud.helpOpen()) {
    if (name === 'esc' || (name === 'help' && !keyboard.typing())) {
      hud.setHelp(false);
      eatKey = name;
      event.preventDefault();
    } else if (name === 'help') {
      eatKey = 'help';
      event.preventDefault();
    }
    return;
  }
  if (name === 'help' && !keyboard.typing()) {
    hud.setHelp(true);
    eatKey = 'help';
    event.preventDefault();
    return;
  }
  if (name === 'space' && session && !keyboard.typing()) holdMic();
});
window.addEventListener('keyup', (event) => {
  const name = keyName(event);
  if (name === 'space') releaseMic();
  if (eatKey && name === eatKey) {
    eatKey = '';
    return;
  }
  if (name === 'esc') {
    if (hud.helpOpen()) {
      hud.setHelp(false);
      return;
    }
    closeConversation();
  }
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
    if (group.paused) {
      group.focus = null;
      continue;
    }
    group.timer -= dt;
    if (group.timer > 0) continue;
    let pause = 2.2 + Math.random() * 2.1;
    if (Math.random() < 0.22) pause += 1.3 + Math.random() * 1.6;
    group.timer = pause;
    const line = group.lines[group.index % group.lines.length];
    group.index += 1;
    const npc = byName.get(line.speaker);
    if (npc) {
      npc.say(line.text, now);
      npc.react(Math.random() < 0.8 ? 'nod' : 'wave');
      const [ax, az] = group.zone.anchor;
      npc.face(ax, az);
      const p = npc.avatar.root.position;
      const hold = Math.min(4.2, 1.6 + line.text.length * 0.035);
      group.focus = { name: line.speaker, x: p.x, z: p.z, until: now + hold + 0.5 };
    }
    group.recent.push(line);
    if (group.recent.length > 3) group.recent.shift();
    if (hud.ttsEnabled() && !session) {
      const near = Math.hypot(group.zone.anchor[0] - x, group.zone.anchor[1] - z) < 7;
      if (near) speakLine(line.text, voiceOf(line.speaker));
    }
  }
}

const visits = new Map();

function endVisit(npc, visit, delay) {
  npc.clearGoal();
  visit.phase = 'idle';
  visit.group = null;
  visit.timer = delay;
}

function updateVisitors(dt) {
  for (const npc of npcs) {
    if (!npc.def.wander) continue;
    let visit = visits.get(npc);
    if (!visit) {
      visit = { phase: 'idle', timer: 3.5 + Math.random() * 6, group: null };
      visits.set(npc, visit);
    }
    if (session && session.members.includes(npc)) {
      visit.phase = 'idle';
      visit.group = null;
      visit.timer = 5;
      continue;
    }
    if (visit.phase === 'idle') {
      visit.timer -= dt;
      if (visit.timer > 0) continue;
      const options = Object.values(groups).filter((group) => !group.paused);
      if (!options.length) {
        visit.timer = 4;
        continue;
      }
      const group = options[Math.floor(Math.random() * options.length)];
      const [ax, az] = group.zone.anchor;
      const ang = Math.random() * Math.PI * 2;
      const stand = 2.55 + Math.random() * 0.4;
      npc.setGoal(ax + Math.sin(ang) * stand, az + Math.cos(ang) * stand, ax, az);
      visit.phase = 'go';
      visit.group = group;
      visit.timer = 14;
    } else if (visit.phase === 'go') {
      if (!visit.group || visit.group.paused) {
        endVisit(npc, visit, 8 + Math.random() * 6);
        continue;
      }
      visit.timer -= dt;
      const [ax, az] = visit.group.zone.anchor;
      const nearGroup = npc.distanceTo(ax, az) < 4.1;
      if (npc.goalDistance() < 0.45 || (visit.timer <= 0 && nearGroup)) {
        const lines = VISITOR_LINES[npc.def.id] || VISITOR_LINES.rae;
        const text = lines[Math.floor(Math.random() * lines.length)];
        const spot = npc.avatar.root.position;
        npc.setGoal(spot.x, spot.z, ax, az);
        npc.say(text, now);
        npc.react('wave');
        npc.face(ax, az);
        visit.group.focus = { name: npc.def.name, x: spot.x, z: spot.z, until: now + 4.3 };
        visit.group.recent.push({ speaker: npc.def.name, text });
        if (visit.group.recent.length > 3) visit.group.recent.shift();
        visit.phase = 'talk';
        visit.timer = 3.3 + Math.random() * 1.4;
      } else if (visit.timer <= 0) {
        endVisit(npc, visit, 10 + Math.random() * 8);
      }
    } else if (visit.phase === 'talk') {
      visit.timer -= dt;
      if (visit.group && visit.group.focus && visit.group.focus.name === npc.def.name) {
        const spot = npc.avatar.root.position;
        visit.group.focus.x = spot.x;
        visit.group.focus.z = spot.z;
      }
      if (visit.timer <= 0 || !visit.group || visit.group.paused) {
        endVisit(npc, visit, 16 + Math.random() * 16);
      }
    }
  }
}

function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05);
  now += dt;
  const help = hud.helpOpen();
  const look = pointer.read();
  if (!help) {
    yaw -= look.dx * 0.005;
    pitch = Math.min(1.2, Math.max(0.25, pitch + look.dy * 0.003));
    dist = Math.min(9, Math.max(3.2, dist + look.wheel * 0.45));
  }

  if (help) {
    keyboard.consume('Digit1');
    keyboard.consume('Digit2');
    keyboard.consume('Digit3');
    keyboard.consume('KeyE');
    keyboard.consume('KeyF');
    keyboard.consume('Space');
  } else if (!keyboard.typing()) {
    if (keyboard.consume('Digit1')) player.react('wave');
    if (keyboard.consume('Digit2')) player.react('nod');
    if (keyboard.consume('Digit3')) player.react('jump');
  }

  if (!session && !keyboard.typing()) {
    let ix = 0;
    let iz = 0;
    if (!help) {
      ix = touch.vector.x;
      iz = touch.vector.y;
      if (keyboard.heldAny('KeyA', 'ArrowLeft')) ix -= 1;
      if (keyboard.heldAny('KeyD', 'ArrowRight')) ix += 1;
      if (keyboard.heldAny('KeyW', 'ArrowUp')) iz -= 1;
      if (keyboard.heldAny('KeyS', 'ArrowDown')) iz += 1;
    }
    const sin = Math.sin(yaw);
    const cos = Math.cos(yaw);
    const moveX = ix * cos + iz * sin;
    const moveZ = -ix * sin + iz * cos;
    const run = !help && keyboard.heldAny('ShiftLeft', 'ShiftRight');
    const bodies = npcs.map((npc) => ({
      x: npc.avatar.root.position.x,
      z: npc.avatar.root.position.z,
      r: 0.42,
    }));
    player.update(dt, { x: moveX, z: moveZ }, run, bodies);
  }

  const pos = player.avatar.root.position;
  const speakerNpc = session && session.speaker ? byName.get(session.speaker) : null;
  const bodyOf = (npc) => ({ x: npc.avatar.root.position.x, z: npc.avatar.root.position.z, r: 0.42 });
  for (const npc of npcs) {
    const locked = session && session.members.includes(npc);
    const others = [{ x: pos.x, z: pos.z, r: player.radius }];
    for (const other of npcs) {
      if (other !== npc) others.push(bodyOf(other));
    }
    npc.update(dt, now, locked, others);
    if (locked && session.mode === 'solo') npc.face(pos.x, pos.z);
    else if (locked && session.center) npc.face(session.center.x, session.center.z);
  }
  updateVisitors(dt);
  updateAmbient(dt, pos.x, pos.z);
  applyLooks(speakerNpc, pos);

  const zone = zoneAt(pos.x, pos.z);
  hud.setZone(zone.name);

  if (session && session.mode === 'group' && session.center) {
    const center = session.center;
    player.avatar.root.rotation.y = Math.atan2(center.x - pos.x, center.z - pos.z);
    let ax = pos.x - center.x;
    let az = pos.z - center.z;
    const alen = Math.hypot(ax, az) || 1;
    ax /= alen;
    az /= alen;
    const narrow = window.innerWidth <= 560 || window.innerWidth < window.innerHeight;
    const back = narrow ? 6.05 : 5.25;
    const camY = narrow ? 4.25 : 2.72;
    if (narrow) {
      const sx = -az;
      const sz = ax;
      if (session.sideSign == null) {
        const prefer = Math.sin(yaw) * sx + Math.cos(yaw) * sz;
        session.sideSign = prefer < 0 ? -1 : 1;
      }
      const side = 2.35 * session.sideSign;
      camDesired.set(pos.x + ax * back + sx * side, camY, pos.z + az * back + sz * side);
    } else {
      camDesired.set(pos.x + ax * back, camY, pos.z + az * back);
    }
    const speak = speakerNpc ? speakerNpc.avatar.root.position : center;
    const speakMix = narrow ? 0.74 : 0.42;
    lookDesired.set(
      center.x * (1 - speakMix) + speak.x * speakMix,
      narrow ? 1.22 : 1.08,
      center.z * (1 - speakMix) + speak.z * speakMix,
    );
  } else if (session && session.mode === 'solo' && session.members[0]) {
    const npos = session.members[0].avatar.root.position;
    player.avatar.root.rotation.y = Math.atan2(npos.x - pos.x, npos.z - pos.z);
    let dx = npos.x - pos.x;
    let dz = npos.z - pos.z;
    const len = Math.hypot(dx, dz) || 1;
    dx /= len;
    dz /= len;
    let sx = -dz;
    let sz = dx;
    if (session.sideSign == null) {
      const prefer = Math.sin(yaw) * sx + Math.cos(yaw) * sz;
      session.sideSign = prefer < 0 ? -1 : 1;
    }
    sx *= session.sideSign;
    sz *= session.sideSign;
    camDesired.set(pos.x - dx * 5.15 + sx * 0.85, 2.68, pos.z - dz * 5.15 + sz * 0.85);
    lookDesired.set(pos.x * 0.42 + npos.x * 0.58, 1.06, pos.z * 0.42 + npos.z * 0.58);
  } else {
    const cosP = Math.cos(pitch);
    camDesired.set(
      pos.x + Math.sin(yaw) * dist * cosP,
      1.25 + Math.sin(pitch) * dist,
      pos.z + Math.cos(yaw) * dist * cosP,
    );
    lookDesired.set(pos.x, 1.25, pos.z);
  }
  separateCamera(camDesired);
  const gainTarget = session ? 4.4 : 6.4;
  camGain += (gainTarget - camGain) * (1 - Math.exp(-2.4 * dt));
  const biasTarget = session ? 0.2 : 0;
  aimBias += (biasTarget - aimBias) * (1 - Math.exp(-camGain * dt));
  if (!camera.userData.ready) {
    camera.position.copy(camDesired);
    lookSmoothed.copy(lookDesired);
    camera.userData.ready = true;
  } else {
    const k = 1 - Math.exp(-camGain * dt);
    camera.position.lerp(camDesired, k);
    lookSmoothed.lerp(lookDesired, 1 - Math.exp(-3.4 * dt));
  }
  separateCamera(camera.position);
  camera.lookAt(lookSmoothed);
  if (aimBias > 0.001) camera.rotateX(-aimBias);
  fadePlayerIfBlocking(speakerNpc);
  updateNameTag();
  fitNameTags();
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
    if (!help && group && keyboard.consume('KeyE')) openConversation(group.zone.dialogue, 'group', group.members);
    if (!help && solo && keyboard.consume('KeyF')) openConversation(solo.def.solo, 'solo', [solo]);
    hud.joinBtn.onclick = () => { if (group) openConversation(group.zone.dialogue, 'group', group.members); };
    hud.talkBtn.onclick = () => { if (solo) openConversation(solo.def.solo, 'solo', [solo]); };
  }

  drawMinimap(pos);
  renderer.render(scene, camera);
}

function applyLooks(speakerNpc, pos) {
  const looked = new Set();
  if (session) {
    for (const npc of session.members) {
      const target = speakerNpc && speakerNpc !== npc ? speakerNpc.avatar.root.position : pos;
      npc.lookAt(target.x, target.z);
      looked.add(npc);
    }
  }
  for (const group of Object.values(groups)) {
    if (group.paused || !group.focus || now > group.focus.until) continue;
    for (const member of group.members) {
      if (looked.has(member) || member.def.name === group.focus.name) continue;
      member.lookAt(group.focus.x, group.focus.z);
      looked.add(member);
    }
  }
  for (const npc of npcs) {
    if (!looked.has(npc)) npc.clearLook();
  }
}

function separateCamera(point) {
  const bodies = [player.avatar.root.position];
  for (const npc of npcs) bodies.push(npc.avatar.root.position);
  for (let pass = 0; pass < 2; pass++) {
    for (const body of bodies) {
      const yOnBody = Math.max(0.35, Math.min(1.8, point.y));
      let dx = point.x - body.x;
      let dy = point.y - yOnBody;
      let dz = point.z - body.z;
      let distBody = Math.hypot(dx, dy, dz);
      if (distBody >= 1.2) continue;
      if (distBody < 1e-4) {
        dx = 0;
        dy = 1;
        dz = 0;
        distBody = 1;
      }
      const push = 1.22 - distBody;
      point.x += (dx / distBody) * push;
      point.y += (dy / distBody) * push;
      point.z += (dz / distBody) * push;
    }
  }
  if (point.y < 0.85) point.y = 0.85;
}

function updateNameTag() {
  const tag = player.avatar.tag;
  if (!tag) return;
  if (session) {
    tag.visible = false;
    return;
  }
  tag.visible = true;
  let near = false;
  const p = player.avatar.root.position;
  for (const npc of npcs) {
    if (npc.distanceTo(p.x, p.z) < 1.7) near = true;
  }
  tag.position.y = near ? 2.62 : 2.15;
  tag.material.opacity = near ? 0.45 : 1;
  tag.userData.base = near ? 1.05 : 1.7;
}

function fitNameTags() {
  fitSpriteTag(player.avatar.tag, player.avatar.root, player.avatar.tag.userData.base || 1.7);
  for (const npc of npcs) fitSpriteTag(npc.avatar.tag, npc.avatar.root, 1.7);
}

function fitSpriteTag(tag, root, base) {
  if (!tag || !tag.visible) return;
  root.getWorldPosition(tagAnchor);
  tagAnchor.y += tag.position.y;
  const away = Math.max(0.75, tagAnchor.distanceTo(camera.position));
  const s = Math.min(base, Math.max(0.34, away * 0.28));
  tag.scale.set(s, s * 0.25, 1);
}

function narrowLayout() {
  return window.innerWidth <= 560 || window.innerWidth < window.innerHeight;
}

function screenGap(ax, ay, az, bx, by, bz) {
  projA.set(ax, ay, az).project(camera);
  projB.set(bx, by, bz).project(camera);
  if (projA.z < -1 || projA.z > 1 || projB.z < -1 || projB.z > 1) return 99;
  return Math.hypot(projA.x - projB.x, projA.y - projB.y);
}

function fadePlayerIfBlocking(speakerNpc) {
  let opacity = 1;
  if (session && session.members.length) {
    camera.updateMatrixWorld();
    const cam = camera.position;
    const p = player.avatar.root.position;
    const playerDist = Math.hypot(p.x - cam.x, 1.3 - cam.y, p.z - cam.z);
    const targets = speakerNpc ? [speakerNpc] : session.members;
    for (const npc of targets) {
      const t = npc.avatar.root.position;
      const targetDist = Math.hypot(t.x - cam.x, 1.45 - cam.y, t.z - cam.z);
      if (playerDist > targetDist - 0.15) continue;
      const gap = Math.min(
        screenGap(p.x, 1.45, p.z, t.x, 1.5, t.z),
        screenGap(p.x, 1.05, p.z, t.x, 1.45, t.z),
      );
      if (gap < (narrowLayout() ? 0.62 : 0.4)) opacity = 0.28;
    }
  }
  setAvatarOpacity(player.avatar, opacity);
}

function fitBubble(npc) {
  const spr = npc.avatar.bubble;
  if (session && session.members.includes(npc)) {
    spr.visible = false;
    return;
  }
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
  const s = Math.min(2.5, Math.max(0.62, away * 0.24));
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
  say(text) { submitText(String(text || ''), 'text'); },
  choose(index) {
    const choice = choiceList[index];
    if (choice) submitText(choice.text, 'choice');
  },
  leave: closeConversation,
  chatWith(name) {
    const key = String(name || '').trim().toLowerCase();
    const npc = npcs.find((item) => item.def.name.toLowerCase() === key || item.def.id === key);
    if (!npc) return;
    if (session) closeConversation();
    const p = npc.avatar.root.position;
    player.avatar.root.position.set(p.x + 1.25, 0, p.z + 0.15);
    if (npc.def.solo) openConversation(npc.def.solo, 'solo', [npc]);
  },
};

const clock = new THREE.Clock();
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
window.addEventListener('touchstart', () => touch.show(), { once: true, passive: true });
requestAnimationFrame(loop);
