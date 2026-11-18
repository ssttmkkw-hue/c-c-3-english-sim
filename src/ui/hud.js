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
  const skitBtn = document.querySelector('#btn-skit');
  const talkBtn = document.querySelector('#btn-talk');
  const micBtn = document.querySelector('#mic-btn');
  const transcriptEl = document.querySelector('#transcript');
  const typingEl = document.querySelector('#typing');
  const yourTurnEl = document.querySelector('#your-turn');
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
  const practiceEl = document.querySelector('#practice');
  const practicePhraseEl = document.querySelector('#practice-phrase');
  const practiceZhEl = document.querySelector('#practice-zh');
  const practiceWordsEl = document.querySelector('#practice-words');
  const practiceStarsEl = document.querySelector('#practice-stars');
  const practiceHeardEl = document.querySelector('#practice-heard');
  const practicePlay = document.querySelector('#practice-play');
  const practiceMicBtn = document.querySelector('#practice-mic');
  const practiceForm = document.querySelector('#practice-form');
  const practiceInput = document.querySelector('#practice-input');
  const practiceClose = document.querySelector('#practice-close');
  const notebookEl = document.querySelector('#notebook');
  const notebookList = document.querySelector('#notebook-list');
  const notebookEmpty = document.querySelector('#notebook-empty');
  const notebookBtn = document.querySelector('#notebook-btn');
  const notebookClose = document.querySelector('#notebook-close');
  const missionsEl = document.querySelector('#missions');
  const toastEl = document.querySelector('#toast');
  const confettiEl = document.querySelector('#confetti');
  const avatarNameEl = document.querySelector('#avatar-name');
  const avatarColorsEl = document.querySelector('#avatar-colors');
  const avatarHairsEl = document.querySelector('#avatar-hairs');
  const tipsEl = document.querySelector('#tips');
  const tipsStepEl = document.querySelector('#tips-step');
  const tipsTextEl = document.querySelector('#tips-text');
  const tipsNext = document.querySelector('#tips-next');
  const tipsSkip = document.querySelector('#tips-skip');

  const MIC_TITLE = 'Speech recognition needs Chrome or Edge, and the page must be on localhost or https. Firefox and insecure http pages do not expose the mic API.';

  let onChoice = () => {};
  let onSend = () => {};
  let onLeave = () => {};
  let onAgain = () => {};
  let onPick = () => {};
  let onHint = () => {};
  let onRetry = () => {};
  let onSettingsChange = () => {};
  let onSave = () => {};
  let onPractice = () => {};
  let onPracticePlay = () => {};
  let onPracticeSubmit = () => {};
  let onPracticeClose = () => {};
  let onNotebookToggle = () => {};
  let onNotebookRemove = () => {};
  let onAvatarChange = () => {};
  let savedCheck = () => false;
  let missionsData = null;
  let missionsOpen = false;
  let ambientLines = [];
  let tipIndex = 0;
  const HELP_KEY = 'plaza-english-help-v1';
  const TIPS_KEY = 'plaza-english-tips-v1';
  const AVATAR_KEY = 'plaza-english-avatar';
  const SETTINGS_KEY = 'plaza-english-settings';
  const AVATAR_COLORS = [0x5c6bc0, 0xec407a, 0x26a69a, 0xef6c00, 0x8e24aa, 0x00897b, 0xf9a825, 0x6d4c41];
  const AVATAR_HAIRS = [
    { id: 'short', label: 'Short 短发' },
    { id: 'bob', label: 'Bob 波波头' },
    { id: 'spiky', label: 'Spiky 尖刺' },
    { id: 'bun', label: 'Bun 发髻' },
  ];
  const TIP_STEPS = [
    'Walk up to a group in a zone. (走到一个区域里的人群旁边。)',
    'Press E, or tap Join, and pick a chat. (按 E 或点 Join，选一段对话。)',
    'Reply by holding Space, or tap a choice. (按住空格说话，或点一个回答。)',
  ];
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
      notebookEl.classList.add('hidden');
      closePractice();
      setPortals(false);
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

  const portalsEl = document.querySelector('#portals');
  const portalsList = document.querySelector('#portals-list');
  const portalsCancel = document.querySelector('#portals-cancel');
  let onTeleport = () => {};

  function portalsOpen() {
    return portalsEl && !portalsEl.classList.contains('hidden');
  }

  function setPortals(show) {
    if (!portalsEl) return;
    portalsEl.classList.toggle('hidden', !show);
    if (!show && portalsList) portalsList.innerHTML = '';
  }

  function showPortals(items) {
    if (!portalsEl || !portalsList) return;
    helpEl.classList.add('hidden');
    document.body.classList.remove('help-open');
    settingsEl.classList.add('hidden');
    notebookEl.classList.add('hidden');
    chooserEl.classList.add('hidden');
    closePractice();
    portalsList.innerHTML = '';
    for (const item of items) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = item.name;
      button.dataset.zone = item.id;
      button.addEventListener('click', () => {
        setPortals(false);
        onTeleport(item.id);
      });
      portalsList.appendChild(button);
    }
    portalsEl.classList.remove('hidden');
  }

  if (portalsCancel) portalsCancel.addEventListener('click', () => setPortals(false));

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
    notebookEl.classList.add('hidden');
    closePractice();
    setPortals(false);
    chooserNote.textContent = note || '';
    chooserList.innerHTML = '';
    let lastSection = '';
    for (const item of items) {
      if (item.section && item.section !== lastSection) {
        lastSection = item.section;
        const heading = document.createElement('p');
        heading.className = 'chooser-section';
        heading.textContent = item.section;
        chooserList.appendChild(heading);
      }
      const button = document.createElement('button');
      button.type = 'button';
      const title = document.createElement('span');
      title.textContent = item.title;
      const level = document.createElement('span');
      level.className = `level ${item.level === 'intermediate' ? 'intermediate' : 'beginner'}`;
      const label = item.kind === 'skit'
        ? 'Skit'
        : (item.level === 'intermediate' ? 'Intermediate' : 'Beginner');
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
    const wasOpen = !helpEl.classList.contains('hidden');
    if (show) {
      settingsEl.classList.add('hidden');
      chooserEl.classList.add('hidden');
      setPortals(false);
      notebookEl.classList.add('hidden');
      tipsEl.classList.add('hidden');
      closePractice();
    }
    helpEl.classList.toggle('hidden', !show);
    document.body.classList.toggle('help-open', !!show);
    if (!show) {
      try { localStorage.setItem(HELP_KEY, '1'); } catch (err) { /* private mode */ }
      if (wasOpen) showTipsIfNeeded();
    }
  }
  helpBtn.addEventListener('click', () => setHelp(helpEl.classList.contains('hidden')));
  helpClose.addEventListener('click', () => {
    try { localStorage.setItem(HELP_KEY, '1'); } catch (err) { /* private mode */ }
    setHelp(false);
  });
  try {
    if (localStorage.getItem(HELP_KEY) !== '1') setHelp(true);
    else showTipsIfNeeded();
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

  function setActions({ join, talk, skit }) {
    joinBtn.classList.toggle('hidden', !join);
    talkBtn.classList.toggle('hidden', !talk);
    skitBtn.classList.toggle('hidden', !skit);
    joinBtn.textContent = join || 'Join';
    talkBtn.textContent = talk || 'Talk';
    skitBtn.textContent = skit || '🎭 Skit';
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
    const short = narrowScreen();
    const buttonLabels = short
      ? { idle: 'Talk', listening: 'Live', unsupported: 'Off' }
      : { idle: 'Hold to talk', listening: 'Listening…', unsupported: 'Mic unavailable' };
    micEl.textContent = labels[state] || state;
    paintMicButton(buttonLabels[state] || (short ? 'Talk' : 'Hold to talk'));
    micBtn.disabled = state === 'unsupported';
    const tip = state === 'unsupported'
      ? MIC_TITLE
      : 'Hold to talk. Works in Chrome or Edge on localhost or https.';
    micEl.title = tip;
    micBtn.title = tip;
  }

  function paintMicButton(label) {
    micBtn.replaceChildren();
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('width', '16');
    icon.setAttribute('height', '16');
    icon.setAttribute('aria-hidden', 'true');
    icon.classList.add('mic-icon');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('fill', 'currentColor');
    path.setAttribute('d', 'M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z');
    icon.appendChild(path);
    const span = document.createElement('span');
    span.className = 'mic-label';
    span.textContent = label;
    micBtn.append(icon, span);
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
      setYourTurn(false);
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
    if ((kind || 'npc') !== 'you') row.appendChild(saveButton(text, zh));
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
    list.className = 'recap-actions';
    for (const phrase of bits) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'practice-link';
      button.textContent = `Practice: ${phrase.text}`;
      button.addEventListener('click', () => onPractice(phrase.text, phrase.zh || ''));
      list.appendChild(button);
    }
    row.appendChild(list);
    const zh = bits.map((phrase) => phrase.zh).filter(Boolean).join(' · ');
    addZh(row, zh);
    logEl.appendChild(row);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function setTyping(on) {
    typingEl.classList.toggle('hidden', !on);
  }

  function setYourTurn(on) {
    if (!yourTurnEl) return;
    yourTurnEl.classList.toggle('hidden', !on);
    chatEl.classList.toggle('your-turn', !!on);
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

  function practiceOpen() {
    return !practiceEl.classList.contains('hidden');
  }

  function notebookOpen() {
    return !notebookEl.classList.contains('hidden');
  }

  function uiLocked() {
    return helpOpen() || settingsOpen() || chooserOpen() || practiceOpen() || notebookOpen() || portalsOpen();
  }

  function setChoices(choices) {
    choicesEl.innerHTML = '';
    hintsEl.classList.add('hidden');
    hintsEl.innerHTML = '';
    hintBtn.classList.toggle('hidden', !choices.length);
    for (const choice of choices) {
      const chip = document.createElement('div');
      chip.className = 'choice-chip';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'choice';
      const label = document.createElement('span');
      label.className = 'choice-label';
      label.textContent = choice.text;
      button.appendChild(label);
      addZh(button, choice.zh);
      button.addEventListener('click', () => onChoice(choice.text, choice.zh || ''));
      chip.append(button, saveButton(choice.text, choice.zh));
      choicesEl.appendChild(chip);
    }
  }

  function saveButton(text, zh) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'save-phrase';
    button.textContent = savedCheck(text) ? '★' : '☆';
    button.title = 'Save phrase (保存)';
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      onSave(text, zh || '');
      button.textContent = '★';
    });
    return button;
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
    ambientLines = lines || [];
    paintAmbient();
  }

  function paintAmbient() {
    ambientEl.innerHTML = '';
    if (!ambientLines.length) {
      ambientEl.classList.add('hidden');
      return;
    }
    ambientEl.classList.remove('hidden');
    if (narrowScreen()) {
      const line = ambientLines[ambientLines.length - 1];
      const p = document.createElement('p');
      p.className = 'ambient-line';
      p.textContent = `Nearby talk · ${line.speaker}: ${line.text}`;
      ambientEl.appendChild(p);
      return;
    }
    const title = document.createElement('p');
    title.className = 'ambient-title';
    title.textContent = 'Nearby talk';
    ambientEl.appendChild(title);
    for (const line of ambientLines) {
      const p = document.createElement('p');
      p.appendChild(document.createTextNode(`${line.speaker}: ${line.text}`));
      addZh(p, line.zh);
      ambientEl.appendChild(p);
    }
  }

  function ttsEnabled() {
    return ttsEl.checked;
  }

  function openPractice(phrase, zh, canSpeak) {
    helpEl.classList.add('hidden');
    document.body.classList.remove('help-open');
    settingsEl.classList.add('hidden');
    chooserEl.classList.add('hidden');
    notebookEl.classList.add('hidden');
    practicePhraseEl.textContent = phrase;
    practiceZhEl.textContent = zh || '';
    practiceZhEl.classList.toggle('hidden', !zh);
    practiceWordsEl.innerHTML = '';
    practiceStarsEl.textContent = '';
    practiceHeardEl.textContent = '';
    practiceInput.value = '';
    practiceInput.placeholder = canSpeak ? 'Or type the phrase' : 'Type the phrase (no microphone)';
    practiceMicBtn.classList.toggle('hidden', !canSpeak);
    practiceMicBtn.textContent = narrowScreen() ? '🎤 Speak' : 'Hold to speak';
    practiceEl.classList.remove('hidden');
  }

  function closePractice() {
    if (practiceEl.classList.contains('hidden')) return;
    practiceEl.classList.add('hidden');
    practiceInput.blur();
    onPracticeClose();
  }

  function showPracticeResult(result, heard) {
    practiceWordsEl.innerHTML = '';
    for (const word of result.words) {
      const span = document.createElement('span');
      span.className = word.ok ? 'word-ok' : 'word-miss';
      span.textContent = word.text;
      practiceWordsEl.appendChild(span);
    }
    const filled = '★★★'.slice(0, result.stars);
    const empty = '☆☆☆'.slice(0, 3 - result.stars);
    const pct = Math.round((Number(result.score) || 0) * 100);
    practiceStarsEl.textContent = `${filled}${empty}  ${pct}%`;
    practiceHeardEl.textContent = heard ? `Heard: ${heard}` : '';
  }

  function setPracticeTranscript(text) {
    const value = (text || '').trim();
    practiceHeardEl.textContent = value ? `Hearing: ${value}` : '';
  }

  function renderNotebook(items) {
    notebookList.innerHTML = '';
    const rows = items || [];
    notebookEmpty.classList.toggle('hidden', rows.length > 0);
    for (const item of rows) {
      const card = document.createElement('article');
      card.className = 'note-card';
      const title = document.createElement('p');
      title.className = 'note-text';
      title.textContent = item.text;
      card.appendChild(title);
      if (item.zh) {
        const zh = document.createElement('p');
        zh.className = 'note-zh';
        zh.textContent = item.zh;
        card.appendChild(zh);
      }
      const meta = document.createElement('p');
      meta.className = 'note-meta';
      const best = Math.round((Number(item.best) || 0) * 100);
      const source = item.source ? item.source : 'Saved phrase';
      meta.textContent = `${source} · practiced ${item.count || 0} · best ${best}%`;
      card.appendChild(meta);
      const actions = document.createElement('div');
      actions.className = 'note-actions';
      const practice = document.createElement('button');
      practice.type = 'button';
      practice.textContent = 'Practice (跟读)';
      practice.addEventListener('click', () => onPractice(item.text, item.zh || ''));
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'note-delete';
      remove.textContent = 'Delete';
      remove.addEventListener('click', () => onNotebookRemove(item.id));
      actions.append(practice, remove);
      card.appendChild(actions);
      notebookList.appendChild(card);
    }
  }

  function showNotebook(items) {
    helpEl.classList.add('hidden');
    document.body.classList.remove('help-open');
    settingsEl.classList.add('hidden');
    chooserEl.classList.add('hidden');
    closePractice();
    renderNotebook(items);
    notebookEl.classList.remove('hidden');
  }

  function setNotebook(show, items) {
    if (show) showNotebook(items || []);
    else notebookEl.classList.add('hidden');
  }

  function setMissions(data) {
    missionsData = data;
    paintMissions();
  }

  function paintMissions() {
    missionsEl.innerHTML = '';
    const missions = (missionsData && missionsData.missions) || [];
    const done = missions.filter((mission) => mission.done).length;
    const total = missions.length || 3;
    const narrow = narrowScreen();
    if (narrow && !missionsOpen) {
      missionsEl.classList.add('collapsed');
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'mission-pill';
      pill.textContent = `Today ${done}/${total}`;
      pill.addEventListener('click', () => {
        missionsOpen = true;
        paintMissions();
      });
      missionsEl.appendChild(pill);
      return;
    }
    missionsEl.classList.remove('collapsed');
    if (narrow) {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'mission-pill';
      pill.textContent = `Today ${done}/${total}`;
      pill.addEventListener('click', () => {
        missionsOpen = false;
        paintMissions();
      });
      missionsEl.appendChild(pill);
    }
    const head = document.createElement('p');
    head.className = 'mission-head';
    const streak = missionsData && missionsData.streak ? ` · streak ${missionsData.streak}` : '';
    head.textContent = `Today (每日任务)${streak}`;
    missionsEl.appendChild(head);
    for (const mission of missions) {
      const row = document.createElement('p');
      row.className = mission.done ? 'mission done' : 'mission';
      const label = document.createElement('span');
      label.textContent = `${mission.done ? '✓' : '○'} ${mission.title}`;
      const count = document.createElement('span');
      count.className = 'mission-count';
      count.textContent = `${mission.progress}/${mission.goal}`;
      row.append(label, count);
      const zh = document.createElement('span');
      zh.className = 'mission-zh';
      zh.textContent = mission.titleZh || '';
      row.appendChild(zh);
      missionsEl.appendChild(row);
    }
  }

  let toastTimer = 0;
  function toast(text) {
    toastEl.textContent = text;
    toastEl.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.add('hidden'), 2800);
  }

  function celebrate(text) {
    toast(text);
    const canvas = confettiEl;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.classList.remove('hidden');
    const colors = ['#ffe082', '#81d4fa', '#a5d6a7', '#ffab91', '#ffffff'];
    const bits = Array.from({ length: 32 }, () => ({
      x: canvas.width * (0.2 + Math.random() * 0.6),
      y: canvas.height * (0.15 + Math.random() * 0.2),
      w: (3 + Math.random() * 4) * dpr,
      vy: (40 + Math.random() * 90) * dpr,
      vx: (Math.random() - 0.5) * 80 * dpr,
      c: colors[Math.floor(Math.random() * colors.length)],
    }));
    const t0 = performance.now();
    let last = t0;
    function frame(now) {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const bit of bits) {
        bit.vy += 90 * dpr * dt;
        bit.x += bit.vx * dt;
        bit.y += bit.vy * dt;
        if (bit.y < canvas.height) alive = true;
        ctx.fillStyle = bit.c;
        ctx.fillRect(bit.x, bit.y, bit.w, bit.w * 0.6);
      }
      if (alive && now - t0 < 1400) requestAnimationFrame(frame);
      else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.classList.add('hidden');
      }
    }
    requestAnimationFrame(frame);
  }

  function sanitizeAvatar(raw) {
    const source = raw && typeof raw === 'object' ? raw : {};
    const color = Number(source.color);
    const hair = AVATAR_HAIRS.some((item) => item.id === source.hair) ? source.hair : 'short';
    const name = String(source.name || '').replace(/[\r\n\t]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 16);
    return {
      name: name || 'You',
      color: AVATAR_COLORS.includes(color) ? color : 0x5c6bc0,
      hair,
    };
  }

  function loadAvatar() {
    try {
      return sanitizeAvatar(JSON.parse(localStorage.getItem(AVATAR_KEY) || '{}'));
    } catch (err) {
      return sanitizeAvatar({});
    }
  }

  let avatar = loadAvatar();

  function paintAvatar() {
    if (document.activeElement !== avatarNameEl) avatarNameEl.value = avatar.name;
    avatarColorsEl.innerHTML = '';
    for (const color of AVATAR_COLORS) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `swatch${color === avatar.color ? ' on' : ''}`;
      button.style.background = `#${color.toString(16).padStart(6, '0')}`;
      button.title = `#${color.toString(16).padStart(6, '0')}`;
      button.addEventListener('click', () => setAvatar({ color }));
      avatarColorsEl.appendChild(button);
    }
    avatarHairsEl.innerHTML = '';
    for (const hair of AVATAR_HAIRS) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `hair-opt${hair.id === avatar.hair ? ' on' : ''}`;
      button.textContent = hair.label;
      button.addEventListener('click', () => setAvatar({ hair: hair.id }));
      avatarHairsEl.appendChild(button);
    }
  }

  function setAvatar(partial) {
    avatar = sanitizeAvatar({ ...avatar, ...(partial || {}) });
    try { localStorage.setItem(AVATAR_KEY, JSON.stringify(avatar)); } catch (err) { /* private mode */ }
    paintAvatar();
    onAvatarChange(getAvatar());
    return getAvatar();
  }

  function getAvatar() {
    return { ...avatar };
  }

  paintAvatar();
  avatarNameEl.addEventListener('input', () => setAvatar({ name: avatarNameEl.value }));
  avatarNameEl.addEventListener('blur', () => { avatarNameEl.value = avatar.name; });

  function tipsOpen() {
    return !tipsEl.classList.contains('hidden');
  }

  function paintTips() {
    tipsStepEl.textContent = `Tip ${tipIndex + 1} / ${TIP_STEPS.length}`;
    tipsTextEl.textContent = TIP_STEPS[tipIndex];
    tipsNext.textContent = tipIndex === TIP_STEPS.length - 1 ? 'Got it (知道了)' : 'Next (下一步)';
  }

  function showTipsIfNeeded() {
    try {
      if (localStorage.getItem(TIPS_KEY) === '1') return;
    } catch (err) {
      return;
    }
    if (!helpEl.classList.contains('hidden')) return;
    tipIndex = 0;
    paintTips();
    tipsEl.classList.remove('hidden');
  }

  function dismissTips() {
    tipsEl.classList.add('hidden');
    try { localStorage.setItem(TIPS_KEY, '1'); } catch (err) { /* private mode */ }
  }

  function advanceTips() {
    if (tipIndex >= TIP_STEPS.length - 1) {
      dismissTips();
      return;
    }
    tipIndex += 1;
    paintTips();
  }

  tipsNext.addEventListener('click', () => advanceTips());
  tipsSkip.addEventListener('click', () => dismissTips());
  window.addEventListener('resize', () => {
    paintMissions();
    paintAmbient();
  });

  const skitEl = document.querySelector('#skit');
  const skitTitleEl = document.querySelector('#skit-title');
  const skitPhaseEl = document.querySelector('#skit-phase');
  const skitSpeakerEl = document.querySelector('#skit-speaker');
  const skitLineEl = document.querySelector('#skit-line');
  const skitZhEl = document.querySelector('#skit-zh');
  const skitWordsEl = document.querySelector('#skit-words');
  const skitFeedbackEl = document.querySelector('#skit-feedback');
  const skitControls = document.querySelector('#skit-controls');
  let onSkit = () => {};
  let skitKey = '';
  let skitMicBtn = null;

  const PHASE_LABEL = {
    watch: 'Watching',
    roles: 'Choose a role',
    rehearse: 'Rehearse',
    perform: 'Your line',
    curtain: 'Curtain call',
  };

  function skitButton(label, action, extra) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.dataset.skit = action;
    if (extra) Object.assign(button.dataset, extra);
    button.addEventListener('click', () => onSkit(action, extra || {}));
    return button;
  }

  function paintSkitControls(model) {
    skitControls.replaceChildren();
    skitMicBtn = null;
    if (model.phase === 'watch') {
      skitControls.append(
        skitButton('Replay', 'replay'),
        skitButton(model.slow ? 'Slow 0.8×' : 'Slow 0.8×', 'slow'),
        skitButton('Show words', 'words'),
        skitButton('Skip to roles', 'skip'),
        skitButton('Leave', 'leave'),
      );
    } else if (model.phase === 'roles') {
      for (const role of model.roles || []) {
        const row = document.createElement('div');
        row.className = 'skit-role';
        row.append(
          skitButton(`${role.role} · ${role.lines} lines`, 'perform', { role: role.role }),
          skitButton('Rehearse', 'rehearse', { role: role.role }),
        );
        skitControls.appendChild(row);
      }
      skitControls.append(skitButton('Watch again', 'replay'), skitButton('Leave', 'leave'));
    } else if (model.phase === 'rehearse') {
      skitControls.append(skitButton('Skip', 'skip-line'), skitButton('Leave', 'leave'));
      appendSkitSay('Say it, or skip');
    } else if (model.phase === 'perform') {
      for (const level of model.ladder || []) {
        const button = skitButton(level === 'first' ? 'First words' : level[0].toUpperCase() + level.slice(1), 'hint', { level });
        button.dataset.hint = level;
        skitControls.appendChild(button);
      }
      skitControls.append(skitButton('Tap to read', 'read'));
      if (model.offerSkip) skitControls.append(skitButton('Skip this line', 'skip-line'));
      skitControls.append(skitButton('Leave', 'leave'));
      appendSkitSay('Say it your way');
    } else if (model.phase === 'curtain') {
      skitControls.append(
        skitButton('Replay', 'replay'),
        skitButton('Try with fewer hints', 'fewer'),
        skitButton('Leave', 'leave'),
      );
    }
    paintSkitFlags(model);
  }

  function appendSkitSay(placeholder) {
    const form = document.createElement('form');
    form.id = 'skit-form';
    const input = document.createElement('input');
    input.id = 'skit-input';
    input.type = 'text';
    input.maxLength = 160;
    input.autocomplete = 'off';
    input.placeholder = placeholder;
    const go = document.createElement('button');
    go.type = 'submit';
    go.textContent = 'Say';
    form.append(input, go);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      onSkit('say', { text });
    });
    const mic = document.createElement('button');
    mic.type = 'button';
    mic.id = 'skit-mic';
    mic.textContent = 'Hold to speak';
    skitMicBtn = mic;
    skitControls.append(form, mic);
  }

  function paintSkitFlags(model) {
    const words = skitControls.querySelector('[data-skit="words"]');
    if (words) words.classList.toggle('on', !!model.showWords);
    const slow = skitControls.querySelector('[data-skit="slow"]');
    if (slow) slow.classList.toggle('on', !!model.slow);
    skitControls.querySelectorAll('[data-hint]').forEach((button) => {
      button.classList.toggle('on', button.dataset.hint === model.hintLevel);
    });
  }

  function renderSkit(model) {
    if (!model || model.phase === 'idle') {
      skitEl.classList.add('hidden');
      document.body.classList.remove('skit-open');
      skitKey = '';
      skitMicBtn = null;
      return;
    }
    skitEl.classList.remove('hidden');
    document.body.classList.add('skit-open');
    skitTitleEl.textContent = model.titleZh && model.zh ? `${model.title} · ${model.titleZh}` : (model.title || '');
    skitPhaseEl.textContent = PHASE_LABEL[model.phase] || '';
    const sub = model.subtitle;
    skitSpeakerEl.textContent = sub && sub.speaker ? sub.speaker : '';
    const showBlank = model.phase === 'perform' && model.hintLevel === 'blank' && model.waiting;
    skitLineEl.textContent = showBlank ? 'Your line — say it your way.' : (sub && sub.text ? sub.text : '');
    const zh = model.zh && sub && sub.zh ? sub.zh : '';
    skitZhEl.textContent = zh;
    skitWordsEl.replaceChildren();
    if (model.showWords && sub && sub.text && !showBlank) {
      for (const word of sub.text.split(/\s+/).filter(Boolean)) {
        const chip = document.createElement('span');
        chip.textContent = word;
        skitWordsEl.appendChild(chip);
      }
    }
    skitFeedbackEl.textContent = model.feedback || '';
    const key = [model.phase, model.beat, model.role, model.rehearseIndex, model.waiting ? 1 : 0, model.offerSkip ? 1 : 0].join('|');
    if (key !== skitKey) {
      skitKey = key;
      paintSkitControls(model);
    } else {
      paintSkitFlags(model);
    }
  }

  practicePlay.addEventListener('click', () => onPracticePlay());
  practiceClose.addEventListener('click', () => closePractice());
  practiceForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = practiceInput.value.trim();
    if (!text) return;
    onPracticeSubmit(text);
  });
  notebookBtn.addEventListener('click', () => onNotebookToggle());
  notebookClose.addEventListener('click', () => setNotebook(false));

  return {
    setZone,
    setPrompt,
    setActions,
    setMic,
    showChat,
    addLog,
    setChoices,
    setTyping,
    setYourTurn,
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
    showPortals,
    setPortals,
    portalsOpen,
    onTeleport(fn) { onTeleport = fn; },
    showHints,
    uiLocked,
    sayEl,
    micBtn,
    joinBtn,
    skitBtn,
    talkBtn,
    onChoice(fn) { onChoice = fn; },
    onSend(fn) { onSend = fn; },
    onLeave(fn) { onLeave = fn; },
    onAgain(fn) { onAgain = fn; },
    onPick(fn) { onPick = fn; },
    onHint(fn) { onHint = fn; },
    onRetry(fn) { onRetry = fn; },
    onSettingsChange(fn) { onSettingsChange = fn; },
    onSave(fn) { onSave = fn; },
    onPractice(fn) { onPractice = fn; },
    onPracticePlay(fn) { onPracticePlay = fn; },
    onPracticeSubmit(fn) { onPracticeSubmit = fn; },
    onPracticeClose(fn) { onPracticeClose = fn; },
    onNotebookToggle(fn) { onNotebookToggle = fn; },
    onNotebookRemove(fn) { onNotebookRemove = fn; },
    setSavedCheck(fn) { savedCheck = fn; },
    openPractice,
    closePractice,
    practiceOpen,
    showPracticeResult,
    setPracticeTranscript,
    showNotebook,
    setNotebook,
    renderNotebook,
    notebookOpen,
    setMissions,
    getAvatar,
    setAvatar,
    onAvatarChange(fn) { onAvatarChange = fn; },
    tipsOpen,
    dismissTips,
    toast,
    celebrate,
    practiceMicBtn,
    renderSkit,
    onSkit(fn) { onSkit = fn; },
    skitMicBtn() { return skitMicBtn; },
  };
}
