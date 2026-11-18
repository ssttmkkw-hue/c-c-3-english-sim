export function line(speaker, text, zh) {
  return { speaker, text, zh };
}

export function choice(text, zh, keywords, next, reaction = 'nod') {
  return { text, zh, keywords, next, reaction };
}

export function node(speaker, lines, choices, extra = {}) {
  return { speaker, lines, choices, ...extra };
}
