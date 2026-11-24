import type { FighterBlueprint } from '../../types/fighter';
import type { PalettePreset } from '../../types/palette';
import {
  buildNesDemakeChart,
  buildNesPalettes,
  buildSnesRpgChart,
} from '../rpgSpriteBuilder';

// 22. SUB-ZERO (MORTAL KOMBAT) (24x24 SNES/SEGA High-Res Sprite + 16x16 NES Pack)
const SUB_ZERO_SNES = buildSnesRpgChart({
  fxStyle: 'orb',
  snesIdle: [
    '........111111..........',
    '.......15555551.........',
    '......1551111551........',
    '......1512222151........',
    '......151e22e151........',
    '......1155555511........',
    '.......15566551.........',
    '.....111999999111.......',
    '....12215599551221......',
    '...1221155995511221.....',
    '...1991.159951.1991.....',
    '....11..155551..11......',
    '........199991..........',
    '.......15599551.........',
    '.......19911991.........',
    '......1991..1991........',
    '......1991..1991........',
    '.....15551..15551.......',
    '.....19991..19991.......',
    '.....11111..11111.......',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
  snesAttack: [
    '.........111111.........',
    '........15555551........',
    '.......1551111551.......',
    '.......1512222151.......',
    '.......151e22e151.......',
    '.......1155555511.......',
    '........15566551...1ff..',
    '.....11119999991..1ddf1.',
    '....12215599551221ddf1..',
    '....19911599551111dd1...',
    '.....11..155551.........',
    '........199991..........',
    '.......15599551.........',
    '......1991..1991........',
    '.....1991....1991.......',
    '....15551....15551......',
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

const SUB_ZERO_PALETTES: PalettePreset[] = [
  {
    name: 'Lin Kuei Blue',
    colors: [
      '', '#080C18', '#FFD2A6', '#2563EB', '#1E3A8A', '#38BDF8', '#0284C7',
      '#38BDF8', '#67E8F9', '#18181B', '#FFFFFF', '#94A3B8', '#0F172A',
      '#38BDF8', '#E0F2FE', '#FFFFFF',
    ],
  },
  {
    name: 'Classic Cyan',
    colors: [
      '', '#061418', '#FFD2A6', '#06B6D4', '#0E7490', '#22D3EE', '#0891B2',
      '#67E8F9', '#38BDF8', '#18181B', '#FFFFFF', '#94A3B8', '#0F172A',
      '#67E8F9', '#E0F2FE', '#FFFFFF',
    ],
  },
  {
    name: 'Noob Shadow',
    colors: [
      '', '#050507', '#475569', '#1E293B', '#09090B', '#334155', '#0F172A',
      '#64748B', '#A855F7', '#09090B', '#CBD5E1', '#475569', '#09090B',
      '#A855F7', '#E2E8F0', '#FFFFFF',
    ],
  },
  {
    name: 'Cyber Sub-Zero',
    colors: [
      '', '#080C18', '#94A3B8', '#1D4ED8', '#1E3A8A', '#60A5FA', '#2563EB',
      '#38BDF8', '#EF4444', '#1E293B', '#FFFFFF', '#64748B', '#0F172A',
      '#38BDF8', '#E0F2FE', '#FFFFFF',
    ],
  },
];

// 23. BILL RIZER (CONTRA) (24x24 SNES High-Res Sprite + 16x16 NES Pack)
const BILL_RIZER_SNES = buildSnesRpgChart({
  fxStyle: 'beam',
  snesIdle: [
    '........111111..........',
    '.......1cccccc1.........',
    '......13333333311.......',
    '......122122122131......',
    '......1222222221.11.....',
    '.......12222221.........',
    '.....111222222111.......',
    '....12212222221221......',
    '...1221122222211221.....',
    '...12211bbbbbbbbbbb1....',
    '....11..15555555111.....',
    '........15555551........',
    '.......1556116551.......',
    '.......1551..1551.......',
    '......1551....1551......',
    '......1551....1551......',
    '.....19991....19991.....',
    '.....19991....19991.....',
    '.....11111....11111.....',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
  snesAttack: [
    '.........111111.........',
    '........1cccccc1........',
    '.......13333333311......',
    '.......122122122131.....',
    '.......1222222221.11....',
    '........12222221........',
    '.....1111222222111......',
    '....122212222221221.....',
    '....12211bbbbbbbbbbb1...',
    '.....11..15555555111....',
    '........15555551........',
    '.......1556116551.......',
    '......1551....1551......',
    '.....1551......1551.....',
    '....19991......19991....',
    '....19991......19991....',
    '....11111......11111....',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
});

const BILL_RIZER_PALETTES: PalettePreset[] = [
  {
    name: 'Contra Jungle Blue',
    colors: [
      '', '#0A0D18', '#FFD2A6', '#EF4444', '#991B1B', '#2563EB', '#1E3A8A',
      '#FACC15', '#F97316', '#451A03', '#F8FAFC', '#64748B', '#78350F',
      '#F97316', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Lance Bean Red',
    colors: [
      '', '#140808', '#FFD2A6', '#F8FAFC', '#CBD5E1', '#DC2626', '#991B1B',
      '#FACC15', '#EF4444', '#451A03', '#FFFFFF', '#64748B', '#18181B',
      '#EF4444', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Super C Camo',
    colors: [
      '', '#06140A', '#FFD2A6', '#EF4444', '#991B1B', '#16A34A', '#166534',
      '#FACC15', '#F97316', '#451A03', '#FFFFFF', '#64748B', '#14532D',
      '#4ADE80', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Alien Wars Gold',
    colors: [
      '', '#140E04', '#FFD2A6', '#FACC15', '#CA8A04', '#334155', '#1E293B',
      '#FDE047', '#F97316', '#18181B', '#FFFFFF', '#64748B', '#78350F',
      '#FACC15', '#FEF08A', '#FFFFFF',
    ],
  },
];

// 24. ARTHUR (GHOSTS 'N GOBLINS) (24x24 SNES High-Res Sprite + 16x16 NES Pack)
const ARTHUR_SNES = buildSnesRpgChart({
  fxStyle: 'slash',
  snesIdle: [
    '.......1111.............',
    '......133331............',
    '......11111111..........',
    '.....1aaaaaaaa1.........',
    '.....1a111111a1.........',
    '.....1a121221a1.........',
    '.....1a1c222ca1.........',
    '......11ccccc1..........',
    '....111aaaaaa111........',
    '...1aa1aa55aa1aa1..1a...',
    '..1aa11aaaaaa11aa11ab1..',
    '..1ab1.1aaaa1.1ab11ab1..',
    '...11..1a77a1..11.1ab1..',
    '.......1aaaa1.....1ab1..',
    '......1aa11aa1....191...',
    '......1aa11aa1....11....',
    '.....1aa1..1aa1.........',
    '.....1bb1..1bb1.........',
    '....1bbb1..1bbb1........',
    '....11111..11111........',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
  snesAttack: [
    '........1111............',
    '.......133331...........',
    '.......11111111.........',
    '......1aaaaaaaa1........',
    '......1a111111a1........',
    '......1a121221a1........',
    '......1a1c222ca1........',
    '.......11ccccc1.........',
    '.....111aaaaaa111.......',
    '....1aa1aa55aa1aa1......',
    '....1111aaaaaa191111111.',
    '.......1a77a1.1aaaaaaaa1',
    '.......1aaaa1..11111111.',
    '......1aa11aa1..........',
    '.....1aa1..1aa1.........',
    '....1bb1....1bb1........',
    '...1bbb1....1bbb1.......',
    '...11111....11111.......',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
});

const ARTHUR_PALETTES: PalettePreset[] = [
  {
    name: 'Silver Knight',
    colors: [
      '', '#0A0D18', '#FFD2A6', '#EF4444', '#991B1B', '#2563EB', '#1E3A8A',
      '#FACC15', '#F97316', '#78350F', '#E2E8F0', '#64748B', '#92400E',
      '#38BDF8', '#E0F2FE', '#FFFFFF',
    ],
  },
  {
    name: 'Golden Armor',
    colors: [
      '', '#140E04', '#FFD2A6', '#EF4444', '#991B1B', '#2563EB', '#1E3A8A',
      '#FDE047', '#F97316', '#78350F', '#FACC15', '#CA8A04', '#92400E',
      '#FACC15', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Boxer Shorts',
    colors: [
      '', '#180A0E', '#FFD2A6', '#EF4444', '#991B1B', '#EC4899', '#9D174D',
      '#FACC15', '#F97316', '#78350F', '#FFD2A6', '#F472B6', '#92400E',
      '#F472B6', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Dark Knight',
    colors: [
      '', '#09090B', '#CBD5E1', '#A855F7', '#6B21A8', '#7C3AED', '#4C1D95',
      '#FACC15', '#EF4444', '#18181B', '#475569', '#1E293B', '#27272A',
      '#A855F7', '#F0ABFC', '#FFFFFF',
    ],
  },
];

export const ACTION_HEROES_FIGHTERS: readonly FighterBlueprint[] = [
  {
    id: 'sub-zero',
    name: 'Sub-Zero',
    nickname: 'Lin Kuei Cryo',
    era: 'SEGA',
    originTag: 'Mortal Kombat',
    archetype: 'shinobi',
    archetypeLabel: 'Lin Kuei Cryo',
    gridSize: 24,
    palettes: SUB_ZERO_PALETTES,
    pixelChart: SUB_ZERO_SNES,
    eraPacks: {
      NES: { pixelChart: buildNesDemakeChart(SUB_ZERO_SNES), palettes: buildNesPalettes(SUB_ZERO_PALETTES) },
      SNES_SEGA: { pixelChart: SUB_ZERO_SNES, palettes: SUB_ZERO_PALETTES },
    },
    stats: {
      weight: 99, runSpeed: 2.65, airSpeed: 2.2, jumpForce: 5.5, doubleJumpForce: 5.0,
      maxJumps: 3, gravity: 0.27, fallSpeed: 4.8, fastFallSpeed: 6.9, traction: 0.23,
    },
    moveset: {
      jab: {
        name: 'Frost Palm', startup: 4, active: 5, endlag: 7,
        hitbox: { offsetX: 14, offsetY: -12, width: 16, height: 12 },
        damage: 6, baseKnockback: 2.3, knockbackGrowth: 36, launchAngleDeg: 38, hitstop: 4,
      },
      smash: {
        name: 'Ice Slide', startup: 9, active: 8, endlag: 14,
        hitbox: { offsetX: 16, offsetY: -8, width: 22, height: 14 },
        damage: 17, baseKnockback: 4.5, knockbackGrowth: 90, launchAngleDeg: 34, hitstop: 8,
        velocityBoostX: 2.8,
      },
      aerial: {
        name: 'Cryo Axe Kick', startup: 5, active: 6, endlag: 9,
        hitbox: { offsetX: 12, offsetY: -10, width: 18, height: 14 },
        damage: 12, baseKnockback: 3.3, knockbackGrowth: 66, launchAngleDeg: 30, hitstop: 6,
      },
      neutralSpecial: {
        name: 'Ice Ball', startup: 9, active: 5, endlag: 13,
        hitbox: { offsetX: 14, offsetY: -12, width: 14, height: 12 },
        damage: 9, baseKnockback: 2.8, knockbackGrowth: 46, launchAngleDeg: 40, hitstop: 5,
        projectile: {
          speedX: 4.2, speedY: 0, gravity: 0, radius: 5, lifetime: 62, colorIndex: 13, glowIndex: 14,
        },
      },
      upSpecial: {
        name: 'Ice Pillar Rise', startup: 4, active: 14, endlag: 17,
        hitbox: { offsetX: 4, offsetY: -18, width: 18, height: 22 },
        damage: 13, baseKnockback: 4.3, knockbackGrowth: 76, launchAngleDeg: 78, hitstop: 7,
        velocityBoostX: 1.5, velocityBoostY: -7.0,
      },
    },
  },
  {
    id: 'bill-rizer',
    name: 'Bill Rizer',
    nickname: 'Jungle Commando',
    era: 'NES',
    originTag: 'Contra',
    archetype: 'heavy-gunner',
    archetypeLabel: 'Jungle Commando',
    gridSize: 24,
    palettes: BILL_RIZER_PALETTES,
    pixelChart: BILL_RIZER_SNES,
    eraPacks: {
      NES: { pixelChart: buildNesDemakeChart(BILL_RIZER_SNES), palettes: buildNesPalettes(BILL_RIZER_PALETTES) },
      SNES_SEGA: { pixelChart: BILL_RIZER_SNES, palettes: BILL_RIZER_PALETTES },
    },
    stats: {
      weight: 104, runSpeed: 2.5, airSpeed: 2.05, jumpForce: 5.5, doubleJumpForce: 5.0,
      maxJumps: 3, gravity: 0.27, fallSpeed: 4.8, fastFallSpeed: 6.9, traction: 0.23,
    },
    moveset: {
      jab: {
        name: 'Rifle Butt', startup: 4, active: 5, endlag: 7,
        hitbox: { offsetX: 14, offsetY: -12, width: 16, height: 12 },
        damage: 6, baseKnockback: 2.4, knockbackGrowth: 38, launchAngleDeg: 36, hitstop: 4,
      },
      smash: {
        name: 'Heavy Cannon', startup: 10, active: 6, endlag: 15,
        hitbox: { offsetX: 16, offsetY: -12, width: 24, height: 16 },
        damage: 19, baseKnockback: 4.8, knockbackGrowth: 94, launchAngleDeg: 34, hitstop: 9,
      },
      aerial: {
        name: 'Somersault Kick', startup: 5, active: 6, endlag: 9,
        hitbox: { offsetX: 10, offsetY: -10, width: 18, height: 14 },
        damage: 11, baseKnockback: 3.1, knockbackGrowth: 64, launchAngleDeg: 34, hitstop: 6,
      },
      neutralSpecial: {
        name: 'Spread Shot', startup: 7, active: 4, endlag: 11,
        hitbox: { offsetX: 14, offsetY: -12, width: 12, height: 10 },
        damage: 8, baseKnockback: 2.4, knockbackGrowth: 42, launchAngleDeg: 34, hitstop: 4,
        projectile: {
          speedX: 5.8, speedY: 0, gravity: 0, radius: 4, lifetime: 54, colorIndex: 13, glowIndex: 14,
        },
      },
      upSpecial: {
        name: 'Commando Flip', startup: 4, active: 14, endlag: 16,
        hitbox: { offsetX: 2, offsetY: -18, width: 18, height: 22 },
        damage: 12, baseKnockback: 4.2, knockbackGrowth: 74, launchAngleDeg: 78, hitstop: 6,
        velocityBoostX: 1.7, velocityBoostY: -7.1,
      },
    },
  },
  {
    id: 'arthur',
    name: 'Arthur',
    nickname: 'Silver Knight',
    era: 'NES',
    originTag: "Ghosts 'n Goblins",
    archetype: 'sword-hero',
    archetypeLabel: 'Silver Knight',
    gridSize: 24,
    palettes: ARTHUR_PALETTES,
    pixelChart: ARTHUR_SNES,
    eraPacks: {
      NES: { pixelChart: buildNesDemakeChart(ARTHUR_SNES), palettes: buildNesPalettes(ARTHUR_PALETTES) },
      SNES_SEGA: { pixelChart: ARTHUR_SNES, palettes: ARTHUR_PALETTES },
    },
    stats: {
      weight: 98, runSpeed: 2.35, airSpeed: 2.0, jumpForce: 5.4, doubleJumpForce: 4.9,
      maxJumps: 3, gravity: 0.28, fallSpeed: 4.9, fastFallSpeed: 7.0, traction: 0.23,
    },
    moveset: {
      jab: {
        name: 'Lance Thrust', startup: 4, active: 5, endlag: 8,
        hitbox: { offsetX: 16, offsetY: -12, width: 20, height: 12 },
        damage: 7, baseKnockback: 2.4, knockbackGrowth: 38, launchAngleDeg: 36, hitstop: 4,
      },
      smash: {
        name: 'Goddess Cleave', startup: 10, active: 7, endlag: 15,
        hitbox: { offsetX: 18, offsetY: -12, width: 24, height: 16 },
        damage: 18, baseKnockback: 4.7, knockbackGrowth: 94, launchAngleDeg: 35, hitstop: 8,
      },
      aerial: {
        name: 'Armor Drop', startup: 5, active: 6, endlag: 9,
        hitbox: { offsetX: 12, offsetY: -10, width: 18, height: 14 },
        damage: 12, baseKnockback: 3.2, knockbackGrowth: 66, launchAngleDeg: 32, hitstop: 6,
      },
      neutralSpecial: {
        name: 'Lance Throw', startup: 8, active: 4, endlag: 12,
        hitbox: { offsetX: 14, offsetY: -12, width: 14, height: 10 },
        damage: 9, baseKnockback: 2.7, knockbackGrowth: 46, launchAngleDeg: 36, hitstop: 5,
        projectile: {
          speedX: 5.4, speedY: 0, gravity: 0, radius: 4, lifetime: 58, colorIndex: 10, glowIndex: 13,
        },
      },
      upSpecial: {
        name: 'Knight Vault', startup: 4, active: 14, endlag: 17,
        hitbox: { offsetX: 2, offsetY: -18, width: 18, height: 22 },
        damage: 13, baseKnockback: 4.3, knockbackGrowth: 76, launchAngleDeg: 78, hitstop: 6,
        velocityBoostX: 1.5, velocityBoostY: -7.0,
      },
    },
  },
];
