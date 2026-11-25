import type { AnimState, IndexedFrame } from '../../types/palette';
import {
  buildDualEraSpriteCharts,
  PixelSpriteCanvas,
  type ShadePair,
} from '../classicSpriteCanvas';

type ChronoAction = 'idle' | 'walk' | 'jump' | 'windup' | 'strike' | 'smashCharge' | 'smashBurst' | 'cast' | 'hurt';

interface ChronoPose {
  readonly action: ChronoAction;
  readonly leanX: number;
  readonly bobY: number;
  readonly phase: number;
  readonly blink?: boolean;
}

const CHRONO_POSES: Record<AnimState, readonly ChronoPose[]> = {
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
    { action: 'strike', leanX: 2, bobY: 0, phase: 1 },
    { action: 'strike', leanX: 1, bobY: 0, phase: 2 },
  ],
  smash: [
    { action: 'smashCharge', leanX: -2, bobY: 1, phase: 0 },
    { action: 'smashBurst', leanX: 2, bobY: 0, phase: 1 },
    { action: 'smashBurst', leanX: 2, bobY: 1, phase: 2 },
  ],
  special: [
    { action: 'cast', leanX: -1, bobY: 0, phase: 0 },
    { action: 'cast', leanX: 1, bobY: 0, phase: 1 },
    { action: 'cast', leanX: 1, bobY: 0, phase: 2 },
  ],
  hurt: [
    { action: 'hurt', leanX: -2, bobY: 0, phase: 0 },
    { action: 'hurt', leanX: -3, bobY: 1, phase: 1 },
  ],
};

const CHRONO_TICKS: Record<AnimState, number> = {
  idle: 15,
  walk: 6,
  jump: 9,
  attack: 4,
  smash: 6,
  special: 5,
  hurt: 8,
};

const ROBO_SHADES: readonly ShadePair[] = [
  { base: 3, shadow: 4 },
  { base: 5, shadow: 6 },
  { base: 10, shadow: 11 },
];

const MAGUS_SHADES: readonly ShadePair[] = [
  { base: 3, shadow: 4 },
  { base: 5, shadow: 6 },
  { base: 10, shadow: 11 },
];

interface StrideState {
  readonly stride: number;
  readonly liftBack: number;
  readonly liftFront: number;
}

function computeStrideState(pose: ChronoPose): StrideState {
  if (pose.action === 'jump') {
    return { stride: 0, liftBack: 3, liftFront: 3 };
  }
  if (pose.action !== 'walk') {
    return { stride: 0, liftBack: 0, liftFront: 0 };
  }
  if (pose.phase === 0) {
    return { stride: 2, liftBack: 2, liftFront: 0 };
  }
  if (pose.phase === 2) {
    return { stride: -2, liftBack: 0, liftFront: 2 };
  }
  return { stride: 0, liftBack: 0, liftFront: 0 };
}

function drawRoboHead(canvas: PixelSpriteCanvas, hx: number, hy: number, pulse: boolean): void {
  canvas.fillEllipse(hx, hy, 4.6, 4.0, 3);
  canvas.drawArc(hx - 1, hy - 1, 3.2, 2.5, -145, -45, 2);
  canvas.fillRect(hx - 2, hy - 1, 7, 3, 1);
  const eyeColor = pulse ? 15 : 13;
  canvas.fillRect(hx, hy, 2, 1, eyeColor);
  canvas.fillRect(hx + 3, hy, 2, 1, eyeColor);
  canvas.plot(hx - 3, hy, 10);
}

function drawRoboTorsoAndLegs(
  canvas: PixelSpriteCanvas,
  tx: number,
  ty: number,
  stride: number,
  liftBack: number,
  liftFront: number,
  jetsOn: boolean,
): void {
  canvas.drawLine(tx - 3, ty + 5, tx - 3 - stride, 28 - liftBack, 3, 1.3);
  canvas.drawLine(tx + 3, ty + 5, tx + 3 + stride, 28 - liftFront, 3, 1.3);
  canvas.fillRoundedRect(tx - 6 - stride, 27 - liftBack, 6, 4, 9);
  canvas.fillRoundedRect(tx + stride, 27 - liftFront, 6, 4, 9);
  canvas.plot(tx - 4 - stride, 28 - liftBack, 10);
  canvas.plot(tx + 3 + stride, 28 - liftFront, 10);

  if (jetsOn) {
    canvas.fillTriangle(tx - 4, 28, tx - 2, 28, tx - 3, 31, 8);
    canvas.fillTriangle(tx + 2, 28, tx + 4, 28, tx + 3, 31, 8);
    canvas.plot(tx - 3, 29, 14);
    canvas.plot(tx + 3, 29, 14);
  }

  canvas.fillRoundedRect(tx - 5, ty - 4, 11, 10, 3);
  canvas.fillRect(tx - 4, ty + 4, 9, 2, 5);
  canvas.fillRect(tx - 2, ty - 2, 5, 5, 10);
  canvas.fillRect(tx - 1, ty - 1, 3, 3, 7);
  canvas.plot(tx, ty, 13);
  canvas.fillEllipse(tx - 5, ty - 2, 2.2, 2.2, 5);
  canvas.fillEllipse(tx + 5, ty - 2, 2.2, 2.2, 5);
}

function drawRoboFist(canvas: PixelSpriteCanvas, fx: number, fy: number, heavy = false): void {
  const rx = heavy ? 3.0 : 2.3;
  const ry = heavy ? 2.6 : 2.1;
  canvas.fillEllipse(fx, fy, rx, ry, 10);
  canvas.fillRect(fx - 1, fy - 1, 2, 2, 7);
  canvas.plot(fx + 1, fy - 1, 15);
}

function renderRoboFrame(pose: ChronoPose): IndexedFrame {
  const canvas = new PixelSpriteCanvas(24, 32);
  const tx = 10 + pose.leanX;
  const ty = 18 + pose.bobY;
  const hx = tx;
  const hy = ty - 9;

  const { stride, liftBack, liftFront } = computeStrideState(pose);
  const jetsOn = pose.action === 'jump';
  drawRoboTorsoAndLegs(canvas, tx, ty, stride, liftBack, liftFront, jetsOn);

  if (pose.action === 'windup') {
    canvas.drawLine(tx - 5, ty - 1, tx - 7, ty + 2, 3, 1.1);
    drawRoboFist(canvas, tx - 7, ty + 2);
    canvas.drawLine(tx + 5, ty - 1, tx + 3, ty, 3, 1.1);
    drawRoboFist(canvas, tx + 3, ty);
  } else if (pose.action === 'strike') {
    canvas.drawLine(tx - 5, ty - 1, tx - 7, ty + 2, 3, 1.1);
    drawRoboFist(canvas, tx - 7, ty + 2);
    canvas.drawLine(tx + 5, ty - 1, tx + 10, ty - 1, 5, 0.9);
    canvas.drawLine(tx + 6, ty - 1, tx + 9, ty - 1, 8, 0.4);
    drawRoboFist(canvas, tx + 11, ty - 1, true);
    canvas.plot(tx + 13, ty - 2, 14);
    canvas.plot(tx + 13, ty, 14);
  } else if (pose.action === 'smashCharge') {
    canvas.drawLine(tx - 5, ty - 1, tx - 7, ty - 4, 3, 1.1);
    drawRoboFist(canvas, tx - 7, ty - 5, true);
    canvas.drawLine(tx + 5, ty - 1, tx + 3, ty - 3, 3, 1.1);
    drawRoboFist(canvas, tx + 3, ty - 3, true);
    canvas.drawArc(tx, ty - 3, 8, 8, -145, -35, 13, 0.5);
  } else if (pose.action === 'smashBurst') {
    canvas.drawLine(tx + 4, ty - 3, tx + 10, ty - 4 + pose.phase * 2, 5, 1.0);
    drawRoboFist(canvas, tx + 11, ty - 4 + pose.phase * 2, true);
    canvas.drawLine(tx + 4, ty + 1, tx + 9, ty + 2 - pose.phase, 5, 1.0);
    drawRoboFist(canvas, tx + 10, ty + 2 - pose.phase, true);
    canvas.drawArc(tx + 10, ty - 1, 4.5, 6.0, -70, 70, 8, 0.7);
    canvas.drawArc(tx + 11, ty - 1, 3.5, 4.5, -50, 50, 14, 0.5);
  } else if (pose.action === 'cast') {
    canvas.drawLine(tx - 5, ty - 1, tx - 7, ty + 2, 3, 1.1);
    drawRoboFist(canvas, tx - 7, ty + 2);
    canvas.drawLine(tx + 5, ty - 1, tx + 7, ty + 2, 3, 1.1);
    drawRoboFist(canvas, tx + 7, ty + 2);
    canvas.fillRect(tx + 2, ty - 2, 13, 4, 13);
    canvas.fillRect(tx + 2, ty - 1, 13, 2, 14);
    canvas.fillRect(tx + 3, ty, 12, 1, 15);
    canvas.fillRect(tx + 3, hy - 1, 12, 2, 13);
    canvas.fillRect(tx + 4, hy, 11, 1, 15);
  } else if (pose.action === 'hurt') {
    canvas.drawLine(tx - 5, ty - 1, tx - 8, ty - 5, 3, 1.1);
    drawRoboFist(canvas, tx - 8, ty - 6);
    canvas.drawLine(tx + 5, ty - 1, tx + 8, ty - 5, 3, 1.1);
    drawRoboFist(canvas, tx + 8, ty - 6);
    canvas.plot(tx + 3, hy - 3, 14);
    canvas.plot(tx - 4, ty - 5, 13);
  } else {
    canvas.drawLine(tx - 5, ty - 1, tx - 7, ty + 3, 3, 1.1);
    drawRoboFist(canvas, tx - 7, ty + 4);
    canvas.drawLine(tx + 5, ty - 1, tx + 7, ty + 3, 3, 1.1);
    drawRoboFist(canvas, tx + 7, ty + 4);
  }

  drawRoboHead(canvas, hx, hy, Boolean(pose.blink) || pose.action === 'cast');
  canvas.applyCelShading(ROBO_SHADES);
  canvas.applyAutoOutline(1, [8, 13, 14, 15]);
  return canvas.toFrame();
}

function drawCrescentScythe(
  canvas: PixelSpriteCanvas,
  gripX: number,
  gripY: number,
  headX: number,
  headY: number,
  arcaneGlow: boolean,
): void {
  const buttX = gripX - (headX - gripX) * 0.7;
  const buttY = gripY - (headY - gripY) * 0.7;
  canvas.drawLine(buttX, buttY, headX, headY, 9, 0.5);
  canvas.fillRect(headX - 1, headY - 1, 2, 2, 7);

  canvas.drawArc(headX - 1, headY + 3, 5.2, 4.2, -135, -10, 10, 0.8);
  canvas.drawArc(headX - 1, headY + 3, 5.4, 4.4, -125, -20, 15, 0.3);
  canvas.plot(headX + 4, headY + 2, 10);
  if (arcaneGlow) {
    canvas.drawArc(headX - 1, headY + 3, 6.2, 5.0, -140, -5, 13, 0.4);
    canvas.plot(headX + 5, headY + 2, 14);
  }
}

function drawMagusHead(canvas: PixelSpriteCanvas, hx: number, hy: number, hairSway: number, blink: boolean): void {
  canvas.fillTriangle(hx - 1, hy - 4, hx - 8 - hairSway, hy + 5, hx - 1, hy + 5, 12);
  canvas.fillEllipse(hx - 1, hy - 1, 4.4, 4.2, 12);
  canvas.drawLine(hx - 4, hy + 1, hx - 7 - hairSway, hy + 7, 12, 0.9);
  canvas.plot(hx - 2, hy - 4, 15);
  canvas.plot(hx, hy - 4, 15);

  canvas.fillEllipse(hx + 1, hy, 3.3, 3.6, 2);
  canvas.plot(hx - 2, hy, 2);

  if (blink) {
    canvas.drawLine(hx + 1, hy, hx + 3, hy, 1);
  } else {
    canvas.plot(hx + 1, hy - 1, 1);
    canvas.plot(hx + 3, hy - 1, 1);
    canvas.plot(hx + 2, hy - 1, 15);
  }
}

function drawMagusBody(
  canvas: PixelSpriteCanvas,
  tx: number,
  ty: number,
  capeBillow: number,
  hoverLift: number,
): void {
  canvas.fillTriangle(
    tx - 1,
    ty - 5,
    tx - 9 - capeBillow,
    29 - hoverLift,
    tx + 2,
    28 - hoverLift,
    5,
  );
  canvas.drawLine(tx - 2, ty - 2, tx - 7 - capeBillow, 27 - hoverLift, 6, 0.6);

  canvas.drawLine(tx - 1, ty + 4, tx - 2, 28 - hoverLift, 9, 1.0);
  canvas.drawLine(tx + 2, ty + 4, tx + 3, 28 - hoverLift, 9, 1.0);
  canvas.fillRoundedRect(tx - 3, 27 - hoverLift, 4, 4, 9);
  canvas.fillRoundedRect(tx + 1, 27 - hoverLift, 4, 4, 9);

  canvas.fillRoundedRect(tx - 3, ty - 4, 7, 9, 5);
  canvas.fillRect(tx - 1, ty - 2, 3, 3, 3);
  canvas.plot(tx, ty - 1, 8);
  canvas.fillRect(tx - 3, ty + 2, 7, 2, 7);

  canvas.fillTriangle(tx - 4, ty - 4, tx - 5, ty - 9, tx - 1, ty - 4, 5);
  canvas.fillTriangle(tx + 4, ty - 4, tx + 5, ty - 8, tx + 1, ty - 4, 3);
  canvas.plot(tx, ty - 4, 7);
}

function renderMagusFrame(pose: ChronoPose): IndexedFrame {
  const canvas = new PixelSpriteCanvas(24, 32);
  const hoverLift = pose.action === 'walk' || pose.action === 'jump' ? 2 : pose.phase % 2;
  const tx = 10 + pose.leanX;
  const ty = 19 + pose.bobY - (pose.action === 'jump' ? 1 : 0);
  const hx = tx;
  const hy = ty - 9;

  const capeBillow = pose.action === 'smashBurst' || pose.action === 'jump' ? 2 : pose.phase % 2;
  drawMagusBody(canvas, tx, ty, capeBillow, hoverLift);

  if (pose.action === 'windup') {
    canvas.drawLine(tx - 2, ty - 2, tx - 4, ty - 6, 5, 0.8);
    canvas.plot(tx - 4, ty - 6, 2);
    drawCrescentScythe(canvas, tx - 4, ty - 6, tx - 2, 4, false);
  } else if (pose.action === 'strike') {
    canvas.drawLine(tx + 2, ty - 2, tx + 6, ty - 1, 5, 0.8);
    canvas.plot(tx + 6, ty - 1, 2);
    drawCrescentScythe(canvas, tx + 6, ty - 1, tx + 11, ty - 6 + pose.phase * 4, true);
    canvas.drawArc(tx + 6, ty - 1, 6.5, 7.5, -60, 55, 13, 0.7);
    canvas.drawArc(tx + 7, ty - 1, 5.0, 6.0, -40, 40, 14, 0.4);
  } else if (pose.action === 'smashCharge') {
    canvas.drawLine(tx + 2, ty - 2, tx + 6, ty - 5, 5, 0.8);
    canvas.plot(tx + 6, ty - 5, 2);
    canvas.fillEllipse(18, 12, 3.2, 3.2, 13);
    canvas.fillEllipse(18, 12, 1.5, 1.5, 15);
    canvas.drawArc(18, 12, 4.6, 4.6, 0, 220, 14, 0.5);
  } else if (pose.action === 'smashBurst') {
    canvas.drawLine(tx + 2, ty - 2, tx + 7, ty - 2, 5, 0.8);
    canvas.plot(tx + 7, ty - 2, 2);
    canvas.fillEllipse(19, 15, 4.8, 4.8, 4);
    canvas.fillEllipse(19, 15, 3.6, 3.6, 13);
    canvas.fillEllipse(19, 15, 2.0, 2.0, 14);
    canvas.plot(19, 15, 15);
    canvas.drawArc(19, 15, 5.4, 5.4, pose.phase * 50, pose.phase * 50 + 210, 14, 0.5);
  } else if (pose.action === 'cast') {
    canvas.drawLine(tx + 2, ty - 2, tx + 6, ty - 4, 5, 0.8);
    canvas.plot(tx + 6, ty - 4, 2);
    canvas.drawLine(tx - 2, ty - 2, tx - 5, ty - 5, 5, 0.8);
    canvas.plot(tx - 5, ty - 5, 2);
    canvas.fillEllipse(19, 13, 3.4, 3.4, 13);
    canvas.fillEllipse(19, 13, 1.8, 1.8, 14);
    canvas.plot(19, 13, 15);
    canvas.plot(tx - 5, ty - 8, 14);
    canvas.plot(tx + 6, ty - 8, 13);
  } else if (pose.action === 'hurt') {
    canvas.drawLine(tx - 2, ty - 2, tx - 6, ty - 5, 5, 0.8);
    canvas.drawLine(tx + 3, ty - 2, tx + 7, ty - 5, 5, 0.8);
    canvas.plot(tx - 6, ty - 5, 2);
    canvas.plot(tx + 7, ty - 5, 2);
  } else {
    canvas.drawLine(tx + 2, ty - 2, tx + 6, ty + 1, 5, 0.8);
    canvas.plot(tx + 6, ty + 1, 2);
    drawCrescentScythe(canvas, tx + 6, ty + 1, tx + 7, 5, false);
  }

  drawMagusHead(canvas, hx, hy, capeBillow, Boolean(pose.blink));
  canvas.applyCelShading(MAGUS_SHADES);
  canvas.applyAutoOutline(1, [13, 14, 15]);
  return canvas.toFrame();
}

export const ROBO_DUAL_ERA = buildDualEraSpriteCharts(
  CHRONO_POSES,
  CHRONO_TICKS,
  renderRoboFrame,
  { width: 16, height: 24 },
);

export const MAGUS_DUAL_ERA = buildDualEraSpriteCharts(
  CHRONO_POSES,
  CHRONO_TICKS,
  renderMagusFrame,
  { width: 16, height: 24 },
);
