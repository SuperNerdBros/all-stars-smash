import type { StageManifest, StageVfxKind } from '../types/stage';
import { VIRTUAL_HEIGHT, VIRTUAL_WIDTH, type CameraRig } from './camera';

type DrawCtx = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

function pickSkyBandColor(stage: StageManifest, ratio: number): string {
  if (ratio < 0.45) return stage.sky.zenith;
  if (ratio < 0.8) return stage.sky.mid;
  return stage.sky.horizon;
}

function drawMountainBand(
  ctx: DrawCtx,
  color: string,
  baseY: number,
  scrollX: number,
  amp: number,
  stepW: number,
): void {
  ctx.fillStyle = color;
  const cols = Math.ceil(VIRTUAL_WIDTH / 8) + 2;
  for (let i = -1; i < cols; i++) {
    const x = i * 8;
    const worldCol = Math.floor((x - scrollX) / stepW);
    const h = Math.round(Math.abs(Math.sin(worldCol * 1.7 + 0.5)) * amp);
    const top = Math.round(baseY - h);
    ctx.fillRect(x, top, 8, VIRTUAL_HEIGHT - top + 16);
  }
}

/**
 * Draws either the high-craft rendered pixel-art backdrop PNG with smooth
 * camera-linked parallax overscan, or the procedural retro banded sky fallback.
 */
export function drawStageBackdrop(
  ctx: DrawCtx,
  stage: StageManifest,
  cam: CameraRig,
  tick: number,
  bitmap: ImageBitmap | HTMLImageElement | null,
): void {
  const parallaxX = Math.round(-cam.focalX * 0.14 - cam.yawDeg * 1.0);
  const parallaxY = Math.round(-cam.focalY * 0.1 - (cam.pitchDeg - 13) * 0.45);

  if (bitmap) {
    const overscanW = VIRTUAL_WIDTH + 72;
    const overscanH = VIRTUAL_HEIGHT + 46;
    const clampedX = Math.max(-34, Math.min(34, parallaxX));
    const clampedY = Math.max(-20, Math.min(20, parallaxY));
    const drawX = Math.round(-36 + clampedX);
    const drawY = Math.round(-23 + clampedY);

    ctx.drawImage(bitmap as CanvasImageSource, drawX, drawY, overscanW, overscanH);

    // Subtle atmospheric stage color wash so each stage's unique palette shines over shared biomes
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = stage.sky.mid;
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
    ctx.globalAlpha = 1;
    return;
  }

  // Fallback banded retro skybox while bitmap loads
  const bands = 12;
  const bandH = Math.ceil(VIRTUAL_HEIGHT / bands);
  for (let i = 0; i < bands; i++) {
    const ratio = i / (bands - 1);
    ctx.fillStyle = pickSkyBandColor(stage, ratio);
    ctx.fillRect(0, i * bandH, VIRTUAL_WIDTH, bandH);
  }

  if (stage.sky.starColor) {
    ctx.fillStyle = stage.sky.starColor;
    for (let i = 0; i < 42; i++) {
      const sx = (((i * 97 + parallaxX) % VIRTUAL_WIDTH) + VIRTUAL_WIDTH) % VIRTUAL_WIDTH;
      const sy = (((i * 53 + parallaxY) % 180) + 180) % 180;
      const twinkle = (tick + i * 11) % 48 < 36;
      if (twinkle) {
        const sz = i % 5 === 0 ? 2 : 1;
        ctx.fillRect(sx, sy, sz, sz);
      }
    }
  }

  if (stage.sky.sunColor) {
    const sunX = Math.round(VIRTUAL_WIDTH * 0.78 + parallaxX * 0.4);
    const sunY = Math.round(52 + parallaxY * 0.35);
    ctx.fillStyle = stage.sky.sunColor;
    ctx.fillRect(sunX - 14, sunY - 10, 28, 20);
    ctx.fillRect(sunX - 10, sunY - 14, 20, 28);
  }

  drawMountainBand(ctx, stage.sky.mountainFar, 186 + parallaxY * 0.4, parallaxX * 0.5, 22, 48);
  drawMountainBand(ctx, stage.sky.mountainNear, 214 + parallaxY * 0.65, parallaxX * 0.85, 16, 36);
}

/**
 * Renders animated weather, embers, speedlines, petals, bubbles, or shooting stars
 * over the stage skybox for cinematic 2.5D atmosphere.
 */
export function drawAmbientStageVfx(
  ctx: DrawCtx,
  vfx: StageVfxKind,
  tick: number,
): void {
  if (vfx === 'none') return;

  if (vfx === 'embers') {
    for (let i = 0; i < 28; i++) {
      const x = Math.round((i * 43 + Math.sin(tick * 0.04 + i) * 14) % VIRTUAL_WIDTH);
      const y = Math.round(VIRTUAL_HEIGHT - ((tick * (1 + (i % 3) * 0.45) + i * 29) % VIRTUAL_HEIGHT));
      ctx.fillStyle = i % 3 === 0 ? '#FEF08A' : '#FB923C';
      ctx.fillRect((x + VIRTUAL_WIDTH) % VIRTUAL_WIDTH, y, i % 4 === 0 ? 3 : 2, 2);
    }
    return;
  }

  if (vfx === 'snow') {
    ctx.fillStyle = '#F8FAFC';
    for (let i = 0; i < 34; i++) {
      const x = Math.round((i * 37 + Math.sin(tick * 0.03 + i) * 18) % VIRTUAL_WIDTH);
      const y = Math.round((tick * (0.7 + (i % 3) * 0.3) + i * 23) % VIRTUAL_HEIGHT);
      ctx.fillRect((x + VIRTUAL_WIDTH) % VIRTUAL_WIDTH, y, i % 3 === 0 ? 2 : 1, 2);
    }
    return;
  }

  if (vfx === 'petals') {
    for (let i = 0; i < 22; i++) {
      const x = Math.round((VIRTUAL_WIDTH - ((tick * 1.4 + i * 53) % VIRTUAL_WIDTH)) % VIRTUAL_WIDTH);
      const y = Math.round((tick * 0.55 + i * 31 + Math.sin(tick * 0.06 + i) * 10) % VIRTUAL_HEIGHT);
      ctx.fillStyle = i % 2 === 0 ? '#F9A8D4' : '#FBCFE8';
      ctx.fillRect(x, y, 3, 2);
    }
    return;
  }

  if (vfx === 'rain') {
    ctx.fillStyle = 'rgba(125, 211, 252, 0.55)';
    for (let i = 0; i < 32; i++) {
      const x = Math.round((i * 31 - tick * 1.5) % VIRTUAL_WIDTH);
      const y = Math.round((tick * 4.5 + i * 37) % VIRTUAL_HEIGHT);
      ctx.fillRect((x + VIRTUAL_WIDTH) % VIRTUAL_WIDTH, y, 1, 8);
    }
    return;
  }

  if (vfx === 'speedlines') {
    ctx.fillStyle = 'rgba(224, 242, 254, 0.45)';
    for (let i = 0; i < 16; i++) {
      const y = (i * 19 + 12) % VIRTUAL_HEIGHT;
      const len = 18 + (i % 4) * 14;
      const x = VIRTUAL_WIDTH - ((tick * (9 + (i % 3) * 3) + i * 71) % (VIRTUAL_WIDTH + len));
      ctx.fillRect(Math.round(x), y, len, 1);
    }
    return;
  }

  if (vfx === 'bubbles') {
    for (let i = 0; i < 18; i++) {
      const x = Math.round((i * 47 + Math.sin(tick * 0.04 + i) * 8) % VIRTUAL_WIDTH);
      const y = Math.round(VIRTUAL_HEIGHT - ((tick * 0.9 + i * 33) % VIRTUAL_HEIGHT));
      ctx.fillStyle = i % 2 === 0 ? 'rgba(232, 121, 249, 0.65)' : 'rgba(56, 189, 248, 0.65)';
      ctx.fillRect((x + VIRTUAL_WIDTH) % VIRTUAL_WIDTH, y, 3, 3);
    }
    return;
  }

  // Stars / shooting stars
  for (let i = 0; i < 10; i++) {
    const phase = (tick * 3 + i * 67) % 320;
    if (phase < 40) {
      const sx = (i * 73 + phase * 3) % VIRTUAL_WIDTH;
      const sy = (i * 29 + phase) % 130;
      ctx.fillStyle = '#FEF08A';
      ctx.fillRect(sx, sy, 4, 1);
    }
  }
}
