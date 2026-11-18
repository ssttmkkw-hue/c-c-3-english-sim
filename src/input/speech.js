import { estimateLineDuration } from '../dialogue/SceneDirector.js';

/**
 * Push-to-talk wrapper around webkitSpeechRecognition / SpeechRecognition.
 * Unsupported browsers stay quiet and report status "unsupported".
 */
export function createSpeechInput() {
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  const supported = typeof Rec === 'function';
  let rec = null;
  let listening = false;
  let wantListen = false;
  let finalText = '';
  let interim = '';
  let onUpdate = () => {};

  function status() {
    if (!supported) return 'unsupported';
    return listening ? 'listening' : 'idle';
  }

  function emit() {
    onUpdate({ status: status(), interim, finalText });
  }

  function ensure() {
    if (!supported || rec) return;
    try {
      rec = new Rec();
    } catch (err) {
      rec = null;
      return;
    }
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.continuous = true;
    rec.onresult = (event) => {
      let interimBit = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const piece = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText = `${finalText} ${piece}`.trim();
        else interimBit += piece;
      }
      interim = interimBit;
      emit();
    };
    rec.onerror = (event) => {
      if (event.error === 'aborted' || event.error === 'no-speech') return;
      wantListen = false;
      listening = false;
      emit();
    };
    rec.onend = () => {
      listening = false;
      if (wantListen) {
        try {
          rec.start();
          listening = true;
        } catch (err) {
          wantListen = false;
        }
      }
      emit();
    };
  }

  return {
    supported,
    status,
    setHandler(fn) {
      onUpdate = fn;
    },
    start() {
      if (!supported) {
        emit();
        return;
      }
      ensure();
      if (!rec) {
        emit();
        return;
      }
      finalText = '';
      interim = '';
      wantListen = true;
      if (listening) return;
      try {
        rec.start();
        listening = true;
      } catch (err) {
        wantListen = false;
        listening = false;
      }
      emit();
    },
    stop() {
      wantListen = false;
      if (rec && listening) {
        try { rec.stop(); } catch (err) { /* already stopped */ }
      }
      listening = false;
      const text = `${finalText} ${interim}`.trim();
      interim = '';
      emit();
      return text;
    },
  };
}

const PITCH = [0.85, 1.05, 1.15, 0.95, 1.2, 0.9];

const lanes = {
  ambient: { queue: [], active: null },
  foreground: { queue: [], active: null },
};

let ambientMuted = false;
let pumpTimer = 0;

export function englishVoices() {
  if (!window.speechSynthesis || typeof window.speechSynthesis.getVoices !== 'function') return [];
  return window.speechSynthesis.getVoices().filter((voice) => voice.lang && voice.lang.toLowerCase().startsWith('en'));
}

function canSpeak() {
  return !!(window.speechSynthesis && typeof SpeechSynthesisUtterance === 'function');
}

/** A voice list of length 0 cannot play, and Chrome often never fires onend. */
function voicesReady() {
  if (!canSpeak() || typeof window.speechSynthesis.getVoices !== 'function') return false;
  try {
    return window.speechSynthesis.getVoices().length > 0;
  } catch (err) {
    return false;
  }
}

function utteranceCapMs(text) {
  return Math.round(estimateLineDuration(text) * 1.5 * 1000);
}

function dropJob(job) {
  if (!job || job.done) return;
  job.done = true;
  clearTimeout(job.timer);
  if (job.lane && lanes[job.lane].active === job) lanes[job.lane].active = null;
  job.resolve();
}

function dropAmbient() {
  const lane = lanes.ambient;
  const queued = lane.queue.splice(0);
  for (const job of queued) dropJob(job);
  if (lane.active) {
    const job = lane.active;
    lane.active = null;
    dropJob(job);
    try { window.speechSynthesis.cancel(); } catch (err) { /* already quiet */ }
    return true;
  }
  return false;
}

function finishJob(job, cancelSynth) {
  if (!job || job.done) return;
  job.done = true;
  clearTimeout(job.timer);
  const lane = lanes[job.lane];
  const wasActive = lane.active === job;
  if (wasActive) lane.active = null;
  if (cancelSynth && wasActive) {
    try { window.speechSynthesis.cancel(); } catch (err) { /* already quiet */ }
  }
  job.resolve();
  if (cancelSynth && wasActive) {
    clearTimeout(pumpTimer);
    pumpTimer = setTimeout(pump, 40);
  } else {
    pump();
  }
}

function startJob(job) {
  const lane = lanes[job.lane];
  if (!canSpeak() || !voicesReady()) {
    finishJob(job, false);
    return;
  }
  const utter = new SpeechSynthesisUtterance(job.text);
  utter.lang = 'en-US';
  utter.pitch = PITCH[(job.voiceIndex || 0) % PITCH.length];
  const rate = Number(job.options.rate);
  utter.rate = Number.isFinite(rate) ? Math.min(1.4, Math.max(0.6, rate)) : 0.96;
  const voices = englishVoices();
  const picked = job.options.voiceURI && voices.find((voice) => voice.voiceURI === job.options.voiceURI);
  if (picked) utter.voice = picked;
  else if (voices.length) utter.voice = voices[(job.voiceIndex || 0) % voices.length];
  lane.active = job;
  job.timer = setTimeout(() => finishJob(job, true), utteranceCapMs(job.text));
  utter.onend = () => finishJob(job, false);
  utter.onerror = () => finishJob(job, false);
  try {
    if (window.speechSynthesis.paused && typeof window.speechSynthesis.resume === 'function') {
      window.speechSynthesis.resume();
    }
    window.speechSynthesis.speak(utter);
  } catch (err) {
    finishJob(job, false);
  }
}

function pump() {
  if (!lanes.foreground.active && lanes.foreground.queue.length) {
    const cancelled = dropAmbient();
    const job = lanes.foreground.queue.shift();
    if (cancelled) {
      clearTimeout(pumpTimer);
      pumpTimer = setTimeout(() => startJob(job), 40);
    } else {
      startJob(job);
    }
    return;
  }
  if (lanes.foreground.active || lanes.foreground.queue.length || ambientMuted) return;
  if (!lanes.ambient.active && lanes.ambient.queue.length) startJob(lanes.ambient.queue.shift());
}

/**
 * Speak one line. Resolves on utterance onend (or when speech is unavailable).
 * Ambient lines queue and never cancel each other.
 * Foreground lines (the player's conversation, practice, retry) take priority:
 * they clear queued ambient speech. Pass interrupt to replace the current foreground line.
 */
export function speakLine(text, voiceIndex, options = {}) {
  const laneName = options.lane === 'ambient' ? 'ambient' : 'foreground';
  return new Promise((resolve) => {
    const clean = String(text || '').trim();
    if (!clean || !canSpeak() || !voicesReady()) {
      resolve();
      return;
    }
    if (laneName === 'ambient' && (ambientMuted || lanes.foreground.active || lanes.foreground.queue.length)) {
      resolve();
      return;
    }
    const job = {
      text: clean,
      voiceIndex,
      options,
      resolve,
      lane: laneName,
      done: false,
      timer: 0,
    };
    const replaceCurrent = laneName === 'foreground' && options.interrupt && lanes.foreground.active;
    if (replaceCurrent) finishJob(lanes.foreground.active, true);
    lanes[laneName].queue.push(job);
    if (!replaceCurrent) pump();
  });
}

/** While muted, ambient lines are not spoken. Foreground lines still play. */
export function setAmbientMuted(muted) {
  const next = !!muted;
  if (next === ambientMuted) return;
  ambientMuted = next;
  if (ambientMuted) dropAmbient();
}

export function stopSpeaking() {
  const pending = [
    ...lanes.ambient.queue.splice(0),
    ...lanes.foreground.queue.splice(0),
  ];
  if (lanes.ambient.active) pending.push(lanes.ambient.active);
  if (lanes.foreground.active) pending.push(lanes.foreground.active);
  lanes.ambient.active = null;
  lanes.foreground.active = null;
  for (const job of pending) dropJob(job);
  clearTimeout(pumpTimer);
  if (window.speechSynthesis) {
    try { window.speechSynthesis.cancel(); } catch (err) { /* already quiet */ }
  }
}
