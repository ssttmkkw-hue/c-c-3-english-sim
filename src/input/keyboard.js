const HELD_BLOCK = new Set([
  'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
]);

export function createKeyboard() {
  const down = new Set();
  const pressed = new Set();

  function typingTarget(event) {
    const el = event.target;
    return el && typeof el.matches === 'function' && el.matches('input, textarea');
  }

  window.addEventListener('keydown', (event) => {
    if (!typingTarget(event) && HELD_BLOCK.has(event.code)) event.preventDefault();
    if (event.repeat) return;
    down.add(event.code);
    pressed.add(event.code);
  });
  window.addEventListener('keyup', (event) => {
    down.delete(event.code);
  });
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
