import { LATTE_SKIT } from './latte.js';
import { LATE_CLASS_SKIT } from './late-class.js';

export const SKITS = [LATTE_SKIT, LATE_CLASS_SKIT];

/** Small stage spots. Kept beside the group, clear of desks and counters. */
export const SKIT_SPOTS = [
  { id: 'latte-for-mika', zone: 'cafe', x: -10.2, z: -9.6 },
  { id: 'late-to-class', zone: 'classroom', x: -9.4, z: 11.0 },
];

const ZONE_GROUP = { cafe: 'cafe', classroom: 'class', park: 'park', shop: 'shop' };

export function skitById(id) {
  const key = String(id || '').trim();
  return SKITS.find((skit) => skit.id === key) || null;
}

export function skitsInZone(zoneId) {
  const key = zoneId === 'class' ? 'classroom' : zoneId;
  return SKITS.filter((skit) => skit.zone === key);
}

export function groupIdForSkit(skit) {
  if (!skit) return '';
  return ZONE_GROUP[skit.zone] || '';
}

export function spotForSkit(id) {
  return SKIT_SPOTS.find((spot) => spot.id === id) || null;
}
