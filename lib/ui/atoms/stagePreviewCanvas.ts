'use client';

import React, { useEffect, useRef } from 'react';
import type { StageManifest } from '../../types/stage';
import { createCameraRig, projectPoint, VIRTUAL_HEIGHT, VIRTUAL_WIDTH, type CameraRig } from '../../engine/camera';
import { bakeStageSlices, type BakedStageCache } from '../../engine/stageBaker';
import { drawAmbientStageVfx, drawStageBackdrop } from '../../engine/ambientVfx';
import { computeVolumeState } from '../../engine/platformMotion';

export interface StagePreviewCanvasProps {
  stage: StageManifest;
  className?: string;
}

function drawAnimatedStagePreview(
  ctx: CanvasRenderingContext2D,
  stage: StageManifest,
  cache: BakedStageCache,
  cam: CameraRig,
  tick: number,
  bgImg: HTMLImageElement | null,
): void {
  drawStageBackdrop(ctx, stage, cam, tick, bgImg);
  drawAmbientStageVfx(ctx, stage.vfx, tick);

  const yawRad = (cam.yawDeg * Math.PI) / 180;
  const pitchRad = (cam.pitchDeg * Math.PI) / 180;
  const cosY = Math.cos(yawRad);
  const sinY = Math.sin(yawRad);
  const sinP = Math.sin(pitchRad);

  const drawList: Array<{ depth: number; draw: () => void }> = [];

  for (const bakedVol of cache.volumes) {
    const vol = bakedVol.volume;
    const pose = computeVolumeState(vol, tick);
    const count = bakedVol.sliceBitmaps.length;

    for (let i = 0; i < count; i++) {
      const t = count > 1 ? i / (count - 1) : 1;
      const sliceY = pose.topY + vol.height * (1 - t);
      const center = projectPoint(cam, pose.x, sliceY, vol.z);
      const surf = bakedVol.sliceBitmaps[i];
      const scale = center.scale;

      drawList.push({
        depth: center.depth + i * 0.02,
        draw: () => {
          ctx.save();
          if (pose.alpha < 1) ctx.globalAlpha = pose.alpha;
          ctx.translate(Math.round(center.sx), Math.round(center.sy));
          ctx.transform(cosY * scale, -sinY * sinP * scale, sinY * scale, cosY * sinP * scale, 0, 0);
          ctx.drawImage(surf as CanvasImageSource, -surf.width * 0.5, -surf.height * 0.5);
          ctx.restore();
        },
      });
    }
  }

  drawList.sort((a, b) => a.depth - b.depth);
  for (const item of drawList) item.draw();
}

/**
 * Renders a live animated 2.5D isometric preview of any StageManifest, showing
 * the rendered pixel-art backdrop, ambient VFX, moving platforms, and phase blocks.
 */
export function StagePreviewCanvas(props: StagePreviewCanvasProps): React.ReactElement {
  const { stage, className = '' } = props;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = VIRTUAL_WIDTH;
    canvas.height = VIRTUAL_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const cam = createCameraRig('ISOMETRIC');
    cam.zoom = 1.04;
    cam.focalY = 12;

    const cache = bakeStageSlices(stage);
    let loadedImg: HTMLImageElement | null = null;
    let isActive = true;
    let tick = 0;
    let rafId = 0;

    const img = new Image();
    img.referrerPolicy = 'no-referrer';
    img.onload = () => {
      if (isActive) loadedImg = img;
    };
    img.src = stage.backdropImage;

    const loop = () => {
      if (!isActive) return;
      tick++;
      cam.yawDeg = 26 + Math.sin(tick * 0.012) * 5;
      drawAnimatedStagePreview(ctx, stage, cache, cam, tick, loadedImg);
      rafId = window.requestAnimationFrame(loop);
    };

    rafId = window.requestAnimationFrame(loop);

    return () => {
      isActive = false;
      window.cancelAnimationFrame(rafId);
    };
  }, [stage]);

  return React.createElement('canvas', {
    ref: canvasRef,
    className: `pixelated w-full aspect-video block rounded-sm bg-[#070B16] ${className}`,
  });
}
