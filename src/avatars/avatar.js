import * as THREE from 'three';
import { makeNameTag, paintNameTag } from './nametag.js';
import { makeSpeechBubble } from './speechbubble.js';

/**
 * Stylized third-person body. Shared geometries; materials are shared for NPCs
 * and unique for the player so fading the player does not fade everyone else.
 * Local +Z is the facing direction.
 */

const GEOS = {
  torso: new THREE.CapsuleGeometry(0.33, 0.4, 4, 8),
  head: new THREE.SphereGeometry(0.27, 16, 12),
  nose: new THREE.SphereGeometry(0.045, 8, 6),
  eyeWhite: new THREE.SphereGeometry(0.055, 8, 6),
  pupil: new THREE.SphereGeometry(0.028, 8, 6),
  mouth: new THREE.SphereGeometry(0.055, 8, 6),
  arm: new THREE.CapsuleGeometry(0.085, 0.32, 3, 6),
  leg: new THREE.CapsuleGeometry(0.1, 0.32, 3, 6),
  hairCap: new THREE.SphereGeometry(0.29, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.52),
  hairBob: new THREE.SphereGeometry(0.2, 10, 8),
  spike: new THREE.ConeGeometry(0.07, 0.22, 5),
  bun: new THREE.SphereGeometry(0.11, 8, 8),
  jacket: new THREE.BoxGeometry(0.78, 0.28, 0.46),
  apron: new THREE.BoxGeometry(0.46, 0.5, 0.05),
  hatBrim: new THREE.CylinderGeometry(0.32, 0.32, 0.035, 12),
  hatTop: new THREE.CylinderGeometry(0.15, 0.17, 0.16, 10),
  glass: new THREE.TorusGeometry(0.062, 0.01, 6, 12),
  bridge: new THREE.BoxGeometry(0.09, 0.012, 0.012),
  ring: new THREE.RingGeometry(0.4, 0.58, 28),
};

const MATS = new Map();

function mat(key, props, unique) {
  if (!unique) {
    const cached = MATS.get(key);
    if (cached) return cached;
  }
  const material = new THREE.MeshStandardMaterial(props);
  if (!unique) MATS.set(key, material);
  return material;
}

function shade(hex, amount) {
  const color = new THREE.Color(hex);
  color.multiplyScalar(amount);
  return color.getHex();
}

function buildHair(style, material) {
  const group = new THREE.Group();
  group.name = 'hair';
  const cap = new THREE.Mesh(GEOS.hairCap, material);
  cap.position.y = 0.03;
  cap.castShadow = true;
  group.add(cap);
  if (style === 'bob') {
    const back = new THREE.Mesh(GEOS.hairBob, material);
    back.position.set(0, -0.04, -0.1);
    back.scale.set(1.35, 0.85, 0.7);
    group.add(back);
  } else if (style === 'spiky') {
    const spots = [[-0.1, 0.2, 0.04], [0.1, 0.22, 0.02], [0, 0.24, -0.06]];
    for (const [x, y, z] of spots) {
      const spike = new THREE.Mesh(GEOS.spike, material);
      spike.position.set(x, y, z);
      spike.rotation.z = x * 1.2;
      spike.rotation.x = z * -1.4;
      group.add(spike);
    }
  } else if (style === 'bun') {
    const bun = new THREE.Mesh(GEOS.bun, material);
    bun.position.set(0, 0.22, -0.08);
    group.add(bun);
  }
  return group;
}

export function createAvatar(def) {
  const look = def.look || {};
  const unique = !!def.unique;
  const color = def.color;
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const cloth = mat(`cloth-${color}`, { color, roughness: 0.62, metalness: 0.02 }, unique);
  const skin = mat(`skin-${def.accent || 0xffe0bd}`, { color: def.accent || 0xffe0bd, roughness: 0.6 }, unique);
  const dark = mat('dark', { color: 0x263238, roughness: 0.45 }, unique);
  const legMat = mat('legs', { color: 0x37474f, roughness: 0.8 }, unique);
  const mouthMat = mat('mouth', { color: 0xc47a6a, roughness: 0.55 }, unique);
  const white = mat('eye-white', { color: 0xfff8f2, roughness: 0.4 }, unique);
  const hairColor = look.hairColor == null ? 0x3e2723 : look.hairColor;
  const hairMat = mat(`hair-${hairColor}`, { color: hairColor, roughness: 0.7 }, unique);

  const torso = new THREE.Mesh(GEOS.torso, cloth);
  torso.position.y = 1.02;
  torso.castShadow = true;
  body.add(torso);

  let jacket = null;
  if (look.outfit === 'jacket') {
    const jacketMat = mat(
      `jacket-${shade(color, 0.72)}`,
      { color: shade(color, 0.72), roughness: 0.55 },
      unique,
    );
    jacket = new THREE.Mesh(GEOS.jacket, jacketMat);
    jacket.position.set(0, 1.22, -0.02);
    jacket.castShadow = true;
    body.add(jacket);
  }

  if (look.apron) {
    const apronColor = look.apronColor == null ? 0xd7ccc8 : look.apronColor;
    const apronMat = mat(`apron-${apronColor}`, { color: apronColor, roughness: 0.75 }, unique);
    const apron = new THREE.Mesh(GEOS.apron, apronMat);
    apron.position.set(0, 0.92, 0.2);
    apron.castShadow = true;
    body.add(apron);
  }

  const head = new THREE.Mesh(GEOS.head, skin);
  head.position.y = 1.66;
  head.castShadow = true;
  body.add(head);

  const nose = new THREE.Mesh(GEOS.nose, skin);
  nose.position.set(0, -0.02, 0.25);
  head.add(nose);

  const eyes = new THREE.Group();
  eyes.position.y = 0.06;
  const eyeL = new THREE.Mesh(GEOS.eyeWhite, white);
  const eyeR = new THREE.Mesh(GEOS.eyeWhite, white);
  eyeL.position.set(-0.09, 0, 0.2);
  eyeR.position.set(0.09, 0, 0.2);
  const pupilL = new THREE.Mesh(GEOS.pupil, dark);
  const pupilR = new THREE.Mesh(GEOS.pupil, dark);
  pupilL.position.set(-0.09, 0, 0.24);
  pupilR.position.set(0.09, 0, 0.24);
  eyes.add(eyeL, eyeR, pupilL, pupilR);
  head.add(eyes);

  const mouth = new THREE.Mesh(GEOS.mouth, mouthMat);
  mouth.position.set(0, -0.1, 0.23);
  mouth.scale.set(1, 0.28, 0.5);
  head.add(mouth);

  const hairStyle = look.hair || 'short';
  const hair = buildHair(hairStyle, hairMat);
  head.add(hair);

  if (look.hat) {
    const hatColor = look.hatColor == null ? 0x5d4037 : look.hatColor;
    const hatMat = mat(`hat-${hatColor}`, { color: hatColor, roughness: 0.7 }, unique);
    const hat = new THREE.Group();
    const brim = new THREE.Mesh(GEOS.hatBrim, hatMat);
    const top = new THREE.Mesh(GEOS.hatTop, hatMat);
    brim.position.y = 0.24;
    top.position.y = 0.34;
    hat.add(brim, top);
    head.add(hat);
  }

  if (look.glasses) {
    const glassMat = mat('glass', { color: 0x263238, roughness: 0.3, metalness: 0.2 }, unique);
    const glasses = new THREE.Group();
    const left = new THREE.Mesh(GEOS.glass, glassMat);
    const right = new THREE.Mesh(GEOS.glass, glassMat);
    const bridge = new THREE.Mesh(GEOS.bridge, glassMat);
    left.position.set(-0.09, 0.06, 0.25);
    right.position.set(0.09, 0.06, 0.25);
    bridge.position.set(0, 0.06, 0.26);
    glasses.add(left, right, bridge);
    head.add(glasses);
  }

  const armL = new THREE.Mesh(GEOS.arm, cloth);
  const armR = new THREE.Mesh(GEOS.arm, cloth);
  armL.position.set(-0.42, 1.04, 0);
  armR.position.set(0.42, 1.04, 0);
  armL.castShadow = armR.castShadow = true;
  body.add(armL, armR);

  const legL = new THREE.Mesh(GEOS.leg, legMat);
  const legR = new THREE.Mesh(GEOS.leg, legMat);
  legL.position.set(-0.15, 0.38, 0);
  legR.position.set(0.15, 0.38, 0);
  legL.castShadow = legR.castShadow = true;
  body.add(legL, legR);

  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x80d8ff,
    transparent: true,
    opacity: 0.45,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(GEOS.ring, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.04;
  ring.visible = false;
  ring.userData.speakRing = true;
  root.add(ring);

  const tag = makeNameTag(def.name, def.kind);
  tag.position.y = 2.32;
  const bubble = makeSpeechBubble();
  bubble.position.y = 2.9;
  root.add(tag, bubble);

  return {
    root,
    body,
    head,
    eyes,
    mouth,
    hair,
    hairMat,
    hairStyle,
    torso,
    armL,
    armR,
    jacket,
    legL,
    legR,
    ring,
    bubble,
    tag,
    name: def.name,
    kind: def.kind,
    unique,
  };
}

const HAIRS = new Set(['short', 'bob', 'spiky', 'bun']);

export function setAvatarLook(avatar, { color, hair, name } = {}) {
  if (color != null) {
    const cloth = mat(`cloth-${color}`, { color, roughness: 0.62, metalness: 0.02 }, avatar.unique);
    avatar.torso.material = cloth;
    avatar.armL.material = cloth;
    avatar.armR.material = cloth;
    if (avatar.jacket) {
      const jacketColor = shade(color, 0.72);
      avatar.jacket.material = mat(
        `jacket-${jacketColor}`,
        { color: jacketColor, roughness: 0.55 },
        avatar.unique,
      );
    }
  }
  if (hair && HAIRS.has(hair) && hair !== avatar.hairStyle) {
    if (avatar.hair) avatar.head.remove(avatar.hair);
    avatar.hair = buildHair(hair, avatar.hairMat);
    avatar.head.add(avatar.hair);
    avatar.hairStyle = hair;
  }
  if (name) {
    avatar.name = name;
    paintNameTag(avatar.tag, name, avatar.kind);
  }
}

export function animateAvatar(avatar, dt, moving, speed, state) {
  state.phase = (state.phase || 0) + dt * (moving ? 8 + speed : 1.6);
  const swing = moving ? Math.sin(state.phase) : 0;
  const breathe = Math.sin(state.phase * (moving ? 1 : 1.35)) * (moving ? 0.02 : 0.018);
  avatar.legL.rotation.x = swing * 0.75;
  avatar.legR.rotation.x = -swing * 0.75;
  avatar.body.position.y = (moving ? Math.abs(Math.sin(state.phase)) * 0.07 : 0) + breathe;

  const posing = state.react === 'wave' || state.react === 'phone' || state.react === 'stretch';
  if (!posing) {
    avatar.armL.rotation.x = -swing * 0.55;
    avatar.armR.rotation.x = swing * 0.55;
    avatar.armL.rotation.z += (0 - avatar.armL.rotation.z) * 0.2;
    avatar.armR.rotation.z += (0 - avatar.armR.rotation.z) * 0.2;
  } else if (state.react === 'wave') {
    avatar.armL.rotation.x = -swing * 0.2;
  }

  if (state.speaking && !posing && state.react !== 'jump') {
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
    if (state.reactT <= 0) clearPose(avatar, state);
  } else if (state.react === 'phone') {
    state.reactT -= dt;
    avatar.armR.rotation.x = -1.25;
    avatar.armR.rotation.z = -0.45;
    avatar.head.rotation.x = 0.42;
    if (state.reactT <= 0) clearPose(avatar, state);
  } else if (state.react === 'stretch') {
    state.reactT -= dt;
    const k = Math.sin(Math.min(1, Math.max(state.reactT, 0) / 1.6) * Math.PI);
    avatar.armL.rotation.x = -2.2 * k;
    avatar.armR.rotation.x = -2.2 * k;
    avatar.armL.rotation.z = 0.35 * k;
    avatar.armR.rotation.z = -0.35 * k;
    avatar.head.rotation.x = -0.15 * k;
    if (state.reactT <= 0) clearPose(avatar, state);
  } else {
    avatar.head.rotation.x *= 0.86;
  }

  state.blinkIn = (state.blinkIn == null ? 1.6 + Math.random() * 2.4 : state.blinkIn) - dt;
  let eyeScale = 1;
  if (state.blinkIn < 0.14) eyeScale = Math.max(0.08, state.blinkIn / 0.14);
  if (state.blinkIn <= 0) state.blinkIn = 2.2 + Math.random() * 3.2;
  if (avatar.eyes) avatar.eyes.scale.y = eyeScale;

  if (avatar.mouth) {
    const open = state.speaking ? 0.35 + Math.abs(Math.sin(state.phase * 14)) * 0.9 : 0.28;
    avatar.mouth.scale.y = open;
  }
  if (avatar.ring) {
    const cue = !!state.cue && !state.speaking;
    const on = !!state.speaking || !!state.cue;
    avatar.ring.visible = on;
    if (on) {
      const pulse = 1 + Math.sin(state.phase * (cue ? 3 : 5)) * (cue ? 0.12 : 0.08);
      avatar.ring.scale.set(pulse, pulse, 1);
      avatar.ring.material.color.setHex(cue ? 0xffe082 : 0x80d8ff);
      avatar.ring.material.opacity = cue ? 0.62 : 0.45;
    }
  }
}

function clearPose(avatar, state) {
  state.react = null;
  avatar.armL.rotation.x = 0;
  avatar.armR.rotation.x = 0;
  avatar.armL.rotation.z = 0;
  avatar.armR.rotation.z = 0;
  avatar.head.rotation.x = 0;
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

export function setAvatarOpacity(avatar, opacity) {
  const next = opacity < 0.98 ? opacity : 1;
  if (avatar.root.userData.fade === next) return;
  avatar.root.userData.fade = next;
  const faded = next < 1;
  avatar.root.traverse((obj) => {
    if (!obj.isMesh || !obj.material || obj.userData.speakRing) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const material of mats) {
      material.opacity = next;
      material.transparent = faded || material.userData.keepTransparent;
      material.depthWrite = !faded;
    }
  });
}

export function triggerReact(state, kind) {
  if (kind === 'jump') {
    state.react = 'jump';
    state.reactT = 0.5;
  } else if (kind === 'wave') {
    state.react = 'wave';
    state.reactT = 0.9;
  } else if (kind === 'phone') {
    state.react = 'phone';
    state.reactT = 2.1;
  } else if (kind === 'stretch') {
    state.react = 'stretch';
    state.reactT = 1.6;
  } else {
    state.react = 'nod';
    state.reactT = 0.7;
  }
}
