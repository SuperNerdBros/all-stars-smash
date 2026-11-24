import type { FighterBlueprint } from '../../types/fighter';
import type { PalettePreset } from '../../types/palette';
import {
  buildNesDemakeChart,
  buildNesPalettes,
  buildSnesRpgChart,
} from '../rpgSpriteBuilder';

// 19. RYU (STREET FIGHTER II) (24x24 SNES High-Res Sprite + 16x16 NES Pack)
const RYU_SNES = buildSnesRpgChart({
  fxStyle: 'beam',
  snesIdle: [
    '........................',
    '........111111..........',
    '.......1cccccc1.........',
    '......13333333311.......',
    '......122122122131......',
    '......1222222221.11.....',
    '.......12222221.........',
    '.....111aaaaaa111.......',
    '....1221aaaaaa1221......',
    '...12211aaaaaa11221.....',
    '...1881.1aaaa1.1881.....',
    '....11..199991..11......',
    '........1aaaa1..........',
    '.......1aaaaaa1.........',
    '.......1aa11aa1.........',
    '......1aa1..1aa1........',
    '......1aa1..1aa1........',
    '......1221..1221........',
    '.....12221..12221.......',
    '.....11111..11111.......',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
  snesAttack: [
    '........................',
    '.........111111.........',
    '........1cccccc1........',
    '.......13333333311......',
    '.......122122122131.....',
    '.......1222222221.11....',
    '........12222221........',
    '.....1111aaaaaa111......',
    '....12221aaaaaa122111...',
    '....1881.1aaaa1.1288d1..',
    '.....11..199991..11ddd1.',
    '........1aaaaaa1...111..',
    '.......1aa11aa1.........',
    '......1aa1..1aa1........',
    '.....1aa1....1aa1.......',
    '.....1221....1221.......',
    '....12221....12221......',
    '....11111....11111......',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
});

const RYU_PALETTES: PalettePreset[] = [
  {
    name: 'World Warrior Gi',
    colors: [
      '', '#0A0D18', '#FFD2A6', '#EF4444', '#991B1B', '#E2E8F0', '#94A3B8',
      '#FACC15', '#DC2626', '#18181B', '#F8FAFC', '#64748B', '#451A03',
      '#38BDF8', '#E0F2FE', '#FFFFFF',
    ],
  },
  {
    name: 'Ken Masters Red',
    colors: [
      '', '#140808', '#FFD2A6', '#DC2626', '#991B1B', '#EF4444', '#7F1D1D',
      '#FACC15', '#F97316', '#18181B', '#EF4444', '#991B1B', '#FACC15',
      '#F97316', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Evil Ryu Dark',
    colors: [
      '', '#09090B', '#CBD5E1', '#DC2626', '#7F1D1D', '#334155', '#1E293B',
      '#FACC15', '#EF4444', '#09090B', '#334155', '#1E293B', '#18181B',
      '#A855F7', '#F472B6', '#FFFFFF',
    ],
  },
  {
    name: 'Turbo Blue Gi',
    colors: [
      '', '#080C18', '#FFD2A6', '#FACC15', '#CA8A04', '#2563EB', '#1E3A8A',
      '#FACC15', '#2563EB', '#18181B', '#38BDF8', '#0284C7', '#451A03',
      '#38BDF8', '#E0F2FE', '#FFFFFF',
    ],
  },
];

// 20. CHUN-LI (24x24 SNES High-Res Sprite + 16x16 NES Pack)
const CHUN_LI_SNES = buildSnesRpgChart({
  fxStyle: 'orb',
  snesIdle: [
    '.....111........111.....',
    '....1aaa11111111aaa1....',
    '....1aa1cccccccc1aa1....',
    '.....111c222222c111.....',
    '.......1221221221.......',
    '.......1222222221.......',
    '........12222221........',
    '......111557755111......',
    '.....12215577551221.....',
    '....1221155555511221....',
    '....19a1.155751.1a91....',
    '.....11..155551..11.....',
    '........15555551........',
    '.......1555775551.......',
    '.......1551111551.......',
    '.......1221..1221.......',
    '.......1221..1221.......',
    '......1aa1....1aa1......',
    '.....1aaa1....1aaa1.....',
    '.....11111....11111.....',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
  snesAttack: [
    '......111........111....',
    '.....1aaa11111111aaa1...',
    '.....1aa1cccccccc1aa1...',
    '......111c222222c111....',
    '........1221221221......',
    '........1222222221......',
    '.........12222221.......',
    '......111557755111......',
    '.....12215577551221.....',
    '.....19a15555551a91.....',
    '......11.155751.11......',
    '........155555511111....',
    '.......15557755222aaa1..',
    '.......15511111111111...',
    '......1221..............',
    '.....1aa1...............',
    '....1aaa1...............',
    '....11111...............',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
});

const CHUN_LI_PALETTES: PalettePreset[] = [
  {
    name: 'Interpol Blue',
    colors: [
      '', '#080C18', '#FFD2A6', '#EF4444', '#991B1B', '#2563EB', '#1D4ED8',
      '#FACC15', '#F97316', '#451A03', '#F8FAFC', '#94A3B8', '#18181B',
      '#38BDF8', '#E0F2FE', '#FFFFFF',
    ],
  },
  {
    name: 'Turbo Crimson',
    colors: [
      '', '#140808', '#FFD2A6', '#FACC15', '#CA8A04', '#DC2626', '#991B1B',
      '#FDE047', '#F97316', '#451A03', '#F8FAFC', '#94A3B8', '#18181B',
      '#FB923C', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Alpha Emerald',
    colors: [
      '', '#06140E', '#FFD2A6', '#FACC15', '#CA8A04', '#16A34A', '#166534',
      '#FACC15', '#F97316', '#451A03', '#F8FAFC', '#94A3B8', '#18181B',
      '#4ADE80', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Shadow Lady',
    colors: [
      '', '#09090B', '#E2E8F0', '#A855F7', '#6B21A8', '#1E293B', '#0F172A',
      '#FACC15', '#EC4899', '#18181B', '#CBD5E1', '#475569', '#09090B',
      '#A855F7', '#F0ABFC', '#FFFFFF',
    ],
  },
];

// 21. SCORPION (MORTAL KOMBAT) (24x24 SNES/SEGA High-Res Sprite + 16x16 NES Pack)
const SCORPION_SNES = buildSnesRpgChart({
  fxStyle: 'slash',
  snesIdle: [
    '........111111..........',
    '.......17777771.........',
    '......1771111771........',
    '......1712222171........',
    '......171a22a171........',
    '......1177777711........',
    '.......17744771.........',
    '.....111999999111.......',
    '....12217799771221......',
    '...1221177997711221.....',
    '...1991.179971.1991.....',
    '....11..177771..11......',
    '........199991..........',
    '.......17799771.........',
    '.......19911991.........',
    '......1991..1991........',
    '......1991..1991........',
    '.....17771..17771.......',
    '.....19991..19991.......',
    '.....11111..11111.......',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
  snesAttack: [
    '.........111111.........',
    '........17777771........',
    '.......1771111771.......',
    '.......1712222171.......',
    '.......171a22a171.......',
    '.......1177777711.......',
    '........17744771........',
    '.....1111999999111......',
    '....122177997712211111..',
    '....1991179977199bbbb1..',
    '.....11..177771..1111...',
    '........199991..........',
    '.......17799771.........',
    '......1991..1991........',
    '.....1991....1991.......',
    '....17771....17771......',
    '....19991....19991......',
    '....11111....11111......',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
});

const SCORPION_PALETTES: PalettePreset[] = [
  {
    name: 'Shirai Ryu Gold',
    colors: [
      '', '#09090B', '#FFD2A6', '#FACC15', '#CA8A04', '#EAB308', '#A16207',
      '#FACC15', '#F97316', '#18181B', '#FFFFFF', '#94A3B8', '#78350F',
      '#F97316', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Reptile Acid',
    colors: [
      '', '#06140A', '#FFD2A6', '#22C55E', '#15803D', '#4ADE80', '#166534',
      '#22C55E', '#84CC16', '#18181B', '#FFFFFF', '#94A3B8', '#14532D',
      '#4ADE80', '#BEF264', '#FFFFFF',
    ],
  },
  {
    name: 'Smoke Silver',
    colors: [
      '', '#09090B', '#CBD5E1', '#94A3B8', '#475569', '#64748B', '#334155',
      '#CBD5E1', '#38BDF8', '#18181B', '#FFFFFF', '#64748B', '#0F172A',
      '#94A3B8', '#E2E8F0', '#FFFFFF',
    ],
  },
  {
    name: 'Inferno Red',
    colors: [
      '', '#140606', '#FFD2A6', '#EF4444', '#991B1B', '#DC2626', '#7F1D1D',
      '#EF4444', '#F97316', '#18181B', '#FFFFFF', '#94A3B8', '#450A0A',
      '#EF4444', '#FEF08A', '#FFFFFF',
    ],
  },
];

export const ARCADE_WARRIORS_FIGHTERS: readonly FighterBlueprint[] = [
  {
    id: 'ryu',
    name: 'Ryu',
    nickname: 'World Warrior',
    era: 'SNES',
    originTag: 'Street Fighter II',
    archetype: 'brawler',
    archetypeLabel: 'World Warrior',
    gridSize: 24,
    palettes: RYU_PALETTES,
    pixelChart: RYU_SNES,
    eraPacks: {
      NES: { pixelChart: buildNesDemakeChart(RYU_SNES), palettes: buildNesPalettes(RYU_PALETTES) },
      SNES_SEGA: { pixelChart: RYU_SNES, palettes: RYU_PALETTES },
    },
    stats: {
      weight: 103, runSpeed: 2.55, airSpeed: 2.1, jumpForce: 5.5, doubleJumpForce: 5.0,
      maxJumps: 3, gravity: 0.27, fallSpeed: 4.8, fastFallSpeed: 6.9, traction: 0.24,
    },
    moveset: {
      jab: {
        name: 'Karate Chop', startup: 3, active: 5, endlag: 7,
        hitbox: { offsetX: 14, offsetY: -12, width: 16, height: 12 },
        damage: 6, baseKnockback: 2.3, knockbackGrowth: 36, launchAngleDeg: 36, hitstop: 4,
      },
      smash: {
        name: 'Tatsumaki Kick', startup: 10, active: 7, endlag: 15,
        hitbox: { offsetX: 16, offsetY: -12, width: 22, height: 16 },
        damage: 18, baseKnockback: 4.8, knockbackGrowth: 94, launchAngleDeg: 34, hitstop: 8,
        velocityBoostX: 2.2,
      },
      aerial: {
        name: 'Jumping Roundhouse', startup: 5, active: 6, endlag: 9,
        hitbox: { offsetX: 12, offsetY: -10, width: 18, height: 14 },
        damage: 12, baseKnockback: 3.3, knockbackGrowth: 68, launchAngleDeg: 32, hitstop: 6,
      },
      neutralSpecial: {
        name: 'Hadouken', startup: 9, active: 5, endlag: 13,
        hitbox: { offsetX: 14, offsetY: -12, width: 12, height: 12 },
        damage: 9, baseKnockback: 2.8, knockbackGrowth: 48, launchAngleDeg: 38, hitstop: 5,
        projectile: {
          speedX: 4.5, speedY: 0, gravity: 0, radius: 5, lifetime: 60, colorIndex: 13, glowIndex: 14,
        },
      },
      upSpecial: {
        name: 'Shoryuken', startup: 3, active: 14, endlag: 18,
        hitbox: { offsetX: 6, offsetY: -18, width: 16, height: 22 },
        damage: 15, baseKnockback: 4.8, knockbackGrowth: 84, launchAngleDeg: 76, hitstop: 8,
        velocityBoostX: 1.5, velocityBoostY: -7.1,
      },
    },
  },
  {
    id: 'chun-li',
    name: 'Chun-Li',
    nickname: 'Jade Striker',
    era: 'SNES',
    originTag: 'Street Fighter II',
    archetype: 'speedster',
    archetypeLabel: 'Jade Striker',
    gridSize: 24,
    palettes: CHUN_LI_PALETTES,
    pixelChart: CHUN_LI_SNES,
    eraPacks: {
      NES: { pixelChart: buildNesDemakeChart(CHUN_LI_SNES), palettes: buildNesPalettes(CHUN_LI_PALETTES) },
      SNES_SEGA: { pixelChart: CHUN_LI_SNES, palettes: CHUN_LI_PALETTES },
    },
    stats: {
      weight: 88, runSpeed: 3.05, airSpeed: 2.45, jumpForce: 5.8, doubleJumpForce: 5.3,
      maxJumps: 3, gravity: 0.25, fallSpeed: 4.6, fastFallSpeed: 6.6, traction: 0.24,
    },
    moveset: {
      jab: {
        name: 'Lightning Legs', startup: 3, active: 6, endlag: 6,
        hitbox: { offsetX: 14, offsetY: -10, width: 18, height: 13 },
        damage: 6, baseKnockback: 2.1, knockbackGrowth: 34, launchAngleDeg: 38, hitstop: 4,
      },
      smash: {
        name: 'Hazanshu', startup: 9, active: 6, endlag: 14,
        hitbox: { offsetX: 16, offsetY: -12, width: 22, height: 16 },
        damage: 16, baseKnockback: 4.4, knockbackGrowth: 88, launchAngleDeg: 34, hitstop: 8,
      },
      aerial: {
        name: 'Wall Jump Kick', startup: 4, active: 6, endlag: 8,
        hitbox: { offsetX: 12, offsetY: -10, width: 18, height: 14 },
        damage: 11, baseKnockback: 3.1, knockbackGrowth: 64, launchAngleDeg: 32, hitstop: 6,
      },
      neutralSpecial: {
        name: 'Kikoken', startup: 8, active: 4, endlag: 12,
        hitbox: { offsetX: 14, offsetY: -12, width: 12, height: 12 },
        damage: 8, baseKnockback: 2.5, knockbackGrowth: 42, launchAngleDeg: 40, hitstop: 4,
        projectile: {
          speedX: 4.3, speedY: 0, gravity: 0, radius: 5, lifetime: 58, colorIndex: 13, glowIndex: 14,
        },
      },
      upSpecial: {
        name: 'Spinning Bird', startup: 4, active: 15, endlag: 16,
        hitbox: { offsetX: 0, offsetY: -16, width: 22, height: 20 },
        damage: 13, baseKnockback: 4.2, knockbackGrowth: 74, launchAngleDeg: 78, hitstop: 6,
        velocityBoostX: 1.7, velocityBoostY: -7.1,
      },
    },
  },
  {
    id: 'scorpion',
    name: 'Scorpion',
    nickname: 'Nether Specter',
    era: 'SEGA',
    originTag: 'Mortal Kombat',
    archetype: 'shinobi',
    archetypeLabel: 'Nether Specter',
    gridSize: 24,
    palettes: SCORPION_PALETTES,
    pixelChart: SCORPION_SNES,
    eraPacks: {
      NES: { pixelChart: buildNesDemakeChart(SCORPION_SNES), palettes: buildNesPalettes(SCORPION_PALETTES) },
      SNES_SEGA: { pixelChart: SCORPION_SNES, palettes: SCORPION_PALETTES },
    },
    stats: {
      weight: 98, runSpeed: 2.75, airSpeed: 2.25, jumpForce: 5.6, doubleJumpForce: 5.1,
      maxJumps: 3, gravity: 0.27, fallSpeed: 4.8, fastFallSpeed: 6.9, traction: 0.23,
    },
    moveset: {
      jab: {
        name: 'Ninja Palm', startup: 3, active: 5, endlag: 7,
        hitbox: { offsetX: 14, offsetY: -12, width: 16, height: 12 },
        damage: 6, baseKnockback: 2.3, knockbackGrowth: 36, launchAngleDeg: 36, hitstop: 4,
      },
      smash: {
        name: 'Hellfire Kick', startup: 10, active: 6, endlag: 14,
        hitbox: { offsetX: 16, offsetY: -12, width: 22, height: 16 },
        damage: 18, baseKnockback: 4.7, knockbackGrowth: 94, launchAngleDeg: 34, hitstop: 8,
      },
      aerial: {
        name: 'Air Slash', startup: 5, active: 6, endlag: 9,
        hitbox: { offsetX: 12, offsetY: -10, width: 18, height: 14 },
        damage: 12, baseKnockback: 3.2, knockbackGrowth: 66, launchAngleDeg: 32, hitstop: 6,
      },
      neutralSpecial: {
        name: 'Kunai Spear', startup: 8, active: 4, endlag: 13,
        hitbox: { offsetX: 14, offsetY: -12, width: 14, height: 10 },
        damage: 9, baseKnockback: 2.8, knockbackGrowth: 46, launchAngleDeg: 36, hitstop: 5,
        projectile: {
          speedX: 5.8, speedY: 0, gravity: 0, radius: 4, lifetime: 54, colorIndex: 11, glowIndex: 13,
        },
      },
      upSpecial: {
        name: 'Teleport Punch', startup: 4, active: 13, endlag: 16,
        hitbox: { offsetX: 4, offsetY: -18, width: 18, height: 22 },
        damage: 13, baseKnockback: 4.3, knockbackGrowth: 76, launchAngleDeg: 78, hitstop: 7,
        velocityBoostX: 1.9, velocityBoostY: -7.1,
      },
    },
  },
];
