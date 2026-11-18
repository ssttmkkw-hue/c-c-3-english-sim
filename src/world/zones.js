/** Plaza quadrants, plus islands reached by portal. X is east, Z is south. */
export const WORLD_LIMIT = 23.2;

export const PLAZA = {
  id: 'plaza',
  name: 'Plaza',
  spawn: [0, 0],
  portal: { x: 0, z: 0 },
  neighbors: ['cafe', 'park', 'classroom', 'shop'],
};

export const ZONES = [
  {
    id: 'cafe',
    name: 'Cafe',
    minX: -23, maxX: -3, minZ: -23, maxZ: -3,
    floor: 0xc4a484,
    anchor: [-12, -13],
    spawn: [-12, -9.5],
    groupId: 'cafe',
    dialogue: 'cafe.join',
    ambient: 'cafe.ambient',
    neighbors: ['park', 'classroom', 'plaza'],
    portal: { x: -6.2, z: -6.2 },
    skitSpots: [{ id: 'latte-for-mika', x: -10.2, z: -9.6 }],
  },
  {
    id: 'park',
    name: 'Park',
    minX: 3, maxX: 23, minZ: -23, maxZ: -3,
    floor: 0x66bb6a,
    anchor: [12, -12],
    spawn: [12, -8.5],
    groupId: 'park',
    dialogue: 'park.join',
    ambient: 'park.ambient',
    neighbors: ['cafe', 'shop', 'plaza'],
    portal: { x: 6.2, z: -6.2 },
    skitSpots: [],
  },
  {
    id: 'classroom',
    name: 'Classroom',
    minX: -23, maxX: -3, minZ: 3, maxZ: 23,
    floor: 0x90caf9,
    anchor: [-12, 10],
    spawn: [-12, 13.5],
    groupId: 'class',
    dialogue: 'class.join',
    ambient: 'class.ambient',
    neighbors: ['cafe', 'shop', 'plaza'],
    portal: { x: -6.2, z: 6.2 },
    skitSpots: [{ id: 'late-to-class', x: -9.4, z: 11.0 }],
  },
  {
    id: 'shop',
    name: 'Shop Counter',
    minX: 3, maxX: 23, minZ: 3, maxZ: 23,
    floor: 0xffcc80,
    anchor: [12, 13],
    spawn: [12, 16.5],
    groupId: 'shop',
    dialogue: 'shop.join',
    ambient: 'shop.ambient',
    neighbors: ['park', 'classroom', 'plaza'],
    portal: { x: 6.2, z: 6.2 },
    skitSpots: [],
  },
  {
    id: 'playhouse',
    name: 'Playhouse',
    minX: -18, maxX: 18, minZ: 28, maxZ: 54,
    floor: 0x7e57c2,
    anchor: [0, 33],
    spawn: [0, 49],
    groupId: null,
    island: true,
    neighbors: [],
    portal: { x: 0, z: 30.4 },
    skitSpots: [],
    board: { x: -7.4, z: 30.8 },
    stage: {
      x: 0,
      z: 33,
      marks: [
        { x: -1.6, z: 32.7 },
        { x: 0.35, z: 33.3 },
        { x: 1.9, z: 32.7 },
      ],
    },
    seats: [
      { x: -4.5, z: 40 }, { x: -1.5, z: 40 }, { x: 1.5, z: 40 }, { x: 4.5, z: 40 },
      { x: -4.5, z: 42.3 }, { x: -1.5, z: 42.3 }, { x: 1.5, z: 42.3 }, { x: 4.5, z: 42.3 },
      { x: -4.5, z: 44.6 }, { x: -1.5, z: 44.6 }, { x: 1.5, z: 44.6 }, { x: 4.5, z: 44.6 },
    ],
  },
];

export function zoneById(id) {
  const key = String(id || '').trim().toLowerCase();
  if (key === 'class') return ZONES.find((zone) => zone.id === 'classroom') || null;
  if (key === 'plaza' || key === 'center') return PLAZA;
  return ZONES.find((zone) => zone.id === key || zone.groupId === key) || null;
}

export function zoneList() {
  return [PLAZA, ...ZONES];
}

export function groupZoneMap() {
  const map = {};
  for (const zone of ZONES) {
    if (zone.groupId) map[zone.groupId] = zone.id;
  }
  return map;
}

export function skitSpots() {
  const spots = [];
  for (const zone of ZONES) {
    for (const spot of zone.skitSpots || []) spots.push({ ...spot, zone: zone.id });
  }
  return spots;
}

export function groupIdForZone(zoneId) {
  const zone = zoneById(zoneId);
  return (zone && zone.groupId) || '';
}

export function portals() {
  const rings = [];
  if (PLAZA.portal) rings.push({ zone: 'plaza', ...PLAZA.portal });
  for (const zone of ZONES) {
    if (zone.portal) rings.push({ zone: zone.id, ...zone.portal });
  }
  return rings;
}

export function zoneAt(x, z) {
  for (const zone of ZONES) {
    if (x >= zone.minX && x <= zone.maxX && z >= zone.minZ && z <= zone.maxZ) return zone;
  }
  return { id: 'plaza', name: 'Plaza', dialogue: null, ambient: null, anchor: [0, 0], neighbors: PLAZA.neighbors };
}

function insideIsland(x, z, radius) {
  for (const zone of ZONES) {
    if (!zone.island) continue;
    if (x >= zone.minX + radius && x <= zone.maxX - radius && z >= zone.minZ + radius && z <= zone.maxZ - radius) {
      return true;
    }
  }
  return false;
}

export function blocked(x, z, radius, colliders) {
  const plaza = Math.abs(x) <= WORLD_LIMIT - radius && Math.abs(z) <= WORLD_LIMIT - radius;
  if (!plaza && !insideIsland(x, z, radius)) return true;
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
