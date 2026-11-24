import type { StageManifest } from '../types/stage';
import type { BakedFighterSprites, BakedSurface } from '../roster/paletteBaker';
import {
  projectPoint,
  VIRTUAL_HEIGHT,
  VIRTUAL_WIDTH,
  type CameraRig,
} from './camera';
import type { BakedStageCache, BakedVolumeSlices } from './stageBaker';
import {
  getActiveHitbox,
  HURTBOX_HALF_W,
  HURTBOX_HEIGHT,
  type FighterEntity,
  type ParticleEntity,
  type ProjectileEntity,
  type SimulationState,
} from './physics';

interface RenderQueueItem {
  depth: number;
  priority: number;
  draw: (ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D) => void;
}

export class SoftwareRenderer25D {
  private readonly buffer: BakedSurface;
  private readonly bctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

  constructor() {
    if (typeof OffscreenCanvas !== 'undefined') {
      this.buffer = new OffscreenCanvas(VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
    } else {
      const c = document.createElement('canvas');
      c.width = VIRTUAL_WIDTH;
      c.height = VIRTUAL_HEIGHT;
      this.buffer = c;
    }
    const ctx = this.buffer.getContext('2d') as
      | OffscreenCanvasRenderingContext2D
      | CanvasRenderingContext2D
      | null;
    if (!ctx) throw new Error('Virtual framebuffer 2D context unavailable');
    ctx.imageSmoothingEnabled = false;
    this.bctx = ctx;
  }

  public renderFrame(
    targetCtx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
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

    // 1. Retro NES/SNES Parallax Skybox
    this.drawSkyBackdrop(ctx, sim.stage, cam, sim.matchTimeTicks);

    // 2. Build Painter's Algorithm Depth-Sorted Draw Queue
    const queue: RenderQueueItem[] = [];

    // 2a. Drifting Sprite-Stacked Clouds
    this.enqueueClouds(queue, sim.stage, stageCache, cam, sim.matchTimeTicks);

    // 2b. Pre-Baked 2.5D Sprite-Stacked Stage Slices
    for (const bakedVol of stageCache.volumes) {
      this.enqueueVolumeSlices(queue, bakedVol, cam);
    }

    // 2c. Projected Drop Shadows under Fighters
    for (const fighter of sim.fighters) {
      if (fighter.respawnTimer > 0 && fighter.stocks <= 0) continue;
      this.enqueueFighterShadow(queue, fighter, sim.stage, cam);
    }

    // 2d. Flat 2D Pixel Billboard Fighters (always camera-facing)
    for (let i = 0; i < 2; i++) {
      const f = sim.fighters[i];
      if (f.stocks <= 0 && f.respawnTimer > 100) continue;
      this.enqueueFighterBillboard(queue, f, bakedFighters[i], cam, sim.matchTimeTicks);
    }

    // 2e. Projectiles & Particles
    for (const proj of sim.projectiles) {
      this.enqueueProjectile(queue, proj, cam);
    }
    for (const part of sim.particles) {
      this.enqueueParticle(queue, part, cam);
    }

    // Painter's algorithm sort: farthest depth first, priority tie-breaker
    queue.sort((a, b) => a.depth - b.depth || a.priority - b.priority);
    for (let i = 0; i < queue.length; i++) {
      queue[i].draw(ctx);
    }

    // 3. Optional Hitbox / Hurtbox / Blast-Zone Training Overlay
    if (hitboxesVisible) {
      this.drawDebugOverlay(ctx, sim, cam);
    }

    // 4. Full-Bleed Crisp Nearest-Neighbor Present onto Fullscreen Display Canvas
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

  private drawSkyBackdrop(
    ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
    stage: StageManifest,
    cam: CameraRig,
    tick: number,
  ): void {
    const { sky } = stage;
    // Banded retro sky gradient (pixel-stepped horizontal bands)
    const bands = 12;
    const bandH = Math.ceil(VIRTUAL_HEIGHT / bands);
    for (let i = 0; i < bands; i++) {
      const t = i / (bands - 1);
      ctx.fillStyle = t < 0.45 ? sky.zenith : t < 0.8 ? sky.mid : sky.horizon;
      ctx.fillRect(0, i * bandH, VIRTUAL_WIDTH, bandH);
    }

    const parallaxX = Math.round(-cam.focalX * 0.16 - cam.yawDeg * 1.1);
    const parallaxY = Math.round(-cam.focalY * 0.12 - (cam.pitchDeg - 13) * 0.55);

    // Pixel Starfield (for Starlight Altar)
    if (sky.starColor) {
      ctx.fillStyle = sky.starColor;
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

    // Retro Pixel Sun / Moon Disk
    if (sky.sunColor) {
      const sunX = Math.round(VIRTUAL_WIDTH * 0.78 + parallaxX * 0.4);
      const sunY = Math.round(52 + parallaxY * 0.35);
      ctx.fillStyle = sky.sunColor;
      ctx.fillRect(sunX - 14, sunY - 10, 28, 20);
      ctx.fillRect(sunX - 10, sunY - 14, 20, 28);
    }

    // Parallax Far & Near Stepped Retro Mountain Horizons
    this.drawMountainBand(ctx, sky.mountainFar, 186 + parallaxY * 0.4, parallaxX * 0.5, 22, 48);
    this.drawMountainBand(ctx, sky.mountainNear, 214 + parallaxY * 0.65, parallaxX * 0.85, 16, 36);
  }

  private drawMountainBand(
    ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
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
        const syWorld = wy - s * 3;
        const p = projectPoint(cam, wx, syWorld, wz);
        const halfW = (sliceSurf.width * p.scale) * 0.5;
        const halfH = Math.max(
          2,
          sliceSurf.height * p.scale * Math.max(0.24, Math.sin((cam.pitchDeg * Math.PI) / 180)),
        ) * 0.5;

        queue.push({
          depth: p.depth - 80,
          priority: s,
          draw: (ctx) => {
            ctx.globalAlpha = 0.82;
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
  ): void {
    const vol = baked.volume;
    const count = baked.sliceBitmaps.length;
    const yawRad = (cam.yawDeg * Math.PI) / 180;
    const pitchRad = (cam.pitchDeg * Math.PI) / 180;
    const cosY = Math.cos(yawRad);
    const sinY = Math.sin(yawRad);
    const sinP = Math.max(0.18, Math.sin(pitchRad));

    for (let i = 0; i < count; i++) {
      // Slice 0 is bottom of volume; slice count-1 is top surface (vol.topY)
      const t = count > 1 ? i / (count - 1) : 1;
      const sliceY = vol.topY + vol.height * (1 - t);
      const center = projectPoint(cam, vol.x, sliceY, vol.z);
      const surf = baked.sliceBitmaps[i];
      const scale = center.scale;

      // Exact 2D affine matrix mapping horizontal (X, Z) slice bitmap into projected camera space
      const a = cosY * scale;
      const b = -sinY * sinP * scale;
      const c = sinY * scale;
      const d = cosY * sinP * scale;

      const sliceThicknessPx = Math.max(2, Math.ceil((vol.height / count) * scale * Math.cos(pitchRad)) + 1);

      queue.push({
        depth: center.depth + i * 0.015,
        priority: 10 + i,
        draw: (ctx) => {
          ctx.save();
          ctx.translate(Math.round(center.sx), Math.round(center.sy));
          ctx.transform(a, b, c, d, 0, 0);
          ctx.drawImage(
            surf as CanvasImageSource,
            -surf.width * 0.5,
            -surf.height * 0.5,
          );
          ctx.restore();

          // Subtle vertical extrusion cap for side-view solidity between sparse slices
          if (i < count - 1 && cam.pitchDeg < 42) {
            const pLeft = projectPoint(cam, vol.x - vol.width * 0.5, sliceY, vol.z + vol.depth * 0.5);
            const pRight = projectPoint(cam, vol.x + vol.width * 0.5, sliceY, vol.z + vol.depth * 0.5);
            const x0 = Math.round(Math.min(pLeft.sx, pRight.sx));
            const x1 = Math.round(Math.max(pLeft.sx, pRight.sx));
            const y0 = Math.round(Math.min(pLeft.sy, pRight.sy));
            ctx.fillStyle = i >= count - 2 ? vol.midColor : vol.sideColor;
            ctx.fillRect(x0, y0, Math.max(2, x1 - x0), sliceThicknessPx);
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
  ): void {
    // Find nearest platform top surface directly beneath the fighter
    let groundY: number | null = null;
    for (const vol of stage.volumes) {
      if (vol.decorative) continue;
      const left = vol.x - vol.width * 0.5;
      const right = vol.x + vol.width * 0.5;
      if (fighter.x >= left - 4 && fighter.x <= right + 4 && vol.topY >= fighter.y - 2) {
        if (groundY === null || vol.topY < groundY) {
          groundY = vol.topY;
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

    const basePixelSize = 24;
    const drawW = Math.max(12, Math.round(basePixelSize * foot.scale * f.squashX));
    const drawH = Math.max(12, Math.round(basePixelSize * foot.scale * f.squashY));

    const surf =
      f.hitFlashTimer > 0
        ? f.facing > 0
          ? pair.flashRight
          : pair.flashLeft
        : f.facing > 0
          ? pair.right
          : pair.left;

    queue.push({
      depth: foot.depth + 4,
      priority: 100 + f.slot,
      draw: (ctx) => {
        // Respawn halo platform
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

        // Wall-cling grip friction streaks flush against the solid wall
        if (f.wallClingDir !== 0) {
          const edgeX = Math.round(foot.sx + f.wallClingDir * (drawW * 0.44));
          const topY = Math.round(foot.sy - drawH * 0.78);
          ctx.fillStyle = '#F8FAFC';
          ctx.fillRect(edgeX, topY, 2, Math.max(5, Math.round(drawH * 0.45)));
          ctx.fillStyle = '#38BDF8';
          ctx.fillRect(edgeX, topY + 2, 1, Math.max(3, Math.round(drawH * 0.28)));
        }

        // Shield bubble
        if (f.shielding && f.shieldHp > 0) {
          const r = Math.max(8, Math.round((drawH * 0.58) * (0.45 + 0.55 * (f.shieldHp / 100))));
          ctx.save();
          ctx.strokeStyle = f.slot === 0 ? '#F87171' : '#60A5FA';
          ctx.fillStyle =
            f.slot === 0 ? 'rgba(239, 68, 68, 0.24)' : 'rgba(59, 130, 246, 0.24)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(Math.round(foot.sx), Math.round(foot.sy - drawH * 0.5), r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }

        // Crisp P1 / P2 retro pointer caret above head
        const tagY = Math.round(foot.sy - drawH - 7);
        const tagX = Math.round(foot.sx);
        ctx.fillStyle = f.slot === 0 ? '#EF4444' : '#3B82F6';
        ctx.fillRect(tagX - 3, tagY, 6, 2);
        ctx.fillRect(tagX - 2, tagY + 2, 4, 1);
        ctx.fillRect(tagX - 1, tagY + 3, 2, 1);
      },
    });
  }

  private enqueueProjectile(
    queue: RenderQueueItem[],
    proj: ProjectileEntity,
    cam: CameraRig,
  ): void {
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

  private enqueueParticle(
    queue: RenderQueueItem[],
    part: ParticleEntity,
    cam: CameraRig,
  ): void {
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

  private drawDebugOverlay(
    ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
    sim: SimulationState,
    cam: CameraRig,
  ): void {
    ctx.save();
    // Blast-zone perimeter box projected onto combat plane (z = 0)
    const bz = sim.stage.blastZones;
    const tl = projectPoint(cam, bz.left, bz.top, 0);
    const br = projectPoint(cam, bz.right, bz.bottom, 0);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.65)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(
      Math.round(tl.sx),
      Math.round(tl.sy),
      Math.round(br.sx - tl.sx),
      Math.round(br.sy - tl.sy),
    );
    ctx.setLineDash([]);

    // Hurtboxes (Emerald) & Active Hitboxes (Red)
    for (const f of sim.fighters) {
      if (f.respawnTimer > 0) continue;
      const hTL = projectPoint(cam, f.x - HURTBOX_HALF_W, f.y - HURTBOX_HEIGHT, 2);
      const hBR = projectPoint(cam, f.x + HURTBOX_HALF_W, f.y, 2);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
      ctx.strokeStyle = '#10B981';
      ctx.fillRect(
        Math.round(hTL.sx),
        Math.round(hTL.sy),
        Math.round(hBR.sx - hTL.sx),
        Math.round(hBR.sy - hTL.sy),
      );
      ctx.strokeRect(
        Math.round(hTL.sx),
        Math.round(hTL.sy),
        Math.round(hBR.sx - hTL.sx),
        Math.round(hBR.sy - hTL.sy),
      );

      const activeHb = getActiveHitbox(f);
      if (activeHb) {
        const aTL = projectPoint(cam, activeHb.x, activeHb.y, 3);
        const aBR = projectPoint(cam, activeHb.x + activeHb.w, activeHb.y + activeHb.h, 3);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.strokeStyle = '#EF4444';
        ctx.fillRect(
          Math.round(aTL.sx),
          Math.round(aTL.sy),
          Math.round(aBR.sx - aTL.sx),
          Math.round(aBR.sy - aTL.sy),
        );
        ctx.strokeRect(
          Math.round(aTL.sx),
          Math.round(aTL.sy),
          Math.round(aBR.sx - aTL.sx),
          Math.round(aBR.sy - aTL.sy),
        );
      }
    }
    ctx.restore();
  }
}
