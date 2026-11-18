import * as THREE from 'three';
import { ZONES, WORLD_LIMIT } from './zones.js';
import {
  makeBench, makeChair, makeCounter, makeCup, makeDesk, makeFloor,
  makeShelf, makeTable, makeTree, makeWhiteboard,
} from './props.js';

export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xb3e5fc);
  scene.fog = new THREE.Fog(0xb3e5fc, 28, 62);

  const hemi = new THREE.HemisphereLight(0xe3f2fd, 0x8d6e63, 0.75);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff8e1, 1.15);
  sun.position.set(12, 22, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 60;
  sun.shadow.camera.left = -30;
  sun.shadow.camera.right = 30;
  sun.shadow.camera.top = 30;
  sun.shadow.camera.bottom = -30;
  scene.add(sun);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD_LIMIT * 2 + 2, WORLD_LIMIT * 2 + 2),
    new THREE.MeshStandardMaterial({ color: 0xd7ccc8, roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  for (const zone of ZONES) {
    const w = zone.maxX - zone.minX;
    const d = zone.maxZ - zone.minZ;
    makeFloor(scene, (zone.minX + zone.maxX) / 2, (zone.minZ + zone.maxZ) / 2, w, d, zone.floor);
  }

  const colliders = [];
  const props = new THREE.Group();
  scene.add(props);

  // Cafe
  makeCounter(props, -20.2, -12, 7, 0, colliders, 0x6d4c41);
  makeCup(props, -20.2, -10.6);
  makeCup(props, -20.2, -13.4);
  makeTable(props, -7, -18, colliders);
  makeChair(props, -7, -17.2, 0);
  makeChair(props, -7.8, -18.6, Math.PI);
  makeTable(props, -16, -6.5, colliders, 0xbcaaa4);
  makeChair(props, -15.2, -6.5, Math.PI / 2);

  // Park
  makeTree(props, 18.5, -18.5, colliders, 0x2e7d32);
  makeTree(props, 6.2, -19, colliders, 0x388e3c);
  makeTree(props, 20, -6.5, colliders, 0x43a047);
  makeTree(props, 7, -6, colliders, 0x1b5e20);
  makeBench(props, 8.5, -15.5, 0.4, colliders);
  makeBench(props, 16, -8, -0.6, colliders);

  // Classroom
  makeWhiteboard(props, -12, 21.4);
  colliders.push({ x: -12, z: 21.2, r: 1.1 });
  makeDesk(props, -16.5, 15.5, colliders);
  makeDesk(props, -8, 15.5, colliders);
  makeDesk(props, -16.5, 18.6, colliders);
  makeDesk(props, -8, 18.6, colliders);

  // Shop
  makeCounter(props, 12, 7.2, 6.5, 0, colliders, 0xef6c00);
  makeShelf(props, 7, 20.2, colliders);
  makeShelf(props, 12, 20.2, colliders);
  makeShelf(props, 17, 20.2, colliders);

  // Low walls at the world edge so the boundary reads clearly.
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x90a4ae, roughness: 0.9 });
  const edge = WORLD_LIMIT;
  const wallH = 0.55;
  [
    [0, -edge, edge * 2, 0.3],
    [0, edge, edge * 2, 0.3],
    [-edge, 0, 0.3, edge * 2],
    [edge, 0, 0.3, edge * 2],
  ].forEach(([x, z, w, d]) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, wallH, d), wallMat);
    wall.position.set(x, wallH / 2, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);
  });

  addZoneSigns(scene);

  return { scene, colliders };
}

function addZoneSigns(scene) {
  const spots = [
    { text: 'Cafe', sub: 'Order and chat', x: -3.4, z: -10, color: '#6d4c41' },
    { text: 'Park', sub: 'Walk and talk', x: 3.4, z: -10, color: '#2e7d32' },
    { text: 'Classroom', sub: 'Practice English', x: -3.4, z: 10, color: '#5e35b1' },
    { text: 'Shop', sub: 'Ask and buy', x: 3.4, z: 10, color: '#ef6c00' },
  ];
  for (const spot of spots) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(16,32,39,0.9)';
    roundSign(ctx, 16, 28, 480, 180, 28);
    ctx.fill();
    ctx.fillStyle = spot.color;
    ctx.fillRect(16, 28, 18, 180);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 72px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(spot.text, 270, 100);
    ctx.fillStyle = '#ffe082';
    ctx.font = '36px sans-serif';
    ctx.fillText(spot.sub, 270, 162);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const board = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 1.2),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
    );
    board.position.set(spot.x, 2.35, spot.z);
    board.lookAt(0, 2.35, 0);
    scene.add(board);
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 2.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x546e7a, roughness: 0.8 })
    );
    post.position.set(spot.x, 1.1, spot.z);
    post.castShadow = true;
    scene.add(post);
  }
}

function roundSign(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
