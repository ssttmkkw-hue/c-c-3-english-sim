import * as THREE from 'three';

export function paintNameTag(sprite, text, kind) {
  const canvas = sprite.userData.canvas;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = kind === 'player' ? 'rgba(21, 101, 192, 0.88)' : 'rgba(38, 50, 56, 0.88)';
  roundRect(ctx, 16, 24, 480, 80, 24);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const label = String(text || '').slice(0, 22);
  let size = 40;
  ctx.font = `bold ${size}px sans-serif`;
  while (size > 22 && ctx.measureText(label).width > 440) {
    size -= 2;
    ctx.font = `bold ${size}px sans-serif`;
  }
  ctx.fillText(label, 256, 66);
  sprite.userData.tex.needsUpdate = true;
  sprite.userData.kind = kind;
}

export function makeNameTag(text, kind) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(mat);
  sprite.position.set(0, 2.32, 0);
  sprite.scale.set(1.7, 0.42, 1);
  sprite.renderOrder = 2;
  sprite.userData.canvas = canvas;
  sprite.userData.tex = tex;
  paintNameTag(sprite, text, kind);
  return sprite;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
