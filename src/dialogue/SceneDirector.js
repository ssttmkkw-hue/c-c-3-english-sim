/**
 * Per-group turn-taking. One floor holder at a time.
 * gap → leadIn → speaking → tail → gap.
 * Backchannels are the only overlap. Main bubbles fade; they do not stack.
 */

const LEAD_IN = 0.3;
const TAIL = 0.2;
const BACK_COOLDOWN = 8;
const BACK_EARLIEST = 0.8;

export function estimateLineDuration(text) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1.4, words / 2.6);
}

function wordCount(text) {
  return String(text || '').trim().split(/\s+/).filter(Boolean).length;
}

function isQuestion(text) {
  return /\?\s*$/.test(String(text || '').trim());
}

function isQuick(line) {
  if (!line) return false;
  if (line.quick) return true;
  const words = wordCount(line.text);
  return words > 0 && words <= 4 && !isQuestion(line.text);
}

export function createSceneDirector(options) {
  const getScenes = options.getScenes || (() => []);
  const getMembers = options.getMembers || (() => []);
  const npcByName = options.npcByName || (() => null);
  const anchor = options.anchor || (() => ({ x: 0, z: 0 }));
  const playerPos = options.playerPos || (() => null);
  const onLine = options.onLine || (() => {});
  const onSpeak = options.onSpeak || (() => null);
  const random = options.random || Math.random;
  const ambientEnabled = options.ambient !== false;
  const patienceText = (options.patienceLine && options.patienceLine.text) || 'Take your time.';
  const patienceZh = (options.patienceLine && options.patienceLine.zh) || '';

  let mode = ambientEnabled ? 'ambient' : 'idle';
  let state = 'gap';
  let stateUntil = 0;
  let booted = false;
  let hurry = false;
  let lastNow = 0;
  let sceneIndex = 0;
  let lineIndex = 0;
  let playedInScene = false;
  let parkedScene = null;
  let sceneId = null;
  let lineId = null;
  let speaker = null;
  let currentLine = null;
  let currentKind = '';
  let speakerNpc = null;
  let lineStart = 0;
  let minDur = 1.4;
  let watchdog = 2.6;
  let ttsDone = true;
  let speakToken = 0;
  let overlapsDetected = 0;
  let backchannels = 0;
  let lastBackAt = -999;
  let backFired = false;
  let glance = null;
  let nods = [];
  let liveMains = [];
  let dialogueQueue = [];
  let dialogueResolve = null;
  let pendingWelcome = null;
  let welcomeResolve = null;
  let farewellLine = null;
  let insertQueue = [];
  let visitorResolve = null;
  let patience = false;
  let suspendResolve = null;
  let heldSince = 0;
  let nudged = false;
  let noddedWait = false;
  let visitorsPlayed = 0;

  function scenes() {
    const list = getScenes() || [];
    return Array.isArray(list) ? list : [];
  }

  function staffName() {
    const members = getMembers();
    const staff = members.find((npc) => npc.def && npc.def.kind === 'npc') || members[0];
    return staff ? staff.def.name : '';
  }

  function drawGap(line, next) {
    if (line && Array.isArray(line.gapAfter) && line.gapAfter.length >= 2) {
      const a = Number(line.gapAfter[0]);
      const b = Number(line.gapAfter[1]);
      const lo = Number.isFinite(a) ? a : 0.5;
      const hi = Number.isFinite(b) ? b : lo;
      return lo + random() * Math.max(0, hi - lo);
    }
    if (isQuick(next)) return 0.2 + random() * 0.2;
    if (line && isQuestion(line.text)) return 1.5 + random() * 1.0;
    return 0.5 + random() * 0.7;
  }

  function notePark() {
    if (parkedScene != null) return;
    const list = scenes();
    const n = list.length || 1;
    parkedScene = playedInScene ? (sceneIndex + 1) % n : sceneIndex % n;
  }

  function peekAmbient() {
    const list = scenes();
    if (!list.length) return null;
    let si = sceneIndex % list.length;
    let li = lineIndex;
    let scene = list[si];
    if (!scene || li >= (scene.lines || []).length) {
      scene = list[(si + 1) % list.length];
      li = 0;
    }
    return scene && scene.lines ? scene.lines[li] : null;
  }

  function takeAmbient() {
    const list = scenes();
    if (!list.length) return null;
    if (sceneIndex >= list.length) sceneIndex = 0;
    let scene = list[sceneIndex];
    const lines = (scene && scene.lines) || [];
    if (lineIndex >= lines.length) {
      sceneIndex = (sceneIndex + 1) % list.length;
      lineIndex = 0;
      playedInScene = false;
      scene = list[sceneIndex];
    }
    const line = scene && scene.lines ? scene.lines[lineIndex] : null;
    if (!line) return null;
    lineIndex += 1;
    playedInScene = true;
    sceneId = scene.id || null;
    return line;
  }

  function endOfScene() {
    const list = scenes();
    const scene = list[sceneIndex % (list.length || 1)];
    if (!scene || !scene.lines) return false;
    return lineIndex >= scene.lines.length;
  }

  function trackMain(npc) {
    for (const other of liveMains) {
      if (other !== npc && other.isMainBubble()) other.fadeBubble(0.4);
    }
    liveMains = liveMains.filter((item) => item === npc || item.isMainBubble());
    if (!liveMains.includes(npc)) liveMains.push(npc);
  }

  function sampleOverlap() {
    liveMains = liveMains.filter((npc) => npc.isMainBubble());
    if (liveMains.length >= 2) overlapsDetected += 1;
  }

  function lookTarget(line, kind) {
    if (line && line.to && line.to !== 'player') {
      const npc = npcByName(line.to);
      if (npc) return npc.avatar.root.position;
    }
    const towardPlayer = !line || line.to === 'player' || kind === 'welcome' || kind === 'farewell' || kind === 'nudge' || kind === 'dialogue';
    if (towardPlayer) {
      const pos = playerPos();
      if (pos) return pos;
    }
    return anchor();
  }

  function planGaze(now) {
    const speakerRef = npcByName(currentLine.speaker);
    const dest = lookTarget(currentLine, currentKind);
    glance = null;
    if (speakerRef && dest) speakerRef.lookAt(dest.x, dest.z);
    const members = getMembers().filter((npc) => npc !== speakerRef);
    for (const npc of members) {
      if (!speakerRef) continue;
      const sp = speakerRef.avatar.root.position;
      if (random() < 0.15) {
        const others = members.filter((item) => item !== npc);
        if (others.length && random() < 0.5) {
          const other = others[Math.floor(random() * others.length)];
          const p = other.avatar.root.position;
          npc.lookAt(p.x, p.z);
        } else {
          npc.lookAt(sp.x + 1.6, sp.z - 1.1);
        }
        glance = { npc, until: now + 0.6, x: sp.x, z: sp.z };
      } else {
        npc.lookAt(sp.x, sp.z);
      }
    }
    if (currentKind === 'welcome' || currentKind === 'farewell') {
      const pos = playerPos();
      if (pos) {
        for (const npc of getMembers()) npc.face(pos.x, pos.z);
      }
    }
  }

  function maintainGaze(now) {
    if (state === 'held') {
      const pos = playerPos();
      if (!pos) return;
      for (const npc of getMembers()) npc.lookAt(pos.x, pos.z);
      return;
    }
    if (!currentLine || (state !== 'leadIn' && state !== 'speaking' && state !== 'tail')) return;
    const speakerRef = npcByName(currentLine.speaker);
    const dest = lookTarget(currentLine, currentKind);
    if (speakerRef && dest) speakerRef.lookAt(dest.x, dest.z);
    if (glance && now >= glance.until) {
      glance.npc.lookAt(glance.x, glance.z);
      glance = null;
    }
    const sp = speakerRef && speakerRef.avatar.root.position;
    if (!sp) return;
    for (const npc of getMembers()) {
      if (npc === speakerRef) continue;
      if (glance && glance.npc === npc) continue;
      npc.lookAt(sp.x, sp.z);
    }
  }

  function planNods(line) {
    if (line.react && line.react.length) {
      return line.react.map((item) => ({
        who: item.who,
        kind: item.kind || 'nod',
        at: (item.at == null || item.at <= 1.25) ? (item.at == null ? 0.6 : item.at) * minDur : item.at,
        done: false,
      }));
    }
    const listeners = getMembers().filter((npc) => npc.def.name !== line.speaker);
    if (!listeners.length) return [];
    const npc = listeners[Math.floor(random() * listeners.length)];
    return [{ who: npc.def.name, kind: 'nod', at: minDur * 0.6, done: false }];
  }

  function fireBack(item, now) {
    if (!item || item.who === currentLine.speaker) return;
    if (now - lastBackAt < BACK_COOLDOWN) return;
    const npc = npcByName(item.who);
    if (!npc || npc.isMainBubble()) return;
    const text = String(item.text || '').trim().split(/\s+/).slice(0, 2).join(' ');
    if (!text) return;
    npc.say(text, now, 1.35, 'back');
    lastBackAt = now;
    backFired = true;
    backchannels += 1;
  }

  function serviceSpeaking(now) {
    const elapsed = now - lineStart;
    for (const nod of nods) {
      if (nod.done || elapsed < nod.at) continue;
      nod.done = true;
      const npc = npcByName(nod.who);
      if (npc) npc.react(nod.kind || 'nod');
    }
    if (!backFired && elapsed >= BACK_EARLIEST && now - lastBackAt >= BACK_COOLDOWN) {
      for (const item of currentLine.back || []) {
        const frac = typeof item.at === 'number' ? item.at : 0.55;
        const when = frac <= 1.25 ? Math.max(BACK_EARLIEST, frac * minDur) : frac;
        if (elapsed >= when) {
          fireBack(item, now);
          break;
        }
      }
    }
    if (elapsed >= watchdog || (elapsed >= minDur && ttsDone)) enterTail(now);
  }

  function serviceHeld(now) {
    if (!patience) return;
    const members = getMembers();
    if (!noddedWait && now - heldSince >= 6 && members.length) {
      noddedWait = true;
      const npc = members[Math.floor(random() * members.length)];
      if (npc) npc.react('nod');
    }
    if (!nudged && now - heldSince >= 8) {
      nudged = true;
      const who = staffName();
      if (!who) return;
      startLeadIn({
        id: 'patience',
        speaker: who,
        text: patienceText,
        zh: patienceZh,
        to: 'player',
      }, 'nudge');
    }
  }

  function startLeadIn(line, kind) {
    const npc = npcByName(line.speaker);
    if (!npc) return false;
    currentLine = line;
    currentKind = kind;
    speaker = line.speaker || null;
    lineId = line.id || null;
    speakerNpc = npc;
    state = 'leadIn';
    stateUntil = lastNow + LEAD_IN;
    backFired = false;
    planGaze(lastNow);
    return true;
  }

  function beginSpeaking(now) {
    const text = currentLine.text;
    minDur = estimateLineDuration(text);
    watchdog = minDur * 1.8;
    lineStart = now;
    state = 'speaking';
    nods = planNods(currentLine);
    for (const npc of getMembers()) {
      if (npc !== speakerNpc && npc.isMainBubble()) npc.fadeBubble(0.4);
    }
    trackMain(speakerNpc);
    speakerNpc.say(text, now, watchdog + 8, 'main');
    sampleOverlap();
    ttsDone = true;
    const pending = onSpeak(currentLine, currentKind);
    if (pending && typeof pending.then === 'function') {
      ttsDone = false;
      const token = ++speakToken;
      pending.then(() => {
        if (token === speakToken) ttsDone = true;
      });
    }
    if (currentLine.emote && speakerNpc.react) speakerNpc.react(currentLine.emote);
    onLine(currentLine, currentKind);
  }

  function enterTail(now) {
    state = 'tail';
    stateUntil = now + TAIL;
    if (speakerNpc) speakerNpc.dimBubble();
  }

  function releaseDialogue() {
    const resolve = dialogueResolve;
    dialogueResolve = null;
    if (resolve) resolve();
  }

  function enterHeld(now, fresh) {
    state = 'held';
    speaker = null;
    lineId = null;
    currentKind = 'held';
    if (fresh) {
      heldSince = now;
      nudged = false;
      noddedWait = false;
      patience = true;
    }
  }

  function finishFarewell(now) {
    currentKind = '';
    currentLine = null;
    speaker = null;
    lineId = null;
    if (ambientEnabled) {
      const list = scenes();
      const n = list.length || 1;
      const parked = parkedScene == null ? sceneIndex : parkedScene;
      sceneIndex = ((parked % n) + n) % n;
      lineIndex = 0;
      playedInScene = false;
      parkedScene = null;
      sceneId = list[sceneIndex] ? list[sceneIndex].id : null;
      mode = 'ambient';
      state = 'gap';
      stateUntil = now + 0.45 + random() * 0.35;
    } else {
      mode = 'idle';
      state = 'gap';
      stateUntil = now + 9999;
    }
  }

  function onTail(now) {
    const finishedKind = currentKind;
    const finishedLine = currentLine;
    if (speakerNpc) speakerNpc.dimBubble();
    state = 'gap';
    hurry = false;
    if (farewellLine && finishedKind !== 'farewell') {
      hurry = true;
      stateUntil = now;
      return;
    }
    if (finishedKind === 'welcome') {
      mode = 'dialogue';
      stateUntil = now + 0.28;
      const resolve = welcomeResolve;
      welcomeResolve = null;
      if (resolve) resolve();
      return;
    }
    if (mode === 'aside') {
      if (finishedKind === 'visitor' && visitorResolve) {
        const resolve = visitorResolve;
        visitorResolve = null;
        resolve(true);
      }
      stateUntil = now + 99999;
      if (suspendResolve) {
        const resolve = suspendResolve;
        suspendResolve = null;
        resolve();
      }
      return;
    }
    if (finishedKind === 'farewell') {
      if (pendingWelcome || mode === 'join') {
        hurry = true;
        stateUntil = now;
        return;
      }
      finishFarewell(now);
      return;
    }
    if (finishedKind === 'visitor' && visitorResolve) {
      const resolve = visitorResolve;
      visitorResolve = null;
      visitorsPlayed += 1;
      resolve(true);
    }
    if (mode === 'dialogue' && dialogueQueue.length) {
      stateUntil = now + Math.min(0.85, drawGap(finishedLine, dialogueQueue[0]));
      return;
    }
    if (mode === 'dialogue' && finishedKind === 'dialogue') {
      enterHeld(now, true);
      releaseDialogue();
      return;
    }
    if (mode === 'dialogue' && finishedKind === 'nudge') {
      enterHeld(now, false);
      return;
    }
    if (mode === 'join') {
      hurry = true;
      stateUntil = now;
      return;
    }
    if (mode === 'idle') {
      stateUntil = now + 9999;
      return;
    }
    let gap = drawGap(finishedLine, insertQueue.length ? insertQueue[0].line : peekAmbient());
    if (finishedKind === 'ambient' && endOfScene()) gap = Math.max(gap, 1.15 + random() * 0.65);
    stateUntil = now + gap;
  }

  function onGap(now) {
    if (farewellLine && mode !== 'join') {
      const line = farewellLine;
      farewellLine = null;
      mode = 'farewell';
      if (!startLeadIn(line, 'farewell')) finishFarewell(now);
      return;
    }
    if (pendingWelcome) {
      const item = pendingWelcome;
      pendingWelcome = null;
      mode = 'join';
      if (!startLeadIn(item.line, 'welcome')) {
        mode = 'dialogue';
        item.resolve();
        return;
      }
      welcomeResolve = item.resolve;
      return;
    }
    if (mode === 'dialogue' && dialogueQueue.length) {
      const line = dialogueQueue.shift();
      if (!startLeadIn(line, 'dialogue')) hurry = true;
      return;
    }
    if (mode === 'dialogue') {
      enterHeld(now, false);
      releaseDialogue();
      return;
    }
    if (mode === 'idle') {
      stateUntil = now + 9999;
      return;
    }
    if (mode !== 'ambient') {
      stateUntil = now + 0.25;
      return;
    }
    if (insertQueue.length) {
      const item = insertQueue.shift();
      if (!startLeadIn({ ...item.line, to: item.line.to || null }, 'visitor')) {
        item.resolve(false);
        hurry = true;
        return;
      }
      visitorResolve = (played) => item.resolve(played);
      return;
    }
    const line = takeAmbient();
    if (!line || !startLeadIn(line, 'ambient')) {
      stateUntil = now + 0.8;
    }
  }

  function flushWaiters() {
    if (welcomeResolve) {
      const resolve = welcomeResolve;
      welcomeResolve = null;
      resolve();
    }
    if (pendingWelcome) {
      const resolve = pendingWelcome.resolve;
      pendingWelcome = null;
      resolve();
    }
    dialogueQueue = [];
    releaseDialogue();
  }

  function tick(dt, now) {
    lastNow = now;
    if (!booted) {
      booted = true;
      if (mode === 'ambient' && state === 'gap' && !hurry && !pendingWelcome) {
        stateUntil = now + 0.45 + random() * 0.55;
      }
    }
    maintainGaze(now);
    if (state === 'speaking') serviceSpeaking(now);
    if (state === 'held') serviceHeld(now);
    if (state === 'held' && (hurry || farewellLine || pendingWelcome)) {
      state = 'gap';
      stateUntil = now;
      hurry = true;
    }
    if (state === 'gap' && (hurry || now >= stateUntil)) {
      hurry = false;
      onGap(now);
    } else if (state === 'leadIn' && now >= stateUntil) {
      beginSpeaking(now);
    } else if (state === 'tail' && now >= stateUntil) {
      onTail(now);
    }
    sampleOverlap();
  }

  function requestJoin(text, zh) {
    return new Promise((resolve) => {
      notePark();
      if (currentKind !== 'farewell') farewellLine = null;
      mode = 'join';
      patience = false;
      dialogueQueue = [];
      releaseDialogue();
      pendingWelcome = {
        resolve,
        line: {
          id: 'welcome',
          speaker: staffName(),
          text: text || 'Oh, hi! Join us.',
          zh: zh || '',
          to: 'player',
        },
      };
      if (!pendingWelcome.line.speaker) {
        pendingWelcome = null;
        resolve();
        return;
      }
      if (state === 'gap' || state === 'held') hurry = true;
    });
  }

  function requestFarewell(text, zh) {
    farewellLine = {
      id: 'farewell',
      speaker: staffName(),
      text: text || 'Nice talking with you. See you around.',
      zh: zh || '',
      to: 'player',
    };
    if (!farewellLine.speaker) {
      farewellLine = null;
      flushWaiters();
      finishFarewell(lastNow);
      return;
    }
    mode = 'farewell';
    patience = false;
    flushWaiters();
    if (state === 'gap' || state === 'held') hurry = true;
  }

  function playLines(lines) {
    const mapped = (lines || []).filter((line) => line && line.text).map((line, index) => ({
      id: line.id || `turn-${index}`,
      speaker: line.speaker,
      text: line.text,
      zh: line.zh || '',
      to: line.to || 'player',
      emote: line.emote || '',
      react: line.react,
      back: line.back,
      gapAfter: line.gapAfter,
      quick: line.quick,
    }));
    dialogueQueue.push(...mapped);
    if (mode !== 'join' && mode !== 'farewell') mode = 'dialogue';
    patience = false;
    return new Promise((resolve) => {
      const prev = dialogueResolve;
      dialogueResolve = () => {
        if (prev) prev();
        resolve();
      };
      if (!mapped.length) {
        if (state === 'gap' || state === 'held') enterHeld(lastNow, true);
        releaseDialogue();
        return;
      }
      if ((state === 'gap' || state === 'held') && mode === 'dialogue') hurry = true;
    });
  }

  function holdForPlayer() {
    if (mode !== 'join' && mode !== 'farewell') mode = 'dialogue';
    if (state === 'gap' || state === 'held' || state === 'tail') enterHeld(lastNow, true);
  }

  function setPatience(on) {
    patience = !!on;
    if (patience) {
      heldSince = lastNow;
      nudged = false;
      noddedWait = false;
    }
  }

  function requestVisitor(line) {
    if (mode !== 'ambient' || !line || !line.text) return Promise.resolve(false);
    const waitedForGap = state !== 'gap';
    return new Promise((resolve) => {
      insertQueue.push({
        line: {
          id: line.id || 'visitor',
          speaker: line.speaker,
          text: line.text,
          zh: line.zh || '',
          to: line.to || null,
        },
        resolve: (played) => {
          if (!played) resolve(false);
          else resolve({ played: true, waitedForGap });
        },
      });
    });
  }

  function suspend() {
    notePark();
    mode = 'aside';
    patience = false;
    return new Promise((resolve) => {
      if (state === 'gap' || state === 'held') {
        stateUntil = Math.max(stateUntil, lastNow + 99999);
        resolve();
        return;
      }
      suspendResolve = resolve;
    });
  }

  function resume() {
    if (mode !== 'aside') return;
    if (suspendResolve) {
      const resolve = suspendResolve;
      suspendResolve = null;
      resolve();
    }
    finishFarewell(lastNow);
  }

  function cancelVisitor(name) {
    insertQueue = insertQueue.filter((item) => {
      if (item.line.speaker !== name) return true;
      item.resolve(false);
      return false;
    });
  }

  function snapshot() {
    return {
      state,
      speaker: state === 'held' ? null : speaker,
      lineId: state === 'held' ? null : lineId,
      sceneId,
      overlapsDetected,
      backchannels,
      visitorsPlayed,
    };
  }

  function gazeOwners() {
    const list = getMembers().slice();
    if (speakerNpc && !list.includes(speakerNpc)) list.push(speakerNpc);
    if (glance && glance.npc && !list.includes(glance.npc)) list.push(glance.npc);
    return list;
  }

  return {
    tick,
    snapshot,
    requestJoin,
    requestFarewell,
    playLines,
    holdForPlayer,
    setPatience,
    requestVisitor,
    cancelVisitor,
    suspend,
    resume,
    acceptsVisitors() {
      return mode === 'ambient' && !pendingWelcome && !farewellLine;
    },
    gazeOwners,
    isIdle() {
      return mode === 'idle' && !farewellLine && state !== 'speaking' && state !== 'leadIn' && state !== 'tail';
    },
    overlaps() {
      return overlapsDetected;
    },
  };
}
