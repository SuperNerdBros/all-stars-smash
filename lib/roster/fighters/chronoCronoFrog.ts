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

const CRONO_SHADES: readonly ShadePair[] = [
  { base: 3, shadow: 4 },
  { base: 5, shadow: 6 },
  { base: 10, shadow: 11 },
];

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

function drawKatana(
  canvas: PixelSpriteCanvas,
  hiltX: number,
  hiltY: number,
  tipX: number,
  tipY: number,
  electrified: boolean,
): void {
  canvas.drawLine(hiltX, hiltY, tipX, tipY, 10, 0.45);
  canvas.drawLine(hiltX + 1, hiltY - 1, tipX, tipY, 15, 0);
  canvas.fillRect(hiltX - 1, hiltY - 1, 3, 2, 7);
  canvas.plot(hiltX - 2, hiltY + 1, 9);
  if (electrified) {
    canvas.drawLine(hiltX + 1, hiltY - 2, tipX, tipY - 1, 13, 0);
    canvas.plot(tipX, tipY, 15);
    canvas.plot(Math.round((hiltX + tipX) * 0.5), Math.round((hiltY + tipY) * 0.5) - 2, 14);
  }
}

function drawCronoHead(
  canvas: PixelSpriteCanvas,
  hx: number,
  hy: number,
  windOffset: number,
  blink: boolean,
): void {
  canvas.fillTriangle(hx - 2, hy - 2, hx - 8, hy - 6 + windOffset, hx + 1, hy - 4, 12);
  canvas.fillTriangle(hx - 2, hy - 3, hx - 5, hy - 9, hx + 1, hy - 4, 3);
  canvas.fillTriangle(hx - 1, hy - 4, hx, hy - 10, hx + 3, hy - 4, 3);
  canvas.fillTriangle(hx + 1, hy - 4, hx + 6, hy - 9, hx + 5, hy - 3, 3);
  canvas.fillTriangle(hx - 3, hy - 1, hx - 8, hy - 1 + windOffset, hx - 2, hy + 2, 12);

  canvas.plot(hx - 5, hy - 5 + windOffset, 8);
  canvas.plot(hx - 3, hy - 7, 8);
  canvas.plot(hx, hy - 8, 8);
  canvas.plot(hx + 4, hy - 7, 8);
  canvas.plot(hx - 6, hy - 1 + windOffset, 8);

  canvas.fillEllipse(hx, hy, 4.0, 3.8, 2);
  canvas.fillRect(hx - 3, hy - 3, 7, 2, 10);
  canvas.drawLine(hx - 4, hy - 2, hx - 8, hy + windOffset, 10);
  canvas.plot(hx - 7, hy + 1 + windOffset, 11);

  if (blink) {
    canvas.drawLine(hx + 1, hy, hx + 3, hy, 1);
  } else {
    canvas.fillRect(hx + 1, hy - 1, 1, 2, 1);
    canvas.plot(hx + 2, hy - 1, 15);
    canvas.fillRect(hx + 3, hy - 1, 1, 2, 1);
  }
}

function drawCronoBody(
  canvas: PixelSpriteCanvas,
  tx: number,
  ty: number,
  stride: number,
  liftBack: number,
  liftFront: number,
  scarfWave: number,
): void {
  canvas.drawLine(tx - 1, ty + 4, tx - 2 - stride, 28 - liftBack, 5, 1.0);
  canvas.drawLine(tx + 2, ty + 4, tx + 2 + stride, 28 - liftFront, 5, 1.0);
  canvas.fillRoundedRect(tx - 4 - stride, 27 - liftBack, 4, 4, 9);
  canvas.fillRoundedRect(tx + stride, 27 - liftFront, 4, 4, 9);
  canvas.fillRect(tx - 3 - stride, 27 - liftBack, 3, 1, 10);
  canvas.fillRect(tx + stride, 27 - liftFront, 3, 1, 10);

  canvas.fillRoundedRect(tx - 3, ty - 4, 7, 9, 5);
  canvas.fillRect(tx - 3, ty + 1, 7, 2, 9);
  canvas.fillRect(tx, ty + 1, 2, 2, 7);

  canvas.fillRect(tx - 3, ty - 5, 7, 2, 7);
  canvas.drawLine(tx - 3, ty - 4, tx - 9, ty - 1 + scarfWave, 7, 0.7);
  canvas.drawLine(tx - 4, ty - 3, tx - 8, ty + 1 + scarfWave, 8, 0.5);
}

function renderCronoFrame(pose: HeroPose): IndexedFrame {
  const canvas = new PixelSpriteCanvas(24, 32);
  const tx = 10 + pose.leanX;
  const ty = 19 + pose.bobY;
  const hx = tx;
  const hy = ty - 9;

  const { stride, liftBack, liftFront } = computeFootKinematics(pose);
  const scarfWave = pose.phase % 2 === 0 ? 0 : 1;

  drawCronoBody(canvas, tx, ty, stride, liftBack, liftFront, scarfWave);

  if (pose.action === 'windup') {
    canvas.drawLine(tx - 2, ty - 2, tx - 5, ty - 6, 5, 0.8);
    canvas.plot(tx - 5, ty - 6, 2);
    drawKatana(canvas, tx - 5, ty - 6, tx - 2, ty - 15, false);
  } else if (pose.action === 'slash') {
    canvas.drawLine(tx + 2, ty - 2, tx + 7, ty - 2, 5, 0.8);
    canvas.plot(tx + 7, ty - 2, 2);
    drawKatana(canvas, tx + 7, ty - 2, tx + 13, ty - 6 + pose.phase * 4, true);
    canvas.drawArc(tx + 7, ty - 2, 6, 7, -65, 55, 13, 0.6);
    canvas.drawArc(tx + 8, ty - 2, 5, 6, -45, 35, 15, 0.3);
  } else if (pose.action === 'smashCharge') {
    canvas.drawLine(tx - 2, ty - 2, tx - 5, ty - 7, 5, 0.8);
    canvas.plot(tx - 5, ty - 7, 2);
    drawKatana(canvas, tx - 5, ty - 7, tx - 8, ty - 14, true);
    canvas.drawArc(tx, ty - 4, 8, 9, -150, -30, 14, 0.5);
  } else if (pose.action === 'smashSweep') {
    canvas.drawLine(tx + 2, ty - 2, tx + 7, ty - 1, 5, 0.8);
    canvas.plot(tx + 7, ty - 1, 2);
    drawKatana(canvas, tx + 7, ty - 1, 23, ty - 2, true);
    canvas.drawArc(tx + 6, ty - 3, 8, 9, -80, 70, 13, 0.9);
    canvas.drawArc(tx + 7, ty - 3, 6.5, 7.5, -60, 50, 14, 0.6);
    canvas.drawArc(tx + 8, ty - 3, 5, 6, -40, 35, 15, 0.4);
  } else if (pose.action === 'cast') {
    canvas.drawLine(tx + 2, ty - 3, tx + 5, ty - 9, 5, 0.8);
    canvas.plot(tx + 5, ty - 9, 2);
    drawKatana(canvas, tx + 5, ty - 9, tx + 5, 2, true);
    canvas.drawLine(tx + 5, 1, tx + 3, 5, 14, 0.4);
    canvas.drawLine(tx + 5, 3, tx + 8, 7, 13, 0.4);
    canvas.drawLine(tx + 8, 7, tx + 6, 12, 15, 0.4);
    canvas.plot(tx + 2, 11, 14);
    canvas.plot(tx + 9, 13, 13);
  } else if (pose.action === 'hurt') {
    canvas.drawLine(tx - 2, ty - 2, tx - 6, ty - 5, 5, 0.8);
    canvas.drawLine(tx + 3, ty - 2, tx + 7, ty - 4, 5, 0.8);
    canvas.plot(tx - 6, ty - 5, 2);
    canvas.plot(tx + 7, ty - 4, 2);
  } else {
    canvas.drawLine(tx - 2, ty - 2, tx - 4, ty + 1, 5, 0.8);
    canvas.drawLine(tx + 3, ty - 2, tx + 5, ty + 1, 5, 0.8);
    canvas.plot(tx + 5, ty + 1, 2);
    drawKatana(canvas, tx + 5, ty + 1, tx + 11, ty - 7, false);
  }

  drawCronoHead(canvas, hx, hy, scarfWave, Boolean(pose.blink));
  canvas.applyCelShading(CRONO_SHADES);
  canvas.applyAutoOutline(1, [13, 14, 15]);
  return canvas.toFrame();
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

export const CRONO_DUAL_ERA = buildDualEraSpriteCharts(
  HERO_POSES,
  HERO_TICKS,
  renderCronoFrame,
  { width: 16, height: 24 },
);

export const FROG_DUAL_ERA = buildDualEraSpriteCharts(
  HERO_POSES,
  HERO_TICKS,
  renderFrogFrame,
  { width: 16, height: 24 },
);
