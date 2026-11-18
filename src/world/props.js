import * as THREE from 'three';

function mat(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0.04, ...extra });
}

function add(group, geometry, material, x, y, z, colliders, radius) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  if (colliders && radius) colliders.push({ x, z, r: radius });
  return mesh;
}

export function makeTable(group, x, z, colliders, top = 0xc4a484) {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(1.6, 0.1, 1.0), mat(top), 0, 0.78, 0);
  const leg = new THREE.BoxGeometry(0.08, 0.74, 0.08);
  const wood = mat(0x8d6e63);
  [[-0.68, -0.4], [0.68, -0.4], [-0.68, 0.4], [0.68, 0.4]].forEach(([lx, lz]) => {
    add(g, leg, wood, lx, 0.37, lz);
  });
  g.position.set(x, 0, z);
  group.add(g);
  colliders.push({ x, z, r: 0.85 });
}

export function makeChair(group, x, z, rotY) {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(0.46, 0.08, 0.46), mat(0x5d6d7e), 0, 0.48, 0);
  add(g, new THREE.BoxGeometry(0.46, 0.5, 0.08), mat(0x4a5568), 0, 0.78, -0.2);
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  group.add(g);
}

export function makeTree(group, x, z, colliders, leaf = 0x2e7d32) {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(0.16, 0.22, 1.3, 8), mat(0x6d4c41), 0, 0.65, 0);
  add(g, new THREE.SphereGeometry(0.85, 12, 10), mat(leaf), 0, 1.85, 0);
  g.position.set(x, 0, z);
  group.add(g);
  colliders.push({ x, z, r: 0.45 });
}

export function makeBench(group, x, z, rotY, colliders) {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(1.6, 0.1, 0.46), mat(0xa1887f), 0, 0.48, 0);
  add(g, new THREE.BoxGeometry(1.6, 0.42, 0.08), mat(0x8d6e63), 0, 0.74, -0.2);
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  group.add(g);
  colliders.push({ x, z, r: 0.7 });
}

export function makeDesk(group, x, z, colliders) {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(1.3, 0.08, 0.7), mat(0xd7ccc8), 0, 0.76, 0);
  add(g, new THREE.BoxGeometry(1.2, 0.7, 0.08), mat(0xbcaaa4), 0, 0.38, -0.28);
  g.position.set(x, 0, z);
  group.add(g);
  colliders.push({ x, z, r: 0.65 });
}

export function makeWhiteboard(group, x, z) {
  const g = new THREE.Group();
  const board = document.createElement('canvas');
  board.width = 512;
  board.height = 288;
  const ctx = board.getContext('2d');
  ctx.fillStyle = '#f7f9fc';
  ctx.fillRect(0, 0, 512, 288);
  ctx.strokeStyle = '#90a4ae';
  ctx.lineWidth = 12;
  ctx.strokeRect(8, 8, 496, 272);
  ctx.fillStyle = '#1565c0';
  ctx.font = 'bold 42px sans-serif';
  ctx.fillText('Today: Hello!', 48, 90);
  ctx.fillStyle = '#37474f';
  ctx.font = '32px sans-serif';
  ctx.fillText('My name is ____.', 48, 160);
  ctx.fillText('I like ____.', 48, 214);
  const tex = new THREE.CanvasTexture(board);
  tex.colorSpace = THREE.SRGBColorSpace;
  add(g, new THREE.BoxGeometry(2.4, 1.35, 0.08), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }), 0, 1.7, 0);
  add(g, new THREE.BoxGeometry(2.6, 0.1, 0.16), mat(0x546e7a), 0, 0.95, 0);
  g.position.set(x, 0, z);
  group.add(g);
}

export function makeCounter(group, x, z, length, rotY, colliders, color = 0x8d6e63) {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(length, 1.05, 0.7), mat(color), 0, 0.52, 0);
  add(g, new THREE.BoxGeometry(length, 0.08, 0.78), mat(0xefebe9), 0, 1.06, 0);
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  group.add(g);
  const r = Math.max(length * 0.45, 0.6);
  colliders.push({ x, z, r });
}

export function makeShelf(group, x, z, colliders) {
  const g = new THREE.Group();
  const frame = mat(0x6d4c41);
  add(g, new THREE.BoxGeometry(1.8, 0.08, 0.4), frame, 0, 0.4, 0);
  add(g, new THREE.BoxGeometry(1.8, 0.08, 0.4), frame, 0, 1.05, 0);
  add(g, new THREE.BoxGeometry(1.8, 0.08, 0.4), frame, 0, 1.7, 0);
  add(g, new THREE.BoxGeometry(0.08, 1.8, 0.4), frame, -0.86, 0.95, 0);
  add(g, new THREE.BoxGeometry(0.08, 1.8, 0.4), frame, 0.86, 0.95, 0);
  const goods = [0xe57373, 0x64b5f6, 0xffd54f, 0x81c784, 0xba68c8, 0xff8a65];
  goods.forEach((c, i) => {
    const row = i < 3 ? 0.68 : 1.32;
    const col = (i % 3) - 1;
    add(g, new THREE.BoxGeometry(0.28, 0.28, 0.28), mat(c), col * 0.48, row, 0);
  });
  g.position.set(x, 0, z);
  group.add(g);
  colliders.push({ x, z, r: 0.7 });
}

export function makeCup(group, x, z, lift = 0) {
  const g = new THREE.Group();
  const cup = add(g, new THREE.CylinderGeometry(0.08, 0.07, 0.14, 10), mat(0xfff8e1), 0, 0.86, 0);
  cup.castShadow = false;
  g.position.set(x, lift, z);
  group.add(g);
}

function paintCanvas(w, h, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function makeCoffeeMachine(group, x, z) {
  const g = new THREE.Group();
  const body = add(g, new THREE.BoxGeometry(0.48, 0.5, 0.36), mat(0x37474f, { roughness: 0.4, metalness: 0.28 }), 0, 0.28, 0);
  body.castShadow = false;
  const top = add(g, new THREE.BoxGeometry(0.5, 0.06, 0.38), mat(0x263238, { metalness: 0.35 }), 0, 0.55, 0);
  top.castShadow = false;
  const spout = add(g, new THREE.CylinderGeometry(0.045, 0.045, 0.14, 8), mat(0xb0bec5, { metalness: 0.5, roughness: 0.3 }), 0.1, 0.36, 0.16);
  spout.castShadow = false;
  const cup = add(g, new THREE.CylinderGeometry(0.07, 0.06, 0.1, 8), mat(0xfff8e1), 0.12, 0.12, 0.2);
  cup.castShadow = false;
  const light = add(g, new THREE.BoxGeometry(0.12, 0.05, 0.02), mat(0x66bb6a, { emissive: 0x2e7d32, emissiveIntensity: 0.4 }), -0.1, 0.4, 0.19);
  light.castShadow = false;
  g.position.set(x, 1.08, z);
  group.add(g);
}

export function makeMenuBoard(group, x, z, rotY, colliders) {
  const tex = paintCanvas(384, 512, (ctx) => {
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(0, 0, 384, 512);
    ctx.fillStyle = '#efebe9';
    ctx.fillRect(18, 18, 348, 476);
    ctx.fillStyle = '#4e342e';
    ctx.font = 'bold 64px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Menu', 192, 100);
    ctx.font = '36px sans-serif';
    ctx.textAlign = 'left';
    const rows = [['Latte', '4'], ['Tea', '3'], ['Water', '2'], ['Muffin', '3']];
    rows.forEach((row, i) => {
      const y = 190 + i * 72;
      ctx.fillStyle = '#4e342e';
      ctx.fillText(row[0], 48, y);
      ctx.textAlign = 'right';
      ctx.fillText(row[1], 330, y);
      ctx.textAlign = 'left';
      ctx.strokeStyle = '#bcaaa4';
      ctx.beginPath();
      ctx.moveTo(48, y + 16);
      ctx.lineTo(336, y + 16);
      ctx.stroke();
    });
  });
  const g = new THREE.Group();
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(1.05, 1.4),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 })
  );
  board.position.y = 1.65;
  board.castShadow = false;
  g.add(board);
  add(g, new THREE.BoxGeometry(1.12, 0.08, 0.08), mat(0x5d4037), 0, 0.92, -0.02);
  add(g, new THREE.CylinderGeometry(0.05, 0.05, 0.9, 8), mat(0x6d4c41), 0, 0.45, 0);
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  group.add(g);
  if (colliders) colliders.push({ x, z, r: 0.32 });
}

export function makePlant(group, x, z, colliders) {
  const g = new THREE.Group();
  const pot = add(g, new THREE.CylinderGeometry(0.18, 0.14, 0.28, 8), mat(0xa1887f), 0, 0.16, 0);
  pot.castShadow = false;
  const leaf = add(g, new THREE.SphereGeometry(0.32, 10, 8), mat(0x2e7d32), 0, 0.52, 0);
  leaf.castShadow = false;
  const leaf2 = add(g, new THREE.SphereGeometry(0.2, 8, 8), mat(0x43a047), 0.16, 0.62, 0.08);
  leaf2.castShadow = false;
  g.position.set(x, 0, z);
  group.add(g);
  if (colliders) colliders.push({ x, z, r: 0.28 });
}

export function makeFountain(group, x, z, colliders) {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(1.15, 1.25, 0.38, 16), mat(0x90a4ae, { roughness: 0.55 }), 0, 0.2, 0);
  const water = add(g, new THREE.CylinderGeometry(0.92, 0.92, 0.08, 16), mat(0x4fc3f7, { roughness: 0.18, metalness: 0.08, emissive: 0x0288d1, emissiveIntensity: 0.12 }), 0, 0.38, 0);
  water.castShadow = false;
  add(g, new THREE.CylinderGeometry(0.16, 0.2, 0.7, 8), mat(0xb0bec5), 0, 0.7, 0);
  const spray = add(g, new THREE.SphereGeometry(0.16, 8, 8), mat(0xe1f5fe, { emissive: 0xb3e5fc, emissiveIntensity: 0.35 }), 0, 1.12, 0);
  spray.castShadow = false;
  g.position.set(x, 0, z);
  group.add(g);
  colliders.push({ x, z, r: 1.2 });
}

export function makeFlowerBed(group, x, z, rotY, colliders) {
  const g = new THREE.Group();
  const soil = add(g, new THREE.BoxGeometry(2.2, 0.16, 0.9), mat(0x6d4c41), 0, 0.1, 0);
  soil.castShadow = false;
  const colors = [0xf48fb1, 0xfff176, 0xce93d8, 0xffab91, 0xffffff, 0xf06292];
  colors.forEach((c, i) => {
    const bloom = add(
      g,
      new THREE.SphereGeometry(0.12, 7, 6),
      mat(c),
      -0.85 + (i % 3) * 0.85,
      0.26,
      (i < 3 ? -0.18 : 0.18)
    );
    bloom.castShadow = false;
  });
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  group.add(g);
  if (colliders) colliders.push({ x, z, r: 0.85 });
}

export function makeLamp(group, x, z, colliders) {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(0.06, 0.08, 2.15, 8), mat(0x455a64), 0, 1.08, 0);
  const lamp = add(g, new THREE.SphereGeometry(0.2, 10, 8), mat(0xfff8e1, { emissive: 0xffe082, emissiveIntensity: 0.55, roughness: 0.4 }), 0, 2.22, 0);
  lamp.castShadow = false;
  g.position.set(x, 0, z);
  group.add(g);
  colliders.push({ x, z, r: 0.22 });
}

export function makeTeacherDesk(group, x, z, colliders) {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(2.1, 0.1, 0.85), mat(0x8d6e63), 0, 0.78, 0);
  add(g, new THREE.BoxGeometry(2.0, 0.68, 0.1), mat(0x6d4c41), 0, 0.38, -0.34);
  const book = add(g, new THREE.BoxGeometry(0.34, 0.06, 0.24), mat(0x5c6bc0), -0.55, 0.86, 0.08);
  book.castShadow = false;
  g.position.set(x, 0, z);
  group.add(g);
  colliders.push({ x, z, r: 1.05 });
}

export function makeClock(group, x, z, rotY) {
  const tex = paintCanvas(256, 256, (ctx) => {
    ctx.clearRect(0, 0, 256, 256);
    ctx.fillStyle = '#fafafa';
    ctx.beginPath();
    ctx.arc(128, 128, 112, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#455a64';
    ctx.lineWidth = 10;
    ctx.stroke();
    ctx.fillStyle = '#37474f';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.arc(128 + Math.cos(a) * 88, 128 + Math.sin(a) * 88, i % 3 === 0 ? 6 : 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#263238';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(128, 128);
    ctx.lineTo(128 + Math.cos(-Math.PI / 2 + Math.PI / 3) * 48, 128 + Math.sin(-Math.PI / 2 + Math.PI / 3) * 48);
    ctx.stroke();
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(128, 128);
    ctx.lineTo(128 + Math.cos(-Math.PI / 3) * 72, 128 + Math.sin(-Math.PI / 3) * 72);
    ctx.stroke();
  });
  const face = new THREE.Mesh(
    new THREE.CircleGeometry(0.42, 20),
    new THREE.MeshBasicMaterial({ map: tex })
  );
  face.position.set(x, 2.55, z);
  face.rotation.y = rotY;
  group.add(face);
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.42, 0.035, 6, 20),
    mat(0x546e7a)
  );
  rim.position.copy(face.position);
  rim.rotation.y = rotY;
  rim.castShadow = false;
  group.add(rim);
}

export function makeClothesRack(group, x, z, rotY, colliders) {
  const g = new THREE.Group();
  const metal = mat(0x78909c, { metalness: 0.45, roughness: 0.35 });
  add(g, new THREE.CylinderGeometry(0.04, 0.04, 1.5, 8), metal, -0.7, 0.75, 0);
  add(g, new THREE.CylinderGeometry(0.04, 0.04, 1.5, 8), metal, 0.7, 0.75, 0);
  add(g, new THREE.CylinderGeometry(0.035, 0.035, 1.5, 8), metal, 0, 1.48, 0).rotation.z = Math.PI / 2;
  const colors = [0x42a5f5, 0xec407a, 0xffb74d, 0x26a69a];
  colors.forEach((c, i) => {
    const shirt = add(g, new THREE.BoxGeometry(0.28, 0.55, 0.08), mat(c), -0.48 + i * 0.32, 1.12, 0);
    shirt.castShadow = false;
  });
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  group.add(g);
  colliders.push({ x, z, r: 0.7 });
}

export function makePriceSign(group, x, z, title, price, rotY, colliders) {
  const tex = paintCanvas(384, 192, (ctx) => {
    ctx.fillStyle = '#fff8e1';
    ctx.fillRect(0, 0, 384, 192);
    ctx.strokeStyle = '#ef6c00';
    ctx.lineWidth = 12;
    ctx.strokeRect(8, 8, 368, 176);
    ctx.fillStyle = '#e65100';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(price, 192, 68);
    ctx.fillStyle = '#4e342e';
    ctx.font = '32px sans-serif';
    ctx.fillText(title, 192, 128);
  });
  const g = new THREE.Group();
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(0.72, 0.36),
    new THREE.MeshBasicMaterial({ map: tex })
  );
  board.position.y = 1.35;
  g.add(board);
  add(g, new THREE.CylinderGeometry(0.035, 0.035, 1.2, 6), mat(0x8d6e63), 0, 0.6, 0);
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  group.add(g);
  if (colliders) colliders.push({ x, z, r: 0.2 });
  return g;
}

/** A glowing ring. No collider, so you can walk through it. */
export function makePortal(group, x, z) {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.92, 0.07, 8, 28),
    new THREE.MeshStandardMaterial({
      color: 0x80deea,
      emissive: 0x26c6da,
      emissiveIntensity: 0.85,
      roughness: 0.28,
      metalness: 0.05,
    })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.12;
  g.add(ring);
  const glow = new THREE.Mesh(
    new THREE.RingGeometry(0.45, 0.82, 28),
    new THREE.MeshBasicMaterial({
      color: 0xb2ebf2,
      transparent: true,
      opacity: 0.38,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.14;
  g.add(glow);
  g.position.set(x, 0, z);
  g.userData.ring = ring;
  g.userData.glow = glow;
  group.add(g);
  return g;
}

/** Stage platform, curtains, lectern, and two lights. Cast stand on the marks. */
export function makeStage(group, x, z, colliders) {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(10.5, 0.28, 4.2), mat(0x4e342e), 0, 0.14, 0);
  add(g, new THREE.BoxGeometry(0.35, 3.1, 0.45), mat(0xb71c1c), -5.1, 1.7, 0.2);
  add(g, new THREE.BoxGeometry(0.35, 3.1, 0.45), mat(0xb71c1c), 5.1, 1.7, 0.2);
  add(g, new THREE.BoxGeometry(10.6, 0.45, 0.35), mat(0xc62828), 0, 3.15, 0.15);
  add(g, new THREE.BoxGeometry(0.7, 1.05, 0.5), mat(0x5d4037), 2.4, 0.8, 0.7);
  add(g, new THREE.BoxGeometry(0.9, 0.08, 0.55), mat(0xd7ccc8), 2.4, 1.35, 0.7);
  const bulb = mat(0xfff59d, { emissive: 0xffee58, emissiveIntensity: 0.7 });
  add(g, new THREE.SphereGeometry(0.16, 10, 8), bulb, -2.4, 3.35, 1.3);
  add(g, new THREE.SphereGeometry(0.16, 10, 8), bulb, 2.4, 3.35, 1.3);
  add(g, new THREE.CylinderGeometry(0.05, 0.05, 0.9, 6), mat(0x455a64), -2.4, 2.85, 1.3);
  add(g, new THREE.CylinderGeometry(0.05, 0.05, 0.9, 6), mat(0x455a64), 2.4, 2.85, 1.3);
  g.position.set(x, 0, z);
  group.add(g);
  if (colliders) {
    colliders.push({ x: x - 5.1, z, r: 0.4 });
    colliders.push({ x: x + 5.1, z, r: 0.4 });
    colliders.push({ x: x + 2.4, z: z + 0.7, r: 0.45 });
  }
  return g;
}

/** Door board. Call set() whenever the show changes. */
export function makeShowBoard(group, x, z) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 1.5),
    new THREE.MeshBasicMaterial({ map: tex })
  );
  board.position.set(x, 2.15, z);
  group.add(board);
  const back = board.clone();
  back.position.z = z - 0.04;
  back.rotation.y = Math.PI;
  group.add(back);
  add(group, new THREE.CylinderGeometry(0.06, 0.06, 2.1, 8), mat(0x37474f), x, 1.05, z);
  function fit(text, size, y, color) {
    ctx.fillStyle = color;
    let font = size;
    ctx.font = `bold ${font}px sans-serif`;
    const wide = ctx.measureText(text).width;
    if (wide > 470) font = Math.max(22, Math.floor(size * 470 / wide));
    ctx.font = `bold ${font}px sans-serif`;
    ctx.fillText(text, 256, y);
  }
  return {
    set(lines) {
      ctx.fillStyle = '#1a237e';
      ctx.fillRect(0, 0, 512, 320);
      ctx.fillStyle = '#ffe082';
      ctx.fillRect(0, 0, 512, 14);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      fit(lines[0] || '', 34, 58, '#ffe082');
      fit(lines[1] || '', 40, 128, '#ffffff');
      fit(lines[2] || '', 30, 200, '#b2ebf2');
      fit(lines[3] || '', 34, 262, '#ffffff');
      tex.needsUpdate = true;
    },
  };
}

/** A small stage spot with a readable "Skit" sign. No collider, so you can stand on it. */
export function makeSkitSpot(group, x, z) {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(0.72, 0.82, 0.06, 18), mat(0x5c6bc0), 0, 0.04, 0);
  add(g, new THREE.CylinderGeometry(0.28, 0.34, 0.1, 12), mat(0xffd54f), 0, 0.12, 0);
  const tex = paintCanvas(256, 128, (ctx) => {
    ctx.fillStyle = '#283593';
    ctx.fillRect(0, 0, 256, 128);
    ctx.fillStyle = '#fff8e1';
    ctx.font = 'bold 54px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Skit', 128, 64);
  });
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(0.72, 0.36),
    new THREE.MeshBasicMaterial({ map: tex })
  );
  sign.position.set(0, 1.15, 0.02);
  g.add(sign);
  const back = sign.clone();
  back.position.z = -0.02;
  back.rotation.y = Math.PI;
  g.add(back);
  add(g, new THREE.CylinderGeometry(0.04, 0.04, 0.7, 6), mat(0x3949ab), 0, 0.55, 0);
  g.position.set(x, 0, z);
  group.add(g);
  return g;
}

const rehearsalWood = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.86, metalness: 0.02 });
const rehearsalTop = new THREE.MeshStandardMaterial({ color: 0xeceff1, roughness: 0.7, metalness: 0.04 });
const mirrorFrame = new THREE.MeshStandardMaterial({ color: 0x455a64, roughness: 0.42, metalness: 0.38 });
const mirrorGlass = new THREE.MeshStandardMaterial({
  color: 0xb3e5fc,
  roughness: 0.06,
  metalness: 0.72,
  transparent: true,
  opacity: 0.5,
});

/** A desk and a mirror for the private room. Materials are shared, not per visit. */
export function makeRehearsalDesk(group, x, z, rotY, colliders) {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(1.8, 0.08, 0.72), rehearsalTop, 0, 0.78, 0);
  add(g, new THREE.BoxGeometry(1.7, 0.68, 0.08), rehearsalWood, 0, 0.4, -0.28);
  g.position.set(x, 0, z);
  g.rotation.y = rotY || 0;
  group.add(g);
  if (colliders) colliders.push({ x, z, r: 0.75 });
}

export function makeMirror(group, x, z, rotY, colliders) {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(1.55, 1.9, 0.08), mirrorFrame, 0, 1.35, 0);
  const glass = add(g, new THREE.PlaneGeometry(1.28, 1.6), mirrorGlass, 0, 1.38, 0.05);
  glass.castShadow = false;
  g.position.set(x, 0, z);
  g.rotation.y = rotY || 0;
  group.add(g);
  if (colliders) colliders.push({ x, z, r: 0.4 });
}

export function makeFloor(scene, x, z, w, d, color) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshStandardMaterial({ color, roughness: 0.95, metalness: 0 })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, 0.02, z);
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}
