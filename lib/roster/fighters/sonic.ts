import type { FighterBlueprint } from '../../types/fighter';
import type { AnimState, IndexedFrame, PalettePreset } from '../../types/palette';
import {
  buildDualEraSpriteCharts,
  PixelSpriteCanvas,
  type ShadePair,
} from '../classicSpriteCanvas';

type SonicAction =
  | 'stand'
  | 'hips'
  | 'peelout'
  | 'sparklePeelout'
  | 'spinball'
  | 'spindash'
  | 'crouch'
  | 'jab'
  | 'kick'
  | 'hurt';

interface SonicPose {
  readonly action: SonicAction;
  readonly leanX: number;
  readonly bobY: number;
  readonly phase: number;
  readonly blink?: boolean;
}

const SONIC_SHADES: readonly ShadePair[] = [
  { base: 3, shadow: 4 },
  { base: 2, shadow: 6 },
  { base: 8, shadow: 9 },
  { base: 10, shadow: 11 },
];

const SONIC_POSES: Record<AnimState, readonly SonicPose[]> = {
  idle: [
    { action: 'stand', leanX: 0, bobY: 0, phase: 0 },
    { action: 'hips', leanX: 0, bobY: 0, phase: 1 },
    { action: 'stand', leanX: 0, bobY: 1, phase: 2, blink: true },
  ],
  walk: [
    { action: 'peelout', leanX: 1, bobY: 1, phase: 0 },
    { action: 'peelout', leanX: 2, bobY: 0, phase: 1 },
    { action: 'peelout', leanX: 1, bobY: 1, phase: 2 },
    { action: 'peelout', leanX: 2, bobY: 0, phase: 3 },
  ],
  jump: [
    { action: 'spinball', leanX: 0, bobY: 0, phase: 0 },
    { action: 'spinball', leanX: 0, bobY: 0, phase: 1 },
    { action: 'spinball', leanX: 0, bobY: 0, phase: 2 },
  ],
  attack: [
    { action: 'crouch', leanX: -1, bobY: 1, phase: 0 },
    { action: 'jab', leanX: 2, bobY: 0, phase: 1 },
    { action: 'kick', leanX: 2, bobY: 0, phase: 2 },
  ],
  smash: [
    { action: 'crouch', leanX: -1, bobY: 1, phase: 0 },
    { action: 'sparklePeelout', leanX: 2, bobY: 0, phase: 1 },
    { action: 'sparklePeelout', leanX: 2, bobY: 0, phase: 2 },
  ],
  special: [
    { action: 'spindash', leanX: 0, bobY: 0, phase: 0 },
    { action: 'spindash', leanX: 1, bobY: 0, phase: 1 },
    { action: 'spindash', leanX: 0, bobY: 0, phase: 2 },
  ],
  hurt: [
    { action: 'hurt', leanX: -2, bobY: 0, phase: 0 },
    { action: 'hurt', leanX: -3, bobY: 1, phase: 1 },
  ],
};

const SONIC_TICKS: Record<AnimState, number> = {
  idle: 14,
  walk: 3,
  jump: 3,
  attack: 4,
  smash: 4,
  special: 3,
  hurt: 8,
};

function drawFourPointStar(canvas: PixelSpriteCanvas, cx: number, cy: number, color: number): void {
  canvas.plot(cx, cy, 15);
  canvas.plot(cx - 1, cy, color);
  canvas.plot(cx + 1, cy, color);
  canvas.plot(cx, cy - 1, color);
  canvas.plot(cx, cy + 1, color);
  canvas.plot(cx - 2, cy, 14);
  canvas.plot(cx + 2, cy, 14);
  canvas.plot(cx, cy - 2, 14);
  canvas.plot(cx, cy + 2, 14);
}

function drawSonicSneaker(
  canvas: PixelSpriteCanvas,
  footX: number,
  footY: number,
  toeLift = 0,
): void {
  canvas.fillRect(footX - 1, footY - 4, 3, 2, 10);
  canvas.plot(footX - 1, footY - 3, 11);
  canvas.fillEllipse(footX + 1.5, footY - 1, 4.4, 2.0, 8);
  canvas.fillRect(footX - 2, footY, 7, 1, 9);
  const liftedToe = toeLift > 0;
  if (liftedToe) {
    canvas.fillEllipse(footX + 4.5, footY - 1 - toeLift, 2.0, 1.5, 8);
  }
  canvas.drawLine(footX + 1, footY - 3, footX + 2, footY, 10, 0.45);
  canvas.plot(footX + 3, footY - 1, 7);
  canvas.plot(footX + 4, footY - 2, 15);
}

function drawSonicHead(
  canvas: PixelSpriteCanvas,
  hx: number,
  hy: number,
  sweptBack: boolean,
  blink: boolean,
  shocked: boolean,
): void {
  const drop = sweptBack ? 1 : 0;
  canvas.fillTriangle(hx - 1, hy - 5, hx - 10, hy - 3 + drop, hx - 2, hy, 3);
  canvas.fillTriangle(hx - 1, hy - 1, hx - 11, hy + 2 + drop, hx - 2, hy + 3, 3);
  canvas.fillTriangle(hx - 2, hy + 2, hx - 9, hy + 6 + drop, hx - 1, hy + 5, 4);

  canvas.drawLine(hx - 3, hy - 4, hx - 9, hy - 3 + drop, 13);
  canvas.drawLine(hx - 3, hy, hx - 9, hy + 1 + drop, 13);
  canvas.drawLine(hx - 4, hy + 3, hx - 8, hy + 4 + drop, 12);

  canvas.fillTriangle(hx - 2, hy - 4, hx - 4, hy - 8, hx + 1, hy - 5, 3);
  canvas.plot(hx - 2, hy - 6, 2);
  canvas.fillTriangle(hx + 2, hy - 4, hx + 3, hy - 8, hx + 5, hy - 4, 3);
  canvas.plot(hx + 3, hy - 6, 2);

  canvas.fillEllipse(hx, hy, 5.4, 5.0, 3);
  canvas.fillEllipse(hx - 1, hy - 2.5, 2.4, 1.4, 13);
  canvas.plot(hx - 1, hy - 3, 15);

  canvas.fillEllipse(hx + 3.0, hy - 0.5, 2.5, 3.0, 15);
  canvas.fillEllipse(hx + 4.9, hy - 0.5, 1.4, 2.5, 15);
  canvas.drawLine(hx + 1, hy - 3, hx + 5, hy - 3, 3);

  if (blink) {
    canvas.drawLine(hx + 2, hy, hx + 6, hy, 1);
  } else if (shocked) {
    canvas.fillRect(hx + 3, hy - 1, 1, 2, 1);
    canvas.fillRect(hx + 5, hy - 1, 1, 2, 1);
  } else {
    canvas.fillRect(hx + 3, hy - 2, 1, 3, 1);
    canvas.fillRect(hx + 5, hy - 2, 1, 3, 1);
    canvas.plot(hx + 3, hy - 2, 15);
    canvas.plot(hx + 5, hy - 2, 15);
  }

  canvas.fillEllipse(hx + 3.4, hy + 3.1, 4.0, 2.0, 2);
  canvas.drawLine(hx + 1, hy + 4.6, hx + 6, hy + 4.4, 6);
  canvas.fillEllipse(hx + 7.4, hy + 1.6, 1.3, 0.9, 1);
  canvas.plot(hx + 7, hy + 1, 15);
}

function drawSonicTorso(canvas: PixelSpriteCanvas, tx: number, ty: number): void {
  canvas.fillTriangle(tx - 2, ty - 2, tx - 7, ty - 1, tx - 2, ty + 2, 4);
  canvas.fillEllipse(tx, ty, 3.8, 4.4, 3);
  canvas.fillEllipse(tx + 1.5, ty + 0.5, 2.3, 2.7, 2);
  canvas.plot(tx + 1, ty + 2, 6);
  canvas.plot(tx + 2, ty + 2, 6);
}

function drawSonicGlove(canvas: PixelSpriteCanvas, gx: number, gy: number, large = false): void {
  const rx = large ? 3.0 : 2.2;
  const ry = large ? 2.5 : 2.0;
  canvas.fillEllipse(gx, gy, rx, ry, 10);
  canvas.plot(gx - 1, gy + 1, 11);
  canvas.plot(gx, gy + 1, 11);
  canvas.plot(gx + 1, gy - 1, 15);
}

function drawSheetPeelOutLegs(
  canvas: PixelSpriteCanvas,
  cx: number,
  cy: number,
  phase: number,
  withSparkles: boolean,
): void {
  const phaseEven = phase % 2 === 0;
  const leftRadiusX = phaseEven ? 6.5 : 5.2;
  const rightRadiusX = phaseEven ? 5.2 : 6.5;

  canvas.drawArc(cx - 4, cy, leftRadiusX, 3.6, 110, 315, 8, 1.1);
  canvas.drawArc(cx + 4, cy, rightRadiusX, 3.6, -40, 170, 8, 1.1);
  canvas.drawArc(cx - 4, cy + 1, leftRadiusX - 0.8, 2.8, 130, 290, 9, 0.8);
  canvas.drawArc(cx + 4, cy + 1, rightRadiusX - 0.8, 2.8, -20, 150, 9, 0.8);

  const highlightStart = phase * 75;
  canvas.drawArc(cx - 3, cy, 4.4, 2.4, highlightStart, highlightStart + 115, 7, 0.7);
  canvas.drawArc(cx + 3, cy, 4.4, 2.4, highlightStart + 180, highlightStart + 295, 7, 0.7);
  canvas.drawArc(cx, cy - 1, 3.8, 2.0, highlightStart + 45, highlightStart + 130, 10, 0.5);

  if (withSparkles) {
    const sx = phase % 2 === 0 ? 0 : 2;
    drawFourPointStar(canvas, 5 + sx, 11, 14);
    drawFourPointStar(canvas, 27 - sx, 8, 14);
    drawFourPointStar(canvas, 7, 25 - sx, 7);
    drawFourPointStar(canvas, 25, 22 + sx, 14);
  }
}

function drawSheetSpinBall(canvas: PixelSpriteCanvas, cx: number, cy: number, phase: number): void {
  const radius = 9.0;
  canvas.fillEllipse(cx, cy, radius, radius, 3);
  canvas.drawArc(cx, cy, radius - 0.5, radius - 0.5, 35, 165, 4, 1.6);
  canvas.drawArc(cx, cy, radius - 1.2, radius - 1.2, 60, 150, 12, 1.0);
  canvas.fillEllipse(cx - 1.5, cy - 2.0, 5.5, 4.8, 13);
  canvas.fillEllipse(cx + 1.5, cy + 1.5, 5.2, 4.8, 3);

  const angle = (phase * 110 * Math.PI) / 180;
  const gleamX = cx + Math.cos(angle) * 3.5;
  const gleamY = cy + Math.sin(angle) * 3.5;
  canvas.fillEllipse(gleamX, gleamY, 1.6, 1.6, 15);
  canvas.plot(cx - 3, cy - 4, 15);
}

function drawSheetSpinDash(canvas: PixelSpriteCanvas, cx: number, cy: number, phase: number): void {
  canvas.fillEllipse(cx + 2, cy - 1, 7.6, 6.4, 3);
  canvas.fillEllipse(cx + 4, cy - 4, 5.4, 4.2, 3);
  canvas.fillEllipse(cx + 1, cy + 1, 6.2, 5.0, 4);
  canvas.fillEllipse(cx + 2, cy - 2, 5.4, 4.2, 13);
  canvas.fillEllipse(cx + 3, cy, 4.5, 3.8, 3);

  const starX = cx + 5 + (phase % 2);
  const starY = cy - 4 + (phase === 1 ? 1 : 0);
  drawFourPointStar(canvas, starX, starY, 13);

  const dustShift = phase * 2;
  canvas.fillEllipse(cx - 7, cy + 5, 4.5, 2.2, 10);
  canvas.fillEllipse(cx - 11 + (dustShift % 3), cy + 6, 3.4, 1.6, 15);
  canvas.fillEllipse(cx - 9, cy + 2 - (phase % 2), 2.2, 1.6, 15);
  canvas.plot(cx - 13, cy + 3 + (phase % 2), 10);
  canvas.plot(cx - 12, cy + 1, 15);
}

function renderSonicFrame(pose: SonicPose): IndexedFrame {
  const canvas = new PixelSpriteCanvas(32, 32);

  if (pose.action === 'spinball') {
    drawSheetSpinBall(canvas, 16, 18, pose.phase);
    canvas.applyAutoOutline(1, [14, 15]);
    return canvas.toFrame();
  }

  if (pose.action === 'spindash') {
    drawSheetSpinDash(canvas, 17 + pose.leanX, 21, pose.phase);
    canvas.applyAutoOutline(1, [14, 15]);
    return canvas.toFrame();
  }

  const tx = 15 + pose.leanX;
  const ty = 19 + pose.bobY;
  const hx = tx + 1;
  const hy = ty - 9;

  if (pose.action === 'peelout' || pose.action === 'sparklePeelout') {
    const withSparkles = pose.action === 'sparklePeelout';
    drawSheetPeelOutLegs(canvas, tx + 1, 26, pose.phase, withSparkles);
    drawSonicTorso(canvas, tx, ty + 1);
    canvas.drawLine(tx - 2, ty, tx - 7, ty + 1, 2, 0.8);
    drawSonicGlove(canvas, tx - 7, ty + 1);
    canvas.drawLine(tx + 3, ty, tx + 7, ty + 2, 2, 0.8);
    drawSonicGlove(canvas, tx + 7, ty + 2);
    drawSonicHead(canvas, hx + 2, hy + 2, true, false, false);
  } else if (pose.action === 'crouch') {
    drawSonicSneaker(canvas, tx - 3, 29);
    drawSonicSneaker(canvas, tx + 4, 29);
    canvas.fillTriangle(tx - 2, ty - 2, tx - 9, ty - 5, tx + 1, ty + 2, 3);
    canvas.fillTriangle(tx - 1, ty - 3, tx - 4, ty - 11, tx + 4, ty - 2, 3);
    canvas.fillTriangle(tx + 2, ty - 2, tx + 5, ty - 9, tx + 7, ty + 2, 3);
    canvas.fillEllipse(tx + 1, ty + 2, 5.5, 4.8, 3);
    canvas.fillEllipse(tx + 1, ty, 3.2, 2.0, 13);
    drawSonicGlove(canvas, tx - 2, ty + 2);
    canvas.plot(tx + 4, ty, 15);
    canvas.plot(tx + 5, ty, 1);
  } else if (pose.action === 'jab') {
    canvas.drawLine(tx - 2, ty + 3, tx - 4, 28, 3, 1.0);
    canvas.drawLine(tx + 2, ty + 3, tx + 5, 28, 3, 1.0);
    drawSonicSneaker(canvas, tx - 4, 29);
    drawSonicSneaker(canvas, tx + 5, 29);
    drawSonicTorso(canvas, tx, ty);
    canvas.drawLine(tx - 2, ty, tx - 6, ty + 2, 2, 0.8);
    drawSonicGlove(canvas, tx - 6, ty + 2);
    canvas.drawLine(tx + 2, ty - 1, tx + 9, ty - 1, 2, 0.9);
    drawSonicGlove(canvas, tx + 10, ty - 1, true);
    drawSonicHead(canvas, hx + 1, hy, true, false, false);
    drawFourPointStar(canvas, tx + 12, ty - 2, 14);
  } else if (pose.action === 'kick') {
    canvas.drawLine(tx - 2, ty + 3, tx - 3, 28, 3, 1.0);
    drawSonicSneaker(canvas, tx - 3, 29);
    canvas.drawLine(tx + 2, ty + 2, tx + 9, ty - 2, 3, 1.1);
    drawSonicSneaker(canvas, tx + 9, ty - 1, 1);
    drawSonicTorso(canvas, tx, ty);
    canvas.drawLine(tx - 3, ty, tx - 7, ty + 1, 2, 0.8);
    drawSonicGlove(canvas, tx - 7, ty + 1);
    drawSonicHead(canvas, hx, hy, true, false, false);
    canvas.drawArc(tx + 8, ty - 2, 6, 5, -60, 35, 7, 0.7);
    drawFourPointStar(canvas, tx + 11, ty - 4, 14);
  } else if (pose.action === 'hurt') {
    canvas.drawLine(tx - 1, ty + 3, tx + 4, 26, 3, 1.0);
    canvas.drawLine(tx + 2, ty + 2, tx + 9, 23, 3, 1.0);
    drawSonicSneaker(canvas, tx + 4, 27);
    drawSonicSneaker(canvas, tx + 9, 24, 2);
    drawSonicTorso(canvas, tx, ty);
    canvas.drawLine(tx - 3, ty - 1, tx - 7, ty - 4, 2, 0.8);
    drawSonicGlove(canvas, tx - 7, ty - 5);
    canvas.drawLine(tx + 3, ty - 1, tx + 8, ty - 3, 2, 0.8);
    drawSonicGlove(canvas, tx + 9, ty - 4);
    drawSonicHead(canvas, hx - 2, hy + 1, false, false, true);
  } else if (pose.action === 'hips') {
    canvas.drawLine(tx - 2, ty + 3, tx - 3, 28, 3, 1.0);
    canvas.drawLine(tx + 2, ty + 3, tx + 3, 28, 3, 1.0);
    drawSonicSneaker(canvas, tx - 3, 29);
    drawSonicSneaker(canvas, tx + 4, 29, 2);
    drawSonicTorso(canvas, tx, ty);
    canvas.drawLine(tx - 3, ty - 1, tx - 6, ty + 1, 2, 0.8);
    drawSonicGlove(canvas, tx - 4, ty + 2);
    canvas.drawLine(tx + 3, ty - 1, tx + 6, ty + 1, 2, 0.8);
    drawSonicGlove(canvas, tx + 4, ty + 2);
    drawSonicHead(canvas, hx, hy, false, false, false);
  } else {
    canvas.drawLine(tx - 2, ty + 3, tx - 3, 28, 3, 1.0);
    canvas.drawLine(tx + 2, ty + 3, tx + 3, 28, 3, 1.0);
    drawSonicSneaker(canvas, tx - 3, 29);
    drawSonicSneaker(canvas, tx + 4, 29);
    drawSonicTorso(canvas, tx, ty);
    canvas.drawLine(tx - 3, ty, tx - 6, ty + 2, 2, 0.8);
    drawSonicGlove(canvas, tx - 6, ty + 3);
    canvas.drawLine(tx + 3, ty, tx + 6, ty + 2, 2, 0.8);
    drawSonicGlove(canvas, tx + 6, ty + 2);
    drawSonicHead(canvas, hx, hy, false, Boolean(pose.blink), false);
  }

  canvas.applyCelShading(SONIC_SHADES);
  canvas.applyAutoOutline(1, [7, 14, 15]);
  return canvas.toFrame();
}

const { snesChart: GENESIS_CHART, nesChart: NES_CHART } = buildDualEraSpriteCharts(
  SONIC_POSES,
  SONIC_TICKS,
  renderSonicFrame,
  { width: 24, height: 24 },
);

const NES_PALETTES: PalettePreset[] = [
  {
    name: '8-Bit Master System',
    colors: [
      '', '#000000', '#F8B068', '#2848F8', '#102098', '#F8B068', '#C86828',
      '#F8A828', '#F05018', '#981800', '#FCFCFC', '#B8C0D0', '#081068',
      '#7090FF', '#FFF098', '#FFFFFF',
    ],
  },
  {
    name: '8-Bit Super Sonic',
    colors: [
      '', '#000000', '#F8B068', '#F8D800', '#AC7C00', '#F8B068', '#C86828',
      '#F05018', '#F05018', '#981800', '#FCFCFC', '#B8C0D0', '#885800',
      '#FFF088', '#FFFFFF', '#FFFFFF',
    ],
  },
  {
    name: '8-Bit Tails Orange',
    colors: [
      '', '#000000', '#FCFCFC', '#F87800', '#C84C0C', '#FCFCFC', '#BCBCBC',
      '#F8D800', '#E82800', '#881400', '#FCFCFC', '#BCBCBC', '#983000',
      '#F8B848', '#FFFFFF', '#FFFFFF',
    ],
  },
  {
    name: '8-Bit Knuckles Red',
    colors: [
      '', '#000000', '#F8B068', '#D82800', '#881400', '#FCFCFC', '#C86828',
      '#F8D800', '#00A800', '#006800', '#FCFCFC', '#BCBCBC', '#680800',
      '#F86848', '#F8D800', '#FFFFFF',
    ],
  },
];

const GENESIS_PALETTES: PalettePreset[] = [
  {
    name: 'Classic Sonic Sheet',
    colors: [
      '', '#000000', '#F8B068', '#2848F8', '#102098', '#F8B068', '#C86828',
      '#F8A828', '#F05018', '#981800', '#FFFFFF', '#B8C0D0', '#081068',
      '#7090FF', '#FFF098', '#FFFFFF',
    ],
  },
  {
    name: 'Super Sonic 16-Bit',
    colors: [
      '', '#000000', '#F8B068', '#F8D800', '#C89800', '#F8E888', '#C86828',
      '#F05018', '#F05018', '#981800', '#FFFFFF', '#D8E0F0', '#A07000',
      '#FFF490', '#FFFFFF', '#FFFFFF',
    ],
  },
  {
    name: 'Shadow the Hedgehog',
    colors: [
      '', '#000000', '#F8B068', '#1C1E26', '#E81818', '#FFFFFF', '#C86828',
      '#F8D800', '#F05018', '#0F172A', '#FFFFFF', '#D0D4DC', '#C81010',
      '#F87800', '#F8E888', '#FFFFFF',
    ],
  },
  {
    name: 'Metal Sonic CD',
    colors: [
      '', '#000000', '#CBD5E1', '#1848C8', '#0C2478', '#F8D800', '#64748B',
      '#F8D800', '#F05018', '#981800', '#E2E8F0', '#94A3B8', '#0F172A',
      '#68A8FF', '#E0F2FE', '#EF4444',
    ],
  },
];

export const SONIC_BLUEPRINT: FighterBlueprint = {
  id: 'sonic',
  name: 'Sonic',
  nickname: 'Chili Dogs',
  era: 'SEGA',
  originTag: 'Sonic the Hedgehog',
  archetype: 'speedster',
  archetypeLabel: 'Hyper Speedster',
  gridSize: 32,
  palettes: GENESIS_PALETTES,
  pixelChart: GENESIS_CHART,
  eraPacks: {
    NES: { pixelChart: NES_CHART, palettes: NES_PALETTES },
    SNES_SEGA: { pixelChart: GENESIS_CHART, palettes: GENESIS_PALETTES },
  },
  stats: {
    weight: 86,
    runSpeed: 3.3,
    airSpeed: 2.35,
    jumpForce: 5.75,
    doubleJumpForce: 5.3,
    maxJumps: 3,
    gravity: 0.28,
    fallSpeed: 4.8,
    fastFallSpeed: 6.9,
    traction: 0.2,
  },
  moveset: {
    jab: {
      name: 'Sonic Flurry',
      startup: 3,
      active: 5,
      endlag: 6,
      hitbox: { offsetX: 11, offsetY: -10, width: 14, height: 12 },
      damage: 5,
      baseKnockback: 2.2,
      knockbackGrowth: 30,
      launchAngleDeg: 35,
      hitstop: 3,
    },
    smash: {
      name: 'Supersonic Windup',
      startup: 9,
      active: 6,
      endlag: 15,
      hitbox: { offsetX: 14, offsetY: -11, width: 19, height: 14 },
      damage: 15,
      baseKnockback: 4.3,
      knockbackGrowth: 88,
      launchAngleDeg: 32,
      hitstop: 8,
    },
    aerial: {
      name: 'Spin Ball',
      startup: 4,
      active: 9,
      endlag: 8,
      hitbox: { offsetX: 3, offsetY: -10, width: 18, height: 18 },
      damage: 9,
      baseKnockback: 2.9,
      knockbackGrowth: 58,
      launchAngleDeg: 45,
      hitstop: 5,
    },
    neutralSpecial: {
      name: 'Spin Dash',
      startup: 5,
      active: 14,
      endlag: 10,
      hitbox: { offsetX: 8, offsetY: -9, width: 18, height: 16 },
      damage: 10,
      baseKnockback: 3.4,
      knockbackGrowth: 56,
      launchAngleDeg: 42,
      hitstop: 6,
      velocityBoostX: 4.6,
      velocityBoostY: -0.8,
    },
    upSpecial: {
      name: 'Spring Jump',
      startup: 4,
      active: 12,
      endlag: 16,
      hitbox: { offsetX: 0, offsetY: -10, width: 16, height: 18 },
      damage: 7,
      baseKnockback: 3.0,
      knockbackGrowth: 45,
      launchAngleDeg: 75,
      hitstop: 4,
      velocityBoostX: 2.2,
      velocityBoostY: -7.7,
    },
  },
};
