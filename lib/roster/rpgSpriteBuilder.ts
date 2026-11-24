import type { IndexedFrame, PalettePreset, PixelChart } from '../types/palette';
import {
  cloneFrame,
  makeClip,
  overlayPixels,
  parseFrame,
  shiftFrame,
} from './chartParser';

export interface RpgSpriteSpec {
  /** 24x24 (or 24x32) SNES standing pose rows */
  snesIdle: readonly string[];
  /** 24x24 (or 24x32) SNES lunging weapon/magic attack pose rows */
  snesAttack: readonly string[];
  /** Optional custom 24x24 jump pose; derived dynamically when omitted */
  snesJump?: readonly string[];
  /** Energy slash / orb style for smash & special frames */
  fxStyle: 'slash' | 'beam' | 'orb' | 'aura';
}

function addSlashFx(frame: IndexedFrame, heavy: boolean): IndexedFrame {
  const h = frame.length;
  const w = frame[0]?.length ?? 24;
  const rx = w - 1;
  const mid = Math.floor(h * 0.45);
  const pts: Array<readonly [number, number, number]> = [
    [rx - 3, mid - 5, 14],
    [rx - 2, mid - 4, 15],
    [rx - 1, mid - 3, 15],
    [rx, mid - 2, 13],
    [rx, mid - 1, 15],
    [rx, mid, 15],
    [rx - 1, mid + 1, 14],
    [rx - 2, mid + 2, 13],
    [rx - 3, mid + 3, 14],
  ];
  if (heavy) {
    pts.push(
      [rx - 4, mid - 6, 13],
      [rx - 2, mid - 5, 14],
      [rx - 1, mid - 4, 13],
      [rx - 1, mid, 13],
      [rx - 2, mid + 1, 15],
      [rx - 4, mid + 4, 13],
      [rx - 5, mid + 4, 14],
    );
  }
  return overlayPixels(frame, pts);
}

function addOrbFx(frame: IndexedFrame, heavy: boolean): IndexedFrame {
  const h = frame.length;
  const w = frame[0]?.length ?? 24;
  const cx = w - 3;
  const cy = Math.floor(h * 0.48);
  const pts: Array<readonly [number, number, number]> = [
    [cx, cy - 2, 14],
    [cx - 1, cy - 1, 14],
    [cx, cy - 1, 15],
    [cx + 1, cy - 1, 14],
    [cx - 2, cy, 13],
    [cx - 1, cy, 15],
    [cx, cy, 15],
    [cx + 1, cy, 15],
    [cx + 2, cy, 13],
    [cx - 1, cy + 1, 14],
    [cx, cy + 1, 15],
    [cx + 1, cy + 1, 14],
    [cx, cy + 2, 14],
  ];
  if (heavy) {
    pts.push(
      [cx - 2, cy - 2, 13],
      [cx + 2, cy - 2, 13],
      [cx - 2, cy + 2, 13],
      [cx + 2, cy + 2, 13],
      [cx, cy - 3, 13],
      [cx, cy + 3, 13],
    );
  }
  return overlayPixels(frame, pts);
}

function addBeamFx(frame: IndexedFrame, heavy: boolean): IndexedFrame {
  const h = frame.length;
  const w = frame[0]?.length ?? 24;
  const cy = Math.floor(h * 0.46);
  const pts: Array<readonly [number, number, number]> = [];
  for (let x = w - 6; x < w; x++) {
    pts.push([x, cy - 1, 14], [x, cy, 15], [x, cy + 1, 14]);
    if (heavy) {
      pts.push([x, cy - 2, 13], [x, cy + 2, 13]);
    }
  }
  return overlayPixels(frame, pts);
}

function addAuraFx(frame: IndexedFrame, heavy: boolean): IndexedFrame {
  const h = frame.length;
  const w = frame[0]?.length ?? 24;
  const pts: Array<readonly [number, number, number]> = [
    [3, 4, 14], [w - 4, 4, 14], [2, Math.floor(h * 0.4), 13], [w - 3, Math.floor(h * 0.4), 13],
    [4, 2, 15], [w - 5, 2, 15], [w - 2, Math.floor(h * 0.55), 15], [w - 1, Math.floor(h * 0.52), 14],
  ];
  if (heavy) {
    pts.push(
      [1, 6, 14], [w - 2, 6, 14], [3, Math.floor(h * 0.7), 13], [w - 4, Math.floor(h * 0.7), 13],
      [Math.floor(w * 0.5), 1, 15], [Math.floor(w * 0.5) - 1, 2, 14], [Math.floor(w * 0.5) + 1, 2, 14],
    );
  }
  return overlayPixels(frame, pts);
}

function applyStyleFx(
  frame: IndexedFrame,
  style: RpgSpriteSpec['fxStyle'],
  heavy: boolean,
): IndexedFrame {
  if (style === 'beam') return addBeamFx(frame, heavy);
  if (style === 'orb') return addOrbFx(frame, heavy);
  if (style === 'aura') return addAuraFx(frame, heavy);
  return addSlashFx(frame, heavy);
}

/**
 * Generates an expressive 7-state SNES PixelChart from hand-authored 24x24 frames.
 */
export function buildSnesRpgChart(spec: RpgSpriteSpec): PixelChart {
  const idle1 = parseFrame(spec.snesIdle);
  const idle2 = shiftFrame(idle1, 0, 1);

  const walk1 = shiftFrame(idle1, -1, 0);
  const walk2 = shiftFrame(idle1, 0, -1);
  const walk3 = shiftFrame(idle1, 1, 0);

  const jump1 = spec.snesJump ? parseFrame(spec.snesJump) : shiftFrame(idle1, 0, -2);
  const jump2 = shiftFrame(jump1, 1, -1);

  const atk1 = parseFrame(spec.snesAttack);
  const atk2 = applyStyleFx(shiftFrame(atk1, 1, 0), spec.fxStyle, false);

  const smash1 = shiftFrame(idle1, -2, 0);
  const smash2 = applyStyleFx(shiftFrame(atk1, 2, 0), spec.fxStyle, true);

  const spec1 = applyStyleFx(idle1, spec.fxStyle, false);
  const spec2 = applyStyleFx(atk1, spec.fxStyle, true);

  const hurt1 = shiftFrame(idle1, -2, -1);

  return {
    idle: makeClip([idle1, idle2], 18),
    walk: makeClip([walk1, walk2, walk3, idle1], 6),
    jump: makeClip([jump1, jump2], 12),
    attack: makeClip([atk1, atk2], 5),
    smash: makeClip([smash1, smash2], 8),
    special: makeClip([spec1, spec2], 6),
    hurt: makeClip([hurt1], 10),
  };
}

/**
 * Downsamples a 24x24 SNES sprite frame into an authentic crisp 16x16 Famicom/NES 8-bit
 * sprite frame, prioritizing foreground silhouette pixels over empty space.
 */
export function downsampleToNes16(src: IndexedFrame): IndexedFrame {
  const srcH = src.length;
  const srcW = src[0]?.length ?? srcH;
  const out: IndexedFrame = [];

  for (let ty = 0; ty < 16; ty++) {
    const row: number[] = new Array<number>(16).fill(0);
    const y0 = Math.floor((ty * srcH) / 16);
    const y1 = Math.max(y0 + 1, Math.floor(((ty + 1) * srcH) / 16));
    for (let tx = 0; tx < 16; tx++) {
      const x0 = Math.floor((tx * srcW) / 16);
      const x1 = Math.max(x0 + 1, Math.floor(((tx + 1) * srcW) / 16));

      let picked = 0;
      let hasOutline = false;
      for (let sy = y0; sy < y1; sy++) {
        for (let sx = x0; sx < x1; sx++) {
          const val = src[sy]?.[sx] ?? 0;
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
      } else {
        row[tx] = 0;
      }
    }
    out.push(row);
  }
  return out;
}

/**
 * Converts a 24x24 SNES RPG PixelChart into a full 16x16 NES 8-bit PixelChart
 * so the NES 8-BIT <-> SNES/SEGA era toggle works seamlessly across every fighter.
 */
export function buildNesDemakeChart(snesChart: PixelChart): PixelChart {
  return {
    idle: makeClip(snesChart.idle.frames.map(downsampleToNes16), snesChart.idle.ticksPerFrame),
    walk: makeClip(snesChart.walk.frames.map(downsampleToNes16), snesChart.walk.ticksPerFrame),
    jump: makeClip(snesChart.jump.frames.map(downsampleToNes16), snesChart.jump.ticksPerFrame),
    attack: makeClip(snesChart.attack.frames.map(downsampleToNes16), snesChart.attack.ticksPerFrame),
    smash: makeClip(snesChart.smash.frames.map(downsampleToNes16), snesChart.smash.ticksPerFrame),
    special: makeClip(snesChart.special.frames.map(downsampleToNes16), snesChart.special.ticksPerFrame),
    hurt: makeClip(snesChart.hurt.frames.map(downsampleToNes16), snesChart.hurt.ticksPerFrame),
  };
}

/**
 * Quantizes a 16-bit SNES palette into punchy authentic NES PPU-style 8-bit colors.
 */
export function buildNesPalettes(snesPalettes: PalettePreset[]): PalettePreset[] {
  return snesPalettes.map((p) => {
    const colors = cloneFrame([p.colors.map((_, i) => i)])[0].map((idx) => {
      if (idx === 0) return '';
      if (idx === 1) return '#000000';
      if (idx === 4) return p.colors[3] ?? '#000000';
      if (idx === 6) return p.colors[5] ?? '#000000';
      return p.colors[idx] ?? '#FFFFFF';
    });
    return {
      name: `${p.name} (8-Bit)`,
      colors,
    };
  });
}
