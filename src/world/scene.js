import * as THREE from 'three';
import { ZONES, WORLD_LIMIT } from './zones.js';
import { SKIT_SPOTS } from '../data/skits/index.js';
import {
  makeBench, makeChair, makeClock, makeClothesRack, makeCoffeeMachine, makeCounter,
  makeCup, makeDesk, makeFloor, makeFlowerBed, makeFountain, makeLamp, makeMenuBoard,
  makePlant, makePriceSign, makeShelf, makeSkitSpot, makeTable, makeTeacherDesk, makeTree, makeWhiteboard,
} from './props.js';

export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xc5e6f6);
  scene.fog = new THREE.Fog(0xc5e6f6, 18, 52);

  const hemi = new THREE.HemisphereLight(0xe7f4fc, 0x9a7b68, 0.92);
  hemi.castShadow = false;
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff6e4, 1.02);
  sun.position.set(14, 24, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.bias = -0.00035;
  sun.shadow.normalBias = 0.035;
  sun.shadow.camera.near = 2;
  sun.shadow.camera.far = 52;
  sun.shadow.camera.left = -26;
  sun.shadow.camera.right = 26;
  sun.shadow.camera.top = 26;
  sun.shadow.camera.bottom = -26;
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

  // Cafe — counter, machine, menu, plants, tables
  makeCounter(props, -20.2, -12, 7, 0, colliders, 0x6d4c41);
  makeCoffeeMachine(props, -18.3, -12.05);
  makeCup(props, -20.6, -11.75, 0.32);
  makeCup(props, -21.5, -12.3, 0.32);
  makeMenuBoard(props, -15.4, -9.4, Math.PI, colliders);
  makePlant(props, -21.4, -20.6, colliders);
  makePlant(props, -4.6, -20.4, colliders);
  makePlant(props, -4.8, -5.2, colliders);
  makeTable(props, -7, -18, colliders);
  makeChair(props, -7, -17.2, 0);
  makeChair(props, -7.8, -18.6, Math.PI);
  makeTable(props, -16, -6.5, colliders, 0xbcaaa4);
  makeChair(props, -15.2, -6.5, Math.PI / 2);

  // Park — trees, fountain, flowers, lamps, benches
  makeTree(props, 18.5, -18.5, colliders, 0x2e7d32);
  makeTree(props, 6.2, -19, colliders, 0x388e3c);
  makeTree(props, 20, -6.5, colliders, 0x43a047);
  makeTree(props, 7, -6, colliders, 0x1b5e20);
  makeFountain(props, 17.2, -14.6, colliders);
  makeFlowerBed(props, 9.4, -20.4, 0.2, colliders);
  makeFlowerBed(props, 20.4, -10.2, 0.8, colliders);
  makeLamp(props, 4.4, -4.4, colliders);
  makeLamp(props, 21.2, -4.6, colliders);
  makeLamp(props, 21.0, -21.2, colliders);
  makeBench(props, 8.5, -15.5, 0.4, colliders);
  makeBench(props, 16, -8, -0.6, colliders);

  // Classroom — board, teacher desk, clock, three rows of desks
  makeWhiteboard(props, -12, 21.4);
  colliders.push({ x: -12, z: 21.2, r: 1.1 });
  makeTeacherDesk(props, -19.4, 20.2, colliders);
  makeClock(props, -5.6, 21.55, Math.PI);
  makeDesk(props, -16.5, 13.1, colliders);
  makeDesk(props, -12.2, 13.1, colliders);
  makeDesk(props, -8, 13.1, colliders);
  makeDesk(props, -16.5, 15.8, colliders);
  makeDesk(props, -12.2, 15.8, colliders);
  makeDesk(props, -8, 15.8, colliders);
  makeDesk(props, -16.5, 18.6, colliders);
  makeDesk(props, -12.2, 18.6, colliders);
  makeDesk(props, -8, 18.6, colliders);

  // Shop — counter, shelves of boxes, clothes, price signs
  makeCounter(props, 12, 7.2, 6.5, 0, colliders, 0xef6c00);
  makeShelf(props, 7, 20.2, colliders);
  makeShelf(props, 12, 20.2, colliders);
  makeShelf(props, 17, 20.2, colliders);
  makeShelf(props, 21.2, 16.4, colliders);
  makeClothesRack(props, 19.6, 9.2, 0.4, colliders);
  makePriceSign(props, 8.2, 17.2, 'Jacket', '$48', 0.4, colliders);
  makePriceSign(props, 15.2, 8.4, 'Hat', '$12', -0.6, colliders);

  for (const spot of SKIT_SPOTS) makeSkitSpot(props, spot.x, spot.z);

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
