import type { FighterBlueprint } from '../../types/fighter';
import type { AnimState, IndexedFrame, PalettePreset, PixelChart } from '../../types/palette';
import {
  buildDualEraSpriteCharts,
  PixelSpriteCanvas,
  type ShadePair,
} from '../classicSpriteCanvas';
import { buildNesPalettes } from '../rpgSpriteBuilder';

interface ZeroSuitPose {
  readonly mode: 'stand' | 'run' | 'somersault' | 'blaster' | 'whip' | 'aimUp' | 'hurt';
  readonly phase: number;
}

const ZSS_POSES: Record<AnimState, readonly ZeroSuitPose[]> = {
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
    { mode: 'blaster', phase: 0 },
    { mode: 'blaster', phase: 1 },
  ],
  smash: [
    { mode: 'whip', phase: 0 },
    { mode: 'whip', phase: 1 },
  ],
  special: [
    { mode: 'aimUp', phase: 0 },
    { mode: 'aimUp', phase: 1 },
  ],
  hurt: [
    { mode: 'hurt', phase: 0 },
  ],
};

const ZSS_TICKS: Record<AnimState, number> = {
  idle: 20,
  walk: 6,
  jump: 5,
  attack: 5,
  smash: 7,
  special: 7,
  hurt: 12,
};

function drawZssSomersault(canvas: PixelSpriteCanvas, phase: number): void {
  const cx = 16;
  const cy = 18;
  const isHoriz = phase % 2 === 0;
  const rx = isHoriz ? 6.2 : 4.8;
  const ry = isHoriz ? 4.8 : 6.2;

  canvas.fillEllipse(cx, cy, rx, ry, 5);
  canvas.drawArc(cx, cy, rx - 0.8, ry - 0.8, phase * 90, phase * 90 + 150, 7, 1.3);
  canvas.drawArc(cx, cy, rx - 1.8, ry - 1.8, phase * 90 + 180, phase * 90 + 300, 10, 0.9);
  canvas.drawArc(cx, cy, rx + 1.8, ry + 1.8, phase * 90 - 45, phase * 90 + 85, 13, 0.7);
  canvas.plot(cx + (isHoriz ? 4 : 0), cy + (isHoriz ? -2 : 4), 15);
}

function drawZssHair(canvas: PixelSpriteCanvas, hx: number, hy: number, flowing: boolean): void {
  canvas.fillEllipse(hx - 1, hy - 2, 3.6, 2.4, 7);
  if (flowing) {
    canvas.drawLine(hx - 3, hy - 2, hx - 10, hy - 1, 7, 1.4);
    canvas.drawLine(hx - 4, hy, hx - 11, hy + 2, 8, 1.1);
    canvas.plot(hx - 11, hy - 1, 7);
    return;
  }
  canvas.fillRect(hx - 5, hy - 2, 3, 8, 7);
  canvas.fillRect(hx - 6, hy + 1, 2, 6, 8);
  canvas.plot(hx - 4, hy + 6, 7);
}

function drawZssLegs(canvas: PixelSpriteCanvas, cx: number, hipY: number, phase: number, isRun: boolean): void {
  if (!isRun) {
    canvas.fillRect(cx - 2, hipY, 2, 5, 2);
    canvas.fillRect(cx + 1, hipY, 2, 5, 2);
    canvas.fillRect(cx - 3, hipY + 4, 3, 6, 3);
    canvas.fillRect(cx + 1, hipY + 4, 3, 6, 3);
    canvas.fillRect(cx - 3, hipY + 4, 3, 1, 10);
    canvas.fillRect(cx + 1, hipY + 4, 3, 1, 10);
    return;
  }

  const strideMap = [3, 0, -3, 0];
  const stride = strideMap[phase % strideMap.length];
  const kneeLift = phase % 2 === 0 ? -2 : 0;

  canvas.drawLine(cx - 1, hipY, cx - 2 - stride, hipY + 4, 2, 1.0);
  canvas.drawLine(cx - 2 - stride, hipY + 4, cx - 3 - stride, hipY + 9, 3, 1.1);
  canvas.fillRect(cx - 4 - stride, hipY + 9, 4, 2, 3);

  canvas.drawLine(cx + 1, hipY, cx + 2 + stride, hipY + 4 + kneeLift, 2, 1.0);
  canvas.drawLine(cx + 2 + stride, hipY + 4 + kneeLift, cx + 1 + stride, hipY + 9 + kneeLift, 3, 1.1);
  canvas.fillRect(cx + stride, hipY + 9 + kneeLift, 4, 2, 3);
}

function renderZeroSuit16BitFrame(pose: ZeroSuitPose): IndexedFrame {
  const canvas = new PixelSpriteCanvas(32, 32);

  if (pose.mode === 'somersault') {
    drawZssSomersault(canvas, pose.phase);
    canvas.applyAutoOutline(1, [13, 14, 15]);
    return canvas.toFrame();
  }

  const isRun = pose.mode === 'run';
  const isAimUp = pose.mode === 'aimUp';
  const isBlaster = pose.mode === 'blaster';
  const isWhip = pose.mode === 'whip';
  const isHurt = pose.mode === 'hurt';
  const bobY = pose.mode === 'stand' && pose.phase === 1 ? 1 : 0;
  let cx = 14;
  if (isHurt) cx = 12;
  if (isWhip && pose.phase === 1) cx = 15;
  const hy = 7 + bobY;
  const ty = 12 + bobY;

  drawZssHair(canvas, cx, hy, isRun || isWhip || isHurt);
  drawZssLegs(canvas, cx, ty + 7, pose.phase, isRun);

  canvas.fillRoundedRect(cx - 2, ty, 5, 7, 5);
  canvas.fillRect(cx - 3, ty + 5, 7, 2, 10);
  canvas.fillRect(cx - 2, ty + 6, 5, 2, 5);

  canvas.fillEllipse(cx, hy, 2.8, 3.0, 2);
  canvas.plot(cx + 1, hy - 1, 1);
  canvas.plot(cx + 2, hy, 2);

  if (isAimUp) {
    canvas.drawLine(cx + 1, ty + 1, cx + 1, hy - 5, 2, 0.9);
    canvas.fillRect(cx, hy - 7, 3, 3, 14);
    canvas.fillEllipse(cx + 1, hy - 9, 2.2, 2.2, 13);
    canvas.plot(cx + 1, hy - 9, 15);
  } else if (isHurt) {
    canvas.drawLine(cx - 2, ty + 1, cx - 6, ty - 2, 2, 0.9);
    canvas.drawLine(cx + 2, ty + 1, cx + 6, ty - 2, 2, 0.9);
  } else {
    canvas.drawLine(cx - 2, ty + 1, cx - 4, ty + 5, 2, 0.8);
    canvas.drawLine(cx + 2, ty + 1, cx + 6, ty + 1, 2, 0.9);
    canvas.fillRect(cx + 6, ty, 3, 2, 11);
  }

  if (isBlaster) {
    const boltX = pose.phase === 0 ? cx + 10 : cx + 14;
    canvas.fillRect(boltX, ty, 4, 2, 13);
    canvas.plot(boltX + 3, ty, 15);
    canvas.plot(boltX + 1, ty + 1, 14);
  }

  if (isWhip) {
    const whipEnd = pose.phase === 0 ? cx + 13 : cx + 16;
    canvas.drawArc(cx + 9, ty, 7.5, 5.5, -55, 45, 13, 0.8);
    canvas.drawLine(cx + 8, ty + 1, whipEnd, ty - 2, 14, 0.7);
    canvas.plot(whipEnd, ty - 2, 15);
  }

  const shades: readonly ShadePair[] = [
    { base: 3, shadow: 4 },
    { base: 5, shadow: 6 },
    { base: 7, shadow: 8 },
  ];
  canvas.applyCelShading(shades);
  canvas.applyAutoOutline(1, [13, 14, 15]);
  return canvas.toFrame();
}

const ZSS_DUAL_ERA: { snesChart: PixelChart; nesChart: PixelChart } =
  buildDualEraSpriteCharts(ZSS_POSES, ZSS_TICKS, renderZeroSuit16BitFrame, {
    width: 16,
    height: 16,
  });

const ZSS_PALETTES: PalettePreset[] = [
  {
    name: 'Justin Bailey',
    colors: [
      '', '#0A0610', '#FFD2B0', '#E81888', '#981058', '#EC2090', '#A81060',
      '#28E030', '#109818', '#78350F', '#FFFFFF', '#94A3B8', '#1E293B',
      '#38BDF8', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Normal Suitless',
    colors: [
      '', '#0A0610', '#FFD2B0', '#D81868', '#881040', '#E02070', '#981048',
      '#D85818', '#883008', '#78350F', '#FFFFFF', '#94A3B8', '#1E293B',
      '#F97316', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Missile Blonde',
    colors: [
      '', '#0A0610', '#FFD2B0', '#F02888', '#981058', '#E82080', '#981050',
      '#F8D828', '#C89810', '#78350F', '#FFFFFF', '#94A3B8', '#1E293B',
      '#FACC15', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Zero Mission Blue',
    colors: [
      '', '#060A18', '#FFD2B0', '#0EA5E9', '#0369A1', '#2563EB', '#1E3A8A',
      '#FACC15', '#CA8A04', '#78350F', '#7DD3FC', '#94A3B8', '#0F172A',
      '#38BDF8', '#E0F2FE', '#FFFFFF',
    ],
  },
  {
    name: 'Varia Lime',
    colors: [
      '', '#0A0610', '#FFD2B0', '#E82078', '#981048', '#D81868', '#881040',
      '#98F820', '#58B010', '#78350F', '#FFFFFF', '#94A3B8', '#1E293B',
      '#A3E635', '#FEF08A', '#FFFFFF',
    ],
  },
];

export const ZERO_SUIT_SAMUS_BLUEPRINT: FighterBlueprint = {
  id: 'zero-suit-samus',
  name: 'Zero Suit Samus',
  nickname: 'Justin Bailey',
  era: 'NES',
  originTag: 'Metroid',
  archetype: 'speedster',
  archetypeLabel: 'Agile Paralyzer',
  gridSize: 32,
  palettes: ZSS_PALETTES,
  pixelChart: ZSS_DUAL_ERA.snesChart,
  eraPacks: {
    NES: { pixelChart: ZSS_DUAL_ERA.nesChart, palettes: buildNesPalettes(ZSS_PALETTES) },
    SNES_SEGA: { pixelChart: ZSS_DUAL_ERA.snesChart, palettes: ZSS_PALETTES },
  },
  stats: {
    weight: 80,
    runSpeed: 3.15,
    airSpeed: 2.6,
    jumpForce: 6.1,
    doubleJumpForce: 5.5,
    maxJumps: 3,
    gravity: 0.27,
    fallSpeed: 4.9,
    fastFallSpeed: 7.0,
    traction: 0.25,
  },
  moveset: {
    jab: {
      name: 'Paralyzer Jab',
      startup: 3,
      active: 4,
      endlag: 6,
      hitbox: { offsetX: 13, offsetY: -11, width: 16, height: 12 },
      damage: 5,
      baseKnockback: 2.1,
      knockbackGrowth: 34,
      launchAngleDeg: 38,
      hitstop: 3,
    },
    smash: {
      name: 'Plasma Whip',
      startup: 9,
      active: 7,
      endlag: 13,
      hitbox: { offsetX: 17, offsetY: -12, width: 24, height: 16 },
      damage: 17,
      baseKnockback: 4.6,
      knockbackGrowth: 92,
      launchAngleDeg: 34,
      hitstop: 8,
    },
    aerial: {
      name: 'Flip Kick',
      startup: 4,
      active: 7,
      endlag: 8,
      hitbox: { offsetX: 10, offsetY: -10, width: 18, height: 15 },
      damage: 12,
      baseKnockback: 3.4,
      knockbackGrowth: 70,
      launchAngleDeg: 32,
      hitstop: 6,
    },
    neutralSpecial: {
      name: 'Paralyzer Shot',
      startup: 8,
      active: 4,
      endlag: 11,
      hitbox: { offsetX: 14, offsetY: -11, width: 12, height: 10 },
      damage: 8,
      baseKnockback: 2.5,
      knockbackGrowth: 42,
      launchAngleDeg: 40,
      hitstop: 5,
      projectile: {
        speedX: 5.0,
        speedY: 0,
        gravity: 0,
        radius: 5,
        lifetime: 58,
        colorIndex: 13,
        glowIndex: 14,
      },
    },
    upSpecial: {
      name: 'Boost Kick',
      startup: 3,
      active: 14,
      endlag: 15,
      hitbox: { offsetX: 4, offsetY: -18, width: 18, height: 22 },
      damage: 13,
      baseKnockback: 4.5,
      knockbackGrowth: 82,
      launchAngleDeg: 78,
      hitstop: 7,
      velocityBoostX: 1.9,
      velocityBoostY: -7.5,
    },
  },
};
