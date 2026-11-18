/**
 * Loose match for typed or spoken replies.
 * Normalization, token overlap, fuzzy Levenshtein, and a small synonym list.
 * matchChoice returns { choice, confidence } or null. confidence is 0–1.
 */

const CONTRACTIONS = [
  [/won't/g, 'will not'],
  [/can't/g, 'cannot'],
  [/shan't/g, 'shall not'],
  [/n't/g, ' not'],
  [/i'm/g, 'i am'],
  [/it's/g, 'it is'],
  [/that's/g, 'that is'],
  [/what's/g, 'what is'],
  [/there's/g, 'there is'],
  [/here's/g, 'here is'],
  [/he's/g, 'he is'],
  [/she's/g, 'she is'],
  [/let's/g, 'let us'],
  [/you're/g, 'you are'],
  [/we're/g, 'we are'],
  [/they're/g, 'they are'],
  [/i've/g, 'i have'],
  [/we've/g, 'we have'],
  [/they've/g, 'they have'],
  [/you've/g, 'you have'],
  [/i'll/g, 'i will'],
  [/you'll/g, 'you will'],
  [/we'll/g, 'we will'],
  [/they'll/g, 'they will'],
  [/i'd/g, 'i would'],
  [/you'd/g, 'you would'],
  [/we'd/g, 'we would'],
  [/they'd/g, 'they would'],
];

const ONES = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19,
};
const TENS = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};

/** Groups share a meaning. Kept narrow so common verbs do not glue every choice together. */
const SYNONYM_GROUPS = [
  ['hello', 'hi', 'hey', 'howdy'],
  ['thanks', 'thank', 'thankyou', 'thx'],
  ['yes', 'yeah', 'yep', 'yup', 'sure'],
  ['no', 'nope', 'nah'],
  ['okay', 'ok', 'alright'],
  ['goodbye', 'bye'],
  ['coffee', 'latte', 'cappuccino', 'espresso'],
  ['tea', 'chai'],
  ['cost', 'price'],
  ['shop', 'store'],
  ['class', 'classroom', 'lesson'],
  ['jacket', 'coat'],
  ['hat', 'cap'],
  ['return', 'exchange', 'refund'],
  ['practice', 'practise', 'practicing', 'practising'],
  ['introduce', 'introduction'],
  ['beautiful', 'lovely', 'pretty'],
  ['tired', 'sleepy'],
  ['walk', 'hike', 'stroll'],
  ['rain', 'rainy', 'shower'],
  ['begin', 'start'],
  ['help', 'assist'],
  ['listen', 'hear'],
  ['speak', 'talk'],
  ['friend', 'buddy'],
  ['lost', 'confused'],
  ['directions', 'direction'],
  ['cash', 'money'],
  ['sorry', 'apologies'],
  ['big', 'large'],
  ['small', 'tiny'],
  ['happy', 'glad'],
  ['kid', 'child'],
  ['movie', 'film'],
  ['breakfast', 'brunch'],
];

const SYN_INDEX = new Map();
for (const group of SYNONYM_GROUPS) {
  for (const word of group) SYN_INDEX.set(word, group);
}

const STOP = new Set([
  'a', 'an', 'the', 'to', 'of', 'and', 'or', 'please', 'i', 'you', 'me', 'my', 'we', 'it',
  'is', 'am', 'are', 'be', 'do', 'does', 'did', 'in', 'on', 'at', 'with', 'this', 'that',
  'just', 'so', 'if', 'your', 'our',
]);

/** High scores advance. Scores between CONFIRM and ACCEPT ask the learner to confirm. */
export const MATCH_ACCEPT = 0.74;
export const MATCH_CONFIRM = 0.4;

export function normalize(text) {
  let s = String(text || '').toLowerCase().replace(/[’‘]/g, "'");
  s = expandContractions(s);
  s = s.replace(/&/g, ' and ');
  s = s.replace(/[^a-z0-9\s]/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  s = wordsToDigits(s);
  return s;
}

function expandContractions(s) {
  let out = ` ${s} `;
  for (const [pattern, repl] of CONTRACTIONS) out = out.replace(pattern, repl);
  return out;
}

function wordsToDigits(s) {
  const parts = s.split(' ').filter(Boolean);
  const out = [];
  for (let i = 0; i < parts.length; i++) {
    const w = parts[i];
    const tens = TENS[w];
    const next = ONES[parts[i + 1]];
    if (tens != null && next != null && next < 10) {
      out.push(String(tens + next));
      i += 1;
    } else if (tens != null) out.push(String(tens));
    else if (ONES[w] != null) out.push(String(ONES[w]));
    else out.push(w);
  }
  return out.join(' ');
}

function tokens(text) {
  return normalize(text).split(' ').filter(Boolean);
}

function levenshtein(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 9;
  const rows = b.length + 1;
  const cols = a.length + 1;
  const dp = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (let i = 0; i < rows; i++) dp[i][0] = i;
  for (let j = 0; j < cols; j++) dp[0][j] = j;
  for (let i = 1; i < rows; i++) {
    let rowMin = i;
    for (let j = 1; j < cols; j++) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      if (dp[i][j] < rowMin) rowMin = dp[i][j];
    }
    if (rowMin > 2) return 9;
  }
  return dp[b.length][a.length];
}

function sameMeaning(a, b) {
  if (a === b) return true;
  const group = SYN_INDEX.get(a);
  return !!(group && group.includes(b));
}

/** 1 exact, ~0.9 synonym or stem, ~0.8 one-edit typo, 0 otherwise. */
function wordScore(userToken, target) {
  if (!userToken || !target) return 0;
  if (userToken === target) return 1;
  if (sameMeaning(userToken, target)) return 0.9;
  if (target.length >= 4 && userToken.startsWith(target)) return 0.92;
  if (userToken.length >= 5 && target.startsWith(userToken)) return 0.84;
  const minLen = Math.min(userToken.length, target.length);
  if (minLen >= 4) {
    const dist = levenshtein(userToken, target);
    const limit = minLen >= 8 ? 2 : 1;
    if (dist <= limit) return dist === 1 ? 0.8 : 0.66;
  }
  return 0;
}

function bestAgainst(target, userTokens) {
  let best = 0;
  for (const token of userTokens) {
    const score = wordScore(token, target);
    if (score > best) best = score;
    if (best === 1) break;
  }
  return best;
}

function keywordStrength(userNorm, userTokens, keyword) {
  const key = normalize(keyword);
  if (!key) return 0;
  const keyTokens = key.split(' ').filter(Boolean);
  if (!keyTokens.length) return 0;
  if (keyTokens.length === 1) {
    const token = keyTokens[0];
    let hit = bestAgainst(token, userTokens);
    if (token.length >= 4 && userNorm.includes(token)) hit = Math.max(hit, 0.95);
    return hit;
  }
  const sum = keyTokens.reduce((total, token) => total + bestAgainst(token, userTokens), 0);
  return sum / keyTokens.length;
}

function scoreChoice(userNorm, userTokens, choice) {
  const choiceNorm = normalize(choice.text);
  if (!choiceNorm) return 0;
  if (userNorm === choiceNorm) return 1;
  const choiceTokens = choiceNorm.split(' ').filter((token) => token && !STOP.has(token));
  const contentUser = userTokens.filter((token) => !STOP.has(token));
  if (
    contentUser.length >= 2
    && choiceTokens.length
    && contentUser.every((token) => choiceTokens.includes(token) || choiceNorm.includes(token))
    && contentUser.length >= Math.min(3, choiceTokens.length)
  ) {
    return 0.94;
  }
  if (choiceTokens.length >= 2 && contentUser.length >= 2 && choiceNorm.includes(userNorm)) return 0.9;

  let keyScore = 0;
  const keys = choice.keywords || [];
  if (keys.length) {
    let sum = 0;
    let best = 0;
    let strong = false;
    for (const key of keys) {
      const hit = keywordStrength(userNorm, userTokens, key);
      sum += hit;
      if (hit > best) best = hit;
      const keyNorm = normalize(key).replace(/\s/g, '');
      if (hit >= 0.9 && (keyNorm.length >= 3 || /^\d+$/.test(keyNorm))) strong = true;
    }
    const coverage = sum / keys.length;
    keyScore = coverage;
    if (strong) keyScore = Math.max(keyScore, Math.min(0.86, 0.62 + coverage * 0.35));
  }

  let overlap = 0;
  if (choiceTokens.length && contentUser.length) {
    const sum = choiceTokens.reduce((total, token) => total + bestAgainst(token, contentUser), 0);
    overlap = sum / choiceTokens.length;
  }
  return Math.max(keyScore, overlap * 0.98);
}

/**
 * @returns {{ choice: object, confidence: number } | null}
 */
export function matchChoice(userText, choices) {
  const userNorm = normalize(userText);
  if (!userNorm || !choices || choices.length === 0) return null;
  const userTokens = userNorm.split(' ').filter(Boolean);
  let best = null;
  let bestScore = 0;
  let second = 0;
  for (const choice of choices) {
    const score = scoreChoice(userNorm, userTokens, choice);
    if (score > bestScore) {
      second = bestScore;
      bestScore = score;
      best = choice;
    } else if (score > second) second = score;
  }
  if (!best || bestScore < MATCH_CONFIRM) return null;
  let confidence = bestScore;
  if (userTokens.length === 1 && bestScore < 0.98) confidence = Math.min(confidence, 0.66);
  if (second > 0 && bestScore < 0.98 && bestScore - second < 0.08) {
    confidence = Math.min(confidence, 0.62);
  }
  confidence = Math.round(Math.min(1, confidence) * 100) / 100;
  return { choice: best, confidence };
}

export function confidentEnough(confidence) {
  return confidence >= MATCH_ACCEPT;
}
