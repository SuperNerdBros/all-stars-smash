import type { FighterBlueprint } from '../../types/fighter';
import type { PalettePreset } from '../../types/palette';
import {
  buildNesDemakeChart,
  buildNesPalettes,
  buildSnesRpgChart,
} from '../rpgSpriteBuilder';

// ══════════════════════════════════════════════════════════════════════════════
// 8. ESPER HAIR (Terra — FF6, 24x24 SNES High-Res Sprite + Trance Pink Alt!)
// ══════════════════════════════════════════════════════════════════════════════
const ESPER_HAIR_SNES = buildSnesRpgChart({
  fxStyle: 'orb',
  snesIdle: [
    '.......111111...........',
    '.....11cccccc11.........',
    '....1cccccccccc1........',
    '...1cc1c22222cc11.......',
    '..1cc1221221221cc1......',
    '..1cc1222222221ccc1.....',
    '.1cc1..1222221.1cc1.....',
    '.1c1..11777711..11......',
    '..1..1773333771...1d....',
    '....12213343312211dd1...',
    '....12213a3a31221df1....',
    '.....111337331111b1.....',
    '......133343331.11......',
    '.....13343334331........',
    '....1333a333a3331.......',
    '....1334333334331.......',
    '....1777777777771.......',
    '.....11121..1211........',
    '......1991..1991........',
    '.....19991..19991.......',
    '.....1111....1111.......',
    '........................',
    '........................',
    '........................',
  ],
  snesAttack: [
    '........111111..........',
    '......11cccccc11........',
    '.....1cccccccccc1.......',
    '....1cc1c22222cc11......',
    '...1cc1221221221cc1.....',
    '..1cc1122222221ccc1.....',
    '.1cc1...122221..11.1ff..',
    '..11...17777771...1ddf1.',
    '......133343331221ddf1..',
    '.....1223a3a331221bb1...',
    '......1133733311111.....',
    '.....13343334331........',
    '....1333a333a3331.......',
    '....1777777777771.......',
    '.....1121....1211.......',
    '.....1991....1991.......',
    '....19991....19991......',
    '....1111......1111......',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
});

const ESPER_HAIR_PALETTES: PalettePreset[] = [
  {
    name: 'Narshe Mint SNES',
    colors: [
      '', '#0A0D18', '#FFE4C4', '#DC2626', '#991B1B', '#F8FAFC', '#CBD5E1',
      '#FACC15', '#F97316', '#78350F', '#F8FAFC', '#94A3B8', '#4ADE80',
      '#F97316', '#FDE047', '#FFFFFF',
    ],
  },
  {
    name: 'Esper Trance Pink',
    colors: [
      '', '#140718', '#FCE7F3', '#EC4899', '#9D174D', '#F472B6', '#BE185D',
      '#FDE047', '#F472B6', '#831843', '#FFFFFF', '#F9A8D4', '#F472B6',
      '#F472B6', '#FDE047', '#FFFFFF',
    ],
  },
  {
    name: 'Amano Blonde',
    colors: [
      '', '#0A0D18', '#FFE4C4', '#E11D48', '#881337', '#FEF08A', '#CA8A04',
      '#FACC15', '#FB923C', '#581C87', '#FFFFFF', '#CBD5E1', '#FDE047',
      '#38BDF8', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Opera Celes',
    colors: [
      '', '#0A0D18', '#FFE4C4', '#10B981', '#047857', '#F8FAFC', '#CBD5E1',
      '#FDE047', '#34D399', '#78350F', '#FFFFFF', '#94A3B8', '#FACC15',
      '#38BDF8', '#BAE6FD', '#FFFFFF',
    ],
  },
];

export const ESPER_HAIR_BLUEPRINT: FighterBlueprint = {
  id: 'esper-hair',
  name: 'Esper Hair',
  era: 'SNES',
  originTag: 'Crystal VI',
  archetype: 'zoner',
  archetypeLabel: 'Magic Trance Mage',
  gridSize: 24,
  palettes: ESPER_HAIR_PALETTES,
  pixelChart: ESPER_HAIR_SNES,
  eraPacks: {
    NES: { pixelChart: buildNesDemakeChart(ESPER_HAIR_SNES), palettes: buildNesPalettes(ESPER_HAIR_PALETTES) },
    SNES_SEGA: { pixelChart: ESPER_HAIR_SNES, palettes: ESPER_HAIR_PALETTES },
  },
  stats: {
    weight: 86, runSpeed: 2.45, airSpeed: 2.35, jumpForce: 5.85, doubleJumpForce: 5.5,
    maxJumps: 3, gravity: 0.23, fallSpeed: 4.1, fastFallSpeed: 6.1, traction: 0.21,
  },
  moveset: {
    jab: {
      name: 'Riot Blade', startup: 4, active: 5, endlag: 7,
      hitbox: { offsetX: 15, offsetY: -12, width: 18, height: 14 },
      damage: 7, baseKnockback: 2.5, knockbackGrowth: 38, launchAngleDeg: 38, hitstop: 4,
    },
    smash: {
      name: 'Meltdown Burst', startup: 10, active: 7, endlag: 15,
      hitbox: { offsetX: 16, offsetY: -12, width: 24, height: 20 },
      damage: 18, baseKnockback: 4.7, knockbackGrowth: 94, launchAngleDeg: 40, hitstop: 9,
    },
    aerial: {
      name: 'Esper Star', startup: 5, active: 7, endlag: 9,
      hitbox: { offsetX: 12, offsetY: -11, width: 18, height: 16 },
      damage: 11, baseKnockback: 3.1, knockbackGrowth: 64, launchAngleDeg: 34, hitstop: 5,
    },
    neutralSpecial: {
      name: 'Firaga Orb', startup: 9, active: 5, endlag: 13,
      hitbox: { offsetX: 14, offsetY: -12, width: 12, height: 12 },
      damage: 10, baseKnockback: 3.0, knockbackGrowth: 54, launchAngleDeg: 44, hitstop: 5,
      projectile: {
        speedX: 4.0, speedY: 0, gravity: 0, radius: 6, lifetime: 70, colorIndex: 13, glowIndex: 14,
      },
    },
    upSpecial: {
      name: 'Morph Flight', startup: 4, active: 15, endlag: 16,
      hitbox: { offsetX: 4, offsetY: -18, width: 18, height: 22 },
      damage: 12, baseKnockback: 4.2, knockbackGrowth: 74, launchAngleDeg: 78, hitstop: 6,
      velocityBoostX: 1.8, velocityBoostY: -7.4,
    },
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// 9. TRAIN SUPLEX (Sabin — FF6 Blitz Monk, 24x24 SNES High-Res Sprite)
// ══════════════════════════════════════════════════════════════════════════════
const TRAIN_SUPLEX_SNES = buildSnesRpgChart({
  fxStyle: 'aura',
  snesIdle: [
    '......1..11..1..........',
    '.....1c11cc11c1.........',
    '....1cccccccccc1........',
    '....115555555511........',
    '.....1221221221.........',
    '.....1222222221.........',
    '......12222221..........',
    '...11133222233111.......',
    '..1221333223331221......',
    '.122213343343312221.....',
    '.1aa213333333312aa1.....',
    '.1aa117777777711aa1.....',
    '..11.1333443331.11......',
    '.....1334334331.........',
    '....133411114331........',
    '....13331..13331........',
    '....13341..14331........',
    '....19991..19991........',
    '...199991..199991.......',
    '...11111....11111.......',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
  snesAttack: [
    '.......1..11..1.........',
    '......1c11cc11c1........',
    '.....1cccccccccc1.......',
    '.....115555555511.......',
    '......1221221221........',
    '......1222222221........',
    '.......12222221.........',
    '...11133222233111.......',
    '..1221333223331222aa1...',
    '..1aa1334334331222aaf1..',
    '...111777777771111aa1...',
    '.....1333443331...11....',
    '....13341..14331........',
    '....13331..13331........',
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

const TRAIN_SUPLEX_PALETTES: PalettePreset[] = [
  {
    name: 'Figaro Blitz Gi',
    colors: [
      '', '#0A0D18', '#FFD2A6', '#2563EB', '#1E3A8A', '#DC2626', '#991B1B',
      '#FACC15', '#F97316', '#78350F', '#F8FAFC', '#CBD5E1', '#FDE047',
      '#38BDF8', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Phantom Train Fire',
    colors: [
      '', '#09090B', '#FFD2A6', '#DC2626', '#7F1D1D', '#FACC15', '#CA8A04',
      '#F8FAFC', '#F97316', '#27272A', '#FEF08A', '#F59E0B', '#FDE047',
      '#F97316', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Master Duncan Green',
    colors: [
      '', '#0A0D18', '#FFD2A6', '#16A34A', '#14532D', '#F59E0B', '#B45309',
      '#FEF08A', '#F97316', '#451A03', '#FFFFFF', '#94A3B8', '#FDE047',
      '#4ADE80', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Shadow Monk',
    colors: [
      '', '#09090B', '#E2E8F0', '#1E293B', '#0F172A', '#A855F7', '#581C87',
      '#38BDF8', '#C084FC', '#18181B', '#F8FAFC', '#64748B', '#E2E8F0',
      '#A855F7', '#38BDF8', '#FFFFFF',
    ],
  },
];

export const TRAIN_SUPLEX_BLUEPRINT: FighterBlueprint = {
  id: 'train-suplex',
  name: 'Train Suplex',
  era: 'SNES',
  originTag: 'Crystal VI',
  archetype: 'heavy-grappler',
  archetypeLabel: 'Blitz Power Monk',
  gridSize: 24,
  palettes: TRAIN_SUPLEX_PALETTES,
  pixelChart: TRAIN_SUPLEX_SNES,
  eraPacks: {
    NES: { pixelChart: buildNesDemakeChart(TRAIN_SUPLEX_SNES), palettes: buildNesPalettes(TRAIN_SUPLEX_PALETTES) },
    SNES_SEGA: { pixelChart: TRAIN_SUPLEX_SNES, palettes: TRAIN_SUPLEX_PALETTES },
  },
  stats: {
    weight: 116, runSpeed: 2.5, airSpeed: 2.0, jumpForce: 5.7, doubleJumpForce: 5.2,
    maxJumps: 3, gravity: 0.28, fallSpeed: 4.9, fastFallSpeed: 7.0, traction: 0.25,
  },
  moveset: {
    jab: {
      name: 'Pummel Flurry', startup: 3, active: 5, endlag: 6,
      hitbox: { offsetX: 13, offsetY: -12, width: 16, height: 14 },
      damage: 8, baseKnockback: 2.8, knockbackGrowth: 42, launchAngleDeg: 35, hitstop: 5,
    },
    smash: {
      name: 'Phantom Suplex', startup: 9, active: 7, endlag: 15,
      hitbox: { offsetX: 14, offsetY: -12, width: 20, height: 18 },
      damage: 22, baseKnockback: 5.4, knockbackGrowth: 102, launchAngleDeg: 42, hitstop: 10,
    },
    aerial: {
      name: 'Meteor Blitz', startup: 5, active: 7, endlag: 10,
      hitbox: { offsetX: 11, offsetY: -10, width: 17, height: 16 },
      damage: 13, baseKnockback: 3.5, knockbackGrowth: 68, launchAngleDeg: 30, hitstop: 6,
    },
    neutralSpecial: {
      name: 'Aura Cannon', startup: 9, active: 5, endlag: 13,
      hitbox: { offsetX: 14, offsetY: -12, width: 12, height: 12 },
      damage: 9, baseKnockback: 2.9, knockbackGrowth: 48, launchAngleDeg: 36, hitstop: 5,
      projectile: {
        speedX: 4.6, speedY: 0, gravity: 0, radius: 5, lifetime: 62, colorIndex: 13, glowIndex: 14,
      },
    },
    upSpecial: {
      name: 'Rising Phoenix', startup: 4, active: 15, endlag: 17,
      hitbox: { offsetX: 5, offsetY: -18, width: 18, height: 22 },
      damage: 15, baseKnockback: 4.7, knockbackGrowth: 82, launchAngleDeg: 78, hitstop: 8,
      velocityBoostX: 1.7, velocityBoostY: -7.2,
    },
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// 10. LAUGH CLOWN (Kefka — FF6 Jester Mage, 24x24 SNES High-Res Sprite)
// ══════════════════════════════════════════════════════════════════════════════
const LAUGH_CLOWN_SNES = buildSnesRpgChart({
  fxStyle: 'orb',
  snesIdle: [
    '.........131............',
    '........1331111.........',
    '.......131777771........',
    '......11557777551.......',
    '.....1553377773351......',
    '.....112222222211.......',
    '.....121222212221.......',
    '.....122233322221.......',
    '....11aaaaaaaaaa11......',
    '...1aa3377557733aa1.....',
    '..177155773377551771....',
    '..122177557755771221....',
    '...1113377557733111.....',
    '.....155337733551.......',
    '....15567733776551......',
    '....13345577554331......',
    '....17777333377771......',
    '.....11551..15511.......',
    '......1991..1991........',
    '.....19991..19991.......',
    '.....1111....1111.......',
    '........................',
    '........................',
    '........................',
  ],
  snesAttack: [
    '..........131...........',
    '.........1331111........',
    '........131777771.......',
    '.......11557777551......',
    '......1553377773351.....',
    '......112222222211......',
    '......121222212221.1ee..',
    '.....11aaaaaaaaaa11dfe..',
    '....1aa3377557733122ee..',
    '...177155773377551111...',
    '....11133775577331......',
    '.....155337733551.......',
    '....15567733776551......',
    '....17777333377771......',
    '.....1551....1551.......',
    '....19991....19991......',
    '....1111......1111......',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
});

const LAUGH_CLOWN_PALETTES: PalettePreset[] = [
  {
    name: 'World of Ruin Jester',
    colors: [
      '', '#0A0714', '#F8FAFC', '#DC2626', '#991B1B', '#7C3AED', '#4C1D95',
      '#FACC15', '#F97316', '#991B1B', '#FFFFFF', '#CBD5E1', '#FDE047',
      '#E879F9', '#FDE047', '#FFFFFF',
    ],
  },
  {
    name: 'God of Magic',
    colors: [
      '', '#0A0714', '#FFF1F2', '#F43F5E', '#9F1239', '#F59E0B', '#B45309',
      '#FEF08A', '#38BDF8', '#4C1D95', '#FFFFFF', '#E9D5FF', '#FACC15',
      '#FDE047', '#38BDF8', '#FFFFFF',
    ],
  },
  {
    name: 'Vector Imperial',
    colors: [
      '', '#09090B', '#F1F5F9', '#2563EB', '#1E3A8A', '#10B981', '#047857',
      '#FACC15', '#34D399', '#1E293B', '#FFFFFF', '#94A3B8', '#38BDF8',
      '#38BDF8', '#A7F3D0', '#FFFFFF',
    ],
  },
  {
    name: 'Midnight Harlequin',
    colors: [
      '', '#05050A', '#E2E8F0', '#A855F7', '#581C87', '#1E293B', '#0F172A',
      '#22D3EE', '#F472B6', '#09090B', '#F8FAFC', '#64748B', '#C084FC',
      '#22D3EE', '#E879F9', '#FFFFFF',
    ],
  },
];

export const LAUGH_CLOWN_BLUEPRINT: FighterBlueprint = {
  id: 'laugh-clown',
  name: 'Laugh Clown',
  era: 'SNES',
  originTag: 'Crystal VI',
  archetype: 'zoner',
  archetypeLabel: 'Chaos Magic Jester',
  gridSize: 24,
  palettes: LAUGH_CLOWN_PALETTES,
  pixelChart: LAUGH_CLOWN_SNES,
  eraPacks: {
    NES: { pixelChart: buildNesDemakeChart(LAUGH_CLOWN_SNES), palettes: buildNesPalettes(LAUGH_CLOWN_PALETTES) },
    SNES_SEGA: { pixelChart: LAUGH_CLOWN_SNES, palettes: LAUGH_CLOWN_PALETTES },
  },
  stats: {
    weight: 88, runSpeed: 2.5, airSpeed: 2.35, jumpForce: 5.8, doubleJumpForce: 5.4,
    maxJumps: 3, gravity: 0.23, fallSpeed: 4.2, fastFallSpeed: 6.2, traction: 0.19,
  },
  moveset: {
    jab: {
      name: 'Jester Zap', startup: 4, active: 5, endlag: 7,
      hitbox: { offsetX: 15, offsetY: -12, width: 17, height: 14 },
      damage: 7, baseKnockback: 2.6, knockbackGrowth: 40, launchAngleDeg: 40, hitstop: 4,
    },
    smash: {
      name: 'Havoc Wing', startup: 10, active: 7, endlag: 16,
      hitbox: { offsetX: 16, offsetY: -12, width: 24, height: 20 },
      damage: 19, baseKnockback: 4.9, knockbackGrowth: 96, launchAngleDeg: 38, hitstop: 9,
    },
    aerial: {
      name: 'Trine Spark', startup: 5, active: 7, endlag: 9,
      hitbox: { offsetX: 12, offsetY: -11, width: 19, height: 16 },
      damage: 11, baseKnockback: 3.2, knockbackGrowth: 64, launchAngleDeg: 34, hitstop: 5,
    },
    neutralSpecial: {
      name: 'Hyperdrive', startup: 9, active: 5, endlag: 14,
      hitbox: { offsetX: 14, offsetY: -12, width: 12, height: 12 },
      damage: 10, baseKnockback: 3.1, knockbackGrowth: 56, launchAngleDeg: 42, hitstop: 5,
      projectile: {
        speedX: 4.2, speedY: -0.3, gravity: 0.05, radius: 6, lifetime: 72, colorIndex: 13, glowIndex: 14, bounces: true,
      },
    },
    upSpecial: {
      name: 'Light of Judgment', startup: 4, active: 15, endlag: 17,
      hitbox: { offsetX: 4, offsetY: -18, width: 18, height: 22 },
      damage: 13, baseKnockback: 4.3, knockbackGrowth: 76, launchAngleDeg: 78, hitstop: 6,
      velocityBoostX: 1.9, velocityBoostY: -7.3,
    },
  },
};

export const CRYSTAL_6_FIGHTERS: readonly FighterBlueprint[] = [
  ESPER_HAIR_BLUEPRINT,
  TRAIN_SUPLEX_BLUEPRINT,
  LAUGH_CLOWN_BLUEPRINT,
];
