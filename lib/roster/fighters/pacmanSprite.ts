import type { AnimState, IndexedFrame, PalettePreset, PixelChart } from '../../types/palette';
import {
  buildDualEraSpriteCharts,
  PixelSpriteCanvas,
  type ShadePair,
} from '../classicSpriteCanvas';

interface PacManPose {
  readonly mode: 'chomp' | 'giant' | 'fruit' | 'pop';
  readonly radius: number;
  readonly mouthDeg: number;
  readonly aimDeg: number;
  readonly bobY: number;
  readonly showPellet: boolean;
  readonly showGhost: boolean;
  readonly phase: number;
}

const PAC_MAN_POSES: Record<AnimState, readonly PacManPose[]> = {
  idle: [
    { mode: 'chomp', radius: 9.2, mouthDeg: 18, aimDeg: 0, bobY: 0, showPellet: true, showGhost: false, phase: 0 },
    { mode: 'chomp', radius: 9.2, mouthDeg: 42, aimDeg: 0, bobY: -1, showPellet: true, showGhost: false, phase: 1 },
  ],
  walk: [
    { mode: 'chomp', radius: 9.2, mouthDeg: 4, aimDeg: 0, bobY: 0, showPellet: false, showGhost: false, phase: 0 },
    { mode: 'chomp', radius: 9.2, mouthDeg: 32, aimDeg: 0, bobY: -1, showPellet: false, showGhost: false, phase: 1 },
    { mode: 'chomp', radius: 9.2, mouthDeg: 58, aimDeg: 0, bobY: 0, showPellet: false, showGhost: false, phase: 2 },
    { mode: 'chomp', radius: 9.2, mouthDeg: 32, aimDeg: 0, bobY: -1, showPellet: false, showGhost: false, phase: 3 },
  ],
  jump: [
    { mode: 'chomp', radius: 9.2, mouthDeg: 46, aimDeg: -35, bobY: -2, showPellet: true, showGhost: false, phase: 0 },
    { mode: 'chomp', radius: 9.2, mouthDeg: 22, aimDeg: -20, bobY: -1, showPellet: false, showGhost: false, phase: 1 },
  ],
  attack: [
    { mode: 'chomp', radius: 9.6, mouthDeg: 64, aimDeg: 0, bobY: 0, showPellet: false, showGhost: true, phase: 0 },
    { mode: 'chomp', radius: 9.6, mouthDeg: 14, aimDeg: 0, bobY: 0, showPellet: false, showGhost: true, phase: 1 },
  ],
  smash: [
    { mode: 'giant', radius: 12.2, mouthDeg: 58, aimDeg: 0, bobY: -1, showPellet: false, showGhost: false, phase: 0 },
    { mode: 'giant', radius: 13.0, mouthDeg: 42, aimDeg: 0, bobY: -1, showPellet: false, showGhost: false, phase: 1 },
  ],
  special: [
    { mode: 'fruit', radius: 9.2, mouthDeg: 48, aimDeg: 0, bobY: 0, showPellet: false, showGhost: false, phase: 0 },
    { mode: 'fruit', radius: 9.2, mouthDeg: 26, aimDeg: 0, bobY: -1, showPellet: false, showGhost: false, phase: 1 },
  ],
  hurt: [
    { mode: 'pop', radius: 9.2, mouthDeg: 110, aimDeg: -90, bobY: 1, showPellet: false, showGhost: false, phase: 0 },
  ],
};

const PAC_MAN_TICKS: Record<AnimState, number> = {
  idle: 16,
  walk: 6,
  jump: 10,
  attack: 5,
  smash: 7,
  special: 8,
  hurt: 12,
};

function drawPacmanWedgeBody(
  canvas: PixelSpriteCanvas,
  cx: number,
  cy: number,
  radius: number,
  mouthHalfDeg: number,
  aimDeg: number,
): void {
  const minX = Math.floor(cx - radius - 1);
  const maxX = Math.ceil(cx + radius + 1);
  const minY = Math.floor(cy - radius - 1);
  const maxY = Math.ceil(cy + radius + 1);
  const halfRad = (mouthHalfDeg * Math.PI) / 180;
  const aimRad = (aimDeg * Math.PI) / 180;

  for (let py = minY; py <= maxY; py++) {
    for (let px = minX; px <= maxX; px++) {
      const dx = px - cx;
      const dy = py - cy;
      const dist = Math.hypot(dx, dy);
      const outsideCircle = dist > radius;
      if (outsideCircle) continue;

      if (mouthHalfDeg > 2 && dist > 0.6) {
        const angle = Math.atan2(dy, dx);
        let delta = angle - aimRad;
        while (delta > Math.PI) delta -= Math.PI * 2;
        while (delta < -Math.PI) delta += Math.PI * 2;
        const insideMouth = Math.abs(delta) < halfRad;
        if (insideMouth) continue;
      }

      canvas.plot(px, py, 3);
    }
  }

  canvas.fillEllipse(cx - radius * 0.28, cy - radius * 0.34, 1.8, 1.4, 2);
  canvas.plot(cx - radius * 0.34, cy - radius * 0.4, 15);
}

function drawBonusCherries(canvas: PixelSpriteCanvas, fx: number, fy: number): void {
  canvas.drawLine(fx - 1, fy - 2, fx + 1, fy - 5, 11, 0);
  canvas.drawLine(fx + 2, fy - 1, fx + 1, fy - 5, 11, 0);
  canvas.plot(fx + 2, fy - 5, 11);
  canvas.fillEllipse(fx - 1, fy, 1.8, 1.8, 9);
  canvas.fillEllipse(fx + 2, fy + 1, 1.8, 1.8, 9);
  canvas.plot(fx - 2, fy - 1, 15);
  canvas.plot(fx + 1, fy, 15);
}

function drawScaredMiniGhost(canvas: PixelSpriteCanvas, gx: number, gy: number): void {
  canvas.fillEllipse(gx, gy - 1, 2.6, 2.5, 12);
  canvas.fillRect(gx - 2, gy - 1, 5, 4, 12);
  canvas.plot(gx - 1, gy - 1, 15);
  canvas.plot(gx + 1, gy - 1, 15);
  canvas.plot(gx - 1, gy + 1, 10);
  canvas.plot(gx, gy + 1, 10);
  canvas.plot(gx + 1, gy + 1, 10);
}

function drawPopBurst(canvas: PixelSpriteCanvas, cx: number, cy: number): void {
  drawPacmanWedgeBody(canvas, cx, cy, 8.8, 110, -90);
  for (let i = 0; i < 8; i++) {
    const rad = (i * Math.PI) / 4;
    const x1 = cx + Math.cos(rad) * 9.5;
    const y1 = cy + Math.sin(rad) * 9.5;
    const x2 = cx + Math.cos(rad) * 12.2;
    const y2 = cy + Math.sin(rad) * 12.2;
    canvas.drawLine(x1, y1, x2, y2, 14, 0);
  }
}

function renderPacMan16BitFrame(pose: PacManPose): IndexedFrame {
  const canvas = new PixelSpriteCanvas(32, 32);
  const cx = pose.mode === 'giant' ? 15 : 13;
  const cy = 19 + pose.bobY;

  if (pose.mode === 'pop') {
    drawPopBurst(canvas, cx, cy);
    canvas.applyAutoOutline(1, [14, 15]);
    return canvas.toFrame();
  }

  drawPacmanWedgeBody(canvas, cx, cy, pose.radius, pose.mouthDeg, pose.aimDeg);

  if (pose.mode === 'giant') {
    canvas.drawArc(cx, cy, pose.radius + 1.4, pose.radius + 1.4, -155, -75, 14, 0.5);
    canvas.plot(cx + 12, cy - 8, 15);
    canvas.plot(cx + 13, cy + 7, 15);
  }

  if (pose.showPellet) {
    const pelletX = cx + 12;
    const pelletY = cy + (pose.aimDeg < 0 ? -4 : 0);
    canvas.fillEllipse(pelletX, pelletY, 1.9, 1.9, 14);
    canvas.plot(pelletX, pelletY, 15);
  }

  if (pose.showGhost) {
    const ghostX = pose.phase === 0 ? cx + 11 : cx + 8;
    drawScaredMiniGhost(canvas, ghostX, cy);
  }

  if (pose.mode === 'fruit') {
    const cherryX = pose.phase === 0 ? cx + 11 : cx + 14;
    drawBonusCherries(canvas, cherryX, cy);
  }

  const shades: readonly ShadePair[] = [{ base: 3, shadow: 4 }];
  canvas.applyCelShading(shades);
  canvas.applyAutoOutline(1, [14, 15]);
  return canvas.toFrame();
}

export const PAC_MAN_DUAL_ERA: { snesChart: PixelChart; nesChart: PixelChart } =
  buildDualEraSpriteCharts(PAC_MAN_POSES, PAC_MAN_TICKS, renderPacMan16BitFrame, {
    width: 16,
    height: 16,
  });

export const PAC_MAN_ARCADE_PALETTES: PalettePreset[] = [
  {
    name: 'Namco Arcade Yellow',
    colors: [
      '', '#060814', '#FFFF88', '#FFEE00', '#D4A800', '#FDE047', '#A16207',
      '#FACC15', '#FF9900', '#FF1E1E', '#FFFFFF', '#22CC44', '#2121FF',
      '#00FFFF', '#FFE0A0', '#FFFFFF',
    ],
  },
  {
    name: 'Blinky Red',
    colors: [
      '', '#120404', '#FF9898', '#FF1E1E', '#B80808', '#F87171', '#7F1D1D',
      '#FACC15', '#FF8800', '#FF1E1E', '#FFFFFF', '#22CC44', '#2121FF',
      '#00FFFF', '#FFE0A0', '#FFFFFF',
    ],
  },
  {
    name: 'Pinky Pastel',
    colors: [
      '', '#140614', '#FFE4FF', '#FFB8FF', '#D478D4', '#F472B6', '#9D174D',
      '#FACC15', '#FF88CC', '#FF1E1E', '#FFFFFF', '#22CC44', '#2121FF',
      '#00FFFF', '#FFE0A0', '#FFFFFF',
    ],
  },
  {
    name: 'Inky Cyan',
    colors: [
      '', '#041418', '#B8FFFF', '#00FFFF', '#00A8C8', '#67E8F9', '#0E7490',
      '#FACC15', '#38BDF8', '#FF1E1E', '#FFFFFF', '#22CC44', '#2121FF',
      '#00FFFF', '#FFE0A0', '#FFFFFF',
    ],
  },
  {
    name: 'Clyde Orange',
    colors: [
      '', '#160B04', '#FFE0A8', '#FFB852', '#C87818', '#FB923C', '#9A3412',
      '#FACC15', '#F97316', '#FF1E1E', '#FFFFFF', '#22CC44', '#2121FF',
      '#00FFFF', '#FFE0A0', '#FFFFFF',
    ],
  },
  {
    name: 'Scared Ghost Blue',
    colors: [
      '', '#040614', '#93C5FD', '#2121FF', '#1414A8', '#3B82F6', '#1E3A8A',
      '#FACC15', '#60A5FA', '#FF1E1E', '#FFFFFF', '#22CC44', '#FF1E1E',
      '#00FFFF', '#FFE0A0', '#FFFFFF',
    ],
  },
];
