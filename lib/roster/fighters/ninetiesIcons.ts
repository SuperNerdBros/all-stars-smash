import type { FighterBlueprint } from '../../types/fighter';
import type { PalettePreset } from '../../types/palette';
import {
  buildNesDemakeChart,
  buildNesPalettes,
  buildSnesRpgChart,
} from '../rpgSpriteBuilder';

// 25. CLOUD (FINAL FANTASY VII) (24x24 SNES High-Res Sprite + 16x16 NES Pack)
const CLOUD_SNES = buildSnesRpgChart({
  fxStyle: 'slash',
  snesIdle: [
    '.....11..11..1..........',
    '....17711771171.........',
    '...1777777777771........',
    '..17717777771771........',
    '....11222222111.........',
    '.....122122121..........',
    '.....122222221..........',
    '......1222221.....111...',
    '....11133333111..1bb1...',
    '...1aa1333331bb11bbb1...',
    '..122113333311b1bbb1....',
    '..1221.13331..1bbb1.....',
    '...11..19991..1bb1......',
    '.......13331.1bb1.......',
    '......1331331111........',
    '......1331331...........',
    '.....1331..1331.........',
    '.....1331..1331.........',
    '....19991..19991........',
    '....19991..19991........',
    '....11111..11111........',
    '........................',
    '........................',
    '........................',
  ],
  snesAttack: [
    '......11..11..1.........',
    '.....17711771171........',
    '....1777777777771.......',
    '...17717777771771.......',
    '.....11222222111........',
    '......122122121.........',
    '......122222221.........',
    '.......1222221..........',
    '....111333333111........',
    '...1aa1333333111111111..',
    '....11.13333322bbbbbbb1.',
    '.......19999111bbbbbbb1.',
    '......13311331.1111111..',
    '.....1331..1331.........',
    '....1331....1331........',
    '...19991....19991.......',
    '...19991....19991.......',
    '...11111....11111.......',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
});

const CLOUD_PALETTES: PalettePreset[] = [
  {
    name: 'SOLDIER 1st Class',
    colors: [
      '', '#09090B', '#FFD2A6', '#312E81', '#1E1B4B', '#4F46E5', '#3730A3',
      '#FACC15', '#F97316', '#27272A', '#CBD5E1', '#64748B', '#FDE047',
      '#38BDF8', '#E0F2FE', '#FFFFFF',
    ],
  },
  {
    name: 'Advent Children',
    colors: [
      '', '#09090B', '#FFD2A6', '#18181B', '#09090B', '#334155', '#1E293B',
      '#FACC15', '#EF4444', '#27272A', '#94A3B8', '#475569', '#E2E8F0',
      '#38BDF8', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Shinra Infantry',
    colors: [
      '', '#080C18', '#FFD2A6', '#1D4ED8', '#1E3A8A', '#2563EB', '#172554',
      '#FACC15', '#EF4444', '#1E293B', '#CBD5E1', '#64748B', '#FDE047',
      '#60A5FA', '#E0F2FE', '#FFFFFF',
    ],
  },
  {
    name: 'Zack Fair',
    colors: [
      '', '#09090B', '#FFD2A6', '#1E293B', '#0F172A', '#334155', '#18181B',
      '#18181B', '#EF4444', '#27272A', '#CBD5E1', '#64748B', '#09090B',
      '#EF4444', '#FEF08A', '#FFFFFF',
    ],
  },
];

// 26. MEGA MAN X (24x24 SNES High-Res Sprite + 16x16 NES Pack)
const MEGAMAN_X_SNES = buildSnesRpgChart({
  fxStyle: 'beam',
  snesIdle: [
    '.......11111111.........',
    '......1555555551........',
    '.....155518815551.......',
    '.....155515515551.......',
    '....15512222221551......',
    '....15512122121551......',
    '.....111222222111.......',
    '......1122222211........',
    '....11155555555111......',
    '...155155d55d551551.....',
    '..155115555555511551....',
    '..1551.15555551.1dd1....',
    '...11..1d5555d1..11.....',
    '.......15511551.........',
    '......1551..1551........',
    '......1551..1551........',
    '.....1dd51..15dd1.......',
    '.....15551..15551.......',
    '....155551..155551......',
    '....111111..111111......',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
  snesAttack: [
    '........11111111........',
    '.......1555555551.......',
    '......155518815551......',
    '......155515515551......',
    '.....15512222221551.....',
    '.....15512122121551.....',
    '......111222222111......',
    '.......1122222211.......',
    '....11155555555111......',
    '...155155d55d551dddd1...',
    '....11.155555551ddff1...',
    '.......1d5555d111111....',
    '.......15511551.........',
    '......1551..1551........',
    '.....1dd51..15dd1.......',
    '.....15551..15551.......',
    '....155551..155551......',
    '....111111..111111......',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
});

const MEGAMAN_X_PALETTES: PalettePreset[] = [
  {
    name: 'Maverick Hunter X',
    colors: [
      '', '#060B18', '#FFD2A6', '#38BDF8', '#0284C7', '#2563EB', '#1E3A8A',
      '#FACC15', '#EF4444', '#1E293B', '#FFFFFF', '#94A3B8', '#0EA5E9',
      '#38BDF8', '#E0F2FE', '#FFFFFF',
    ],
  },
  {
    name: 'First Armor White',
    colors: [
      '', '#080C18', '#FFD2A6', '#F8FAFC', '#CBD5E1', '#F8FAFC', '#2563EB',
      '#FACC15', '#EF4444', '#1E293B', '#FFFFFF', '#94A3B8', '#38BDF8',
      '#FACC15', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Zero Crimson',
    colors: [
      '', '#140606', '#FFD2A6', '#EF4444', '#991B1B', '#DC2626', '#7F1D1D',
      '#FACC15', '#FACC15', '#18181B', '#FFFFFF', '#94A3B8', '#FDE047',
      '#4ADE80', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Ultimate Armor',
    colors: [
      '', '#090514', '#FFD2A6', '#7C3AED', '#4C1D95', '#312E81', '#1E1B4B',
      '#FACC15', '#EF4444', '#18181B', '#E2E8F0', '#94A3B8', '#A855F7',
      '#38BDF8', '#E0F2FE', '#FFFFFF',
    ],
  },
];

// 27. ALUCARD (CASTLEVANIA: SOTN) (24x24 SNES High-Res Sprite + 16x16 NES Pack)
const ALUCARD_SNES = buildSnesRpgChart({
  fxStyle: 'slash',
  snesIdle: [
    '.......1111111..........',
    '......1aaaaaaa1.........',
    '.....1aaaaaaaaa1........',
    '....1aa1222221aa1.......',
    '....1a122122121a1.......',
    '....1a122222221a1.......',
    '....1a112222211a1.......',
    '...1a111aaaaa111a1......',
    '..111331a777a13311..1b..',
    '..1333133777331331.1ab1.',
    '..13431333733313411ab1..',
    '..13411333333311417a1...',
    '..131..1337331..1121....',
    '..11...1333331..........',
    '......133111331.........',
    '......1331.1331.........',
    '.....1331...1331........',
    '.....1991...1991........',
    '....19991...19991.......',
    '....11111...11111.......',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
  snesAttack: [
    '........1111111.........',
    '.......1aaaaaaa1........',
    '......1aaaaaaaaa1.......',
    '.....1aa1222221aa1......',
    '.....1a122122121a1......',
    '.....1a122222221a1......',
    '.....1a112222211a1......',
    '....1a111aaaaa111a1.....',
    '...111331a777a13311.....',
    '...13331337773317711111.',
    '...1341.133333122aaaaab1',
    '....11..133733111111111.',
    '.......1333331..........',
    '......1331.1331.........',
    '.....1331...1331........',
    '....1991.....1991.......',
    '...19991.....19991......',
    '...11111.....11111......',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
});

const ALUCARD_PALETTES: PalettePreset[] = [
  {
    name: 'SotN Dhampir',
    colors: [
      '', '#09090B', '#F8FAFC', '#1E293B', '#0F172A', '#991B1B', '#450A0A',
      '#FACC15', '#EF4444', '#18181B', '#E2E8F0', '#94A3B8', '#CBD5E1',
      '#A855F7', '#F0ABFC', '#FFFFFF',
    ],
  },
  {
    name: 'Crimson Symphony',
    colors: [
      '', '#140608', '#F8FAFC', '#7F1D1D', '#450A0A', '#DC2626', '#991B1B',
      '#FACC15', '#EF4444', '#18181B', '#E2E8F0', '#94A3B8', '#CBD5E1',
      '#EF4444', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Mist White',
    colors: [
      '', '#0A0D18', '#FFFFFF', '#E2E8F0', '#94A3B8', '#38BDF8', '#0284C7',
      '#FACC15', '#38BDF8', '#334155', '#F8FAFC', '#CBD5E1', '#FFFFFF',
      '#67E8F9', '#E0F2FE', '#FFFFFF',
    ],
  },
  {
    name: 'Dracula Dark',
    colors: [
      '', '#050507', '#E2E8F0', '#3B0764', '#1E1B4B', '#991B1B', '#450A0A',
      '#FACC15', '#EF4444', '#09090B', '#CBD5E1', '#64748B', '#94A3B8',
      '#EF4444', '#F472B6', '#FFFFFF',
    ],
  },
];

export const NINETIES_ICONS_FIGHTERS: readonly FighterBlueprint[] = [
  {
    id: 'cloud',
    name: 'Cloud',
    nickname: 'Ex-SOLDIER',
    era: 'SNES',
    originTag: 'Final Fantasy VII',
    archetype: 'sword-hero',
    archetypeLabel: 'Ex-SOLDIER',
    gridSize: 24,
    palettes: CLOUD_PALETTES,
    pixelChart: CLOUD_SNES,
    eraPacks: {
      NES: { pixelChart: buildNesDemakeChart(CLOUD_SNES), palettes: buildNesPalettes(CLOUD_PALETTES) },
      SNES_SEGA: { pixelChart: CLOUD_SNES, palettes: CLOUD_PALETTES },
    },
    stats: {
      weight: 100, runSpeed: 2.75, airSpeed: 2.25, jumpForce: 5.7, doubleJumpForce: 5.2,
      maxJumps: 3, gravity: 0.27, fallSpeed: 4.8, fastFallSpeed: 6.9, traction: 0.23,
    },
    moveset: {
      jab: {
        name: 'Buster Slash', startup: 4, active: 5, endlag: 8,
        hitbox: { offsetX: 16, offsetY: -12, width: 22, height: 14 },
        damage: 8, baseKnockback: 2.6, knockbackGrowth: 40, launchAngleDeg: 36, hitstop: 5,
      },
      smash: {
        name: 'Cross-Slash', startup: 10, active: 7, endlag: 15,
        hitbox: { offsetX: 18, offsetY: -12, width: 26, height: 18 },
        damage: 20, baseKnockback: 5.0, knockbackGrowth: 98, launchAngleDeg: 35, hitstop: 9,
      },
      aerial: {
        name: 'Finishing Touch', startup: 5, active: 6, endlag: 9,
        hitbox: { offsetX: 14, offsetY: -11, width: 20, height: 16 },
        damage: 13, baseKnockback: 3.5, knockbackGrowth: 72, launchAngleDeg: 32, hitstop: 7,
      },
      neutralSpecial: {
        name: 'Blade Beam', startup: 9, active: 5, endlag: 13,
        hitbox: { offsetX: 14, offsetY: -12, width: 14, height: 12 },
        damage: 10, baseKnockback: 2.9, knockbackGrowth: 50, launchAngleDeg: 38, hitstop: 5,
        projectile: {
          speedX: 4.6, speedY: 0, gravity: 0, radius: 5, lifetime: 60, colorIndex: 13, glowIndex: 14,
        },
      },
      upSpecial: {
        name: 'Climhazzard', startup: 4, active: 14, endlag: 17,
        hitbox: { offsetX: 4, offsetY: -18, width: 18, height: 22 },
        damage: 14, baseKnockback: 4.5, knockbackGrowth: 80, launchAngleDeg: 78, hitstop: 7,
        velocityBoostX: 1.6, velocityBoostY: -7.1,
      },
    },
  },
  {
    id: 'megaman-x',
    name: 'Mega Man X',
    nickname: 'Maverick Hunter',
    era: 'SNES',
    originTag: 'Mega Man X',
    archetype: 'heavy-gunner',
    archetypeLabel: 'Maverick Hunter',
    gridSize: 24,
    palettes: MEGAMAN_X_PALETTES,
    pixelChart: MEGAMAN_X_SNES,
    eraPacks: {
      NES: { pixelChart: buildNesDemakeChart(MEGAMAN_X_SNES), palettes: buildNesPalettes(MEGAMAN_X_PALETTES) },
      SNES_SEGA: { pixelChart: MEGAMAN_X_SNES, palettes: MEGAMAN_X_PALETTES },
    },
    stats: {
      weight: 98, runSpeed: 2.7, airSpeed: 2.25, jumpForce: 5.7, doubleJumpForce: 5.2,
      maxJumps: 3, gravity: 0.26, fallSpeed: 4.7, fastFallSpeed: 6.7, traction: 0.23,
    },
    moveset: {
      jab: {
        name: 'Dash Buster', startup: 4, active: 5, endlag: 7,
        hitbox: { offsetX: 14, offsetY: -12, width: 16, height: 12 },
        damage: 6, baseKnockback: 2.2, knockbackGrowth: 36, launchAngleDeg: 36, hitstop: 4,
      },
      smash: {
        name: 'Hadouken Blast', startup: 10, active: 6, endlag: 15,
        hitbox: { offsetX: 16, offsetY: -12, width: 22, height: 16 },
        damage: 18, baseKnockback: 4.7, knockbackGrowth: 94, launchAngleDeg: 35, hitstop: 8,
      },
      aerial: {
        name: 'Air Dash Kick', startup: 5, active: 6, endlag: 9,
        hitbox: { offsetX: 12, offsetY: -10, width: 18, height: 14 },
        damage: 11, baseKnockback: 3.1, knockbackGrowth: 64, launchAngleDeg: 34, hitstop: 6,
      },
      neutralSpecial: {
        name: 'Charged X-Shot', startup: 8, active: 5, endlag: 12,
        hitbox: { offsetX: 14, offsetY: -12, width: 14, height: 12 },
        damage: 10, baseKnockback: 3.0, knockbackGrowth: 50, launchAngleDeg: 36, hitstop: 5,
        projectile: {
          speedX: 5.4, speedY: 0, gravity: 0, radius: 5, lifetime: 58, colorIndex: 13, glowIndex: 14,
        },
      },
      upSpecial: {
        name: 'Rising Fire', startup: 4, active: 14, endlag: 17,
        hitbox: { offsetX: 4, offsetY: -18, width: 18, height: 22 },
        damage: 14, baseKnockback: 4.5, knockbackGrowth: 80, launchAngleDeg: 78, hitstop: 7,
        velocityBoostX: 1.6, velocityBoostY: -7.1,
      },
    },
  },
  {
    id: 'alucard',
    name: 'Alucard',
    nickname: 'Dhampir Prince',
    era: 'SNES',
    originTag: 'Castlevania: SotN',
    archetype: 'sword-hero',
    archetypeLabel: 'Dhampir Prince',
    gridSize: 24,
    palettes: ALUCARD_PALETTES,
    pixelChart: ALUCARD_SNES,
    eraPacks: {
      NES: { pixelChart: buildNesDemakeChart(ALUCARD_SNES), palettes: buildNesPalettes(ALUCARD_PALETTES) },
      SNES_SEGA: { pixelChart: ALUCARD_SNES, palettes: ALUCARD_PALETTES },
    },
    stats: {
      weight: 95, runSpeed: 2.75, airSpeed: 2.3, jumpForce: 5.7, doubleJumpForce: 5.3,
      maxJumps: 4, gravity: 0.24, fallSpeed: 4.4, fastFallSpeed: 6.4, traction: 0.23,
    },
    moveset: {
      jab: {
        name: 'Rapier Flurry', startup: 3, active: 5, endlag: 7,
        hitbox: { offsetX: 15, offsetY: -12, width: 20, height: 12 },
        damage: 6, baseKnockback: 2.3, knockbackGrowth: 36, launchAngleDeg: 36, hitstop: 4,
      },
      smash: {
        name: 'Hellfire Cleave', startup: 10, active: 6, endlag: 14,
        hitbox: { offsetX: 17, offsetY: -12, width: 24, height: 16 },
        damage: 18, baseKnockback: 4.6, knockbackGrowth: 92, launchAngleDeg: 36, hitstop: 8,
      },
      aerial: {
        name: 'Moon Crescent', startup: 5, active: 6, endlag: 9,
        hitbox: { offsetX: 13, offsetY: -11, width: 18, height: 15 },
        damage: 12, baseKnockback: 3.2, knockbackGrowth: 66, launchAngleDeg: 34, hitstop: 6,
      },
      neutralSpecial: {
        name: 'Dark Fireball', startup: 9, active: 4, endlag: 13,
        hitbox: { offsetX: 14, offsetY: -12, width: 12, height: 12 },
        damage: 9, baseKnockback: 2.8, knockbackGrowth: 48, launchAngleDeg: 40, hitstop: 5,
        projectile: {
          speedX: 4.5, speedY: 0, gravity: 0, radius: 5, lifetime: 60, colorIndex: 13, glowIndex: 14,
        },
      },
      upSpecial: {
        name: 'Bat Ascent', startup: 4, active: 14, endlag: 16,
        hitbox: { offsetX: 2, offsetY: -18, width: 18, height: 22 },
        damage: 12, baseKnockback: 4.2, knockbackGrowth: 74, launchAngleDeg: 80, hitstop: 6,
        velocityBoostX: 1.7, velocityBoostY: -7.2,
      },
    },
  },
];
