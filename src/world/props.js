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

export function makeCup(group, x, z) {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(0.08, 0.07, 0.14, 10), mat(0xfff8e1), 0, 0.86, 0);
  g.position.set(x, 0, z);
  group.add(g);
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
