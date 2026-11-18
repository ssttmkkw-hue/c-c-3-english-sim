import { animateAvatar, createAvatar, lookHeadAt, triggerReact } from './avatar.js';
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
    goal: null,
    look: null,
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

  function hitsBody(x, z, bodies) {
    if (!bodies) return false;
    for (const body of bodies) {
      const dx = x - body.x;
      const dz = z - body.z;
      const min = radius + body.r;
      if (dx * dx + dz * dz < min * min) return true;
    }
    return false;
  }

  function tryStep(nx, nz, bodies) {
    const p = avatar.root.position;
    let moved = false;
    if (!blocked(nx, p.z, radius, colliders) && !hitsBody(nx, p.z, bodies)) {
      avatar.root.position.x = nx;
      moved = true;
    }
    if (!blocked(avatar.root.position.x, nz, radius, colliders) && !hitsBody(avatar.root.position.x, nz, bodies)) {
      avatar.root.position.z = nz;
      moved = true;
    }
    return moved;
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
    let moving = false;
    let speed = 0;
    if (state.goal) {
      moving = stepToward(state.goal.x, state.goal.z, 3.4, dt, bodies);
      speed = moving ? 3.4 : 0;
      face(state.goal.faceX, state.goal.faceZ);
    } else if (def.wander && !paused) {
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
      const moved = tryStep(nx, nz, bodies);
      if (!moved) state.wanderTarget = null;
      face(state.wanderTarget ? state.wanderTarget.x : p.x + dx, state.wanderTarget ? state.wanderTarget.z : p.z + dz);
      moving = moved;
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
  };
}
