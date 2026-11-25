import type { FighterBlueprint } from '../../types/fighter';
import type { AnimState, IndexedFrame, PalettePreset, PixelChart } from '../../types/palette';
import {
  buildDualEraSpriteCharts,
  PixelSpriteCanvas,
  type ShadePair,
} from '../classicSpriteCanvas';
import { buildNesPalettes } from '../rpgSpriteBuilder';

interface SamusPose {
  readonly mode: 'stand' | 'run' | 'somersault' | 'beam' | 'smash' | 'aimUp' | 'morph' | 'shatter';
  readonly phase: number;
}

const SAMUS_POSES: Record<AnimState, readonly SamusPose[]> = {
  idle: [
    { mode: 'stand', phase: 0 },
    { mode: 'stand', phase: 1 },
  ],
  walk: [
    { mode: 'run', phase: 0 },
    { mode: 'run', phase: 1 },
    { mode: 'run', phase: 2 },
    { mode: 'run', phase: 3 },
  ],
  jump: [
    { mode: 'somersault', phase: 0 },
    { mode: 'somersault', phase: 1 },
    { mode: 'somersault', phase: 2 },
    { mode: 'somersault', phase: 3 },
  ],
  attack: [
    { mode: 'beam', phase: 0 },
    { mode: 'beam', phase: 1 },
  ],
  smash: [
    { mode: 'smash', phase: 0 },
    { mode: 'smash', phase: 1 },
  ],
  special: [
    { mode: 'aimUp', phase: 0 },
    { mode: 'morph', phase: 1 },
  ],
  hurt: [
    { mode: 'shatter', phase: 0 },
  ],
};

const SAMUS_TICKS: Record<AnimState, number> = {
  idle: 22,
  walk: 7,
  jump: 5,
  attack: 6,
  smash: 7,
  special: 8,
  hurt: 12,
};

function drawSamusHelmet(canvas: PixelSpriteCanvas, hx: number, hy: number): void {
  canvas.fillEllipse(hx, hy, 4.0, 3.6, 5);
  canvas.fillRect(hx - 3, hy + 1, 6, 2, 5);
  canvas.fillRect(hx + 1, hy - 1, 3, 2, 7);
  canvas.plot(hx + 2, hy - 1, 15);
  canvas.plot(hx - 1, hy - 3, 3);
}

const SAMUS_LEG_STRIDE: ReadonlyArray<{ front: number; back: number }> = [
  { front: 2, back: 3 },
  { front: 0, back: 1 },
  { front: -2, back: -2 },
  { front: 0, back: 1 },
];

function drawSamusStandingLegs(canvas: PixelSpriteCanvas, cx: number, hipY: number, phase: number): void {
  const isStep = phase === 1 || phase === 3;
  const stride = SAMUS_LEG_STRIDE[phase % SAMUS_LEG_STRIDE.length];
  const frontX = cx + stride.front;
  const backX = cx - stride.back;
  const liftFront = phase === 0 ? -2 : 0;
  const liftBack = phase === 2 ? -2 : 0;

  canvas.drawLine(cx - 1, hipY, backX - 1, hipY + 5 + liftBack, 3, 1.3);
  canvas.drawLine(backX - 1, hipY + 5 + liftBack, backX - 2, hipY + 9 + liftBack, 5, 1.3);
  canvas.fillRect(backX - 3, hipY + 9 + liftBack, 4, 2, 5);

  const kneeX = isStep ? cx + 1 : frontX + 2;
  canvas.drawLine(cx + 1, hipY, kneeX, hipY + 4 + liftFront, 3, 1.3);
  canvas.drawLine(kneeX, hipY + 4 + liftFront, frontX + 1, hipY + 9 + liftFront, 5, 1.3);
  canvas.fillRect(frontX, hipY + 9 + liftFront, 4, 2, 5);
}

function drawSamusSomersault(canvas: PixelSpriteCanvas, phase: number): void {
  const cx = 16;
  const cy = 18;
  const isHoriz = phase % 2 === 0;
  const rx = isHoriz ? 6.8 : 5.2;
  const ry = isHoriz ? 5.2 : 6.8;

  canvas.fillEllipse(cx, cy, rx, ry, 3);
  canvas.drawArc(cx, cy, rx - 1.0, ry - 1.0, phase * 90, phase * 90 + 160, 5, 1.2);
  canvas.drawArc(cx, cy, rx - 2.0, ry - 2.0, phase * 90 + 180, phase * 90 + 300, 7, 0.9);
  canvas.drawArc(cx, cy, rx + 1.6, ry + 1.6, phase * 90 - 40, phase * 90 + 70, 14, 0.5);
  canvas.plot(cx + (isHoriz ? 4 : 0), cy + (isHoriz ? 0 : -4), 15);
}

function drawSamusMorphBall(canvas: PixelSpriteCanvas, phase: number): void {
  const cx = 16;
  const cy = 22;
  canvas.fillEllipse(cx, cy, 5.8, 5.8, 3);
  canvas.drawArc(cx, cy, 3.8, 3.8, phase * 60, phase * 60 + 130, 5, 1.0);
  canvas.drawArc(cx, cy, 3.6, 3.6, phase * 60 + 180, phase * 60 + 280, 7, 0.8);
  canvas.plot(cx - 2, cy - 2, 15);
}

function drawSamusShatter(canvas: PixelSpriteCanvas): void {
  const cx = 15;
  const cy = 17;
  drawSamusHelmet(canvas, cx - 2, cy - 8);
  canvas.fillRoundedRect(cx - 3, cy - 3, 6, 8, 3);
  canvas.fillRect(cx - 5, cy - 4, 3, 3, 5);
  canvas.fillRect(cx + 3, cy - 2, 4, 3, 7);
  canvas.drawLine(cx - 1, cy + 5, cx - 5, cy + 10, 5, 1.1);
  canvas.drawLine(cx + 2, cy + 5, cx + 6, cy + 9, 5, 1.1);

  const sparks: ReadonlyArray<[number, number, number]> = [
    [cx - 8, cy - 6, 5],
    [cx + 8, cy - 7, 7],
    [cx - 9, cy + 2, 14],
    [cx + 9, cy + 1, 5],
    [cx + 6, cy - 11, 14],
  ];
  for (const [sx, sy, col] of sparks) {
    canvas.fillRect(sx, sy, 2, 2, col);
  }
}

function renderSamus16BitFrame(pose: SamusPose): IndexedFrame {
  const canvas = new PixelSpriteCanvas(32, 32);

  if (pose.mode === 'somersault') {
    drawSamusSomersault(canvas, pose.phase);
    canvas.applyAutoOutline(1, [13, 14, 15]);
    return canvas.toFrame();
  }
  if (pose.mode === 'morph') {
    drawSamusMorphBall(canvas, pose.phase);
    canvas.applyAutoOutline(1, [13, 14, 15]);
    return canvas.toFrame();
  }
  if (pose.mode === 'shatter') {
    drawSamusShatter(canvas);
    canvas.applyAutoOutline(1, [13, 14, 15]);
    return canvas.toFrame();
  }

  const isRunning = pose.mode === 'run';
  const isAimUp = pose.mode === 'aimUp';
  const isBeam = pose.mode === 'beam';
  const isSmash = pose.mode === 'smash';
  const bobY = pose.mode === 'stand' && pose.phase === 1 ? 1 : 0;
  const cx = isSmash && pose.phase === 1 ? 14 : 13;
  const hy = 7 + bobY;
  const ty = 12 + bobY;

  if (isRunning) {
    drawSamusStandingLegs(canvas, cx, ty + 7, pose.phase);
  } else {
    drawSamusStandingLegs(canvas, cx, ty + 7, 1);
  }

  canvas.fillRoundedRect(cx - 3, ty, 7, 8, 3);
  canvas.fillRect(cx - 2, ty + 1, 5, 3, 5);
  canvas.fillRect(cx - 3, ty + 6, 7, 2, 5);

  canvas.fillEllipse(cx - 3, ty + 1, 2.8, 2.5, 5);
  canvas.fillEllipse(cx + 3, ty + 1, 2.8, 2.5, 5);
  canvas.plot(cx - 3, ty, 3);
  canvas.plot(cx + 3, ty, 3);

  drawSamusHelmet(canvas, cx, hy);

  if (isAimUp) {
    canvas.fillRect(cx + 1, hy - 6, 3, 7, 7);
    canvas.fillRect(cx + 1, hy - 7, 3, 2, 6);
    canvas.fillEllipse(cx + 2, hy - 9, 2.0, 2.0, 14);
    canvas.plot(cx + 2, hy - 9, 15);
  } else {
    const cannonLen = isSmash ? 8 : 6;
    canvas.fillRect(cx + 3, ty + 1, cannonLen, 3, 7);
    canvas.fillRect(cx + 3 + cannonLen - 2, ty + 1, 2, 3, 6);
    canvas.plot(cx + 5, ty + 1, 10);
  }

  if (isBeam) {
    const shotX = pose.phase === 0 ? cx + 11 : cx + 15;
    canvas.fillEllipse(shotX, ty + 2, 2.1, 2.1, 5);
    canvas.plot(shotX, ty + 2, 14);
    canvas.plot(shotX + 2, ty + 2, 15);
  }

  if (isSmash) {
    const blastX = cx + 13;
    const blastR = pose.phase === 0 ? 3.2 : 4.6;
    canvas.fillEllipse(blastX, ty + 2, blastR, blastR, 13);
    canvas.fillEllipse(blastX, ty + 2, blastR - 1.5, blastR - 1.5, 14);
    canvas.plot(blastX, ty + 2, 15);
  }

  const shades: readonly ShadePair[] = [
    { base: 3, shadow: 4 },
    { base: 5, shadow: 9 },
    { base: 7, shadow: 6 },
  ];
  canvas.applyCelShading(shades);
  canvas.applyAutoOutline(1, [13, 14, 15]);
  return canvas.toFrame();
}

const SAMUS_DUAL_ERA: { snesChart: PixelChart; nesChart: PixelChart } =
  buildDualEraSpriteCharts(SAMUS_POSES, SAMUS_TICKS, renderSamus16BitFrame, {
    width: 16,
    height: 16,
  });

const SAMUS_PALETTES: PalettePreset[] = [
  {
    name: 'NES Power Suit',
    colors: [
      '', '#060810', '#FFD8B0', '#FFA074', '#D86840', '#F03818', '#207010',
      '#48B820', '#F8D800', '#981408', '#A8F878', '#94A3B8', '#580808',
      '#F85020', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Super Metroid Varia',
    colors: [
      '', '#060810', '#F8D800', '#F88818', '#C84C0C', '#DC2626', '#008858',
      '#38F058', '#F8D800', '#881408', '#86EFAC', '#94A3B8', '#580808',
      '#38BDF8', '#BAE6FD', '#FFFFFF',
    ],
  },
  {
    name: 'NES Varia Magenta',
    colors: [
      '', '#0A0610', '#FBCFE8', '#A84818', '#702808', '#E028A0', '#187818',
      '#48C828', '#F8D800', '#881060', '#86EFAC', '#94A3B8', '#480838',
      '#F472B6', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Gravity Suit',
    colors: [
      '', '#080614', '#E9D5FF', '#9850E8', '#6828B8', '#C02888', '#008868',
      '#38F868', '#F8D800', '#601050', '#86EFAC', '#94A3B8', '#380860',
      '#C084FC', '#F3E8FF', '#FFFFFF',
    ],
  },
  {
    name: 'Dark Phazon',
    colors: [
      '', '#04060C', '#38BDF8', '#1E293B', '#0F172A', '#334155', '#0284C7',
      '#22D3EE', '#38BDF8', '#09090B', '#A5F3FC', '#64748B', '#020617',
      '#22D3EE', '#E0F2FE', '#FFFFFF',
    ],
  },
];

export const SAMUS_BLUEPRINT: FighterBlueprint = {
  id: 'samus',
  name: 'Samus',
  nickname: 'Sam',
  era: 'NES',
  originTag: 'Metroid',
  archetype: 'heavy-gunner',
  archetypeLabel: 'Heavy Arm-Cannon',
  gridSize: 32,
  palettes: SAMUS_PALETTES,
  pixelChart: SAMUS_DUAL_ERA.snesChart,
  eraPacks: {
    NES: { pixelChart: SAMUS_DUAL_ERA.nesChart, palettes: buildNesPalettes(SAMUS_PALETTES) },
    SNES_SEGA: { pixelChart: SAMUS_DUAL_ERA.snesChart, palettes: SAMUS_PALETTES },
  },
  stats: {
    weight: 112,
    runSpeed: 2.0,
    airSpeed: 1.75,
    jumpForce: 5.5,
    doubleJumpForce: 5.1,
    maxJumps: 3,
    gravity: 0.22,
    fallSpeed: 4.0,
    fastFallSpeed: 5.9,
    traction: 0.23,
  },
  moveset: {
    jab: {
      name: 'Cannon Strike',
      startup: 5,
      active: 5,
      endlag: 9,
      hitbox: { offsetX: 12, offsetY: -10, width: 15, height: 12 },
      damage: 7,
      baseKnockback: 2.6,
      knockbackGrowth: 38,
      launchAngleDeg: 35,
      hitstop: 5,
    },
    smash: {
      name: 'Flame Blast',
      startup: 12,
      active: 6,
      endlag: 18,
      hitbox: { offsetX: 16, offsetY: -11, width: 22, height: 16 },
      damage: 19,
      baseKnockback: 5.0,
      knockbackGrowth: 96,
      launchAngleDeg: 34,
      hitstop: 10,
    },
    aerial: {
      name: 'Screw Kick',
      startup: 5,
      active: 9,
      endlag: 10,
      hitbox: { offsetX: 6, offsetY: -10, width: 18, height: 16 },
      damage: 11,
      baseKnockback: 3.3,
      knockbackGrowth: 64,
      launchAngleDeg: 36,
      hitstop: 6,
    },
    neutralSpecial: {
      name: 'Charge Shot',
      startup: 10,
      active: 5,
      endlag: 16,
      hitbox: { offsetX: 14, offsetY: -10, width: 12, height: 12 },
      damage: 13,
      baseKnockback: 3.8,
      knockbackGrowth: 70,
      launchAngleDeg: 30,
      hitstop: 7,
      projectile: {
        speedX: 5.2,
        speedY: 0,
        gravity: 0,
        radius: 6,
        lifetime: 68,
        colorIndex: 13,
        glowIndex: 14,
      },
    },
    upSpecial: {
      name: 'Screw Attack',
      startup: 4,
      active: 15,
      endlag: 19,
      hitbox: { offsetX: 0, offsetY: -14, width: 20, height: 22 },
      damage: 13,
      baseKnockback: 4.1,
      knockbackGrowth: 72,
      launchAngleDeg: 76,
      hitstop: 7,
      velocityBoostX: 1.3,
      velocityBoostY: -7.1,
    },
  },
};
