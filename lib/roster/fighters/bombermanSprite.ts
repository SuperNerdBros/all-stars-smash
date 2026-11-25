import type { AnimState, IndexedFrame } from '../../types/palette';
import {
  buildDualEraSpriteCharts,
  PixelSpriteCanvas,
  type ShadePair,
} from '../classicSpriteCanvas';

type BomberMode = 'idle' | 'walk' | 'jump' | 'punch' | 'bombHold' | 'bombBlast' | 'bombToss' | 'hurt';

interface BomberPose {
  readonly mode: BomberMode;
  readonly leanX: number;
  readonly bobY: number;
  readonly phase: number;
  readonly blink?: boolean;
}

const BOMBER_SHADES: readonly ShadePair[] = [
  { base: 3, shadow: 4 },
  { base: 5, shadow: 6 },
  { base: 8, shadow: 9 },
];

const BOMBER_POSES: Record<AnimState, readonly BomberPose[]> = {
  idle: [
    { mode: 'idle', leanX: 0, bobY: 0, phase: 0 },
    { mode: 'idle', leanX: 0, bobY: 1, phase: 1 },
    { mode: 'idle', leanX: 0, bobY: 0, phase: 2, blink: true },
  ],
  walk: [
    { mode: 'walk', leanX: 1, bobY: 0, phase: 0 },
    { mode: 'walk', leanX: 1, bobY: 1, phase: 1 },
    { mode: 'walk', leanX: 1, bobY: 0, phase: 2 },
    { mode: 'walk', leanX: 1, bobY: 1, phase: 3 },
  ],
  jump: [
    { mode: 'jump', leanX: 0, bobY: -1, phase: 0 },
    { mode: 'jump', leanX: 1, bobY: 0, phase: 1 },
  ],
  attack: [
    { mode: 'idle', leanX: -1, bobY: 1, phase: 0 },
    { mode: 'punch', leanX: 2, bobY: 0, phase: 1 },
    { mode: 'bombToss', leanX: 2, bobY: 0, phase: 2 },
  ],
  smash: [
    { mode: 'bombHold', leanX: -1, bobY: 1, phase: 0 },
    { mode: 'bombHold', leanX: 0, bobY: 0, phase: 1 },
    { mode: 'bombBlast', leanX: 1, bobY: 0, phase: 2 },
  ],
  special: [
    { mode: 'bombHold', leanX: -1, bobY: 0, phase: 0 },
    { mode: 'bombToss', leanX: 2, bobY: 0, phase: 1 },
    { mode: 'bombToss', leanX: 2, bobY: 1, phase: 2 },
  ],
  hurt: [
    { mode: 'hurt', leanX: -2, bobY: 0, phase: 0 },
    { mode: 'hurt', leanX: -3, bobY: 1, phase: 1 },
  ],
};

const BOMBER_TICKS: Record<AnimState, number> = {
  idle: 14,
  walk: 5,
  jump: 9,
  attack: 4,
  smash: 6,
  special: 5,
  hurt: 8,
};

function drawClassicBomb(
  canvas: PixelSpriteCanvas,
  bx: number,
  by: number,
  radius: number,
  sparkPhase: number,
): void {
  canvas.fillEllipse(bx, by, radius, radius, 11);
  canvas.fillEllipse(bx - radius * 0.3, by - radius * 0.3, radius * 0.38, radius * 0.35, 12);
  canvas.plot(bx - radius * 0.35, by - radius * 0.4, 15);
  canvas.fillRect(bx - 1, by - radius - 1, 3, 2, 7);
  canvas.drawLine(bx, by - radius - 2, bx + 2, by - radius - 4, 2);

  const sx = bx + 3;
  const sy = by - radius - 4;
  canvas.plot(sx, sy, 15);
  canvas.plot(sx - 1, sy, 14);
  canvas.plot(sx + 1, sy, 14);
  canvas.plot(sx, sy - 1, 13);
  canvas.plot(sx, sy + 1, 13);
  if (sparkPhase % 2 === 0) {
    canvas.plot(sx + 2, sy - 1, 14);
    canvas.plot(sx + 1, sy - 2, 13);
  } else {
    canvas.plot(sx + 2, sy + 1, 13);
    canvas.plot(sx - 1, sy - 2, 14);
  }
}

function drawBomberHead(
  canvas: PixelSpriteCanvas,
  hx: number,
  hy: number,
  antennaShift: number,
  expression: 'normal' | 'blink' | 'fierce' | 'hurt',
): void {
  canvas.drawLine(hx, hy - 5, hx + antennaShift, hy - 8, 1);
  canvas.fillEllipse(hx + antennaShift, hy - 9, 2.2, 2.0, 8);
  canvas.plot(hx + antennaShift - 1, hy - 10, 10);

  canvas.fillEllipse(hx, hy, 6.6, 5.4, 3);
  canvas.drawArc(hx - 1, hy - 1, 5.0, 3.8, -145, -55, 10);

  canvas.fillRoundedRect(hx - 2, hy - 2, 8, 5, 2);
  canvas.drawLine(hx - 2, hy - 3, hx + 5, hy - 3, 1);
  canvas.drawLine(hx - 2, hy + 3, hx + 5, hy + 3, 1);

  if (expression === 'blink') {
    canvas.drawLine(hx, hy, hx + 1, hy, 1);
    canvas.drawLine(hx + 3, hy, hx + 4, hy, 1);
  } else if (expression === 'hurt') {
    canvas.plot(hx, hy - 1, 1);
    canvas.plot(hx + 1, hy, 1);
    canvas.plot(hx, hy + 1, 1);
    canvas.plot(hx + 4, hy - 1, 1);
    canvas.plot(hx + 3, hy, 1);
    canvas.plot(hx + 4, hy + 1, 1);
  } else {
    canvas.fillRect(hx, hy - 1, 1, 3, 1);
    canvas.fillRect(hx + 4, hy - 1, 1, 3, 1);
    if (expression === 'fierce') {
      canvas.plot(hx + 1, hy - 1, 1);
      canvas.plot(hx + 3, hy - 1, 1);
    }
  }
}

function drawBomberMitten(canvas: PixelSpriteCanvas, mx: number, my: number): void {
  canvas.fillEllipse(mx, my, 2.2, 2.0, 8);
  canvas.plot(mx - 1, my - 1, 10);
}

function drawBomberBoot(canvas: PixelSpriteCanvas, bx: number, by: number): void {
  canvas.fillEllipse(bx + 1, by, 3.2, 2.0, 8);
  canvas.fillRect(bx - 2, by + 1, 6, 1, 9);
  canvas.plot(bx, by - 1, 10);
}

function drawBomberTorso(canvas: PixelSpriteCanvas, tx: number, ty: number): void {
  canvas.fillEllipse(tx, ty, 4.6, 4.8, 5);
  canvas.fillRect(tx - 4, ty + 1, 9, 2, 1);
  canvas.fillRect(tx, ty + 1, 3, 2, 7);
  canvas.plot(tx + 1, ty + 1, 15);
}

function resolveAntennaSway(pose: BomberPose): number {
  if (pose.mode === 'walk') {
    return pose.phase % 2 === 0 ? -1 : 1;
  }
  if (pose.mode === 'hurt') {
    return -2;
  }
  return 0;
}

function resolveWalkStride(phase: number): number {
  if (phase === 0) return 3;
  if (phase === 2) return -3;
  return 0;
}

function renderBombermanFrame(pose: BomberPose): IndexedFrame {
  const canvas = new PixelSpriteCanvas(24, 32);
  const tx = 11 + pose.leanX;
  const ty = 21 + pose.bobY;
  const hx = tx;
  const hy = ty - 9;

  const antennaSway = resolveAntennaSway(pose);

  if (pose.mode === 'walk') {
    const stride = resolveWalkStride(pose.phase);
    const liftBack = pose.phase === 0 ? 2 : 0;
    const liftFront = pose.phase === 2 ? 2 : 0;
    canvas.drawLine(tx - 2, ty + 4, tx - 2 - stride, 29 - liftBack, 3, 0.9);
    canvas.drawLine(tx + 2, ty + 4, tx + 2 + stride, 29 - liftFront, 3, 0.9);
    drawBomberBoot(canvas, tx - 2 - stride, 29 - liftBack);
    drawBomberBoot(canvas, tx + 2 + stride, 29 - liftFront);
    drawBomberTorso(canvas, tx, ty);
    canvas.drawLine(tx - 4, ty - 1, tx - 5 + stride, ty + 2, 3, 0.8);
    drawBomberMitten(canvas, tx - 6 + stride, ty + 2);
    canvas.drawLine(tx + 4, ty - 1, tx + 5 - stride, ty + 2, 3, 0.8);
    drawBomberMitten(canvas, tx + 6 - stride, ty + 2);
    drawBomberHead(canvas, hx, hy, antennaSway, 'normal');
  } else if (pose.mode === 'jump') {
    canvas.drawLine(tx - 2, ty + 4, tx - 4, 27, 3, 0.9);
    canvas.drawLine(tx + 2, ty + 4, tx + 5, 26, 3, 0.9);
    drawBomberBoot(canvas, tx - 4, 27);
    drawBomberBoot(canvas, tx + 5, 26);
    drawBomberTorso(canvas, tx, ty);
    canvas.drawLine(tx - 4, ty - 2, tx - 7, ty - 6, 3, 0.8);
    drawBomberMitten(canvas, tx - 7, ty - 7);
    canvas.drawLine(tx + 4, ty - 2, tx + 7, ty - 6, 3, 0.8);
    drawBomberMitten(canvas, tx + 7, ty - 7);
    drawBomberHead(canvas, hx, hy, -1, 'normal');
  } else if (pose.mode === 'punch') {
    canvas.drawLine(tx - 2, ty + 4, tx - 3, 29, 3, 0.9);
    canvas.drawLine(tx + 2, ty + 4, tx + 4, 29, 3, 0.9);
    drawBomberBoot(canvas, tx - 3, 29);
    drawBomberBoot(canvas, tx + 4, 29);
    drawBomberTorso(canvas, tx, ty);
    canvas.drawLine(tx - 4, ty, tx - 6, ty + 1, 3, 0.8);
    drawBomberMitten(canvas, tx - 6, ty + 1);
    canvas.drawLine(tx + 4, ty - 1, tx + 9, ty - 1, 3, 0.9);
    drawBomberMitten(canvas, tx + 10, ty - 1);
    drawBomberHead(canvas, hx, hy, -1, 'fierce');
    canvas.plot(tx + 12, ty - 2, 14);
    canvas.plot(tx + 12, ty, 14);
  } else if (pose.mode === 'bombHold') {
    canvas.drawLine(tx - 2, ty + 4, tx - 3, 29, 3, 0.9);
    canvas.drawLine(tx + 2, ty + 4, tx + 3, 29, 3, 0.9);
    drawBomberBoot(canvas, tx - 3, 29);
    drawBomberBoot(canvas, tx + 3, 29);
    drawBomberTorso(canvas, tx, ty);
    drawBomberHead(canvas, hx, hy + 2, 0, 'fierce');
    canvas.drawLine(tx - 4, ty - 2, tx - 5, hy - 5, 3, 0.8);
    canvas.drawLine(tx + 4, ty - 2, tx + 5, hy - 5, 3, 0.8);
    drawBomberMitten(canvas, tx - 5, hy - 6);
    drawBomberMitten(canvas, tx + 5, hy - 6);
    drawClassicBomb(canvas, tx + 1, 6, 3.6, pose.phase);
  } else if (pose.mode === 'bombBlast') {
    canvas.drawLine(tx - 2, ty + 4, tx - 4, 29, 3, 0.9);
    canvas.drawLine(tx + 2, ty + 4, tx + 4, 29, 3, 0.9);
    drawBomberBoot(canvas, tx - 4, 29);
    drawBomberBoot(canvas, tx + 4, 29);
    drawBomberTorso(canvas, tx, ty);
    drawBomberHead(canvas, hx - 1, hy, -1, 'fierce');
    canvas.drawLine(tx + 3, ty - 1, tx + 7, ty - 3, 3, 0.8);
    drawBomberMitten(canvas, tx + 8, ty - 3);
    canvas.fillEllipse(19, 15, 4.5, 4.5, 13);
    canvas.fillEllipse(19, 15, 3.0, 3.0, 14);
    canvas.fillEllipse(19, 15, 1.5, 1.5, 15);
    canvas.fillRect(18, 7, 3, 16, 14);
    canvas.fillRect(13, 14, 11, 3, 14);
    canvas.fillRect(19, 9, 1, 12, 15);
    canvas.fillRect(14, 15, 10, 1, 15);
  } else if (pose.mode === 'bombToss') {
    canvas.drawLine(tx - 2, ty + 4, tx - 3, 29, 3, 0.9);
    canvas.drawLine(tx + 2, ty + 4, tx + 4, 29, 3, 0.9);
    drawBomberBoot(canvas, tx - 3, 29);
    drawBomberBoot(canvas, tx + 4, 29);
    drawBomberTorso(canvas, tx, ty);
    canvas.drawLine(tx - 4, ty, tx - 6, ty + 2, 3, 0.8);
    drawBomberMitten(canvas, tx - 6, ty + 2);
    canvas.drawLine(tx + 3, ty - 1, tx + 7, ty - 3, 3, 0.8);
    drawBomberMitten(canvas, tx + 7, ty - 3);
    drawBomberHead(canvas, hx, hy, -1, 'fierce');
    drawClassicBomb(canvas, 19, 15, 3.2, pose.phase);
  } else if (pose.mode === 'hurt') {
    canvas.drawLine(tx - 1, ty + 4, tx + 1, 28, 3, 0.9);
    canvas.drawLine(tx + 2, ty + 4, tx + 5, 27, 3, 0.9);
    drawBomberBoot(canvas, tx + 1, 28);
    drawBomberBoot(canvas, tx + 5, 27);
    drawBomberTorso(canvas, tx, ty);
    canvas.drawLine(tx - 4, ty - 1, tx - 7, ty - 5, 3, 0.8);
    drawBomberMitten(canvas, tx - 7, ty - 6);
    canvas.drawLine(tx + 4, ty - 1, tx + 7, ty - 5, 3, 0.8);
    drawBomberMitten(canvas, tx + 7, ty - 6);
    drawBomberHead(canvas, hx - 1, hy + 1, antennaSway, 'hurt');
  } else {
    canvas.drawLine(tx - 2, ty + 4, tx - 3, 29, 3, 0.9);
    canvas.drawLine(tx + 2, ty + 4, tx + 3, 29, 3, 0.9);
    drawBomberBoot(canvas, tx - 3, 29);
    drawBomberBoot(canvas, tx + 3, 29);
    drawBomberTorso(canvas, tx, ty);
    canvas.drawLine(tx - 4, ty, tx - 6, ty + 2, 3, 0.8);
    drawBomberMitten(canvas, tx - 6, ty + 2);
    canvas.drawLine(tx + 4, ty, tx + 6, ty + 2, 3, 0.8);
    drawBomberMitten(canvas, tx + 6, ty + 2);
    const expr = pose.blink ? 'blink' : 'normal';
    drawBomberHead(canvas, hx, hy, antennaSway, expr);
  }

  canvas.applyCelShading(BOMBER_SHADES);
  canvas.applyAutoOutline(1, [13, 14, 15]);
  return canvas.toFrame();
}

export const BOMBERMAN_DUAL_ERA = buildDualEraSpriteCharts(
  BOMBER_POSES,
  BOMBER_TICKS,
  renderBombermanFrame,
  { width: 16, height: 24 },
);
