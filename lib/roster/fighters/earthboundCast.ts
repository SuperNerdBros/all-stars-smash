import type { FighterBlueprint } from '../../types/fighter';
import type { PalettePreset } from '../../types/palette';
import { buildNesPalettes } from '../rpgSpriteBuilder';
import { NESS_DUAL_ERA, PAULA_DUAL_ERA } from './earthboundSprites';
import { JEFF_DUAL_ERA, POO_DUAL_ERA } from './earthboundPartySprites';

export const NESS_EARTHBOUND_PALETTES: PalettePreset[] = [
  {
    name: 'Onett Classic',
    colors: [
      '', '#000010', '#C08060', '#C00030', '#204030', '#4040C0', '#986848',
      '#B0A010', '#C06000', '#C06060', '#C0C0C0', '#989898', '#607050',
      '#38BDF8', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Pajama Ness',
    colors: [
      '', '#000010', '#C08060', '#38BDF8', '#1E3A8A', '#E2E8F0', '#986848',
      '#60A5FA', '#2563EB', '#C06060', '#F8FAFC', '#94A3B8', '#475569',
      '#60A5FA', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Robot Ness',
    colors: [
      '', '#000010', '#CBD5E1', '#C00030', '#1E293B', '#94A3B8', '#64748B',
      '#E2E8F0', '#475569', '#94A3B8', '#F8FAFC', '#64748B', '#334155',
      '#38BDF8', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Ninten Striped',
    colors: [
      '', '#000010', '#C08060', '#C00030', '#204030', '#E2E8F0', '#986848',
      '#2563EB', '#1E40AF', '#C06060', '#FFFFFF', '#989898', '#607050',
      '#38BDF8', '#FEF08A', '#FFFFFF',
    ],
  },
];

const PAULA_PALETTES: PalettePreset[] = [
  {
    name: 'Twoson Pink',
    colors: [
      '', '#000010', '#C08060', '#C00030', '#600018', '#C06060', '#986848',
      '#B0A010', '#C06000', '#C06060', '#C0C0C0', '#204030', '#607050',
      '#38BDF8', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Happy Happy Blue',
    colors: [
      '', '#000010', '#C08060', '#2563EB', '#1E3A8A', '#60A5FA', '#986848',
      '#B0A010', '#C06000', '#C06060', '#E2E8F0', '#1E293B', '#475569',
      '#67E8F9', '#E0F2FE', '#FFFFFF',
    ],
  },
  {
    name: 'Saturn Gold',
    colors: [
      '', '#000010', '#C08060', '#D97706', '#78350F', '#FDE047', '#986848',
      '#F59E0B', '#B45309', '#C06060', '#FEF9C3', '#204030', '#607050',
      '#FDE047', '#FEF9C3', '#FFFFFF',
    ],
  },
  {
    name: 'Summers Violet',
    colors: [
      '', '#000010', '#C08060', '#DB2777', '#831843', '#C084FC', '#986848',
      '#B0A010', '#C06000', '#C06060', '#F3E8FF', '#3B0764', '#607050',
      '#E879F9', '#F5D0FE', '#FFFFFF',
    ],
  },
];

const JEFF_PALETTES: PalettePreset[] = [
  {
    name: 'Winters Uniform',
    colors: [
      '', '#000010', '#C08060', '#C00030', '#204030', '#607050', '#986848',
      '#B0A010', '#C06000', '#C06060', '#C0C0C0', '#989898', '#204030',
      '#38BDF8', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Andonuts Lab',
    colors: [
      '', '#000010', '#C08060', '#C00030', '#CBD5E1', '#94A3B8', '#986848',
      '#EAB308', '#A16207', '#C06060', '#FFFFFF', '#64748B', '#1E3A8A',
      '#22D3EE', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Snow Wood Navy',
    colors: [
      '', '#000010', '#C08060', '#F97316', '#1E3A8A', '#3B82F6', '#986848',
      '#B0A010', '#C06000', '#C06060', '#E2E8F0', '#94A3B8', '#172554',
      '#60A5FA', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Stonehenge Olive',
    colors: [
      '', '#000010', '#C08060', '#C00030', '#365314', '#65A30D', '#986848',
      '#CA8A04', '#854D0E', '#C06060', '#E2E8F0', '#94A3B8', '#1A2E05',
      '#4ADE80', '#FEF08A', '#FFFFFF',
    ],
  },
];

const POO_PALETTES: PalettePreset[] = [
  {
    name: 'Dalaam Prince',
    colors: [
      '', '#000010', '#C08060', '#C00030', '#204030', '#C0C0C0', '#986848',
      '#989898', '#607050', '#C06060', '#C0C0C0', '#989898', '#607050',
      '#38BDF8', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Mu Saffron',
    colors: [
      '', '#000010', '#C08060', '#C00030', '#451A03', '#F59E0B', '#986848',
      '#D97706', '#92400E', '#C06060', '#FEF3C7', '#F59E0B', '#78350F',
      '#FDE047', '#FEF9C3', '#FFFFFF',
    ],
  },
  {
    name: 'Starstorm Indigo',
    colors: [
      '', '#000010', '#C08060', '#F472B6', '#1E1B4B', '#6366F1', '#986848',
      '#4338CA', '#312E81', '#C06060', '#E0E7FF', '#818CF8', '#312E81',
      '#818CF8', '#E0E7FF', '#FFFFFF',
    ],
  },
  {
    name: 'Shadow Disciple',
    colors: [
      '', '#000010', '#C08060', '#DC2626', '#0F172A', '#475569', '#986848',
      '#334155', '#1E293B', '#C06060', '#CBD5E1', '#64748B', '#1E293B',
      '#FB7185', '#FEF08A', '#FFFFFF',
    ],
  },
];

export const NESS_UPGRADED_CHART = NESS_DUAL_ERA;

export const EARTHBOUND_PARTY_FIGHTERS: readonly FighterBlueprint[] = [
  {
    id: 'paula',
    name: 'Paula',
    nickname: 'PSI Prodigy',
    era: 'SNES',
    originTag: 'EarthBound',
    archetype: 'zoner',
    archetypeLabel: 'PSI Prodigy',
    gridSize: 24,
    palettes: PAULA_PALETTES,
    pixelChart: PAULA_DUAL_ERA.snesChart,
    eraPacks: {
      NES: { pixelChart: PAULA_DUAL_ERA.nesChart, palettes: buildNesPalettes(PAULA_PALETTES) },
      SNES_SEGA: { pixelChart: PAULA_DUAL_ERA.snesChart, palettes: PAULA_PALETTES },
    },
    stats: {
      weight: 82, runSpeed: 2.55, airSpeed: 2.3, jumpForce: 5.65, doubleJumpForce: 5.3,
      maxJumps: 3, gravity: 0.23, fallSpeed: 4.1, fastFallSpeed: 6.0, traction: 0.22,
    },
    moveset: {
      jab: {
        name: 'Frying Pan', startup: 4, active: 5, endlag: 7,
        hitbox: { offsetX: 14, offsetY: -11, width: 17, height: 12 },
        damage: 6, baseKnockback: 2.3, knockbackGrowth: 38, launchAngleDeg: 40, hitstop: 4,
      },
      smash: {
        name: 'PK Fire Omega', startup: 10, active: 7, endlag: 14,
        hitbox: { offsetX: 16, offsetY: -12, width: 22, height: 16 },
        damage: 18, baseKnockback: 4.7, knockbackGrowth: 94, launchAngleDeg: 38, hitstop: 8,
      },
      aerial: {
        name: 'Ribbon Spin', startup: 5, active: 6, endlag: 8,
        hitbox: { offsetX: 11, offsetY: -10, width: 18, height: 14 },
        damage: 11, baseKnockback: 3.0, knockbackGrowth: 62, launchAngleDeg: 36, hitstop: 5,
      },
      neutralSpecial: {
        name: 'PK Freeze', startup: 9, active: 5, endlag: 13,
        hitbox: { offsetX: 14, offsetY: -12, width: 14, height: 12 },
        damage: 10, baseKnockback: 3.1, knockbackGrowth: 52, launchAngleDeg: 46, hitstop: 6,
        projectile: {
          speedX: 3.9, speedY: 0, gravity: 0, radius: 6, lifetime: 64, colorIndex: 13, glowIndex: 14,
        },
      },
      upSpecial: {
        name: 'PSI Teleport', startup: 4, active: 14, endlag: 16,
        hitbox: { offsetX: 0, offsetY: -18, width: 18, height: 22 },
        damage: 12, baseKnockback: 4.2, knockbackGrowth: 74, launchAngleDeg: 80, hitstop: 6,
        velocityBoostX: 1.7, velocityBoostY: -7.3,
      },
    },
  },
  {
    id: 'jeff',
    name: 'Jeff',
    nickname: 'Gadget Genius',
    era: 'SNES',
    originTag: 'EarthBound',
    archetype: 'zoner',
    archetypeLabel: 'Gadget Genius',
    gridSize: 24,
    palettes: JEFF_PALETTES,
    pixelChart: JEFF_DUAL_ERA.snesChart,
    eraPacks: {
      NES: { pixelChart: JEFF_DUAL_ERA.nesChart, palettes: buildNesPalettes(JEFF_PALETTES) },
      SNES_SEGA: { pixelChart: JEFF_DUAL_ERA.snesChart, palettes: JEFF_PALETTES },
    },
    stats: {
      weight: 90, runSpeed: 2.35, airSpeed: 2.05, jumpForce: 5.4, doubleJumpForce: 4.95,
      maxJumps: 3, gravity: 0.25, fallSpeed: 4.4, fastFallSpeed: 6.4, traction: 0.23,
    },
    moveset: {
      jab: {
        name: 'Pop Gun', startup: 4, active: 5, endlag: 7,
        hitbox: { offsetX: 14, offsetY: -11, width: 18, height: 11 },
        damage: 6, baseKnockback: 2.2, knockbackGrowth: 36, launchAngleDeg: 36, hitstop: 4,
      },
      smash: {
        name: 'Heavy Bazooka', startup: 11, active: 7, endlag: 16,
        hitbox: { offsetX: 17, offsetY: -12, width: 24, height: 17 },
        damage: 20, baseKnockback: 5.0, knockbackGrowth: 98, launchAngleDeg: 34, hitstop: 9,
      },
      aerial: {
        name: 'Laser Shot', startup: 5, active: 6, endlag: 9,
        hitbox: { offsetX: 13, offsetY: -10, width: 18, height: 12 },
        damage: 11, baseKnockback: 3.1, knockbackGrowth: 64, launchAngleDeg: 34, hitstop: 5,
      },
      neutralSpecial: {
        name: 'Bottle Rocket', startup: 9, active: 4, endlag: 13,
        hitbox: { offsetX: 14, offsetY: -12, width: 14, height: 12 },
        damage: 11, baseKnockback: 3.4, knockbackGrowth: 56, launchAngleDeg: 42, hitstop: 6,
        projectile: {
          speedX: 4.5, speedY: -0.4, gravity: 0.04, radius: 5, lifetime: 62, colorIndex: 3, glowIndex: 14,
        },
      },
      upSpecial: {
        name: 'Sky Runner Boost', startup: 4, active: 14, endlag: 16,
        hitbox: { offsetX: 0, offsetY: -18, width: 18, height: 22 },
        damage: 12, baseKnockback: 4.1, knockbackGrowth: 72, launchAngleDeg: 78, hitstop: 6,
        velocityBoostX: 1.6, velocityBoostY: -7.1,
      },
    },
  },
  {
    id: 'poo',
    name: 'Poo',
    nickname: 'Prince of Dalaam',
    era: 'SNES',
    originTag: 'EarthBound',
    archetype: 'sword-hero',
    archetypeLabel: 'Prince of Dalaam',
    gridSize: 24,
    palettes: POO_PALETTES,
    pixelChart: POO_DUAL_ERA.snesChart,
    eraPacks: {
      NES: { pixelChart: POO_DUAL_ERA.nesChart, palettes: buildNesPalettes(POO_PALETTES) },
      SNES_SEGA: { pixelChart: POO_DUAL_ERA.snesChart, palettes: POO_PALETTES },
    },
    stats: {
      weight: 94, runSpeed: 2.9, airSpeed: 2.45, jumpForce: 5.8, doubleJumpForce: 5.3,
      maxJumps: 3, gravity: 0.26, fallSpeed: 4.7, fastFallSpeed: 6.8, traction: 0.24,
    },
    moveset: {
      jab: {
        name: 'Dalaam Palm', startup: 3, active: 5, endlag: 6,
        hitbox: { offsetX: 14, offsetY: -11, width: 17, height: 12 },
        damage: 6, baseKnockback: 2.3, knockbackGrowth: 38, launchAngleDeg: 38, hitstop: 4,
      },
      smash: {
        name: 'Sword of Kings', startup: 9, active: 7, endlag: 14,
        hitbox: { offsetX: 17, offsetY: -12, width: 24, height: 18 },
        damage: 19, baseKnockback: 4.9, knockbackGrowth: 96, launchAngleDeg: 34, hitstop: 9,
      },
      aerial: {
        name: 'Mu Crescent Kick', startup: 4, active: 6, endlag: 8,
        hitbox: { offsetX: 12, offsetY: -10, width: 18, height: 14 },
        damage: 12, baseKnockback: 3.3, knockbackGrowth: 68, launchAngleDeg: 32, hitstop: 6,
      },
      neutralSpecial: {
        name: 'PK Starstorm', startup: 9, active: 5, endlag: 13,
        hitbox: { offsetX: 14, offsetY: -12, width: 14, height: 12 },
        damage: 10, baseKnockback: 3.2, knockbackGrowth: 54, launchAngleDeg: 44, hitstop: 6,
        projectile: {
          speedX: 4.3, speedY: 0.35, gravity: 0.06, radius: 6, lifetime: 60, colorIndex: 13, glowIndex: 14, bounces: true,
        },
      },
      upSpecial: {
        name: 'Dragon Mirror Rise', startup: 4, active: 14, endlag: 15,
        hitbox: { offsetX: 2, offsetY: -18, width: 18, height: 22 },
        damage: 13, baseKnockback: 4.4, knockbackGrowth: 78, launchAngleDeg: 78, hitstop: 7,
        velocityBoostX: 1.9, velocityBoostY: -7.3,
      },
    },
  },
];
