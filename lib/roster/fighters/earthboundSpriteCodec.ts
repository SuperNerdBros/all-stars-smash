import type { AnimState, IndexedFrame, PixelChart } from '../../types/palette';
import { buildNesDemakeChart } from '../rpgSpriteBuilder';

export const EARTHBOUND_GRID_SIZE = 24;

export const EARTHBOUND_TICKS: Record<AnimState, number> = {
  idle: 24,
  walk: 9,
  jump: 14,
  attack: 6,
  smash: 7,
  special: 8,
  hurt: 14,
};

export interface PixelStamp {
  readonly x: number;
  readonly y: number;
  readonly color: number;
}

const CHAR_TO_INDEX: Record<string, number> = {
  '.': 0,
  '1': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  a: 10,
  b: 11,
  c: 12,
  d: 13,
  e: 14,
  f: 15,
};

/** Decodes a compact 24x24 hex-indexed EarthBound sprite frame. */
export function decodeEarthboundFrame(rows: readonly string[]): IndexedFrame {
  return rows.map((row) => {
    const out: number[] = [];
    for (let i = 0; i < row.length; i++) {
      out.push(CHAR_TO_INDEX[row[i]] ?? 0);
    }
    return out;
  });
}

/**
 * Stamps weapon/PSI pixels ONLY onto empty transparent cells so the 1:1 SNES
 * character pixels remain completely untouched.
 */
export function overlayEarthboundFx(
  base: IndexedFrame,
  stamps: readonly PixelStamp[],
): IndexedFrame {
  const copy = base.map((row) => [...row]);
  const height = copy.length;
  const width = copy[0]?.length ?? 0;
  for (const s of stamps) {
    const outOfBounds = s.y < 0 || s.y >= height || s.x < 0 || s.x >= width;
    if (outOfBounds) continue;
    const isTransparent = copy[s.y][s.x] === 0;
    if (isTransparent) {
      copy[s.y][s.x] = s.color;
    }
  }
  return copy;
}

/** Shifts a 24x24 frame horizontally without mutating the source frame. */
export function shiftEarthboundFrame(base: IndexedFrame, dx: number, dy = 0): IndexedFrame {
  const h = base.length;
  const w = base[0]?.length ?? 0;
  const out: IndexedFrame = Array.from({ length: h }, () => new Array<number>(w).fill(0));
  for (let y = 0; y < h; y++) {
    const ty = y + dy;
    const rowOutOfBounds = ty < 0 || ty >= h;
    if (rowOutOfBounds) continue;
    for (let x = 0; x < w; x++) {
      const tx = x + dx;
      const colOutOfBounds = tx < 0 || tx >= w;
      if (colOutOfBounds) continue;
      out[ty][tx] = base[y][x];
    }
  }
  return out;
}

export function buildEarthboundDualEra(
  snesFrames: Record<AnimState, IndexedFrame[]>,
): { snesChart: PixelChart; nesChart: PixelChart } {
  const snesChart = {} as PixelChart;
  const states: AnimState[] = ['idle', 'walk', 'jump', 'attack', 'smash', 'special', 'hurt'];

  for (const state of states) {
    snesChart[state] = {
      frames: snesFrames[state],
      ticksPerFrame: EARTHBOUND_TICKS[state],
    };
  }

  return {
    snesChart,
    nesChart: buildNesDemakeChart(snesChart),
  };
}
