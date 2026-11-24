import type { FighterBlueprint } from '../../types/fighter';
import type { PalettePreset } from '../../types/palette';
import {
  buildNesDemakeChart,
  buildNesPalettes,
  buildSnesRpgChart,
} from '../rpgSpriteBuilder';

// 4. ZELDA (24x24 SNES High-Res Sprite + 16x16 NES Pack)
const ZELDA_SNES = buildSnesRpgChart({
  fxStyle: 'orb',
  snesIdle: [
    '.........111111.........',
    '........17777771........',
    '.......1c7d77d7c1.......',
    '......1ccccccccc1.......',
    '.....1cc1222221cc1......',
    '.....1c122121221c1......',
    '.....1c122222221c1......',
    '.....1cc1222221cc1......',
    '......1c1111111c1.......',
    '.....1c177555771c1......',
    '....1c12155755121c1.....',
    '....112215555512211.....',
    '......11133733111.......',
    '.......133373331........',
    '......13335753331.......',
    '.....1335557555331......',
    '....133553373355331.....',
    '....133333474333331.....',
    '...13333443734433331....',
    '...13334433733443331....',
    '...15555555555555551....',
    '....111111111111111.....',
    '........................',
    '........................',
  ],
  snesAttack: [
    '........111111..........',
    '.......17777771.........',
    '......1c7d77d7c1........',
    '.....1ccccccccc1........',
    '....1cc1222221cc1.......',
    '....1c122121221c1.......',
    '....1c122222221c1.......',
    '....1cc1222221cc1..1ff..',
    '.....1c1111111c1..1ddf1.',
    '....1c177555771..1ddff1.',
    '...112215555512211ddf1..',
    '.....1113373311111111...',
    '......133373331.........',
    '.....13335753331........',
    '....1335557555331.......',
    '...133553373355331......',
    '...133333474333331......',
    '..13333443734433331.....',
    '..15555555555555551.....',
    '...111111111111111......',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
});

const ZELDA_PALETTES: PalettePreset[] = [
  {
    name: 'LttP Royal Pink',
    colors: [
      '', '#120818', '#FFE4C4', '#EC4899', '#9D174D', '#F8FAFC', '#CBD5E1',
      '#FACC15', '#F97316', '#78350F', '#FFFFFF', '#94A3B8', '#FDE047',
      '#38BDF8', '#FDE047', '#FFFFFF',
    ],
  },
  {
    name: 'Ocarina Royal',
    colors: [
      '', '#140814', '#FFE4C4', '#A855F7', '#6B21A8', '#FBCFE8', '#DB2777',
      '#FACC15', '#EF4444', '#581C87', '#FFFFFF', '#94A3B8', '#F59E0B',
      '#E879F9', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Skyward Azure',
    colors: [
      '', '#081018', '#FFE4C4', '#38BDF8', '#0284C7', '#E0F2FE', '#93C5FD',
      '#FACC15', '#F97316', '#1E3A8A', '#FFFFFF', '#94A3B8', '#FDE047',
      '#67E8F9', '#E0F2FE', '#FFFFFF',
    ],
  },
  {
    name: 'Lorule Hilda',
    colors: [
      '', '#090514', '#E2E8F0', '#581C87', '#3B0764', '#94A3B8', '#475569',
      '#FACC15', '#EF4444', '#1E1B4B', '#FFFFFF', '#64748B', '#7C3AED',
      '#C084FC', '#FDE047', '#FFFFFF',
    ],
  },
];

// 5. GANONDORF (24x24 SNES High-Res Sprite + 16x16 NES Pack)
const GANONDORF_SNES = buildSnesRpgChart({
  fxStyle: 'aura',
  snesIdle: [
    '......111111111.........',
    '.....1cccccccc1.........',
    '....1ccc7777ccc1........',
    '....1c12222221c1........',
    '....1c12812182c1........',
    '.....1122222211.........',
    '......12299221..........',
    '..1111117777111111......',
    '.155331337733133551.....',
    '.153331334433133351.....',
    '.153413377773314351.....',
    '.151113344443311151.....',
    '..1513337777333151......',
    '..1513343333433151......',
    '..151.13344331.151......',
    '..151.13311331.151......',
    '..11..13311331..11......',
    '......14411441..........',
    '.....1333113331.........',
    '.....1999119991.........',
    '....199991199991........',
    '....11111..11111........',
    '........................',
    '........................',
  ],
  snesAttack: [
    '.......111111111........',
    '......1cccccccc1........',
    '.....1ccc7777ccc1.......',
    '.....1c12222221c1.......',
    '.....1c12812182c1.......',
    '......1122222211........',
    '.......12299221.........',
    '..1111117777111111......',
    '.15533133773313333111...',
    '.15333133443313333ddd1..',
    '..1111337777331111ddd1..',
    '.....1334444331...111...',
    '.....1337777331.........',
    '....133433334331........',
    '....13341..14331........',
    '...13331....13331.......',
    '...14441....14441.......',
    '..13331......13331......',
    '..19991......19991......',
    '.199991......199991.....',
    '.11111........11111.....',
    '........................',
    '........................',
    '........................',
  ],
});

const GANONDORF_PALETTES: PalettePreset[] = [
  {
    name: 'Gerudo King',
    colors: [
      '', '#09090B', '#84A98C', '#334155', '#1E293B', '#991B1B', '#450A0A',
      '#FACC15', '#EF4444', '#1F2937', '#CBD5E1', '#475569', '#DC2626',
      '#A855F7', '#F472B6', '#FFFFFF',
    ],
  },
  {
    name: 'Blue Beast Ganon',
    colors: [
      '', '#090914', '#60A5FA', '#1E3A8A', '#172554', '#B91C1C', '#7F1D1D',
      '#FACC15', '#F97316', '#0F172A', '#CBD5E1', '#475569', '#EF4444',
      '#38BDF8', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Twilight Armor',
    colors: [
      '', '#09090B', '#64748B', '#18181B', '#09090B', '#D97706', '#92400E',
      '#FDE047', '#EF4444', '#27272A', '#E2E8F0', '#52525B', '#EA580C',
      '#FACC15', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Calamity Shadow',
    colors: [
      '', '#09050F', '#94A3B8', '#3B0764', '#1E1B4B', '#E11D48', '#881337',
      '#F43F5E', '#FB7185', '#18181B', '#E2E8F0', '#475569', '#EC4899',
      '#E11D48', '#FBCFE8', '#FFFFFF',
    ],
  },
];

// 6. FOX (24x24 SNES High-Res Sprite + 16x16 NES Pack)
const FOX_SNES = buildSnesRpgChart({
  fxStyle: 'beam',
  snesIdle: [
    '.....11........11.......',
    '....1331......1331......',
    '...1322311111132231.....',
    '...1333333333333331.....',
    '....13312133311331......',
    '....13322222222331......',
    '.....122221122221.......',
    '......1122222211........',
    '.....118888888811.......',
    '....1aa18888881aa1......',
    '...1aaa15555551aaa1.....',
    '...1aa1555555551aa1.....',
    '....11.15588551.11......',
    '.......15555551.........',
    '......1556116551........',
    '.....15561..16551.......',
    '.....15551..15551.......',
    '....13331....13331......',
    '....18881....18881......',
    '...188881....188881.....',
    '...111111....111111.....',
    '........................',
    '........................',
    '........................',
  ],
  snesAttack: [
    '......11........11......',
    '.....1331......1331.....',
    '....1322311111132231....',
    '....1333333333333331....',
    '.....13312133311331.....',
    '.....13322222222331.....',
    '......122221122221......',
    '.......1122222211.......',
    '......118888888811......',
    '....1aa18888881111111...',
    '...1aaa15555551bbbbb1...',
    '....1111555555111111....',
    '.......15588551.........',
    '......1556116551........',
    '.....15561..16551.......',
    '....15551....15551......',
    '....13331....13331......',
    '...18881......18881.....',
    '..188881......188881....',
    '..111111......111111....',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
});

const FOX_PALETTES: PalettePreset[] = [
  {
    name: 'Star Fox Corneria',
    colors: [
      '', '#0A0D18', '#FEF3C7', '#EA580C', '#9A3412', '#16A34A', '#166534',
      '#FACC15', '#EF4444', '#78350F', '#F8FAFC', '#64748B', '#22C55E',
      '#38BDF8', '#E0F2FE', '#FFFFFF',
    ],
  },
  {
    name: 'Falco Lombardi',
    colors: [
      '', '#080C18', '#F8FAFC', '#2563EB', '#1E3A8A', '#DC2626', '#991B1B',
      '#FACC15', '#F97316', '#1E293B', '#F8FAFC', '#64748B', '#38BDF8',
      '#38BDF8', '#E0F2FE', '#FFFFFF',
    ],
  },
  {
    name: 'Star Wolf',
    colors: [
      '', '#09090B', '#CBD5E1', '#475569', '#1E293B', '#7C3AED', '#4C1D95',
      '#FACC15', '#EF4444', '#18181B', '#E2E8F0', '#334155', '#A855F7',
      '#F43F5E', '#FECDD3', '#FFFFFF',
    ],
  },
  {
    name: 'Assault Gold',
    colors: [
      '', '#140E04', '#FEF3C7', '#D97706', '#92400E', '#F8FAFC', '#94A3B8',
      '#FDE047', '#EF4444', '#78350F', '#FFFFFF', '#64748B', '#F59E0B',
      '#FACC15', '#FEF08A', '#FFFFFF',
    ],
  },
];

export const HYRULE_LEGENDS_FIGHTERS: readonly FighterBlueprint[] = [
  {
    id: 'zelda',
    name: 'Zelda',
    nickname: 'Triforce Mage',
    era: 'SNES',
    originTag: 'A Link to the Past',
    archetype: 'zoner',
    archetypeLabel: 'Triforce Mage',
    gridSize: 24,
    palettes: ZELDA_PALETTES,
    pixelChart: ZELDA_SNES,
    eraPacks: {
      NES: { pixelChart: buildNesDemakeChart(ZELDA_SNES), palettes: buildNesPalettes(ZELDA_PALETTES) },
      SNES_SEGA: { pixelChart: ZELDA_SNES, palettes: ZELDA_PALETTES },
    },
    stats: {
      weight: 88, runSpeed: 2.3, airSpeed: 2.1, jumpForce: 5.5, doubleJumpForce: 5.1,
      maxJumps: 3, gravity: 0.22, fallSpeed: 4.1, fastFallSpeed: 6.0, traction: 0.21,
    },
    moveset: {
      jab: {
        name: 'Nayru Spark', startup: 4, active: 5, endlag: 8,
        hitbox: { offsetX: 14, offsetY: -12, width: 16, height: 14 },
        damage: 6, baseKnockback: 2.2, knockbackGrowth: 36, launchAngleDeg: 40, hitstop: 4,
      },
      smash: {
        name: 'Triforce Blast', startup: 10, active: 6, endlag: 15,
        hitbox: { offsetX: 16, offsetY: -12, width: 22, height: 16 },
        damage: 17, baseKnockback: 4.6, knockbackGrowth: 92, launchAngleDeg: 38, hitstop: 8,
      },
      aerial: {
        name: 'Lightning Heel', startup: 5, active: 5, endlag: 10,
        hitbox: { offsetX: 14, offsetY: -10, width: 16, height: 14 },
        damage: 14, baseKnockback: 3.8, knockbackGrowth: 78, launchAngleDeg: 30, hitstop: 7,
      },
      neutralSpecial: {
        name: "Din's Fire", startup: 10, active: 5, endlag: 14,
        hitbox: { offsetX: 14, offsetY: -12, width: 12, height: 12 },
        damage: 10, baseKnockback: 3.0, knockbackGrowth: 52, launchAngleDeg: 42, hitstop: 5,
        projectile: {
          speedX: 4.1, speedY: 0, gravity: 0, radius: 5, lifetime: 62, colorIndex: 8, glowIndex: 14,
        },
      },
      upSpecial: {
        name: "Farore's Wind", startup: 5, active: 13, endlag: 17,
        hitbox: { offsetX: 0, offsetY: -18, width: 20, height: 22 },
        damage: 12, baseKnockback: 4.2, knockbackGrowth: 74, launchAngleDeg: 80, hitstop: 6,
        velocityBoostX: 1.4, velocityBoostY: -7.1,
      },
    },
  },
  {
    id: 'ganondorf',
    name: 'Ganondorf',
    nickname: 'Gerudo King',
    era: 'SNES',
    originTag: 'Ocarina of Time',
    archetype: 'heavy-grappler',
    archetypeLabel: 'Gerudo King',
    gridSize: 24,
    palettes: GANONDORF_PALETTES,
    pixelChart: GANONDORF_SNES,
    eraPacks: {
      NES: { pixelChart: buildNesDemakeChart(GANONDORF_SNES), palettes: buildNesPalettes(GANONDORF_PALETTES) },
      SNES_SEGA: { pixelChart: GANONDORF_SNES, palettes: GANONDORF_PALETTES },
    },
    stats: {
      weight: 124, runSpeed: 2.05, airSpeed: 1.85, jumpForce: 5.2, doubleJumpForce: 4.7,
      maxJumps: 3, gravity: 0.3, fallSpeed: 5.3, fastFallSpeed: 7.4, traction: 0.25,
    },
    moveset: {
      jab: {
        name: 'Dark Palm', startup: 6, active: 5, endlag: 10,
        hitbox: { offsetX: 15, offsetY: -12, width: 18, height: 14 },
        damage: 9, baseKnockback: 3.0, knockbackGrowth: 46, launchAngleDeg: 34, hitstop: 6,
      },
      smash: {
        name: 'Warlock Punch', startup: 14, active: 7, endlag: 19,
        hitbox: { offsetX: 16, offsetY: -12, width: 24, height: 18 },
        damage: 24, baseKnockback: 5.6, knockbackGrowth: 108, launchAngleDeg: 30, hitstop: 11,
      },
      aerial: {
        name: 'Wizard Drop', startup: 6, active: 7, endlag: 11,
        hitbox: { offsetX: 12, offsetY: -10, width: 20, height: 16 },
        damage: 15, baseKnockback: 4.0, knockbackGrowth: 80, launchAngleDeg: 30, hitstop: 8,
      },
      neutralSpecial: {
        name: 'Dark Orb', startup: 11, active: 5, endlag: 15,
        hitbox: { offsetX: 14, offsetY: -12, width: 14, height: 12 },
        damage: 11, baseKnockback: 3.2, knockbackGrowth: 52, launchAngleDeg: 38, hitstop: 6,
        projectile: {
          speedX: 3.7, speedY: 0, gravity: 0, radius: 6, lifetime: 66, colorIndex: 13, glowIndex: 14,
        },
      },
      upSpecial: {
        name: 'Dark Dive', startup: 5, active: 14, endlag: 19,
        hitbox: { offsetX: 4, offsetY: -18, width: 18, height: 22 },
        damage: 14, baseKnockback: 4.6, knockbackGrowth: 80, launchAngleDeg: 76, hitstop: 7,
        velocityBoostX: 1.5, velocityBoostY: -6.7,
      },
    },
  },
  {
    id: 'fox',
    name: 'Fox',
    nickname: 'Star Pilot',
    era: 'SNES',
    originTag: 'Star Fox',
    archetype: 'speedster',
    archetypeLabel: 'Star Pilot',
    gridSize: 24,
    palettes: FOX_PALETTES,
    pixelChart: FOX_SNES,
    eraPacks: {
      NES: { pixelChart: buildNesDemakeChart(FOX_SNES), palettes: buildNesPalettes(FOX_PALETTES) },
      SNES_SEGA: { pixelChart: FOX_SNES, palettes: FOX_PALETTES },
    },
    stats: {
      weight: 84, runSpeed: 3.25, airSpeed: 2.55, jumpForce: 5.9, doubleJumpForce: 5.3,
      maxJumps: 3, gravity: 0.31, fallSpeed: 5.5, fastFallSpeed: 7.7, traction: 0.25,
    },
    moveset: {
      jab: {
        name: 'Rapid Kick', startup: 3, active: 4, endlag: 6,
        hitbox: { offsetX: 14, offsetY: -11, width: 16, height: 12 },
        damage: 5, baseKnockback: 1.9, knockbackGrowth: 30, launchAngleDeg: 36, hitstop: 3,
      },
      smash: {
        name: 'Fox Illusion', startup: 8, active: 7, endlag: 13,
        hitbox: { offsetX: 16, offsetY: -11, width: 22, height: 15 },
        damage: 15, baseKnockback: 4.3, knockbackGrowth: 88, launchAngleDeg: 34, hitstop: 7,
        velocityBoostX: 2.6,
      },
      aerial: {
        name: 'Aerial Reflect', startup: 4, active: 5, endlag: 8,
        hitbox: { offsetX: 11, offsetY: -10, width: 18, height: 14 },
        damage: 11, baseKnockback: 3.1, knockbackGrowth: 66, launchAngleDeg: 32, hitstop: 6,
      },
      neutralSpecial: {
        name: 'Blaster Shot', startup: 6, active: 4, endlag: 10,
        hitbox: { offsetX: 14, offsetY: -12, width: 12, height: 10 },
        damage: 6, baseKnockback: 1.8, knockbackGrowth: 32, launchAngleDeg: 30, hitstop: 3,
        projectile: {
          speedX: 6.2, speedY: 0, gravity: 0, radius: 4, lifetime: 52, colorIndex: 13, glowIndex: 14,
        },
      },
      upSpecial: {
        name: 'Fire Fox', startup: 6, active: 14, endlag: 16,
        hitbox: { offsetX: 3, offsetY: -18, width: 18, height: 22 },
        damage: 14, baseKnockback: 4.4, knockbackGrowth: 78, launchAngleDeg: 78, hitstop: 7,
        velocityBoostX: 1.9, velocityBoostY: -7.4,
      },
    },
  },
];
