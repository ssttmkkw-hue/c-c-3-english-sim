export function createHUD() {
  const zoneEl = document.querySelector('#zone-name');
  const promptEl = document.querySelector('#prompt');
  const logEl = document.querySelector('#chat-log');
  const choicesEl = document.querySelector('#choices');
  const chatEl = document.querySelector('#chat');
  const ambientEl = document.querySelector('#ambient');
  const micEl = document.querySelector('#mic-state');
  const sayEl = document.querySelector('#say');
  const leaveEl = document.querySelector('#leave');
  const ttsEl = document.querySelector('#tts');
  const joinBtn = document.querySelector('#btn-join');
  const talkBtn = document.querySelector('#btn-talk');
  const micBtn = document.querySelector('#mic-btn');
  const transcriptEl = document.querySelector('#transcript');
  const typingEl = document.querySelector('#typing');
  const waitEl = document.querySelector('#wait-hint');
  const endBox = document.querySelector('#end-box');
  const statsEl = document.querySelector('#stats');
  const helpEl = document.querySelector('#help');
  const helpBtn = document.querySelector('#help-btn');
  const helpClose = document.querySelector('#help-close');
  const talkAgainBtn = document.querySelector('#talk-again');
  const leaveEndBtn = document.querySelector('#leave-end');
  const settingsBtn = document.querySelector('#settings-btn');
  const settingsEl = document.querySelector('#settings');
  const settingsClose = document.querySelector('#settings-close');
  const setTts = document.querySelector('#set-tts');
  const setVoice = document.querySelector('#set-voice');
  const setRate = document.querySelector('#set-rate');
  const setRateVal = document.querySelector('#set-rate-val');
  const setSubs = document.querySelector('#set-subs');
  const setZh = document.querySelector('#set-zh');
  const setLevel = document.querySelector('#set-level');
  const chooserEl = document.querySelector('#chooser');
  const chooserList = document.querySelector('#chooser-list');
  const chooserNote = document.querySelector('#chooser-note');
  const chooserCancel = document.querySelector('#chooser-cancel');
  const hintBtn = document.querySelector('#hint-btn');
  const retryBtn = document.querySelector('#retry-btn');
  const hintsEl = document.querySelector('#hints');

  const MIC_TITLE = 'Speech recognition needs Chrome or Edge, and the page must be on localhost or https. Firefox and insecure http pages do not expose the mic API.';

  let onChoice = () => {};
  let onSend = () => {};
  let onLeave = () => {};
  let onAgain = () => {};
  let onPick = () => {};
  let onHint = () => {};
  let onRetry = () => {};
  let onSettingsChange = () => {};
  const HELP_KEY = 'plaza-english-help-v1';
  const SETTINGS_KEY = 'plaza-english-settings';
  const LEVELS = new Set(['any', 'beginner', 'intermediate']);

  function sanitizeSettings(raw) {
    const source = raw && typeof raw === 'object' ? raw : {};
    const rate = Number(source.rate);
    return {
      tts: !!source.tts,
      voiceURI: typeof source.voiceURI === 'string' ? source.voiceURI : '',
      rate: Number.isFinite(rate) ? Math.min(1.4, Math.max(0.6, Math.round(rate * 20) / 20)) : 0.96,
      subtitles: source.subtitles !== false,
      zh: !!source.zh,
      difficulty: LEVELS.has(source.difficulty) ? source.difficulty : 'any',
    };
  }

  function loadSettings() {
    try {
      return sanitizeSettings(JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'));
    } catch (err) {
      return sanitizeSettings({});
    }
  }

  let settings = loadSettings();

  function paintSettings() {
    setTts.checked = settings.tts;
    ttsEl.checked = settings.tts;
    setSubs.checked = settings.subtitles;
    setZh.checked = settings.zh;
    setLevel.value = settings.difficulty;
    setRate.value = String(settings.rate);
    setRateVal.textContent = settings.rate.toFixed(2);
    document.body.classList.toggle('show-zh', settings.zh);
    fillVoices();
  }

  function saveSettings() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (err) { /* private mode */ }
  }

  function setSettings(partial) {
    settings = sanitizeSettings({ ...settings, ...(partial || {}) });
    saveSettings();
    paintSettings();
    onSettingsChange(getSettings());
    return getSettings();
  }

  function getSettings() {
    return { ...settings };
  }

  function fillVoices() {
    const synth = window.speechSynthesis;
    const voices = synth && typeof synth.getVoices === 'function'
      ? synth.getVoices().filter((voice) => voice.lang && voice.lang.toLowerCase().startsWith('en'))
      : [];
    const current = settings.voiceURI;
    setVoice.innerHTML = '';
    const fallback = document.createElement('option');
    fallback.value = '';
    fallback.textContent = voices.length ? 'Default (默认)' : 'Default (browser)';
    setVoice.appendChild(fallback);
    for (const voice of voices) {
      const option = document.createElement('option');
      option.value = voice.voiceURI;
      option.textContent = `${voice.name} (${voice.lang})`;
      setVoice.appendChild(option);
    }
    if (!voices.length) return;
    const known = voices.some((voice) => voice.voiceURI === current);
    setVoice.value = known ? current : '';
    if (!known && current) {
      settings.voiceURI = '';
      saveSettings();
    }
  }

  if (window.speechSynthesis && typeof window.speechSynthesis.addEventListener === 'function') {
    window.speechSynthesis.addEventListener('voiceschanged', fillVoices);
  }
  paintSettings();

  function setSettingsOpen(show) {
    if (show) {
      helpEl.classList.add('hidden');
      document.body.classList.remove('help-open');
      chooserEl.classList.add('hidden');
      fillVoices();
    }
    settingsEl.classList.toggle('hidden', !show);
  }
  settingsBtn.addEventListener('click', () => setSettingsOpen(settingsEl.classList.contains('hidden')));
  settingsClose.addEventListener('click', () => setSettingsOpen(false));
  setTts.addEventListener('change', () => setSettings({ tts: setTts.checked }));
  ttsEl.addEventListener('change', () => setSettings({ tts: ttsEl.checked }));
  setSubs.addEventListener('change', () => setSettings({ subtitles: setSubs.checked }));
  setZh.addEventListener('change', () => setSettings({ zh: setZh.checked }));
  setLevel.addEventListener('change', () => setSettings({ difficulty: setLevel.value }));
  setVoice.addEventListener('change', () => setSettings({ voiceURI: setVoice.value }));
  setRate.addEventListener('input', () => setSettings({ rate: Number(setRate.value) }));

  function chooserOpen() {
    return !chooserEl.classList.contains('hidden');
  }

  function setChooser(show) {
    chooserEl.classList.toggle('hidden', !show);
    if (!show) chooserList.innerHTML = '';
  }

  function showChooser(items, note) {
    helpEl.classList.add('hidden');
    document.body.classList.remove('help-open');
    settingsEl.classList.add('hidden');
    chooserNote.textContent = note || '';
    chooserList.innerHTML = '';
    for (const item of items) {
      const button = document.createElement('button');
      button.type = 'button';
      const title = document.createElement('span');
      title.textContent = item.title;
      const level = document.createElement('span');
      level.className = `level ${item.level}`;
      const label = item.level === 'intermediate' ? 'Intermediate' : 'Beginner';
      level.textContent = item.preferred ? `${label} · your level` : label;
      button.append(title, level);
      button.addEventListener('click', () => {
        setChooser(false);
        onPick(item.id);
      });
      chooserList.appendChild(button);
    }
    chooserEl.classList.remove('hidden');
  }
  chooserCancel.addEventListener('click', () => setChooser(false));
  hintBtn.addEventListener('click', () => onHint());
  retryBtn.addEventListener('click', () => onRetry());

  function setHelp(show) {
    if (show) {
      settingsEl.classList.add('hidden');
      chooserEl.classList.add('hidden');
    }
    helpEl.classList.toggle('hidden', !show);
    document.body.classList.toggle('help-open', !!show);
    if (!show) {
      try { localStorage.setItem(HELP_KEY, '1'); } catch (err) { /* private mode */ }
    }
  }
  helpBtn.addEventListener('click', () => setHelp(helpEl.classList.contains('hidden')));
  helpClose.addEventListener('click', () => {
    try { localStorage.setItem(HELP_KEY, '1'); } catch (err) { /* private mode */ }
    setHelp(false);
  });
  try {
    if (localStorage.getItem(HELP_KEY) !== '1') setHelp(true);
  } catch (err) { /* ignore */ }
  talkAgainBtn.addEventListener('click', () => onAgain());
  leaveEndBtn.addEventListener('click', () => onLeave());

  document.querySelector('#say-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const text = sayEl.value.trim();
    if (!text) return;
    sayEl.value = '';
    onSend(text);
  });
  leaveEl.addEventListener('click', () => onLeave());

  function setZone(name) {
    zoneEl.textContent = name;
  }

  function setPrompt(lines) {
    promptEl.innerHTML = '';
    if (!lines.length) {
      promptEl.classList.add('hidden');
      joinBtn.classList.add('hidden');
      talkBtn.classList.add('hidden');
      return;
    }
    promptEl.classList.remove('hidden');
    for (const line of lines) {
      const p = document.createElement('p');
      p.textContent = line;
      promptEl.appendChild(p);
    }
  }

  function setActions({ join, talk }) {
    joinBtn.classList.toggle('hidden', !join);
    talkBtn.classList.toggle('hidden', !talk);
    joinBtn.textContent = join || 'Join';
    talkBtn.textContent = talk || 'Talk';
  }

  let micState = 'idle';
  let statConv = 0;
  let statVoice = 0;

  function narrowScreen() {
    return window.matchMedia('(max-width: 520px)').matches;
  }

  function paintMic() {
    const state = micState;
    micEl.dataset.state = state;
    micBtn.dataset.state = state;
    const labels = narrowScreen()
      ? { idle: 'Mic', listening: 'Live', unsupported: 'No mic' }
      : { idle: 'Mic idle', listening: 'Mic listening', unsupported: 'Mic unsupported' };
    const buttonLabels = {
      idle: 'Hold to talk',
      listening: 'Listening…',
      unsupported: 'Mic unavailable',
    };
    micEl.textContent = labels[state] || state;
    micBtn.textContent = buttonLabels[state] || 'Hold to talk';
    micBtn.disabled = state === 'unsupported';
    const tip = state === 'unsupported'
      ? MIC_TITLE
      : 'Hold to talk. Works in Chrome or Edge on localhost or https.';
    micEl.title = tip;
    micBtn.title = tip;
  }

  function setMic(state) {
    micState = state;
    paintMic();
  }

  function setTranscript(text) {
    const value = (text || '').trim();
    transcriptEl.textContent = value ? value : '';
    transcriptEl.classList.toggle('hidden', !value);
  }

  function showChat(show) {
    chatEl.classList.toggle('hidden', !show);
    document.body.classList.toggle('chatting', !!show);
    if (show) logEl.innerHTML = '';
    if (!show) {
      typingEl.classList.add('hidden');
      waitEl.classList.add('hidden');
      endBox.classList.add('hidden');
      hintsEl.classList.add('hidden');
      hintsEl.innerHTML = '';
    }
    hintBtn.classList.toggle('hidden', !show);
    retryBtn.classList.toggle('hidden', !show);
  }

  function speakerColor(name) {
    let h = 0;
    const s = String(name || '');
    for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) >>> 0;
    return `hsl(${h % 360} 78% 76%)`;
  }

  function addZh(parent, zh) {
    if (!zh) return;
    const sub = document.createElement('span');
    sub.className = 'zh';
    sub.textContent = zh;
    parent.appendChild(sub);
  }

  function addLog(speaker, text, kind, zh) {
    const key = `${speaker}\n${text}`;
    const last = logEl.lastElementChild;
    if (last && last.dataset.line === key && (kind || 'npc') !== 'you') return;
    const row = document.createElement('p');
    row.className = kind || 'npc';
    row.dataset.line = key;
    const who = document.createElement('strong');
    who.textContent = speaker;
    who.style.color = kind === 'you' ? '#80d8ff' : speakerColor(speaker);
    row.appendChild(who);
    row.appendChild(document.createTextNode(` ${text}`));
    addZh(row, zh);
    logEl.appendChild(row);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function addHeard(text) {
    const row = document.createElement('p');
    row.className = 'heard';
    if (text && typeof text === 'object') {
      const pct = Math.round((Number(text.confidence) || 0) * 100);
      row.textContent = `Heard: “${text.input}” → ${text.match} (${pct}%)`;
    } else {
      row.textContent = `Heard: ${text}`;
    }
    logEl.appendChild(row);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function addRecap(phrases) {
    if (!phrases || !phrases.length) return;
    const bits = phrases.map((phrase) => (
      typeof phrase === 'string' ? { text: phrase, zh: '' } : phrase
    ));
    const row = document.createElement('p');
    row.className = 'recap';
    const who = document.createElement('strong');
    who.textContent = 'Useful phrases';
    row.appendChild(who);
    const list = document.createElement('span');
    list.textContent = ` ${bits.map((phrase) => phrase.text).join(' · ')}`;
    row.appendChild(list);
    const zh = bits.map((phrase) => phrase.zh).filter(Boolean).join(' · ');
    addZh(row, zh);
    logEl.appendChild(row);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function setTyping(on) {
    typingEl.classList.toggle('hidden', !on);
  }

  function setWaiting(on) {
    waitEl.classList.toggle('hidden', !on);
  }

  function showEnd(on) {
    endBox.classList.toggle('hidden', !on);
    if (on) {
      hintBtn.classList.add('hidden');
      retryBtn.classList.add('hidden');
    } else if (!chatEl.classList.contains('hidden')) {
      retryBtn.classList.remove('hidden');
    }
  }

  function setStats(conversations, voiceMatches) {
    statConv = conversations;
    statVoice = voiceMatches;
    statsEl.textContent = narrowScreen()
      ? `${conversations} chats · ${voiceMatches} voice`
      : `Practice stats: ${conversations} conversations · ${voiceMatches} voice matches`;
  }

  window.addEventListener('resize', () => {
    paintMic();
    setStats(statConv, statVoice);
  });

  function helpOpen() {
    return !helpEl.classList.contains('hidden');
  }

  function settingsOpen() {
    return !settingsEl.classList.contains('hidden');
  }

  function uiLocked() {
    return helpOpen() || settingsOpen() || chooserOpen();
  }

  function setChoices(choices) {
    choicesEl.innerHTML = '';
    hintsEl.classList.add('hidden');
    hintsEl.innerHTML = '';
    hintBtn.classList.toggle('hidden', !choices.length);
    for (const choice of choices) {
      const button = document.createElement('button');
      button.type = 'button';
      const label = document.createElement('span');
      label.textContent = choice.text;
      button.appendChild(label);
      addZh(button, choice.zh);
      button.addEventListener('click', () => onChoice(choice.text, choice.zh || ''));
      choicesEl.appendChild(button);
    }
  }

  function showHints(lines) {
    hintsEl.innerHTML = '';
    for (const line of lines) {
      const p = document.createElement('p');
      p.textContent = line;
      hintsEl.appendChild(p);
    }
    hintsEl.classList.toggle('hidden', !lines.length);
  }

  function setInterim(text) {
    if (document.activeElement !== sayEl) sayEl.value = text;
  }

  function setAmbient(lines) {
    ambientEl.innerHTML = '';
    if (!lines.length) {
      ambientEl.classList.add('hidden');
      return;
    }
    ambientEl.classList.remove('hidden');
    const title = document.createElement('p');
    title.className = 'ambient-title';
    title.textContent = 'Nearby talk';
    ambientEl.appendChild(title);
    for (const line of lines) {
      const p = document.createElement('p');
      p.appendChild(document.createTextNode(`${line.speaker}: ${line.text}`));
      addZh(p, line.zh);
      ambientEl.appendChild(p);
    }
  }

  function ttsEnabled() {
    return ttsEl.checked;
  }

  return {
    setZone,
    setPrompt,
    setActions,
    setMic,
    showChat,
    addLog,
    setChoices,
    setTyping,
    setWaiting,
    showEnd,
    setStats,
    setHelp,
    helpOpen,
    setInterim,
    setTranscript,
    setAmbient,
    addHeard,
    addRecap,
    ttsEnabled,
    getSettings,
    setSettings,
    setSettingsOpen,
    settingsOpen,
    showChooser,
    setChooser,
    chooserOpen,
    showHints,
    uiLocked,
    sayEl,
    micBtn,
    joinBtn,
    talkBtn,
    onChoice(fn) { onChoice = fn; },
    onSend(fn) { onSend = fn; },
    onLeave(fn) { onLeave = fn; },
    onAgain(fn) { onAgain = fn; },
    onPick(fn) { onPick = fn; },
    onHint(fn) { onHint = fn; },
    onRetry(fn) { onRetry = fn; },
    onSettingsChange(fn) { onSettingsChange = fn; },
  };
}
