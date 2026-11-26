import type { AnimState, IndexedFrame } from '../../types/palette';
import {
  buildDualEraSpriteCharts,
  PixelSpriteCanvas,
  type ShadePair,
} from '../classicSpriteCanvas';

type RpgAction = 'idle' | 'walk' | 'jump' | 'windup' | 'slash' | 'smashCharge' | 'smashSweep' | 'cast' | 'hurt';

interface HeroPose {
  readonly action: RpgAction;
  readonly leanX: number;
  readonly bobY: number;
  readonly phase: number;
  readonly blink?: boolean;
}

const HERO_POSES: Record<AnimState, readonly HeroPose[]> = {
  idle: [
    { action: 'idle', leanX: 0, bobY: 0, phase: 0 },
    { action: 'idle', leanX: 0, bobY: 1, phase: 1 },
    { action: 'idle', leanX: 0, bobY: 0, phase: 2, blink: true },
  ],
  walk: [
    { action: 'walk', leanX: 1, bobY: 0, phase: 0 },
    { action: 'walk', leanX: 1, bobY: 1, phase: 1 },
    { action: 'walk', leanX: 1, bobY: 0, phase: 2 },
    { action: 'walk', leanX: 1, bobY: 1, phase: 3 },
  ],
  jump: [
    { action: 'jump', leanX: 0, bobY: -1, phase: 0 },
    { action: 'jump', leanX: 1, bobY: 0, phase: 1 },
  ],
  attack: [
    { action: 'windup', leanX: -1, bobY: 0, phase: 0 },
    { action: 'slash', leanX: 2, bobY: 0, phase: 1 },
    { action: 'slash', leanX: 1, bobY: 0, phase: 2 },
  ],
  smash: [
    { action: 'smashCharge', leanX: -2, bobY: 1, phase: 0 },
    { action: 'smashSweep', leanX: 2, bobY: 0, phase: 1 },
    { action: 'smashSweep', leanX: 2, bobY: 1, phase: 2 },
  ],
  special: [
    { action: 'cast', leanX: -1, bobY: 0, phase: 0 },
    { action: 'cast', leanX: 1, bobY: -1, phase: 1 },
    { action: 'cast', leanX: 1, bobY: 0, phase: 2 },
  ],
  hurt: [
    { action: 'hurt', leanX: -2, bobY: 0, phase: 0 },
    { action: 'hurt', leanX: -3, bobY: 1, phase: 1 },
  ],
};

const HERO_TICKS: Record<AnimState, number> = {
  idle: 15,
  walk: 5,
  jump: 9,
  attack: 4,
  smash: 6,
  special: 5,
  hurt: 8,
};

const FROG_SHADES: readonly ShadePair[] = [
  { base: 3, shadow: 4 },
  { base: 5, shadow: 6 },
  { base: 7, shadow: 8 },
  { base: 10, shadow: 11 },
];

interface FootKinematics {
  readonly stride: number;
  readonly liftBack: number;
  readonly liftFront: number;
}

function computeFootKinematics(pose: HeroPose): FootKinematics {
  if (pose.action === 'jump') {
    return { stride: 0, liftBack: 3, liftFront: 4 };
  }
  if (pose.action !== 'walk') {
    return { stride: 0, liftBack: 0, liftFront: 0 };
  }
  if (pose.phase === 0) {
    return { stride: 3, liftBack: 2, liftFront: 0 };
  }
  if (pose.phase === 2) {
    return { stride: -3, liftBack: 0, liftFront: 2 };
  }
  return { stride: 0, liftBack: 0, liftFront: 0 };
}

function drawMasamune(
  canvas: PixelSpriteCanvas,
  hiltX: number,
  hiltY: number,
  tipX: number,
  tipY: number,
  waterGlow: boolean,
): void {
  canvas.drawLine(hiltX, hiltY, tipX, tipY, 10, 0.8);
  canvas.drawLine(hiltX, hiltY, tipX, tipY, 15, 0);
  canvas.fillRect(hiltX - 2, hiltY - 1, 5, 2, 7);
  canvas.plot(hiltX, hiltY + 1, 13);
  if (waterGlow) {
    canvas.drawLine(hiltX + 1, hiltY - 2, tipX, tipY - 1, 13, 0.4);
    canvas.plot(tipX, tipY, 14);
  }
}

function drawFrogHead(
  canvas: PixelSpriteCanvas,
  hx: number,
  hy: number,
  blink: boolean,
): void {
  canvas.fillEllipse(hx + 0.5, hy, 5.2, 3.6, 3);
  canvas.fillEllipse(hx + 1.5, hy + 2.2, 4.4, 1.6, 2);
  canvas.drawLine(hx - 1, hy + 1, hx + 5, hy + 1, 1);

  canvas.fillEllipse(hx - 1.5, hy - 3.6, 2.0, 2.0, 3);
  canvas.fillEllipse(hx + 3.0, hy - 3.6, 2.0, 2.0, 3);
  canvas.fillEllipse(hx - 1.2, hy - 3.6, 1.3, 1.3, 10);
  canvas.fillEllipse(hx + 3.3, hy - 3.6, 1.3, 1.3, 10);

  if (blink) {
    canvas.drawLine(hx - 2, hy - 4, hx, hy - 4, 1);
    canvas.drawLine(hx + 2, hy - 4, hx + 4, hy - 4, 1);
  } else {
    canvas.plot(hx - 1, hy - 4, 1);
    canvas.plot(hx + 4, hy - 4, 1);
    canvas.plot(hx - 2, hy - 5, 15);
    canvas.plot(hx + 3, hy - 5, 15);
  }
}

function drawFrogBody(
  canvas: PixelSpriteCanvas,
  tx: number,
  ty: number,
  stride: number,
  liftBack: number,
  liftFront: number,
  capeFlare: number,
): void {
  canvas.fillTriangle(
    tx - 2,
    ty - 4,
    tx - 9 - capeFlare,
    ty + 6,
    tx - 1,
    ty + 5,
    5,
  );
  canvas.drawLine(tx - 3, ty - 2, tx - 8 - capeFlare, ty + 5, 6, 0.5);

  canvas.drawLine(tx - 2, ty + 4, tx - 3 - stride, 28 - liftBack, 3, 1.0);
  canvas.drawLine(tx + 2, ty + 4, tx + 3 + stride, 28 - liftFront, 3, 1.0);
  canvas.fillRoundedRect(tx - 5 - stride, 27 - liftBack, 5, 4, 9);
  canvas.fillRoundedRect(tx + 1 + stride, 27 - liftFront, 5, 4, 9);

  canvas.fillRoundedRect(tx - 4, ty - 4, 9, 9, 7);
  canvas.drawLine(tx - 3, ty - 4, tx + 3, ty + 2, 9, 0.5);
  canvas.fillRect(tx - 4, ty + 2, 9, 2, 9);
  canvas.fillRect(tx, ty + 2, 2, 2, 10);
  canvas.fillRect(tx - 4, ty - 5, 9, 2, 5);
}

function renderFrogFrame(pose: HeroPose): IndexedFrame {
  const canvas = new PixelSpriteCanvas(24, 32);
  const tx = 10 + pose.leanX;
  const ty = 19 + pose.bobY;
  const hx = tx + 1;
  const hy = ty - 8;

  const { stride, liftBack, liftFront } = computeFootKinematics(pose);
  const capeFlare = pose.action === 'jump' || pose.action === 'smashSweep' ? 2 : pose.phase % 2;

  drawFrogBody(canvas, tx, ty, stride, liftBack, liftFront, capeFlare);

  if (pose.action === 'windup') {
    canvas.drawLine(tx - 2, ty - 2, tx - 5, ty - 7, 3, 0.9);
    drawMasamune(canvas, tx - 5, ty - 7, tx - 1, ty - 16, false);
  } else if (pose.action === 'slash') {
    canvas.drawLine(tx + 3, ty - 2, tx + 7, ty - 1, 3, 0.9);
    drawMasamune(canvas, tx + 7, ty - 1, 23, ty - 4 + pose.phase * 3, true);
    canvas.drawArc(tx + 7, ty - 2, 6, 6, -55, 45, 13, 0.6);
  } else if (pose.action === 'smashCharge') {
    canvas.drawLine(tx - 2, ty - 3, tx - 4, ty - 8, 3, 0.9);
    drawMasamune(canvas, tx - 4, ty - 8, tx - 7, ty - 15, true);
    canvas.drawArc(tx, ty - 3, 8, 8, -140, -25, 14, 0.5);
  } else if (pose.action === 'smashSweep') {
    canvas.drawLine(tx + 3, ty - 2, tx + 8, ty, 3, 0.9);
    drawMasamune(canvas, tx + 8, ty, 23, ty + 2, true);
    canvas.drawArc(tx + 7, ty - 2, 7.5, 8.5, -80, 65, 13, 0.9);
    canvas.drawArc(tx + 8, ty - 2, 5.5, 6.5, -55, 45, 14, 0.5);
  } else if (pose.action === 'cast') {
    canvas.drawLine(tx + 3, ty - 2, tx + 7, ty - 2, 3, 0.9);
    canvas.fillEllipse(20, ty - 3, 3.2, 3.2, 13);
    canvas.fillEllipse(20, ty - 3, 1.8, 1.8, 14);
    canvas.plot(19, ty - 4, 15);
    canvas.drawArc(20, ty - 3, 4.4, 4.4, pose.phase * 60, pose.phase * 60 + 140, 14, 0.4);
  } else if (pose.action === 'hurt') {
    canvas.drawLine(tx - 3, ty - 2, tx - 7, ty - 5, 3, 0.9);
    canvas.drawLine(tx + 3, ty - 2, tx + 7, ty - 5, 3, 0.9);
  } else {
    canvas.drawLine(tx - 3, ty - 2, tx - 5, ty + 1, 3, 0.9);
    canvas.drawLine(tx + 3, ty - 2, tx + 6, ty + 1, 3, 0.9);
    drawMasamune(canvas, tx + 6, ty + 1, tx + 11, ty - 8, false);
  }

  drawFrogHead(canvas, hx, hy, Boolean(pose.blink));
  canvas.applyCelShading(FROG_SHADES);
  canvas.applyAutoOutline(1, [13, 14, 15]);
  return canvas.toFrame();
}

export { CRONO_DUAL_ERA } from './cronoSprites';

export const FROG_DUAL_ERA = buildDualEraSpriteCharts(
  HERO_POSES,
  HERO_TICKS,
  renderFrogFrame,
  { width: 16, height: 24 },
);
