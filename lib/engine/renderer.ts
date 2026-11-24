import type { SpriteStackVolume, StageManifest } from '../types/stage';
import type { BakedFighterSprites, BakedFramePair, BakedSurface } from '../roster/paletteBaker';
import {
  projectPoint,
  VIRTUAL_HEIGHT,
  VIRTUAL_WIDTH,
  type CameraRig,
} from './camera';
import type { BakedStageCache, BakedVolumeSlices } from './stageBaker';
import { StageBackdropLoader } from './backdropLoader';
import { drawAmbientStageVfx, drawStageBackdrop } from './ambientVfx';
import { computeVolumeState } from './platformMotion';
import {
  getActiveHitbox,
  HURTBOX_HALF_W,
  HURTBOX_HEIGHT,
  type FighterEntity,
  type ParticleEntity,
  type ProjectileEntity,
  type SimulationState,
} from './combatTypes';

type DrawCtx = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

interface RenderQueueItem {
  depth: number;
  priority: number;
  draw: (ctx: DrawCtx) => void;
}

function selectFighterSurface(f: FighterEntity, pair: BakedFramePair): BakedSurface {
  if (f.hitFlashTimer > 0) {
    return f.facing > 0 ? pair.flashRight : pair.flashLeft;
  }
  return f.facing > 0 ? pair.right : pair.left;
}

function drawSurfaceMechanicCue(
  ctx: DrawCtx,
  vol: SpriteStackVolume,
  centerSx: number,
  centerSy: number,
  widthPx: number,
  tick: number,
): void {
  const halfW = Math.max(8, Math.round(widthPx * 0.42));
  const y = Math.round(centerSy - 2);

  if (vol.surfaceEffect === 'spring') {
    const pulse = Math.sin(tick * 0.25) > 0 ? '#FEF08A' : '#FACC15';
    ctx.fillStyle = '#B45309';
    ctx.fillRect(Math.round(centerSx - halfW), y, halfW * 2, 3);
    ctx.fillStyle = pulse;
    ctx.fillRect(Math.round(centerSx - halfW + 2), y - 2, Math.max(4, halfW * 2 - 4), 2);
    return;
  }

  if (vol.surfaceEffect === 'conveyor-right' || vol.surfaceEffect === 'conveyor-left') {
    const dir = vol.surfaceEffect === 'conveyor-right' ? 1 : -1;
    const step = 10;
    const shift = ((tick * dir) % step + step) % step;
    ctx.fillStyle = '#FACC15';
    for (let x = -halfW + shift; x < halfW - 3; x += step) {
      ctx.fillRect(Math.round(centerSx + x), y, 4, 2);
    }
    return;
  }

  if (vol.surfaceEffect === 'ice') {
    ctx.fillStyle = 'rgba(224, 242, 254, 0.72)';
    ctx.fillRect(Math.round(centerSx - halfW), y, halfW * 2, 2);
  }
}

export class SoftwareRenderer25D {
  private readonly buffer: BakedSurface;
  private readonly bctx: DrawCtx;
  private readonly backdrops = new StageBackdropLoader();

  constructor() {
    if (typeof OffscreenCanvas !== 'undefined') {
      this.buffer = new OffscreenCanvas(VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
    } else {
      const c = document.createElement('canvas');
      c.width = VIRTUAL_WIDTH;
      c.height = VIRTUAL_HEIGHT;
      this.buffer = c;
    }
    const ctx = this.buffer.getContext('2d') as DrawCtx | null;
    if (!ctx) throw new Error('Virtual framebuffer 2D context unavailable');
    ctx.imageSmoothingEnabled = false;
    this.bctx = ctx;
  }

  public preloadBackdrop(url: string): void {
    this.backdrops.request(url);
  }

  public renderFrame(
    targetCtx: DrawCtx,
    targetWidth: number,
    targetHeight: number,
    sim: SimulationState,
    cam: CameraRig,
    stageCache: BakedStageCache,
    bakedFighters: [BakedFighterSprites, BakedFighterSprites],
    hitboxesVisible: boolean,
  ): void {
    const ctx = this.bctx;
    ctx.imageSmoothingEnabled = false;

    const bitmap = this.backdrops.get(sim.stage.backdropImage);
    drawStageBackdrop(ctx, sim.stage, cam, sim.matchTimeTicks, bitmap);
    drawAmbientStageVfx(ctx, sim.stage.vfx, sim.matchTimeTicks);

    const queue: RenderQueueItem[] = [];

    this.enqueueClouds(queue, sim.stage, stageCache, cam, sim.matchTimeTicks);

    for (const bakedVol of stageCache.volumes) {
      this.enqueueVolumeSlices(queue, bakedVol, cam, sim.matchTimeTicks);
    }

    for (const fighter of sim.fighters) {
      if (fighter.respawnTimer > 0 && fighter.stocks <= 0) continue;
      this.enqueueFighterShadow(queue, fighter, sim.stage, cam, sim.matchTimeTicks);
    }

    for (let i = 0; i < 2; i++) {
      const f = sim.fighters[i];
      if (f.stocks <= 0 && f.respawnTimer > 100) continue;
      this.enqueueFighterBillboard(queue, f, bakedFighters[i], cam, sim.matchTimeTicks);
    }

    for (const proj of sim.projectiles) {
      this.enqueueProjectile(queue, proj, cam);
    }
    for (const part of sim.particles) {
      this.enqueueParticle(queue, part, cam);
    }

    queue.sort((a, b) => a.depth - b.depth || a.priority - b.priority);
    for (let i = 0; i < queue.length; i++) {
      queue[i].draw(ctx);
    }

    if (hitboxesVisible) {
      this.drawDebugOverlay(ctx, sim, cam);
    }

    targetCtx.imageSmoothingEnabled = false;
    targetCtx.fillStyle = sim.stage.sky.zenith;
    targetCtx.fillRect(0, 0, targetWidth, targetHeight);

    const scale = Math.max(targetWidth / VIRTUAL_WIDTH, targetHeight / VIRTUAL_HEIGHT);
    const drawW = Math.ceil(VIRTUAL_WIDTH * scale);
    const drawH = Math.ceil(VIRTUAL_HEIGHT * scale);
    const offsetX = Math.floor((targetWidth - drawW) * 0.5);
    const offsetY = Math.floor((targetHeight - drawH) * 0.5);

    targetCtx.drawImage(
      this.buffer as CanvasImageSource,
      0,
      0,
      VIRTUAL_WIDTH,
      VIRTUAL_HEIGHT,
      offsetX,
      offsetY,
      drawW,
      drawH,
    );
  }

  private enqueueClouds(
    queue: RenderQueueItem[],
    stage: StageManifest,
    cache: BakedStageCache,
    cam: CameraRig,
    tick: number,
  ): void {
    const cfg = stage.clouds;
    const span = 520;
    for (let i = 0; i < cfg.count; i++) {
      const baseSeed = i * 89;
      const wx = ((baseSeed + tick * cfg.speed * (1 + (i % 3) * 0.25)) % span) - span * 0.5;
      const wy = cfg.minY + ((i * 47) % Math.max(20, cfg.maxY - cfg.minY));
      const wz = -70 - (i % 3) * 28;

      for (let s = 0; s < cache.cloudSlices.length; s++) {
        const sliceSurf = cache.cloudSlices[s];
        const p = projectPoint(cam, wx, wy - s * 3, wz);
        const halfW = sliceSurf.width * p.scale * 0.5;
        const halfH = Math.max(
          2,
          sliceSurf.height * p.scale * Math.max(0.24, Math.sin((cam.pitchDeg * Math.PI) / 180)),
        ) * 0.5;

        queue.push({
          depth: p.depth - 80,
          priority: s,
          draw: (ctx) => {
            ctx.globalAlpha = 0.7;
            ctx.drawImage(
              sliceSurf as CanvasImageSource,
              Math.round(p.sx - halfW),
              Math.round(p.sy - halfH),
              Math.max(4, Math.round(halfW * 2)),
              Math.max(2, Math.round(halfH * 2)),
            );
            ctx.globalAlpha = 1;
          },
        });
      }
    }
  }

  private enqueueVolumeSlices(
    queue: RenderQueueItem[],
    baked: BakedVolumeSlices,
    cam: CameraRig,
    tick: number,
  ): void {
    const vol = baked.volume;
    const pose = computeVolumeState(vol, tick);
    const count = baked.sliceBitmaps.length;
    const yawRad = (cam.yawDeg * Math.PI) / 180;
    const pitchRad = (cam.pitchDeg * Math.PI) / 180;
    const cosY = Math.cos(yawRad);
    const sinY = Math.sin(yawRad);
    const sinP = Math.max(0.18, Math.sin(pitchRad));

    for (let i = 0; i < count; i++) {
      const t = count > 1 ? i / (count - 1) : 1;
      const sliceY = pose.topY + vol.height * (1 - t);
      const center = projectPoint(cam, pose.x, sliceY, vol.z);
      const surf = baked.sliceBitmaps[i];
      const scale = center.scale;

      const a = cosY * scale;
      const b = -sinY * sinP * scale;
      const c = sinY * scale;
      const d = cosY * sinP * scale;
      const sliceThicknessPx = Math.max(2, Math.ceil((vol.height / count) * scale * Math.cos(pitchRad)) + 1);
      const isTopSlice = i === count - 1;

      queue.push({
        depth: center.depth + i * 0.015,
        priority: 10 + i,
        draw: (ctx) => {
          ctx.save();
          if (pose.alpha < 1) ctx.globalAlpha = pose.alpha;
          ctx.translate(Math.round(center.sx), Math.round(center.sy));
          ctx.transform(a, b, c, d, 0, 0);
          ctx.drawImage(surf as CanvasImageSource, -surf.width * 0.5, -surf.height * 0.5);
          ctx.restore();

          if (!isTopSlice && cam.pitchDeg < 42) {
            const pLeft = projectPoint(cam, pose.x - vol.width * 0.5, sliceY, vol.z + vol.depth * 0.5);
            const pRight = projectPoint(cam, pose.x + vol.width * 0.5, sliceY, vol.z + vol.depth * 0.5);
            const x0 = Math.round(Math.min(pLeft.sx, pRight.sx));
            const x1 = Math.round(Math.max(pLeft.sx, pRight.sx));
            const y0 = Math.round(Math.min(pLeft.sy, pRight.sy));
            if (pose.alpha < 1) ctx.globalAlpha = pose.alpha;
            ctx.fillStyle = i >= count - 2 ? vol.midColor : vol.sideColor;
            ctx.fillRect(x0, y0, Math.max(2, x1 - x0), sliceThicknessPx);
            if (pose.alpha < 1) ctx.globalAlpha = 1;
          }

          if (isTopSlice && vol.surfaceEffect && vol.surfaceEffect !== 'normal' && pose.solidActive) {
            drawSurfaceMechanicCue(ctx, vol, center.sx, center.sy, vol.width * scale, tick);
          }
        },
      });
    }
  }

  private enqueueFighterShadow(
    queue: RenderQueueItem[],
    fighter: FighterEntity,
    stage: StageManifest,
    cam: CameraRig,
    tick: number,
  ): void {
    let groundY: number | null = null;
    for (const vol of stage.volumes) {
      if (vol.decorative) continue;
      const pose = computeVolumeState(vol, tick);
      if (!pose.solidActive) continue;
      const left = pose.x - vol.width * 0.5;
      const right = pose.x + vol.width * 0.5;
      if (fighter.x >= left - 4 && fighter.x <= right + 4 && pose.topY >= fighter.y - 2) {
        if (groundY === null || pose.topY < groundY) {
          groundY = pose.topY;
        }
      }
    }
    if (groundY === null) return;

    const altitude = Math.max(0, groundY - fighter.y);
    const shrink = Math.max(0.35, 1 - altitude / 140);
    const p = projectPoint(cam, fighter.x, groundY - 0.5, 0);
    const rx = Math.max(3, Math.round(10 * p.scale * shrink));
    const ry = Math.max(2, Math.round(4 * p.scale * shrink * Math.max(0.45, Math.sin((cam.pitchDeg * Math.PI) / 180))));

    queue.push({
      depth: p.depth + 2.5,
      priority: 80,
      draw: (ctx) => {
        ctx.fillStyle = 'rgba(6, 10, 22, 0.45)';
        ctx.fillRect(Math.round(p.sx - rx), Math.round(p.sy - ry * 0.5), rx * 2, ry);
      },
    });
  }

  private enqueueFighterBillboard(
    queue: RenderQueueItem[],
    f: FighterEntity,
    sprites: BakedFighterSprites,
    cam: CameraRig,
    tick: number,
  ): void {
    const clip = sprites.clips[f.animState] ?? sprites.clips.idle;
    const frameIdx = Math.floor(f.animTick / Math.max(1, clip.ticksPerFrame)) % clip.frames.length;
    const pair = clip.frames[frameIdx] ?? clip.frames[0];
    const blinkHidden = f.invulnTimer > 0 && Math.floor(tick / 4) % 2 === 0;
    const foot = projectPoint(cam, f.x, f.y, 2);

    const aspect = pair.width / Math.max(1, pair.height);
    let baseWorldH = 24;
    if (pair.height >= 30) {
      baseWorldH = 31;
    } else if (pair.height >= 22) {
      baseWorldH = 28;
    }
    const drawH = Math.max(12, Math.round(baseWorldH * foot.scale * f.squashY));
    const drawW = Math.max(12, Math.round(baseWorldH * aspect * foot.scale * f.squashX));
    const surf = selectFighterSurface(f, pair);

    queue.push({
      depth: foot.depth + 4,
      priority: 100 + f.slot,
      draw: (ctx) => {
        if (f.respawnTimer > 0 && f.respawnTimer < 100) {
          ctx.fillStyle = '#F8FAFC';
          ctx.fillRect(Math.round(foot.sx - 12), Math.round(foot.sy), 24, 3);
        }

        if (!blinkHidden) {
          ctx.drawImage(
            surf as CanvasImageSource,
            Math.round(foot.sx - drawW * 0.5),
            Math.round(foot.sy - drawH),
            drawW,
            drawH,
          );
        }

        if (f.wallClingDir !== 0) {
          const edgeX = Math.round(foot.sx + f.wallClingDir * (drawW * 0.44));
          const topY = Math.round(foot.sy - drawH * 0.78);
          ctx.fillStyle = '#F8FAFC';
          ctx.fillRect(edgeX, topY, 2, Math.max(5, Math.round(drawH * 0.45)));
          ctx.fillStyle = '#38BDF8';
          ctx.fillRect(edgeX, topY + 2, 1, Math.max(3, Math.round(drawH * 0.28)));
        }

        if (f.shielding && f.shieldHp > 0) {
          const r = Math.max(8, Math.round((drawH * 0.58) * (0.45 + 0.55 * (f.shieldHp / 100))));
          ctx.save();
          ctx.strokeStyle = f.slot === 0 ? '#F87171' : '#60A5FA';
          ctx.fillStyle = f.slot === 0 ? 'rgba(239, 68, 68, 0.24)' : 'rgba(59, 130, 246, 0.24)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(Math.round(foot.sx), Math.round(foot.sy - drawH * 0.5), r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }

        const tagY = Math.round(foot.sy - drawH - 7);
        const tagX = Math.round(foot.sx);
        ctx.fillStyle = f.slot === 0 ? '#EF4444' : '#3B82F6';
        ctx.fillRect(tagX - 3, tagY, 6, 2);
        ctx.fillRect(tagX - 2, tagY + 2, 4, 1);
        ctx.fillRect(tagX - 1, tagY + 3, 2, 1);
      },
    });
  }

  private enqueueProjectile(queue: RenderQueueItem[], proj: ProjectileEntity, cam: CameraRig): void {
    const p = projectPoint(cam, proj.x, proj.y, 3);
    const r = Math.max(3, Math.round(proj.radius * p.scale * 1.15));

    queue.push({
      depth: p.depth + 6,
      priority: 120,
      draw: (ctx) => {
        ctx.fillStyle = proj.glowColor;
        ctx.fillRect(Math.round(p.sx - r - 1), Math.round(p.sy - r - 1), (r + 1) * 2, (r + 1) * 2);
        ctx.fillStyle = proj.color;
        ctx.fillRect(Math.round(p.sx - r), Math.round(p.sy - r), r * 2, r * 2);
      },
    });
  }

  private enqueueParticle(queue: RenderQueueItem[], part: ParticleEntity, cam: CameraRig): void {
    const p = projectPoint(cam, part.x, part.y, part.z + 4);
    const alpha = Math.max(0.1, part.life / part.maxLife);
    const sz = Math.max(2, Math.round(part.size * p.scale * alpha));

    queue.push({
      depth: p.depth + 8,
      priority: 130,
      draw: (ctx) => {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = part.color;
        ctx.fillRect(Math.round(p.sx - sz * 0.5), Math.round(p.sy - sz * 0.5), sz, sz);
        ctx.globalAlpha = 1;
      },
    });
  }

  private drawDebugOverlay(ctx: DrawCtx, sim: SimulationState, cam: CameraRig): void {
    ctx.save();
    const bz = sim.stage.blastZones;
    const tl = projectPoint(cam, bz.left, bz.top, 0);
    const br = projectPoint(cam, bz.right, bz.bottom, 0);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.65)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(Math.round(tl.sx), Math.round(tl.sy), Math.round(br.sx - tl.sx), Math.round(br.sy - tl.sy));
    ctx.setLineDash([]);

    for (const f of sim.fighters) {
      if (f.respawnTimer > 0) continue;
      const hTL = projectPoint(cam, f.x - HURTBOX_HALF_W, f.y - HURTBOX_HEIGHT, 2);
      const hBR = projectPoint(cam, f.x + HURTBOX_HALF_W, f.y, 2);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
      ctx.strokeStyle = '#10B981';
      ctx.fillRect(Math.round(hTL.sx), Math.round(hTL.sy), Math.round(hBR.sx - hTL.sx), Math.round(hBR.sy - hTL.sy));
      ctx.strokeRect(Math.round(hTL.sx), Math.round(hTL.sy), Math.round(hBR.sx - hTL.sx), Math.round(hBR.sy - hTL.sy));

      const activeHb = getActiveHitbox(f);
      if (activeHb) {
        const aTL = projectPoint(cam, activeHb.x, activeHb.y, 3);
        const aBR = projectPoint(cam, activeHb.x + activeHb.w, activeHb.y + activeHb.h, 3);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.strokeStyle = '#EF4444';
        ctx.fillRect(Math.round(aTL.sx), Math.round(aTL.sy), Math.round(aBR.sx - aTL.sx), Math.round(aBR.sy - aTL.sy));
        ctx.strokeRect(Math.round(aTL.sx), Math.round(aTL.sy), Math.round(aBR.sx - aTL.sx), Math.round(aBR.sy - aTL.sy));
      }
    }
    ctx.restore();
  }
}
