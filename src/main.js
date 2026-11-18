import * as THREE from 'three';
import { createScene } from './world/scene.js';
import { createAmbience } from './world/ambience.js';
import { zoneAt, ZONES, zoneById as findZone, groupZoneMap, skitSpots, zoneList } from './world/zones.js';
import { showAt, formatRemain } from './world/shows.js';
import { CHARACTERS } from './data/characters.js';
import { AMBIENT, GRAPHS, VISITOR_LINES } from './data/conversations.js';
import { GROUP_CONVERSATIONS } from './data/catalog.js';
import { setAvatarOpacity } from './avatars/avatar.js';
import { createPlayer } from './avatars/player.js';
import { createNPC } from './avatars/npc.js';
import { createKeyboard } from './input/keyboard.js';
import { createPointer } from './input/pointer.js';
import { createTouch } from './input/touch.js';
import { createSpeechInput, setAmbientMuted, speakLine, stopSpeaking } from './input/speech.js';
import { createHUD } from './ui/hud.js';
import { DialogueEngine } from './dialogue/DialogueEngine.js';
import { createSceneDirector } from './dialogue/SceneDirector.js';
import { ScriptedProvider } from './dialogue/ScriptedProvider.js';
import { alignPhrase, normalize } from './dialogue/match.js';
import { createNotebook } from './progress/notebook.js';
import { createMissions } from './progress/missions.js';
import { SKITS, skitById, skitsInZone, groupIdForSkit, spotForSkit, missingCast } from './data/skits/index.js';
import { createSkitPlayer } from './skits/SkitPlayer.js';
// AIProvider in ./dialogue/AIProvider.js is an unwired stub (no API key).

const canvas = document.querySelector('#view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
function phoneLike() {
  return window.innerWidth <= 560 || window.innerWidth < window.innerHeight;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, phoneLike() ? 1.5 : 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const { scene, colliders, portalRings, sun, showBoard } = createScene();
const ambience = createAmbience(scene);
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 120);

const zoneById = Object.fromEntries(ZONES.map((zone) => [zone.id, zone]));
const GROUP_ZONE = groupZoneMap();

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
const castGaps = missingCast(new Set(byName.keys()));
if (castGaps.length) console.warn('Skit role has no avatar', castGaps);

const groups = {};
for (const [groupId, zoneKey] of Object.entries(GROUP_ZONE)) {
  const zone = zoneById[zoneKey];
  groups[groupId] = {
    id: groupId,
    zone,
    members: npcs.filter((npc) => npc.def.group === groupId),
    scenes: AMBIENT[zone.ambient],
    recent: [],
    director: null,
  };
}

const WELCOME_LINE = { text: 'Oh, hi! Join us.', zh: '哦，你好！一起来吧。' };
const FAREWELL_LINE = { text: 'Nice talking with you. See you around.', zh: '聊得很开心。回头见。' };
const PATIENCE_LINE = { text: 'Take your time.', zh: '慢慢来。' };
const asideDirectors = [];
let timeScale = 1;

function attachDirector(group, members, withScenes) {
  return createSceneDirector({
    ambient: !!withScenes,
    getScenes: () => (withScenes && group ? group.scenes : []),
    getMembers: () => members,
    npcByName: (name) => byName.get(name) || null,
    anchor: () => {
      if (group && group.zone) return { x: group.zone.anchor[0], z: group.zone.anchor[1] };
      const npc = members[0];
      const p = npc ? npc.avatar.root.position : player.avatar.root.position;
      return { x: p.x, z: p.z };
    },
    playerPos: () => {
      const p = player.avatar.root.position;
      return { x: p.x, z: p.z };
    },
    patienceLine: PATIENCE_LINE,
    getTiming() {
      const settings = hud.getSettings();
      return { rate: settings.rate };
    },
    onLine(line, kind) {
      if (skit && skit.active()) skit.onDirectorLine(line, kind);
      if (group && (kind === 'ambient' || kind === 'visitor' || kind === 'farewell' || kind === 'welcome')) {
        group.recent.push({ speaker: line.speaker, text: line.text, zh: line.zh || '' });
        if (group.recent.length > 3) group.recent.shift();
      }
      if (!session) return;
      if (kind !== 'dialogue' && kind !== 'welcome' && kind !== 'nudge') return;
      const key = `${line.speaker}|${line.text}`;
      if (kind === 'dialogue' && key === session.lastLineKey) return;
      if (kind === 'dialogue') session.lastLineKey = key;
      hud.addLog(line.speaker, line.text, 'npc', line.zh || '');
      lastNpcLine = `${line.speaker}: ${line.text}`;
      session.speaker = line.speaker;
      session.lastSpoken = line.text;
    },
    onSpeak(line, kind) {
      if (!hud.ttsEnabled()) return null;
      const ambientKind = kind === 'ambient' || kind === 'visitor';
      if (ambientKind) {
        if (session) return null;
        if (group && nearestSpeechGroup() !== group) return null;
        return speakLine(line.text, voiceOf(line.speaker), { ...voiceOptions(), lane: 'ambient' });
      }
      return speakLine(line.text, voiceOf(line.speaker), { ...voiceOptions(), lane: 'foreground' });
    },
  });
}

for (const group of Object.values(groups)) {
  group.director = attachDirector(group, group.members, true);
}

const keyboard = createKeyboard();
const pointer = createPointer(canvas);
const touch = createTouch(document.body);
const speech = createSpeechInput();
const hud = createHUD();
player.applyLook(hud.getAvatar());
hud.onAvatarChange((look) => player.applyLook(look));
hud.onSettingsChange(() => applyQuality());
applyQuality();
if (sun && phoneLike()) sun.shadow.mapSize.set(512, 512);
const engine = new DialogueEngine(new ScriptedProvider(GRAPHS));
const notebook = createNotebook();
const missions = createMissions();
const zhIndex = buildZhIndex(GRAPHS);

let skit = null;
let skitGroup = null;
let skitBaseScale = 1;

skit = createSkitPlayer({
  getSkit: skitById,
  zhOn: () => hud.getSettings().zh,
  render: (model) => hud.renderSkit(model),
  place(item) {
    if (skit && skit.state().private) return Promise.resolve();
    if (watchingShow) {
      const p = player.avatar.root.position;
      return fadeMove(p.x, p.z, () => stageCast(item));
    }
    const spot = spotForSkit(item.id);
    if (!spot) return Promise.resolve();
    return fadeMove(spot.x, spot.z + 1.15);
  },
  mute() { setAmbientMuted(true); },
  unmute() { if (!session) setAmbientMuted(false); },
  claimFloor(item) {
    if (skit && skit.state().private) return Promise.resolve();
    const group = groups[groupIdForSkit(item)];
    skitGroup = group || null;
    if (!group) return Promise.resolve();
    return group.director.suspend();
  },
  playLines(lines) {
    if (!skitGroup) return Promise.resolve();
    return skitGroup.director.playLines(lines);
  },
  cancelLines() {
    if (skitGroup) skitGroup.director.cancelPlayback();
    stopSpeaking();
  },
  releaseFloor() {
    restoreCast();
    watchingShow = false;
    if (seated) standUp();
    if (skitGroup) skitGroup.director.releaseFloor();
    skitGroup = null;
    stopSpeaking();
  },
  stopSpeak() { stopSpeaking(); },
  speak(text) {
    speakLine(text, 0, { ...voiceOptions(), lane: 'foreground', interrupt: true });
  },
  armPatience() {
    if (!skitGroup) return;
    skitGroup.director.holdForPlayer();
    skitGroup.director.setPatience(true);
  },
  calmPatience() {
    if (skitGroup) skitGroup.director.setPatience(false);
  },
  yourTurn(on) { player.setCue(!!on); },
  wait(ms) {
    const seconds = Math.max(0, Number(ms) || 0) / 1000;
    const target = now + seconds;
    return new Promise((resolve) => {
      const step = () => {
        if (now + 1e-4 >= target) resolve();
        else requestAnimationFrame(step);
      };
      step();
    });
  },
  coverLine(beat) {
    if (skit && skit.state().private) return;
    if (!skitGroup || !beat) return;
    const item = skitById(skit.state().id);
    const other = item && item.cast.find((member) => member.role !== beat.role && member.npc);
    const npc = other && byName.get(other.npc);
    if (!npc) return;
    const pos = player.avatar.root.position;
    npc.face(pos.x, pos.z);
    npc.say(`Maybe: ${beat.text}`, now, 4.2, 'back');
  },
  setSlow(on) {
    if (on) {
      skitBaseScale = timeScale;
      timeScale = Math.min(40, Math.max(0.25, skitBaseScale * 0.8));
    } else {
      timeScale = skitBaseScale;
    }
  },
  savePhrases(item) {
    const source = `Skit: ${item.title}`;
    for (const phrase of item.keyPhrases || []) {
      const text = typeof phrase === 'string' ? phrase : phrase && phrase.text;
      if (!text) continue;
      const zh = typeof phrase === 'object' && phrase.zh ? phrase.zh : '';
      notebook.add({ text, zh, source, conversationId: item.id });
    }
  },
  applause(text, extra) {
    hud.celebrate(extra && extra.theater ? 'Applause!' : text);
    if (extra && extra.theater) applaudAudience();
  },
  onLine() {
    refreshMissions(missions.noteSkitLine());
  },
  onShow() {
    refreshMissions(missions.noteShow());
  },
});

let watchingShow = false;
let seated = null;
let staged = [];

function stageCast(item) {
  restoreCast();
  const zone = findZone('playhouse');
  const marks = (zone && zone.stage && zone.stage.marks) || [];
  if (!item || !marks.length) return;
  (item.cast || []).forEach((member, index) => {
    const npc = byName.get(member.npc);
    if (!npc) return;
    const p = npc.avatar.root.position;
    staged.push({ npc, x: p.x, y: p.y, z: p.z, rot: npc.avatar.root.rotation.y });
    const mark = marks[index % marks.length];
    npc.avatar.root.position.set(mark.x, 0.28, mark.z);
    npc.clearGoal();
    npc.face(mark.x, mark.z + 5);
  });
}

function restoreCast() {
  for (const item of staged) {
    item.npc.avatar.root.position.set(item.x, item.y || 0, item.z);
    item.npc.avatar.root.rotation.y = item.rot;
    item.npc.clearGoal();
  }
  staged = [];
}

function nearestSeat(x, z) {
  const zone = findZone('playhouse');
  if (!zone || !zone.seats) return null;
  let best = null;
  let bestDist = 1.65;
  for (const seat of zone.seats) {
    const dist = Math.hypot(seat.x - x, seat.z - z);
    if (dist < bestDist) {
      bestDist = dist;
      best = seat;
    }
  }
  return best;
}

function sitDown(seat) {
  if (!seat || session || (skit && skit.active())) return false;
  const show = showAt(now, SKITS);
  if (!show) return false;
  seated = seat;
  watchingShow = true;
  // Sit slightly toward the chair back (south, +Z) so the body is on the seat.
  player.avatar.root.position.set(seat.x, 0, seat.z + 0.06);
  player.setSit(true);
  const zone = findZone('playhouse');
  const stage = (zone && zone.stage) || { x: 0, z: 33 };
  faceToward(stage.x, stage.z, true);
  pitch = 0.2;
  dist = 6.6;
  return skit.start(show.current.id, { theater: true });
}

function standUp() {
  seated = null;
  player.setSit(false);
  const pos = player.avatar.root.position;
  pos.y = 0;
  pos.z -= 0.5;
}

/** Face a world point and put the camera behind the player. */
function faceToward(tx, tz, snap) {
  const pos = player.avatar.root.position;
  const dx = tx - pos.x;
  const dz = tz - pos.z;
  if (Math.hypot(dx, dz) < 0.05) return;
  player.avatar.root.rotation.y = Math.atan2(dx, dz);
  yaw = player.avatar.root.rotation.y + Math.PI;
  if (snap) camera.userData.ready = false;
}

function arriveInZone(zone, snap) {
  const place = zone || zoneAt(player.avatar.root.position.x, player.avatar.root.position.z);
  const target = (place && (place.lookAt || place.anchor)) || null;
  if (!target) return;
  faceToward(target[0], target[1], snap !== false);
}

function applaudAudience() {
  for (const name of ['Audience Ren', 'Audience Sol']) {
    const npc = byName.get(name);
    if (!npc) continue;
    npc.react('jump');
    npc.say('Ha!', now, 2.4, 'back');
  }
}

let boardKey = '';
function updateShowBoard() {
  if (!showBoard) return;
  const show = showAt(now, SKITS);
  if (!show) return;
  const label = `${show.current.id}|${formatRemain(show.nextIn)}|${show.next.id}`;
  if (label === boardKey) return;
  boardKey = label;
  showBoard.set([
    'Now showing',
    show.current.title,
    `Next at ${formatRemain(show.nextIn)}`,
    show.next.title,
  ]);
}

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
let practicePhrase = null;
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
hud.setSavedCheck((text) => notebook.has(text));
hud.setMissions(missions.get());
speech.setHandler((info) => {
  hud.setMic(speech.supported ? info.status : 'unsupported');
  const line = `${info.finalText} ${info.interim}`.trim();
  if (hud.practiceOpen()) {
    hud.setPracticeTranscript(info.status === 'listening' ? line : '');
    return;
  }
  if (info.status === 'listening') hud.setTranscript(line);
  else hud.setTranscript('');
});

function buildZhIndex(graphs) {
  const map = new Map();
  const put = (text, zh) => {
    if (!text || !zh) return;
    const key = normalize(text);
    if (key && !map.has(key)) map.set(key, zh);
  };
  for (const graph of Object.values(graphs)) {
    for (const node of Object.values(graph.nodes || {})) {
      for (const line of node.lines || []) {
        if (line && typeof line === 'object') put(line.text, line.zh);
      }
      for (const choice of node.choices || []) put(choice.text, choice.zh);
      for (const phrase of node.phrases || []) {
        if (phrase && typeof phrase === 'object') put(phrase.text, phrase.zh);
      }
    }
  }
  return map;
}

function zhFor(text) {
  return zhIndex.get(normalize(text)) || '';
}

function sourceLabel() {
  if (!session) return '';
  const meta = GROUP_CONVERSATIONS.find((item) => item.id === session.conversationId);
  if (meta) return meta.title;
  const npc = session.members[0];
  return npc ? npc.def.name : session.conversationId;
}

function refreshMissions(result) {
  hud.setMissions(missions.get());
  if (!result || !result.newly || !result.newly.length) return;
  const names = result.newly.map((mission) => mission.title).join(', ');
  const text = result.allDone
    ? `All daily missions done (全部完成) · streak ${missions.get().streak}`
    : `Mission complete: ${names}`;
  hud.celebrate(text);
}

function refreshNotebook() {
  if (hud.notebookOpen()) hud.renderNotebook(notebook.list());
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

function syncYourTurn() {
  if (!session) {
    player.setCue(false);
    return;
  }
  const director = sessionDirector();
  const held = director ? director.snapshot().state === 'held' : false;
  const waiting = !session.ended && !session.busy && choiceList.length > 0;
  hud.setYourTurn(waiting && held);
  player.setCue(waiting && held);
  if (!director) return;
  if (waiting) {
    if (!session.patienceOn) {
      session.patienceOn = true;
      director.setPatience(true);
    }
  } else if (session.patienceOn) {
    session.patienceOn = false;
    director.setPatience(false);
  }
}

function sessionDirector() {
  if (!session) return null;
  if (session.group && session.group.director) return session.group.director;
  return session.soloDirector || null;
}

async function playTurn(turn, token, source) {
  if (!session || token !== playToken) return;
  const lines = (turn.npcLines || []).map((line, index) => ({
    speaker: line.speaker,
    text: line.text,
    zh: line.zh || '',
    to: 'player',
    emote: index === 0 ? (turn.reaction || '') : '',
  }));
  if (lines.length) hud.setTyping(true);
  const director = sessionDirector();
  if (director && lines.length) await director.playLines(lines);
  else if (director) director.holdForPlayer();
  if (token !== playToken || !session) return;
  if (turn.heard) {
    hud.addHeard(turn.heard);
    if (source === 'voice') {
      stats.voiceMatches += 1;
      saveStats();
      refreshMissions(missions.noteVoice());
    }
  }
  hud.setTyping(false);
  session.busy = false;
  session.confirming = !!turn.confirm;
  if (turn.ended) {
    choiceList = [];
    hud.setChoices([]);
    rememberPhrases(turn.phrases || []);
    hud.addRecap(turn.phrases || []);
    hud.showEnd(true);
    if (!session.counted) {
      session.counted = true;
      stats.conversations += 1;
      saveStats();
      refreshMissions(missions.noteGroupEnd(session.mission));
    }
    pendingReply = null;
    hud.setWaiting(false);
    return;
  }
  choiceList = (turn.choices || []).map((choice) => ({
    text: choice.text,
    zh: choice.zh || '',
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

function groupForMembers(members) {
  const grouped = members.find((npc) => npc.def.group && groups[npc.def.group]);
  if (!grouped) return null;
  const group = groups[grouped.def.group];
  if (!group || !group.members.length) return null;
  const same = members.every((npc) => npc.def.group === group.id);
  return same ? group : null;
}

async function openConversation(conversationId, mode, members) {
  if (skit && skit.active()) skit.leave();
  hud.setChooser(false);
  if (hud.practiceOpen()) hud.closePractice();
  if (session) return;
  playToken += 1;
  const token = playToken;
  const zone = zoneAt(player.avatar.root.position.x, player.avatar.root.position.z);
  const meta = GROUP_CONVERSATIONS.find((item) => item.id === conversationId);
  const group = mode === 'group' ? groupForMembers(members) : null;
  session = {
    conversationId,
    mode,
    members,
    group,
    soloDirector: null,
    busy: true,
    ended: false,
    confirming: false,
    lastSpoken: '',
    patienceOn: false,
    mission: {
      mode,
      zone: zone.id,
      level: meta ? meta.level : '',
      characterId: members[0] ? members[0].def.id : '',
    },
    context: {
      conversationId,
      zoneId: zone.id,
      speakers: members.map((npc) => npc.def.name),
      mode,
    },
  };
  setAmbientMuted(true);
  if (mode === 'solo') refreshMissions(missions.noteSolo(session.mission.characterId));
  hud.setPrompt([]);
  hud.setActions({ join: null, talk: null });
  hud.setAmbient([]);
  hud.showChat(true);
  hud.showEnd(false);
  hud.setTyping(true);
  hud.setWaiting(false);
  hud.setYourTurn(false);
  choiceList = [];
  pendingReply = null;
  if (group) {
    await group.director.requestJoin(WELCOME_LINE.text, WELCOME_LINE.zh);
    if (token !== playToken || !session) return;
    formCircle(members);
  } else {
    session.soloDirector = attachDirector(null, members, false);
    const home = members.find((npc) => npc.def.group && groups[npc.def.group]);
    if (home) {
      session.suspendedGroup = groups[home.def.group];
      await session.suspendedGroup.director.suspend();
      if (token !== playToken || !session) return;
    }
  }
  if (token !== playToken || !session) return;
  const turn = engine.start(session.context);
  if (turn && typeof turn.then === 'function') turn.then((value) => applyTurn(value, token, 'script'));
  else applyTurn(turn, token, 'script');
}

function closeConversation() {
  hud.setChooser(false);
  if (!session) return;
  playToken += 1;
  const closing = session;
  for (const npc of closing.members) {
    npc.clearGoal();
    npc.clearLook();
  }
  choiceList = [];
  pendingReply = null;
  session = null;
  player.setCue(false);
  hud.setYourTurn(false);
  setAmbientMuted(false);
  stopSpeaking();
  if (closing.group && closing.group.director) {
    closing.group.director.requestFarewell(FAREWELL_LINE.text, FAREWELL_LINE.zh);
  } else if (closing.soloDirector) {
    closing.soloDirector.requestFarewell(FAREWELL_LINE.text, FAREWELL_LINE.zh);
    asideDirectors.push({ director: closing.soloDirector, release: closing.suspendedGroup || null });
  }
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

function voiceOptions() {
  const settings = hud.getSettings();
  return { rate: settings.rate, voiceURI: settings.voiceURI };
}

function firstWords(text) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  const count = Math.min(3, words.length);
  const cut = words.slice(0, count).join(' ');
  return words.length > count ? `${cut}…` : cut;
}

function rememberPhrases(phrases) {
  const source = sourceLabel() || 'Conversation';
  const conversationId = session ? session.conversationId : '';
  for (const phrase of phrases) {
    const text = typeof phrase === 'string' ? phrase : phrase && phrase.text;
    if (!text) continue;
    const zh = typeof phrase === 'object' && phrase.zh ? phrase.zh : zhFor(text);
    notebook.add({ text, zh, source, conversationId });
  }
}

function openPractice(text, zh) {
  const phrase = String(text || '').trim();
  if (!phrase) return false;
  practicePhrase = { text: phrase, zh: zh || zhFor(phrase) };
  hud.openPractice(practicePhrase.text, practicePhrase.zh, speech.supported);
  speakLine(practicePhrase.text, 0, { ...voiceOptions(), lane: 'foreground', interrupt: true });
  return true;
}

function scorePractice(heard) {
  if (!practicePhrase) return;
  const result = alignPhrase(practicePhrase.text, heard);
  hud.showPracticeResult(result, heard);
  notebook.record(practicePhrase.text, result.score);
  refreshNotebook();
  refreshMissions(missions.notePractice());
}

function toggleNotebook() {
  if (hud.notebookOpen()) hud.setNotebook(false);
  else hud.showNotebook(notebook.list());
}

function submitText(text, source, zh) {
  const clean = String(text || '').trim();
  if (hud.practiceOpen() || !session || !clean || session.ended) return;
  if (session.busy) {
    pendingReply = { text: clean, source: source || 'text' };
    hud.setWaiting(true);
    return;
  }
  const token = playToken;
  session.lastLineKey = '';
  choiceList = [];
  hud.setChoices([]);
  hud.showEnd(false);
  session.busy = true;
  hud.setTyping(true);
  hud.addLog('You', clean, 'you', zh || '');
  const turn = engine.respond(clean, session.context);
  if (turn && typeof turn.then === 'function') turn.then((value) => applyTurn(value, token, source || 'text'));
  else applyTurn(turn, token, source || 'text');
}

hud.onChoice((text, zh) => { submitText(text, 'choice', zh); });
hud.onSend((text) => { submitText(text, 'text'); });
hud.onLeave(() => closeConversation());
hud.onAgain(() => talkAgain());
hud.onHint(() => {
  if (!session || session.ended) return;
  const choices = engine.currentChoices();
  hud.showHints(choices.map((choice) => firstWords(choice.text)));
});
hud.onSave((text, zh) => {
  notebook.add({
    text,
    zh: zh || zhFor(text),
    source: sourceLabel() || 'Chat',
    conversationId: session ? session.conversationId : '',
  });
  hud.toast('Saved to notebook (已保存)');
  refreshNotebook();
});
hud.onPractice((text, zh) => openPractice(text, zh));
hud.onPracticePlay(() => {
  if (practicePhrase) speakLine(practicePhrase.text, 0, { ...voiceOptions(), lane: 'foreground', interrupt: true });
});
hud.onPracticeSubmit((text) => scorePractice(text));
hud.onPracticeClose(() => {
  stopSpeaking();
  practicePhrase = null;
  if (micHeld) {
    speech.stop();
    micHeld = false;
  }
});
hud.onNotebookToggle(() => toggleNotebook());
hud.onNotebookRemove((id) => {
  notebook.remove(id);
  refreshNotebook();
});
hud.onRetry(() => {
  if (!session || session.ended) return;
  if (session.confirming) {
    submitText('Try again', 'retry');
    return;
  }
  hud.setTranscript('');
  if (document.activeElement !== hud.sayEl) hud.sayEl.focus();
  if (hud.ttsEnabled() && session.lastSpoken) {
    speakLine(session.lastSpoken, voiceOf(session.speaker), { ...voiceOptions(), lane: 'foreground', interrupt: true });
  }
});

function skitWantsMic() {
  if (!skit || !skit.active()) return false;
  const state = skit.state();
  return !!state.waiting && (state.phase === 'perform' || state.phase === 'rehearse');
}
function holdMic() {
  const practicing = hud.practiceOpen();
  if ((!practicing && !session && !skitWantsMic()) || !speech.supported || micHeld) return;
  micHeld = true;
  speech.start();
}
function releaseMic() {
  if (!micHeld) return;
  micHeld = false;
  const text = speech.stop();
  if (hud.practiceOpen()) {
    if (text) scorePractice(text);
    return;
  }
  if (skit && skit.active()) {
    const state = skit.state();
    if (state.phase === 'perform' || state.phase === 'rehearse') {
      if (text) skit.skitSay(text, 'voice');
      return;
    }
  }
  if (text) submitText(text, 'voice');
}
function bindHold(button) {
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    holdMic();
  });
  button.addEventListener('pointerup', releaseMic);
  button.addEventListener('pointerleave', releaseMic);
  button.addEventListener('pointercancel', releaseMic);
}
bindHold(hud.micBtn);
bindHold(hud.practiceMicBtn);
document.querySelector('#skit').addEventListener('pointerdown', (event) => {
  if (event.target && event.target.id === 'skit-mic') {
    event.preventDefault();
    holdMic();
  }
});
document.querySelector('#skit').addEventListener('pointerup', releaseMic);
document.querySelector('#skit').addEventListener('pointerleave', releaseMic);
document.querySelector('#skit').addEventListener('pointercancel', releaseMic);

function keyName(event) {
  if (event.code === 'Escape' || event.key === 'Escape') return 'esc';
  if (event.code === 'KeyH' || event.key === 'h' || event.key === 'H' || event.key === '?') return 'help';
  if (event.code === 'KeyN' || event.key === 'n' || event.key === 'N') return 'notebook';
  if (event.code === 'Space' || event.key === ' ') return 'space';
  return '';
}

window.addEventListener('keydown', (event) => {
  if (event.repeat) return;
  const name = keyName(event);
  if (!keyboard.typing() && name === 'notebook') {
    toggleNotebook();
    eatKey = 'notebook';
    event.preventDefault();
    return;
  }
  if (hud.uiLocked()) {
    if (name === 'space' && hud.practiceOpen() && !keyboard.typing()) {
      holdMic();
      event.preventDefault();
      return;
    }
    if (name === 'esc' || (name === 'help' && hud.helpOpen() && !keyboard.typing())) {
      if (hud.helpOpen()) hud.setHelp(false);
      else if (hud.practiceOpen()) hud.closePractice();
      else if (hud.notebookOpen()) hud.setNotebook(false);
      else if (hud.settingsOpen()) hud.setSettingsOpen(false);
      else if (hud.portalsOpen()) hud.setPortals(false);
      else hud.setChooser(false);
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
  if (name === 'space' && !keyboard.typing() && (session || skitWantsMic())) holdMic();
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
    if (hud.tipsOpen()) {
      hud.dismissTips();
      return;
    }
    if (hud.practiceOpen()) {
      hud.closePractice();
      return;
    }
    if (hud.notebookOpen()) {
      hud.setNotebook(false);
      return;
    }
    if (hud.settingsOpen()) {
      hud.setSettingsOpen(false);
      return;
    }
    if (hud.chooserOpen()) {
      practiceMenu = false;
      hud.setChooser(false);
      return;
    }
    if (hud.portalsOpen()) {
      hud.setPortals(false);
      return;
    }
    if (skit && skit.active()) {
      skit.leave();
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

function nearestSpeechGroup() {
  const pos = player.avatar.root.position;
  let best = null;
  let bestDist = 12;
  for (const group of Object.values(groups)) {
    const dist = Math.hypot(group.zone.anchor[0] - pos.x, group.zone.anchor[1] - pos.z);
    if (dist < bestDist) {
      bestDist = dist;
      best = group;
    }
  }
  return best;
}

function activeZoneIds() {
  const here = zoneAt(player.avatar.root.position.x, player.avatar.root.position.z);
  const ids = new Set([here.id]);
  for (const id of here.neighbors || []) ids.add(id);
  return ids;
}

let tickingGroups = [];

function updateAmbient(dt) {
  setAmbientMuted(!!session);
  const ids = activeZoneIds();
  const ticking = [];
  for (const group of Object.values(groups)) {
    const skitOwns = !!(skit && skit.active() && skitGroup === group);
    const inSession = !!(session && session.members && session.members.some((npc) => group.members.includes(npc)));
    const near = ids.has(group.zone.id) || skitOwns || inSession;
    if (!near && !group.parked) {
      group.parked = 'pending';
      group.director.suspend().then(() => {
        if (group.parked === 'pending') group.parked = true;
      });
    }
    if (near || group.parked !== true) {
      if (near && group.parked && !skitOwns) {
        group.director.resume();
        group.parked = false;
      }
      group.director.tick(dt, now);
      ticking.push(group.id);
    }
  }
  tickingGroups = ticking;
  if (session && session.soloDirector) session.soloDirector.tick(dt, now);
  for (let i = asideDirectors.length - 1; i >= 0; i--) {
    const item = asideDirectors[i];
    item.director.tick(dt, now);
    if (item.director.isIdle()) {
      if (item.release) item.release.director.resume();
      asideDirectors.splice(i, 1);
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
      const live = activeZoneIds();
      const options = Object.values(groups).filter((group) => live.has(group.zone.id) && group.director.acceptsVisitors());
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
      if (!visit.group || !visit.group.director.acceptsVisitors()) {
        endVisit(npc, visit, 8 + Math.random() * 6);
        continue;
      }
      visit.timer -= dt;
      const [ax, az] = visit.group.zone.anchor;
      const nearGroup = npc.distanceTo(ax, az) < 4.1;
      if (npc.goalDistance() < 0.45 || (visit.timer <= 0 && nearGroup)) {
        const lines = VISITOR_LINES[npc.def.id] || VISITOR_LINES.rae;
        const raw = lines[Math.floor(Math.random() * lines.length)];
        const text = typeof raw === 'string' ? raw : raw.text;
        const spot = npc.avatar.root.position;
        npc.setGoal(spot.x, spot.z, ax, az);
        npc.face(ax, az);
        npc.react('wave');
        visit.line = { speaker: npc.def.name, text, zh: (raw && raw.zh) || '' };
        visit.phase = 'waitGap';
        visit.timer = 18;
        visit.asked = false;
      } else if (visit.timer <= 0) {
        endVisit(npc, visit, 10 + Math.random() * 8);
      }
    } else if (visit.phase === 'waitGap') {
      if (!visit.group) {
        endVisit(npc, visit, 8);
        continue;
      }
      visit.timer -= dt;
      if (!visit.group.director.acceptsVisitors()) {
        if (visit.timer <= 0) {
          visit.group.director.cancelVisitor(npc.def.name);
          endVisit(npc, visit, 12 + Math.random() * 8);
        }
        continue;
      }
      if (!visit.asked) {
        visit.asked = true;
        const group = visit.group;
        const line = visit.line;
        group.director.requestVisitor(line).then((result) => {
          if (visit.phase !== 'waitGap' || visit.group !== group) return;
          if (!result) {
            visit.asked = false;
            return;
          }
          visit.phase = 'talk';
          visit.timer = 2.4;
        });
      }
      if (visit.timer <= 0 && visit.phase === 'waitGap') {
        visit.group.director.cancelVisitor(npc.def.name);
        endVisit(npc, visit, 16 + Math.random() * 12);
      }
    } else if (visit.phase === 'talk') {
      visit.timer -= dt;
      if (visit.timer <= 0 || !visit.group) {
        endVisit(npc, visit, 16 + Math.random() * 16);
      }
    }
  }
}

let frameMs = 16;

function applyQuality() {
  const quality = hud.getSettings().quality === 'low' ? 'low' : 'high';
  const cap = phoneLike() ? 1.5 : 2;
  const ratio = quality === 'low' ? Math.min(1, cap) : Math.min(window.devicePixelRatio || 1, cap);
  renderer.setPixelRatio(ratio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  const shadows = quality !== 'low';
  renderer.shadowMap.enabled = shadows;
  if (sun) sun.castShadow = shadows;
}

function loop() {
  requestAnimationFrame(loop);
  const raw = Math.min(clock.getDelta(), 0.2);
  frameMs += (raw * 1000 - frameMs) * 0.08;
  const dt = raw * timeScale;
  now += dt;
  const help = hud.uiLocked();
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
    keyboard.consume('KeyG');
    keyboard.consume('KeyT');
    keyboard.consume('Space');
  } else if (!keyboard.typing()) {
    if (keyboard.consume('Digit1')) player.react('wave');
    if (keyboard.consume('Digit2')) player.react('nod');
    if (keyboard.consume('Digit3')) player.react('jump');
  }

  if (!session && !seated && !keyboard.typing()) {
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
  const liveZones = activeZoneIds();
  for (const npc of npcs) {
    const home = zoneAt(npc.avatar.root.position.x, npc.avatar.root.position.z).id;
    const onStage = staged.some((item) => item.npc === npc);
    const locked = session && session.members.includes(npc);
    if (!liveZones.has(home) && !locked && !onStage) continue;
    const others = [{ x: pos.x, z: pos.z, r: player.radius }];
    for (const other of npcs) {
      if (other !== npc) others.push(bodyOf(other));
    }
    npc.update(dt, now, locked, others);
    if (locked && session.mode === 'solo') npc.face(pos.x, pos.z);
    else if (locked && session.center) npc.face(session.center.x, session.center.z);
  }
  updateVisitors(dt);
  updateAmbient(dt);
  syncYourTurn();
  if (session || seated) player.tick(dt);
  ambience.update(dt);
  applyLooks();

  const zone = zoneAt(pos.x, pos.z);
  hud.setZone(zone.name);
  if (zone.island) {
    scene.fog.near = 26;
    scene.fog.far = 80;
  } else {
    scene.fog.near = 18;
    scene.fog.far = 52;
  }
  updateShowBoard();

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
  } else if (seated) {
    const zone = findZone('playhouse');
    const stage = (zone && zone.stage) || { x: 0, z: 33 };
    const behind = Math.max(5.4, dist);
    camDesired.set(
      pos.x + Math.sin(yaw) * behind,
      2.42,
      pos.z + Math.cos(yaw) * behind,
    );
    lookDesired.set(pos.x * 0.16 + stage.x * 0.84, 1.35, pos.z * 0.16 + stage.z * 0.84);
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

  if (!help && !keyboard.typing() && keyboard.consume('KeyT')) togglePortals();

  for (const ring of portalRings) {
    const spin = ring.userData.ring;
    if (spin) spin.rotation.z = now * 0.7;
    const glow = ring.userData.glow;
    if (glow && glow.material) glow.material.opacity = 0.26 + Math.sin(now * 2.4) * 0.12;
  }

  if (!session) {
    if (skit && skit.active()) {
      keyboard.consume('KeyG');
      keyboard.consume('KeyE');
      keyboard.consume('KeyF');
      hud.setPrompt([]);
      hud.setActions({ join: null, talk: null, skit: null });
      hud.setAmbient([]);
    } else {
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
      const spot = nearestSkit(pos.x, pos.z);
      const seat = nearestSeat(pos.x, pos.z);
      const quietRoom = zone.id === 'rehearsal';
      const lines = [];
      if (seat) lines.push('Press E to sit and watch');
      if (group) lines.push('Press E to choose a conversation');
      if (quietRoom) lines.push('Press G to practice a skit');
      else if (spot) lines.push('Press G to watch a skit');
      if (solo) lines.push(`Press F to chat 1-on-1 with ${solo.def.name}`);
      hud.setPrompt(lines);
      hud.setActions({
        join: group ? 'Choose conversation' : null,
        talk: solo ? 'Talk 1-on-1' : null,
        skit: quietRoom ? 'Practice a skit' : (spot ? '🎭 Skit' : null),
      });
      if (group && Math.hypot(group.zone.anchor[0] - pos.x, group.zone.anchor[1] - pos.z) < 15) {
        hud.setAmbient(group.recent.slice(-2));
      } else hud.setAmbient([]);
      if (!help && seat && keyboard.consume('KeyE')) sitDown(seat);
      else if (!help && group && keyboard.consume('KeyE')) openChooser(group);
      if (!help && solo && keyboard.consume('KeyF')) openConversation(solo.def.solo, 'solo', [solo]);
      if (!help && quietRoom && keyboard.consume('KeyG')) openPracticeMenu();
      else if (!help && spot && keyboard.consume('KeyG')) startSkit(spot.id);
      hud.joinBtn.onclick = () => { if (group) openChooser(group); };
      hud.talkBtn.onclick = () => { if (solo) openConversation(solo.def.solo, 'solo', [solo]); };
      hud.skitBtn.onclick = () => {
        if (quietRoom) openPracticeMenu();
        else if (spot) startSkit(spot.id);
      };
    }
  }

  drawMinimap(pos);
  renderer.render(scene, camera);
}

function applyLooks() {
  const owned = new Set();
  for (const group of Object.values(groups)) {
    for (const npc of group.director.gazeOwners()) owned.add(npc);
  }
  if (session && session.soloDirector) {
    for (const npc of session.soloDirector.gazeOwners()) owned.add(npc);
  }
  for (const item of asideDirectors) {
    for (const npc of item.director.gazeOwners()) owned.add(npc);
  }
  for (const npc of npcs) {
    if (!owned.has(npc)) npc.clearLook();
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
  if (session || seated) {
    tag.visible = false;
    return;
  }
  tag.visible = true;
  let near = false;
  const p = player.avatar.root.position;
  for (const npc of npcs) {
    if (npc.distanceTo(p.x, p.z) < 1.7) near = true;
  }
  tag.position.y = near ? 2.78 : 2.32;
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
  if (!hud.getSettings().subtitles) {
    spr.visible = false;
    return;
  }
  if (session && session.members.includes(npc)) {
    spr.visible = false;
    return;
  }
  if (!npc.bubbleLive()) {
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
  if (npc.bubbleKind() === 'back') spr.scale.set(s * 0.72, s * 0.28, 1);
  else spr.scale.set(s * 1.15, s * 0.43, 1);
}

function drawMinimap(pos) {
  const S = 160;
  const far = Math.abs(pos.x) > 24 || Math.abs(pos.z) > 24;
  const span = far ? 36 : 48;
  const originX = far ? pos.x : 0;
  const originZ = far ? pos.z : 0;
  const toX = (x) => ((x - originX) / span + 0.5) * S;
  const toY = (z) => ((z - originZ) / span + 0.5) * S;
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
  mapCtx.fillStyle = '#5c6bc0';
  for (const spot of skitSpots()) {
    mapCtx.beginPath();
    mapCtx.arc(toX(spot.x), toY(spot.z), 3.2, 0, Math.PI * 2);
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

function orderedTalks(zoneId) {
  const list = GROUP_CONVERSATIONS.filter((item) => item.zone === zoneId);
  const pref = hud.getSettings().difficulty;
  if (pref === 'any') return list.map((item) => ({ ...item }));
  const preferred = list.filter((item) => item.level === pref);
  const rest = list.filter((item) => item.level !== pref);
  return [...preferred, ...rest].map((item) => ({ ...item, preferred: item.level === pref }));
}

function nearestSkit(x, z) {
  let best = null;
  let bestDist = 4.4;
  for (const spot of skitSpots()) {
    const dist = Math.hypot(spot.x - x, spot.z - z);
    if (dist < bestDist) {
      bestDist = dist;
      best = spot;
    }
  }
  return best;
}

function startSkit(id) {
  if (session) closeConversation();
  hud.setChooser(false);
  if (hud.practiceOpen()) hud.closePractice();
  return skit.start(id);
}

let practiceMenu = false;

function openPracticeMenu() {
  if (session || (skit && skit.active())) return;
  practiceMenu = true;
  const scenes = SKITS.map((item) => ({
    id: item.id,
    title: item.titleZh ? `${item.title} · ${item.titleZh}` : item.title,
    level: item.level,
    kind: 'skit',
    section: 'Practice a skit (练习小剧场)',
  }));
  hud.showChooser(scenes, 'Just you. Take your time. 只有你，慢慢来。', 'Practice a skit (练习小剧场)');
}

function startPrivate(id, role) {
  if (session) closeConversation();
  practiceMenu = false;
  hud.setChooser(false);
  if (hud.practiceOpen()) hud.closePractice();
  const started = skit.start(id, { private: true });
  if (!started) return false;
  if (role) skit.rehearse(role);
  return true;
}

function openChooser(group) {
  if (!group || session || (skit && skit.active())) return;
  practiceMenu = false;
  const talks = orderedTalks(group.zone.id).map((item) => ({ ...item, section: 'Conversations (对话)' }));
  const scenes = skitsInZone(group.zone.id).map((item) => ({
    id: item.id,
    title: item.title,
    level: item.level,
    kind: 'skit',
    section: 'Skits (小剧场)',
  }));
  const pref = hud.getSettings().difficulty;
  const note = pref === 'any' ? '' : `Your setting lists ${pref} chats first.`;
  hud.showChooser([...talks, ...scenes], note);
}

hud.onTeleport((id) => { teleport(id); });
document.querySelector('#portals-btn').addEventListener('click', () => togglePortals());
document.querySelector('#btn-portals').addEventListener('click', () => togglePortals());

hud.onPick((id) => {
  if (practiceMenu) {
    practiceMenu = false;
    if (skitById(id)) startPrivate(id);
    return;
  }
  if (skitById(id)) startSkit(id);
  else joinConversation(id, true);
});

hud.onSkit((action, extra) => {
  if (!skit) return;
  if (action === 'leave') skit.leave();
  else if (action === 'replay') skit.replay();
  else if (action === 'slow') skit.toggleSlow();
  else if (action === 'words') skit.toggleWords();
  else if (action === 'skip') skit.skipToRoles();
  else if (action === 'perform') skit.pickRole(extra.role);
  else if (action === 'rehearse') skit.rehearse(extra.role);
  else if (action === 'hint') skit.setHint(extra.level);
  else if (action === 'read') skit.tapRead();
  else if (action === 'say') skit.skitSay(extra.text, 'text');
  else if (action === 'skip-line') skit.skipLine();
  else if (action === 'fewer') skit.fewerHints();
});

function tryJoin() {
  if (session) return;
  const pos = player.avatar.root.position;
  const group = nearestGroup(pos.x, pos.z);
  if (group) openChooser(group);
}

function listConversations(zone) {
  const key = String(zone || '').trim().toLowerCase();
  const alias = { class: 'classroom', classroom: 'classroom' }[key] || key;
  const list = GROUP_CONVERSATIONS.filter((item) => !key || item.zone === alias);
  return list.map(({ id, title, level, zone: zoneId }) => ({ id, title, level, zone: zoneId }));
}

function joinConversation(id, nearbyOnly) {
  const key = String(id || '').trim();
  const meta = GROUP_CONVERSATIONS.find((item) => item.id === key);
  if (meta) {
    const groupId = Object.keys(GROUP_ZONE).find((name) => GROUP_ZONE[name] === meta.zone);
    const group = groups[groupId];
    if (!group) return false;
    if (nearbyOnly) {
      const pos = player.avatar.root.position;
      const near = nearestGroup(pos.x, pos.z);
      if (!near || near.id !== group.id) return false;
    } else {
      teleportTo(meta.zone);
    }
    if (session) closeConversation();
    openConversation(meta.id, 'group', group.members);
    return true;
  }
  const npc = npcs.find((item) => item.def.solo === key || item.def.id === key);
  if (!npc || !npc.def.solo) return false;
  if (session) closeConversation();
  const spot = npc.avatar.root.position;
  player.avatar.root.position.set(spot.x + 1.25, 0, spot.z + 0.15);
  openConversation(npc.def.solo, 'solo', [npc]);
  return true;
}

function tryChat() {
  if (session) return;
  const solo = nearestSolo();
  if (solo) openConversation(solo.def.solo, 'solo', [solo]);
}

let fadeChain = Promise.resolve();

function fadeMove(x, z, during) {
  const el = document.querySelector('#fade');
  const run = fadeChain.then(() => new Promise((resolve) => {
    if (el) el.classList.add('on');
    setTimeout(() => {
      player.avatar.root.position.set(x, 0, z);
      if (during) during();
      if (!watchingShow) arriveInZone(zoneAt(x, z), true);
      if (el) el.classList.remove('on');
      setTimeout(resolve, 400);
    }, 400);
  }));
  fadeChain = run.then(() => {}, () => {});
  return run;
}

function spawnOf(zoneOrId) {
  const key = String(zoneOrId || '').trim().toLowerCase();
  if (!key || key === 'plaza' || key === 'center') return { x: 0, z: 0 };
  const zone = findZone(key) || ZONES.find((item) => item.name.toLowerCase() === key);
  if (!zone) return null;
  if (zone.spawn) return { x: zone.spawn[0], z: zone.spawn[1] };
  if (zone.anchor) return { x: zone.anchor[0], z: zone.anchor[1] + 3.5 };
  return null;
}

function togglePortals() {
  if (hud.portalsOpen()) {
    hud.setPortals(false);
    return;
  }
  hud.showPortals(zoneList().map((zone) => ({ id: zone.id, name: zone.name })));
}

async function teleport(zoneId) {
  const dest = spawnOf(zoneId);
  if (!dest) return false;
  hud.setPortals(false);
  if (skit && skit.active()) skit.leave();
  if (session) closeConversation();
  await fadeMove(dest.x, dest.z);
  return true;
}

function teleportTo(zoneOrGroupId) {
  const key = String(zoneOrGroupId || '').trim().toLowerCase();
  if (key === 'plaza' || key === 'center' || findZone(key) || ZONES.some((item) => item.name.toLowerCase() === key)) {
    const dest = spawnOf(key);
    if (dest) {
      player.avatar.root.position.set(dest.x, 0, dest.z);
      arriveInZone(findZone(key) || zoneAt(dest.x, dest.z), true);
      return;
    }
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
      seated: seated ? { x: seated.x, z: seated.z } : null,
      sitting: !!seated,
      yaw,
      facingY: player.avatar.root.rotation.y,
      nearby: nearNames,
      inConversation: !!session,
      conversationId: session ? session.conversationId : null,
      lastNpcLine,
      choices: choiceList.map((choice) => choice.text),
      confirming: !!(session && session.confirming),
      chooserOpen: hud.chooserOpen(),
      practiceOpen: hud.practiceOpen(),
      notebookOpen: hud.notebookOpen(),
      settings: hud.getSettings(),
    };
  },
  notebook: {
    list: () => notebook.list(),
    add: (entry) => notebook.add(entry),
    remove: (id) => {
      const ok = notebook.remove(id);
      refreshNotebook();
      return ok;
    },
  },
  missions: {
    get: () => missions.get(),
  },
  practice: (phraseText) => openPractice(phraseText),
  teleportTo,
  teleport,
  zones() {
    return zoneList().map((zone) => ({
      id: zone.id,
      name: zone.name,
      bounds: zone.minX == null ? null : { minX: zone.minX, maxX: zone.maxX, minZ: zone.minZ, maxZ: zone.maxZ },
      spawn: zone.spawn || (zone.id === 'plaza' ? [0, 0] : null),
      groupId: zone.groupId || null,
      neighbors: zone.neighbors || [],
      skitSpots: zone.skitSpots || [],
    }));
  },
  openTeleport: togglePortals,
  show() {
    const show = showAt(now, SKITS);
    if (!show) return null;
    return {
      id: show.current.id,
      title: show.current.title,
      next: show.next.title,
      nextId: show.next.id,
      nextIn: show.nextIn,
    };
  },
  sit(index) {
    const zone = findZone('playhouse');
    const seats = (zone && zone.seats) || [];
    const seat = seats[Number(index) || 0] || seats[0];
    if (!seat) return false;
    return sitDown(seat);
  },
  debugView() {
    const p = player.avatar.root;
    const tag = player.avatar.tag;
    const cam = camera.position;
    const list = npcs.map((npc) => {
      const r = npc.avatar.root;
      return {
        name: npc.def.name,
        x: +r.position.x.toFixed(3),
        y: +r.position.y.toFixed(3),
        z: +r.position.z.toFixed(3),
        rotY: +r.rotation.y.toFixed(3),
        staged: staged.some((item) => item.npc === npc),
      };
    });
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    const tom = npcs.find((npc) => /Tom/.test(npc.def.name));
    const nose = new THREE.Vector3();
    let tomNose = null;
    if (tom) {
      const head = tom.avatar.head;
      head.getWorldPosition(nose);
      const forward = new THREE.Vector3(0, 0, 0.3).applyQuaternion(tom.avatar.root.getWorldQuaternion(new THREE.Quaternion()));
      tomNose = {
        head: { x: +nose.x.toFixed(3), y: +nose.y.toFixed(3), z: +nose.z.toFixed(3) },
        fwd: { x: +forward.x.toFixed(3), y: +forward.y.toFixed(3), z: +forward.z.toFixed(3) },
      };
    }
    return {
      player: { x: +p.position.x.toFixed(3), y: +p.position.y.toFixed(3), z: +p.position.z.toFixed(3), rotY: +p.rotation.y.toFixed(3), sit: !!seated },
      tag: tag ? { y: +tag.position.y.toFixed(3), visible: tag.visible, sx: +tag.scale.x.toFixed(3) } : null,
      camera: { x: +cam.x.toFixed(3), y: +cam.y.toFixed(3), z: +cam.z.toFixed(3), yaw, dir: { x: +dir.x.toFixed(3), y: +dir.y.toFixed(3), z: +dir.z.toFixed(3) } },
      tomNose,
      staged: list.filter((item) => item.staged),
      nearby: list.filter((item) => Math.hypot(item.x - p.position.x, item.z - p.position.z) < 12),
    };
  },
  join: tryJoin,
  chat: tryChat,
  listConversations,
  joinConversation: (id) => joinConversation(id, false),
  getSettings: () => hud.getSettings(),
  setSettings: (partial) => hud.setSettings(partial),
  say(text) { submitText(String(text || ''), 'text'); },
  choose(index) {
    const choice = choiceList[index];
    if (choice) submitText(choice.text, 'choice', choice.zh || '');
  },
  leave: closeConversation,
  now: () => now,
  perf() {
    return {
      frameMs: Math.round(frameMs * 10) / 10,
      fps: Math.round(1000 / Math.max(1, frameMs)),
      pixelRatio: renderer.getPixelRatio(),
      quality: hud.getSettings().quality,
      activeZones: [...activeZoneIds()],
      ticking: tickingGroups.slice(),
    };
  },
  getTimeScale: () => timeScale,
  setTimeScale(value) {
    const next = Number(value);
    timeScale = Number.isFinite(next) ? Math.min(40, Math.max(0.25, next)) : 1;
    return timeScale;
  },
  getDirector(groupId) {
    const group = groups[groupId];
    if (!group || !group.director) return null;
    const snap = group.director.snapshot();
    return {
      state: snap.state,
      mode: snap.mode,
      speaker: snap.speaker,
      lineId: snap.lineId,
      sceneId: snap.sceneId,
      overlapsDetected: snap.overlapsDetected,
      backchannels: snap.backchannels,
      visitorsPlayed: snap.visitorsPlayed,
    };
  },
  mainBubbleOverlaps() {
    return Object.values(groups).reduce((sum, group) => sum + group.director.overlaps(), 0);
  },
  requestVisitor(groupId, text) {
    const group = groups[groupId];
    if (!group) return Promise.resolve(false);
    const wanderer = npcs.find((npc) => npc.def.wander);
    const speaker = wanderer ? wanderer.def.name : group.members[0].def.name;
    return group.director.requestVisitor({
      speaker,
      text: text || 'Mind if I listen in? I am practicing too.',
      zh: '我可以旁听吗？我也在练习。',
    });
  },
  listSkits() {
    return SKITS.map(({ id, title, titleZh, level, zone }) => ({ id, title, titleZh, level, zone }));
  },
  startSkit: (id) => startSkit(id),
  skipToRoles: () => skit.skipToRoles(),
  skipLine: () => skit.skipLine(),
  castCheck: () => missingCast(new Set(byName.keys())),
  pickRole: (role) => skit.pickRole(role),
  rehearse(skitId, role) {
    if (skitById(skitId)) return startPrivate(skitId, role);
    return skit.rehearse(skitId);
  },
  skitSay: (text) => skit.skitSay(text, 'text'),
  skitState() {
    const state = skit.state();
    return {
      phase: state.phase,
      beat: state.beat,
      role: state.role,
      hintLevel: state.hintLevel,
      linesSaid: state.linesSaid,
      ended: state.ended,
      private: !!state.private,
      suggestFewer: !!state.suggestFewer,
      waiting: state.waiting,
      offerSkip: state.offerSkip,
      feedback: state.feedback,
      lastLine: state.lastLine,
      showWords: state.showWords,
      slow: state.slow,
      heard: state.heard,
    };
  },
  bubbleOf(name) {
    const npc = byName.get(name);
    if (!npc) return null;
    return { text: npc.bubbleText(), kind: npc.bubbleKind(), main: npc.isMainBubble() };
  },
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

Object.defineProperty(window.__sim, 'timeScale', {
  get() { return timeScale; },
  set(value) {
    const next = Number(value);
    timeScale = Number.isFinite(next) ? Math.min(40, Math.max(0.25, next)) : 1;
  },
});

const clock = new THREE.Clock();
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  applyQuality();
});
window.addEventListener('touchstart', () => touch.show(), { once: true, passive: true });
requestAnimationFrame(loop);
