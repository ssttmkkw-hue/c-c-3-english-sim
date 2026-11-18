import { animateAvatar, createAvatar, triggerReact } from './avatar.js';
import { blocked } from '../world/zones.js';

export function createPlayer(colliders) {
  const avatar = createAvatar({
    name: 'You',
    kind: 'player',
    color: 0x5c6bc0,
    accent: 0xffe0bd,
  });
  avatar.root.position.set(0, 0, 0);
  const anim = { phase: 0, react: null, reactT: 0 };
  const radius = 0.45;

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
      if (!blocked(nextX, pz, radius, colliders) && !hitsBody(nextX, pz, bodies)) avatar.root.position.x = nextX;
      if (!blocked(avatar.root.position.x, nextZ, radius, colliders) && !hitsBody(avatar.root.position.x, nextZ, bodies)) {
        avatar.root.position.z = nextZ;
      }
      avatar.root.rotation.y = Math.atan2(nx, nz);
    }
    animateAvatar(avatar, dt, moving, speed, anim);
  }

  return {
    avatar,
    update,
    radius,
    react(kind) {
      triggerReact(anim, kind);
    },
  };
}
