'use client';

import React, { useEffect, useRef } from 'react';
import type { GraphicsEra } from '../../types/fighter';
import { chiptuneAudio } from '../../io/chiptuneAudio';

export interface SfxOscilloscopeProps {
  era: GraphicsEra;
  activeLabel: string;
}

function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#060A14';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
  ctx.lineWidth = 1;
  const cols = 8;
  const rows = 4;
  for (let i = 1; i < cols; i++) {
    const x = Math.round((w / cols) * i) + 0.5;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let j = 1; j < rows; j++) {
    const y = Math.round((h / rows) * j) + 0.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(250, 204, 21, 0.24)';
  ctx.beginPath();
  ctx.moveTo(0, h / 2);
  ctx.lineTo(w, h / 2);
  ctx.stroke();
}

function drawTrace(
  ctx: CanvasRenderingContext2D,
  samples: Uint8Array,
  w: number,
  h: number,
  strokeColor: string,
): void {
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  const slice = w / Math.max(1, samples.length - 1);
  for (let i = 0; i < samples.length; i++) {
    const norm = (samples[i] - 128) / 128;
    const x = i * slice;
    const y = h / 2 + norm * (h * 0.42);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

/**
 * Live 60fps Web Audio waveform oscilloscope rendered on a crisp canvas.
 */
export function SfxOscilloscope(props: SfxOscilloscopeProps): React.ReactElement {
  const { era, activeLabel } = props;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const samples = new Uint8Array(new ArrayBuffer(256));
    samples.fill(128);
    let rafId = 0;
    const strokeColor = era === 'NES' ? '#F87171' : '#38BDF8';

    const renderFrame = () => {
      const hasAudio = chiptuneAudio.readWaveform(samples);
      if (!hasAudio) samples.fill(128);
      drawGrid(ctx, canvas.width, canvas.height);
      drawTrace(ctx, samples, canvas.width, canvas.height, strokeColor);
      rafId = window.requestAnimationFrame(renderFrame);
    };

    rafId = window.requestAnimationFrame(renderFrame);
    return () => window.cancelAnimationFrame(rafId);
  }, [era]);

  return React.createElement(
    'div',
    { className: 'relative w-full border-2 border-black bg-[#060A14] overflow-hidden' },
    React.createElement('canvas', {
      ref: canvasRef,
      width: 520,
      height: 128,
      'aria-label': `Live audio oscilloscope for ${activeLabel}`,
      className: 'w-full h-28 sm:h-32 block',
    }),
    React.createElement(
      'div',
      {
        className:
          'pointer-events-none absolute top-2 left-2.5 right-2.5 flex items-center justify-between text-[11px] font-mono text-white/65',
      },
      React.createElement('span', { className: 'truncate' }, activeLabel),
      React.createElement('span', { className: 'shrink-0 tabular-nums' }, era === 'NES' ? '8-Bit Pulse' : '16-Bit Layered'),
    ),
  );
}
