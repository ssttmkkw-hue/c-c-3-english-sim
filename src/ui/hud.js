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

  const MIC_TITLE = 'Speech recognition needs Chrome or Edge, and the page must be on localhost or https. Firefox and insecure http pages do not expose the mic API.';

  let onChoice = () => {};
  let onSend = () => {};
  let onLeave = () => {};
  let onAgain = () => {};
  const HELP_KEY = 'plaza-english-help-v1';

  function setHelp(show) {
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
    }
  }

  function speakerColor(name) {
    let h = 0;
    const s = String(name || '');
    for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) >>> 0;
    return `hsl(${h % 360} 78% 76%)`;
  }

  function addLog(speaker, text, kind) {
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
    const row = document.createElement('p');
    row.className = 'recap';
    const who = document.createElement('strong');
    who.textContent = 'Useful phrases';
    row.appendChild(who);
    const list = document.createElement('span');
    list.textContent = ` ${phrases.join(' · ')}`;
    row.appendChild(list);
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

  function setChoices(choices) {
    choicesEl.innerHTML = '';
    for (const choice of choices) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = choice.text;
      button.addEventListener('click', () => onChoice(choice.text));
      choicesEl.appendChild(button);
    }
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
      p.textContent = `${line.speaker}: ${line.text}`;
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
    sayEl,
    micBtn,
    joinBtn,
    talkBtn,
    onChoice(fn) { onChoice = fn; },
    onSend(fn) { onSend = fn; },
    onLeave(fn) { onLeave = fn; },
    onAgain(fn) { onAgain = fn; },
  };
}
