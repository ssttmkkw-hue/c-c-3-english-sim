export function createTouch(root) {
  const stick = root.querySelector('#stick');
  const knob = root.querySelector('#knob');
  const base = { x: 0, y: 0 };
  let active = null;
  const vector = { x: 0, y: 0 };

  function setKnob(x, y) {
    knob.style.transform = `translate(${x}px, ${y}px)`;
  }

  stick.addEventListener('pointerdown', (event) => {
    active = event.pointerId;
    stick.setPointerCapture(event.pointerId);
    const rect = stick.getBoundingClientRect();
    base.x = rect.left + rect.width / 2;
    base.y = rect.top + rect.height / 2;
    move(event);
  });
  stick.addEventListener('pointermove', (event) => {
    if (event.pointerId !== active) return;
    move(event);
  });
  function end(event) {
    if (event.pointerId !== active) return;
    active = null;
    vector.x = 0;
    vector.y = 0;
    setKnob(0, 0);
  }
  stick.addEventListener('pointerup', end);
  stick.addEventListener('pointercancel', end);

  function move(event) {
    let dx = event.clientX - base.x;
    let dy = event.clientY - base.y;
    const max = 42;
    const len = Math.hypot(dx, dy) || 1;
    if (len > max) {
      dx = (dx / len) * max;
      dy = (dy / len) * max;
    }
    setKnob(dx, dy);
    vector.x = dx / max;
    vector.y = dy / max;
  }

  const coarse = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  if (coarse) document.body.classList.add('touch');

  return {
    vector,
    show() {
      document.body.classList.add('touch');
    },
  };
}
