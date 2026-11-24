import type { FighterBlueprint } from '../../types/fighter';
import type { PalettePreset } from '../../types/palette';
import {
  buildNesDemakeChart,
  buildNesPalettes,
  buildSnesRpgChart,
} from '../rpgSpriteBuilder';

// 10. MEWTWO (24x24 SNES High-Res Sprite + 16x16 NES Pack)
const MEWTWO_SNES = buildSnesRpgChart({
  fxStyle: 'orb',
  snesIdle: [
    '.....11........11.......',
    '....1221......1221......',
    '....12221111112221......',
    '....12222222222221......',
    '.....121512215121.......',
    '.....122222222221.......',
    '......1222222221........',
    '.......11222211.........',
    '......1222222221........',
    '....11222222222211......',
    '...1221222222221221.....',
    '...121.12233221.121.....',
    '...11..12333321..11.....',
    '.......12333321.........',
    '.......12333321..1111...',
    '......122333321.133331..',
    '......12211122113311331.',
    '......121...121331..131.',
    '......121...12111....1..',
    '.....1221...1221........',
    '.....111.....111........',
    '........................',
    '........................',
    '........................',
  ],
  snesAttack: [
    '......11........11......',
    '.....1221......1221.....',
    '.....12221111112221.....',
    '.....12222222222221.....',
    '......121512215121......',
    '......122222222221......',
    '.......1222222221.......',
    '........11222211........',
    '.......1222222221..1ff..',
    '.....11222222222111ddf1.',
    '....122122222222221ddf1.',
    '....11..12333321111111..',
    '........12333321........',
    '.......122333321.111....',
    '.......12211122113331...',
    '.......121...121311331..',
    '......1221...1221..11...',
    '......111.....111.......',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
});

const MEWTWO_PALETTES: PalettePreset[] = [
  {
    name: 'Cerulean Genetic',
    colors: [
      '', '#090714', '#E9D5FF', '#7E22CE', '#581C87', '#A855F7', '#6B21A8',
      '#FACC15', '#EF4444', '#3B0764', '#FFFFFF', '#94A3B8', '#9333EA',
      '#A855F7', '#F0ABFC', '#FFFFFF',
    ],
  },
  {
    name: 'Shiny Mint',
    colors: [
      '', '#07140E', '#E2E8F0', '#16A34A', '#166534', '#4ADE80', '#15803D',
      '#FACC15', '#EF4444', '#14532D', '#FFFFFF', '#94A3B8', '#22C55E',
      '#4ADE80', '#BBF7D0', '#FFFFFF',
    ],
  },
  {
    name: 'Armored Silver',
    colors: [
      '', '#09090B', '#CBD5E1', '#475569', '#1E293B', '#38BDF8', '#0284C7',
      '#FACC15', '#EF4444', '#0F172A', '#FFFFFF', '#64748B', '#94A3B8',
      '#38BDF8', '#E0F2FE', '#FFFFFF',
    ],
  },
  {
    name: 'Shadow Mewtwo',
    colors: [
      '', '#050507', '#475569', '#312E81', '#1E1B4B', '#F97316', '#EA580C',
      '#F97316', '#EF4444', '#09090B', '#CBD5E1', '#334155', '#6366F1',
      '#F97316', '#FEF08A', '#FFFFFF',
    ],
  },
];

// 11. DIDDY KONG (24x24 SNES High-Res Sprite + 16x16 NES Pack)
const DIDDY_KONG_SNES = buildSnesRpgChart({
  fxStyle: 'orb',
  snesIdle: [
    '........................',
    '......11111111..........',
    '.....1333333331.........',
    '....13333773333111......',
    '....11111111111111......',
    '...1912212122191........',
    '...1912222222191........',
    '....11222222211.........',
    '.....112222211..........',
    '....11333333311.........',
    '...19133377333191.......',
    '..1991333333331991..111.',
    '..121.13333331.121.19991',
    '..11..19999991..1119911.',
    '......19911991...1991...',
    '.....1991..1991..111....',
    '.....1991..1991.........',
    '....12221..12221........',
    '....11111..11111........',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
  snesAttack: [
    '........................',
    '.......11111111.........',
    '......1333333331........',
    '.....13333773333111.....',
    '.....11111111111111.....',
    '....1912212122191.......',
    '....1912222222191.......',
    '.....11222222211........',
    '......112222211.........',
    '.....11333333311111.....',
    '....1913337733312221....',
    '....11.1333333199911....',
    '.......19999991111......',
    '......1991..1991........',
    '.....1991....1991.......',
    '....12221....12221......',
    '....11111....11111......',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
});

const DIDDY_KONG_PALETTES: PalettePreset[] = [
  {
    name: 'DKC Jungle Red',
    colors: [
      '', '#120804', '#FFD2A6', '#EF4444', '#991B1B', '#FACC15', '#CA8A04',
      '#FACC15', '#F97316', '#78350F', '#FFFFFF', '#94A3B8', '#451A03',
      '#FACC15', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Dixie Kong Pink',
    colors: [
      '', '#180814', '#FFD2A6', '#EC4899', '#9D174D', '#FACC15', '#CA8A04',
      '#FACC15', '#F472B6', '#78350F', '#FFFFFF', '#94A3B8', '#FDE047',
      '#F472B6', '#FBCFE8', '#FFFFFF',
    ],
  },
  {
    name: 'Funky Teal',
    colors: [
      '', '#061414', '#FFD2A6', '#14B8A6', '#0F766E', '#F8FAFC', '#CBD5E1',
      '#FACC15', '#F97316', '#78350F', '#FFFFFF', '#94A3B8', '#581C87',
      '#2DD4BF', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Shadow Kong',
    colors: [
      '', '#09090B', '#CBD5E1', '#312E81', '#1E1B4B', '#A855F7', '#6B21A8',
      '#FACC15', '#EF4444', '#27272A', '#FFFFFF', '#64748B', '#18181B',
      '#A855F7', '#E879F9', '#FFFFFF',
    ],
  },
];

// 12. POPO (ICE CLIMBER) (24x24 SNES High-Res Sprite + 16x16 NES Pack)
const ICE_CLIMBER_SNES = buildSnesRpgChart({
  fxStyle: 'slash',
  snesIdle: [
    '.......11111111.........',
    '......1333333331........',
    '.....133aaaaaa331.......',
    '....133a222222a331......',
    '....133a212212a331......',
    '....133a222222a331......',
    '.....133aaaaaa331.......',
    '.....113333333311.......',
    '....1333333333331..111..',
    '...13333333333331.19991.',
    '..1aa1333333331aa199991.',
    '..1aa1334433441aa11911..',
    '...11.133333331...191...',
    '......1aaaaaaa1...191...',
    '.....13331113331..11....',
    '.....1331...1331........',
    '....19991...19991.......',
    '....19991...19991.......',
    '....11111...11111.......',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
  snesAttack: [
    '........11111111........',
    '.......1333333331.......',
    '......133aaaaaa331......',
    '.....133a222222a331.....',
    '.....133a212212a331.....',
    '.....133a222222a331.....',
    '......133aaaaaa331......',
    '......113333333311......',
    '.....1333333333331......',
    '....13333333333331......',
    '....1aa13333331aa111111.',
    '.....11.133333199999991.',
    '........1aaaaa1...19991.',
    '.......133313331..19991.',
    '......1331..1331...111..',
    '.....19991..19991.......',
    '.....19991..19991.......',
    '.....11111..11111.......',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
});

const ICE_CLIMBER_PALETTES: PalettePreset[] = [
  {
    name: 'Popo Classic Blue',
    colors: [
      '', '#080C18', '#FFD2A6', '#2563EB', '#1E3A8A', '#38BDF8', '#0284C7',
      '#FACC15', '#F97316', '#92400E', '#F8FAFC', '#94A3B8', '#1D4ED8',
      '#38BDF8', '#E0F2FE', '#FFFFFF',
    ],
  },
  {
    name: 'Nana Pink Parka',
    colors: [
      '', '#180814', '#FFD2A6', '#EC4899', '#9D174D', '#F472B6', '#BE185D',
      '#FACC15', '#F97316', '#92400E', '#F8FAFC', '#94A3B8', '#DB2777',
      '#F472B6', '#FBCFE8', '#FFFFFF',
    ],
  },
  {
    name: 'Arctic Red',
    colors: [
      '', '#140808', '#FFD2A6', '#DC2626', '#991B1B', '#EF4444', '#7F1D1D',
      '#FACC15', '#F97316', '#78350F', '#F8FAFC', '#94A3B8', '#B91C1C',
      '#38BDF8', '#E0F2FE', '#FFFFFF',
    ],
  },
  {
    name: 'Glacier Mint',
    colors: [
      '', '#061412', '#FFD2A6', '#10B981', '#047857', '#34D399', '#065F46',
      '#FACC15', '#F97316', '#78350F', '#F8FAFC', '#94A3B8', '#059669',
      '#67E8F9', '#E0F2FE', '#FFFFFF',
    ],
  },
];

export const NINTENDO_DEEP_CUTS_FIGHTERS: readonly FighterBlueprint[] = [
  {
    id: 'mewtwo',
    name: 'Mewtwo',
    nickname: 'Genetic PSI',
    era: 'SNES',
    originTag: 'Pokemon Red/Blue',
    archetype: 'zoner',
    archetypeLabel: 'Genetic PSI',
    gridSize: 24,
    palettes: MEWTWO_PALETTES,
    pixelChart: MEWTWO_SNES,
    eraPacks: {
      NES: { pixelChart: buildNesDemakeChart(MEWTWO_SNES), palettes: buildNesPalettes(MEWTWO_PALETTES) },
      SNES_SEGA: { pixelChart: MEWTWO_SNES, palettes: MEWTWO_PALETTES },
    },
    stats: {
      weight: 86, runSpeed: 2.65, airSpeed: 2.3, jumpForce: 5.7, doubleJumpForce: 5.4,
      maxJumps: 3, gravity: 0.22, fallSpeed: 4.1, fastFallSpeed: 6.1, traction: 0.21,
    },
    moveset: {
      jab: {
        name: 'Shadow Claw', startup: 4, active: 5, endlag: 8,
        hitbox: { offsetX: 14, offsetY: -12, width: 18, height: 14 },
        damage: 7, baseKnockback: 2.3, knockbackGrowth: 38, launchAngleDeg: 38, hitstop: 4,
      },
      smash: {
        name: 'Psychic Wave', startup: 10, active: 6, endlag: 15,
        hitbox: { offsetX: 16, offsetY: -12, width: 22, height: 18 },
        damage: 18, baseKnockback: 4.8, knockbackGrowth: 94, launchAngleDeg: 36, hitstop: 8,
      },
      aerial: {
        name: 'Tail Sweep', startup: 5, active: 6, endlag: 9,
        hitbox: { offsetX: 12, offsetY: -10, width: 20, height: 14 },
        damage: 12, baseKnockback: 3.3, knockbackGrowth: 68, launchAngleDeg: 34, hitstop: 6,
      },
      neutralSpecial: {
        name: 'Shadow Ball', startup: 10, active: 5, endlag: 14,
        hitbox: { offsetX: 14, offsetY: -12, width: 14, height: 12 },
        damage: 11, baseKnockback: 3.2, knockbackGrowth: 56, launchAngleDeg: 38, hitstop: 6,
        projectile: {
          speedX: 4.4, speedY: 0, gravity: 0, radius: 6, lifetime: 64, colorIndex: 13, glowIndex: 14,
        },
      },
      upSpecial: {
        name: 'Teleport Rise', startup: 4, active: 12, endlag: 15,
        hitbox: { offsetX: 0, offsetY: -18, width: 18, height: 22 },
        damage: 10, baseKnockback: 3.8, knockbackGrowth: 70, launchAngleDeg: 80, hitstop: 5,
        velocityBoostX: 1.6, velocityBoostY: -7.3,
      },
    },
  },
  {
    id: 'diddy-kong',
    name: 'Diddy Kong',
    nickname: 'Jungle Acrobat',
    era: 'SNES',
    originTag: 'Donkey Kong Country',
    archetype: 'speedster',
    archetypeLabel: 'Jungle Acrobat',
    gridSize: 24,
    palettes: DIDDY_KONG_PALETTES,
    pixelChart: DIDDY_KONG_SNES,
    eraPacks: {
      NES: { pixelChart: buildNesDemakeChart(DIDDY_KONG_SNES), palettes: buildNesPalettes(DIDDY_KONG_PALETTES) },
      SNES_SEGA: { pixelChart: DIDDY_KONG_SNES, palettes: DIDDY_KONG_PALETTES },
    },
    stats: {
      weight: 88, runSpeed: 3.05, airSpeed: 2.45, jumpForce: 5.8, doubleJumpForce: 5.3,
      maxJumps: 3, gravity: 0.27, fallSpeed: 4.9, fastFallSpeed: 7.0, traction: 0.24,
    },
    moveset: {
      jab: {
        name: 'Tail Slap', startup: 3, active: 5, endlag: 7,
        hitbox: { offsetX: 14, offsetY: -11, width: 17, height: 12 },
        damage: 5, baseKnockback: 2.0, knockbackGrowth: 32, launchAngleDeg: 36, hitstop: 3,
      },
      smash: {
        name: 'Monkey Flip', startup: 9, active: 7, endlag: 13,
        hitbox: { offsetX: 15, offsetY: -11, width: 20, height: 15 },
        damage: 15, baseKnockback: 4.2, knockbackGrowth: 86, launchAngleDeg: 34, hitstop: 7,
        velocityBoostX: 2.3,
      },
      aerial: {
        name: 'Cartwheel Kick', startup: 4, active: 6, endlag: 8,
        hitbox: { offsetX: 11, offsetY: -10, width: 18, height: 14 },
        damage: 10, baseKnockback: 3.0, knockbackGrowth: 62, launchAngleDeg: 34, hitstop: 5,
      },
      neutralSpecial: {
        name: 'Peanut Popgun', startup: 8, active: 4, endlag: 12,
        hitbox: { offsetX: 14, offsetY: -12, width: 12, height: 10 },
        damage: 7, baseKnockback: 2.3, knockbackGrowth: 38, launchAngleDeg: 36, hitstop: 4,
        projectile: {
          speedX: 5.0, speedY: -0.4, gravity: 0.06, radius: 4, lifetime: 58, colorIndex: 7, glowIndex: 14,
        },
      },
      upSpecial: {
        name: 'Rocketbarrel', startup: 5, active: 14, endlag: 17,
        hitbox: { offsetX: 2, offsetY: -18, width: 18, height: 22 },
        damage: 13, baseKnockback: 4.3, knockbackGrowth: 76, launchAngleDeg: 78, hitstop: 7,
        velocityBoostX: 1.8, velocityBoostY: -7.2,
      },
    },
  },
  {
    id: 'ice-climber',
    name: 'Popo',
    nickname: 'Summit Climber',
    era: 'NES',
    originTag: 'Ice Climber',
    archetype: 'brawler',
    archetypeLabel: 'Summit Climber',
    gridSize: 24,
    palettes: ICE_CLIMBER_PALETTES,
    pixelChart: ICE_CLIMBER_SNES,
    eraPacks: {
      NES: { pixelChart: buildNesDemakeChart(ICE_CLIMBER_SNES), palettes: buildNesPalettes(ICE_CLIMBER_PALETTES) },
      SNES_SEGA: { pixelChart: ICE_CLIMBER_SNES, palettes: ICE_CLIMBER_PALETTES },
    },
    stats: {
      weight: 94, runSpeed: 2.55, airSpeed: 2.15, jumpForce: 5.7, doubleJumpForce: 5.2,
      maxJumps: 3, gravity: 0.25, fallSpeed: 4.4, fastFallSpeed: 6.4, traction: 0.19,
    },
    moveset: {
      jab: {
        name: 'Mallet Bonk', startup: 4, active: 5, endlag: 7,
        hitbox: { offsetX: 14, offsetY: -12, width: 18, height: 13 },
        damage: 6, baseKnockback: 2.3, knockbackGrowth: 36, launchAngleDeg: 38, hitstop: 4,
      },
      smash: {
        name: 'Frost Smash', startup: 10, active: 6, endlag: 15,
        hitbox: { offsetX: 16, offsetY: -12, width: 22, height: 16 },
        damage: 18, baseKnockback: 4.6, knockbackGrowth: 92, launchAngleDeg: 35, hitstop: 8,
      },
      aerial: {
        name: 'Squall Spin', startup: 5, active: 6, endlag: 9,
        hitbox: { offsetX: 10, offsetY: -10, width: 18, height: 15 },
        damage: 11, baseKnockback: 3.1, knockbackGrowth: 64, launchAngleDeg: 34, hitstop: 6,
      },
      neutralSpecial: {
        name: 'Ice Shot', startup: 9, active: 4, endlag: 13,
        hitbox: { offsetX: 14, offsetY: -10, width: 12, height: 10 },
        damage: 8, baseKnockback: 2.5, knockbackGrowth: 42, launchAngleDeg: 35, hitstop: 4,
        projectile: {
          speedX: 3.9, speedY: 0, gravity: 0.1, radius: 5, lifetime: 62, colorIndex: 13, glowIndex: 14, bounces: true,
        },
      },
      upSpecial: {
        name: 'Belay Ascent', startup: 4, active: 14, endlag: 16,
        hitbox: { offsetX: 2, offsetY: -18, width: 18, height: 22 },
        damage: 12, baseKnockback: 4.2, knockbackGrowth: 74, launchAngleDeg: 78, hitstop: 6,
        velocityBoostX: 1.5, velocityBoostY: -7.1,
      },
    },
  },
];
