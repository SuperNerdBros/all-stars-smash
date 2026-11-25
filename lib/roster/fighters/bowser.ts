import type { FighterBlueprint } from '../../types/fighter';
import type { IndexedFrame, PalettePreset, PixelChart } from '../../types/palette';
import { makeClip, parseFrame } from '../chartParser';

// ── AUTHENTIC 1985 SUPER MARIO BROS. BOWSER (32x32 PIXEL-EXACT NES SPRITE CHART) ──
// Facing right (mirrored cleanly from the original left-facing SMB1 sprite sheet).
// Palette indices: 1 black (eye/cuff) · 2 tan/gold · 3 Bowser green · a white spikes/horns/fangs.

const SMB_OPEN_A = parseFrame([
  '.................aaa............',
  '..................2aaa33........',
  '..................22aa333.......',
  '..................3223333aa.....',
  '..................3333333aa3..2.',
  '.................33333333aa33212',
  '.................333332333aaa222',
  '.................3333222333a2222',
  '...........a333aa333323a2233222a',
  '.........32aa33aa333323332222.a.',
  '.....aaa322aaa3aa33332a33a3aa.a.',
  '.....2aa3322a33aaa333223...a....',
  '...a322333333333aaa3322a........',
  '...a3333333333333aaa3322........',
  '...33333aaa333333aaa33222a......',
  '..aaa3332aa33aaaaaa33..22.......',
  '..2aa3332233aa22233.............',
  '..223333333aa2221a..222.........',
  '.a333333333a322a12221a22........',
  'a2333aaa333a331122221122........',
  '..3332aa33aa33a2222221a2........',
  '.aa3322333aa333322222112........',
  'aaa3333333aa3333222221a.........',
  '.223aa3333a33333.222a1..........',
  '.32332333aa33333................',
  '.333333aaa33333.................',
  '.3333aaaa33333..................',
  'aaaaaaa3333332..................',
  'aaaaa22223322aa.................',
  '.aa2222222222aaa................',
  '..2222aa22aa....................',
  '.22222aaa2aaa...................',
]);

const SMB_CLOSED_A = parseFrame([
  '.................aaa............',
  '..................2aaa33........',
  '..................22aa333.......',
  '..................3223333aa.....',
  '..................3333333aa3..2.',
  '.................33333333aa33212',
  '.................333332333aaa222',
  '.................3333222333a2222',
  '...........a333aa333323a223322aa',
  '.........32aa33aa333322332222.a.',
  '.....aaa322aaa3aa33333223.3.a.a.',
  '.....2aa3322a33aaa3333222222222.',
  '...a322333333333aaa33332222222..',
  '...a3333333333333aaa33333333....',
  '...33333aaa333333aaa33333.......',
  '..aaa3332aa33aaaaaa33...........',
  '..2aa3332233aa22233.............',
  '..223333333aa2221a..222.........',
  '.a333333333a322a12221a22........',
  'a2333aaa333a331122221122........',
  '..3332aa33aa33a2222221a2........',
  '.aa3322333aa333322222112........',
  'aaa3333333aa3333222221a.........',
  '.223aa3333a33333.222a1..........',
  '.32332333aa33333................',
  '.333333aaa33333.................',
  '.3333aaaa33333..................',
  'aaaaaaa3333332..................',
  'aaaaa22223322aa.................',
  '.aa2222222222aaa................',
  '..2222aa22aa....................',
  '.22222aaa2aaa...................',
]);

const SMB_OPEN_B = parseFrame([
  '.................aaa............',
  '..................2aaa33........',
  '..................22aa333.......',
  '..................3223333aa.....',
  '..................3333333aa3..2.',
  '.................33333333aa33212',
  '.................333332333aaa222',
  '.................3333222333a2222',
  '...........a333aa333323a2233222a',
  '.........32aa33aa333323332222.a.',
  '.....aaa322aaa3aa33332a33a3aa.a.',
  '.....2aa3322a33aaa333223...a....',
  '...a322333333333aaa3322a........',
  '...a3333333333333aaa3322........',
  '...33333aaa333333aaa33222a......',
  '..aaa3332aa33aaaaaa33..22.......',
  '..2aa3332233aa22233.............',
  '..223333333aa2221a..222.........',
  '.a333333333a322a12221a22........',
  'a2333aaa333a331122221122........',
  '..3332aa33aa33a2222221a2........',
  '.aa3322333aa333322222112........',
  'aaa3333333aa3333222221a.........',
  '.223aa3333a33333.222a1..........',
  '.32332333aa33333................',
  '.3333333aa33333.................',
  '.3333aaaa33333..................',
  'aaaaaaa333333...................',
  'aaaaa22223322...................',
  '.aa2aa22aa2222..................',
  '2222aaa2aaa22aa.................',
  '......2222222aaa................',
]);

const SMB_CLOSED_B = parseFrame([
  '.................aaa............',
  '..................2aaa33........',
  '..................22aa333.......',
  '..................3223333aa.....',
  '..................3333333aa3..2.',
  '.................33333333aa33212',
  '.................333332333aaa222',
  '.................3333222333a2222',
  '...........a333aa333323a223322aa',
  '.........32aa33aa333322332222.a.',
  '.....aaa322aaa3aa33333223.3.a.a.',
  '.....2aa3322a33aaa3333222222222.',
  '...a322333333333aaa33332222222..',
  '...a3333333333333aaa33333333....',
  '...33333aaa333333aaa33333.......',
  '..aaa3332aa33aaaaaa33...........',
  '..2aa3332233aa22233.............',
  '..223333333aa2221a..222.........',
  '.a333333333a322a12221a22........',
  'a2333aaa333a331122221122........',
  '..3332aa33aa33a2222221a2........',
  '.aa3322333aa333322222112........',
  'aaa3333333aa3333222221a.........',
  '.223aa3333a33333.222a1..........',
  '.32332333aa33333................',
  '.3333333aa33333.................',
  '.3333aaaa33333..................',
  'aaaaaaa333333...................',
  'aaaaa22223322...................',
  '.aa2aa22aa2222..................',
  '2222aaa2aaa22aa.................',
  '......2222222aaa................',
]);

function clone32(src: IndexedFrame): IndexedFrame {
  return src.map((row) => [...row]);
}

function shift32(src: IndexedFrame, dx: number, dy: number): IndexedFrame {
  const h = src.length;
  const w = src[0].length;
  const out: IndexedFrame = Array.from({ length: h }, () => new Array<number>(w).fill(0));
  for (let y = 0; y < h; y++) {
    const sy = y - dy;
    if (sy < 0 || sy >= h) continue;
    for (let x = 0; x < w; x++) {
      const sx = x - dx;
      if (sx < 0 || sx >= w) continue;
      out[y][x] = src[sy][sx];
    }
  }
  return out;
}

function paintPixels(frame: IndexedFrame, pts: ReadonlyArray<[number, number, number]>): void {
  const h = frame.length;
  const w = frame[0].length;
  for (const [x, y, val] of pts) {
    if (y >= 0 && y < h && x >= 0 && x < w) {
      frame[y][x] = val;
    }
  }
}

function makeJumpFrame(base: IndexedFrame): IndexedFrame {
  return shift32(base, 0, -2);
}

function makeClawAttackFrame(base: IndexedFrame): IndexedFrame {
  const out = shift32(base, 1, 0);
  // Extended claw slash arc in front of Bowser's spiked fist
  paintPixels(out, [
    [25, 16, 10], [26, 16, 15], [27, 17, 15], [28, 17, 10],
    [24, 18, 2], [25, 18, 2], [26, 18, 10], [27, 18, 15], [28, 18, 15], [29, 19, 10],
    [24, 19, 2], [25, 19, 2], [26, 19, 15], [27, 19, 15], [28, 20, 10], [29, 20, 15],
    [24, 20, 2], [25, 20, 10], [26, 21, 15], [27, 21, 15], [28, 21, 10],
    [25, 22, 10], [26, 22, 15], [27, 22, 10],
  ]);
  return out;
}

function makeFireBreathFrame(base: IndexedFrame): IndexedFrame {
  const out = clone32(base);
  // Classic SMB1 horizontal orange/gold/white flame burst exiting Bowser's roaring jaws
  paintPixels(out, [
    [25, 11, 13], [26, 11, 13], [27, 11, 14], [28, 11, 13],
    [24, 12, 13], [25, 12, 14], [26, 12, 15], [27, 12, 15], [28, 12, 14], [29, 12, 13], [30, 12, 13],
    [24, 13, 14], [25, 13, 15], [26, 13, 15], [27, 13, 14], [28, 13, 14], [29, 13, 13], [30, 13, 14], [31, 13, 13],
    [25, 14, 13], [26, 14, 14], [27, 14, 13], [28, 14, 13], [29, 14, 13],
  ]);
  return out;
}

function makeHurtFrame(base: IndexedFrame): IndexedFrame {
  const out = shift32(base, -1, -1);
  paintPixels(out, [
    [28, 4, 15], [29, 4, 15], [28, 5, 15],
  ]);
  return out;
}

const NES_JUMP_A = makeJumpFrame(SMB_OPEN_B);
const NES_JUMP_B = makeJumpFrame(SMB_CLOSED_A);
const NES_ATTACK_A = makeClawAttackFrame(SMB_OPEN_B);
const NES_SMASH_A = makeClawAttackFrame(SMB_OPEN_A);
const NES_SPECIAL_FIRE = makeFireBreathFrame(SMB_OPEN_A);
const NES_HURT_A = makeHurtFrame(SMB_OPEN_A);

const NES_CHART: PixelChart = {
  idle: makeClip([SMB_CLOSED_A, SMB_OPEN_A], 22),
  walk: makeClip([SMB_CLOSED_A, SMB_CLOSED_B, SMB_OPEN_A, SMB_OPEN_B], 8),
  jump: makeClip([NES_JUMP_A, NES_JUMP_B], 9),
  attack: makeClip([SMB_OPEN_A, NES_ATTACK_A], 5),
  smash: makeClip([SMB_CLOSED_B, NES_SMASH_A], 8),
  special: makeClip([SMB_OPEN_A, NES_SPECIAL_FIRE], 6),
  hurt: makeClip([NES_HURT_A], 10),
};

const NES_PALETTES: PalettePreset[] = [
  {
    name: 'SMB1 King Koopa NES',
    colors: [
      '', '#000000', '#FFA542', '#00AD00', '#006800', '#00AD00', '#004800',
      '#F8D800', '#E75A10', '#006800', '#FFFFFF', '#BCBCBC', '#006800',
      '#E75A10', '#FFA542', '#FFFFFF',
    ],
  },
  {
    name: 'SMB3 Red Mane Bowser',
    colors: [
      '', '#000000', '#F8D878', '#00A800', '#006800', '#D82800', '#881400',
      '#F8D800', '#D82800', '#006800', '#FFFFFF', '#BCBCBC', '#D82800',
      '#F85800', '#F8D878', '#FFFFFF',
    ],
  },
  {
    name: 'Dry Bowser NES',
    colors: [
      '', '#000000', '#FCFCFC', '#7C7C7C', '#383838', '#484848', '#202020',
      '#F83800', '#D82800', '#383838', '#FFFFFF', '#BCBCBC', '#383838',
      '#3CBCFC', '#FFFFFF', '#FFFFFF',
    ],
  },
  {
    name: 'Dark Koopa NES',
    colors: [
      '', '#000000', '#F8B878', '#2C3258', '#141830', '#8828D8', '#481080',
      '#F8D800', '#D82800', '#141830', '#FFFFFF', '#98A8C8', '#141830',
      '#C084FC', '#FFFFFF', '#FFFFFF',
    ],
  },
];

// ── 16-BIT SUPER MARIO ALL-STARS / SMW ENHANCEMENT (SAME 32x32 SILHOUETTE + SHADING + RED MANE) ──

function isBodyPixel(val: number): boolean {
  return val > 0 && val < 13;
}

function hasNeighbor(src: IndexedFrame, x: number, y: number): boolean {
  const h = src.length;
  const w = src[0].length;
  const up = y > 0 && isBodyPixel(src[y - 1][x]);
  const down = y + 1 < h && isBodyPixel(src[y + 1][x]);
  const left = x > 0 && isBodyPixel(src[y][x - 1]);
  const right = x + 1 < w && isBodyPixel(src[y][x + 1]);
  return up || down || left || right;
}

function enhanceBowserTo16Bit(src: IndexedFrame): IndexedFrame {
  const h = src.length;
  const w = src[0].length;
  const out = clone32(src);

  // 1) Add 16-bit red hair tuft on the scalp ridge between Bowser's horn and brow
  for (let y = 1; y <= 3; y++) {
    for (let x = 21; x <= 25; x++) {
      if (out[y][x] === 3) {
        out[y][x] = y === 1 ? 8 : 12;
      }
    }
  }

  // 2) Directional cel-shading (light from upper-left -> shade lower-right rims)
  for (let y = h - 1; y >= 0; y--) {
    for (let x = w - 1; x >= 0; x--) {
      const val = out[y][x];
      const below = y + 1 < h ? src[y + 1][x] : 0;
      const right = x + 1 < w ? src[y][x + 1] : 0;
      const isEdge = below !== val || right !== val;
      if (val === 3 && isEdge) {
        out[y][x] = 4; // dark emerald shell/scale shade
      } else if (val === 2 && below !== 2) {
        out[y][x] = 7; // warm golden-amber belly/jaw shade
      } else if (val === 10 && below !== 10 && right !== 10) {
        out[y][x] = 11; // silver-white spike rim shade
      }
    }
  }

  // 3) Crisp 1px 16-bit dark outline around body pixels
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (src[y][x] === 0 && hasNeighbor(src, x, y)) {
        out[y][x] = 1;
      }
    }
  }

  return out;
}

function upgradeClip(frames: IndexedFrame[], ticksPerFrame: number) {
  return makeClip(frames.map(enhanceBowserTo16Bit), ticksPerFrame);
}

const SNES_CHART: PixelChart = {
  idle: upgradeClip([SMB_CLOSED_A, SMB_OPEN_A], 22),
  walk: upgradeClip([SMB_CLOSED_A, SMB_CLOSED_B, SMB_OPEN_A, SMB_OPEN_B], 8),
  jump: upgradeClip([NES_JUMP_A, NES_JUMP_B], 9),
  attack: upgradeClip([SMB_OPEN_A, NES_ATTACK_A], 5),
  smash: upgradeClip([SMB_CLOSED_B, NES_SMASH_A], 8),
  special: upgradeClip([SMB_OPEN_A, NES_SPECIAL_FIRE], 6),
  hurt: upgradeClip([NES_HURT_A], 10),
};

const SNES_PALETTES: PalettePreset[] = [
  {
    name: 'SMW King Bowser',
    colors: [
      '', '#121018', '#FFD068', '#18B030', '#0C6E1E', '#18B030', '#084812',
      '#E89428', '#F03818', '#0C6E1E', '#FFFFFF', '#C8D4E4', '#C82010',
      '#F85800', '#FFE040', '#FFFFFF',
    ],
  },
  {
    name: 'Giga Dark Bowser',
    colors: [
      '', '#060810', '#CBD5E1', '#384056', '#181E2E', '#384056', '#0E121E',
      '#94A3B8', '#EF4444', '#181E2E', '#F8FAFC', '#94A3B8', '#B91C1C',
      '#38BDF8', '#E0F2FE', '#FFFFFF',
    ],
  },
  {
    name: 'Molten Lava Bowser',
    colors: [
      '', '#1A0604', '#F8D888', '#D82814', '#7C1008', '#D82814', '#480404',
      '#F89818', '#FFE030', '#7C1008', '#FFF8C8', '#D8B878', '#F85800',
      '#F85800', '#FFFFFF', '#FFFFFF',
    ],
  },
  {
    name: 'Emerald Koopa King',
    colors: [
      '', '#081814', '#F8E0A0', '#0CA880', '#06604A', '#0CA880', '#04382C',
      '#E8B430', '#2563EB', '#06604A', '#FFFFFF', '#B8E0D8', '#1D4ED8',
      '#38D8FF', '#FFFFFF', '#FFFFFF',
    ],
  },
];

export const BOWSER_BLUEPRINT: FighterBlueprint = {
  id: 'bowser',
  name: 'Bowser',
  nickname: 'Turtle',
  era: 'NES',
  originTag: 'Super Mario Bros.',
  archetype: 'heavy-grappler',
  archetypeLabel: 'Spiked Titan',
  gridSize: 32,
  palettes: NES_PALETTES,
  pixelChart: NES_CHART,
  eraPacks: {
    NES: { pixelChart: NES_CHART, palettes: NES_PALETTES },
    SNES_SEGA: { pixelChart: SNES_CHART, palettes: SNES_PALETTES },
  },
  stats: {
    weight: 130,
    runSpeed: 2.05,
    airSpeed: 1.65,
    jumpForce: 5.2,
    doubleJumpForce: 4.8,
    maxJumps: 3,
    gravity: 0.29,
    fallSpeed: 5.0,
    fastFallSpeed: 7.0,
    traction: 0.24,
  },
  moveset: {
    jab: {
      name: 'Koopa Claw',
      startup: 5,
      active: 5,
      endlag: 10,
      hitbox: { offsetX: 14, offsetY: -11, width: 18, height: 14 },
      damage: 9,
      baseKnockback: 3.0,
      knockbackGrowth: 44,
      launchAngleDeg: 34,
      hitstop: 6,
    },
    smash: {
      name: 'Koopa Dropkick',
      startup: 14,
      active: 6,
      endlag: 20,
      hitbox: { offsetX: 16, offsetY: -12, width: 22, height: 18 },
      damage: 22,
      baseKnockback: 5.6,
      knockbackGrowth: 104,
      launchAngleDeg: 32,
      hitstop: 12,
    },
    aerial: {
      name: 'Spiked Shell',
      startup: 6,
      active: 9,
      endlag: 11,
      hitbox: { offsetX: 2, offsetY: -10, width: 22, height: 18 },
      damage: 14,
      baseKnockback: 3.7,
      knockbackGrowth: 72,
      launchAngleDeg: 40,
      hitstop: 7,
    },
    neutralSpecial: {
      name: 'Fire Breath',
      startup: 8,
      active: 5,
      endlag: 15,
      hitbox: { offsetX: 14, offsetY: -11, width: 12, height: 12 },
      damage: 10,
      baseKnockback: 2.9,
      knockbackGrowth: 46,
      launchAngleDeg: 35,
      hitstop: 5,
      projectile: {
        speedX: 3.9,
        speedY: 0,
        gravity: 0,
        radius: 6,
        lifetime: 58,
        colorIndex: 13,
        glowIndex: 14,
      },
    },
    upSpecial: {
      name: 'Whirling Fortress',
      startup: 4,
      active: 16,
      endlag: 18,
      hitbox: { offsetX: 0, offsetY: -12, width: 28, height: 16 },
      damage: 14,
      baseKnockback: 4.1,
      knockbackGrowth: 74,
      launchAngleDeg: 62,
      hitstop: 7,
      velocityBoostX: 2.3,
      velocityBoostY: -6.3,
    },
  },
};
