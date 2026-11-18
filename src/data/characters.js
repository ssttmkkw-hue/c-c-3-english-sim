/** Simulated visitors and staff. kind "player" uses a Player: name tag. */
export const CHARACTERS = [
  { id: 'tom', name: 'Barista Tom', kind: 'npc', color: 0x6d4c41, accent: 0xffccbc, zone: 'cafe', group: 'cafe', solo: 'tom.solo', angle: 0.2, voice: 0 },
  { id: 'mika', name: 'Player: Mika_88', kind: 'player', color: 0xec407a, accent: 0xffe0bd, zone: 'cafe', group: 'cafe', solo: 'mika.solo', angle: 2.3, voice: 1 },
  { id: 'leo', name: 'Player: Leo_cafe', kind: 'player', color: 0x26a69a, accent: 0xffe0bd, zone: 'cafe', group: 'cafe', solo: null, angle: 4.2, voice: 2 },

  { id: 'june', name: 'Player: JuneWalks', kind: 'player', color: 0x42a5f5, accent: 0xffe0bd, zone: 'park', group: 'park', solo: null, angle: 0.5, voice: 3 },
  { id: 'ken', name: 'Player: Ken_outdoors', kind: 'player', color: 0x7cb342, accent: 0xf0c8a0, zone: 'park', group: 'park', solo: 'ken.solo', angle: 2.6, voice: 4 },
  { id: 'priya', name: 'Ranger Priya', kind: 'npc', color: 0x2e7d32, accent: 0xffe0bd, zone: 'park', group: 'park', solo: 'priya.solo', angle: 4.5, voice: 5 },

  { id: 'lin', name: 'Teacher Lin', kind: 'npc', color: 0x5e35b1, accent: 0xffe0bd, zone: 'classroom', group: 'class', solo: 'lin.solo', angle: 0.4, voice: 1 },
  { id: 'noah', name: 'Student Noah', kind: 'npc', color: 0xfb8c00, accent: 0xffcc80, zone: 'classroom', group: 'class', solo: 'noah.solo', angle: 2.4, voice: 2 },
  { id: 'hana', name: 'Player: Hana_studies', kind: 'player', color: 0x00897b, accent: 0xffe0bd, zone: 'classroom', group: 'class', solo: null, angle: 4.4, voice: 3 },

  { id: 'sam', name: 'Clerk Sam', kind: 'npc', color: 0xef6c00, accent: 0xffe0bd, zone: 'shop', group: 'shop', solo: 'sam.solo', angle: 1.0, voice: 0 },
  { id: 'mei', name: 'Player: Mei_shop', kind: 'player', color: 0xd81b60, accent: 0xffe0bd, zone: 'shop', group: 'shop', solo: null, angle: 3.1, voice: 4 },
  { id: 'omar', name: 'Player: Omar_22', kind: 'player', color: 0x3949ab, accent: 0xf0c8a0, zone: 'shop', group: 'shop', solo: 'omar.solo', angle: 5.0, voice: 5 },

  { id: 'rae', name: 'Player: Rae_guides', kind: 'player', color: 0x00838f, accent: 0xffe0bd, zone: 'plaza', group: null, solo: 'rae.solo', wander: true, home: [0, 0], roam: 6, voice: 2 },
  { id: 'eli', name: 'Student Eli', kind: 'npc', color: 0x8e24aa, accent: 0xffe0bd, zone: 'classroom', group: null, solo: 'eli.solo', wander: true, home: [-18, 6], roam: 3.2, voice: 3 },
];

export const GROUP_RADIUS = 1.85;
