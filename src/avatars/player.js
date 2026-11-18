import { animateAvatar, createAvatar, setAvatarLook, triggerReact } from './avatar.js';
import { blocked, overlapAmount } from '../world/zones.js';

export function createPlayer(colliders) {
  const avatar = createAvatar({
    name: 'You',
    kind: 'player',
    color: 0x5c6bc0,
    accent: 0xffe0bd,
    unique: true,
    look: { hair: 'short', hairColor: 0x3e2723, outfit: 'shirt' },
  });
  avatar.root.position.set(0, 0, 0);
  const anim = { phase: 0, react: null, reactT: 0, cue: false };
  const radius = 0.45;

  function canStand(x, z, bodies) {
    if (blocked(x, z, radius, colliders)) return false;
    const before = overlapAmount(avatar.root.position.x, avatar.root.position.z, radius, bodies);
    const after = overlapAmount(x, z, radius, bodies);
    if (after <= 0) return true;
    // Already overlapping: allow the step that climbs out. Never freeze in place.
    return after < before - 1e-4;
  }

  function update(dt, move, run, bodies) {
    const speed = run ? 8.2 : 5.4;
    const len = Math.hypot(move.x, move.z);
    let moving = false;
    if (len > 0.001) {
      moving = true;
      const nx = move.x / len;
      const nz = move.z / len;
      const step = speed * dt;
      const px = avatar.root.position.x;
      const pz = avatar.root.position.z;
      const nextX = px + nx * step;
      const nextZ = pz + nz * step;
      const buried = overlapAmount(px, pz, radius, bodies) > 0;
      if (canStand(nextX, pz, bodies)) avatar.root.position.x = nextX;
      if (canStand(avatar.root.position.x, nextZ, bodies)) avatar.root.position.z = nextZ;
      if (
        buried &&
        avatar.root.position.x === px &&
        avatar.root.position.z === pz &&
        canStand(nextX, nextZ, bodies)
      ) {
        avatar.root.position.x = nextX;
        avatar.root.position.z = nextZ;
      }
      avatar.root.rotation.y = Math.atan2(nx, nz);
    }
    animateAvatar(avatar, dt, moving, speed, anim);
  }

  function tick(dt) {
    animateAvatar(avatar, dt, false, 0, anim);
  }

  return {
    avatar,
    update,
    tick,
    radius,
    react(kind) {
      triggerReact(anim, kind);
    },
    setCue(on) {
      anim.cue = !!on;
    },
    applyLook(look) {
      const next = look || {};
      setAvatarLook(avatar, {
        color: next.color,
        hair: next.hair,
        name: next.name || 'You',
      });
    },
  };
}
