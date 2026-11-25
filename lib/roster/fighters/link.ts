import type { FighterBlueprint } from '../../types/fighter';
import type { AnimState, IndexedFrame, PalettePreset, PixelChart } from '../../types/palette';
import { makeClip } from '../chartParser';
import { PixelSpriteCanvas, type ShadePair } from '../classicSpriteCanvas';

interface LinkPose {
  readonly mode: 'idle' | 'walk' | 'jump' | 'slash' | 'spin' | 'rod' | 'hurt';
  readonly phase: number;
}

const LINK_POSES: Record<AnimState, readonly LinkPose[]> = {
  idle: [
    { mode: 'idle', phase: 0 },
    { mode: 'idle', phase: 1 },
  ],
  walk: [
    { mode: 'walk', phase: 0 },
    { mode: 'walk', phase: 1 },
    { mode: 'walk', phase: 2 },
    { mode: 'walk', phase: 3 },
  ],
  jump: [
    { mode: 'jump', phase: 0 },
    { mode: 'jump', phase: 1 },
  ],
  attack: [
    { mode: 'slash', phase: 0 },
    { mode: 'slash', phase: 1 },
  ],
  smash: [
    { mode: 'spin', phase: 0 },
    { mode: 'spin', phase: 1 },
  ],
  special: [
    { mode: 'rod', phase: 0 },
    { mode: 'rod', phase: 1 },
  ],
  hurt: [
    { mode: 'hurt', phase: 0 },
  ],
};

const LINK_TICKS: Record<AnimState, number> = {
  idle: 20,
  walk: 7,
  jump: 10,
  attack: 5,
  smash: 6,
  special: 7,
  hurt: 12,
};

function computeLinkBobY(mode: LinkPose['mode'], phase: number, jumpLift: number): number {
  const isIdleDip = mode === 'idle' && phase === 1;
  if (isIdleDip) return 1;
  const isJumping = mode === 'jump';
  if (isJumping) return jumpLift;
  return 0;
}

function computeLinkStride(mode: LinkPose['mode'], phase: number, amplitude: number): number {
  const isWalking = mode === 'walk';
  if (!isWalking) return 0;
  const pattern = [amplitude, 0, -amplitude, 0];
  return pattern[phase % pattern.length];
}

function renderNesZelda1Frame(pose: LinkPose): IndexedFrame {
  const canvas = new PixelSpriteCanvas(16, 16);
  const cx = pose.mode === 'hurt' ? 6 : 7;
  const bobY = computeLinkBobY(pose.mode, pose.phase, -1);
  const stride = computeLinkStride(pose.mode, pose.phase, 1);
  const hy = 4 + bobY;
  const ty = 8 + bobY;

  canvas.fillRect(cx - 3 - stride, ty + 4, 3, 2, 12);
  canvas.fillRect(cx + 1 + stride, ty + 4, 3, 2, 12);
  canvas.fillRect(cx - 3, ty, 7, 5, 3);
  canvas.fillRect(cx - 3, ty + 3, 7, 1, 12);

  canvas.fillRect(cx - 3, hy - 2, 7, 3, 3);
  canvas.fillRect(cx - 5, hy - 1, 3, 2, 3);
  canvas.fillRect(cx - 2, hy, 5, 4, 2);
  canvas.fillRect(cx - 3, hy, 2, 2, 12);
  canvas.plot(cx + 1, hy + 1, 12);
  canvas.plot(cx + 3, hy + 1, 12);

  const isSlash = pose.mode === 'slash';
  const isSpin = pose.mode === 'spin';
  const isRod = pose.mode === 'rod';

  if (isSlash || isSpin) {
    const reach = pose.phase === 0 ? 5 : 7;
    canvas.fillRect(cx + 4, ty + 1, 2, 2, 3);
    canvas.fillRect(cx + 5, ty, 1, 4, 3);
    canvas.fillRect(cx + 6, ty + 1, reach, 2, 12);
    if (isSpin) {
      canvas.fillRect(cx - 6, ty + 1, 3, 2, 12);
      canvas.plot(cx + 6 + reach - 1, ty, 2);
    }
  } else if (isRod) {
    canvas.fillRect(cx + 4, ty, 2, 3, 2);
    canvas.fillEllipse(cx + 7, ty + 1, 1.8, 1.8, 5);
    canvas.plot(cx + 7, ty - 1, 10);
  } else {
    canvas.fillRect(cx + 3, ty, 3, 4, 12);
    canvas.fillRect(cx + 4, ty + 1, 1, 2, 2);
    canvas.plot(cx + 3, ty + 1, 2);
    canvas.plot(cx + 5, ty + 1, 2);
  }

  return canvas.toFrame();
}

function drawAlttpShield(canvas: PixelSpriteCanvas, sx: number, sy: number): void {
  canvas.fillRoundedRect(sx, sy, 5, 7, 5);
  canvas.fillRect(sx + 1, sy + 1, 3, 5, 10);
  canvas.fillRect(sx + 1, sy + 2, 3, 3, 5);
  canvas.plot(sx + 2, sy + 3, 7);
}

function drawAlttpWeapon(canvas: PixelSpriteCanvas, cx: number, ty: number, pose: LinkPose): void {
  const isSlash = pose.mode === 'slash';
  const isSpin = pose.mode === 'spin';
  const isRod = pose.mode === 'rod';

  if (isSlash) {
    if (pose.phase === 0) {
      canvas.drawLine(cx + 5, ty + 1, cx + 12, ty - 8, 10, 0.7);
      canvas.fillRect(cx + 4, ty, 3, 2, 5);
      canvas.drawArc(cx + 8, ty - 2, 7.2, 6.2, -90, 20, 14, 0.7);
      return;
    }
    canvas.drawLine(cx + 5, ty + 2, cx + 16, ty + 2, 10, 0.8);
    canvas.drawLine(cx + 6, ty + 2, cx + 16, ty + 2, 15, 0);
    canvas.fillRect(cx + 4, ty, 2, 5, 5);
    canvas.drawArc(cx + 9, ty + 1, 7.6, 6.4, -55, 55, 14, 0.8);
    return;
  }

  if (isSpin) {
    const startDeg = pose.phase === 0 ? -150 : 10;
    canvas.drawArc(cx, ty + 2, 11.0, 7.2, startDeg, startDeg + 200, 14, 1.1);
    canvas.drawArc(cx, ty + 2, 9.8, 6.2, startDeg + 20, startDeg + 180, 15, 0.5);
    canvas.drawLine(cx + 4, ty + 2, cx + 14, ty + 2, 10, 0.8);
    return;
  }

  if (isRod) {
    canvas.drawLine(cx + 5, ty + 1, cx + 11, ty - 3, 8, 0.7);
    canvas.fillEllipse(cx + 13, ty - 4, 2.8, 2.8, pose.phase === 0 ? 13 : 14);
    canvas.plot(cx + 13, ty - 4, 15);
    return;
  }

  drawAlttpShield(canvas, cx + 3, ty + 1);
}

function renderSnesAlttpLinkFrame(pose: LinkPose): IndexedFrame {
  const canvas = new PixelSpriteCanvas(32, 32);
  const isHurt = pose.mode === 'hurt';
  const isSlashLunge = pose.mode === 'slash' && pose.phase === 1;
  let cx = 14;
  if (isHurt) cx = 12;
  if (isSlashLunge) cx = 15;
  const bobY = computeLinkBobY(pose.mode, pose.phase, -2);
  const stride = computeLinkStride(pose.mode, pose.phase, 2);
  const hy = 11 + bobY;
  const ty = 17 + bobY;

  canvas.fillRoundedRect(cx - 4 - stride, ty + 8, 4, 4, 9);
  canvas.fillRoundedRect(cx + 1 + stride, ty + 8, 4, 4, 9);
  canvas.fillRect(cx - 3 - stride, ty + 7, 3, 2, 2);
  canvas.fillRect(cx + 1 + stride, ty + 7, 3, 2, 2);

  canvas.fillRoundedRect(cx - 5, ty - 1, 10, 9, 3);
  canvas.fillRect(cx - 5, ty + 4, 10, 2, 9);
  canvas.fillRect(cx - 1, ty + 4, 3, 2, 7);

  if (isHurt) {
    canvas.fillRect(cx - 7, ty - 2, 3, 3, 3);
    canvas.fillRect(cx + 5, ty - 2, 3, 3, 3);
  } else {
    canvas.fillRect(cx - 6, ty + 1, 2, 4, 3);
    canvas.fillRect(cx - 6, ty + 4, 2, 2, 2);
    canvas.fillRect(cx + 4, ty, 3, 4, 3);
    canvas.fillRect(cx + 6, ty + 2, 2, 2, 2);
  }

  canvas.fillEllipse(cx, hy, 4.8, 4.4, 2);
  canvas.fillRect(cx - 6, hy - 1, 2, 2, 2);
  canvas.plot(cx + 1, hy - 1, 1);
  canvas.plot(cx + 1, hy, 1);
  canvas.plot(cx + 3, hy - 1, 1);
  canvas.plot(cx + 3, hy, 1);

  canvas.fillRect(cx - 5, hy - 2, 3, 4, 12);
  canvas.fillRect(cx - 2, hy - 3, 6, 2, 12);
  canvas.plot(cx + 4, hy - 2, 12);

  canvas.fillEllipse(cx - 1, hy - 5, 5.2, 2.8, 3);
  canvas.fillTriangle(cx - 4, hy - 5, cx - 10, hy - 1, cx - 3, hy - 1, 3);
  canvas.fillRect(cx - 5, hy - 3, 9, 1, 7);

  const shades: readonly ShadePair[] = [
    { base: 3, shadow: 4 },
    { base: 5, shadow: 6 },
    { base: 7, shadow: 8 },
  ];
  canvas.applyCelShading(shades);
  drawAlttpWeapon(canvas, cx, ty, pose);
  canvas.applyAutoOutline(1, [13, 14, 15]);
  return canvas.toFrame();
}

function buildLinkChart(renderer: (pose: LinkPose) => IndexedFrame): PixelChart {
  const states: AnimState[] = ['idle', 'walk', 'jump', 'attack', 'smash', 'special', 'hurt'];
  const chart = {} as PixelChart;
  for (const state of states) {
    chart[state] = makeClip(
      LINK_POSES[state].map((pose) => renderer(pose)),
      LINK_TICKS[state],
    );
  }
  return chart;
}

const NES_CHART: PixelChart = buildLinkChart(renderNesZelda1Frame);
const SNES_CHART: PixelChart = buildLinkChart(renderSnesAlttpLinkFrame);

const NES_PALETTES: PalettePreset[] = [
  {
    name: 'Zelda 1 Green',
    colors: [
      '', '#000000', '#F8A838', '#70B010', '#487808', '#2038EC', '#101888',
      '#F8D828', '#C05810', '#883808', '#FCFCFC', '#B8B8B8', '#C05810',
      '#F8A838', '#F8D878', '#FCFCFC',
    ],
  },
  {
    name: 'Blue Ring NES',
    colors: [
      '', '#000000', '#F8A838', '#3878F8', '#1840A8', '#2038EC', '#101888',
      '#F8D828', '#C05810', '#883808', '#FCFCFC', '#B8B8B8', '#C05810',
      '#68B8F8', '#B8E8F8', '#FCFCFC',
    ],
  },
  {
    name: 'Red Ring NES',
    colors: [
      '', '#000000', '#F8A838', '#E02820', '#981008', '#2038EC', '#101888',
      '#F8D828', '#C05810', '#883808', '#FCFCFC', '#B8B8B8', '#C05810',
      '#F85838', '#F8D878', '#FCFCFC',
    ],
  },
  {
    name: 'Shadow Link NES',
    colors: [
      '', '#000000', '#94A3B8', '#1E293B', '#09090B', '#DC2626', '#7F1D1D',
      '#EF4444', '#475569', '#18181B', '#E2E8F0', '#64748B', '#334155',
      '#EF4444', '#FCA5A5', '#FFFFFF',
    ],
  },
];

const SNES_PALETTES: PalettePreset[] = [
  {
    name: 'ALTTP Pink Hair',
    colors: [
      '', '#0A0D10', '#F8C890', '#28B828', '#147814', '#3870E8', '#184098',
      '#F8D020', '#C88810', '#884818', '#F8F8F8', '#94A3B8', '#F078B8',
      '#38BDF8', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Blue Mail ALTTP',
    colors: [
      '', '#0A0D10', '#F8C890', '#3878E8', '#1848A0', '#E03838', '#981818',
      '#F8D020', '#C88810', '#884818', '#F8F8F8', '#94A3B8', '#F078B8',
      '#60A5FA', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Red Mail ALTTP',
    colors: [
      '', '#0A0D10', '#F8C890', '#E03028', '#981410', '#8838D8', '#501888',
      '#F8D020', '#C88810', '#783810', '#F8F8F8', '#94A3B8', '#F078B8',
      '#F97316', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Hero Blonde',
    colors: [
      '', '#0A0D10', '#F8C890', '#28B828', '#147814', '#2563EB', '#1E3A8A',
      '#F8D020', '#C88810', '#884818', '#F8F8F8', '#94A3B8', '#FACC15',
      '#38BDF8', '#FEF08A', '#FFFFFF',
    ],
  },
  {
    name: 'Dark Link 16-Bit',
    colors: [
      '', '#050508', '#64748B', '#1E293B', '#0F172A', '#334155', '#09090B',
      '#EF4444', '#991B1B', '#0F172A', '#CBD5E1', '#475569', '#94A3B8',
      '#EF4444', '#FCA5A5', '#FFFFFF',
    ],
  },
];

export const LINK_BLUEPRINT: FighterBlueprint = {
  id: 'link',
  name: 'Link',
  nickname: 'Chain',
  era: 'NES',
  originTag: 'Legend of Zelda',
  archetype: 'sword-hero',
  archetypeLabel: 'Sword & Shield',
  gridSize: 32,
  palettes: SNES_PALETTES,
  pixelChart: SNES_CHART,
  eraPacks: {
    NES: { pixelChart: NES_CHART, palettes: NES_PALETTES },
    SNES_SEGA: { pixelChart: SNES_CHART, palettes: SNES_PALETTES },
  },
  stats: {
    weight: 104,
    runSpeed: 2.15,
    airSpeed: 1.75,
    jumpForce: 5.35,
    doubleJumpForce: 4.9,
    maxJumps: 3,
    gravity: 0.27,
    fallSpeed: 4.6,
    fastFallSpeed: 6.5,
    traction: 0.24,
  },
  moveset: {
    jab: {
      name: 'Master Slash',
      startup: 5,
      active: 6,
      endlag: 9,
      hitbox: { offsetX: 14, offsetY: -11, width: 19, height: 14 },
      damage: 8,
      baseKnockback: 2.6,
      knockbackGrowth: 40,
      launchAngleDeg: 35,
      hitstop: 5,
    },
    smash: {
      name: 'Hero Cleave',
      startup: 12,
      active: 6,
      endlag: 18,
      hitbox: { offsetX: 16, offsetY: -13, width: 22, height: 18 },
      damage: 18,
      baseKnockback: 4.7,
      knockbackGrowth: 94,
      launchAngleDeg: 34,
      hitstop: 9,
    },
    aerial: {
      name: 'Sword Arc',
      startup: 6,
      active: 8,
      endlag: 10,
      hitbox: { offsetX: 13, offsetY: -11, width: 20, height: 17 },
      damage: 12,
      baseKnockback: 3.3,
      knockbackGrowth: 68,
      launchAngleDeg: 32,
      hitstop: 6,
    },
    neutralSpecial: {
      name: 'Hero Arrow',
      startup: 9,
      active: 4,
      endlag: 15,
      hitbox: { offsetX: 12, offsetY: -10, width: 10, height: 10 },
      damage: 9,
      baseKnockback: 2.8,
      knockbackGrowth: 42,
      launchAngleDeg: 28,
      hitstop: 5,
      projectile: {
        speedX: 4.9,
        speedY: -0.25,
        gravity: 0.04,
        radius: 4,
        lifetime: 75,
        colorIndex: 13,
        glowIndex: 14,
      },
    },
    upSpecial: {
      name: 'Spin Attack',
      startup: 5,
      active: 15,
      endlag: 18,
      hitbox: { offsetX: 0, offsetY: -14, width: 28, height: 18 },
      damage: 13,
      baseKnockback: 4.0,
      knockbackGrowth: 76,
      launchAngleDeg: 62,
      hitstop: 7,
      velocityBoostX: 1.4,
      velocityBoostY: -6.5,
    },
  },
};
