import type { CameraPreset } from '../types/protocol';

export const VIRTUAL_WIDTH = 480;
export const VIRTUAL_HEIGHT = 270;

export interface ProjectedPoint {
  sx: number;
  sy: number;
  scale: number;
  depth: number;
}

export interface CameraTargetSpec {
  pitchDeg: number;
  yawDeg: number;
  rollDeg: number;
  zoom: number;
  focalX: number;
  focalY: number;
  focalZ: number;
}

export interface CameraRig {
  preset: CameraPreset;
  pitchDeg: number;
  yawDeg: number;
  rollDeg: number;
  zoom: number;
  focalX: number;
  focalY: number;
  focalZ: number;
  shakeAmp: number;
  shakeX: number;
  shakeY: number;
  koZoomTimer: number;
  koFocusX: number;
  koFocusY: number;
}

/**
 * Top-Down preset is intentionally capped at 62 deg (SNES pseudo-top-down)
 * so 2D fighter billboards remain readable and depth-sort cleanly against stacked slices.
 */
const PRESET_ANGLES: Record<
  CameraPreset,
  { pitchDeg: number; yawDeg: number; rollDeg: number; baseZoom: number }
> = {
  SIDE_25D: { pitchDeg: 13, yawDeg: 0, rollDeg: 0, baseZoom: 1.04 },
  ISOMETRIC: { pitchDeg: 35, yawDeg: 28, rollDeg: 0, baseZoom: 0.88 },
  TOP_DOWN: { pitchDeg: 62, yawDeg: 0, rollDeg: 0, baseZoom: 0.92 },
  THIRD_PERSON: { pitchDeg: 16, yawDeg: -26, rollDeg: 0, baseZoom: 1.14 },
};

export function createCameraRig(preset: CameraPreset = 'SIDE_25D'): CameraRig {
  const cfg = PRESET_ANGLES[preset];
  return {
    preset,
    pitchDeg: cfg.pitchDeg,
    yawDeg: cfg.yawDeg,
    rollDeg: cfg.rollDeg,
    zoom: cfg.baseZoom,
    focalX: 0,
    focalY: 8,
    focalZ: 0,
    shakeAmp: 0,
    shakeX: 0,
    shakeY: 0,
    koZoomTimer: 0,
    koFocusX: 0,
    koFocusY: 0,
  };
}

export function triggerCameraShake(cam: CameraRig, amplitude: number): void {
  cam.shakeAmp = Math.max(cam.shakeAmp, Math.min(14, amplitude));
}

export function triggerKoZoom(cam: CameraRig, x: number, y: number): void {
  cam.koZoomTimer = 34;
  cam.koFocusX = Math.max(-230, Math.min(230, x * 0.45));
  cam.koFocusY = Math.max(-85, Math.min(85, y * 0.45));
  triggerCameraShake(cam, 10);
}

export function stepCameraRig(
  cam: CameraRig,
  fighters: ReadonlyArray<{ x: number; y: number; facing: 1 | -1; active: boolean }>,
  tick: number,
): void {
  const cfg = PRESET_ANGLES[cam.preset];
  const alive = fighters.filter((f) => f.active);

  let targetX = 0;
  let targetY = 6;
  let targetZoom = cfg.baseZoom;
  let targetYaw = cfg.yawDeg;
  const targetPitch = cfg.pitchDeg;

  if (cam.koZoomTimer > 0) {
    cam.koZoomTimer--;
    targetX = cam.koFocusX;
    targetY = cam.koFocusY;
    targetZoom = cfg.baseZoom * 1.25;
  } else if (alive.length > 0) {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const f of alive) {
      if (f.x < minX) minX = f.x;
      if (f.x > maxX) maxX = f.x;
      if (f.y < minY) minY = f.y;
      if (f.y > maxY) maxY = f.y;
    }

    if (cam.preset === 'THIRD_PERSON') {
      const p1 = alive[0];
      targetX = p1.x * 0.72;
      targetY = p1.y * 0.55 - 8;
      targetYaw = p1.facing > 0 ? -24 : 24;
      targetZoom = cfg.baseZoom;
    } else {
      const midX = (minX + maxX) * 0.5;
      const midY = (minY + maxY) * 0.5 - 6;
      targetX = Math.max(-165, Math.min(165, midX * 0.58));
      targetY = Math.max(-82, Math.min(52, midY * 0.48));

      const spanX = Math.max(155, maxX - minX + 135);
      const spanY = Math.max(100, maxY - minY + 100);
      const fitX = (VIRTUAL_WIDTH * 0.88) / spanX;
      const fitY = (VIRTUAL_HEIGHT * 0.8) / spanY;
      const dynamicFit = Math.min(fitX, fitY);
      targetZoom = Math.max(0.56, Math.min(cfg.baseZoom * 1.18, dynamicFit * 0.66));
    }
  }

  // Smooth exponential damping (frame-locked 60Hz) - zero hard cuts
  const angleLerp = 0.085;
  const posLerp = 0.1;
  const zoomLerp = 0.08;

  cam.pitchDeg += (targetPitch - cam.pitchDeg) * angleLerp;
  cam.yawDeg += (targetYaw - cam.yawDeg) * angleLerp;
  cam.rollDeg += (cfg.rollDeg - cam.rollDeg) * angleLerp;
  cam.focalX += (targetX - cam.focalX) * posLerp;
  cam.focalY += (targetY - cam.focalY) * posLerp;
  cam.focalZ += (0 - cam.focalZ) * posLerp;
  cam.zoom += (targetZoom - cam.zoom) * zoomLerp;

  if (cam.shakeAmp > 0.15) {
    cam.shakeX = Math.round(Math.sin(tick * 2.7) * cam.shakeAmp);
    cam.shakeY = Math.round(Math.cos(tick * 3.3) * cam.shakeAmp * 0.7);
    cam.shakeAmp *= 0.82;
  } else {
    cam.shakeAmp = 0;
    cam.shakeX = 0;
    cam.shakeY = 0;
  }
}

/**
 * Projects a 3D world coordinate (x = right, y = down, z = forward toward viewer)
 * onto the 480x270 virtual pixel framebuffer with subtle 2.5D perspective foreshortening.
 */
export function projectPoint(
  cam: CameraRig,
  x: number,
  y: number,
  z: number,
): ProjectedPoint {
  const rx = x - cam.focalX;
  const ry = y - cam.focalY;
  const rz = z - cam.focalZ;

  const yaw = (cam.yawDeg * Math.PI) / 180;
  const pitch = (cam.pitchDeg * Math.PI) / 180;

  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);

  // Rotate around Y axis (yaw)
  const x1 = rx * cosY + rz * sinY;
  const z1 = -rx * sinY + rz * cosY;

  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);

  // Rotate around X axis (pitch - looking downward from above onto stage)
  const y2 = ry * cosP + z1 * sinP;
  const z2 = -ry * sinP + z1 * cosP;

  // Gentle perspective divisor so 2.5D slices feel solid without extreme distortion
  const perspDist = 640;
  const persp = perspDist / Math.max(180, perspDist - z2);
  const scale = cam.zoom * persp;

  const sx = VIRTUAL_WIDTH * 0.5 + x1 * scale + cam.shakeX;
  const sy = VIRTUAL_HEIGHT * 0.54 + y2 * scale + cam.shakeY;

  return {
    sx,
    sy,
    scale,
    depth: z2,
  };
}
