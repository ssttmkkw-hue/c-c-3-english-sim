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

  const MIC_TITLE = 'Speech recognition needs Chrome or Edge, and the page must be on localhost or https. Firefox and insecure http pages do not expose the mic API.';

  let onChoice = () => {};
  let onSend = () => {};
  let onLeave = () => {};

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

  function setMic(state) {
    micEl.dataset.state = state;
    micBtn.dataset.state = state;
    const labels = {
      idle: 'Mic idle',
      listening: 'Mic listening',
      unsupported: 'Mic unsupported',
    };
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

  function setTranscript(text) {
    const value = (text || '').trim();
    transcriptEl.textContent = value ? value : '';
    transcriptEl.classList.toggle('hidden', !value);
  }

  function showChat(show) {
    chatEl.classList.toggle('hidden', !show);
    if (show) logEl.innerHTML = '';
  }

  function speakerColor(name) {
    let h = 0;
    const s = String(name || '');
    for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) >>> 0;
    return `hsl(${h % 360} 78% 76%)`;
  }

  function addLog(speaker, text, kind) {
    const row = document.createElement('p');
    row.className = kind || 'npc';
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
    row.textContent = `Heard: ${text}`;
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
  };
}
