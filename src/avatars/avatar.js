import * as THREE from 'three';
import { makeNameTag } from './nametag.js';
import { makeSpeechBubble } from './speechbubble.js';

/**
 * Stylized third-person body made of capsules, spheres, and boxes.
 * Local +Z is the facing direction.
 */
export function createAvatar({ name, kind, color, accent }) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const cloth = new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.02 });
  const skin = new THREE.MeshStandardMaterial({ color: accent || 0xffe0bd, roughness: 0.65 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x263238, roughness: 0.5 });

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.46, 4, 8), cloth);
  torso.position.y = 1.05;
  torso.castShadow = true;
  body.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 12), skin);
  head.position.y = 1.62;
  head.castShadow = true;
  body.add(head);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), skin);
  nose.position.set(0, 1.6, 0.22);
  body.add(nose);
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), dark);
  const eyeR = eyeL.clone();
  eyeL.position.set(-0.08, 1.66, 0.2);
  eyeR.position.set(0.08, 1.66, 0.2);
  body.add(eyeL, eyeR);

  const armGeo = new THREE.CapsuleGeometry(0.07, 0.36, 3, 6);
  const armL = new THREE.Mesh(armGeo, cloth);
  const armR = new THREE.Mesh(armGeo, cloth);
  armL.position.set(-0.38, 1.08, 0);
  armR.position.set(0.38, 1.08, 0);
  armL.castShadow = armR.castShadow = true;
  body.add(armL, armR);

  const legGeo = new THREE.CapsuleGeometry(0.09, 0.38, 3, 6);
  const legMat = new THREE.MeshStandardMaterial({ color: 0x37474f, roughness: 0.8 });
  const legL = new THREE.Mesh(legGeo, legMat);
  const legR = new THREE.Mesh(legGeo, legMat);
  legL.position.set(-0.14, 0.42, 0);
  legR.position.set(0.14, 0.42, 0);
  legL.castShadow = legR.castShadow = true;
  body.add(legL, legR);

  const tag = makeNameTag(name, kind);
  const bubble = makeSpeechBubble();
  root.add(tag, bubble);

  return { root, body, head, armL, armR, legL, legR, bubble, tag, name };
}

export function animateAvatar(avatar, dt, moving, speed, state) {
  state.phase = (state.phase || 0) + dt * (moving ? 8 + speed : 1.6);
  const swing = moving ? Math.sin(state.phase) : 0;
  const breathe = Math.sin(state.phase * (moving ? 1 : 1.35)) * (moving ? 0.02 : 0.018);
  avatar.legL.rotation.x = swing * 0.75;
  avatar.legR.rotation.x = -swing * 0.75;
  avatar.body.position.y = (moving ? Math.abs(Math.sin(state.phase)) * 0.07 : 0) + breathe;

  const waving = state.react === 'wave';
  if (!waving) {
    avatar.armL.rotation.x = -swing * 0.55;
    avatar.armR.rotation.x = swing * 0.55;
    avatar.armL.rotation.z += (0 - avatar.armL.rotation.z) * 0.2;
    avatar.armR.rotation.z += (0 - avatar.armR.rotation.z) * 0.2;
  } else {
    avatar.armL.rotation.x = -swing * 0.2;
  }

  if (state.speaking && !waving && state.react !== 'jump') {
    const g = Math.sin(state.phase * 2.5);
    avatar.body.position.y += 0.045 * Math.sin(state.phase * 2.15);
    avatar.armR.rotation.x = -0.48 + g * 0.34;
    avatar.armL.rotation.x = -0.16 + Math.sin(state.phase * 1.8) * 0.16;
  }

  if (state.react === 'nod') {
    state.reactT -= dt;
    avatar.head.rotation.x = Math.sin(state.reactT * 14) * 0.4;
    if (state.reactT <= 0) state.react = null;
  } else if (state.react === 'jump') {
    state.reactT -= dt;
    const k = Math.max(state.reactT, 0) / 0.5;
    avatar.body.position.y += Math.sin((1 - k) * Math.PI) * 0.35;
    if (state.reactT <= 0) state.react = null;
  } else if (state.react === 'wave') {
    state.reactT -= dt;
    avatar.armR.rotation.x = -1.15;
    avatar.armR.rotation.z = -0.35 + Math.sin(state.reactT * 18) * 0.55;
    if (state.reactT <= 0) {
      state.react = null;
      avatar.armR.rotation.x = 0;
      avatar.armR.rotation.z = 0;
    }
  } else {
    avatar.head.rotation.x *= 0.86;
  }
}

/** Turn the head toward a world-space point. Body yaw stays on the root. */
export function lookHeadAt(avatar, x, z, dt) {
  const dx = x - avatar.root.position.x;
  const dz = z - avatar.root.position.z;
  let local = Math.atan2(dx, dz) - avatar.root.rotation.y;
  while (local > Math.PI) local -= Math.PI * 2;
  while (local < -Math.PI) local += Math.PI * 2;
  local = Math.max(-1.05, Math.min(1.05, local));
  const k = 1 - Math.exp(-8 * dt);
  avatar.head.rotation.y += (local - avatar.head.rotation.y) * k;
}

export function triggerReact(state, kind) {
  if (kind === 'jump') {
    state.react = 'jump';
    state.reactT = 0.5;
  } else if (kind === 'wave') {
    state.react = 'wave';
    state.reactT = 0.9;
  } else {
    state.react = 'nod';
    state.reactT = 0.7;
  }
}
