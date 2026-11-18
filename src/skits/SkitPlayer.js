/**
 * Watch, then take a role. Beats go through the group's director
 * (playLines / the floor). This module does not add director modes.
 */

import { normalize } from '../dialogue/match.js';

const LADDER = ['full', 'first', 'keywords', 'blank'];

function delay(ms) {
  return new Promise((resolve) => { setTimeout(resolve, ms); });
}

const COVER_MS = 10000;
const COVER_SKIP_MS = 8000;

function wordsOf(text) {
  return String(text || '').trim().split(/\s+/).filter(Boolean);
}

function hits(text, keywords) {
  const said = normalize(text);
  if (!said) return false;
  const tokens = new Set(said.split(' ').filter(Boolean));
  return (keywords || []).some((word) => {
    const key = normalize(word);
    if (!key) return false;
    if (key.includes(' ')) return said.includes(key);
    return tokens.has(key);
  });
}

function defaultNext(skit, beat) {
  if (!beat) return null;
  if (beat.branch && beat.branch.default) return beat.branch.default;
  if (beat.next) return beat.next;
  const index = skit.beats.findIndex((item) => item.id === beat.id);
  for (let i = index + 1; i < skit.beats.length; i++) {
    if (!skit.beats[i].altPath) return skit.beats[i].id;
  }
  return null;
}

function watchPath(skit) {
  const path = [];
  const seen = new Set();
  let id = skit.beats[0] && skit.beats[0].id;
  while (id && !seen.has(id)) {
    seen.add(id);
    const beat = skit.beats.find((item) => item.id === id);
    if (!beat) break;
    path.push(beat);
    id = defaultNext(skit, beat);
  }
  return path;
}

function nextAfterSay(skit, beat, text) {
  if (beat.branch) {
    for (const opt of beat.branch.options || []) {
      if (hits(text, opt.keywords)) return opt.next;
    }
    if (beat.branch.default) return beat.branch.default;
  }
  return defaultNext(skit, beat);
}

function toLine(skit, beat, nextBeat) {
  const speaker = skit.cast.find((member) => member.role === beat.role);
  let to = null;
  if (nextBeat && nextBeat.role !== beat.role) {
    const other = skit.cast.find((member) => member.role === nextBeat.role);
    to = other ? other.npc : null;
  }
  let emote = '';
  if (beat.cue) {
    if (beat.cue.wave) emote = 'wave';
    else if (beat.cue.nod) emote = 'nod';
    else if (beat.cue.jump) emote = 'jump';
  }
  return {
    id: beat.id,
    speaker: speaker ? speaker.npc : beat.role,
    text: beat.text,
    zh: beat.zh || '',
    to,
    emote,
    gapAfter: beat.gap,
    quick: !!beat.quick,
  };
}

export function createSkitPlayer(opts) {
  let run = 0;
  let skit = null;
  let phase = 'idle';
  let role = '';
  let beatId = null;
  let hintLevel = 0;
  let linesSaid = 0;
  let ended = false;
  let waiting = false;
  let showWords = false;
  let slow = false;
  let feedback = '';
  let subtitle = null;
  let lastLine = '';
  let sayResolve = null;
  let sayQueue = '';
  let skipNow = false;
  let offerSkip = false;
  let rehearseIndex = 0;
  let heard = [];
  let fromTheater = false;
  let floorReady = Promise.resolve();

  function pause(ms) {
    if (opts.wait) return opts.wait(ms);
    return delay(ms);
  }

  function beatById(id) {
    if (!skit) return null;
    return skit.beats.find((item) => item.id === id) || null;
  }

  function playerBeats() {
    if (!skit || !role) return [];
    return watchPath(skit).filter((beat) => beat.role === role);
  }

  function hintFor(beat) {
    const level = LADDER[hintLevel] || 'full';
    if (!beat) return '';
    if (level === 'full') return beat.text;
    if (level === 'first') {
      if (beat.hint) return beat.hint;
      const words = wordsOf(beat.text);
      const cut = words.slice(0, 3).join(' ');
      return words.length > 3 ? `${cut}…` : cut;
    }
    if (level === 'keywords') {
      const keys = (beat.accept || []).slice(0, 3);
      return keys.length ? keys.join(' · ') : '…';
    }
    return '';
  }

  function view() {
    const roles = skit ? skit.cast.filter((member) => member.playerCanTake).map((member) => {
      const count = watchPath(skit).filter((beat) => beat.role === member.role).length;
      return { role: member.role, npc: member.npc, lines: count };
    }) : [];
    return {
      phase,
      id: skit ? skit.id : null,
      title: skit ? skit.title : '',
      titleZh: skit ? skit.titleZh : '',
      beat: beatId,
      role: role || null,
      hintLevel: LADDER[hintLevel] || 'full',
      linesSaid,
      ended,
      waiting,
      showWords,
      slow,
      feedback,
      offerSkip,
      fromTheater,
      heard: heard.slice(),
      subtitle,
      lastLine,
      zh: opts.zhOn ? !!opts.zhOn() : false,
      roles,
      rehearseIndex,
      rehearseTotal: playerBeats().length,
      ladder: LADDER,
    };
  }

  function publish() {
    if (opts.render) opts.render(view());
  }

  function dropSay(value) {
    const resolve = sayResolve;
    sayResolve = null;
    if (resolve) resolve(value);
  }

  function bump() {
    run += 1;
    dropSay(null);
    return run;
  }

  async function playBeats(token, beats) {
    if (!beats.length) return token === run;
    const lines = beats.map((beat, index) => toLine(skit, beat, beats[index + 1]));
    if (fromTheater && phase === 'watch') {
      lines.forEach((line, index) => {
        const who = index % 2 === 0 ? 'Audience Ren' : 'Audience Sol';
        line.back = [{ who, text: 'Ha!', at: 0.7 }];
      });
    }
    await opts.playLines(lines);
    return token === run && phase !== 'idle';
  }

  function openRoles() {
    phase = 'roles';
    waiting = false;
    ended = false;
    offerSkip = false;
    feedback = fromTheater ? 'Want to take a role?' : 'Pick a role, or watch again.';
    publish();
  }

  async function runWatch(token) {
    phase = 'watch';
    ended = false;
    waiting = false;
    feedback = '';
    publish();
    const path = watchPath(skit);
    const ok = await playBeats(token, path);
    if (!ok || token !== run) return;
    if (phase === 'watch') {
      if (fromTheater && opts.onShow) {
        try { opts.onShow(); } catch (err) { /* a finished show still opens roles */ }
      }
      openRoles();
    }
  }

  async function runPerform(token) {
    phase = 'perform';
    ended = false;
    linesSaid = 0;
    heard = [];
    feedback = '';
    waiting = false;
    publish();
    let id = skit.beats[0] && skit.beats[0].id;
    const guard = new Set();
    while (id && token === run) {
      if (guard.has(id)) break;
      const beat = beatById(id);
      if (!beat) break;
      if (beat.role === role) {
        guard.add(id);
        const said = await playerTurn(token, beat);
        if (said == null || token !== run) return;
        id = nextAfterSay(skit, beat, said);
      } else {
        const chunk = [];
        while (id && token === run) {
          const current = beatById(id);
          if (!current || current.role === role) break;
          if (chunk.some((item) => item.id === current.id)) break;
          chunk.push(current);
          guard.add(current.id);
          id = defaultNext(skit, current);
        }
        const ok = await playBeats(token, chunk);
        if (!ok || token !== run) return;
      }
    }
    if (token === run) curtain();
  }

  async function playerTurn(token, beat) {
    beatId = beat.id;
    waiting = true;
    feedback = '';
    subtitle = {
      speaker: 'You',
      text: hintFor(beat),
      zh: beat.zh || '',
      role: beat.role,
    };
    if (opts.yourTurn) opts.yourTurn(true);
    if (opts.armPatience) opts.armPatience();
    offerSkip = false;
    publish();
    watchCover(token, beat);
    const text = await waitForLine(token);
    waiting = false;
    offerSkip = false;
    if (opts.yourTurn) opts.yourTurn(false);
    if (opts.calmPatience) opts.calmPatience();
    if (text == null || token !== run) return null;
    const spoken = wordsOf(text).length > 0;
    if (spoken) {
      linesSaid += 1;
      if (opts.onLine) {
        try { opts.onLine(beat); } catch (err) { /* progress is optional */ }
      }
    }
    feedback = `Nice! Another way to say it: ${beat.text}`;
    subtitle = {
      speaker: 'You',
      text: spoken ? text : beat.text,
      zh: beat.zh || '',
      role: beat.role,
    };
    publish();
    await pause(620);
    if (token !== run) return null;
    return spoken ? text : '';
  }

  function watchCover(token, beat) {
    (async () => {
      await pause(COVER_MS);
      if (token !== run || phase !== 'perform' || !waiting || beatId !== beat.id) return;
      offerSkip = true;
      feedback = `Maybe: ${beat.text}`;
      subtitle = { speaker: 'You', text: beat.text, zh: beat.zh || '', role: beat.role };
      publish();
      if (opts.coverLine) {
        try { opts.coverLine(beat); } catch (err) { /* the skip offer still stands */ }
      }
      await pause(COVER_SKIP_MS);
      if (token !== run || phase !== 'perform' || !waiting || beatId !== beat.id) return;
      dropSay('');
    })();
  }

  function waitForLine(token) {
    if (sayQueue) {
      const text = sayQueue;
      sayQueue = '';
      return Promise.resolve(text);
    }
    return new Promise((resolve) => {
      sayResolve = (text) => {
        if (token !== run) resolve(null);
        else resolve(text);
      };
    });
  }

  async function runRehearse(token) {
    phase = 'rehearse';
    ended = false;
    const lines = playerBeats();
    if (!lines.length) {
      await runPerform(token);
      return;
    }
    for (let i = 0; i < lines.length; i++) {
      if (token !== run) return;
      rehearseIndex = i;
      const beat = lines[i];
      beatId = beat.id;
      skipNow = false;
      waiting = false;
      feedback = 'Listen once. Then say it if you want. Skip is always fine.';
      subtitle = { speaker: beat.role, text: beat.text, zh: beat.zh || '', role: beat.role };
      publish();
      await playBeats(token, [beat]);
      if (token !== run) return;
      if (skipNow) continue;
      waiting = true;
      feedback = 'Your turn to shadow it. Or press Skip.';
      publish();
      const text = await waitForLine(token);
      waiting = false;
      if (text == null || token !== run) return;
      if (text) {
        feedback = 'Nice.';
        publish();
        await pause(280);
      }
    }
    if (token === run) await runPerform(token);
  }

  function curtain() {
    phase = 'curtain';
    ended = true;
    waiting = false;
    const total = playerBeats().length;
    feedback = linesSaid > 0
      ? `You said ${linesSaid} of ${total} lines!`
      : 'You stayed for the whole scene. The lines are yours whenever you want them.';
    if (opts.yourTurn) opts.yourTurn(false);
    if (opts.calmPatience) opts.calmPatience();
    if (opts.savePhrases) opts.savePhrases(skit);
    if (opts.applause) opts.applause(feedback, { theater: fromTheater });
    publish();
  }

  function leave() {
    if (phase === 'idle') return false;
    bump();
    phase = 'idle';
    waiting = false;
    ended = false;
    role = '';
    beatId = null;
    subtitle = null;
    feedback = '';
    sayQueue = '';
    skipNow = false;
    offerSkip = false;
    fromTheater = false;
    if (slow && opts.setSlow) opts.setSlow(false);
    slow = false;
    if (opts.yourTurn) opts.yourTurn(false);
    if (opts.calmPatience) opts.calmPatience();
    if (opts.stopSpeak) opts.stopSpeak();
    if (opts.releaseFloor) opts.releaseFloor();
    if (opts.unmute) opts.unmute();
    publish();
    return true;
  }

  function start(id, options) {
    const next = opts.getSkit(id);
    if (!next) return false;
    if (phase !== 'idle') leave();
    skit = next;
    fromTheater = !!(options && options.theater);
    role = '';
    hintLevel = 0;
    linesSaid = 0;
    ended = false;
    showWords = false;
    slow = false;
    feedback = '';
    subtitle = null;
    lastLine = '';
    beatId = null;
    sayQueue = '';
    rehearseIndex = 0;
    heard = [];
    const token = bump();
    phase = 'watch';
    if (opts.mute) opts.mute();
    publish();
    floorReady = (async () => {
      try {
        if (opts.place) await opts.place(skit);
        if (phase === 'idle') return;
        if (opts.claimFloor) await opts.claimFloor(skit);
        if (token !== run || phase !== 'watch') return;
        await runWatch(token);
      } catch (err) {
        if (token === run && phase !== 'idle') {
          feedback = 'The scene paused. You can leave and try again.';
          publish();
        }
      }
    })();
    return true;
  }

  function skipToRoles() {
    if (!skit || phase === 'idle' || phase === 'curtain') return false;
    bump();
    sayQueue = '';
    if (opts.cancelLines) opts.cancelLines();
    if (opts.stopSpeak) opts.stopSpeak();
    if (opts.yourTurn) opts.yourTurn(false);
    if (opts.calmPatience) opts.calmPatience();
    openRoles();
    return true;
  }

  function pickRole(name) {
    if (!skit || phase === 'idle') return false;
    const key = String(name || '').trim().toLowerCase();
    const member = skit.cast.find((item) => item.playerCanTake && item.role.toLowerCase() === key);
    if (!member) return false;
    role = member.role;
    linesSaid = 0;
    ended = false;
    sayQueue = '';
    const token = bump();
    if (opts.cancelLines) opts.cancelLines();
    if (opts.stopSpeak) opts.stopSpeak();
    floorReady.then(() => {
      if (token !== run || phase === 'idle') return;
      return runPerform(token);
    });
    return true;
  }

  function rehearse(name) {
    if (!skit || phase === 'idle') return false;
    const key = String(name || role || '').trim().toLowerCase();
    const member = skit.cast.find((item) => item.playerCanTake && item.role.toLowerCase() === key);
    if (!member) return false;
    role = member.role;
    linesSaid = 0;
    ended = false;
    sayQueue = '';
    const token = bump();
    if (opts.cancelLines) opts.cancelLines();
    if (opts.stopSpeak) opts.stopSpeak();
    floorReady.then(() => {
      if (token !== run || phase === 'idle') return;
      return runRehearse(token);
    });
    return true;
  }

  function skitSay(text, source) {
    const clean = String(text || '').trim();
    const count = wordsOf(clean).length;
    if (!count) return false;
    if (phase === 'rehearse') {
      if (!waiting) {
        sayQueue = clean;
        return true;
      }
      dropSay(clean);
      return true;
    }
    if (phase !== 'perform') return false;
    if (source === 'voice' && count < 2) {
      feedback = 'A few more words is plenty. Take your time.';
      publish();
      return false;
    }
    if (!waiting) {
      sayQueue = clean;
      return true;
    }
    dropSay(clean);
    return true;
  }

  function skipLine() {
    if (phase === 'watch') return skipToRoles();
    if (phase === 'perform' && waiting && offerSkip) {
      dropSay('');
      return true;
    }
    if (phase !== 'rehearse') return false;
    skipNow = true;
    if (opts.cancelLines) opts.cancelLines();
    if (opts.stopSpeak) opts.stopSpeak();
    if (sayResolve) dropSay('');
    return true;
  }

  function setHint(level) {
    const index = typeof level === 'number' ? level : LADDER.indexOf(String(level || ''));
    if (index < 0 || index >= LADDER.length) return false;
    hintLevel = index;
    if (phase === 'perform' && waiting) {
      const beat = beatById(beatId);
      if (beat) subtitle = { speaker: 'You', text: hintFor(beat), zh: beat.zh || '', role: beat.role };
    }
    publish();
    return true;
  }

  function toggleWords() {
    showWords = !showWords;
    publish();
    return showWords;
  }

  function toggleSlow() {
    slow = !slow;
    if (opts.setSlow) opts.setSlow(slow);
    publish();
    return slow;
  }

  function tapRead() {
    if (phase !== 'perform' || !waiting) return false;
    const beat = beatById(beatId);
    if (!beat) return false;
    if (opts.speak) opts.speak(beat.text, beat.role);
    feedback = 'Here is the line. Say it, or say it your way.';
    publish();
    return true;
  }

  function replay() {
    if (!skit) return false;
    linesSaid = 0;
    ended = false;
    role = '';
    sayQueue = '';
    feedback = '';
    const token = bump();
    if (opts.cancelLines) opts.cancelLines();
    if (opts.stopSpeak) opts.stopSpeak();
    if (opts.yourTurn) opts.yourTurn(false);
    phase = 'watch';
    publish();
    floorReady.then(() => {
      if (token !== run || phase !== 'watch') return;
      return runWatch(token);
    });
    return true;
  }

  function fewerHints() {
    if (!skit || !role) return false;
    hintLevel = Math.min(LADDER.length - 1, hintLevel + 1);
    linesSaid = 0;
    ended = false;
    sayQueue = '';
    offerSkip = false;
    feedback = '';
    const token = bump();
    if (opts.cancelLines) opts.cancelLines();
    if (opts.stopSpeak) opts.stopSpeak();
    runPerform(token);
    return true;
  }

  function onDirectorLine(line, kind) {
    if (!skit || phase === 'idle' || phase === 'roles' || phase === 'curtain') return;
    if (kind === 'nudge' || (line && line.id === 'patience')) {
      feedback = 'Take your time…';
      publish();
      return;
    }
    if (!line || !line.text) return;
    if (kind && kind !== 'dialogue') return;
    if (line.id) heard.push(line.id);
    beatId = line.id || beatId;
    lastLine = line.text;
    if (phase === 'watch' || (phase === 'rehearse' && !waiting) || (phase === 'perform' && !waiting)) {
      subtitle = { speaker: line.speaker || '', text: line.text, zh: line.zh || '' };
      publish();
    }
  }

  return {
    start,
    leave,
    skipToRoles,
    pickRole,
    rehearse,
    skitSay,
    skipLine,
    setHint,
    toggleWords,
    toggleSlow,
    tapRead,
    replay,
    fewerHints,
    onDirectorLine,
    active() { return phase !== 'idle'; },
    state: view,
  };
}
