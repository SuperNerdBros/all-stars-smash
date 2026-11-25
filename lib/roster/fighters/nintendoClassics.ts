import type { FighterBlueprint } from '../../types/fighter';
import type { PalettePreset } from '../../types/palette';
import {
  buildNesDemakeChart,
  buildNesPalettes,
  buildSnesRpgChart,
} from '../rpgSpriteBuilder';
import { NESS_EARTHBOUND_PALETTES, NESS_UPGRADED_CHART } from './earthboundCast';

// 7. PIKACHU (24x24 SNES High-Res Sprite + 16x16 NES Pack)
const PIKACHU_SNES = buildSnesRpgChart({
  fxStyle: 'orb',
  snesIdle: [
    '........................',
    '....11............11....',
    '...1111..........1111...',
    '...11131........13111...',
    '....1333111111113331....',
    '....1333333333333331....',
    '...133333333333333331...',
    '...1331a333113331a331...',
    '...133113333333311331...',
    '...138833333333338831...',
    '....1883333333333881....',
    '.....11333333333311.....',
    '....133333333333331..11.',
    '...1333433333333431.1331',
    '...133333333333333113331',
    '...11333333333333319931.',
    '....133333333333331911..',
    '....1333333333333311....',
    '.....1333311133331......',
    '.....13331...13331......',
    '....133331...133331.....',
    '....111111...111111.....',
    '........................',
    '........................',
  ],
  snesAttack: [
    '........................',
    '.....11............11...',
    '....1111..........1111..',
    '....11131........13111..',
    '.....1333111111113331...',
    '.....1333333333333331...',
    '....133333333333333331..',
    '....1331a333113331a331..',
    '....133113333333311331..',
    '....138833333333338831..',
    '.....1883333333333881...',
    '......11333333333311....',
    '....133333333333333111..',
    '...1333433333333433ddd1.',
    '...1333333333333331ddd1.',
    '...1133333333333311111..',
    '....1333333333331.......',
    '....1333311133331.......',
    '...133331...133331......',
    '...111111...111111......',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
});

const PIKACHU_PALETTES: PalettePreset[] = [
  {
    name: 'Kanto Electric',
    colors: [
      '', '#09090B', '#FEF08A', '#FACC15', '#CA8A04', '#EAB308', '#A16207',
      '#FDE047', '#EF4444', '#78350F', '#FFFFFF', '#94A3B8', '#EA580C',
      '#38BDF8', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Shiny Gold',
    colors: [
      '', '#140C04', '#FEF08A', '#F59E0B', '#B45309', '#FBBF24', '#92400E',
      '#FDE047', '#DC2626', '#78350F', '#FFFFFF', '#94A3B8', '#EA580C',
      '#FACC15', '#FFFFFF', '#FFFFFF',
    ],
  },
  {
    name: 'Raichu Orange',
    colors: [
      '', '#140804', '#FEF3C7', '#EA580C', '#9A3412', '#F97316', '#7C2D12',
      '#FACC15', '#EF4444', '#451A03', '#FFFFFF', '#94A3B8', '#FBBF24',
      '#38BDF8', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Pichu Pale',
    colors: [
      '', '#09090B', '#FEF9C3', '#FEF08A', '#EAB308', '#FDE047', '#CA8A04',
      '#FACC15', '#F472B6', '#52525B', '#FFFFFF', '#94A3B8', '#F472B6',
      '#67E8F9', '#FFFFFF', '#FFFFFF',
    ],
  },
];

// 8. CAPTAIN FALCON (24x24 SNES High-Res Sprite + 16x16 NES Pack)
const CAPTAIN_FALCON_SNES = buildSnesRpgChart({
  fxStyle: 'aura',
  snesIdle: [
    '........1111111.........',
    '.......133373331........',
    '......13337773331.......',
    '......13111111131.......',
    '......131bbbbb131.......',
    '.......112222211........',
    '........1222221.........',
    '.....1111777771111......',
    '....177155555551771.....',
    '...17715557775551771....',
    '..1881555555555551881...',
    '..1881556555556551881...',
    '...11.15577777551.11....',
    '......15555555551.......',
    '......17777777771.......',
    '.....155561165551.......',
    '.....15551..15551.......',
    '....15551....15551......',
    '....18881....18881......',
    '...188881....188881.....',
    '...111111....111111.....',
    '........................',
    '........................',
    '........................',
  ],
  snesAttack: [
    '.........1111111........',
    '........133373331.......',
    '.......13337773331......',
    '.......13111111131......',
    '.......131bbbbb131......',
    '........112222211.......',
    '.........1222221........',
    '.....1111777771111......',
    '....17715555555188111...',
    '...1881555777555188ddd1.',
    '....111555555555188ddd1.',
    '......1557777755111111..',
    '......15555555551.......',
    '.....177777777771.......',
    '.....15561..16551.......',
    '....15551....15551......',
    '...15551......15551.....',
    '...18881......18881.....',
    '..188881......188881....',
    '..111111......111111....',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
});

const CAPTAIN_FALCON_PALETTES: PalettePreset[] = [
  {
    name: 'F-Zero Blue',
    colors: [
      '', '#0A0D18', '#FFD2A6', '#DC2626', '#991B1B', '#2563EB', '#1D4ED8',
      '#FACC15', '#F97316', '#78350F', '#F8FAFC', '#1E293B', '#EF4444',
      '#F97316', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Blood Falcon',
    colors: [
      '', '#09090B', '#FFD2A6', '#18181B', '#09090B', '#DC2626', '#991B1B',
      '#FACC15', '#EF4444', '#450A0A', '#F8FAFC', '#334155', '#EF4444',
      '#EF4444', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Golden Fox',
    colors: [
      '', '#140E04', '#FFD2A6', '#16A34A', '#166534', '#FACC15', '#CA8A04',
      '#FDE047', '#EA580C', '#78350F', '#F8FAFC', '#1E293B', '#22C55E',
      '#FACC15', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'White Racer',
    colors: [
      '', '#0A0D18', '#FFD2A6', '#EC4899', '#9D174D', '#F8FAFC', '#CBD5E1',
      '#FACC15', '#EC4899', '#475569', '#FFFFFF', '#334155', '#F472B6',
      '#F472B6', '#FBCFE8', '#FFFFFF',
    ],
  },
];

const NESS_SNES = NESS_UPGRADED_CHART.snesChart;
const NESS_NES = NESS_UPGRADED_CHART.nesChart;
const NESS_PALETTES = NESS_EARTHBOUND_PALETTES;

export const NINTENDO_CLASSICS_FIGHTERS: readonly FighterBlueprint[] = [
  {
    id: 'pikachu',
    name: 'Pikachu',
    nickname: 'Volt Mouse',
    era: 'SNES',
    originTag: 'Pokemon Red/Blue',
    archetype: 'speedster',
    archetypeLabel: 'Volt Mouse',
    gridSize: 24,
    palettes: PIKACHU_PALETTES,
    pixelChart: PIKACHU_SNES,
    eraPacks: {
      NES: { pixelChart: buildNesDemakeChart(PIKACHU_SNES), palettes: buildNesPalettes(PIKACHU_PALETTES) },
      SNES_SEGA: { pixelChart: PIKACHU_SNES, palettes: PIKACHU_PALETTES },
    },
    stats: {
      weight: 79, runSpeed: 3.1, airSpeed: 2.5, jumpForce: 5.8, doubleJumpForce: 5.3,
      maxJumps: 3, gravity: 0.27, fallSpeed: 4.8, fastFallSpeed: 6.8, traction: 0.24,
    },
    moveset: {
      jab: {
        name: 'Tail Whip', startup: 3, active: 4, endlag: 6,
        hitbox: { offsetX: 13, offsetY: -10, width: 15, height: 12 },
        damage: 5, baseKnockback: 2.0, knockbackGrowth: 32, launchAngleDeg: 38, hitstop: 3,
      },
      smash: {
        name: 'Skull Bash', startup: 9, active: 7, endlag: 13,
        hitbox: { offsetX: 15, offsetY: -10, width: 20, height: 15 },
        damage: 16, baseKnockback: 4.4, knockbackGrowth: 90, launchAngleDeg: 36, hitstop: 8,
        velocityBoostX: 2.4,
      },
      aerial: {
        name: 'Volt Tackle', startup: 4, active: 6, endlag: 8,
        hitbox: { offsetX: 10, offsetY: -10, width: 18, height: 14 },
        damage: 11, baseKnockback: 3.1, knockbackGrowth: 64, launchAngleDeg: 34, hitstop: 6,
      },
      neutralSpecial: {
        name: 'Thunder Jolt', startup: 8, active: 4, endlag: 12,
        hitbox: { offsetX: 12, offsetY: -10, width: 12, height: 10 },
        damage: 7, baseKnockback: 2.3, knockbackGrowth: 38, launchAngleDeg: 40, hitstop: 4,
        projectile: {
          speedX: 4.0, speedY: 0, gravity: 0.1, radius: 5, lifetime: 65, colorIndex: 7, glowIndex: 13, bounces: true,
        },
      },
      upSpecial: {
        name: 'Quick Attack', startup: 3, active: 12, endlag: 14,
        hitbox: { offsetX: 4, offsetY: -18, width: 16, height: 20 },
        damage: 10, baseKnockback: 3.9, knockbackGrowth: 70, launchAngleDeg: 78, hitstop: 5,
        velocityBoostX: 2.2, velocityBoostY: -7.2,
      },
    },
  },
  {
    id: 'captain-falcon',
    name: 'Captain Falcon',
    nickname: 'Bounty Racer',
    era: 'SNES',
    originTag: 'F-Zero',
    archetype: 'brawler',
    archetypeLabel: 'Bounty Racer',
    gridSize: 24,
    palettes: CAPTAIN_FALCON_PALETTES,
    pixelChart: CAPTAIN_FALCON_SNES,
    eraPacks: {
      NES: { pixelChart: buildNesDemakeChart(CAPTAIN_FALCON_SNES), palettes: buildNesPalettes(CAPTAIN_FALCON_PALETTES) },
      SNES_SEGA: { pixelChart: CAPTAIN_FALCON_SNES, palettes: CAPTAIN_FALETTES_SAFE(CAPTAIN_FALCON_PALETTES) },
    },
    stats: {
      weight: 104, runSpeed: 3.15, airSpeed: 2.45, jumpForce: 5.8, doubleJumpForce: 5.2,
      maxJumps: 3, gravity: 0.29, fallSpeed: 5.2, fastFallSpeed: 7.4, traction: 0.24,
    },
    moveset: {
      jab: {
        name: 'Rapid Flurry', startup: 3, active: 5, endlag: 7,
        hitbox: { offsetX: 14, offsetY: -12, width: 16, height: 12 },
        damage: 6, baseKnockback: 2.3, knockbackGrowth: 36, launchAngleDeg: 36, hitstop: 4,
      },
      smash: {
        name: 'Falcon Punch', startup: 13, active: 7, endlag: 18,
        hitbox: { offsetX: 16, offsetY: -12, width: 22, height: 18 },
        damage: 22, baseKnockback: 5.4, knockbackGrowth: 104, launchAngleDeg: 32, hitstop: 10,
      },
      aerial: {
        name: 'Knee of Justice', startup: 5, active: 6, endlag: 10,
        hitbox: { offsetX: 14, offsetY: -10, width: 16, height: 14 },
        damage: 15, baseKnockback: 4.0, knockbackGrowth: 84, launchAngleDeg: 30, hitstop: 8,
      },
      neutralSpecial: {
        name: 'Falcon Spark', startup: 9, active: 5, endlag: 13,
        hitbox: { offsetX: 14, offsetY: -12, width: 12, height: 12 },
        damage: 9, baseKnockback: 2.9, knockbackGrowth: 48, launchAngleDeg: 38, hitstop: 5,
        projectile: {
          speedX: 4.7, speedY: 0, gravity: 0, radius: 5, lifetime: 54, colorIndex: 8, glowIndex: 14,
        },
      },
      upSpecial: {
        name: 'Falcon Dive', startup: 4, active: 14, endlag: 17,
        hitbox: { offsetX: 4, offsetY: -18, width: 18, height: 22 },
        damage: 13, baseKnockback: 4.3, knockbackGrowth: 76, launchAngleDeg: 76, hitstop: 7,
        velocityBoostX: 1.7, velocityBoostY: -7.1,
      },
    },
  },
  {
    id: 'ness',
    name: 'Ness',
    nickname: 'PSI Kid',
    era: 'SNES',
    originTag: 'EarthBound',
    archetype: 'zoner',
    archetypeLabel: 'PSI Kid',
    gridSize: 24,
    palettes: NESS_PALETTES,
    pixelChart: NESS_SNES,
    eraPacks: {
      NES: { pixelChart: NESS_NES, palettes: buildNesPalettes(NESS_PALETTES) },
      SNES_SEGA: { pixelChart: NESS_SNES, palettes: NESS_PALETTES },
    },
    stats: {
      weight: 92, runSpeed: 2.45, airSpeed: 2.2, jumpForce: 5.6, doubleJumpForce: 5.3,
      maxJumps: 3, gravity: 0.24, fallSpeed: 4.3, fastFallSpeed: 6.2, traction: 0.22,
    },
    moveset: {
      jab: {
        name: 'Yo-Yo Snap', startup: 4, active: 5, endlag: 7,
        hitbox: { offsetX: 14, offsetY: -11, width: 18, height: 12 },
        damage: 6, baseKnockback: 2.2, knockbackGrowth: 36, launchAngleDeg: 38, hitstop: 4,
      },
      smash: {
        name: 'Home Run Bat', startup: 10, active: 6, endlag: 15,
        hitbox: { offsetX: 16, offsetY: -12, width: 22, height: 16 },
        damage: 19, baseKnockback: 4.9, knockbackGrowth: 98, launchAngleDeg: 36, hitstop: 9,
      },
      aerial: {
        name: 'PSI Kick', startup: 5, active: 6, endlag: 9,
        hitbox: { offsetX: 12, offsetY: -10, width: 18, height: 14 },
        damage: 12, baseKnockback: 3.2, knockbackGrowth: 66, launchAngleDeg: 34, hitstop: 6,
      },
      neutralSpecial: {
        name: 'PK Fire', startup: 9, active: 5, endlag: 13,
        hitbox: { offsetX: 14, offsetY: -12, width: 12, height: 12 },
        damage: 9, baseKnockback: 2.7, knockbackGrowth: 46, launchAngleDeg: 42, hitstop: 5,
        projectile: {
          speedX: 4.2, speedY: 0, gravity: 0, radius: 5, lifetime: 60, colorIndex: 8, glowIndex: 14,
        },
      },
      upSpecial: {
        name: 'PK Thunder', startup: 4, active: 14, endlag: 16,
        hitbox: { offsetX: 0, offsetY: -18, width: 18, height: 22 },
        damage: 13, baseKnockback: 4.4, knockbackGrowth: 78, launchAngleDeg: 78, hitstop: 7,
        velocityBoostX: 1.8, velocityBoostY: -7.2,
      },
    },
  },
];

function CAPTAIN_FALETTES_SAFE(palettes: PalettePreset[]): PalettePreset[] {
  return palettes;
}
