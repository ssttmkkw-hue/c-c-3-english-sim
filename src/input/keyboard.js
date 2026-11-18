const HELD_BLOCK = new Set([
  'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
]);

/** Map KeyboardEvent.key when code is missing (some automated drivers). */
const FROM_KEY = {
  w: 'KeyW',
  a: 'KeyA',
  s: 'KeyS',
  d: 'KeyD',
  arrowup: 'ArrowUp',
  arrowdown: 'ArrowDown',
  arrowleft: 'ArrowLeft',
  arrowright: 'ArrowRight',
  ' ': 'Space',
  escape: 'Escape',
  shift: 'ShiftLeft',
  '1': 'Digit1',
  '2': 'Digit2',
  '3': 'Digit3',
  g: 'KeyG',
};

export function eventCode(event) {
  const key = String(event.key || '').toLowerCase();
  const fromKey = FROM_KEY[key];
  const code = event.code || '';
  if (fromKey && (!code || code === 'Unidentified' || code === key || code.length === 1)) return fromKey;
  if (code && code !== 'Unidentified') return code;
  return fromKey || '';
}

export function createKeyboard() {
  const down = new Set();
  const pressed = new Set();

  function typingTarget(event) {
    const el = event.target;
    return el && typeof el.matches === 'function' && el.matches('input, textarea');
  }

  window.addEventListener('keydown', (event) => {
    const code = eventCode(event);
    if (!code) return;
    if (!typingTarget(event) && HELD_BLOCK.has(code)) event.preventDefault();
    if (event.repeat) return;
    down.add(code);
    pressed.add(code);
  }, true);
  window.addEventListener('keyup', (event) => {
    down.delete(eventCode(event));
  }, true);
  window.addEventListener('blur', () => {
    down.clear();
  });

  return {
    held(code) {
      return down.has(code);
    },
    heldAny(...codes) {
      return codes.some((code) => down.has(code));
    },
    consume(code) {
      if (!pressed.has(code)) return false;
      pressed.delete(code);
      return true;
    },
    typing() {
      const el = document.activeElement;
      return !!(el && el.matches && el.matches('input, textarea'));
    },
  };
}
