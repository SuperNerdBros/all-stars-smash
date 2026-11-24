'use client';

import React, { useEffect, useRef } from 'react';
import type { StageManifest } from '../../types/stage';
import { createCameraRig, projectPoint, VIRTUAL_HEIGHT, VIRTUAL_WIDTH } from '../../engine/camera';
import { bakeStageSlices } from '../../engine/stageBaker';

export interface StagePreviewCanvasProps {
  stage: StageManifest;
  className?: string;
}

/**
 * Renders a crisp live 2.5D isometric thumbnail of any StageManifest using
 * the exact same sprite-stacking pre-baker and camera projection math as gameplay.
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
    cam.zoom = 1.05;
    cam.focalY = 12;

    const cache = bakeStageSlices(stage);

    // Sky bands
    const bands = 10;
    const bandH = Math.ceil(VIRTUAL_HEIGHT / bands);
    for (let i = 0; i < bands; i++) {
      const t = i / (bands - 1);
      ctx.fillStyle = t < 0.45 ? stage.sky.zenith : t < 0.8 ? stage.sky.mid : stage.sky.horizon;
      ctx.fillRect(0, i * bandH, VIRTUAL_WIDTH, bandH);
    }

    if (stage.sky.starColor) {
      ctx.fillStyle = stage.sky.starColor;
      for (let i = 0; i < 32; i++) {
        ctx.fillRect((i * 83) % VIRTUAL_WIDTH, (i * 41) % 160, i % 4 === 0 ? 2 : 1, i % 4 === 0 ? 2 : 1);
      }
    }
    if (stage.sky.sunColor) {
      ctx.fillStyle = stage.sky.sunColor;
      ctx.fillRect(360, 34, 24, 24);
    }

    // Painter-sorted pre-baked sprite stacks
    const yawRad = (cam.yawDeg * Math.PI) / 180;
    const pitchRad = (cam.pitchDeg * Math.PI) / 180;
    const cosY = Math.cos(yawRad);
    const sinY = Math.sin(yawRad);
    const sinP = Math.sin(pitchRad);

    const drawList: Array<{ depth: number; draw: () => void }> = [];

    for (const bakedVol of cache.volumes) {
      const vol = bakedVol.volume;
      const count = bakedVol.sliceBitmaps.length;
      for (let i = 0; i < count; i++) {
        const t = count > 1 ? i / (count - 1) : 1;
        const sliceY = vol.topY + vol.height * (1 - t);
        const center = projectPoint(cam, vol.x, sliceY, vol.z);
        const surf = bakedVol.sliceBitmaps[i];
        const scale = center.scale;
        drawList.push({
          depth: center.depth + i * 0.02,
          draw: () => {
            ctx.save();
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
  }, [stage]);

  return React.createElement('canvas', {
    ref: canvasRef,
    className: `pixelated w-full aspect-video block rounded-sm bg-[#070B16] ${className}`,
  });
}
