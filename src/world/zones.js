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
