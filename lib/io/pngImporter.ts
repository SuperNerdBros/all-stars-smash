import type { AnimState, IndexedFrame, PixelChart } from '../types/palette';
import { ANIM_STATES } from '../types/palette';
import type { ArchetypeId, FighterBlueprint } from '../types/fighter';
import { getArchetypeTemplate, cloneFighterBlueprint } from '../roster/registry';
import { createEmptyFrame, makeClip } from '../roster/chartParser';

export interface PngImportOptions {
  name: string;
  cols: number;
  rows: number;
  targetSize: 16 | 24;
  magentaTolerance: number;
  archetype: ArchetypeId;
  ticksPerFrame: number;
}

export interface QuantizedImportResult {
  palette: string[];
  frames: IndexedFrame[];
  pixelChart: PixelChart;
  blueprint: FighterBlueprint;
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function isMagentaKey(r: number, g: number, b: number, a: number, tolerance: number): boolean {
  if (a < 128) return true;
  const dist = Math.abs(r - 255) + Math.abs(g - 0) + Math.abs(b - 255);
  return dist <= tolerance * 3;
}

function colorDistSq(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number,
): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return dr * dr + dg * dg + db * db;
}

/**
 * Quantizes visible RGBA pixels into up to 15 distinct palette colors (indices 1..15)
 * using 5-bit bucket popularity + furthest-color diversity selection.
 */
function buildQuantizedPalette(
  samples: Array<[number, number, number]>,
): Array<[number, number, number]> {
  if (samples.length === 0) {
    return [[24, 24, 27], [253, 186, 116], [59, 130, 246]];
  }

  const buckets = new Map<number, { r: number; g: number; b: number; count: number }>();
  for (const [r, g, b] of samples) {
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    const entry = buckets.get(key);
    if (entry) {
      entry.r += r;
      entry.g += g;
      entry.b += b;
      entry.count++;
    } else {
      buckets.set(key, { r, g, b, count: 1 });
    }
  }

  const sorted = Array.from(buckets.values())
    .sort((a, b) => b.count - a.count)
    .map((b) => [Math.round(b.r / b.count), Math.round(b.g / b.count), Math.round(b.b / b.count)] as [number, number, number]);

  const chosen: Array<[number, number, number]> = [];
  // Pick top frequent colors while enforcing minimum perceptual spread so accents survive
  for (const candidate of sorted) {
    if (chosen.length >= 15) break;
    const tooClose = chosen.some(
      (c) => colorDistSq(c[0], c[1], c[2], candidate[0], candidate[1], candidate[2]) < 520,
    );
    if (!tooClose) chosen.push(candidate);
  }
  for (const candidate of sorted) {
    if (chosen.length >= 15) break;
    if (!chosen.includes(candidate)) chosen.push(candidate);
  }
  return chosen;
}

function makeAltPalette(baseHex: string[], hueShiftDeg: number, name: string): { name: string; colors: string[] } {
  const shifted = baseHex.map((hex, idx) => {
    if (idx === 0 || !hex.startsWith('#')) return '';
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    const s = max === 0 ? 0 : d / max;
    const v = max;
    if (d !== 0) {
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    const nh = (h + hueShiftDeg / 360) % 1;
    const i = Math.floor(nh * 6);
    const f = nh * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    let nr = 0;
    let ng = 0;
    let nb = 0;
    switch (i % 6) {
      case 0: nr = v; ng = t; nb = p; break;
      case 1: nr = q; ng = v; nb = p; break;
      case 2: nr = p; ng = v; nb = t; break;
      case 3: nr = p; ng = q; nb = v; break;
      case 4: nr = t; ng = p; nb = v; break;
      default: nr = v; ng = p; nb = q; break;
    }
    return rgbToHex(nr * 255, ng * 255, nb * 255);
  });
  return { name, colors: shifted };
}

/**
 * Strips #FF00FF magenta backgrounds, quantizes colors into a 16-entry palette (0 = transparent),
 * slices a sprite sheet into targetSize x targetSize indexed frames, and registers a playable FighterBlueprint.
 */
export function quantizeImageToFighter(
  img: HTMLImageElement,
  options: PngImportOptions,
): QuantizedImportResult {
  const cols = Math.max(1, Math.min(12, Math.round(options.cols)));
  const rows = Math.max(1, Math.min(12, Math.round(options.rows)));
  const size = options.targetSize;

  const cellW = img.naturalWidth / cols;
  const cellH = img.naturalHeight / rows;

  const scratch = document.createElement('canvas');
  scratch.width = size;
  scratch.height = size;
  const ctx = scratch.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D unavailable for PNG import');
  ctx.imageSmoothingEnabled = false;

  const rawCells: ImageData[] = [];
  const visibleSamples: Array<[number, number, number]> = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(
        img,
        Math.floor(c * cellW),
        Math.floor(r * cellH),
        Math.max(1, Math.floor(cellW)),
        Math.max(1, Math.floor(cellH)),
        0,
        0,
        size,
        size,
      );
      const data = ctx.getImageData(0, 0, size, size);
      rawCells.push(data);

      for (let i = 0; i < data.data.length; i += 4) {
        const cr = data.data[i];
        const cg = data.data[i + 1];
        const cb = data.data[i + 2];
        const ca = data.data[i + 3];
        if (!isMagentaKey(cr, cg, cb, ca, options.magentaTolerance)) {
          visibleSamples.push([cr, cg, cb]);
        }
      }
    }
  }

  const rgbPalette = buildQuantizedPalette(visibleSamples);
  const hexPalette: string[] = [''];
  for (let i = 0; i < 15; i++) {
    const rgb = rgbPalette[i];
    hexPalette.push(rgb ? rgbToHex(rgb[0], rgb[1], rgb[2]) : '#94A3B8');
  }

  const frames: IndexedFrame[] = [];
  for (const imgData of rawCells) {
    const matrix = createEmptyFrame(size);
    let nonEmpty = 0;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const offset = (y * size + x) * 4;
        const r = imgData.data[offset];
        const g = imgData.data[offset + 1];
        const b = imgData.data[offset + 2];
        const a = imgData.data[offset + 3];
        if (isMagentaKey(r, g, b, a, options.magentaTolerance)) {
          matrix[y][x] = 0;
          continue;
        }
        let bestIdx = 1;
        let bestDist = Infinity;
        for (let p = 0; p < rgbPalette.length; p++) {
          const [pr, pg, pb] = rgbPalette[p];
          const d = colorDistSq(r, g, b, pr, pg, pb);
          if (d < bestDist) {
            bestDist = d;
            bestIdx = p + 1;
          }
        }
        matrix[y][x] = bestIdx;
        nonEmpty++;
      }
    }
    if (nonEmpty > 0 || frames.length === 0) {
      frames.push(matrix);
    }
  }

  // Distribute sliced frames across animation clips cleanly (supports 1x1, 1x4, 5x6, etc.)
  const rowSlices = (rowIndex: number): IndexedFrame[] => {
    const start = rowIndex * cols;
    const slice = frames.slice(start, start + cols);
    return slice.length > 0 ? slice : [frames[0]];
  };

  const pixelChart = {} as PixelChart;
  if (rows >= 6) {
    pixelChart.idle = makeClip(rowSlices(0), options.ticksPerFrame + 4);
    pixelChart.walk = makeClip(rowSlices(1), options.ticksPerFrame);
    pixelChart.jump = makeClip(rowSlices(2), options.ticksPerFrame + 2);
    pixelChart.attack = makeClip(rowSlices(3), Math.max(4, options.ticksPerFrame - 2));
    pixelChart.smash = makeClip(rowSlices(4), options.ticksPerFrame);
    pixelChart.special = makeClip(rowSlices(5), options.ticksPerFrame);
    pixelChart.hurt = makeClip([frames[frames.length - 1] ?? frames[0]], 10);
  } else {
    const total = frames.length;
    const pick = (i: number) => frames[i % total] ?? frames[0];
    for (let s = 0; s < ANIM_STATES.length; s++) {
      const st: AnimState = ANIM_STATES[s];
      const clipFrames =
        total >= 3 && (st === 'walk' || st === 'idle')
          ? [pick(s), pick(s + 1), pick(s + 2)]
          : total >= 2
            ? [pick(s), pick(s + 1)]
            : [pick(0)];
      pixelChart[st] = makeClip(clipFrames, options.ticksPerFrame);
    }
  }

  const template = cloneFighterBlueprint(getArchetypeTemplate(options.archetype));
  const cleanName = options.name.trim() || 'Imported Fighter';
  const id = `custom-${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;

  const blueprint: FighterBlueprint = {
    ...template,
    id,
    name: cleanName,
    era: size >= 24 ? 'SNES' : 'NES',
    originTag: 'PNG Import',
    gridSize: size,
    pixelChart,
    isCustom: true,
    palettes: [
      { name: 'Original Sheet', colors: hexPalette },
      makeAltPalette(hexPalette, 90, 'Emerald Shift'),
      makeAltPalette(hexPalette, 180, 'Invert Shift'),
      makeAltPalette(hexPalette, 270, 'Royal Shift'),
    ],
  };

  return { palette: hexPalette, frames, pixelChart, blueprint };
}
