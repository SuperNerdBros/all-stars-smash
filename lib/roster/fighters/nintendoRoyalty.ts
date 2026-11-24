import type { FighterBlueprint } from '../../types/fighter';
import type { PalettePreset } from '../../types/palette';
import {
  buildNesDemakeChart,
  buildNesPalettes,
  buildSnesRpgChart,
} from '../rpgSpriteBuilder';

// 1. YOSHI (24x24 SNES High-Res Sprite + 16x16 NES Pack)
const YOSHI_SNES = buildSnesRpgChart({
  fxStyle: 'orb',
  snesIdle: [
    '........................',
    '......111111............',
    '.....133333311..........',
    '....1331a133331111......',
    '....133111333333331.....',
    '...18333333333333331....',
    '..188333333333333331....',
    '..1833333a222222221.....',
    '...113333222222221......',
    '....1833332222211.......',
    '...188333333331.........',
    '..1833881333221.........',
    '..13338813322221........',
    '...1133333322221........',
    '..13333333322221........',
    '.13333333332221.........',
    '..111333333331..........',
    '.....133311331..........',
    '.....1331..1331.........',
    '....17771..17771........',
    '....188881.188881.......',
    '....111111.111111.......',
    '........................',
    '........................',
  ],
  snesAttack: [
    '........................',
    '.......111111...........',
    '......133333311.........',
    '.....1331a133331111.....',
    '.....133111333333331....',
    '....18333333333333331...',
    '...188333333333333331...',
    '...183333a22222222111111',
    '....11333222222221888881',
    '.....183332222211111111.',
    '....18833333331.........',
    '...183388133221.........',
    '...1333881322221........',
    '....113333322221........',
    '...133333332221.........',
    '..133333333321..........',
    '...1113333331...........',
    '......1331.1331.........',
    '.....17771..17771.......',
    '.....188881.188881......',
    '.....111111.111111......',
    '........................',
    '........................',
    '........................',
  ],
});

const YOSHI_PALETTES: PalettePreset[] = [
  {
    name: 'SMW Green Yoshi',
    colors: [
      '', '#0A140A', '#F8FAFC', '#22C55E', '#15803D', '#4ADE80', '#166534',
      '#FACC15', '#EF4444', '#991B1B', '#FFFFFF', '#94A3B8', '#16A34A',
      '#4ADE80', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Red Yoshi',
    colors: [
      '', '#140808', '#F8FAFC', '#EF4444', '#991B1B', '#F87171', '#7F1D1D',
      '#FACC15', '#2563EB', '#1E3A8A', '#FFFFFF', '#94A3B8', '#DC2626',
      '#FB923C', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Blue Yoshi',
    colors: [
      '', '#080C18', '#F8FAFC', '#3B82F6', '#1D4ED8', '#60A5FA', '#1E3A8A',
      '#FACC15', '#A855F7', '#6B21A8', '#FFFFFF', '#94A3B8', '#2563EB',
      '#38BDF8', '#E0F2FE', '#FFFFFF',
    ],
  },
  {
    name: 'Yellow Yoshi',
    colors: [
      '', '#141004', '#F8FAFC', '#FACC15', '#CA8A04', '#FEF08A', '#A16207',
      '#F97316', '#22C55E', '#15803D', '#FFFFFF', '#94A3B8', '#EAB308',
      '#FEF08A', '#FFFFFF', '#FFFFFF',
    ],
  },
];

// 2. PEACH (24x24 SNES High-Res Sprite + 16x16 NES Pack)
const PEACH_SNES = buildSnesRpgChart({
  fxStyle: 'aura',
  snesIdle: [
    '.........11111..........',
    '........1777771.........',
    '.......1c7d7d7c1........',
    '......1cccccccc1........',
    '.....1cc122221cc1.......',
    '.....1c12212212c1.......',
    '.....1c12222222c1.......',
    '.....1cc1228221c1.......',
    '......1cc11111cc1.......',
    '.....1c1333d3331c1......',
    '....1c1a3333333a11......',
    '....11aa3433343aa1......',
    '......11334443311.......',
    '.......133333331........',
    '......13335553331.......',
    '.....1335555555331......',
    '....133553333355331.....',
    '...13355333333355331....',
    '...13333344344333331....',
    '..1333344433344433331...',
    '..1555555555555555551...',
    '...11111111111111111....',
    '........................',
    '........................',
  ],
  snesAttack: [
    '........11111...........',
    '.......1777771..........',
    '......1c7d7d7c1.........',
    '.....1cccccccc1.........',
    '....1cc122221cc1........',
    '....1c12212212c1........',
    '....1c12222222c1........',
    '....1cc1228221c1........',
    '.....1cc11111cc1........',
    '....1c1333d3331111111...',
    '...1c1a3333333aa1bbbb1..',
    '...11.13433343111bbbb1..',
    '......133444331..1111...',
    '.....1333333331.........',
    '....133355533331........',
    '...13355555553331.......',
    '..1335533333553331......',
    '..1333334434433331......',
    '.133334443334443331.....',
    '.155555555555555551.....',
    '..1111111111111111......',
    '........................',
    '........................',
    '........................',
  ],
});

const PEACH_PALETTES: PalettePreset[] = [
  {
    name: 'Mushroom Princess',
    colors: [
      '', '#180A14', '#FFE4C4', '#F472B6', '#DB2777', '#FBCFE8', '#BE185D',
      '#FACC15', '#EF4444', '#9D174D', '#FFFFFF', '#64748B', '#FDE047',
      '#38BDF8', '#FBCFE8', '#FFFFFF',
    ],
  },
  {
    name: 'Sarasaland Daisy',
    colors: [
      '', '#181004', '#FFE4C4', '#FACC15', '#CA8A04', '#FEF08A', '#A16207',
      '#F97316', '#EA580C', '#78350F', '#FFFFFF', '#64748B', '#B45309',
      '#22C55E', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Fire Peach',
    colors: [
      '', '#180808', '#FFE4C4', '#F8FAFC', '#CBD5E1', '#EF4444', '#B91C1C',
      '#FACC15', '#EF4444', '#7F1D1D', '#FFFFFF', '#64748B', '#FDE047',
      '#FB923C', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Shadow Queen',
    colors: [
      '', '#090514', '#E2E8F0', '#7C3AED', '#4C1D95', '#C084FC', '#3B0764',
      '#FACC15', '#EF4444', '#1E1B4B', '#E2E8F0', '#475569', '#A855F7',
      '#E879F9', '#FDE047', '#FFFFFF',
    ],
  },
];

// 3. WARIO (24x24 SNES High-Res Sprite + 16x16 NES Pack)
const WARIO_SNES = buildSnesRpgChart({
  fxStyle: 'aura',
  snesIdle: [
    '........................',
    '......111111111.........',
    '.....17777777771........',
    '....1777755777771.......',
    '....177775c777771.......',
    '....11111111111111......',
    '...19922222222221.......',
    '..1922122288221221......',
    '..1922222888822221......',
    '...111111111111111......',
    '...12199912219991.......',
    '....111111111111........',
    '..1177773333777711......',
    '.177777337733777771.....',
    '.177773333333377771.....',
    '.1aa133333333331aa1.....',
    '.1aa133443344331aa1.....',
    '..11.1333333331.11......',
    '.....1333113331.........',
    '.....1333113331.........',
    '....1cc91..19cc1........',
    '...1cccc1..1cccc1.......',
    '...111111..111111.......',
    '........................',
  ],
  snesAttack: [
    '........................',
    '.......111111111........',
    '......17777777771.......',
    '.....1777755777771......',
    '.....177775c777771......',
    '.....11111111111111.....',
    '....19922222222221......',
    '...1922122288221221.....',
    '...1922222888822221.....',
    '....111111111111111.....',
    '....12199912219991......',
    '.....111111111111.......',
    '..1117773333777711111...',
    '.17777733773377777aaa1..',
    '.17777333333337777aaa1..',
    '..1113333333333111111...',
    '.....13344334431........',
    '.....1333333331.........',
    '....13331..13331........',
    '...1cc91....19cc1.......',
    '..1cccc1....1cccc1......',
    '..111111....111111......',
    '........................',
    '........................',
  ],
});

const WARIO_PALETTES: PalettePreset[] = [
  {
    name: 'Wario Land Classic',
    colors: [
      '', '#120A18', '#FFD2A6', '#7C3AED', '#4C1D95', '#2563EB', '#1E3A8A',
      '#FACC15', '#F472B6', '#451A03', '#FFFFFF', '#94A3B8', '#16A34A',
      '#FACC15', '#A855F7', '#FFFFFF',
    ],
  },
  {
    name: 'WarioWare Biker',
    colors: [
      '', '#09090B', '#FFD2A6', '#2563EB', '#1E3A8A', '#FACC15', '#CA8A04',
      '#FACC15', '#EF4444', '#27272A', '#FFFFFF', '#94A3B8', '#DC2626',
      '#38BDF8', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Game Boy Monochrome',
    colors: [
      '', '#0F380F', '#9BBC0F', '#306230', '#0F380F', '#8BAC0F', '#306230',
      '#9BBC0F', '#8BAC0F', '#0F380F', '#9BBC0F', '#8BAC0F', '#306230',
      '#9BBC0F', '#8BAC0F', '#9BBC0F',
    ],
  },
  {
    name: 'Gold Rush',
    colors: [
      '', '#181004', '#FFD2A6', '#B45309', '#78350F', '#FDE047', '#CA8A04',
      '#FACC15', '#F97316', '#451A03', '#FFFFFF', '#94A3B8', '#F59E0B',
      '#FEF08A', '#FFFFFF', '#FFFFFF',
    ],
  },
];

export const NINTENDO_ROYALTY_FIGHTERS: readonly FighterBlueprint[] = [
  {
    id: 'yoshi',
    name: 'Yoshi',
    nickname: 'Egg Dino',
    era: 'SNES',
    originTag: 'Super Mario World',
    archetype: 'high-jumper',
    archetypeLabel: 'Egg Dino',
    gridSize: 24,
    palettes: YOSHI_PALETTES,
    pixelChart: YOSHI_SNES,
    eraPacks: {
      NES: { pixelChart: buildNesDemakeChart(YOSHI_SNES), palettes: buildNesPalettes(YOSHI_PALETTES) },
      SNES_SEGA: { pixelChart: YOSHI_SNES, palettes: YOSHI_PALETTES },
    },
    stats: {
      weight: 98, runSpeed: 2.6, airSpeed: 2.35, jumpForce: 5.9, doubleJumpForce: 6.2,
      maxJumps: 3, gravity: 0.25, fallSpeed: 4.5, fastFallSpeed: 6.4, traction: 0.22,
    },
    moveset: {
      jab: {
        name: 'Tongue Snap', startup: 4, active: 5, endlag: 8,
        hitbox: { offsetX: 15, offsetY: -12, width: 20, height: 10 },
        damage: 6, baseKnockback: 2.2, knockbackGrowth: 34, launchAngleDeg: 35, hitstop: 4,
      },
      smash: {
        name: 'Tail Whip', startup: 9, active: 7, endlag: 14,
        hitbox: { offsetX: 14, offsetY: -10, width: 22, height: 16 },
        damage: 16, baseKnockback: 4.4, knockbackGrowth: 88, launchAngleDeg: 34, hitstop: 8,
      },
      aerial: {
        name: 'Flutter Kick', startup: 4, active: 8, endlag: 8,
        hitbox: { offsetX: 10, offsetY: -8, width: 18, height: 16 },
        damage: 11, baseKnockback: 3.0, knockbackGrowth: 60, launchAngleDeg: 36, hitstop: 6,
      },
      neutralSpecial: {
        name: 'Egg Throw', startup: 8, active: 5, endlag: 13,
        hitbox: { offsetX: 12, offsetY: -12, width: 12, height: 12 },
        damage: 8, baseKnockback: 2.6, knockbackGrowth: 42, launchAngleDeg: 45, hitstop: 5,
        projectile: {
          speedX: 3.8, speedY: -2.2, gravity: 0.14, radius: 5, lifetime: 68, colorIndex: 10, glowIndex: 13, bounces: true,
        },
      },
      upSpecial: {
        name: 'Egg Toss Rise', startup: 4, active: 14, endlag: 16,
        hitbox: { offsetX: 2, offsetY: -16, width: 18, height: 20 },
        damage: 11, baseKnockback: 4.0, knockbackGrowth: 72, launchAngleDeg: 78, hitstop: 6,
        velocityBoostX: 1.5, velocityBoostY: -7.1,
      },
    },
  },
  {
    id: 'peach',
    name: 'Peach',
    nickname: 'Royal Parasol',
    era: 'SNES',
    originTag: 'Super Mario Bros.',
    archetype: 'floaty-puff',
    archetypeLabel: 'Royal Parasol',
    gridSize: 24,
    palettes: PEACH_PALETTES,
    pixelChart: PEACH_SNES,
    eraPacks: {
      NES: { pixelChart: buildNesDemakeChart(PEACH_SNES), palettes: buildNesPalettes(PEACH_PALETTES) },
      SNES_SEGA: { pixelChart: PEACH_SNES, palettes: PEACH_PALETTES },
    },
    stats: {
      weight: 86, runSpeed: 2.35, airSpeed: 2.25, jumpForce: 5.5, doubleJumpForce: 5.1,
      maxJumps: 4, gravity: 0.21, fallSpeed: 3.9, fastFallSpeed: 5.8, traction: 0.21,
    },
    moveset: {
      jab: {
        name: 'Royal Slap', startup: 3, active: 4, endlag: 7,
        hitbox: { offsetX: 13, offsetY: -12, width: 16, height: 12 },
        damage: 5, baseKnockback: 2.0, knockbackGrowth: 32, launchAngleDeg: 40, hitstop: 4,
      },
      smash: {
        name: 'Frying Pan', startup: 10, active: 6, endlag: 15,
        hitbox: { offsetX: 15, offsetY: -12, width: 20, height: 16 },
        damage: 17, baseKnockback: 4.6, knockbackGrowth: 92, launchAngleDeg: 38, hitstop: 8,
      },
      aerial: {
        name: 'Crown Kick', startup: 5, active: 6, endlag: 9,
        hitbox: { offsetX: 12, offsetY: -10, width: 18, height: 14 },
        damage: 12, baseKnockback: 3.2, knockbackGrowth: 66, launchAngleDeg: 32, hitstop: 6,
      },
      neutralSpecial: {
        name: 'Turnip Pluck', startup: 9, active: 4, endlag: 13,
        hitbox: { offsetX: 12, offsetY: -12, width: 12, height: 12 },
        damage: 9, baseKnockback: 2.8, knockbackGrowth: 46, launchAngleDeg: 44, hitstop: 5,
        projectile: {
          speedX: 3.7, speedY: -1.6, gravity: 0.12, radius: 5, lifetime: 64, colorIndex: 10, glowIndex: 13,
        },
      },
      upSpecial: {
        name: 'Peach Parasol', startup: 4, active: 16, endlag: 18,
        hitbox: { offsetX: 0, offsetY: -20, width: 20, height: 22 },
        damage: 10, baseKnockback: 3.8, knockbackGrowth: 70, launchAngleDeg: 80, hitstop: 6,
        velocityBoostX: 1.3, velocityBoostY: -7.0,
      },
    },
  },
  {
    id: 'wario',
    name: 'Wario',
    nickname: 'Treasure Brute',
    era: 'SNES',
    originTag: 'Wario Land',
    archetype: 'heavy-grappler',
    archetypeLabel: 'Treasure Brute',
    gridSize: 24,
    palettes: WARIO_PALETTES,
    pixelChart: WARIO_SNES,
    eraPacks: {
      NES: { pixelChart: buildNesDemakeChart(WARIO_SNES), palettes: buildNesPalettes(WARIO_PALETTES) },
      SNES_SEGA: { pixelChart: WARIO_SNES, palettes: WARIO_PALETTES },
    },
    stats: {
      weight: 118, runSpeed: 2.3, airSpeed: 2.05, jumpForce: 5.3, doubleJumpForce: 4.8,
      maxJumps: 3, gravity: 0.29, fallSpeed: 5.1, fastFallSpeed: 7.2, traction: 0.24,
    },
    moveset: {
      jab: {
        name: 'Garlic Jab', startup: 5, active: 5, endlag: 9,
        hitbox: { offsetX: 14, offsetY: -11, width: 16, height: 14 },
        damage: 8, baseKnockback: 2.8, knockbackGrowth: 42, launchAngleDeg: 32, hitstop: 5,
      },
      smash: {
        name: 'Shoulder Bash', startup: 11, active: 9, endlag: 17,
        hitbox: { offsetX: 16, offsetY: -11, width: 22, height: 18 },
        damage: 19, baseKnockback: 5.0, knockbackGrowth: 96, launchAngleDeg: 30, hitstop: 9,
        velocityBoostX: 2.8,
      },
      aerial: {
        name: 'Belly Flop', startup: 6, active: 7, endlag: 11,
        hitbox: { offsetX: 10, offsetY: -10, width: 20, height: 16 },
        damage: 13, baseKnockback: 3.6, knockbackGrowth: 72, launchAngleDeg: 35, hitstop: 7,
      },
      neutralSpecial: {
        name: 'Chomp Toss', startup: 10, active: 5, endlag: 14,
        hitbox: { offsetX: 14, offsetY: -12, width: 14, height: 12 },
        damage: 10, baseKnockback: 3.1, knockbackGrowth: 50, launchAngleDeg: 40, hitstop: 5,
        projectile: {
          speedX: 3.6, speedY: -1.2, gravity: 0.14, radius: 5, lifetime: 60, colorIndex: 7, glowIndex: 13, bounces: true,
        },
      },
      upSpecial: {
        name: 'Corkscrew Jump', startup: 5, active: 15, endlag: 18,
        hitbox: { offsetX: 2, offsetY: -18, width: 20, height: 22 },
        damage: 14, baseKnockback: 4.5, knockbackGrowth: 78, launchAngleDeg: 78, hitstop: 7,
        velocityBoostX: 1.4, velocityBoostY: -6.9,
      },
    },
  },
];
