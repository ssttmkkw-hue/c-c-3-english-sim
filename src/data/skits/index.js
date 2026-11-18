import { LATTE_SKIT } from './latte.js';
import { LATE_CLASS_SKIT } from './late-class.js';
import { CHECKIN_SKIT } from './check-in.js';
import { AIRPORT_SKIT } from './airport.js';
import { PHARMACY_SKIT } from './pharmacy.js';
import { RESTAURANT_SKIT } from './restaurant.js';
import { groupIdForZone, skitSpots } from '../../world/zones.js';

export const SKITS = [LATTE_SKIT, LATE_CLASS_SKIT, CHECKIN_SKIT, AIRPORT_SKIT, PHARMACY_SKIT, RESTAURANT_SKIT];

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
  return groupIdForZone(skit.zone);
}

export function spotForSkit(id) {
  return skitSpots().find((spot) => spot.id === id) || null;
}

/** Every role's npc name must already be a person in the world. */
export function missingCast(names) {
  const have = names instanceof Set ? names : new Set(names || []);
  const missing = [];
  for (const skit of SKITS) {
    for (const member of skit.cast || []) {
      if (!member.npc || !have.has(member.npc)) {
        missing.push({ skit: skit.id, role: member.role, npc: member.npc || '' });
      }
    }
  }
  return missing;
}
