/** Simulated visitors and staff. kind "player" uses a Player: name tag. */
export const CHARACTERS = [
  { id: 'tom', name: 'Barista Tom', kind: 'npc', color: 0x6d4c41, accent: 0xffccbc, zone: 'cafe', group: 'cafe', solo: 'tom.solo', angle: 0.2, voice: 0, look: { hair: 'short', hairColor: 0x4e342e, outfit: 'shirt', apron: true, apronColor: 0x8d6e63, hat: true, hatColor: 0x4e342e } },
  { id: 'mika', name: 'Player: Mika_88', kind: 'player', color: 0xec407a, accent: 0xffe0bd, zone: 'cafe', group: 'cafe', solo: 'mika.solo', angle: 2.3, voice: 1, look: { hair: 'bob', hairColor: 0x5d4037, outfit: 'jacket' } },
  { id: 'leo', name: 'Player: Leo_cafe', kind: 'player', color: 0x26a69a, accent: 0xffe0bd, zone: 'cafe', group: 'cafe', solo: null, angle: 4.2, voice: 2, look: { hair: 'spiky', hairColor: 0x3e2723, outfit: 'shirt' } },

  { id: 'june', name: 'Player: JuneWalks', kind: 'player', color: 0x42a5f5, accent: 0xffe0bd, zone: 'park', group: 'park', solo: null, angle: 0.5, voice: 3, look: { hair: 'bob', hairColor: 0x6d4c41, outfit: 'shirt' } },
  { id: 'ken', name: 'Player: Ken_outdoors', kind: 'player', color: 0x7cb342, accent: 0xf0c8a0, zone: 'park', group: 'park', solo: 'ken.solo', angle: 2.6, voice: 4, look: { hair: 'short', hairColor: 0x212121, outfit: 'jacket' } },
  { id: 'priya', name: 'Ranger Priya', kind: 'npc', color: 0x2e7d32, accent: 0xffe0bd, zone: 'park', group: 'park', solo: 'priya.solo', angle: 4.5, voice: 5, look: { hair: 'bun', hairColor: 0x3e2723, outfit: 'jacket', hat: true, hatColor: 0x33691e } },

  { id: 'lin', name: 'Teacher Lin', kind: 'npc', color: 0x5e35b1, accent: 0xffe0bd, zone: 'classroom', group: 'class', solo: 'lin.solo', angle: 0.4, voice: 1, look: { hair: 'bun', hairColor: 0x212121, outfit: 'jacket', glasses: true } },
  { id: 'noah', name: 'Student Noah', kind: 'npc', color: 0xfb8c00, accent: 0xffcc80, zone: 'classroom', group: 'class', solo: 'noah.solo', angle: 2.4, voice: 2, look: { hair: 'spiky', hairColor: 0x4e342e, outfit: 'shirt' } },
  { id: 'hana', name: 'Player: Hana_studies', kind: 'player', color: 0x00897b, accent: 0xffe0bd, zone: 'classroom', group: 'class', solo: null, angle: 4.4, voice: 3, look: { hair: 'bob', hairColor: 0x1a1a1a, outfit: 'shirt' } },

  { id: 'sam', name: 'Clerk Sam', kind: 'npc', color: 0xef6c00, accent: 0xffe0bd, zone: 'shop', group: 'shop', solo: 'sam.solo', angle: 1.0, voice: 0, look: { hair: 'short', hairColor: 0x3e2723, outfit: 'shirt', apron: true, apronColor: 0xffe0b2, glasses: false } },
  { id: 'mei', name: 'Player: Mei_shop', kind: 'player', color: 0xd81b60, accent: 0xffe0bd, zone: 'shop', group: 'shop', solo: null, angle: 3.1, voice: 4, look: { hair: 'bun', hairColor: 0x4e342e, outfit: 'jacket' } },
  { id: 'omar', name: 'Player: Omar_22', kind: 'player', color: 0x3949ab, accent: 0xf0c8a0, zone: 'shop', group: 'shop', solo: 'omar.solo', angle: 5.0, voice: 5, look: { hair: 'short', hairColor: 0x212121, outfit: 'jacket' } },

  { id: 'nina', name: 'Tourist Nina', kind: 'npc', color: 0xf9a825, accent: 0xffe0bd, zone: 'plaza', group: null, solo: 'nina.solo', home: [1.2, 5.4], angle: 0.4, voice: 1, look: { hair: 'bob', hairColor: 0x6d4c41, outfit: 'shirt', hat: true, hatColor: 0xf9a825 } },
  { id: 'ada', name: 'Librarian Ada', kind: 'npc', color: 0x6a1b9a, accent: 0xffe0bd, zone: 'classroom', group: null, solo: 'ada.solo', home: [-20.2, 6.4], angle: 0.9, voice: 4, look: { hair: 'bun', hairColor: 0x4a148c, outfit: 'jacket', glasses: true } },
  { id: 'jo', name: 'Musician Jo', kind: 'npc', color: 0xc62828, accent: 0xffe0bd, zone: 'park', group: null, solo: 'jo.solo', home: [9.2, -19.4], angle: 1.1, voice: 2, look: { hair: 'spiky', hairColor: 0x1b1b1b, outfit: 'jacket' } },
  { id: 'bea', name: 'Customer Bea', kind: 'player', color: 0x00897b, accent: 0xffccbc, zone: 'shop', group: null, solo: 'bea.solo', home: [18.4, 9.2], angle: 2.2, voice: 5, look: { hair: 'bob', hairColor: 0x5d4037, outfit: 'shirt' } },

  { id: 'nia', name: 'Clerk Nia', kind: 'npc', color: 0x1565c0, accent: 0xffe0bd, zone: 'hotel', group: 'hotel', solo: null, angle: 0.15, voice: 1, look: { hair: 'bun', hairColor: 0x3e2723, outfit: 'jacket' } },
  { id: 'ana', name: 'Player: Guest_Ana', kind: 'player', color: 0xf06292, accent: 0xffe0bd, zone: 'hotel', group: 'hotel', solo: null, angle: 2.5, voice: 3, look: { hair: 'bob', hairColor: 0x5d4037, outfit: 'jacket' } },
  { id: 'ben', name: 'Player: Guest_Ben', kind: 'player', color: 0x00897b, accent: 0xf0c8a0, zone: 'hotel', group: 'hotel', solo: null, angle: 4.3, voice: 4, look: { hair: 'short', hairColor: 0x212121, outfit: 'shirt' } },

  { id: 'ren', name: 'Audience Ren', kind: 'npc', color: 0x5c6bc0, accent: 0xffe0bd, zone: 'playhouse', group: null, solo: null, home: [-7.2, 39.15], angle: 0, voice: 2, look: { hair: 'short', hairColor: 0x3e2723, outfit: 'jacket' } },
  { id: 'sol', name: 'Audience Sol', kind: 'player', color: 0xec407a, accent: 0xffe0bd, zone: 'playhouse', group: null, solo: null, home: [7.2, 39.15], angle: 0, voice: 1, look: { hair: 'bob', hairColor: 0x4e342e, outfit: 'shirt' } },

  { id: 'rio', name: 'Agent Rio', kind: 'npc', color: 0x1565c0, accent: 0xffe0bd, zone: 'airport', group: 'airport', solo: null, angle: 0.2, voice: 0, look: { hair: 'short', hairColor: 0x212121, outfit: 'jacket', hat: true, hatColor: 0x0d47a1 } },
  { id: 'cam', name: 'Player: Guest_Cam', kind: 'player', color: 0x26a69a, accent: 0xffe0bd, zone: 'airport', group: 'airport', solo: null, angle: 2.4, voice: 2, look: { hair: 'bob', hairColor: 0x5d4037, outfit: 'jacket' } },
  { id: 'dee', name: 'Player: Guest_Dee', kind: 'player', color: 0x8e24aa, accent: 0xf0c8a0, zone: 'airport', group: 'airport', solo: null, angle: 4.1, voice: 4, look: { hair: 'short', hairColor: 0x3e2723, outfit: 'shirt' } },

  { id: 'noor', name: 'Pharmacist Noor', kind: 'npc', color: 0x00897b, accent: 0xffe0bd, zone: 'pharmacy', group: 'pharmacy', solo: null, angle: 0.15, voice: 1, look: { hair: 'bun', hairColor: 0x3e2723, outfit: 'jacket', glasses: true } },
  { id: 'jun', name: 'Player: Guest_Jun', kind: 'player', color: 0xec407a, accent: 0xffe0bd, zone: 'pharmacy', group: 'pharmacy', solo: null, angle: 2.5, voice: 3, look: { hair: 'bob', hairColor: 0x4e342e, outfit: 'shirt' } },
  { id: 'kim', name: 'Player: Guest_Kim', kind: 'player', color: 0x5c6bc0, accent: 0xffe0bd, zone: 'pharmacy', group: 'pharmacy', solo: null, angle: 4.2, voice: 5, look: { hair: 'short', hairColor: 0x212121, outfit: 'jacket' } },

  { id: 'rae', name: 'Player: Rae_guides', kind: 'player', color: 0x00838f, accent: 0xffe0bd, zone: 'plaza', group: null, solo: 'rae.solo', wander: true, home: [0, 0], roam: 6, voice: 2, look: { hair: 'short', hairColor: 0x3e2723, outfit: 'jacket' } },
  { id: 'eli', name: 'Student Eli', kind: 'npc', color: 0x8e24aa, accent: 0xffe0bd, zone: 'classroom', group: null, solo: 'eli.solo', wander: true, home: [-18, 6], roam: 3.2, voice: 3, look: { hair: 'spiky', hairColor: 0x4e342e, outfit: 'shirt' } },
];

export const GROUP_RADIUS = 1.85;
