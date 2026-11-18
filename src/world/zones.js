/** Plaza quadrants. Coordinates are X (east) and Z (south). */
export const WORLD_LIMIT = 23.2;

export const ZONES = [
  {
    id: 'cafe',
    name: 'Cafe',
    minX: -23, maxX: -3, minZ: -23, maxZ: -3,
    floor: 0xc4a484,
    anchor: [-12, -13],
    dialogue: 'cafe.join',
    ambient: 'cafe.ambient',
  },
  {
    id: 'park',
    name: 'Park',
    minX: 3, maxX: 23, minZ: -23, maxZ: -3,
    floor: 0x66bb6a,
    anchor: [12, -12],
    dialogue: 'park.join',
    ambient: 'park.ambient',
  },
  {
    id: 'classroom',
    name: 'Classroom',
    minX: -23, maxX: -3, minZ: 3, maxZ: 23,
    floor: 0x90caf9,
    anchor: [-12, 10],
    dialogue: 'class.join',
    ambient: 'class.ambient',
  },
  {
    id: 'shop',
    name: 'Shop Counter',
    minX: 3, maxX: 23, minZ: 3, maxZ: 23,
    floor: 0xffcc80,
    anchor: [12, 13],
    dialogue: 'shop.join',
    ambient: 'shop.ambient',
  },
];

export function zoneAt(x, z) {
  for (const zone of ZONES) {
    if (x >= zone.minX && x <= zone.maxX && z >= zone.minZ && z <= zone.maxZ) return zone;
  }
  return { id: 'plaza', name: 'Plaza', dialogue: null, ambient: null, anchor: [0, 0] };
}

export function blocked(x, z, radius, colliders) {
  if (Math.abs(x) > WORLD_LIMIT - radius || Math.abs(z) > WORLD_LIMIT - radius) return true;
  for (const c of colliders) {
    const dx = x - c.x;
    const dz = z - c.z;
    const min = radius + c.r;
    if (dx * dx + dz * dz < min * min) return true;
  }
  return false;
}

/** How deep (x, z) sits inside any body circle. 0 means clear. */
export function overlapAmount(x, z, radius, bodies) {
  if (!bodies) return 0;
  let pen = 0;
  for (const body of bodies) {
    const min = radius + body.r;
    const dist = Math.hypot(x - body.x, z - body.z);
    if (dist < min) pen = Math.max(pen, min - dist);
  }
  return pen;
}

/**
 * Push a circle out of overlapping bodies. A full overlap uses fallbackAngle
 * so two bodies on the same point do not pick the same direction and stay stuck.
 */
export function pushOutOfBodies(x, z, radius, bodies, colliders, fallbackAngle) {
  const list = bodies || [];
  const walls = colliders || [];
  for (let pass = 0; pass < 4; pass++) {
    let moved = false;
    for (const body of list) {
      let dx = x - body.x;
      let dz = z - body.z;
      let dist = Math.hypot(dx, dz);
      const min = radius + body.r;
      if (dist >= min - 1e-5) continue;
      if (dist < 1e-5) {
        const ang = fallbackAngle || 0;
        dx = Math.cos(ang);
        dz = Math.sin(ang);
        dist = 1;
      }
      const push = min - dist + 0.03;
      let nx = x + (dx / dist) * push;
      let nz = z + (dz / dist) * push;
      if (blocked(nx, nz, radius, walls)) {
        if (!blocked(nx, z, radius, walls)) nz = z;
        else if (!blocked(x, nz, radius, walls)) nx = x;
        else continue;
      }
      if (nx !== x || nz !== z) {
        x = nx;
        z = nz;
        moved = true;
      }
    }
    if (!moved) break;
  }
  return { x, z };
}
