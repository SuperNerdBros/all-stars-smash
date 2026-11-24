'use client';

import React, { useEffect, useRef } from 'react';
import type { FighterBlueprint, GraphicsEra } from '../../types/fighter';
import type { StageManifest } from '../../types/stage';
import { AttractArena } from '../../engine/attractArena';

export interface AttractBattleCanvasProps {
  stage: StageManifest;
  fighters: ReadonlyArray<FighterBlueprint>;
  graphicsEra: GraphicsEra;
}

/**
 * Full-bleed 2.5D hardware-crisp canvas rendering a calm 3-CPU easy-mode
 * full-stage battle behind the official title screen.
 */
export function AttractBattleCanvas(props: AttractBattleCanvasProps): React.ReactElement {
  const { stage, fighters, graphicsEra } = props;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fightersKey = fighters.map((f) => f.id).join(',');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || fighters.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const arena = new AttractArena(stage, fighters, graphicsEra);
    let rafId = 0;
    let lastTime = performance.now();
    let acc = 0;
    const stepMs = 1000 / 60;

    const resize = () => {
      const w = Math.max(320, window.innerWidth);
      const h = Math.max(240, window.innerHeight);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const frame = (now: number) => {
      const dt = Math.min(64, Math.max(0, now - lastTime));
      lastTime = now;
      acc += dt;
      let steps = 0;
      while (acc >= stepMs && steps < 3) {
        arena.step();
        acc -= stepMs;
        steps++;
      }
      arena.render(ctx, canvas.width, canvas.height);
      rafId = window.requestAnimationFrame(frame);
    };

    rafId = window.requestAnimationFrame(frame);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
    // fightersKey uniquely tracks the 8-fighter slice identity cleanly
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage.id, graphicsEra, fightersKey]);

  return React.createElement('canvas', {
    ref: canvasRef,
    'aria-hidden': 'true',
    className: 'fixed inset-0 w-screen h-screen block pointer-events-none',
    style: { imageRendering: 'pixelated' },
  });
}
