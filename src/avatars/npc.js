import { animateAvatar, createAvatar, lookHeadAt, triggerReact } from './avatar.js';
import { blocked, overlapAmount, pushOutOfBodies } from '../world/zones.js';
import { setBubbleText } from './speechbubble.js';

const SPAWN_CLEAR = 2;

function clearOfPlayerSpawn(x, z) {
  const dist = Math.hypot(x, z);
  if (dist >= SPAWN_CLEAR) return { x, z };
  const ang = dist < 1e-4 ? 0.9 : Math.atan2(z, x);
  return { x: Math.cos(ang) * SPAWN_CLEAR, z: Math.sin(ang) * SPAWN_CLEAR };
}

export function createNPC(def, anchor, colliders) {
  const avatar = createAvatar(def);
  const radius = 0.4;
  let x = anchor[0];
  let z = anchor[1];
  if (!def.wander) {
    x = anchor[0] + Math.sin(def.angle) * 1.85;
    z = anchor[1] + Math.cos(def.angle) * 1.85;
  } else {
    const spot = clearOfPlayerSpawn(x, z);
    x = spot.x;
    z = spot.z;
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
    goal: null,
    look: null,
    speaking: false,
    fidget: 4 + Math.random() * 8,
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

  function setGoal(x, z, faceX, faceZ) {
    state.goal = { x, z, faceX, faceZ };
  }

  function clearGoal() {
    state.goal = null;
  }

  function canStand(x, z, bodies) {
    if (blocked(x, z, radius, colliders)) return false;
    const before = overlapAmount(avatar.root.position.x, avatar.root.position.z, radius, bodies);
    const after = overlapAmount(x, z, radius, bodies);
    if (after <= 0) return true;
    return after < before - 1e-4;
  }

  function deeperIntoSpawn(x, z) {
    if (!def.wander || state.goal) return false;
    const next = Math.hypot(x, z);
    if (next >= SPAWN_CLEAR) return false;
    const cur = Math.hypot(avatar.root.position.x, avatar.root.position.z);
    return next <= cur + 1e-4;
  }

  function tryStep(nx, nz, bodies) {
    const p = avatar.root.position;
    let moved = false;
    if (canStand(nx, p.z, bodies) && !deeperIntoSpawn(nx, p.z)) {
      avatar.root.position.x = nx;
      moved = true;
    }
    if (canStand(avatar.root.position.x, nz, bodies) && !deeperIntoSpawn(avatar.root.position.x, nz)) {
      avatar.root.position.z = nz;
      moved = true;
    }
    return moved;
  }

  function pickWander(bodies) {
    const home = def.home || [state.baseX, state.baseZ];
    const reach = (def.roam || 2) * 2;
    for (let i = 0; i < 8; i++) {
      const tx = home[0] + (Math.random() - 0.5) * reach;
      const tz = home[1] + (Math.random() - 0.5) * reach;
      if (Math.hypot(tx, tz) < SPAWN_CLEAR) continue;
      if (blocked(tx, tz, radius, colliders)) continue;
      if (overlapAmount(tx, tz, radius, bodies) > 0) continue;
      return { x: tx, z: tz };
    }
    return { x: state.baseX, z: state.baseZ };
  }

  function stepToward(tx, tz, speed, dt, bodies) {
    const p = avatar.root.position;
    const dx = tx - p.x;
    const dz = tz - p.z;
    const len = Math.hypot(dx, dz);
    if (len < 0.08) return false;
    const step = Math.min(speed * dt, len);
    const nx = p.x + (dx / len) * step;
    const nz = p.z + (dz / len) * step;
    return tryStep(nx, nz, bodies);
  }

  function update(dt, now, paused, bodies) {
    state.speaking = now < state.bubbleUntil;
    const ang = ((def.name || 'A').charCodeAt(0) % 9) * 0.7 + 0.35;
    const freed = pushOutOfBodies(
      avatar.root.position.x,
      avatar.root.position.z,
      radius,
      bodies,
      colliders,
      ang,
    );
    avatar.root.position.x = freed.x;
    avatar.root.position.z = freed.z;
    let moving = false;
    let speed = 0;
    if (state.goal) {
      moving = stepToward(state.goal.x, state.goal.z, 3.4, dt, bodies);
      speed = moving ? 3.4 : 0;
      face(state.goal.faceX, state.goal.faceZ);
    } else if (def.wander && !paused) {
      const p = avatar.root.position;
      if (!state.wanderTarget || Math.hypot(state.wanderTarget.x - p.x, state.wanderTarget.z - p.z) < 0.35) {
        state.wanderTarget = pickWander(bodies);
      }
      const dx = state.wanderTarget.x - p.x;
      const dz = state.wanderTarget.z - p.z;
      const len = Math.hypot(dx, dz) || 1;
      speed = 0.7;
      const step = speed * dt;
      const nx = p.x + (dx / len) * step;
      const nz = p.z + (dz / len) * step;
      const moved = tryStep(nx, nz, bodies);
      if (!moved) state.wanderTarget = null;
      face(state.wanderTarget ? state.wanderTarget.x : p.x + dx, state.wanderTarget ? state.wanderTarget.z : p.z + dz);
      moving = moved;
    }
    if (!paused && !moving && !state.speaking && !state.goal && !state.react) {
      state.fidget -= dt;
      if (state.fidget <= 0) {
        state.fidget = 8 + Math.random() * 10;
        triggerReact(state, Math.random() < 0.5 ? 'phone' : 'stretch');
      }
    }
    animateAvatar(avatar, dt, moving, speed, state);
    if (state.look) lookHeadAt(avatar, state.look.x, state.look.z, dt);
    else avatar.head.rotation.y *= 0.9;
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
    setGoal,
    clearGoal,
    lookAt(x, z) {
      state.look = { x, z };
    },
    clearLook() {
      state.look = null;
    },
    bubbleUntil() {
      return state.bubbleUntil;
    },
    silence(time) {
      state.bubbleUntil = time;
      avatar.bubble.visible = false;
    },
    distanceTo(x, z) {
      const p = avatar.root.position;
      return Math.hypot(p.x - x, p.z - z);
    },
    goalDistance() {
      if (!state.goal) return Infinity;
      const p = avatar.root.position;
      return Math.hypot(state.goal.x - p.x, state.goal.z - p.z);
    },
  };
}
