import * as THREE from 'three';

export function makeSpeechBubble() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 192;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(mat);
  sprite.position.set(0, 2.7, 0);
  sprite.scale.set(2.15, 0.8, 1);
  sprite.visible = false;
  sprite.renderOrder = 3;
  sprite.userData.canvas = canvas;
  sprite.userData.tex = tex;
  return sprite;
}

export function setBubbleText(sprite, text) {
  const canvas = sprite.userData.canvas;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(255,255,255,0.94)';
  roundRect(ctx, 8, 8, 496, 150, 22);
  ctx.fill();
  ctx.strokeStyle = 'rgba(55,71,79,0.35)';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = '#263238';
  ctx.font = '28px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lines = wrap(ctx, text, 450);
  const startY = 84 - (lines.length - 1) * 16;
  lines.forEach((line, i) => ctx.fillText(line, 256, startY + i * 32));
  sprite.userData.tex.needsUpdate = true;
  sprite.visible = true;
}

function wrap(ctx, text, max) {
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  for (const word of words) {
    const next = cur ? `${cur} ${word}` : word;
    if (ctx.measureText(next).width > max && cur) {
      lines.push(cur);
      cur = word;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
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
