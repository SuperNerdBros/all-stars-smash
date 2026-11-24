import type { AnimState, ColorPalette, IndexedFrame } from '../types/palette';
import { ANIM_STATES } from '../types/palette';
import type { FighterBlueprint } from '../types/fighter';

export type BakedSurface = OffscreenCanvas | HTMLCanvasElement;

export interface BakedFramePair {
  right: BakedSurface;
  left: BakedSurface;
  flashRight: BakedSurface;
  flashLeft: BakedSurface;
  width: number;
  height: number;
}

export interface BakedFighterSprites {
  fighterId: string;
  paletteIndex: number;
  clips: Record<AnimState, { frames: BakedFramePair[]; ticksPerFrame: number }>;
}

function createSurface(width: number, height: number): BakedSurface {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height);
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function get2dCtx(
  surface: BakedSurface,
): OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D {
  const ctx = surface.getContext('2d') as
    | OffscreenCanvasRenderingContext2D
    | CanvasRenderingContext2D
    | null;
  if (!ctx) {
    throw new Error('2D context unavailable for sprite baking');
  }
  ctx.imageSmoothingEnabled = false;
  return ctx;
}

/**
 * Renders an indexed pixel matrix into a target 2D canvas context with crisp integer pixels.
 */
export function drawIndexedFrameToCtx(
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
  frame: IndexedFrame,
  palette: ColorPalette,
  scale = 1,
  flipX = false,
  solidOverrideColor?: string,
): void {
  const h = frame.length;
  const w = frame[0]?.length ?? 0;
  ctx.imageSmoothingEnabled = false;

  for (let y = 0; y < h; y++) {
    const row = frame[y];
    for (let x = 0; x < w; x++) {
      const idx = row[x] ?? 0;
      if (idx === 0) continue;
      const color = solidOverrideColor ?? palette[idx];
      if (!color) continue;
      ctx.fillStyle = color;
      const drawX = flipX ? w - 1 - x : x;
      ctx.fillRect(drawX * scale, y * scale, scale, scale);
    }
  }
}

export function bakeSingleFramePair(
  frame: IndexedFrame,
  palette: ColorPalette,
): BakedFramePair {
  const height = frame.length;
  const width = frame[0]?.length ?? 16;

  const right = createSurface(width, height);
  drawIndexedFrameToCtx(get2dCtx(right), frame, palette, 1, false);

  const left = createSurface(width, height);
  drawIndexedFrameToCtx(get2dCtx(left), frame, palette, 1, true);

  const flashRight = createSurface(width, height);
  drawIndexedFrameToCtx(get2dCtx(flashRight), frame, palette, 1, false, '#FFFFFF');

  const flashLeft = createSurface(width, height);
  drawIndexedFrameToCtx(get2dCtx(flashLeft), frame, palette, 1, true, '#FFFFFF');

  return { right, left, flashRight, flashLeft, width, height };
}

/**
 * Pre-bakes all animation states & frames of a fighter for a given palette index.
 * Runtime blitting uses these cached surfaces directly at 60 FPS.
 */
export function bakeFighterSprites(
  fighter: FighterBlueprint,
  paletteIndex: number,
): BakedFighterSprites {
  const safeIdx = Math.max(0, Math.min(paletteIndex, fighter.palettes.length - 1));
  const palette = fighter.palettes[safeIdx]?.colors ?? fighter.palettes[0].colors;
  const clips = {} as Record<AnimState, { frames: BakedFramePair[]; ticksPerFrame: number }>;

  for (const state of ANIM_STATES) {
    const clip = fighter.pixelChart[state];
    clips[state] = {
      ticksPerFrame: clip.ticksPerFrame,
      frames: clip.frames.map((frame) => bakeSingleFramePair(frame, palette)),
    };
  }

  return {
    fighterId: fighter.id,
    paletteIndex: safeIdx,
    clips,
  };
}
