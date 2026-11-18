export function createPointer(dom) {
  let dragging = false;
  let dx = 0;
  let dy = 0;
  let wheel = 0;

  dom.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    dragging = true;
    dom.setPointerCapture(event.pointerId);
  });
  dom.addEventListener('pointerup', () => {
    dragging = false;
  });
  dom.addEventListener('pointercancel', () => {
    dragging = false;
  });
  dom.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    dx += event.movementX;
    dy += event.movementY;
  });
  dom.addEventListener('wheel', (event) => {
    event.preventDefault();
    wheel += Math.sign(event.deltaY);
  }, { passive: false });
  dom.addEventListener('contextmenu', (event) => event.preventDefault());

  return {
    read() {
      const out = { dx, dy, wheel };
      dx = 0;
      dy = 0;
      wheel = 0;
      return out;
    },
  };
}
