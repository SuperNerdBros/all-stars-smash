import type { AnimClip, AnimState, IndexedFrame, PixelChart } from '../types/palette';

const HEX_CHARS = '0123456789abcdef';

/**
 * Parses compact 16-char or 24-char ASCII rows into a strict 2D palette-index matrix.
 * '.' or '0' maps to 0 (transparent); '1'-'9' and 'a'-'f' map to 1-15.
 */
export function parseFrame(rows: readonly string[], expectedSize = 16): IndexedFrame {
  const frame: IndexedFrame = [];
  for (let y = 0; y < expectedSize; y++) {
    const raw = rows[y] ?? '';
    const line: number[] = new Array<number>(expectedSize);
    for (let x = 0; x < expectedSize; x++) {
      const ch = (raw[x] ?? '.').toLowerCase();
      if (ch === '.' || ch === ' ') {
        line[x] = 0;
      } else {
        const idx = HEX_CHARS.indexOf(ch);
        line[x] = idx >= 0 ? idx : 0;
      }
    }
    frame.push(line);
  }
  return frame;
}

export function cloneFrame(frame: IndexedFrame): IndexedFrame {
  return frame.map((row) => [...row]);
}

export function createEmptyFrame(size: number): IndexedFrame {
  return Array.from({ length: size }, () => new Array<number>(size).fill(0));
}

export function shiftFrame(frame: IndexedFrame, dx: number, dy: number): IndexedFrame {
  const h = frame.length;
  const w = frame[0]?.length ?? h;
  const out = createEmptyFrame(h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const sx = x - dx;
      const sy = y - dy;
      if (sy >= 0 && sy < h && sx >= 0 && sx < w) {
        out[y][x] = frame[sy][sx];
      }
    }
  }
  return out;
}

export function flipFrameX(frame: IndexedFrame): IndexedFrame {
  return frame.map((row) => [...row].reverse());
}

export function overlayPixels(
  base: IndexedFrame,
  edits: ReadonlyArray<readonly [number, number, number]>,
): IndexedFrame {
  const out = cloneFrame(base);
  const h = out.length;
  const w = out[0]?.length ?? h;
  for (const [x, y, idx] of edits) {
    if (y >= 0 && y < h && x >= 0 && x < w) {
      out[y][x] = idx;
    }
  }
  return out;
}

export function makeClip(frames: IndexedFrame[], ticksPerFrame: number): AnimClip {
  return {
    frames: frames.length > 0 ? frames : [createEmptyFrame(16)],
    ticksPerFrame: Math.max(2, Math.round(ticksPerFrame)),
  };
}

export function clonePixelChart(chart: PixelChart): PixelChart {
  const copy = {} as PixelChart;
  (Object.keys(chart) as AnimState[]).forEach((state) => {
    const clip = chart[state];
    copy[state] = {
      ticksPerFrame: clip.ticksPerFrame,
      frames: clip.frames.map((f) => cloneFrame(f)),
    };
  });
  return copy;
}
