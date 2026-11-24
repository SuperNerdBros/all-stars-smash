import type { FighterBlueprint } from '../../types/fighter';
import type { PalettePreset } from '../../types/palette';
import {
  buildNesDemakeChart,
  buildNesPalettes,
  buildSnesRpgChart,
} from '../rpgSpriteBuilder';

// ══════════════════════════════════════════════════════════════════════════════
// 5. MOON KNIGHT (Cecil — FF4, 24x24 SNES High-Res Sprite + Paladin Alt!)
// ══════════════════════════════════════════════════════════════════════════════
const MOON_KNIGHT_SNES = buildSnesRpgChart({
  fxStyle: 'slash',
  snesIdle: [
    '....11...........11.....',
    '...1a31..11111..13a1....',
    '....133113333311331.....',
    '.....1333443443331......',
    '.....1311773771131......',
    '.....1331223221331......',
    '......1333443331........',
    '...1111155555511111.....',
    '..133713337733317331.1a.',
    '.13344133433433144311aa1',
    '.1556133344443331651aa1.',
    '.1556133377773331651b1..',
    '.155114443333444115121..',
    '..11.133344443331.111...',
    '.....133411114331.......',
    '.....13341..14331.......',
    '.....14441..14441.......',
    '....133331..133331......',
    '....199991..199991......',
    '...199991....199991.....',
    '...11111......11111.....',
    '........................',
    '........................',
    '........................',
  ],
  snesAttack: [
    '.....11...........11....',
    '....1a31..11111..13a1...',
    '.....133113333311331....',
    '......1333443443331.....',
    '......1311773771131.....',
    '......1331223221331.....',
    '.......1333443331..1ff..',
    '..11111555555511..1aaf1.',
    '.15561333773331311aaf1..',
    '.1556133433433133aab1...',
    '..111133377773311221....',
    '.....14443333444111.....',
    '....13341....14331......',
    '....14441....14441......',
    '...133331....133331.....',
    '...199991....199991.....',
    '..199991......199991....',
    '..11111........11111....',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
});

const MOON_KNIGHT_PALETTES: PalettePreset[] = [
  {
    name: 'Dark Knight IV',
    colors: [
      '', '#090714', '#E2E8F0', '#312E81', '#1E1B4B', '#7C3AED', '#4C1D95',
      '#FACC15', '#A855F7', '#1E293B', '#CBD5E1', '#475569', '#6366F1',
      '#A855F7', '#E879F9', '#FFFFFF',
    ],
  },
  {
    name: 'Mt. Ordeals Paladin',
    colors: [
      '', '#0A1026', '#FFE4C4', '#E0F2FE', '#93C5FD', '#2563EB', '#1E3A8A',
      '#FACC15', '#FDE047', '#CBD5E1', '#FFFFFF', '#94A3B8', '#F8FAFC',
      '#38BDF8', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Baron Crimson',
    colors: [
      '', '#09090B', '#FED7AA', '#991B1B', '#450A0A', '#1E293B', '#0F172A',
      '#F59E0B', '#EF4444', '#27272A', '#F1F5F9', '#64748B', '#DC2626',
      '#EF4444', '#FCA5A5', '#FFFFFF',
    ],
  },
  {
    name: 'Lunar Silver',
    colors: [
      '', '#090D16', '#F8FAFC', '#64748B', '#334155', '#0EA5E9', '#0369A1',
      '#38BDF8', '#7DD3FC', '#1E293B', '#FFFFFF', '#94A3B8', '#CBD5E1',
      '#38BDF8', '#E0F2FE', '#FFFFFF',
    ],
  },
];

export const MOON_KNIGHT_BLUEPRINT: FighterBlueprint = {
  id: 'moon-knight',
  name: 'Moon Knight',
  era: 'SNES',
  originTag: 'Crystal IV',
  archetype: 'sword-hero',
  archetypeLabel: 'Dark / Paladin Blade',
  gridSize: 24,
  palettes: MOON_KNIGHT_PALETTES,
  pixelChart: MOON_KNIGHT_SNES,
  eraPacks: {
    NES: { pixelChart: buildNesDemakeChart(MOON_KNIGHT_SNES), palettes: buildNesPalettes(MOON_KNIGHT_PALETTES) },
    SNES_SEGA: { pixelChart: MOON_KNIGHT_SNES, palettes: MOON_KNIGHT_PALETTES },
  },
  stats: {
    weight: 108, runSpeed: 2.35, airSpeed: 1.95, jumpForce: 5.5, doubleJumpForce: 5.1,
    maxJumps: 3, gravity: 0.28, fallSpeed: 4.8, fastFallSpeed: 6.8, traction: 0.24,
  },
  moveset: {
    jab: {
      name: 'Crescent Slash', startup: 4, active: 5, endlag: 8,
      hitbox: { offsetX: 15, offsetY: -12, width: 19, height: 14 },
      damage: 8, baseKnockback: 2.7, knockbackGrowth: 42, launchAngleDeg: 38, hitstop: 5,
    },
    smash: {
      name: 'Darkness Wave', startup: 10, active: 7, endlag: 16,
      hitbox: { offsetX: 16, offsetY: -12, width: 24, height: 18 },
      damage: 19, baseKnockback: 4.9, knockbackGrowth: 94, launchAngleDeg: 36, hitstop: 9,
    },
    aerial: {
      name: 'Holy Cross Cut', startup: 6, active: 7, endlag: 10,
      hitbox: { offsetX: 13, offsetY: -11, width: 19, height: 16 },
      damage: 12, baseKnockback: 3.3, knockbackGrowth: 66, launchAngleDeg: 32, hitstop: 6,
    },
    neutralSpecial: {
      name: 'Soul Eater', startup: 10, active: 5, endlag: 14,
      hitbox: { offsetX: 14, offsetY: -12, width: 12, height: 12 },
      damage: 10, baseKnockback: 3.0, knockbackGrowth: 52, launchAngleDeg: 40, hitstop: 5,
      projectile: {
        speedX: 4.1, speedY: 0, gravity: 0, radius: 5, lifetime: 66, colorIndex: 13, glowIndex: 14,
      },
    },
    upSpecial: {
      name: 'Lunar Ascent', startup: 4, active: 14, endlag: 18,
      hitbox: { offsetX: 5, offsetY: -18, width: 17, height: 22 },
      damage: 14, baseKnockback: 4.5, knockbackGrowth: 78, launchAngleDeg: 76, hitstop: 7,
      velocityBoostX: 1.6, velocityBoostY: -7.0,
    },
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// 6. JUMP SPEAR (Kain — FF4 Dragoon, 24x24 SNES High-Res Sprite)
// ══════════════════════════════════════════════════════════════════════════════
const JUMP_SPEAR_SNES = buildSnesRpgChart({
  fxStyle: 'slash',
  snesIdle: [
    '.....1a...........1a....',
    '....1331..11111..1331.1f',
    '.....133113373311331.1af',
    '......1333377733331.1aa1',
    '......1331177711331.1b1.',
    '.......13322222331..1b1.',
    '........115555511..1b1..',
    '....11133355553331.1b1..',
    '...13371333773331311b1..',
    '..1334413343343313121...',
    '..15561333444433311b1...',
    '..1551.1337777331.1b1...',
    '...11..1443333441.1b1...',
    '.......1334114331.1b1...',
    '......13341..143311b1...',
    '......14441..14441.11...',
    '.....133331..133331.....',
    '.....199991..199991.....',
    '....199991....199991....',
    '....11111......11111....',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
  snesAttack: [
    '.....1a...........1a....',
    '....1331..11111..1331...',
    '.....133113373311331....',
    '......1333377733331.....',
    '......1331177711331.....',
    '.......13322222331......',
    '........115555511.......',
    '...155533355553331......',
    '..1556133377333131111111',
    '..1111133433433122bbbaff',
    '......13337777331111111f',
    '......1443333441........',
    '.....13341..14331.......',
    '.....14441..14441.......',
    '....133331..133331......',
    '...199991....199991.....',
    '...11111......11111.....',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
});

const JUMP_SPEAR_PALETTES: PalettePreset[] = [
  {
    name: 'Highwind Azure',
    colors: [
      '', '#090D18', '#FFD2A6', '#2563EB', '#1E3A8A', '#DC2626', '#991B1B',
      '#FACC15', '#F97316', '#1E293B', '#F8FAFC', '#94A3B8', '#1D4ED8',
      '#38BDF8', '#BAE6FD', '#FFFFFF',
    ],
  },
  {
    name: 'Holy Dragoon',
    colors: [
      '', '#0A0D18', '#FFD2A6', '#E2E8F0', '#94A3B8', '#0EA5E9', '#0369A1',
      '#FDE047', '#F59E0B', '#475569', '#FFFFFF', '#CBD5E1', '#FACC15',
      '#FDE047', '#FFFFFF', '#FFFFFF',
    ],
  },
  {
    name: 'Crimson Wyvern',
    colors: [
      '', '#09090B', '#FED7AA', '#DC2626', '#7F1D1D', '#F59E0B', '#B45309',
      '#FDE047', '#FB923C', '#27272A', '#F8FAFC', '#71717A', '#991B1B',
      '#F97316', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Obsidian Lancer',
    colors: [
      '', '#09090B', '#CBD5E1', '#334155', '#0F172A', '#A855F7', '#581C87',
      '#38BDF8', '#C084FC', '#18181B', '#E2E8F0', '#64748B', '#1E293B',
      '#A855F7', '#38BDF8', '#FFFFFF',
    ],
  },
];

export const JUMP_SPEAR_BLUEPRINT: FighterBlueprint = {
  id: 'jump-spear',
  name: 'Jump Spear',
  era: 'SNES',
  originTag: 'Crystal IV',
  archetype: 'high-jumper',
  archetypeLabel: 'Sky Dragoon Lancer',
  gridSize: 24,
  palettes: JUMP_SPEAR_PALETTES,
  pixelChart: JUMP_SPEAR_SNES,
  eraPacks: {
    NES: { pixelChart: buildNesDemakeChart(JUMP_SPEAR_SNES), palettes: buildNesPalettes(JUMP_SPEAR_PALETTES) },
    SNES_SEGA: { pixelChart: JUMP_SPEAR_SNES, palettes: JUMP_SPEAR_PALETTES },
  },
  stats: {
    weight: 96, runSpeed: 2.55, airSpeed: 2.4, jumpForce: 6.35, doubleJumpForce: 5.9,
    maxJumps: 3, gravity: 0.25, fallSpeed: 4.8, fastFallSpeed: 7.4, traction: 0.21,
  },
  moveset: {
    jab: {
      name: 'Lance Thrust', startup: 4, active: 6, endlag: 8,
      hitbox: { offsetX: 18, offsetY: -12, width: 24, height: 10 },
      damage: 7, baseKnockback: 2.6, knockbackGrowth: 38, launchAngleDeg: 34, hitstop: 4,
    },
    smash: {
      name: 'Dragon Fang', startup: 10, active: 7, endlag: 15,
      hitbox: { offsetX: 18, offsetY: -12, width: 26, height: 16 },
      damage: 18, baseKnockback: 4.8, knockbackGrowth: 94, launchAngleDeg: 32, hitstop: 8,
    },
    aerial: {
      name: 'Skyward Dive', startup: 5, active: 8, endlag: 10,
      hitbox: { offsetX: 12, offsetY: -8, width: 20, height: 18 },
      damage: 13, baseKnockback: 3.6, knockbackGrowth: 70, launchAngleDeg: 28, hitstop: 6,
    },
    neutralSpecial: {
      name: 'Gungnir Throw', startup: 9, active: 5, endlag: 14,
      hitbox: { offsetX: 16, offsetY: -12, width: 14, height: 8 },
      damage: 9, baseKnockback: 2.9, knockbackGrowth: 48, launchAngleDeg: 30, hitstop: 4,
      projectile: {
        speedX: 5.4, speedY: -0.2, gravity: 0.04, radius: 4, lifetime: 60, colorIndex: 10, glowIndex: 13,
      },
    },
    upSpecial: {
      name: 'Highwind Jump', startup: 3, active: 16, endlag: 17,
      hitbox: { offsetX: 4, offsetY: -20, width: 16, height: 24 },
      damage: 14, baseKnockback: 4.6, knockbackGrowth: 80, launchAngleDeg: 82, hitstop: 7,
      velocityBoostX: 1.6, velocityBoostY: -7.9,
    },
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// 7. JOB HOPPER (Bartz — FF5 Freelancer, 24x24 SNES High-Res Sprite)
// ══════════════════════════════════════════════════════════════════════════════
const JOB_HOPPER_SNES = buildSnesRpgChart({
  fxStyle: 'slash',
  snesIdle: [
    '......11..111...........',
    '.....1cc11ccc1..........',
    '....1ccccccccc1.........',
    '...1cc1cccccc1c1........',
    '....1c2222222c1.........',
    '....12212212221.........',
    '.....122222221..........',
    '...115555555511.........',
    '..17713333331771..1a....',
    '.17871334333178711aa1...',
    '.1221333773331221aa1....',
    '..111333333331111b1.....',
    '....19997799911121......',
    '....1333443331111.......',
    '....1555115551..........',
    '....1556116551..........',
    '....1a11..11a1..........',
    '....1999119991..........',
    '...199991199991.........',
    '...11111..11111.........',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
  snesAttack: [
    '.......11..111..........',
    '......1cc11ccc1.........',
    '.....1ccccccccc1........',
    '....1cc1cccccc1c1.......',
    '.....1c2222222c1........',
    '.....12212212221........',
    '......122222221...1ff...',
    '..155555555551...1aaf1..',
    '.1556133333317711aaf1...',
    '..11113377331787aab1....',
    '.....13333331222111.....',
    '.....1999779991.........',
    '....15551..15551........',
    '....1a11....11a1........',
    '...19991....19991.......',
    '..199991....199991......',
    '..11111......11111......',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
});

const JOB_HOPPER_PALETTES: PalettePreset[] = [
  {
    name: 'Freelancer Blue',
    colors: [
      '', '#0A0D18', '#FFD2A6', '#2563EB', '#1E3A8A', '#DC2626', '#991B1B',
      '#FACC15', '#EA580C', '#78350F', '#F8FAFC', '#94A3B8', '#92400E',
      '#38BDF8', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Mime Master',
    colors: [
      '', '#0A0D18', '#FFE4C4', '#9333EA', '#581C87', '#FACC15', '#CA8A04',
      '#38BDF8', '#EC4899', '#1E293B', '#F8FAFC', '#94A3B8', '#78350F',
      '#E879F9', '#67E8F9', '#FFFFFF',
    ],
  },
  {
    name: 'Mystic Knight',
    colors: [
      '', '#0A0D18', '#FFD2A6', '#16A34A', '#166534', '#F8FAFC', '#CBD5E1',
      '#F59E0B', '#DC2626', '#451A03', '#FEF08A', '#94A3B8', '#713F12',
      '#4ADE80', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Boko Gold',
    colors: [
      '', '#0A0D18', '#FFD2A6', '#FACC15', '#CA8A04', '#F97316', '#C2410C',
      '#FFFFFF', '#FDE047', '#78350F', '#FEF9C3', '#D97706', '#92400E',
      '#FDE047', '#FFFFFF', '#FFFFFF',
    ],
  },
];

export const JOB_HOPPER_BLUEPRINT: FighterBlueprint = {
  id: 'job-hopper',
  name: 'Job Hopper',
  era: 'SNES',
  originTag: 'Crystal V',
  archetype: 'sword-hero',
  archetypeLabel: 'Wind Spellblade',
  gridSize: 24,
  palettes: JOB_HOPPER_PALETTES,
  pixelChart: JOB_HOPPER_SNES,
  eraPacks: {
    NES: { pixelChart: buildNesDemakeChart(JOB_HOPPER_SNES), palettes: buildNesPalettes(JOB_HOPPER_PALETTES) },
    SNES_SEGA: { pixelChart: JOB_HOPPER_SNES, palettes: JOB_HOPPER_PALETTES },
  },
  stats: {
    weight: 95, runSpeed: 2.6, airSpeed: 2.25, jumpForce: 5.75, doubleJumpForce: 5.3,
    maxJumps: 3, gravity: 0.26, fallSpeed: 4.6, fastFallSpeed: 6.6, traction: 0.23,
  },
  moveset: {
    jab: {
      name: 'Rapid Slash', startup: 3, active: 5, endlag: 6,
      hitbox: { offsetX: 14, offsetY: -12, width: 18, height: 13 },
      damage: 6, baseKnockback: 2.4, knockbackGrowth: 36, launchAngleDeg: 38, hitstop: 4,
    },
    smash: {
      name: 'Spellblade Flare', startup: 9, active: 7, endlag: 14,
      hitbox: { offsetX: 16, offsetY: -12, width: 22, height: 18 },
      damage: 17, baseKnockback: 4.6, knockbackGrowth: 90, launchAngleDeg: 38, hitstop: 8,
    },
    aerial: {
      name: 'Dual-Wield Spin', startup: 5, active: 7, endlag: 9,
      hitbox: { offsetX: 11, offsetY: -11, width: 19, height: 16 },
      damage: 11, baseKnockback: 3.1, knockbackGrowth: 62, launchAngleDeg: 34, hitstop: 5,
    },
    neutralSpecial: {
      name: 'Aero Cutter', startup: 8, active: 5, endlag: 12,
      hitbox: { offsetX: 14, offsetY: -12, width: 12, height: 12 },
      damage: 8, baseKnockback: 2.7, knockbackGrowth: 44, launchAngleDeg: 42, hitstop: 4,
      projectile: {
        speedX: 4.4, speedY: 0, gravity: 0, radius: 5, lifetime: 64, colorIndex: 13, glowIndex: 14,
      },
    },
    upSpecial: {
      name: 'Wind Crystal Leap', startup: 4, active: 14, endlag: 16,
      hitbox: { offsetX: 5, offsetY: -18, width: 17, height: 22 },
      damage: 13, baseKnockback: 4.2, knockbackGrowth: 74, launchAngleDeg: 76, hitstop: 6,
      velocityBoostX: 1.9, velocityBoostY: -7.1,
    },
  },
};

export const CRYSTAL_45_FIGHTERS: readonly FighterBlueprint[] = [
  MOON_KNIGHT_BLUEPRINT,
  JUMP_SPEAR_BLUEPRINT,
  JOB_HOPPER_BLUEPRINT,
];
