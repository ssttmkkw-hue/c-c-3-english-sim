/**
 * Check skit data. No dependencies.
 *   node scripts/check-skits.mjs
 */
import { SKITS, missingCast } from '../src/data/skits/index.js';
import { CHARACTERS } from '../src/data/characters.js';

const names = new Set(CHARACTERS.map((person) => person.name));
const problems = [];

function fail(message) {
  problems.push(message);
}

const missing = missingCast(names);
for (const item of missing) {
  fail(`${item.skit}: role ${item.role} has no character "${item.npc}"`);
}

for (const skit of SKITS) {
  const ids = new Set();
  const roles = new Set((skit.cast || []).map((member) => member.role));
  if (!skit.id) fail('a skit is missing an id');
  if (!Array.isArray(skit.beats) || skit.beats.length < 1) fail(`${skit.id}: no beats`);
  if (!Array.isArray(skit.keyPhrases) || skit.keyPhrases.length < 1) {
    fail(`${skit.id}: keyPhrases is empty`);
  }
  for (const phrase of skit.keyPhrases || []) {
    const text = typeof phrase === 'string' ? phrase : phrase && phrase.text;
    if (!text || !String(text).trim()) fail(`${skit.id}: a keyPhrase is empty`);
  }
  for (const beat of skit.beats || []) {
    if (!beat.id) fail(`${skit.id}: a beat has no id`);
    if (ids.has(beat.id)) fail(`${skit.id}: duplicate beat ${beat.id}`);
    ids.add(beat.id);
    if (!roles.has(beat.role)) fail(`${skit.id}: beat ${beat.id} role ${beat.role} is not in the cast`);
  }
  for (const beat of skit.beats || []) {
    if (beat.branch) {
      if (!ids.has(beat.branch.default)) {
        fail(`${skit.id}: ${beat.id} default "${beat.branch.default}" is missing`);
      }
      for (const opt of beat.branch.options || []) {
        if (!ids.has(opt.next)) fail(`${skit.id}: ${beat.id} option "${opt.next}" is missing`);
      }
    }
    if (beat.next && !ids.has(beat.next)) fail(`${skit.id}: ${beat.id} next "${beat.next}" is missing`);
  }
}

if (problems.length) {
  for (const line of problems) console.error(line);
  console.error(`${problems.length} problem(s)`);
  process.exit(1);
}

console.log(`ok ${SKITS.length} skits, cast complete`);
