'use client';

import React, { useEffect, useRef } from 'react';
import type { AnimState, ColorPalette, PixelChart } from '../../types/palette';
import { drawIndexedFrameToCtx } from '../../roster/paletteBaker';

export interface SpriteCanvasProps {
  pixelChart: PixelChart;
  palette: ColorPalette;
  animState?: AnimState;
  sizePx?: number;
  flipX?: boolean;
  animate?: boolean;
  className?: string;
}

/**
 * Pure pixel-art animated preview atom rendering indexed matrices directly
 * onto a crisp nearest-neighbor canvas with zero anti-aliasing.
 */
export function SpriteCanvas(props: SpriteCanvasProps): React.ReactElement {
  const {
    pixelChart,
    palette,
    animState = 'idle',
    sizePx = 64,
    flipX = false,
    animate = true,
    className = '',
  } = props;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const clip = pixelChart[animState] ?? pixelChart.idle;
    const frames = clip.frames;
    const first = frames[0];
    const gridH = first?.length ?? 16;
    const gridW = first?.[0]?.length ?? 16;
    const intScale = Math.max(1, Math.floor(sizePx / Math.max(gridW, gridH)));
    const drawW = gridW * intScale;
    const drawH = gridH * intScale;

    canvas.width = drawW;
    canvas.height = drawH;

    let frameIndex = 0;
    const drawCurrent = () => {
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, drawW, drawH);
      const frame = frames[frameIndex % frames.length];
      if (frame) {
        drawIndexedFrameToCtx(ctx, frame, palette, intScale, flipX);
      }
    };

    drawCurrent();

    if (!animate || frames.length <= 1) return;

    const intervalMs = Math.max(70, Math.round((clip.ticksPerFrame / 60) * 1000));
    const timer = window.setInterval(() => {
      frameIndex = (frameIndex + 1) % frames.length;
      drawCurrent();
    }, intervalMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [pixelChart, palette, animState, sizePx, flipX, animate]);

  const firstFrame = (pixelChart[animState] ?? pixelChart.idle).frames[0];
  const frameH = firstFrame?.length ?? 16;
  const frameW = firstFrame?.[0]?.length ?? frameH;
  const maxDim = Math.max(1, frameW, frameH);
  const cssW = Math.max(16, Math.round((frameW / maxDim) * sizePx));
  const cssH = Math.max(16, Math.round((frameH / maxDim) * sizePx));

  return React.createElement('canvas', {
    ref: canvasRef,
    style: { width: `${cssW}px`, height: `${cssH}px` },
    className: ['pixelated block select-none', className].filter(Boolean).join(' '),
  });
}
