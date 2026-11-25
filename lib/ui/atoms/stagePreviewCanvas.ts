'use client';

import React, { useEffect, useRef } from 'react';
import type { StageManifest, StagePattern } from '../../types/stage';
import { createCameraRig, type CameraRig } from '../../engine/camera';
import { STAGE_TEXTURES } from '../../engine/backdropLoader';
import {
  computeHdViewport,
  drawHdAmbientVfx,
  drawHdBackdrop,
  drawHdPlatformVolume,
  projectToScreen,
  type HdViewport,
} from '../../engine/hdStagePainter';
import { computeVolumeState } from '../../engine/platformMotion';

export interface StagePreviewCanvasProps {
  stage: StageManifest;
  className?: string;
}

const PREVIEW_W = 768;
const PREVIEW_H = 432;

const textureImgCache = new Map<StagePattern, HTMLImageElement>();

function loadCachedTexture(pattern: StagePattern): HTMLImageElement | null {
  const existing = textureImgCache.get(pattern);
  if (existing) {
    return existing.complete && existing.naturalWidth > 0 ? existing : null;
  }
  if (typeof Image === 'undefined') return null;
  const img = new Image();
  img.referrerPolicy = 'no-referrer';
  img.src = STAGE_TEXTURES[pattern];
  textureImgCache.set(pattern, img);
  return null;
}

function drawAnimatedHdPreview(
  ctx: CanvasRenderingContext2D,
  vp: HdViewport,
  stage: StageManifest,
  cam: CameraRig,
  tick: number,
  bgImg: HTMLImageElement | null,
): void {
  drawHdBackdrop(ctx, vp, stage, cam, tick, bgImg);
  drawHdAmbientVfx(ctx, vp, stage.vfx, tick);

  const items = stage.volumes.map((vol) => {
    const pose = computeVolumeState(vol, tick);
    const center = projectToScreen(cam, vp, pose.x, pose.topY + vol.height * 0.35, vol.z);
    return { vol, pose, depth: center.depth, priority: vol.decorative ? 0 : 1 };
  });

  items.sort((a, b) => a.depth - b.depth || a.priority - b.priority);
  for (const item of items) {
    const tex = loadCachedTexture(item.vol.pattern);
    drawHdPlatformVolume(ctx, item.vol, item.pose, cam, vp, tex, tick);
  }
}

/**
 * Renders a live animated full-HD 2.5D isometric preview of any StageManifest,
 * matching the exact painted platform textures and native-HD backdrop used in-match.
 */
export function StagePreviewCanvas(props: StagePreviewCanvasProps): React.ReactElement {
  const { stage, className = '' } = props;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = PREVIEW_W;
    canvas.height = PREVIEW_H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const vp = computeHdViewport(PREVIEW_W, PREVIEW_H);
    const cam = createCameraRig('ISOMETRIC');
    cam.zoom = 0.74;
    cam.focalY = 14;

    for (const pattern of Object.keys(STAGE_TEXTURES) as StagePattern[]) {
      loadCachedTexture(pattern);
    }

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
      cam.yawDeg = 24 + Math.sin(tick * 0.012) * 5;
      drawAnimatedHdPreview(ctx, vp, stage, cam, tick, loadedImg);
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
    className: `w-full aspect-video block rounded-sm bg-[#070B16] ${className}`,
  });
}
