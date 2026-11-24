import type { SpriteStackVolume, StageManifest } from '../types/stage';
import type { BakedSurface } from '../roster/paletteBaker';

export interface BakedVolumeSlices {
  volume: SpriteStackVolume;
  /** Slices ordered bottom (index 0) to top (index slices - 1) */
  sliceBitmaps: BakedSurface[];
}

export interface BakedStageCache {
  stageId: string;
  volumes: BakedVolumeSlices[];
  cloudSlices: BakedSurface[];
}

function createSurface(width: number, height: number): BakedSurface {
  const safeW = Math.max(2, Math.round(width));
  const safeH = Math.max(2, Math.round(height));
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(safeW, safeH);
  }
  const c = document.createElement('canvas');
  c.width = safeW;
  c.height = safeH;
  return c;
}

function getCtx(
  surface: BakedSurface,
): OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D {
  const ctx = surface.getContext('2d') as
    | OffscreenCanvasRenderingContext2D
    | CanvasRenderingContext2D
    | null;
  if (!ctx) throw new Error('2D context unavailable for stage baking');
  ctx.imageSmoothingEnabled = false;
  return ctx;
}

function hash2d(x: number, y: number, seed: number): number {
  const n = Math.imul(x * 374761393 + y * 668265263 + seed * 1442695041, 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function bakeSingleVolumeSlice(
  vol: SpriteStackVolume,
  sliceIndex: number,
  totalSlices: number,
): BakedSurface {
  const w = Math.max(8, Math.round(vol.width));
  const d = Math.max(8, Math.round(vol.depth));
  const surf = createSurface(w, d);
  const ctx = getCtx(surf);

  const isTop = sliceIndex === totalSlices - 1;
  const isNearTop = sliceIndex >= totalSlices - 2;
  const isBottom = sliceIndex === 0;

  // Taper decorative keels or crystal pillars cleanly
  let insetX = 0;
  let insetZ = 0;
  if (vol.decorative && vol.pattern !== 'crystal-pillar') {
    const t = 1 - sliceIndex / Math.max(1, totalSlices - 1);
    insetX = Math.floor(t * w * 0.22);
    insetZ = Math.floor(t * d * 0.22);
  } else if (vol.pattern === 'crystal-pillar') {
    const t = sliceIndex / Math.max(1, totalSlices - 1);
    insetX = Math.floor(t * w * 0.28);
    insetZ = Math.floor(t * d * 0.28);
  }

  const rx = insetX;
  const rz = insetZ;
  const rw = Math.max(4, w - insetX * 2);
  const rd = Math.max(4, d - insetZ * 2);

  // Base fill per elevation slice
  if (isTop) {
    ctx.fillStyle = vol.topColor;
  } else if (isNearTop && vol.pattern === 'grass-stone') {
    ctx.fillStyle = vol.midColor;
  } else if (isBottom) {
    ctx.fillStyle = vol.sideColor;
  } else {
    ctx.fillStyle = sliceIndex % 2 === 0 ? vol.sideColor : vol.midColor;
  }
  ctx.fillRect(rx, rz, rw, rd);

  // Procedural pixel-art surface texture baked once into the slice bitmap
  const tile = 4;
  for (let py = rz; py < rz + rd; py += tile) {
    for (let px = rx; px < rx + rw; px += tile) {
      const h = hash2d(px, py, sliceIndex + vol.width);
      const isBorder =
        px <= rx + 2 ||
        px >= rx + rw - tile - 1 ||
        py <= rz + 2 ||
        py >= rz + rd - tile - 1;

      if (isTop) {
        if (isBorder) {
          ctx.fillStyle = vol.trimColor;
          ctx.fillRect(px, py, tile, tile);
        } else if (vol.pattern === 'grass-stone' && h > 0.72) {
          ctx.fillStyle = vol.trimColor;
          ctx.fillRect(px, py, 2, 2);
        } else if (vol.pattern === 'obsidian-gold') {
          if ((px + py) % 16 === 0) {
            ctx.fillStyle = vol.trimColor;
            ctx.fillRect(px, py, 2, 2);
          } else if (h > 0.78) {
            ctx.fillStyle = vol.midColor;
            ctx.fillRect(px, py, tile, tile);
          }
        } else if (vol.pattern === 'wood-bridge') {
          if (px % 8 === 0) {
            ctx.fillStyle = vol.midColor;
            ctx.fillRect(px, py, 1, tile);
          }
        } else if (vol.pattern === 'brick-fortress') {
          const offset = (Math.floor(py / tile) % 2) * 4;
          if ((px + offset) % 8 === 0 || py % 8 === 0) {
            ctx.fillStyle = vol.sideColor;
            ctx.fillRect(px, py, 1, tile);
          }
        } else if (vol.pattern === 'crystal-pillar' && h > 0.55) {
          ctx.fillStyle = vol.trimColor;
          ctx.fillRect(px, py, 2, 2);
        }
      } else {
        // Side wall shading + pixel brick/strata accents
        if (isBorder && (px + sliceIndex * 4) % 12 === 0) {
          ctx.fillStyle = vol.trimColor;
          ctx.fillRect(px, py, 2, 2);
        } else if (py >= rz + rd - tile) {
          ctx.fillStyle = vol.sideColor;
          ctx.fillRect(px, py, tile, tile);
        }
      }
    }
  }

  // Crisp 1px dark rim around outer edge for clean NES/SNES readability
  ctx.fillStyle = 'rgba(8, 12, 24, 0.45)';
  ctx.fillRect(rx, rz + rd - 1, rw, 1);
  ctx.fillRect(rx + rw - 1, rz, 1, rd);

  return surf;
}

function bakeCloudStack(baseColor: string, shadeColor: string): BakedSurface[] {
  const sizes: ReadonlyArray<[number, number]> = [
    [36, 16],
    [44, 20],
    [34, 15],
  ];
  return sizes.map(([w, d], idx) => {
    const surf = createSurface(w, d);
    const ctx = getCtx(surf);
    ctx.fillStyle = idx === 0 ? shadeColor : baseColor;
    ctx.fillRect(4, 2, w - 8, d - 4);
    ctx.fillRect(2, 4, w - 4, d - 8);
    if (idx === 2) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(8, 3, w - 16, 4);
    }
    return surf;
  });
}

/**
 * Pre-bakes every static stage volume's procedural sprite-stack slices into offscreen bitmaps once per stage load.
 */
export function bakeStageSlices(stage: StageManifest): BakedStageCache {
  const volumes: BakedVolumeSlices[] = stage.volumes.map((volume) => {
    const sliceBitmaps: BakedSurface[] = [];
    for (let i = 0; i < volume.slices; i++) {
      sliceBitmaps.push(bakeSingleVolumeSlice(volume, i, volume.slices));
    }
    return { volume, sliceBitmaps };
  });

  const cloudSlices = bakeCloudStack(stage.clouds.baseColor, stage.clouds.shadeColor);

  return {
    stageId: stage.id,
    volumes,
    cloudSlices,
  };
}
