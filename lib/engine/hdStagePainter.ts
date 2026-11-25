import type { SpriteStackVolume, StageManifest, StageVfxKind } from '../types/stage';
import type { DynamicVolumePose } from './platformMotion';
import { projectPoint, VIRTUAL_HEIGHT, VIRTUAL_WIDTH, type CameraRig } from './camera';

export type HdDrawCtx = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
export type TextureSource = ImageBitmap | HTMLImageElement | null;

export interface HdViewport {
  width: number;
  height: number;
  scale: number;
  offsetX: number;
  offsetY: number;
}

interface ScreenPt {
  sx: number;
  sy: number;
  scale: number;
  depth: number;
}

export function computeHdViewport(targetWidth: number, targetHeight: number): HdViewport {
  const scaleX = targetWidth / VIRTUAL_WIDTH;
  const scaleY = targetHeight / VIRTUAL_HEIGHT;
  const isPortrait = targetHeight > targetWidth;
  const scale = isPortrait ? scaleX * 1.12 : Math.max(scaleX, scaleY);
  const drawW = Math.ceil(VIRTUAL_WIDTH * scale);
  const drawH = Math.ceil(VIRTUAL_HEIGHT * scale);
  const portraitOffsetY = isPortrait ? Math.round(-targetHeight * 0.06) : 0;
  return {
    width: targetWidth,
    height: targetHeight,
    scale,
    offsetX: Math.floor((targetWidth - drawW) * 0.5),
    offsetY: Math.floor((targetHeight - drawH) * 0.5) + portraitOffsetY,
  };
}

export function projectToScreen(
  cam: CameraRig,
  vp: HdViewport,
  x: number,
  y: number,
  z: number,
): ScreenPt {
  const p = projectPoint(cam, x, y, z);
  return {
    sx: vp.offsetX + p.sx * vp.scale,
    sy: vp.offsetY + p.sy * vp.scale,
    scale: p.scale * vp.scale,
    depth: p.depth,
  };
}

/**
 * Draws the stage's 16:9 rendered artwork at native full-HD resolution with smooth
 * camera-linked parallax overscan and soft theatrical framing depth.
 */
export function drawHdBackdrop(
  ctx: HdDrawCtx,
  vp: HdViewport,
  stage: StageManifest,
  cam: CameraRig,
  tick: number,
  bitmap: TextureSource,
): void {
  const { width, height } = vp;
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, stage.sky.zenith);
  grad.addColorStop(0.55, stage.sky.mid);
  grad.addColorStop(1, stage.sky.horizon);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  if (bitmap) {
    const imgW = 'naturalWidth' in bitmap ? bitmap.naturalWidth : bitmap.width;
    const imgH = 'naturalHeight' in bitmap ? bitmap.naturalHeight : bitmap.height;
    if (imgW > 0 && imgH > 0) {
      const overscan = 1.1;
      const coverScale = Math.max((width * overscan) / imgW, (height * overscan) / imgH);
      const drawW = imgW * coverScale;
      const drawH = imgH * coverScale;
      const maxShiftX = (drawW - width) * 0.45;
      const maxShiftY = (drawH - height) * 0.45;
      const rawX = (-cam.focalX * 0.14 - cam.yawDeg * 0.9) * vp.scale;
      const rawY = (-cam.focalY * 0.1 - (cam.pitchDeg - 14) * 0.4) * vp.scale;
      const shiftX = Math.max(-maxShiftX, Math.min(maxShiftX, rawX));
      const shiftY = Math.max(-maxShiftY, Math.min(maxShiftY, rawY));
      const drawX = (width - drawW) * 0.5 + shiftX;
      const drawY = (height - drawH) * 0.5 + shiftY;

      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(bitmap as CanvasImageSource, drawX, drawY, drawW, drawH);

      // Gentle biome color harmony + subtle bottom vignette so foreground platforms & fighters pop
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = stage.sky.mid;
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha = 1;

      const vig = ctx.createLinearGradient(0, 0, 0, height);
      vig.addColorStop(0, 'rgba(2, 6, 18, 0.18)');
      vig.addColorStop(0.5, 'rgba(2, 6, 18, 0.0)');
      vig.addColorStop(1, 'rgba(2, 6, 18, 0.42)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
      return;
    }
  }

  // Soft retro starfield fallback while HD image decodes
  if (stage.sky.starColor) {
    ctx.fillStyle = stage.sky.starColor;
    for (let i = 0; i < 42; i++) {
      const sx = ((i * 97 + tick * 0.04) % VIRTUAL_WIDTH) * vp.scale + vp.offsetX;
      const sy = ((i * 53) % 180) * vp.scale + vp.offsetY;
      const sz = (i % 5 === 0 ? 2 : 1) * Math.max(1, vp.scale * 0.7);
      ctx.fillRect(sx, sy, sz, sz);
    }
  }
}

/**
 * Renders crisp resolution-independent ambient particles (embers, snow, petals, rain, speedlines, bubbles, stars).
 */
export function drawHdAmbientVfx(
  ctx: HdDrawCtx,
  vp: HdViewport,
  vfx: StageVfxKind,
  tick: number,
): void {
  if (vfx === 'none') return;
  const s = vp.scale;
  const ox = vp.offsetX;
  const oy = vp.offsetY;

  if (vfx === 'embers') {
    for (let i = 0; i < 28; i++) {
      const vx = ((i * 43 + Math.sin(tick * 0.04 + i) * 14) % VIRTUAL_WIDTH + VIRTUAL_WIDTH) % VIRTUAL_WIDTH;
      const vy = VIRTUAL_HEIGHT - ((tick * (1 + (i % 3) * 0.45) + i * 29) % VIRTUAL_HEIGHT);
      ctx.fillStyle = i % 3 === 0 ? '#FEF08A' : '#FB923C';
      const sz = (i % 4 === 0 ? 2.5 : 1.7) * s;
      ctx.fillRect(ox + vx * s, oy + vy * s, sz, sz * 0.8);
    }
    return;
  }

  if (vfx === 'snow') {
    ctx.fillStyle = 'rgba(248, 250, 252, 0.85)';
    for (let i = 0; i < 36; i++) {
      const vx = ((i * 37 + Math.sin(tick * 0.03 + i) * 18) % VIRTUAL_WIDTH + VIRTUAL_WIDTH) % VIRTUAL_WIDTH;
      const vy = (tick * (0.7 + (i % 3) * 0.3) + i * 23) % VIRTUAL_HEIGHT;
      const r = (i % 3 === 0 ? 1.4 : 0.9) * s;
      ctx.beginPath();
      ctx.arc(ox + vx * s, oy + vy * s, r, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }

  if (vfx === 'petals') {
    for (let i = 0; i < 24; i++) {
      const vx = (VIRTUAL_WIDTH - ((tick * 1.4 + i * 53) % VIRTUAL_WIDTH)) % VIRTUAL_WIDTH;
      const vy = (tick * 0.55 + i * 31 + Math.sin(tick * 0.06 + i) * 10) % VIRTUAL_HEIGHT;
      ctx.fillStyle = i % 2 === 0 ? '#F9A8D4' : '#FBCFE8';
      ctx.fillRect(ox + vx * s, oy + vy * s, 2.8 * s, 1.8 * s);
    }
    return;
  }

  if (vfx === 'rain') {
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.48)';
    ctx.lineWidth = Math.max(1, s * 0.55);
    ctx.beginPath();
    for (let i = 0; i < 34; i++) {
      const vx = ((i * 31 - tick * 1.5) % VIRTUAL_WIDTH + VIRTUAL_WIDTH) % VIRTUAL_WIDTH;
      const vy = (tick * 4.5 + i * 37) % VIRTUAL_HEIGHT;
      const sx = ox + vx * s;
      const sy = oy + vy * s;
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx - 2 * s, sy + 9 * s);
    }
    ctx.stroke();
    return;
  }

  if (vfx === 'speedlines') {
    ctx.fillStyle = 'rgba(224, 242, 254, 0.38)';
    for (let i = 0; i < 16; i++) {
      const vy = (i * 19 + 12) % VIRTUAL_HEIGHT;
      const len = 18 + (i % 4) * 14;
      const vx = VIRTUAL_WIDTH - ((tick * (9 + (i % 3) * 3) + i * 71) % (VIRTUAL_WIDTH + len));
      ctx.fillRect(ox + vx * s, oy + vy * s, len * s, Math.max(1, 0.9 * s));
    }
    return;
  }

  if (vfx === 'bubbles') {
    for (let i = 0; i < 18; i++) {
      const vx = ((i * 47 + Math.sin(tick * 0.04 + i) * 8) % VIRTUAL_WIDTH + VIRTUAL_WIDTH) % VIRTUAL_WIDTH;
      const vy = VIRTUAL_HEIGHT - ((tick * 0.9 + i * 33) % VIRTUAL_HEIGHT);
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(232, 121, 249, 0.65)' : 'rgba(56, 189, 248, 0.65)';
      ctx.lineWidth = Math.max(1, s * 0.5);
      ctx.beginPath();
      ctx.arc(ox + vx * s, oy + vy * s, 2.1 * s, 0, Math.PI * 2);
      ctx.stroke();
    }
    return;
  }

  for (let i = 0; i < 10; i++) {
    const phase = (tick * 3 + i * 67) % 320;
    if (phase < 40) {
      const sx = ox + ((i * 73 + phase * 3) % VIRTUAL_WIDTH) * s;
      const sy = oy + ((i * 29 + phase) % 130) * s;
      ctx.fillStyle = '#FEF08A';
      ctx.fillRect(sx, sy, 5 * s, Math.max(1, 1.1 * s));
    }
  }
}

function traceQuad(ctx: HdDrawCtx, a: ScreenPt, b: ScreenPt, c: ScreenPt, d: ScreenPt): void {
  ctx.beginPath();
  ctx.moveTo(a.sx, a.sy);
  ctx.lineTo(b.sx, b.sy);
  ctx.lineTo(c.sx, c.sy);
  ctx.lineTo(d.sx, d.sy);
  ctx.closePath();
}

function drawTiledTextureInQuad(
  ctx: HdDrawCtx,
  a: ScreenPt,
  b: ScreenPt,
  c: ScreenPt,
  d: ScreenPt,
  texture: TextureSource,
  fallbackColor: string,
  tileSizePx: number,
  tintColor: string,
  tintAlpha: number,
  shadeBottomAlpha: number,
): void {
  const minX = Math.min(a.sx, b.sx, c.sx, d.sx);
  const maxX = Math.max(a.sx, b.sx, c.sx, d.sx);
  const minY = Math.min(a.sy, b.sy, c.sy, d.sy);
  const maxY = Math.max(a.sy, b.sy, c.sy, d.sy);
  const spanW = maxX - minX;
  const spanH = maxY - minY;
  if (spanW < 1 || spanH < 1) return;

  ctx.save();
  traceQuad(ctx, a, b, c, d);
  ctx.clip();

  if (texture) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    const tile = Math.max(28, tileSizePx);
    for (let y = minY; y < maxY; y += tile) {
      for (let x = minX; x < maxX; x += tile) {
        ctx.drawImage(texture as CanvasImageSource, x, y, tile + 0.75, tile + 0.75);
      }
    }
    if (tintAlpha > 0) {
      ctx.globalAlpha = tintAlpha;
      ctx.fillStyle = tintColor;
      ctx.fillRect(minX, minY, spanW, spanH);
      ctx.globalAlpha = 1;
    }
  } else {
    ctx.fillStyle = fallbackColor;
    ctx.fillRect(minX, minY, spanW, spanH);
  }

  if (shadeBottomAlpha > 0) {
    const shade = ctx.createLinearGradient(0, minY, 0, maxY);
    shade.addColorStop(0, 'rgba(255, 255, 255, 0.14)');
    shade.addColorStop(0.28, 'rgba(0, 0, 0, 0.04)');
    shade.addColorStop(1, `rgba(4, 7, 18, ${shadeBottomAlpha})`);
    ctx.fillStyle = shade;
    ctx.fillRect(minX, minY, spanW, spanH);
  }

  ctx.restore();
}

function drawEdgeOverhang(
  ctx: HdDrawCtx,
  vol: SpriteStackVolume,
  tFL: ScreenPt,
  tFR: ScreenPt,
  pxScale: number,
): void {
  const dx = tFR.sx - tFL.sx;
  const dy = tFR.sy - tFL.sy;
  const edgeLen = Math.hypot(dx, dy);
  if (edgeLen < 12) return;

  const lipH = Math.max(2.5, Math.min(9, (vol.passThrough ? 3.2 : 5.5) * pxScale));

  ctx.save();
  if (vol.pattern === 'grass-stone') {
    const scallops = Math.max(6, Math.round(edgeLen / Math.max(12, 16 * pxScale)));
    ctx.beginPath();
    ctx.moveTo(tFL.sx, tFL.sy);
    for (let i = 0; i < scallops; i++) {
      const t0 = i / scallops;
      const tMid = (i + 0.5) / scallops;
      const t1 = (i + 1) / scallops;
      const mx = tFL.sx + dx * tMid;
      const my = tFL.sy + dy * tMid + lipH * (i % 2 === 0 ? 1.15 : 0.78);
      const ex = tFL.sx + dx * t1;
      const ey = tFL.sy + dy * t1 + lipH * 0.25;
      if (i === 0) ctx.lineTo(tFL.sx + dx * t0, tFL.sy + dy * t0 + lipH * 0.25);
      ctx.quadraticCurveTo(mx, my, ex, ey);
    }
    ctx.lineTo(tFR.sx, tFR.sy);
    ctx.closePath();
    ctx.fillStyle = vol.topColor;
    ctx.fill();
    ctx.strokeStyle = 'rgba(6, 16, 10, 0.75)';
    ctx.lineWidth = Math.max(1, pxScale * 0.7);
    ctx.stroke();
  } else if (vol.pattern === 'wood-bridge') {
    ctx.strokeStyle = 'rgba(20, 24, 34, 0.9)';
    ctx.lineWidth = Math.max(2, lipH * 0.75);
    ctx.beginPath();
    ctx.moveTo(tFL.sx, tFL.sy + lipH * 0.35);
    ctx.lineTo(tFR.sx, tFR.sy + lipH * 0.35);
    ctx.stroke();
    const rivets = Math.max(4, Math.round(edgeLen / Math.max(16, 22 * pxScale)));
    ctx.fillStyle = vol.trimColor;
    const r = Math.max(1.2, pxScale * 0.85);
    for (let i = 1; i < rivets; i++) {
      const t = i / rivets;
      ctx.beginPath();
      ctx.arc(tFL.sx + dx * t, tFL.sy + dy * t + lipH * 0.35, r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (vol.pattern === 'obsidian-gold' || vol.pattern === 'crystal-pillar') {
    ctx.strokeStyle = vol.trimColor;
    ctx.lineWidth = Math.max(1.8, lipH * 0.55);
    ctx.beginPath();
    ctx.moveTo(tFL.sx, tFL.sy + lipH * 0.2);
    ctx.lineTo(tFR.sx, tFR.sy + lipH * 0.2);
    ctx.stroke();
  } else {
    // brick-fortress / cloud-deck sculpted stone/marble cornice lip
    ctx.strokeStyle = vol.trimColor;
    ctx.lineWidth = Math.max(2, lipH * 0.65);
    ctx.beginPath();
    ctx.moveTo(tFL.sx, tFL.sy + lipH * 0.22);
    ctx.lineTo(tFR.sx, tFR.sy + lipH * 0.22);
    ctx.stroke();
  }
  ctx.restore();
}

function drawHdSurfaceCue(
  ctx: HdDrawCtx,
  vol: SpriteStackVolume,
  tFL: ScreenPt,
  tFR: ScreenPt,
  tBL: ScreenPt,
  tBR: ScreenPt,
  tick: number,
): void {
  if (!vol.surfaceEffect || vol.surfaceEffect === 'normal') return;
  const cx = (tFL.sx + tFR.sx + tBL.sx + tBR.sx) * 0.25;
  const cy = (tFL.sy + tFR.sy + tBL.sy + tBR.sy) * 0.25;
  const halfW = Math.hypot(tFR.sx - tFL.sx, tFR.sy - tFL.sy) * 0.4;
  const h = Math.max(2.5, Math.abs(tFL.sy - tBL.sy) * 0.32);

  ctx.save();
  if (vol.surfaceEffect === 'spring') {
    const pulse = Math.sin(tick * 0.25) > 0 ? '#FEF08A' : '#FACC15';
    ctx.fillStyle = '#B45309';
    ctx.fillRect(cx - halfW, cy - h * 0.5, halfW * 2, h);
    ctx.fillStyle = pulse;
    ctx.fillRect(cx - halfW + 4, cy - h, Math.max(8, halfW * 2 - 8), h * 0.7);
  } else if (vol.surfaceEffect === 'conveyor-right' || vol.surfaceEffect === 'conveyor-left') {
    const dir = vol.surfaceEffect === 'conveyor-right' ? 1 : -1;
    const step = 24;
    const shift = (((tick * dir * 2.4) % step) + step) % step;
    ctx.fillStyle = '#FACC15';
    for (let x = -halfW + shift; x < halfW - 6; x += step) {
      ctx.fillRect(cx + x, cy - h * 0.35, 9, Math.max(2.5, h * 0.7));
    }
  } else if (vol.surfaceEffect === 'ice') {
    ctx.fillStyle = 'rgba(224, 242, 254, 0.55)';
    ctx.fillRect(cx - halfW, cy - h * 0.3, halfW * 2, Math.max(2, h * 0.55));
  }
  ctx.restore();
}

/**
 * Projects and paints a single 2.5D stage volume directly at full HD screen resolution
 * using high-detail seamless painted material textures, directional shading, and overhang trim.
 */
export function drawHdPlatformVolume(
  ctx: HdDrawCtx,
  vol: SpriteStackVolume,
  pose: DynamicVolumePose,
  cam: CameraRig,
  vp: HdViewport,
  texture: TextureSource,
  tick: number,
): void {
  const hw = vol.width * 0.5;
  const hd = vol.depth * 0.5;
  const topY = pose.topY;
  const botY = pose.topY + vol.height;

  // Optional bottom taper for decorative fortress keels or crystalline pillars
  let botScale = 1;
  if (vol.decorative && vol.pattern !== 'crystal-pillar') {
    botScale = 0.76;
  } else if (vol.pattern === 'crystal-pillar' && vol.decorative) {
    botScale = 1.12;
  }

  const tBL = projectToScreen(cam, vp, pose.x - hw, topY, vol.z - hd);
  const tBR = projectToScreen(cam, vp, pose.x + hw, topY, vol.z - hd);
  const tFR = projectToScreen(cam, vp, pose.x + hw, topY, vol.z + hd);
  const tFL = projectToScreen(cam, vp, pose.x - hw, topY, vol.z + hd);

  const bhw = hw * botScale;
  const bhd = hd * botScale;
  const bBL = projectToScreen(cam, vp, pose.x - bhw, botY, vol.z - bhd);
  const bBR = projectToScreen(cam, vp, pose.x + bhw, botY, vol.z - bhd);
  const bFR = projectToScreen(cam, vp, pose.x + bhw, botY, vol.z + bhd);
  const bFL = projectToScreen(cam, vp, pose.x - bhw, botY, vol.z + bhd);

  const avgScale = (tFL.scale + tFR.scale) * 0.5;
  const tilePx = Math.max(38, Math.round(52 * avgScale));
  const outlineW = Math.max(1.25, avgScale * 0.65);

  ctx.save();
  if (pose.alpha < 1) {
    ctx.globalAlpha = pose.alpha;
  }

  // 1) Visible side wall when camera has yaw
  if (cam.yawDeg > 1.5) {
    drawTiledTextureInQuad(ctx, tBL, tFL, bFL, bBL, texture, vol.sideColor, tilePx, vol.sideColor, 0.34, 0.62);
    traceQuad(ctx, tBL, tFL, bFL, bBL);
    ctx.strokeStyle = 'rgba(4, 8, 18, 0.85)';
    ctx.lineWidth = outlineW;
    ctx.stroke();
  } else if (cam.yawDeg < -1.5) {
    drawTiledTextureInQuad(ctx, tFR, tBR, bBR, bFR, texture, vol.sideColor, tilePx, vol.sideColor, 0.34, 0.62);
    traceQuad(ctx, tFR, tBR, bBR, bFR);
    ctx.strokeStyle = 'rgba(4, 8, 18, 0.85)';
    ctx.lineWidth = outlineW;
    ctx.stroke();
  }

  // 2) Extruded front cliff / architectural facade
  if (cam.pitchDeg < 78) {
    drawTiledTextureInQuad(ctx, tFL, tFR, bFR, bFL, texture, vol.midColor, tilePx, vol.midColor, 0.24, 0.54);
    traceQuad(ctx, tFL, tFR, bFR, bFL);
    ctx.strokeStyle = 'rgba(4, 8, 18, 0.9)';
    ctx.lineWidth = outlineW;
    ctx.stroke();
  }

  // 3) Playable top deck surface (high readability + subtle biome top glaze)
  drawTiledTextureInQuad(ctx, tBL, tBR, tFR, tFL, texture, vol.topColor, tilePx * 0.85, vol.topColor, 0.38, 0.14);
  traceQuad(ctx, tBL, tBR, tFR, tFL);
  ctx.strokeStyle = 'rgba(4, 8, 18, 0.85)';
  ctx.lineWidth = outlineW;
  ctx.stroke();

  // 4) Sunlit rim + material overhang along front lip
  drawEdgeOverhang(ctx, vol, tFL, tFR, avgScale);

  // 5) Interactive surface mechanics (springs, conveyors, ice sheen)
  if (pose.solidActive) {
    drawHdSurfaceCue(ctx, vol, tFL, tFR, tBL, tBR, tick);
  }

  ctx.restore();
}
