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

export function englishVoices() {
  if (!window.speechSynthesis || typeof window.speechSynthesis.getVoices !== 'function') return [];
  return window.speechSynthesis.getVoices().filter((voice) => voice.lang && voice.lang.toLowerCase().startsWith('en'));
}

export function speakLine(text, voiceIndex, options = {}) {
  if (!window.speechSynthesis || typeof SpeechSynthesisUtterance !== 'function') return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'en-US';
  utter.pitch = PITCH[(voiceIndex || 0) % PITCH.length];
  const rate = Number(options.rate);
  utter.rate = Number.isFinite(rate) ? Math.min(1.4, Math.max(0.6, rate)) : 0.96;
  const voices = englishVoices();
  const picked = options.voiceURI && voices.find((voice) => voice.voiceURI === options.voiceURI);
  if (picked) utter.voice = picked;
  else if (voices.length) utter.voice = voices[(voiceIndex || 0) % voices.length];
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

export function stopSpeaking() {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
}
