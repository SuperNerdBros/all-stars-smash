import type { FighterBlueprint } from '../../types/fighter';
import type { PalettePreset } from '../../types/palette';
import {
  buildNesDemakeChart,
  buildNesPalettes,
  buildSnesRpgChart,
} from '../rpgSpriteBuilder';
import { BOMBERMAN_DUAL_ERA } from './bombermanSprite';
import { PAC_MAN_ARCADE_PALETTES, PAC_MAN_DUAL_ERA } from './pacmanSprite';

const PAC_MAN_SNES = PAC_MAN_DUAL_ERA.snesChart;
const PAC_MAN_NES = PAC_MAN_DUAL_ERA.nesChart;
const PAC_MAN_PALETTES = PAC_MAN_ARCADE_PALETTES;

const BOMBERMAN_SNES = BOMBERMAN_DUAL_ERA.snesChart;
const BOMBERMAN_NES = BOMBERMAN_DUAL_ERA.nesChart;

const BOMBERMAN_PALETTES: PalettePreset[] = [
  {
    name: 'White Bomber',
    colors: [
      '', '#0A0D18', '#FFD2A6', '#F8FAFC', '#CBD5E1', '#2563EB', '#1E3A8A',
      '#FACC15', '#EC4899', '#9D174D', '#FFFFFF', '#1E293B', '#38BDF8',
      '#F97316', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Black Bomber',
    colors: [
      '', '#09090B', '#FFD2A6', '#334155', '#1E293B', '#18181B', '#09090B',
      '#FACC15', '#EF4444', '#7F1D1D', '#E2E8F0', '#475569', '#F97316',
      '#EF4444', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Red Bomber',
    colors: [
      '', '#140808', '#FFD2A6', '#EF4444', '#991B1B', '#B91C1C', '#7F1D1D',
      '#FACC15', '#FACC15', '#CA8A04', '#FFFFFF', '#1E293B', '#F97316',
      '#FB923C', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Gold Bomber',
    colors: [
      '', '#141004', '#FFD2A6', '#FACC15', '#CA8A04', '#D97706', '#92400E',
      '#FEF08A', '#38BDF8', '#0284C7', '#FFFFFF', '#1E293B', '#F59E0B',
      '#38BDF8', '#FEF08A', '#FFFFFF',
    ],
  },
];

// 18. BUB (BUBBLE BOBBLE) (24x24 SNES High-Res Sprite + 16x16 NES Pack)
const BUB_SNES = buildSnesRpgChart({
  fxStyle: 'orb',
  snesIdle: [
    '........................',
    '......1111111...........',
    '.....1333333311.........',
    '....133331a13331........',
    '...18333311133331.......',
    '..1883333333333331......',
    '..1833333333311111......',
    '...11333333333331.......',
    '..18133333333331........',
    '.18833333777731.........',
    '.13333337777771.........',
    '..1133337777771.........',
    '..1333337777771.........',
    '.13333333777731.........',
    '.1333333333331..........',
    '..11133333331...........',
    '.....13311331...........',
    '.....13311331...........',
    '....1888118881..........',
    '....1111111111..........',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
  snesAttack: [
    '........................',
    '.......1111111..........',
    '......1333333311........',
    '.....133331a13331.......',
    '....18333311133331......',
    '...1883333333333331.....',
    '...183333333331111......',
    '....1133333333331..1dd1.',
    '...1813333333331..1dffd1',
    '..18833333777731..1dffd1',
    '..13333337777771...1dd1.',
    '...1133337777771........',
    '...1333337777771........',
    '..13333333777731........',
    '...111333333331.........',
    '......13311331..........',
    '.....1888118881.........',
    '.....1111111111.........',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
});

const BUB_PALETTES: PalettePreset[] = [
  {
    name: 'Bubblun Green',
    colors: [
      '', '#06140A', '#F8FAFC', '#22C55E', '#15803D', '#4ADE80', '#166534',
      '#FACC15', '#F97316', '#9A3412', '#FFFFFF', '#94A3B8', '#16A34A',
      '#38BDF8', '#E0F2FE', '#FFFFFF',
    ],
  },
  {
    name: 'Bobblun Blue',
    colors: [
      '', '#060C18', '#F8FAFC', '#38BDF8', '#0284C7', '#60A5FA', '#1E3A8A',
      '#FACC15', '#F97316', '#9A3412', '#FFFFFF', '#94A3B8', '#2563EB',
      '#67E8F9', '#E0F2FE', '#FFFFFF',
    ],
  },
  {
    name: 'Rainbow Bubble',
    colors: [
      '', '#140814', '#F8FAFC', '#EC4899', '#9D174D', '#A855F7', '#6B21A8',
      '#FACC15', '#38BDF8', '#78350F', '#FFFFFF', '#94A3B8', '#F472B6',
      '#A855F7', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Baron Dark',
    colors: [
      '', '#09090B', '#CBD5E1', '#6B21A8', '#3B0764', '#9333EA', '#581C87',
      '#FACC15', '#EF4444', '#18181B', '#FFFFFF', '#64748B', '#7C3AED',
      '#E879F9', '#FEF08A', '#FFFFFF',
    ],
  },
];

export const ARCADE_LEGENDS_FIGHTERS: readonly FighterBlueprint[] = [
  {
    id: 'pac-man',
    name: 'Pac-Man',
    nickname: 'Maze Chomper',
    era: 'NES',
    originTag: 'Pac-Man',
    archetype: 'brawler',
    archetypeLabel: 'Maze Chomper',
    gridSize: 32,
    palettes: PAC_MAN_PALETTES,
    pixelChart: PAC_MAN_SNES,
    eraPacks: {
      NES: { pixelChart: PAC_MAN_NES, palettes: buildNesPalettes(PAC_MAN_PALETTES) },
      SNES_SEGA: { pixelChart: PAC_MAN_SNES, palettes: PAC_MAN_PALETTES },
    },
    stats: {
      weight: 95, runSpeed: 2.6, airSpeed: 2.2, jumpForce: 5.5, doubleJumpForce: 5.1,
      maxJumps: 3, gravity: 0.25, fallSpeed: 4.5, fastFallSpeed: 6.5, traction: 0.22,
    },
    moveset: {
      jab: {
        name: 'Chomp Jab', startup: 4, active: 5, endlag: 7,
        hitbox: { offsetX: 14, offsetY: -11, width: 16, height: 14 },
        damage: 6, baseKnockback: 2.2, knockbackGrowth: 36, launchAngleDeg: 38, hitstop: 4,
      },
      smash: {
        name: 'Ghost Smash', startup: 10, active: 7, endlag: 14,
        hitbox: { offsetX: 16, offsetY: -12, width: 22, height: 16 },
        damage: 18, baseKnockback: 4.6, knockbackGrowth: 92, launchAngleDeg: 36, hitstop: 8,
      },
      aerial: {
        name: 'Hydrant Kick', startup: 5, active: 6, endlag: 9,
        hitbox: { offsetX: 10, offsetY: -10, width: 18, height: 14 },
        damage: 11, baseKnockback: 3.1, knockbackGrowth: 64, launchAngleDeg: 34, hitstop: 6,
      },
      neutralSpecial: {
        name: 'Bonus Fruit', startup: 8, active: 4, endlag: 12,
        hitbox: { offsetX: 14, offsetY: -12, width: 12, height: 10 },
        damage: 9, baseKnockback: 2.7, knockbackGrowth: 46, launchAngleDeg: 40, hitstop: 5,
        projectile: {
          speedX: 4.2, speedY: -1.0, gravity: 0.1, radius: 5, lifetime: 62, colorIndex: 9, glowIndex: 14, bounces: true,
        },
      },
      upSpecial: {
        name: 'Pac-Trampoline', startup: 4, active: 14, endlag: 16,
        hitbox: { offsetX: 0, offsetY: -18, width: 18, height: 22 },
        damage: 12, baseKnockback: 4.2, knockbackGrowth: 74, launchAngleDeg: 80, hitstop: 6,
        velocityBoostX: 1.4, velocityBoostY: -7.2,
      },
    },
  },
  {
    id: 'bomberman',
    name: 'Bomberman',
    nickname: 'Blast Pioneer',
    era: 'NES',
    originTag: 'Bomberman',
    archetype: 'zoner',
    archetypeLabel: 'Blast Pioneer',
    gridSize: 32,
    palettes: BOMBERMAN_PALETTES,
    pixelChart: BOMBERMAN_SNES,
    eraPacks: {
      NES: { pixelChart: BOMBERMAN_NES, palettes: buildNesPalettes(BOMBERMAN_PALETTES) },
      SNES_SEGA: { pixelChart: BOMBERMAN_SNES, palettes: BOMBERMAN_PALETTES },
    },
    stats: {
      weight: 90, runSpeed: 2.5, airSpeed: 2.15, jumpForce: 5.5, doubleJumpForce: 5.0,
      maxJumps: 3, gravity: 0.25, fallSpeed: 4.4, fastFallSpeed: 6.4, traction: 0.22,
    },
    moveset: {
      jab: {
        name: 'Glove Punch', startup: 4, active: 4, endlag: 7,
        hitbox: { offsetX: 13, offsetY: -11, width: 15, height: 12 },
        damage: 5, baseKnockback: 2.1, knockbackGrowth: 34, launchAngleDeg: 38, hitstop: 4,
      },
      smash: {
        name: 'Mega Detonate', startup: 10, active: 7, endlag: 15,
        hitbox: { offsetX: 15, offsetY: -12, width: 24, height: 18 },
        damage: 19, baseKnockback: 4.8, knockbackGrowth: 96, launchAngleDeg: 38, hitstop: 9,
      },
      aerial: {
        name: 'Fuse Kick', startup: 5, active: 6, endlag: 9,
        hitbox: { offsetX: 11, offsetY: -10, width: 18, height: 14 },
        damage: 11, baseKnockback: 3.1, knockbackGrowth: 64, launchAngleDeg: 34, hitstop: 6,
      },
      neutralSpecial: {
        name: 'Bomb Toss', startup: 9, active: 4, endlag: 13,
        hitbox: { offsetX: 14, offsetY: -12, width: 14, height: 12 },
        damage: 11, baseKnockback: 3.4, knockbackGrowth: 58, launchAngleDeg: 42, hitstop: 6,
        projectile: {
          speedX: 3.8, speedY: -1.8, gravity: 0.14, radius: 6, lifetime: 66, colorIndex: 11, glowIndex: 13, bounces: true,
        },
      },
      upSpecial: {
        name: 'Blast Jump', startup: 4, active: 14, endlag: 16,
        hitbox: { offsetX: 0, offsetY: -16, width: 20, height: 22 },
        damage: 13, baseKnockback: 4.3, knockbackGrowth: 76, launchAngleDeg: 78, hitstop: 6,
        velocityBoostX: 1.5, velocityBoostY: -7.1,
      },
    },
  },
  {
    id: 'bub',
    name: 'Bub',
    nickname: 'Bubble Dragon',
    era: 'NES',
    originTag: 'Bubble Bobble',
    archetype: 'floaty-puff',
    archetypeLabel: 'Bubble Dragon',
    gridSize: 24,
    palettes: BUB_PALETTES,
    pixelChart: BUB_SNES,
    eraPacks: {
      NES: { pixelChart: buildNesDemakeChart(BUB_SNES), palettes: buildNesPalettes(BUB_PALETTES) },
      SNES_SEGA: { pixelChart: BUB_SNES, palettes: BUB_PALETTES },
    },
    stats: {
      weight: 80, runSpeed: 2.35, airSpeed: 2.3, jumpForce: 5.5, doubleJumpForce: 5.2,
      maxJumps: 4, gravity: 0.2, fallSpeed: 3.7, fastFallSpeed: 5.5, traction: 0.21,
    },
    moveset: {
      jab: {
        name: 'Tail Bounce', startup: 4, active: 5, endlag: 7,
        hitbox: { offsetX: 13, offsetY: -10, width: 16, height: 12 },
        damage: 5, baseKnockback: 2.1, knockbackGrowth: 34, launchAngleDeg: 40, hitstop: 4,
      },
      smash: {
        name: 'Bubble Pop', startup: 9, active: 7, endlag: 14,
        hitbox: { offsetX: 15, offsetY: -11, width: 22, height: 16 },
        damage: 16, baseKnockback: 4.4, knockbackGrowth: 88, launchAngleDeg: 38, hitstop: 8,
      },
      aerial: {
        name: 'Dragon Hop', startup: 4, active: 6, endlag: 8,
        hitbox: { offsetX: 10, offsetY: -9, width: 18, height: 14 },
        damage: 10, baseKnockback: 2.9, knockbackGrowth: 60, launchAngleDeg: 36, hitstop: 5,
      },
      neutralSpecial: {
        name: 'Bubble Spit', startup: 8, active: 4, endlag: 12,
        hitbox: { offsetX: 14, offsetY: -11, width: 12, height: 12 },
        damage: 8, baseKnockback: 2.5, knockbackGrowth: 44, launchAngleDeg: 45, hitstop: 4,
        projectile: {
          speedX: 3.5, speedY: -0.2, gravity: -0.02, radius: 6, lifetime: 70, colorIndex: 13, glowIndex: 14,
        },
      },
      upSpecial: {
        name: 'Bubble Float', startup: 4, active: 15, endlag: 16,
        hitbox: { offsetX: 0, offsetY: -18, width: 18, height: 22 },
        damage: 10, baseKnockback: 3.8, knockbackGrowth: 68, launchAngleDeg: 82, hitstop: 5,
        velocityBoostX: 1.4, velocityBoostY: -7.1,
      },
    },
  },
];
