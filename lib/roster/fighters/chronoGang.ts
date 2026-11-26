import type { FighterBlueprint } from '../../types/fighter';
import type { PalettePreset } from '../../types/palette';
import { buildNesPalettes } from '../rpgSpriteBuilder';
import { CRONO_DUAL_ERA } from './cronoSprites';
import { FROG_DUAL_ERA } from './chronoCronoFrog';
import { MAGUS_DUAL_ERA, ROBO_DUAL_ERA } from './chronoRoboMagus';

const SPIKY_TIME_PALETTES: PalettePreset[] = [
  {
    name: '1000 AD Hero',
    colors: [
      '', '#291821', '#FFCE9C', '#BD0039', '#5A0000', '#317373', '#083939',
      '#FF8C00', '#FFB500', '#422139', '#FFFFFF', '#FF846B', '#ADAD73',
      '#52D6EF', '#52FFBD', '#FEF08A',
    ],
  },
  {
    name: 'Rainbow Blade',
    colors: [
      '', '#291821', '#FFCE9C', '#F59E0B', '#92400E', '#4F46E5', '#1E1B4B',
      '#FDE047', '#F472B6', '#3B0764', '#FFFFFF', '#FF846B', '#C4B5FD',
      '#818CF8', '#F472B6', '#67E8F9',
    ],
  },
  {
    name: 'Guardia Knight',
    colors: [
      '', '#291821', '#FFCE9C', '#16A34A', '#14532D', '#94A3B8', '#334155',
      '#4ADE80', '#FACC15', '#1E293B', '#FFFFFF', '#FF846B', '#FDE047',
      '#E2E8F0', '#FDE047', '#FEF08A',
    ],
  },
  {
    name: 'Lavospawn Dark',
    colors: [
      '', '#18101C', '#E2E8F0', '#A855F7', '#581C87', '#334155', '#0F172A',
      '#F43F5E', '#F97316', '#27272A', '#FFFFFF', '#94A3B8', '#CBD5E1',
      '#F97316', '#F43F5E', '#FDE047',
    ],
  },
];

export const SPIKY_TIME_BLUEPRINT: FighterBlueprint = {
  id: 'spiky-time',
  name: 'Crono',
  nickname: 'Spiky Time',
  era: 'SNES',
  originTag: 'Chrono Trigger',
  archetype: 'sword-hero',
  archetypeLabel: 'Lightning Katana',
  gridSize: 32,
  palettes: SPIKY_TIME_PALETTES,
  pixelChart: CRONO_DUAL_ERA.snesChart,
  eraPacks: {
    NES: { pixelChart: CRONO_DUAL_ERA.nesChart, palettes: buildNesPalettes(SPIKY_TIME_PALETTES) },
    SNES_SEGA: { pixelChart: CRONO_DUAL_ERA.snesChart, palettes: SPIKY_TIME_PALETTES },
  },
  stats: {
    weight: 94, runSpeed: 2.65, airSpeed: 2.2, jumpForce: 5.7, doubleJumpForce: 5.2,
    maxJumps: 3, gravity: 0.27, fallSpeed: 4.7, fastFallSpeed: 6.7, traction: 0.23,
  },
  moveset: {
    jab: {
      name: 'Katana Slash', startup: 4, active: 5, endlag: 7,
      hitbox: { offsetX: 14, offsetY: -12, width: 18, height: 14 },
      damage: 7, baseKnockback: 2.5, knockbackGrowth: 38, launchAngleDeg: 38, hitstop: 4,
    },
    smash: {
      name: 'Cyclone Spin', startup: 9, active: 7, endlag: 14,
      hitbox: { offsetX: 14, offsetY: -12, width: 24, height: 18 },
      damage: 17, baseKnockback: 4.5, knockbackGrowth: 92, launchAngleDeg: 36, hitstop: 8,
    },
    aerial: {
      name: 'Cleave Arc', startup: 5, active: 6, endlag: 9,
      hitbox: { offsetX: 12, offsetY: -11, width: 18, height: 16 },
      damage: 11, baseKnockback: 3.1, knockbackGrowth: 64, launchAngleDeg: 32, hitstop: 6,
    },
    neutralSpecial: {
      name: 'Lightning Bolt', startup: 9, active: 5, endlag: 13,
      hitbox: { offsetX: 14, offsetY: -12, width: 12, height: 12 },
      damage: 9, baseKnockback: 2.8, knockbackGrowth: 46, launchAngleDeg: 42, hitstop: 5,
      projectile: {
        speedX: 4.5, speedY: 0, gravity: 0, radius: 5, lifetime: 62, colorIndex: 13, glowIndex: 14,
      },
    },
    upSpecial: {
      name: 'Luminaire Rise', startup: 4, active: 14, endlag: 17,
      hitbox: { offsetX: 4, offsetY: -18, width: 18, height: 22 },
      damage: 13, baseKnockback: 4.4, knockbackGrowth: 78, launchAngleDeg: 76, hitstop: 7,
      velocityBoostX: 1.7, velocityBoostY: -7.0,
    },
  },
};

const SIR_RIBBIT_PALETTES: PalettePreset[] = [
  {
    name: '600 AD Knight',
    colors: [
      '', '#0A0D18', '#FEF08A', '#22C55E', '#15803D', '#DC2626', '#991B1B',
      '#FACC15', '#CA8A04', '#78350F', '#F8FAFC', '#94A3B8', '#14532D',
      '#38BDF8', '#BAE6FD', '#FFFFFF',
    ],
  },
  {
    name: 'Masamune Gold',
    colors: [
      '', '#0A0D18', '#FEF9C3', '#10B981', '#047857', '#2563EB', '#1E3A8A',
      '#FDE047', '#EA580C', '#451A03', '#FEF08A', '#CA8A04', '#064E3B',
      '#FACC15', '#FFFFFF', '#FFFFFF',
    ],
  },
  {
    name: 'Poison Dart',
    colors: [
      '', '#09090B', '#E9D5FF', '#38BDF8', '#0284C7', '#7C3AED', '#4C1D95',
      '#F472B6', '#DB2777', '#1E1B4B', '#F1F5F9', '#64748B', '#0F172A',
      '#A855F7', '#F472B6', '#FFFFFF',
    ],
  },
  {
    name: 'Swamp Sage',
    colors: [
      '', '#0A0D18', '#FDE68A', '#84CC16', '#4D7C0F', '#D97706', '#92400E',
      '#CBD5E1', '#64748B', '#3F3F46', '#F8FAFC', '#94A3B8', '#365314',
      '#4ADE80', '#BEF264', '#FFFFFF',
    ],
  },
];

export const SIR_RIBBIT_BLUEPRINT: FighterBlueprint = {
  id: 'sir-ribbit',
  name: 'Frog',
  nickname: 'Sir Ribbit',
  era: 'SNES',
  originTag: 'Chrono Trigger',
  archetype: 'sword-hero',
  archetypeLabel: 'Amphibian Blade',
  gridSize: 32,
  palettes: SIR_RIBBIT_PALETTES,
  pixelChart: FROG_DUAL_ERA.snesChart,
  eraPacks: {
    NES: { pixelChart: FROG_DUAL_ERA.nesChart, palettes: buildNesPalettes(SIR_RIBBIT_PALETTES) },
    SNES_SEGA: { pixelChart: FROG_DUAL_ERA.snesChart, palettes: SIR_RIBBIT_PALETTES },
  },
  stats: {
    weight: 102, runSpeed: 2.35, airSpeed: 2.1, jumpForce: 6.1, doubleJumpForce: 5.6,
    maxJumps: 3, gravity: 0.25, fallSpeed: 4.5, fastFallSpeed: 6.5, traction: 0.22,
  },
  moveset: {
    jab: {
      name: 'Masamune Cut', startup: 4, active: 5, endlag: 8,
      hitbox: { offsetX: 15, offsetY: -12, width: 19, height: 13 },
      damage: 8, baseKnockback: 2.6, knockbackGrowth: 40, launchAngleDeg: 36, hitstop: 5,
    },
    smash: {
      name: 'Leap Cleave', startup: 10, active: 6, endlag: 15,
      hitbox: { offsetX: 16, offsetY: -13, width: 22, height: 17 },
      damage: 18, baseKnockback: 4.7, knockbackGrowth: 94, launchAngleDeg: 35, hitstop: 9,
    },
    aerial: {
      name: 'Tongue Snap', startup: 5, active: 7, endlag: 9,
      hitbox: { offsetX: 14, offsetY: -10, width: 20, height: 12 },
      damage: 10, baseKnockback: 3.0, knockbackGrowth: 58, launchAngleDeg: 32, hitstop: 5,
    },
    neutralSpecial: {
      name: 'Water Orb', startup: 9, active: 5, endlag: 14,
      hitbox: { offsetX: 13, offsetY: -11, width: 12, height: 12 },
      damage: 8, baseKnockback: 2.6, knockbackGrowth: 42, launchAngleDeg: 45, hitstop: 4,
      projectile: {
        speedX: 3.6, speedY: -0.6, gravity: 0.08, radius: 5, lifetime: 72, colorIndex: 13, glowIndex: 14, bounces: true,
      },
    },
    upSpecial: {
      name: 'Frog Squash Leap', startup: 4, active: 15, endlag: 17,
      hitbox: { offsetX: 5, offsetY: -18, width: 16, height: 22 },
      damage: 14, baseKnockback: 4.5, knockbackGrowth: 76, launchAngleDeg: 78, hitstop: 7,
      velocityBoostX: 1.9, velocityBoostY: -7.4,
    },
  },
};

const TIN_CAN_PALETTES: PalettePreset[] = [
  {
    name: '2300 AD Amber',
    colors: [
      '', '#0A0D18', '#FEF08A', '#F59E0B', '#B45309', '#64748B', '#334155',
      '#FDE047', '#EA580C', '#475569', '#E2E8F0', '#64748B', '#78350F',
      '#22D3EE', '#A5F3FC', '#FFFFFF',
    ],
  },
  {
    name: 'Factory Steel',
    colors: [
      '', '#09090B', '#F8FAFC', '#94A3B8', '#475569', '#EF4444', '#991B1B',
      '#FACC15', '#F97316', '#1E293B', '#F1F5F9', '#64748B', '#334155',
      '#F87171', '#FCA5A5', '#FFFFFF',
    ],
  },
  {
    name: 'Emerald Drone',
    colors: [
      '', '#09090B', '#ECFCCB', '#10B981', '#047857', '#0F172A', '#020617',
      '#FDE047', '#F59E0B', '#334155', '#D1FAE5', '#065F46', '#064E3B',
      '#34D399', '#A7F3D0', '#FFFFFF',
    ],
  },
  {
    name: 'Crimson Prototype',
    colors: [
      '', '#09090B', '#FED7AA', '#DC2626', '#7F1D1D', '#1E293B', '#0F172A',
      '#FACC15', '#FB923C', '#27272A', '#F8FAFC', '#64748B', '#450A0A',
      '#FACC15', '#FEF08A', '#FFFFFF',
    ],
  },
];

export const TIN_CAN_BLUEPRINT: FighterBlueprint = {
  id: 'tin-can',
  name: 'Robo',
  nickname: 'Tin Can',
  era: 'SNES',
  originTag: 'Chrono Trigger',
  archetype: 'heavy-gunner',
  archetypeLabel: 'Rocket Punch Mech',
  gridSize: 32,
  palettes: TIN_CAN_PALETTES,
  pixelChart: ROBO_DUAL_ERA.snesChart,
  eraPacks: {
    NES: { pixelChart: ROBO_DUAL_ERA.nesChart, palettes: buildNesPalettes(TIN_CAN_PALETTES) },
    SNES_SEGA: { pixelChart: ROBO_DUAL_ERA.snesChart, palettes: TIN_CAN_PALETTES },
  },
  stats: {
    weight: 122, runSpeed: 2.05, airSpeed: 1.75, jumpForce: 5.3, doubleJumpForce: 4.9,
    maxJumps: 3, gravity: 0.29, fallSpeed: 4.9, fastFallSpeed: 6.9, traction: 0.25,
  },
  moveset: {
    jab: {
      name: 'Rocket Knuckle', startup: 5, active: 6, endlag: 9,
      hitbox: { offsetX: 14, offsetY: -12, width: 17, height: 14 },
      damage: 9, baseKnockback: 3.1, knockbackGrowth: 44, launchAngleDeg: 35, hitstop: 6,
    },
    smash: {
      name: 'Uzzi Punch', startup: 11, active: 8, endlag: 16,
      hitbox: { offsetX: 16, offsetY: -12, width: 22, height: 18 },
      damage: 21, baseKnockback: 5.2, knockbackGrowth: 98, launchAngleDeg: 32, hitstop: 10,
    },
    aerial: {
      name: 'Robo Tackle', startup: 6, active: 8, endlag: 11,
      hitbox: { offsetX: 10, offsetY: -11, width: 18, height: 18 },
      damage: 13, baseKnockback: 3.6, knockbackGrowth: 68, launchAngleDeg: 36, hitstop: 7,
    },
    neutralSpecial: {
      name: 'Laser Spin', startup: 10, active: 5, endlag: 15,
      hitbox: { offsetX: 14, offsetY: -12, width: 12, height: 10 },
      damage: 10, baseKnockback: 3.0, knockbackGrowth: 50, launchAngleDeg: 30, hitstop: 5,
      projectile: {
        speedX: 5.1, speedY: 0, gravity: 0, radius: 4, lifetime: 60, colorIndex: 13, glowIndex: 14,
      },
    },
    upSpecial: {
      name: 'Jet Thruster', startup: 5, active: 14, endlag: 18,
      hitbox: { offsetX: 4, offsetY: -16, width: 18, height: 22 },
      damage: 14, baseKnockback: 4.4, knockbackGrowth: 76, launchAngleDeg: 78, hitstop: 7,
      velocityBoostX: 1.5, velocityBoostY: -6.9,
    },
  },
};

const CAPE_LORD_PALETTES: PalettePreset[] = [
  {
    name: 'Dark Fiendlord',
    colors: [
      '', '#090714', '#F1E8FF', '#7C3AED', '#4C1D95', '#1E3A8A', '#172554',
      '#FACC15', '#A855F7', '#1E1B4B', '#E2E8F0', '#64748B', '#C4B5FD',
      '#A855F7', '#E879F9', '#FFFFFF',
    ],
  },
  {
    name: 'Zeal Royalty',
    colors: [
      '', '#090714', '#F8FAFC', '#0EA5E9', '#0369A1', '#312E81', '#1E1B4B',
      '#FDE047', '#38BDF8', '#0F172A', '#F8FAFC', '#94A3B8', '#BAE6FD',
      '#38BDF8', '#E0F2FE', '#FFFFFF',
    ],
  },
  {
    name: 'Crimson Reaper',
    colors: [
      '', '#09090B', '#FFE4E6', '#DC2626', '#7F1D1D', '#27272A', '#18181B',
      '#F59E0B', '#EF4444', '#09090B', '#F1F5F9', '#71717A', '#E2E8F0',
      '#F43F5E', '#FDA4AF', '#FFFFFF',
    ],
  },
  {
    name: 'Emerald Sorcerer',
    colors: [
      '', '#05140E', '#ECFDF5', '#10B981', '#065F46', '#064E3B', '#022C22',
      '#FACC15', '#34D399', '#09090B', '#D1FAE5', '#6EE7B7', '#A7F3D0',
      '#34D399', '#A7F3D0', '#FFFFFF',
    ],
  },
];

export const CAPE_LORD_BLUEPRINT: FighterBlueprint = {
  id: 'cape-lord',
  name: 'Magus',
  nickname: 'Cape Lord',
  era: 'SNES',
  originTag: 'Chrono Trigger',
  archetype: 'zoner',
  archetypeLabel: 'Scythe Dark Mage',
  gridSize: 32,
  palettes: CAPE_LORD_PALETTES,
  pixelChart: MAGUS_DUAL_ERA.snesChart,
  eraPacks: {
    NES: { pixelChart: MAGUS_DUAL_ERA.nesChart, palettes: buildNesPalettes(CAPE_LORD_PALETTES) },
    SNES_SEGA: { pixelChart: MAGUS_DUAL_ERA.snesChart, palettes: CAPE_LORD_PALETTES },
  },
  stats: {
    weight: 90, runSpeed: 2.55, airSpeed: 2.35, jumpForce: 5.85, doubleJumpForce: 5.4,
    maxJumps: 3, gravity: 0.24, fallSpeed: 4.3, fastFallSpeed: 6.3, traction: 0.2,
  },
  moveset: {
    jab: {
      name: 'Scythe Reap', startup: 5, active: 6, endlag: 8,
      hitbox: { offsetX: 16, offsetY: -12, width: 22, height: 14 },
      damage: 8, baseKnockback: 2.7, knockbackGrowth: 42, launchAngleDeg: 38, hitstop: 5,
    },
    smash: {
      name: 'Dark Matter', startup: 11, active: 7, endlag: 16,
      hitbox: { offsetX: 16, offsetY: -12, width: 24, height: 20 },
      damage: 19, baseKnockback: 4.8, knockbackGrowth: 95, launchAngleDeg: 40, hitstop: 9,
    },
    aerial: {
      name: 'Crescent Sweep', startup: 6, active: 7, endlag: 10,
      hitbox: { offsetX: 14, offsetY: -11, width: 22, height: 15 },
      damage: 11, baseKnockback: 3.2, knockbackGrowth: 64, launchAngleDeg: 32, hitstop: 6,
    },
    neutralSpecial: {
      name: 'Dark Bomb', startup: 10, active: 5, endlag: 14,
      hitbox: { offsetX: 14, offsetY: -12, width: 12, height: 12 },
      damage: 10, baseKnockback: 3.1, knockbackGrowth: 54, launchAngleDeg: 42, hitstop: 5,
      projectile: {
        speedX: 3.8, speedY: 0, gravity: 0, radius: 6, lifetime: 70, colorIndex: 13, glowIndex: 14,
      },
    },
    upSpecial: {
      name: 'Shadow Warp', startup: 4, active: 13, endlag: 16,
      hitbox: { offsetX: 4, offsetY: -18, width: 18, height: 22 },
      damage: 12, baseKnockback: 4.1, knockbackGrowth: 72, launchAngleDeg: 74, hitstop: 6,
      velocityBoostX: 2.0, velocityBoostY: -7.2,
    },
  },
};

export const CHRONO_GANG_FIGHTERS: readonly FighterBlueprint[] = [
  SPIKY_TIME_BLUEPRINT,
  SIR_RIBBIT_BLUEPRINT,
  TIN_CAN_BLUEPRINT,
  CAPE_LORD_BLUEPRINT,
];
