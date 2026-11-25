import type { StageManifest } from '../types/stage';
import type { BakedFighterSprites, BakedFramePair, BakedSurface } from '../roster/paletteBaker';
import { type CameraRig } from './camera';
import type { BakedStageCache } from './stageBaker';
import { StageBackdropLoader } from './backdropLoader';
import {
  computeHdViewport,
  drawHdAmbientVfx,
  drawHdBackdrop,
  drawHdPlatformVolume,
  projectToScreen,
  type HdDrawCtx,
  type HdViewport,
} from './hdStagePainter';
import { computeVolumeState } from './platformMotion';
import {
  getActiveHitboxes,
  HURTBOX_HALF_W,
  HURTBOX_HEIGHT,
  type FighterEntity,
  type ParticleEntity,
  type ProjectileEntity,
} from './combatTypes';
import { PUSHBOX_MIN_DIST } from './pushbox';

export type RenderableFighter = Omit<FighterEntity, 'slot'> & { slot: number };

export interface RenderableSimulation {
  stage: StageManifest;
  fighters: ReadonlyArray<RenderableFighter>;
  projectiles: ReadonlyArray<ProjectileEntity>;
  particles: ReadonlyArray<ParticleEntity>;
  matchTimeTicks: number;
}

const SLOT_TAG_COLORS = [
  '#EF4444',
  '#3B82F6',
  '#FACC15',
  '#22C55E',
  '#F97316',
  '#06B6D4',
  '#EC4899',
  '#A855F7',
] as const;

interface RenderQueueItem {
  depth: number;
  priority: number;
  draw: (ctx: HdDrawCtx) => void;
}

function selectFighterSurface(f: RenderableFighter, pair: BakedFramePair): BakedSurface {
  if (f.hitFlashTimer > 0) {
    return f.facing > 0 ? pair.flashRight : pair.flashLeft;
  }
  return f.facing > 0 ? pair.right : pair.left;
}

/**
 * Hybrid HD-2.5D renderer:
 * - Full native-HD painted backdrops & atmospheric VFX
 * - High-detail painted 2.5D textured platforms & extruded cliff facades
 * - Razor-sharp nearest-neighbor pixel-art fighters, projectiles, and particles depth-sorted in 3D
 */
export class SoftwareRenderer25D {
  private readonly backdrops = new StageBackdropLoader();

  constructor() {
    this.backdrops.preloadAllTextures();
  }

  public preloadBackdrop(url: string): void {
    this.backdrops.request(url);
    this.backdrops.preloadAllTextures();
  }

  public renderFrame(
    targetCtx: HdDrawCtx,
    targetWidth: number,
    targetHeight: number,
    sim: RenderableSimulation,
    cam: CameraRig,
    stageCache: BakedStageCache,
    bakedFighters: ReadonlyArray<BakedFighterSprites>,
    hitboxesVisible: boolean,
    lockedTargetSlot: number | null = null,
  ): void {
    const vp = computeHdViewport(targetWidth, targetHeight);
    const bitmap = this.backdrops.get(sim.stage.backdropImage);

    drawHdBackdrop(targetCtx, vp, sim.stage, cam, sim.matchTimeTicks, bitmap);
    drawHdAmbientVfx(targetCtx, vp, sim.stage.vfx, sim.matchTimeTicks);

    const queue: RenderQueueItem[] = [];

    this.enqueueClouds(queue, sim.stage, cam, vp, sim.matchTimeTicks);

    for (const bakedVol of stageCache.volumes) {
      this.enqueueHdVolume(queue, bakedVol.volume, cam, vp, sim.matchTimeTicks);
    }

    for (const fighter of sim.fighters) {
      const eliminated = fighter.respawnTimer > 0 && fighter.stocks <= 0;
      if (eliminated) continue;
      this.enqueueFighterShadow(queue, fighter, sim.stage, cam, vp, sim.matchTimeTicks);
    }

    const fighterCount = Math.min(sim.fighters.length, bakedFighters.length);
    for (let i = 0; i < fighterCount; i++) {
      const f = sim.fighters[i];
      if (f.stocks <= 0 && f.respawnTimer > 100) continue;
      const isLockedTarget = lockedTargetSlot === f.slot && f.stocks > 0;
      this.enqueueFighterBillboard(queue, f, bakedFighters[i], cam, vp, sim.matchTimeTicks, isLockedTarget);
    }

    for (const proj of sim.projectiles) {
      this.enqueueProjectile(queue, proj, cam, vp);
    }
    for (const part of sim.particles) {
      this.enqueueParticle(queue, part, cam, vp);
    }

    queue.sort((a, b) => a.depth - b.depth || a.priority - b.priority);
    for (let i = 0; i < queue.length; i++) {
      queue[i].draw(targetCtx);
    }

    if (hitboxesVisible) {
      this.drawDebugOverlay(targetCtx, sim, cam, vp);
    }
  }

  private enqueueClouds(
    queue: RenderQueueItem[],
    stage: StageManifest,
    cam: CameraRig,
    vp: HdViewport,
    tick: number,
  ): void {
    const cfg = stage.clouds;
    const span = 640;
    for (let i = 0; i < cfg.count; i++) {
      const baseSeed = i * 107;
      const wx = ((baseSeed + tick * cfg.speed * (1 + (i % 3) * 0.25)) % span) - span * 0.5;
      const wy = cfg.minY + ((i * 47) % Math.max(20, cfg.maxY - cfg.minY));
      const wz = -85 - (i % 3) * 32;
      const p = projectToScreen(cam, vp, wx, wy, wz);
      const rx = Math.max(14, 24 * p.scale);
      const ry = Math.max(5, 8 * p.scale);

      queue.push({
        depth: p.depth - 90,
        priority: 2,
        draw: (ctx) => {
          ctx.save();
          ctx.globalAlpha = 0.24;
          ctx.fillStyle = cfg.baseColor;
          ctx.beginPath();
          ctx.ellipse(p.sx, p.sy, rx, ry, 0, 0, Math.PI * 2);
          ctx.ellipse(p.sx - rx * 0.45, p.sy + ry * 0.18, rx * 0.65, ry * 0.72, 0, 0, Math.PI * 2);
          ctx.ellipse(p.sx + rx * 0.48, p.sy + ry * 0.2, rx * 0.62, ry * 0.7, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        },
      });
    }
  }

  private enqueueHdVolume(
    queue: RenderQueueItem[],
    vol: StageManifest['volumes'][number],
    cam: CameraRig,
    vp: HdViewport,
    tick: number,
  ): void {
    const pose = computeVolumeState(vol, tick);
    const center = projectToScreen(cam, vp, pose.x, pose.topY + vol.height * 0.35, vol.z);
    const texture = this.backdrops.getTexture(vol.pattern);

    queue.push({
      depth: center.depth,
      priority: vol.decorative ? 8 : 20,
      draw: (ctx) => {
        drawHdPlatformVolume(ctx, vol, pose, cam, vp, texture, tick);
      },
    });
  }

  private enqueueFighterShadow(
    queue: RenderQueueItem[],
    fighter: RenderableFighter,
    stage: StageManifest,
    cam: CameraRig,
    vp: HdViewport,
    tick: number,
  ): void {
    let groundY: number | null = null;
    for (const vol of stage.volumes) {
      if (vol.decorative) continue;
      const pose = computeVolumeState(vol, tick);
      if (!pose.solidActive) continue;
      const left = pose.x - vol.width * 0.5;
      const right = pose.x + vol.width * 0.5;
      const overDeck = fighter.x >= left - 4 && fighter.x <= right + 4 && pose.topY >= fighter.y - 2;
      if (overDeck && (groundY === null || pose.topY < groundY)) {
        groundY = pose.topY;
      }
    }
    if (groundY === null) return;

    const altitude = Math.max(0, groundY - fighter.y);
    const shrink = Math.max(0.35, 1 - altitude / 140);
    const p = projectToScreen(cam, vp, fighter.x, groundY - 0.5, 0);
    const rx = Math.max(6, 11 * p.scale * shrink);
    const ry = Math.max(2.5, 4.2 * p.scale * shrink * Math.max(0.45, Math.sin((cam.pitchDeg * Math.PI) / 180)));

    queue.push({
      depth: p.depth + 2.5,
      priority: 80,
      draw: (ctx) => {
        ctx.save();
        ctx.fillStyle = 'rgba(4, 8, 20, 0.48)';
        ctx.beginPath();
        ctx.ellipse(p.sx, p.sy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      },
    });
  }

  private enqueueFighterBillboard(
    queue: RenderQueueItem[],
    f: RenderableFighter,
    sprites: BakedFighterSprites,
    cam: CameraRig,
    vp: HdViewport,
    tick: number,
    isLockedTarget: boolean,
  ): void {
    const clip = sprites.clips[f.animState] ?? sprites.clips.idle;
    const frameIdx = Math.floor(f.animTick / Math.max(1, clip.ticksPerFrame)) % clip.frames.length;
    const pair = clip.frames[frameIdx] ?? clip.frames[0];
    const blinkHidden = f.invulnTimer > 0 && Math.floor(tick / 4) % 2 === 0;
    const foot = projectToScreen(cam, vp, f.x, f.y, 2);

    const aspect = pair.width / Math.max(1, pair.height);
    let baseWorldH = 24;
    if (pair.height >= 30) {
      baseWorldH = 31;
    } else if (pair.height >= 22) {
      baseWorldH = 28;
    }
    const drawH = Math.max(24, Math.round(baseWorldH * foot.scale * f.squashY));
    const drawW = Math.max(24, Math.round(baseWorldH * aspect * foot.scale * f.squashX));
    const surf = selectFighterSurface(f, pair);

    queue.push({
      depth: foot.depth + 4,
      priority: 100 + f.slot,
      draw: (ctx) => {
        ctx.save();
        ctx.imageSmoothingEnabled = false;

        if (f.respawnTimer > 0 && f.respawnTimer < 100) {
          const padW = Math.round(24 * foot.scale);
          ctx.fillStyle = '#F8FAFC';
          ctx.fillRect(Math.round(foot.sx - padW * 0.5), Math.round(foot.sy), padW, Math.max(3, Math.round(3 * foot.scale)));
        }

        if (!blinkHidden) {
          const wiggleX = f.grabbedBySlot !== null ? Math.round(Math.sin(tick * 1.15) * 2) : 0;
          ctx.drawImage(
            surf as CanvasImageSource,
            Math.round(foot.sx - drawW * 0.5 + wiggleX),
            Math.round(foot.sy - drawH),
            drawW,
            drawH,
          );
        }

        if (f.holdingSlot !== null) {
          this.drawGrabHoldCue(ctx, foot.sx, foot.sy, drawW, drawH, f.facing, tick);
        }

        if (f.wallClingDir !== 0) {
          const edgeX = Math.round(foot.sx + f.wallClingDir * (drawW * 0.44));
          const topY = Math.round(foot.sy - drawH * 0.78);
          ctx.fillStyle = '#F8FAFC';
          ctx.fillRect(edgeX, topY, Math.max(2, Math.round(2 * vp.scale)), Math.max(8, Math.round(drawH * 0.45)));
          ctx.fillStyle = '#38BDF8';
          ctx.fillRect(edgeX, topY + 3, Math.max(1, Math.round(vp.scale)), Math.max(5, Math.round(drawH * 0.28)));
        }

        const slotColor = SLOT_TAG_COLORS[f.slot % SLOT_TAG_COLORS.length];

        if (f.shielding && f.shieldHp > 0) {
          const r = Math.max(14, Math.round(drawH * 0.58 * (0.45 + 0.55 * (f.shieldHp / 100))));
          ctx.strokeStyle = slotColor;
          ctx.fillStyle = `${slotColor}3D`;
          ctx.lineWidth = Math.max(2, 1.5 * vp.scale);
          ctx.beginPath();
          ctx.arc(Math.round(foot.sx), Math.round(foot.sy - drawH * 0.5), r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

        const tagH = Math.max(6, Math.round(5 * vp.scale));
        const tagW = Math.max(10, Math.round(7 * vp.scale));
        const tagY = Math.round(foot.sy - drawH - tagH - 6);
        const tagX = Math.round(foot.sx);
        ctx.fillStyle = slotColor;
        ctx.beginPath();
        ctx.moveTo(tagX - tagW * 0.5, tagY);
        ctx.lineTo(tagX + tagW * 0.5, tagY);
        ctx.lineTo(tagX, tagY + tagH);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        if (isLockedTarget) {
          this.drawTargetReticle(ctx, foot.sx, foot.sy - drawH * 0.52, Math.max(drawW, drawH) * 0.56, tick);
        }

        ctx.restore();
      },
    });
  }

  private drawGrabHoldCue(
    ctx: HdDrawCtx,
    footX: number,
    footY: number,
    drawW: number,
    drawH: number,
    facing: 1 | -1,
    tick: number,
  ): void {
    const claspX = Math.round(footX + facing * drawW * 0.52);
    const claspY = Math.round(footY - drawH * 0.52);
    const pulse = 1 + Math.sin(tick * 0.35) * 0.14;
    const r = Math.max(7, Math.round(drawW * 0.24 * pulse));

    ctx.save();
    ctx.strokeStyle = '#FACC15';
    ctx.fillStyle = 'rgba(250, 204, 21, 0.28)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(claspX, claspY, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const badgeY = Math.round(footY - drawH - 22);
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(9, 14, 28, 0.85)';
    ctx.fillRect(Math.round(footX - 24), badgeY - 9, 48, 13);
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(Math.round(footX - 24), badgeY - 9, 48, 13);
    ctx.fillStyle = '#FDE047';
    ctx.fillText('HOLD!', Math.round(footX), badgeY + 1);
    ctx.restore();
  }

  private drawTargetReticle(
    ctx: HdDrawCtx,
    cx: number,
    cy: number,
    radius: number,
    tick: number,
  ): void {
    const pulse = 1 + Math.sin(tick * 0.18) * 0.08;
    const r = Math.max(18, radius * pulse);
    const spin = tick * 0.045;
    const bracketArc = 0.42;

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.86, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const base = spin + (i * Math.PI) / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, base - bracketArc, base + bracketArc);
      ctx.stroke();
    }

    ctx.fillStyle = '#EF4444';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      const ang = (i * Math.PI) / 2;
      const px = cx + Math.cos(ang) * (r + 5);
      const py = cy + Math.sin(ang) * (r + 5);
      ctx.beginPath();
      ctx.arc(px, py, 2.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  private enqueueProjectile(
    queue: RenderQueueItem[],
    proj: ProjectileEntity,
    cam: CameraRig,
    vp: HdViewport,
  ): void {
    const p = projectToScreen(cam, vp, proj.x, proj.y, 3);
    const r = Math.max(5, Math.round(proj.radius * p.scale * 1.15));

    queue.push({
      depth: p.depth + 6,
      priority: 120,
      draw: (ctx) => {
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = proj.glowColor;
        ctx.fillRect(Math.round(p.sx - r - 2), Math.round(p.sy - r - 2), (r + 2) * 2, (r + 2) * 2);
        ctx.fillStyle = proj.color;
        ctx.fillRect(Math.round(p.sx - r), Math.round(p.sy - r), r * 2, r * 2);
        ctx.restore();
      },
    });
  }

  private enqueueParticle(
    queue: RenderQueueItem[],
    part: ParticleEntity,
    cam: CameraRig,
    vp: HdViewport,
  ): void {
    const p = projectToScreen(cam, vp, part.x, part.y, part.z + 4);
    const alpha = Math.max(0.1, part.life / part.maxLife);
    const sz = Math.max(3, Math.round(part.size * p.scale * alpha));

    queue.push({
      depth: p.depth + 8,
      priority: 130,
      draw: (ctx) => {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = part.color;
        ctx.fillRect(Math.round(p.sx - sz * 0.5), Math.round(p.sy - sz * 0.5), sz, sz);
        ctx.restore();
      },
    });
  }

  private drawDebugOverlay(
    ctx: HdDrawCtx,
    sim: RenderableSimulation,
    cam: CameraRig,
    vp: HdViewport,
  ): void {
    ctx.save();
    const bz = sim.stage.blastZones;
    const tl = projectToScreen(cam, vp, bz.left, bz.top, 0);
    const br = projectToScreen(cam, vp, bz.right, bz.bottom, 0);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.strokeRect(Math.round(tl.sx), Math.round(tl.sy), Math.round(br.sx - tl.sx), Math.round(br.sy - tl.sy));
    ctx.setLineDash([]);

    for (const f of sim.fighters) {
      if (f.respawnTimer > 0) continue;
      const hTL = projectToScreen(cam, vp, f.x - HURTBOX_HALF_W, f.y - HURTBOX_HEIGHT, 2);
      const hBR = projectToScreen(cam, vp, f.x + HURTBOX_HALF_W, f.y, 2);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
      ctx.strokeStyle = '#10B981';
      ctx.fillRect(Math.round(hTL.sx), Math.round(hTL.sy), Math.round(hBR.sx - hTL.sx), Math.round(hBR.sy - hTL.sy));
      ctx.strokeRect(Math.round(hTL.sx), Math.round(hTL.sy), Math.round(hBR.sx - hTL.sx), Math.round(hBR.sy - hTL.sy));

      const pTL = projectToScreen(cam, vp, f.x - PUSHBOX_MIN_DIST * 0.5, f.y - HURTBOX_HEIGHT * 0.85, 2);
      const pBR = projectToScreen(cam, vp, f.x + PUSHBOX_MIN_DIST * 0.5, f.y, 2);
      ctx.strokeStyle = '#38BDF8';
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(Math.round(pTL.sx), Math.round(pTL.sy), Math.round(pBR.sx - pTL.sx), Math.round(pBR.sy - pTL.sy));
      ctx.setLineDash([]);

      for (const activeHb of getActiveHitboxes(f as FighterEntity)) {
        const aTL = projectToScreen(cam, vp, activeHb.x, activeHb.y, 3);
        const aBR = projectToScreen(cam, vp, activeHb.x + activeHb.w, activeHb.y + activeHb.h, 3);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.strokeStyle = '#EF4444';
        ctx.fillRect(Math.round(aTL.sx), Math.round(aTL.sy), Math.round(aBR.sx - aTL.sx), Math.round(aBR.sy - aTL.sy));
        ctx.strokeRect(Math.round(aTL.sx), Math.round(aTL.sy), Math.round(aBR.sx - aTL.sx), Math.round(aBR.sy - aTL.sy));
      }
    }
    ctx.restore();
  }
}
