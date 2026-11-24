import type { FighterBlueprint, GraphicsEra, MoveFrameData } from '../types/fighter';
import type { StageManifest } from '../types/stage';
import { bakeFighterSprites, type BakedFighterSprites } from '../roster/paletteBaker';
import { resolveFighterForEra } from '../roster/eraResolver';
import { createInputBuffer } from './inputBuffer';
import { createAiMemory } from './aiController';
import { createCameraRig, VIRTUAL_HEIGHT, VIRTUAL_WIDTH, type CameraRig } from './camera';
import { computeVolumeState } from './platformMotion';
import { bakeStageSlices, type BakedStageCache } from './stageBaker';
import {
  SoftwareRenderer25D,
  type RenderableFighter,
  type RenderableSimulation,
} from './renderer';
import {
  HURTBOX_HALF_W,
  HURTBOX_HEIGHT,
  rectsOverlap,
  type ActiveMoveKey,
  type ParticleEntity,
  type ProjectileEntity,
} from './combatTypes';

interface AttractFighter extends RenderableFighter {
  aiCooldown: number;
  aiThinkTimer: number;
  desiredDir: -1 | 0 | 1;
  targetSlot: number;
  moveHitSet: Set<number>;
}

interface StageBounds {
  centerX: number;
  centerY: number;
  baseZoom: number;
  safeHalfWidth: number;
  floorY: number;
}

interface ShowcaseAngle {
  pitchDeg: number;
  yawDeg: number;
  zoomScale: number;
}

const SHOWCASE_ANGLES: ReadonlyArray<ShowcaseAngle> = [
  { pitchDeg: 14, yawDeg: 0, zoomScale: 1.0 },
  { pitchDeg: 22, yawDeg: -15, zoomScale: 0.96 },
  { pitchDeg: 30, yawDeg: 16, zoomScale: 0.92 },
  { pitchDeg: 18, yawDeg: 12, zoomScale: 0.97 },
];

const ANGLE_HOLD_TICKS = 480;
const KO_COLORS = ['#EF4444', '#3B82F6', '#FACC15'] as const;

function computeStageBounds(stage: StageManifest): StageBounds {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let solidHalfWidth = 140;
  let floorY = 48;

  for (const vol of stage.volumes) {
    const padX = vol.motion ? Math.abs(vol.motion.ampX) : 0;
    const padY = vol.motion ? Math.abs(vol.motion.ampY) : 0;
    minX = Math.min(minX, vol.x - vol.width * 0.5 - padX);
    maxX = Math.max(maxX, vol.x + vol.width * 0.5 + padX);
    minY = Math.min(minY, vol.topY - padY - 36);
    maxY = Math.max(maxY, vol.topY + vol.height + padY);
    if (!vol.decorative && !vol.passThrough) {
      solidHalfWidth = Math.max(solidHalfWidth, Math.abs(vol.x) + vol.width * 0.5 - 12);
      floorY = Math.min(floorY, vol.topY);
    }
  }

  if (!Number.isFinite(minX)) {
    return { centerX: 0, centerY: 4, baseZoom: 0.72, safeHalfWidth: 160, floorY: 48 };
  }

  const spanX = Math.max(260, maxX - minX + 90);
  const spanY = Math.max(150, maxY - minY + 64);
  const fitX = (VIRTUAL_WIDTH * 0.84) / spanX;
  const fitY = (VIRTUAL_HEIGHT * 0.78) / spanY;
  const baseZoom = Math.max(0.54, Math.min(0.86, Math.min(fitX, fitY)));

  return {
    centerX: (minX + maxX) * 0.5,
    centerY: (minY + maxY) * 0.5 - 6,
    baseZoom,
    safeHalfWidth: solidHalfWidth,
    floorY,
  };
}

function createAttractFighter(
  slot: number,
  total: number,
  blueprint: FighterBlueprint,
  paletteIndex: number,
  bounds: StageBounds,
  stage: StageManifest,
): AttractFighter {
  const spread = Math.min(220, bounds.safeHalfWidth * 1.35);
  const x = total > 1 ? -spread * 0.5 + (spread * slot) / (total - 1) : 0;
  const baseY = stage.spawnPoints[0]?.y ?? bounds.floorY - 34;
  return {
    slot,
    blueprint,
    paletteIndex,
    controlType: 'cpu',
    x,
    y: baseY - 20 - (slot % 2) * 14,
    vx: 0,
    vy: 0,
    facing: slot === total - 1 ? -1 : 1,
    grounded: false,
    onIce: false,
    jumpsLeft: blueprint.stats.maxJumps,
    wallClingDir: 0,
    lastWallClingDir: 0,
    wallClingGraceTimer: 0,
    wallClingStamina: 95,
    wallJumpLockTimer: 0,
    dropThroughTimer: 0,
    shielding: false,
    shieldHp: 100,
    shieldStunTimer: 0,
    damagePct: 0,
    stocks: 99,
    maxStocks: 99,
    hitstun: 0,
    hitFlashTimer: 0,
    invulnTimer: 36,
    respawnTimer: 0,
    upSpecialUsed: false,
    moveKey: null,
    moveTick: 0,
    moveHitApplied: false,
    animState: 'idle',
    animTick: slot * 14,
    squashX: 1,
    squashY: 1,
    damageDealt: 0,
    kosScored: 0,
    input: createInputBuffer(),
    ai: createAiMemory(),
    aiCooldown: 38 + slot * 18,
    aiThinkTimer: slot * 8,
    desiredDir: 0,
    targetSlot: (slot + 1) % Math.max(1, total),
    moveHitSet: new Set<number>(),
  };
}

/**
 * Self-contained 3-CPU Easy-Mode 2.5D attract arena behind the official title screen.
 * Keeps the entire stage framed smoothly at all times with slow, non-jittery angle glides.
 */
export class AttractArena {
  private readonly stage: StageManifest;
  private readonly bounds: StageBounds;
  private readonly stageCache: BakedStageCache;
  private readonly renderer: SoftwareRenderer25D;
  private readonly cam: CameraRig;
  private readonly fighters: AttractFighter[];
  private readonly bakedFighters: BakedFighterSprites[];
  private readonly projectiles: ProjectileEntity[] = [];
  private readonly particles: ParticleEntity[] = [];
  private tick = 0;
  private nextProjId = 1;

  constructor(
    stage: StageManifest,
    rosterSlice: ReadonlyArray<FighterBlueprint>,
    graphicsEra: GraphicsEra,
  ) {
    this.stage = stage;
    this.bounds = computeStageBounds(stage);
    this.stageCache = bakeStageSlices(stage);
    this.renderer = new SoftwareRenderer25D();
    this.renderer.preloadBackdrop(stage.backdropImage);

    this.cam = createCameraRig('SIDE_25D');
    this.cam.focalX = this.bounds.centerX;
    this.cam.focalY = this.bounds.centerY;
    this.cam.pitchDeg = SHOWCASE_ANGLES[0].pitchDeg;
    this.cam.yawDeg = SHOWCASE_ANGLES[0].yawDeg;
    this.cam.zoom = this.bounds.baseZoom;

    this.fighters = [];
    this.bakedFighters = [];

    for (let i = 0; i < rosterSlice.length; i++) {
      const resolved = resolveFighterForEra(rosterSlice[i], graphicsEra);
      const palIdx = i % Math.max(1, resolved.palettes.length);
      this.fighters.push(createAttractFighter(i, rosterSlice.length, resolved, palIdx, this.bounds, stage));
      this.bakedFighters.push(bakeFighterSprites(resolved, palIdx));
    }
  }

  public step(): void {
    this.tick++;
    for (const f of this.fighters) {
      this.stepEasyCpu(f);
    }
    for (const f of this.fighters) {
      this.stepFighterPhysics(f);
    }
    this.stepMeleeHits();
    this.stepProjectiles();
    this.stepParticles();
    this.stepShowcaseCamera();
  }

  public render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const sim: RenderableSimulation = {
      stage: this.stage,
      fighters: this.fighters,
      projectiles: this.projectiles,
      particles: this.particles,
      matchTimeTicks: this.tick,
    };
    this.renderer.renderFrame(ctx, width, height, sim, this.cam, this.stageCache, this.bakedFighters, false);
  }

  private stepShowcaseCamera(): void {
    const angleIndex = Math.floor(this.tick / ANGLE_HOLD_TICKS) % SHOWCASE_ANGLES.length;
    const spec = SHOWCASE_ANGLES[angleIndex];
    const gentleBreeze = Math.sin(this.tick * 0.0025) * 1.8;

    const targetPitch = spec.pitchDeg;
    const targetYaw = spec.yawDeg + gentleBreeze;
    const targetZoom = this.bounds.baseZoom * spec.zoomScale;

    // Ultra-smooth damping keeps the entire stage framed with zero shake or jitter
    const smooth = 0.015;
    this.cam.pitchDeg += (targetPitch - this.cam.pitchDeg) * smooth;
    this.cam.yawDeg += (targetYaw - this.cam.yawDeg) * smooth;
    this.cam.rollDeg += (0 - this.cam.rollDeg) * smooth;
    this.cam.focalX += (this.bounds.centerX - this.cam.focalX) * smooth;
    this.cam.focalY += (this.bounds.centerY - this.cam.focalY) * smooth;
    this.cam.focalZ = 0;
    this.cam.zoom += (targetZoom - this.cam.zoom) * smooth;
    this.cam.shakeAmp = 0;
    this.cam.shakeX = 0;
    this.cam.shakeY = 0;
  }

  private findNearestTarget(f: AttractFighter): AttractFighter {
    let best = this.fighters[(f.slot + 1) % this.fighters.length];
    let bestDist = Infinity;
    for (const other of this.fighters) {
      const skip = other.slot === f.slot || other.respawnTimer > 0;
      if (skip) continue;
      const dist = Math.hypot(other.x - f.x, other.y - f.y);
      if (dist < bestDist) {
        bestDist = dist;
        best = other;
      }
    }
    return best;
  }

  private stepEasyCpu(f: AttractFighter): void {
    if (f.respawnTimer > 0) {
      f.respawnTimer--;
      f.animState = 'idle';
      return;
    }
    if (f.invulnTimer > 0) f.invulnTimer--;
    if (f.hitFlashTimer > 0) f.hitFlashTimer--;
    if (f.hitstun > 0) {
      f.hitstun--;
      f.animState = 'hurt';
      return;
    }

    if (f.moveKey) {
      this.advanceActiveMove(f);
      return;
    }

    const stats = f.blueprint.stats;
    if (f.aiCooldown > 0) f.aiCooldown--;

    const offStage = Math.abs(f.x - this.bounds.centerX) > this.bounds.safeHalfWidth || f.y > this.bounds.floorY + 18;
    if (offStage) {
      const dirToCenter: 1 | -1 = f.x > this.bounds.centerX ? -1 : 1;
      f.facing = dirToCenter;
      f.vx += dirToCenter * stats.airSpeed * 0.2;
      const canDoubleJump = f.vy > 0.7 && f.jumpsLeft > 0;
      const needUpSpecial = f.vy > 1.3 && !f.upSpecialUsed;
      if (canDoubleJump) {
        f.vy = -stats.doubleJumpForce;
        f.jumpsLeft--;
        this.emitParticles(f.x, f.y, 3, 'dust', '#E2E8F0', 1.1);
      } else if (needUpSpecial) {
        this.startMove(f, 'upSpecial');
        f.upSpecialUsed = true;
      }
      f.animState = 'jump';
      return;
    }

    const target = this.findNearestTarget(f);
    const dx = target.x - f.x;
    const dy = target.y - f.y;
    const absDx = Math.abs(dx);

    // Easy-mode deliberate thinking cadence prevents twitchy back-and-forth vibration
    if (f.aiThinkTimer <= 0) {
      f.aiThinkTimer = 18 + ((this.tick + f.slot * 11) % 16);
      const shouldPause = (this.tick + f.slot * 23) % 7 === 0;
      if (shouldPause) {
        f.desiredDir = 0;
      } else if (absDx > 30) {
        f.desiredDir = dx >= 0 ? 1 : -1;
      } else if (absDx < 14) {
        f.desiredDir = 0;
      }
      if (f.desiredDir !== 0) f.facing = f.desiredDir;
    } else {
      f.aiThinkTimer--;
    }

    const moveAccel = f.grounded ? stats.runSpeed * 0.16 : stats.airSpeed * 0.11;
    f.vx += f.desiredDir * moveAccel;

    const wantPlatformHop = dy < -30 && f.grounded && (this.tick + f.slot * 29) % 45 === 0;
    const wantCasualHop = (this.tick + f.slot * 37) % 140 === 0 && f.grounded;
    if (wantPlatformHop || wantCasualHop) {
      f.vy = -stats.jumpForce;
      f.grounded = false;
      f.jumpsLeft = Math.max(0, f.jumpsLeft - 1);
    }

    if (f.aiCooldown === 0) {
      this.pickEasyAttack(f, dx, absDx, Math.abs(dy));
    }

    if (!f.grounded) {
      f.animState = 'jump';
    } else if (Math.abs(f.vx) > 0.45) {
      f.animState = 'walk';
    } else {
      f.animState = 'idle';
    }
  }

  private pickEasyAttack(f: AttractFighter, dx: number, absDx: number, absDy: number): void {
    const roll = (this.tick * 7 + f.slot * 13) % 12;
    const inMeleeRange = absDx < 34 && absDy < 26;
    if (inMeleeRange) {
      f.facing = dx >= 0 ? 1 : -1;
      if (!f.grounded) {
        this.startMove(f, 'aerial');
      } else if (roll < 3) {
        this.startMove(f, 'smash');
      } else {
        this.startMove(f, 'jab');
      }
      f.aiCooldown = 54 + (f.slot % 3) * 14;
      return;
    }

    const canFireProjectile =
      absDx > 72 && absDx < 195 && absDy < 34 && roll < 2 && Boolean(f.blueprint.moveset.neutralSpecial.projectile);
    if (canFireProjectile) {
      f.facing = dx >= 0 ? 1 : -1;
      this.startMove(f, 'neutralSpecial');
      f.aiCooldown = 105 + (f.slot % 3) * 18;
    }
  }

  private startMove(f: AttractFighter, key: ActiveMoveKey): void {
    f.moveKey = key;
    f.moveTick = 0;
    f.moveHitApplied = false;
    f.moveHitSet.clear();
    const move = f.blueprint.moveset[key];
    if (move.velocityBoostX) f.vx = move.velocityBoostX * f.facing * 0.85;
    if (move.velocityBoostY) f.vy = move.velocityBoostY;
    f.animState = key === 'neutralSpecial' || key === 'upSpecial' ? 'special' : 'attack';
  }

  private advanceActiveMove(f: AttractFighter): void {
    const key = f.moveKey;
    if (!key) return;
    const move = f.blueprint.moveset[key];
    f.moveTick++;

    const spawnNow = Boolean(move.projectile) && f.moveTick === move.startup;
    if (spawnNow && move.projectile) {
      const pDef = move.projectile;
      const palette = f.blueprint.palettes[f.paletteIndex]?.colors ?? f.blueprint.palettes[0].colors;
      this.projectiles.push({
        id: this.nextProjId++,
        ownerSlot: (f.slot % 2) as 0 | 1,
        x: f.x + f.facing * 12,
        y: f.y - 12,
        vx: pDef.speedX * f.facing,
        vy: pDef.speedY,
        gravity: pDef.gravity,
        radius: pDef.radius,
        life: pDef.lifetime,
        color: palette[pDef.colorIndex] ?? '#FACC15',
        glowColor: palette[pDef.glowIndex] ?? '#FEF08A',
        bounces: Boolean(pDef.bounces),
        damage: move.damage,
        baseKnockback: move.baseKnockback,
        knockbackGrowth: move.knockbackGrowth,
        launchAngleDeg: move.launchAngleDeg,
        hitstop: move.hitstop,
      });
    }

    if (f.moveTick >= move.startup + move.active + move.endlag) {
      f.moveKey = null;
      f.moveTick = 0;
    }
  }

  private stepFighterPhysics(f: AttractFighter): void {
    if (f.respawnTimer > 0) return;
    f.animTick++;
    f.squashX += (1 - f.squashX) * 0.2;
    f.squashY += (1 - f.squashY) * 0.2;

    const stats = f.blueprint.stats;
    const gravScale = this.stage.gravityScale ?? 1;
    const maxVx = (f.grounded ? stats.runSpeed : stats.airSpeed) * 0.82;
    if (f.hitstun === 0) {
      let drag = 0.94;
      if (f.grounded) drag = f.onIce ? 0.96 : 0.84;
      f.vx *= drag;
      f.vx = Math.max(-maxVx, Math.min(maxVx, f.vx));
    } else {
      f.vx *= 0.985;
    }

    const prevY = f.y;
    f.vy = Math.min(stats.fastFallSpeed, f.vy + stats.gravity * gravScale);
    f.x += f.vx;
    f.y += f.vy;

    f.grounded = false;
    f.onIce = false;

    for (const vol of this.stage.volumes) {
      if (vol.decorative) continue;
      const pose = computeVolumeState(vol, this.tick);
      if (!pose.solidActive) continue;
      const left = pose.x - vol.width * 0.5;
      const right = pose.x + vol.width * 0.5;
      const top = pose.topY;
      const withinX = f.x + 5 > left && f.x - 5 < right;
      const snapMargin = 5 + Math.abs(pose.dy) + 1;
      const crossingTop =
        withinX && f.vy >= -Math.abs(pose.dy) && prevY <= top + snapMargin && f.y >= top - Math.max(0, -pose.dy);

      if (!crossingTop) continue;
      if (vol.surfaceEffect === 'spring') {
        f.y = top - 1;
        f.vy = -stats.jumpForce * (vol.springPower ?? 1.48);
        f.jumpsLeft = stats.maxJumps;
        f.upSpecialUsed = false;
        this.emitParticles(f.x, top, 5, 'spark', '#FACC15', 2.4);
        continue;
      }
      f.y = top;
      f.x += pose.dx;
      f.vy = 0;
      f.grounded = true;
      f.jumpsLeft = stats.maxJumps;
      f.upSpecialUsed = false;
      if (vol.surfaceEffect === 'ice') f.onIce = true;
      else if (vol.surfaceEffect === 'conveyor-right') f.x += vol.conveyorSpeed ?? 1.1;
      else if (vol.surfaceEffect === 'conveyor-left') f.x -= vol.conveyorSpeed ?? 1.1;
    }

    const bz = this.stage.blastZones;
    const out = f.x < bz.left || f.x > bz.right || f.y < bz.top || f.y > bz.bottom;
    if (out) {
      const cx = Math.max(bz.left + 20, Math.min(bz.right - 20, f.x));
      const cy = Math.max(bz.top + 20, Math.min(bz.bottom - 20, f.y));
      this.emitParticles(cx, cy, 14, 'ko', KO_COLORS[f.slot % KO_COLORS.length], 4.6);
      f.x = this.bounds.centerX - 80 + ((f.slot * 55 + this.tick) % 160);
      f.y = (this.stage.spawnPoints[0]?.y ?? this.bounds.floorY - 36) - 36;
      f.vx = 0;
      f.vy = 0;
      f.damagePct = 0;
      f.hitstun = 0;
      f.moveKey = null;
      f.jumpsLeft = stats.maxJumps;
      f.upSpecialUsed = false;
      f.respawnTimer = 42;
      f.invulnTimer = 60;
    }
  }

  private stepMeleeHits(): void {
    for (const attacker of this.fighters) {
      const inactive = !attacker.moveKey || attacker.respawnTimer > 0;
      if (inactive || !attacker.moveKey) continue;
      const move = attacker.blueprint.moveset[attacker.moveKey];
      const inWindow = attacker.moveTick >= move.startup && attacker.moveTick < move.startup + move.active;
      if (!inWindow) continue;

      const hx = attacker.x + move.hitbox.offsetX * attacker.facing - move.hitbox.width * 0.5;
      const hy = attacker.y + move.hitbox.offsetY - move.hitbox.height * 0.5;

      for (const defender of this.fighters) {
        const cantHit =
          defender.slot === attacker.slot ||
          defender.respawnTimer > 0 ||
          defender.invulnTimer > 0 ||
          attacker.moveHitSet.has(defender.slot);
        if (cantHit) continue;

        const hit = rectsOverlap(
          hx,
          hy,
          move.hitbox.width,
          move.hitbox.height,
          defender.x - HURTBOX_HALF_W,
          defender.y - HURTBOX_HEIGHT,
          HURTBOX_HALF_W * 2,
          HURTBOX_HEIGHT,
        );
        if (!hit) continue;

        attacker.moveHitSet.add(defender.slot);
        this.applyKnockback(defender, move, attacker.facing);
      }
    }
  }

  private applyKnockback(target: AttractFighter, move: MoveFrameData, dir: 1 | -1): void {
    target.damagePct = Math.min(240, target.damagePct + move.damage * 0.85);
    const weightScale = 100 / Math.max(55, target.blueprint.stats.weight);
    const kb = (move.baseKnockback + target.damagePct * move.knockbackGrowth * 0.07) * weightScale * 0.85;
    const rad = (move.launchAngleDeg * Math.PI) / 180;
    target.vx = Math.cos(rad) * kb * dir;
    target.vy = -Math.sin(rad) * kb;
    target.grounded = false;
    target.moveKey = null;
    target.hitstun = Math.min(40, Math.round(kb * 3.4));
    target.hitFlashTimer = 6;
    target.squashX = 1.24;
    target.squashY = 0.78;
    this.emitParticles(target.x, target.y - 11, 6, 'spark', '#FDE047', 3.0);
  }

  private stepProjectiles(): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life--;
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;

      let hitAny = false;
      for (const target of this.fighters) {
        const skip = target.respawnTimer > 0 || target.invulnTimer > 0;
        if (skip) continue;
        const overlap = rectsOverlap(
          p.x - p.radius,
          p.y - p.radius,
          p.radius * 2,
          p.radius * 2,
          target.x - HURTBOX_HALF_W,
          target.y - HURTBOX_HEIGHT,
          HURTBOX_HALF_W * 2,
          HURTBOX_HEIGHT,
        );
        if (!overlap) continue;
        const dir: 1 | -1 = p.vx >= 0 ? 1 : -1;
        this.applyKnockback(
          target,
          {
            name: 'Projectile',
            startup: 1,
            active: 1,
            endlag: 1,
            hitbox: { offsetX: 0, offsetY: 0, width: 1, height: 1 },
            damage: p.damage,
            baseKnockback: p.baseKnockback,
            knockbackGrowth: p.knockbackGrowth,
            launchAngleDeg: p.launchAngleDeg,
            hitstop: p.hitstop,
          },
          dir,
        );
        hitAny = true;
        break;
      }

      const expired = hitAny || p.life <= 0;
      if (expired) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  private emitParticles(
    x: number,
    y: number,
    count: number,
    kind: ParticleEntity['kind'],
    color: string,
    speed: number,
  ): void {
    if (this.particles.length > 72) return;
    const life = kind === 'ko' ? 26 : 14;
    const size = kind === 'ko' ? 5 : 3;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + ((this.tick * 13 + i * 29) % 10) * 0.08;
      const spd = speed * (0.45 + ((i * 31) % 10) * 0.08);
      this.particles.push({
        x,
        y,
        z: ((i % 3) - 1) * 4,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        vz: ((i % 5) - 2) * 0.2,
        size,
        color,
        life,
        maxLife: life,
        kind,
      });
    }
  }

  private stepParticles(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life--;
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.z += pt.vz;
      if (pt.kind === 'smoke') {
        pt.vx *= 0.92;
        pt.vy *= 0.92;
      } else if (pt.kind === 'spark') {
        pt.vy += 0.08;
      }
      if (pt.life <= 0) this.particles.splice(i, 1);
    }
  }
}
