export function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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
    for (let j = 1; j < cols; j++) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[b.length][a.length];
}

function keywordHit(userNorm, userTokens, keyword) {
  const key = normalize(keyword);
  if (!key) return 0;
  if (userNorm.includes(key)) return 1;
  for (const token of userTokens) {
    if (token === key) return 1;
    if (key.length >= 4 && token.length >= 4 && levenshtein(token, key) <= 1) return 0.75;
  }
  return 0;
}

/** Loose match of free text or a clicked choice against keyword lists. */
export function matchChoice(userText, choices) {
  const userNorm = normalize(userText);
  if (!userNorm || !choices || choices.length === 0) return null;
  const userTokens = tokens(userNorm);
  let best = null;
  let bestScore = 0;
  for (const choice of choices) {
    const choiceNorm = normalize(choice.text);
    let score = 0;
    if (userNorm === choiceNorm || choiceNorm.includes(userNorm) && userTokens.length >= 2) {
      score = 1;
    } else {
      const keys = choice.keywords || [];
      if (keys.length) {
        const total = keys.reduce((sum, key) => sum + keywordHit(userNorm, userTokens, key), 0);
        score = total / keys.length;
      }
      const choiceTokens = tokens(choiceNorm);
      if (choiceTokens.length) {
        const overlap = choiceTokens.filter((token) => userTokens.includes(token) && token.length > 2).length;
        score = Math.max(score, overlap / choiceTokens.length);
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = choice;
    }
  }
  if (bestScore >= 0.33) return best;
  return null;
}
