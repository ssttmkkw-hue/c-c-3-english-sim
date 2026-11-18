/**
 * Shared line timing for ambient chat, joined talks, and skits.
 * Reading pace (no audio) stays quick enough to follow on screen.
 * Listening pace matches a typical TTS voice: about 2.6–3 words/s at rate 1,
 * stretched when the user picks a slower speed.
 */

const READ_WPS = 4.6;
const LISTEN_WPS = 2.8;

export function clampRate(rate) {
  const n = Number(rate);
  if (!Number.isFinite(n)) return 0.96;
  return Math.min(1.4, Math.max(0.6, n));
}

export function wordCount(text) {
  return String(text || '').trim().split(/\s+/).filter(Boolean).length;
}

export function isQuestion(text) {
  return /\?\s*$/.test(String(text || '').trim());
}

export function isQuick(line) {
  if (!line) return false;
  if (line.quick) return true;
  const words = wordCount(line.text);
  return words > 0 && words <= 4 && !isQuestion(line.text);
}

/**
 * How long a line should hold the floor before the gap.
 * listening: true scales by TTS rate (~2.8 words/s at rate 1).
 */
export function estimateLineDuration(text, opts = {}) {
  const words = wordCount(text);
  if (opts.listening) {
    const rate = clampRate(opts.rate);
    return Math.max(1.5, words / (LISTEN_WPS * rate) + 0.35);
  }
  return Math.max(1.4, words / READ_WPS + 0.08);
}

/**
 * minDur is the readable / expected length.
 * hard is the give-up cap. With TTS it is long enough that a slow voice
 * can finish; the line still ends early when the utterance's onend fires.
 */
export function speakingBudget(text, opts = {}) {
  const minDur = estimateLineDuration(text, opts);
  const hard = opts.listening
    ? Math.max(minDur * 2.2, minDur + 3.2)
    : minDur * 1.5;
  return { minDur, hard };
}

export function drawGap(line, next, random) {
  const roll = typeof random === 'function' ? random : Math.random;
  if (line && Array.isArray(line.gapAfter) && line.gapAfter.length >= 2) {
    const a = Number(line.gapAfter[0]);
    const b = Number(line.gapAfter[1]);
    const lo = Number.isFinite(a) ? a : 0.5;
    const hi = Number.isFinite(b) ? b : lo;
    return lo + roll() * Math.max(0, hi - lo);
  }
  if (isQuick(next)) return 0.2 + roll() * 0.2;
  if (line && isQuestion(line.text)) return 1.5 + roll() * 1.0;
  return 0.5 + roll() * 1.0;
}
