const KEY = 'plaza-english-missions';

/** Stable pool. Three are picked per local day. */
export const MISSION_POOL = [
  {
    id: 'cafe-beginner',
    title: 'Complete a beginner chat in the Cafe',
    titleZh: '在咖啡馆完成一段初级对话',
    goal: 1,
    kind: 'group-end',
    zone: 'cafe',
    level: 'beginner',
  },
  {
    id: 'voice-3',
    title: 'Use your voice 3 times',
    titleZh: '用语音回答 3 次',
    goal: 3,
    kind: 'voice',
  },
  {
    id: 'solo-new',
    title: 'Talk 1-on-1 with someone new',
    titleZh: '和一位新的人一对一聊天',
    goal: 1,
    kind: 'solo-new',
  },
  {
    id: 'practice-2',
    title: 'Practice 2 phrases with Listen & Repeat',
    titleZh: '跟读练习 2 个句子',
    goal: 2,
    kind: 'practice',
  },
  {
    id: 'intermediate',
    title: 'Finish an intermediate conversation',
    titleZh: '完成一段中级对话',
    goal: 1,
    kind: 'group-end',
    level: 'intermediate',
  },
  {
    id: 'park-chat',
    title: 'Finish a chat in the Park',
    titleZh: '在公园完成一段对话',
    goal: 1,
    kind: 'group-end',
    zone: 'park',
  },
  {
    id: 'shop-chat',
    title: 'Finish a chat in the Shop',
    titleZh: '在商店完成一段对话',
    goal: 1,
    kind: 'group-end',
    zone: 'shop',
  },
  {
    id: 'class-chat',
    title: 'Finish a chat in the Classroom',
    titleZh: '在教室完成一段对话',
    goal: 1,
    kind: 'group-end',
    zone: 'classroom',
  },
  {
    id: 'skit-3',
    kind: 'skit-line',
    goal: 3,
    title: 'Say 3 lines in skits',
    titleZh: '在小剧场里说 3 句话',
  },
  {
    id: 'show-1',
    kind: 'show',
    goal: 1,
    title: 'Stay for a whole show',
    titleZh: '看完整一场演出',
  },
];

function localDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function prevDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - 1);
  return localDate(dt);
}

function hashString(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function missionsForDate(dateStr) {
  const rng = mulberry32(hashString(`plaza-missions:${dateStr}`));
  const bag = MISSION_POOL.map((item) => item.id);
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const swap = bag[i];
    bag[i] = bag[j];
    bag[j] = swap;
  }
  return bag.slice(0, 3).map((id) => MISSION_POOL.find((item) => item.id === id));
}

function blank(date, streak, lastCompleteDate) {
  return {
    date,
    progress: {},
    solos: [],
    streak: streak || 0,
    lastCompleteDate: lastCompleteDate || '',
  };
}

export function createMissions(now = () => new Date()) {
  let state = blank(localDate(now()), 0, '');

  function load() {
    const today = localDate(now());
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (err) { saved = {}; }
    const last = typeof saved.lastCompleteDate === 'string' ? saved.lastCompleteDate : '';
    const streak = Number(saved.streak) || 0;
    if (saved.date === today) {
      state = {
        date: today,
        progress: saved.progress && typeof saved.progress === 'object' ? saved.progress : {},
        solos: Array.isArray(saved.solos) ? saved.solos.map(String) : [],
        streak,
        lastCompleteDate: last,
      };
      return;
    }
    const kept = last === prevDate(today) || last === today ? streak : 0;
    state = blank(today, kept, last);
    save();
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (err) { /* private mode */ }
  }

  function todayMissions() {
    if (state.date !== localDate(now())) load();
    return missionsForDate(state.date);
  }

  function view() {
    const missions = todayMissions().map((mission) => {
      const progress = Math.min(mission.goal, Number(state.progress[mission.id]) || 0);
      return {
        id: mission.id,
        title: mission.title,
        titleZh: mission.titleZh,
        goal: mission.goal,
        progress,
        done: progress >= mission.goal,
      };
    });
    return { date: state.date, streak: state.streak || 0, missions };
  }

  function bump(kind, match) {
    const newly = [];
    for (const mission of todayMissions()) {
      if (mission.kind !== kind) continue;
      if (match && !match(mission)) continue;
      const cur = Number(state.progress[mission.id]) || 0;
      if (cur >= mission.goal) continue;
      state.progress[mission.id] = cur + 1;
      if (state.progress[mission.id] >= mission.goal) newly.push(mission);
    }
    const allDone = todayMissions().every((mission) => (Number(state.progress[mission.id]) || 0) >= mission.goal);
    let justCleared = false;
    if (allDone && newly.length && state.lastCompleteDate !== state.date) {
      const yest = prevDate(state.date);
      state.streak = state.lastCompleteDate === yest ? (state.streak || 0) + 1 : 1;
      state.lastCompleteDate = state.date;
      justCleared = true;
    }
    save();
    return { newly, allDone: justCleared };
  }

  function noteVoice() {
    return bump('voice');
  }

  function notePractice() {
    return bump('practice');
  }

  function noteSolo(characterId) {
    const id = String(characterId || '');
    if (!id || state.solos.includes(id)) return { newly: [], allDone: false };
    state.solos.push(id);
    save();
    return bump('solo-new');
  }

  function noteGroupEnd(info) {
    if (!info || info.mode !== 'group') return { newly: [], allDone: false };
    return bump('group-end', (mission) => {
      if (mission.zone && mission.zone !== info.zone) return false;
      if (mission.level && mission.level !== info.level) return false;
      return true;
    });
  }

  function noteSkitLine() {
    return bump('skit-line');
  }

  function noteShow() {
    return bump('show');
  }

  load();
  return { get: view, noteVoice, notePractice, noteSolo, noteGroupEnd, noteSkitLine, noteShow };
}
