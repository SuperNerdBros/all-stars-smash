import type { AnimState, IndexedFrame, PixelChart } from '../types/palette';
import { makeClip } from './chartParser';

export interface ShadePair {
  readonly base: number;
  readonly shadow: number;
}

export interface SpriteDimensions {
  readonly width: number;
  readonly height: number;
}

export class PixelSpriteCanvas {
  readonly width: number;
  readonly height: number;
  private readonly grid: number[][];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.grid = Array.from({ length: height }, () => new Array<number>(width).fill(0));
  }

  plot(x: number, y: number, color: number): void {
    const px = Math.round(x);
    const py = Math.round(y);
    const insideBounds = px >= 0 && py >= 0 && px < this.width && py < this.height;
    if (insideBounds) {
      this.grid[py][px] = color;
    }
  }

  sample(x: number, y: number): number {
    const px = Math.round(x);
    const py = Math.round(y);
    const insideBounds = px >= 0 && py >= 0 && px < this.width && py < this.height;
    return insideBounds ? this.grid[py][px] : 0;
  }

  fillRect(x: number, y: number, w: number, h: number, color: number): void {
    const left = Math.round(x);
    const top = Math.round(y);
    const right = Math.round(x + w - 1);
    const bottom = Math.round(y + h - 1);
    for (let py = top; py <= bottom; py++) {
      for (let px = left; px <= right; px++) {
        this.plot(px, py, color);
      }
    }
  }

  fillRoundedRect(x: number, y: number, w: number, h: number, color: number): void {
    const left = Math.round(x);
    const top = Math.round(y);
    const right = Math.round(x + w - 1);
    const bottom = Math.round(y + h - 1);
    for (let py = top; py <= bottom; py++) {
      for (let px = left; px <= right; px++) {
        const isCorner = (px === left || px === right) && (py === top || py === bottom);
        if (!isCorner) {
          this.plot(px, py, color);
        }
      }
    }
  }

  fillEllipse(cx: number, cy: number, rx: number, ry: number, color: number): void {
    if (rx <= 0 || ry <= 0) return;
    const minX = Math.floor(cx - rx - 0.5);
    const maxX = Math.ceil(cx + rx + 0.5);
    const minY = Math.floor(cy - ry - 0.5);
    const maxY = Math.ceil(cy + ry + 0.5);
    for (let py = minY; py <= maxY; py++) {
      for (let px = minX; px <= maxX; px++) {
        const nx = (px - cx) / rx;
        const ny = (py - cy) / ry;
        const insideEllipse = nx * nx + ny * ny <= 1.04;
        if (insideEllipse) {
          this.plot(px, py, color);
        }
      }
    }
  }

  fillTriangle(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    color: number,
  ): void {
    const minX = Math.floor(Math.min(x1, x2, x3));
    const maxX = Math.ceil(Math.max(x1, x2, x3));
    const minY = Math.floor(Math.min(y1, y2, y3));
    const maxY = Math.ceil(Math.max(y1, y2, y3));
    const area = (x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1);
    if (Math.abs(area) < 0.001) return;

    for (let py = minY; py <= maxY; py++) {
      for (let px = minX; px <= maxX; px++) {
        const sx = px + 0.25;
        const sy = py + 0.25;
        const w1 = ((x2 - sx) * (y3 - sy) - (y2 - sy) * (x3 - sx)) / area;
        const w2 = ((x3 - sx) * (y1 - sy) - (y3 - sy) * (x1 - sx)) / area;
        const w3 = 1 - w1 - w2;
        const insideTriangle = w1 >= -0.05 && w2 >= -0.05 && w3 >= -0.05;
        if (insideTriangle) {
          this.plot(px, py, color);
        }
      }
    }
  }

  drawLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: number,
    radius = 0,
  ): void {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) * 2));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const cx = x1 + dx * t;
      const cy = y1 + dy * t;
      if (radius <= 0) {
        this.plot(cx, cy, color);
      } else {
        this.fillEllipse(cx, cy, radius, radius, color);
      }
    }
  }

  drawArc(
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    startDeg: number,
    endDeg: number,
    color: number,
    radius = 0,
  ): void {
    const steps = Math.max(8, Math.ceil(Math.abs(endDeg - startDeg) / 5));
    for (let i = 0; i <= steps; i++) {
      const deg = startDeg + ((endDeg - startDeg) * i) / steps;
      const rad = (deg * Math.PI) / 180;
      const px = cx + Math.cos(rad) * rx;
      const py = cy + Math.sin(rad) * ry;
      if (radius <= 0) {
        this.plot(px, py, color);
      } else {
        this.fillEllipse(px, py, radius, radius, color);
      }
    }
  }

  applyCelShading(pairs: readonly ShadePair[]): void {
    const lookup = new Map<number, number>();
    for (const pair of pairs) {
      lookup.set(pair.base, pair.shadow);
    }
    const source = this.grid.map((row) => [...row]);

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const current = source[y][x];
        const shadow = lookup.get(current);
        if (shadow === undefined) continue;

        const below = y + 1 < this.height ? source[y + 1][x] : 0;
        const left = x - 1 >= 0 ? source[y][x - 1] : 0;
        const onLowerEdge = below === 0 || below === 1;
        const onBackEdge = left === 0 || left === 1;
        if (onLowerEdge || onBackEdge) {
          this.grid[y][x] = shadow;
        }
      }
    }
  }

  applyAutoOutline(outlineColor = 1, skipColors: readonly number[] = []): void {
    const skipped = new Set<number>(skipColors);
    const source = this.grid.map((row) => [...row]);

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (source[y][x] !== 0) continue;
        const neighbors = [
          y > 0 ? source[y - 1][x] : 0,
          y + 1 < this.height ? source[y + 1][x] : 0,
          x > 0 ? source[y][x - 1] : 0,
          x + 1 < this.width ? source[y][x + 1] : 0,
        ];
        const touchesBody = neighbors.some((val) => val !== 0 && val !== outlineColor && !skipped.has(val));
        if (touchesBody) {
          this.grid[y][x] = outlineColor;
        }
      }
    }
  }

  toFrame(): IndexedFrame {
    return this.grid.map((row) => [...row]);
  }
}

export function downsampleFrameTo8Bit(
  source: IndexedFrame,
  targetWidth: number,
  targetHeight: number,
): IndexedFrame {
  const sourceHeight = source.length;
  const sourceWidth = source[0]?.length ?? sourceHeight;
  const output: IndexedFrame = [];

  for (let ty = 0; ty < targetHeight; ty++) {
    const row = new Array<number>(targetWidth).fill(0);
    const y0 = Math.floor((ty * sourceHeight) / targetHeight);
    const y1 = Math.max(y0 + 1, Math.floor(((ty + 1) * sourceHeight) / targetHeight));

    for (let tx = 0; tx < targetWidth; tx++) {
      const x0 = Math.floor((tx * sourceWidth) / targetWidth);
      const x1 = Math.max(x0 + 1, Math.floor(((tx + 1) * sourceWidth) / targetWidth));

      let picked = 0;
      let hasOutline = false;
      for (let sy = y0; sy < y1; sy++) {
        for (let sx = x0; sx < x1; sx++) {
          const val = source[sy]?.[sx] ?? 0;
          if (val === 0) continue;
          if (val === 1) {
            hasOutline = true;
          } else {
            picked = val;
          }
        }
      }
      if (picked !== 0) {
        row[tx] = picked;
      } else if (hasOutline) {
        row[tx] = 1;
      }
    }
    output.push(row);
  }
  return output;
}

export function buildDualEraSpriteCharts<TPose>(
  posesByState: Record<AnimState, readonly TPose[]>,
  ticksByState: Record<AnimState, number>,
  render16BitFrame: (pose: TPose) => IndexedFrame,
  nesDimensions: SpriteDimensions,
): { snesChart: PixelChart; nesChart: PixelChart } {
  const states: AnimState[] = ['idle', 'walk', 'jump', 'attack', 'smash', 'special', 'hurt'];
  const snesEntries = {} as PixelChart;
  const nesEntries = {} as PixelChart;

  for (const state of states) {
    const snesFrames = posesByState[state].map((pose) => render16BitFrame(pose));
    const nesFrames = snesFrames.map((frame) =>
      downsampleFrameTo8Bit(frame, nesDimensions.width, nesDimensions.height),
    );
    const ticks = ticksByState[state];
    snesEntries[state] = makeClip(snesFrames, ticks);
    nesEntries[state] = makeClip(nesFrames, ticks);
  }

  return { snesChart: snesEntries, nesChart: nesEntries };
}
