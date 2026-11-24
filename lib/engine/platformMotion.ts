import type { SpriteStackVolume, StageManifest } from '../types/stage';

export interface DynamicVolumePose {
  x: number;
  topY: number;
  dx: number;
  dy: number;
  solidActive: boolean;
  alpha: number;
}

interface Offset2D {
  ox: number;
  oy: number;
}

function computeMotionOffset(vol: SpriteStackVolume, tick: number): Offset2D {
  const m = vol.motion;
  if (!m) return { ox: 0, oy: 0 };

  const phase = m.phase ?? 0;
  const angle = tick * m.speed + phase;

  if (m.kind === 'horizontal') {
    return { ox: Math.sin(angle) * m.ampX, oy: 0 };
  }
  if (m.kind === 'vertical') {
    return { ox: 0, oy: Math.sin(angle) * m.ampY };
  }
  if (m.kind === 'orbit') {
    return { ox: Math.cos(angle) * m.ampX, oy: Math.sin(angle) * m.ampY };
  }
  if (m.kind === 'pendulum') {
    const swing = Math.sin(angle);
    return { ox: swing * m.ampX, oy: (swing * swing - 0.5) * m.ampY };
  }
  // Stepped elevator: smooth pause at top and bottom extremes
  const raw = Math.sin(angle);
  const eased = Math.max(-1, Math.min(1, raw * 1.45));
  return { ox: 0, oy: eased * m.ampY };
}

function computeBlinkState(vol: SpriteStackVolume, tick: number): { solidActive: boolean; alpha: number } {
  if (vol.surfaceEffect !== 'phase-blink') {
    return { solidActive: true, alpha: 1 };
  }
  const period = Math.max(60, vol.blinkPeriod ?? 180);
  const phase = vol.blinkPhase ?? 0;
  const cycle = (tick + phase) % period;
  const solidLimit = Math.floor(period * 0.62);
  const warnStart = Math.floor(period * 0.48);

  if (cycle < warnStart) {
    return { solidActive: true, alpha: 1 };
  }
  if (cycle < solidLimit) {
    const flicker = Math.floor(tick / 4) % 2 === 0 ? 0.92 : 0.45;
    return { solidActive: true, alpha: flicker };
  }
  return { solidActive: false, alpha: 0.14 };
}

/**
 * Evaluates live position, frame delta (for riding carry physics), and phase visibility
 * of any 2.5D stage volume at a given simulation tick.
 */
export function computeVolumeState(vol: SpriteStackVolume, tick: number): DynamicVolumePose {
  const curr = computeMotionOffset(vol, tick);
  const prevTick = tick > 0 ? tick - 1 : 0;
  const prev = computeMotionOffset(vol, prevTick);
  const blink = computeBlinkState(vol, tick);

  return {
    x: vol.x + curr.ox,
    topY: vol.topY + curr.oy,
    dx: curr.ox - prev.ox,
    dy: curr.oy - prev.oy,
    solidActive: blink.solidActive,
    alpha: blink.alpha,
  };
}

export function getStageFeatureLabel(stage: StageManifest): string {
  const features: string[] = [];
  const hasMoving = stage.volumes.some((v) => Boolean(v.motion));
  const hasSpring = stage.volumes.some((v) => v.surfaceEffect === 'spring');
  const hasConveyor = stage.volumes.some(
    (v) => v.surfaceEffect === 'conveyor-right' || v.surfaceEffect === 'conveyor-left',
  );
  const hasIce = stage.volumes.some((v) => v.surfaceEffect === 'ice');
  const hasBlink = stage.volumes.some((v) => v.surfaceEffect === 'phase-blink');
  const isLowG = stage.gravityScale !== undefined && stage.gravityScale < 0.9;

  if (hasMoving) features.push('Moving');
  if (hasSpring) features.push('Spring');
  if (hasConveyor) features.push('Conveyor');
  if (hasIce) features.push('Ice');
  if (hasBlink) features.push('Phase');
  if (isLowG) features.push('Low-G');

  return features.length > 0 ? features.slice(0, 2).join(' · ') : 'Classic';
}
