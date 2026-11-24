import type { FighterBlueprint } from '../../types/fighter';
import type { PalettePreset } from '../../types/palette';
import {
  buildNesDemakeChart,
  buildNesPalettes,
  buildSnesRpgChart,
} from '../rpgSpriteBuilder';

// 13. TAILS (24x24 SNES/SEGA High-Res Sprite + 16x16 NES Pack)
const TAILS_SNES = buildSnesRpgChart({
  fxStyle: 'aura',
  snesIdle: [
    '........................',
    '....11..........11......',
    '...1321........1321.....',
    '...1333111111113331.....',
    '..133333333333333331....',
    '...1331a13331a13331.....',
    '...1322222222222231.....',
    '....11222112222211......',
    '.....111222222111.......',
    '....1aa13322331aa1......',
    '...1aaa13222231aaa1.111.',
    '...1aa1133223311aa1133a1',
    '.1111..13333331..1333aa1',
    '133a1..13311331..133111.',
    '1333a1.13311331.111.....',
    '.1111..13311331.........',
    '.......18811881.........',
    '......18a8118a81........',
    '......1111111111........',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
  snesAttack: [
    '........................',
    '.....11..........11.....',
    '....1321........1321....',
    '....1333111111113331....',
    '...133333333333333331...',
    '....1331a13331a13331....',
    '....1322222222222231....',
    '.....11222112222211.....',
    '......111222222111......',
    '.....1aa13322331aa1.....',
    '....1aaa13222231aaa1....',
    '...111113333333111133a1.',
    '..133aa13311331...133aa1',
    '..1333113311331....1111.',
    '...111.18811881.........',
    '......18a8118a81........',
    '......1111111111........',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
});

const TAILS_PALETTES: PalettePreset[] = [
  {
    name: 'Genesis Amber',
    colors: [
      '', '#120A04', '#F8FAFC', '#F59E0B', '#B45309', '#FBBF24', '#92400E',
      '#FACC15', '#EF4444', '#78350F', '#FFFFFF', '#94A3B8', '#D97706',
      '#FACC15', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Super Tails Gold',
    colors: [
      '', '#141004', '#FFFFFF', '#FDE047', '#CA8A04', '#FEF08A', '#A16207',
      '#FACC15', '#EF4444', '#78350F', '#FFFFFF', '#94A3B8', '#EAB308',
      '#FEF08A', '#FFFFFF', '#FFFFFF',
    ],
  },
  {
    name: 'Miles Blue',
    colors: [
      '', '#080C18', '#F8FAFC', '#3B82F6', '#1D4ED8', '#60A5FA', '#1E3A8A',
      '#FACC15', '#EF4444', '#1E293B', '#FFFFFF', '#94A3B8', '#2563EB',
      '#38BDF8', '#E0F2FE', '#FFFFFF',
    ],
  },
  {
    name: 'Cyber Tails',
    colors: [
      '', '#09090B', '#E2E8F0', '#94A3B8', '#475569', '#38BDF8', '#0284C7',
      '#FACC15', '#EF4444', '#1E293B', '#FFFFFF', '#64748B', '#38BDF8',
      '#67E8F9', '#E0F2FE', '#FFFFFF',
    ],
  },
];

// 14. KNUCKLES (24x24 SNES/SEGA High-Res Sprite + 16x16 NES Pack)
const KNUCKLES_SNES = buildSnesRpgChart({
  fxStyle: 'aura',
  snesIdle: [
    '........................',
    '......11111111..........',
    '.....1333333331.........',
    '....133333333331........',
    '...133131a1331a31.......',
    '...13313222222231.......',
    '..13431222112221........',
    '..1343112222221.........',
    '.13431..111111..........',
    '.1331..133aa331.........',
    '..11..1333333331........',
    '.....1aa133331aa1.......',
    '....1aaa133331aaa1......',
    '....1aa1.1331.1aa1......',
    '.....11..1331..11.......',
    '........1331331.........',
    '........1331331.........',
    '.......188717881........',
    '......188c717c881.......',
    '......11111111111.......',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
  snesAttack: [
    '........................',
    '.......11111111.........',
    '......1333333331........',
    '.....133333333331.......',
    '....133131a1331a31......',
    '....13313222222231......',
    '...13431222112221.......',
    '...1343112222221........',
    '..13431..111111.........',
    '..1331..133aa331........',
    '...11..1333333331111....',
    '......1aa133331aaaaa1...',
    '......111133331aaaaa1...',
    '.........1331..11111....',
    '........1331331.........',
    '.......188717881........',
    '......188c717c881.......',
    '......11111111111.......',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
});

const KNUCKLES_PALETTES: PalettePreset[] = [
  {
    name: 'Angel Island Red',
    colors: [
      '', '#140606', '#FFD2A6', '#EF4444', '#991B1B', '#F8FAFC', '#CBD5E1',
      '#FACC15', '#DC2626', '#78350F', '#FFFFFF', '#94A3B8', '#22C55E',
      '#EF4444', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Hyper Knuckles',
    colors: [
      '', '#180614', '#FCE7F3', '#F472B6', '#BE185D', '#F8FAFC', '#CBD5E1',
      '#FACC15', '#EC4899', '#831843', '#FFFFFF', '#94A3B8', '#22C55E',
      '#F472B6', '#FFFFFF', '#FFFFFF',
    ],
  },
  {
    name: 'Chaos Blue',
    colors: [
      '', '#060B18', '#E0F2FE', '#3B82F6', '#1D4ED8', '#F8FAFC', '#CBD5E1',
      '#FACC15', '#2563EB', '#1E3A8A', '#FFFFFF', '#94A3B8', '#38BDF8',
      '#38BDF8', '#E0F2FE', '#FFFFFF',
    ],
  },
  {
    name: 'Enerjak Gold',
    colors: [
      '', '#140E04', '#FEF3C7', '#F59E0B', '#B45309', '#FDE047', '#CA8A04',
      '#FACC15', '#EF4444', '#78350F', '#FFFFFF', '#94A3B8', '#A855F7',
      '#FACC15', '#FEF08A', '#FFFFFF',
    ],
  },
];

// 15. AXEL STONE (24x24 SNES/SEGA High-Res Sprite + 16x16 NES Pack)
const AXEL_STONE_SNES = buildSnesRpgChart({
  fxStyle: 'aura',
  snesIdle: [
    '........111111..........',
    '.......1cccccc1.........',
    '......1cccccccc1........',
    '......1333333331........',
    '......1221221221........',
    '......1222222221........',
    '.......12222221.........',
    '.....111aaaaaa111.......',
    '....1221aaaaaa1221......',
    '...12221aaaaaa12221.....',
    '...13311aaaaaa11331.....',
    '...1331.1aaaa1.1331.....',
    '....11..199991..11......',
    '........155551..........',
    '.......15561651.........',
    '.......15511551.........',
    '......1555115551........',
    '......1551..1551........',
    '......1aa1..1aa1........',
    '.....1aaa1..1aaa1.......',
    '.....11111..11111.......',
    '........................',
    '........................',
    '........................',
  ],
  snesAttack: [
    '.........111111.........',
    '........1cccccc1........',
    '.......1cccccccc1.......',
    '.......1333333331.......',
    '.......1221221221.......',
    '.......1222222221.......',
    '........12222221........',
    '.....1111aaaaaa111......',
    '....12221aaaaaa122211...',
    '...1331.1aaaaaa1222331..',
    '....11..1aaaaaa1111331..',
    '........199991....111...',
    '.......1555551..........',
    '......155616551.........',
    '.....1551..1551.........',
    '....1551....1551........',
    '....1aa1....1aa1........',
    '...1aaa1....1aaa1.......',
    '...11111....11111.......',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
});

const AXEL_STONE_PALETTES: PalettePreset[] = [
  {
    name: 'Streets of Rage',
    colors: [
      '', '#0A0D18', '#FFD2A6', '#EF4444', '#991B1B', '#2563EB', '#1E3A8A',
      '#FACC15', '#F97316', '#18181B', '#F8FAFC', '#94A3B8', '#FACC15',
      '#F97316', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Blaze Crimson',
    colors: [
      '', '#18060A', '#FFD2A6', '#DC2626', '#991B1B', '#18181B', '#09090B',
      '#FACC15', '#EF4444', '#27272A', '#F8FAFC', '#94A3B8', '#78350F',
      '#EF4444', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Adam Gold',
    colors: [
      '', '#140E04', '#92400E', '#FACC15', '#CA8A04', '#1E293B', '#0F172A',
      '#FDE047', '#F97316', '#18181B', '#F8FAFC', '#94A3B8', '#18181B',
      '#FACC15', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Bare Knuckle Dark',
    colors: [
      '', '#09090B', '#FFD2A6', '#7C3AED', '#4C1D95', '#334155', '#1E293B',
      '#FACC15', '#A855F7', '#09090B', '#CBD5E1', '#64748B', '#E2E8F0',
      '#A855F7', '#F0ABFC', '#FFFFFF',
    ],
  },
];

export const SEGA_LEGENDS_FIGHTERS: readonly FighterBlueprint[] = [
  {
    id: 'tails',
    name: 'Tails',
    nickname: 'Twin-Tail Fox',
    era: 'SEGA',
    originTag: 'Sonic the Hedgehog 2',
    archetype: 'floaty-puff',
    archetypeLabel: 'Twin-Tail Fox',
    gridSize: 24,
    palettes: TAILS_PALETTES,
    pixelChart: TAILS_SNES,
    eraPacks: {
      NES: { pixelChart: buildNesDemakeChart(TAILS_SNES), palettes: buildNesPalettes(TAILS_PALETTES) },
      SNES_SEGA: { pixelChart: TAILS_SNES, palettes: TAILS_PALETTES },
    },
    stats: {
      weight: 82, runSpeed: 2.8, airSpeed: 2.45, jumpForce: 5.6, doubleJumpForce: 5.4,
      maxJumps: 5, gravity: 0.21, fallSpeed: 3.9, fastFallSpeed: 5.8, traction: 0.22,
    },
    moveset: {
      jab: {
        name: 'Twin Tail Whip', startup: 3, active: 5, endlag: 6,
        hitbox: { offsetX: 14, offsetY: -10, width: 18, height: 12 },
        damage: 5, baseKnockback: 2.0, knockbackGrowth: 32, launchAngleDeg: 38, hitstop: 3,
      },
      smash: {
        name: 'Cyclone Spin', startup: 9, active: 8, endlag: 13,
        hitbox: { offsetX: 12, offsetY: -10, width: 22, height: 15 },
        damage: 15, baseKnockback: 4.2, knockbackGrowth: 84, launchAngleDeg: 36, hitstop: 7,
      },
      aerial: {
        name: 'Air Swipe', startup: 4, active: 6, endlag: 8,
        hitbox: { offsetX: 10, offsetY: -10, width: 18, height: 14 },
        damage: 10, baseKnockback: 3.0, knockbackGrowth: 60, launchAngleDeg: 34, hitstop: 5,
      },
      neutralSpecial: {
        name: 'Ring Toss', startup: 8, active: 4, endlag: 11,
        hitbox: { offsetX: 14, offsetY: -12, width: 12, height: 10 },
        damage: 7, baseKnockback: 2.2, knockbackGrowth: 38, launchAngleDeg: 38, hitstop: 4,
        projectile: {
          speedX: 4.6, speedY: 0, gravity: 0, radius: 5, lifetime: 60, colorIndex: 7, glowIndex: 14,
        },
      },
      upSpecial: {
        name: 'Propeller Flight', startup: 4, active: 16, endlag: 16,
        hitbox: { offsetX: 0, offsetY: -18, width: 18, height: 22 },
        damage: 10, baseKnockback: 3.8, knockbackGrowth: 68, launchAngleDeg: 82, hitstop: 5,
        velocityBoostX: 1.5, velocityBoostY: -7.2,
      },
    },
  },
  {
    id: 'knuckles',
    name: 'Knuckles',
    nickname: 'Master Guardian',
    era: 'SEGA',
    originTag: 'Sonic & Knuckles',
    archetype: 'boxer',
    archetypeLabel: 'Master Guardian',
    gridSize: 24,
    palettes: KNUCKLES_PALETTES,
    pixelChart: KNUCKLES_SNES,
    eraPacks: {
      NES: { pixelChart: buildNesDemakeChart(KNUCKLES_SNES), palettes: buildNesPalettes(KNUCKLES_PALETTES) },
      SNES_SEGA: { pixelChart: KNUCKLES_SNES, palettes: KNUCKLES_PALETTES },
    },
    stats: {
      weight: 102, runSpeed: 2.75, airSpeed: 2.25, jumpForce: 5.6, doubleJumpForce: 5.1,
      maxJumps: 3, gravity: 0.27, fallSpeed: 4.8, fastFallSpeed: 6.9, traction: 0.24,
    },
    moveset: {
      jab: {
        name: 'Spiked Jab', startup: 3, active: 5, endlag: 7,
        hitbox: { offsetX: 14, offsetY: -11, width: 16, height: 12 },
        damage: 7, baseKnockback: 2.4, knockbackGrowth: 38, launchAngleDeg: 35, hitstop: 4,
      },
      smash: {
        name: 'Maximum Heat', startup: 10, active: 7, endlag: 15,
        hitbox: { offsetX: 16, offsetY: -11, width: 22, height: 16 },
        damage: 19, baseKnockback: 4.9, knockbackGrowth: 96, launchAngleDeg: 32, hitstop: 9,
        velocityBoostX: 2.2,
      },
      aerial: {
        name: 'Glide Punch', startup: 5, active: 6, endlag: 9,
        hitbox: { offsetX: 12, offsetY: -10, width: 18, height: 14 },
        damage: 12, baseKnockback: 3.3, knockbackGrowth: 66, launchAngleDeg: 32, hitstop: 6,
      },
      neutralSpecial: {
        name: 'Rock Quake', startup: 9, active: 5, endlag: 13,
        hitbox: { offsetX: 14, offsetY: -10, width: 14, height: 12 },
        damage: 9, baseKnockback: 2.8, knockbackGrowth: 48, launchAngleDeg: 40, hitstop: 5,
        projectile: {
          speedX: 3.9, speedY: -1.4, gravity: 0.14, radius: 5, lifetime: 58, colorIndex: 9, glowIndex: 13,
        },
      },
      upSpecial: {
        name: 'Spiral Upper', startup: 4, active: 14, endlag: 17,
        hitbox: { offsetX: 4, offsetY: -18, width: 18, height: 22 },
        damage: 13, baseKnockback: 4.4, knockbackGrowth: 78, launchAngleDeg: 78, hitstop: 7,
        velocityBoostX: 1.5, velocityBoostY: -7.0,
      },
    },
  },
  {
    id: 'axel-stone',
    name: 'Axel Stone',
    nickname: 'Street Vigilante',
    era: 'SEGA',
    originTag: 'Streets of Rage',
    archetype: 'brawler',
    archetypeLabel: 'Street Vigilante',
    gridSize: 24,
    palettes: AXEL_STONE_PALETTES,
    pixelChart: AXEL_STONE_SNES,
    eraPacks: {
      NES: { pixelChart: buildNesDemakeChart(AXEL_STONE_SNES), palettes: buildNesPalettes(AXEL_STONE_PALETTES) },
      SNES_SEGA: { pixelChart: AXEL_STONE_SNES, palettes: AXEL_STONE_PALETTES },
    },
    stats: {
      weight: 100, runSpeed: 2.6, airSpeed: 2.1, jumpForce: 5.5, doubleJumpForce: 5.0,
      maxJumps: 3, gravity: 0.27, fallSpeed: 4.8, fastFallSpeed: 6.8, traction: 0.23,
    },
    moveset: {
      jab: {
        name: 'Street Combo', startup: 3, active: 5, endlag: 7,
        hitbox: { offsetX: 14, offsetY: -12, width: 16, height: 12 },
        damage: 6, baseKnockback: 2.2, knockbackGrowth: 36, launchAngleDeg: 36, hitstop: 4,
      },
      smash: {
        name: 'Dragon Smash', startup: 10, active: 6, endlag: 15,
        hitbox: { offsetX: 16, offsetY: -12, width: 22, height: 16 },
        damage: 18, baseKnockback: 4.7, knockbackGrowth: 94, launchAngleDeg: 34, hitstop: 8,
      },
      aerial: {
        name: 'Flying Knee', startup: 5, active: 6, endlag: 9,
        hitbox: { offsetX: 12, offsetY: -10, width: 18, height: 14 },
        damage: 12, baseKnockback: 3.3, knockbackGrowth: 66, launchAngleDeg: 32, hitstop: 6,
      },
      neutralSpecial: {
        name: 'Fire Wave', startup: 9, active: 5, endlag: 13,
        hitbox: { offsetX: 14, offsetY: -12, width: 12, height: 12 },
        damage: 9, baseKnockback: 2.8, knockbackGrowth: 46, launchAngleDeg: 38, hitstop: 5,
        projectile: {
          speedX: 4.4, speedY: 0, gravity: 0, radius: 5, lifetime: 56, colorIndex: 8, glowIndex: 14,
        },
      },
      upSpecial: {
        name: 'Grand Upper', startup: 4, active: 14, endlag: 17,
        hitbox: { offsetX: 4, offsetY: -18, width: 18, height: 22 },
        damage: 14, baseKnockback: 4.5, knockbackGrowth: 80, launchAngleDeg: 78, hitstop: 7,
        velocityBoostX: 1.6, velocityBoostY: -7.0,
      },
    },
  },
];
