/** How long one title stays "now showing", in simulated seconds. */
export const SHOW_SECONDS = 180;

export function showAt(time, skits) {
  const list = (skits || []).filter((skit) => skit && skit.id);
  if (!list.length) return null;
  const t = Math.max(0, Number(time) || 0);
  const index = Math.floor(t / SHOW_SECONDS) % list.length;
  const into = t - Math.floor(t / SHOW_SECONDS) * SHOW_SECONDS;
  return {
    current: list[index],
    next: list[(index + 1) % list.length],
    nextIn: SHOW_SECONDS - into,
    index,
  };
}

export function formatRemain(seconds) {
  const s = Math.max(0, Math.ceil(Number(seconds) || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}
