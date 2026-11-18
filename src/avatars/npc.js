import { animateAvatar, createAvatar, triggerReact } from './avatar.js';
import { blocked } from '../world/zones.js';
import { setBubbleText } from './speechbubble.js';

export function createNPC(def, anchor, colliders) {
  const avatar = createAvatar(def);
  const radius = 0.4;
  let x = anchor[0];
  let z = anchor[1];
  if (!def.wander) {
    x = anchor[0] + Math.sin(def.angle) * 1.85;
    z = anchor[1] + Math.cos(def.angle) * 1.85;
  }
  avatar.root.position.set(x, 0, z);
  const faceX = def.wander ? x + 1 : anchor[0];
  const faceZ = def.wander ? z : anchor[1];
  avatar.root.rotation.y = Math.atan2(faceX - x, faceZ - z);

  const state = {
    phase: Math.random() * 6,
    react: null,
    reactT: 0,
    bubbleUntil: 0,
    wanderTarget: null,
    baseX: x,
    baseZ: z,
  };

  function say(text, now) {
    setBubbleText(avatar.bubble, text);
    state.bubbleUntil = now + Math.min(4.2, 1.6 + text.length * 0.035);
  }

  function hideBubble(now) {
    if (avatar.bubble.visible && now > state.bubbleUntil) avatar.bubble.visible = false;
  }

  function face(tx, tz) {
    avatar.root.rotation.y = Math.atan2(tx - avatar.root.position.x, tz - avatar.root.position.z);
  }

  function update(dt, now, paused) {
    let moving = false;
    let speed = 0;
    if (def.wander && !paused) {
      const p = avatar.root.position;
      if (!state.wanderTarget || Math.hypot(state.wanderTarget.x - p.x, state.wanderTarget.z - p.z) < 0.35) {
        const home = def.home || [state.baseX, state.baseZ];
        state.wanderTarget = {
          x: home[0] + (Math.random() - 0.5) * def.roam * 2,
          z: home[1] + (Math.random() - 0.5) * def.roam * 2,
        };
      }
      const dx = state.wanderTarget.x - p.x;
      const dz = state.wanderTarget.z - p.z;
      const len = Math.hypot(dx, dz) || 1;
      speed = 0.7;
      const step = speed * dt;
      const nx = p.x + (dx / len) * step;
      const nz = p.z + (dz / len) * step;
      if (!blocked(nx, p.z, radius, colliders)) avatar.root.position.x = nx;
      if (!blocked(avatar.root.position.x, nz, radius, colliders)) avatar.root.position.z = nz;
      face(state.wanderTarget.x, state.wanderTarget.z);
      moving = true;
    }
    animateAvatar(avatar, dt, moving, speed, state);
    hideBubble(now);
  }

  return {
    def,
    avatar,
    say,
    face,
    update,
    react(kind) {
      triggerReact(state, kind);
    },
    distanceTo(x, z) {
      const p = avatar.root.position;
      return Math.hypot(p.x - x, p.z - z);
    },
  };
}
