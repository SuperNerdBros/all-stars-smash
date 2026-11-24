import type { AnimState } from '../types/palette';
import type { FighterBlueprint, MoveFrameData } from '../types/fighter';
import type { StageManifest } from '../types/stage';
import {
  INPUT_ATTACK,
  INPUT_DOWN,
  INPUT_JUMP,
  INPUT_LEFT,
  INPUT_RIGHT,
  INPUT_SHIELD,
  INPUT_SMASH,
  INPUT_SPECIAL,
  INPUT_UP,
  type CpuDifficulty,
  type PlayerControlType,
  type SfxEvent,
} from '../types/protocol';
import {
  consumeBufferedAction,
  createInputBuffer,
  updateInputBuffer,
  type BufferedInputState,
} from './inputBuffer';
import {
  computeCpuInputMask,
  createAiMemory,
  type AiMemory,
} from './aiController';

export type ActiveMoveKey = 'jab' | 'smash' | 'aerial' | 'neutralSpecial' | 'upSpecial';

export interface ActiveHitboxWorld {
  x: number;
  y: number;
  w: number;
  h: number;
  move: MoveFrameData;
}

export interface FighterEntity {
  slot: 0 | 1;
  blueprint: FighterBlueprint;
  paletteIndex: number;
  controlType: PlayerControlType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  grounded: boolean;
  jumpsLeft: number;
  wallClingDir: -1 | 0 | 1;
  lastWallClingDir: -1 | 0 | 1;
  wallClingGraceTimer: number;
  wallClingStamina: number;
  wallJumpLockTimer: number;
  dropThroughTimer: number;
  shielding: boolean;
  shieldHp: number;
  shieldStunTimer: number;
  damagePct: number;
  stocks: number;
  maxStocks: number;
  hitstun: number;
  hitFlashTimer: number;
  invulnTimer: number;
  respawnTimer: number;
  upSpecialUsed: boolean;
  moveKey: ActiveMoveKey | null;
  moveTick: number;
  moveHitApplied: boolean;
  animState: AnimState;
  animTick: number;
  squashX: number;
  squashY: number;
  damageDealt: number;
  kosScored: number;
  input: BufferedInputState;
  ai: AiMemory;
}

export interface ProjectileEntity {
  id: number;
  ownerSlot: 0 | 1;
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  radius: number;
  life: number;
  color: string;
  glowColor: string;
  bounces: boolean;
  damage: number;
  baseKnockback: number;
  knockbackGrowth: number;
  launchAngleDeg: number;
  hitstop: number;
}

export interface ParticleEntity {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  kind: 'smoke' | 'spark' | 'ko' | 'dust';
}

export interface SimulationState {
  stage: StageManifest;
  fighters: [FighterEntity, FighterEntity];
  projectiles: ProjectileEntity[];
  particles: ParticleEntity[];
  cpuDifficulty: CpuDifficulty;
  hitstopTimer: number;
  matchTimeTicks: number;
  winnerSlot: 0 | 1 | null;
  nextProjId: number;
  pendingSfx: SfxEvent[];
  pendingShake: number;
  pendingKo: { x: number; y: number } | null;
}

export const HURTBOX_HALF_W = 8;
export const HURTBOX_HEIGHT = 22;

function createFighterEntity(
  slot: 0 | 1,
  blueprint: FighterBlueprint,
  paletteIndex: number,
  controlType: PlayerControlType,
  spawn: { x: number; y: number },
  stocks: number,
): FighterEntity {
  return {
    slot,
    blueprint,
    paletteIndex,
    controlType,
    x: spawn.x,
    y: spawn.y,
    vx: 0,
    vy: 0,
    facing: slot === 0 ? 1 : -1,
    grounded: false,
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
    stocks,
    maxStocks: stocks,
    hitstun: 0,
    hitFlashTimer: 0,
    invulnTimer: 45,
    respawnTimer: 0,
    upSpecialUsed: false,
    moveKey: null,
    moveTick: 0,
    moveHitApplied: false,
    animState: 'idle',
    animTick: 0,
    squashX: 1,
    squashY: 1,
    damageDealt: 0,
    kosScored: 0,
    input: createInputBuffer(),
    ai: createAiMemory(),
  };
}

export function createSimulationState(
  fighters: [FighterBlueprint, FighterBlueprint],
  paletteIndices: [number, number],
  controlTypes: [PlayerControlType, PlayerControlType],
  cpuDifficulty: CpuDifficulty,
  stage: StageManifest,
  stocks: number,
): SimulationState {
  return {
    stage,
    fighters: [
      createFighterEntity(0, fighters[0], paletteIndices[0], controlTypes[0], stage.spawnPoints[0], stocks),
      createFighterEntity(1, fighters[1], paletteIndices[1], controlTypes[1], stage.spawnPoints[1], stocks),
    ],
    projectiles: [],
    particles: [],
    cpuDifficulty,
    hitstopTimer: 0,
    matchTimeTicks: 0,
    winnerSlot: null,
    nextProjId: 1,
    pendingSfx: [],
    pendingShake: 0,
    pendingKo: null,
  };
}

export function getActiveHitbox(f: FighterEntity): ActiveHitboxWorld | null {
  if (!f.moveKey) return null;
  const move = f.blueprint.moveset[f.moveKey];
  if (f.moveTick < move.startup || f.moveTick >= move.startup + move.active) {
    return null;
  }
  const cx = f.x + move.hitbox.offsetX * f.facing;
  const cy = f.y + move.hitbox.offsetY;
  return {
    x: cx - move.hitbox.width * 0.5,
    y: cy - move.hitbox.height * 0.5,
    w: move.hitbox.width,
    h: move.hitbox.height,
    move,
  };
}

function rectsOverlap(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function spawnParticles(
  sim: SimulationState,
  x: number,
  y: number,
  count: number,
  kind: ParticleEntity['kind'],
  color: string,
  speed = 2.6,
): void {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + ((sim.matchTimeTicks * 17 + i * 31) % 10) * 0.08;
    const spd = speed * (0.45 + ((i * 37) % 10) * 0.09);
    sim.particles.push({
      x,
      y,
      z: ((i % 3) - 1) * 4,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd - (kind === 'dust' ? 0.8 : 0),
      vz: ((i % 5) - 2) * 0.25,
      size: kind === 'ko' ? 5 : kind === 'smoke' ? 4 : 3,
      color,
      life: kind === 'ko' ? 32 : kind === 'smoke' ? 18 : 14,
      maxLife: kind === 'ko' ? 32 : kind === 'smoke' ? 18 : 14,
      kind,
    });
  }
}

/**
 * Standard Smash-inspired percentage knockback formula:
 * Light hits combo cleanly at low %; heavy smashes KO cleanly past 95-120%.
 */
function applyHit(
  sim: SimulationState,
  attacker: FighterEntity,
  victim: FighterEntity,
  damage: number,
  baseKb: number,
  kbGrowth: number,
  launchAngleDeg: number,
  hitstop: number,
  knockDir: 1 | -1,
): void {
  if (victim.invulnTimer > 0 || victim.respawnTimer > 0) return;

  if (victim.shielding && victim.shieldHp > 0) {
    victim.shieldHp = Math.max(0, victim.shieldHp - damage * 2.4);
    victim.vx += knockDir * 2.2;
    sim.hitstopTimer = Math.max(sim.hitstopTimer, 3);
    sim.pendingSfx.push('shield');
    spawnParticles(sim, victim.x, victim.y - 11, 5, 'spark', '#38BDF8', 2.0);
    if (victim.shieldHp <= 0) {
      victim.shielding = false;
      victim.hitstun = 55;
      victim.shieldStunTimer = 90;
    }
    return;
  }

  victim.damagePct = Math.min(999, Math.round(victim.damagePct + damage));
  attacker.damageDealt += damage;

  const p = victim.damagePct;
  const w = victim.blueprint.stats.weight;
  const rawKb =
    ((((p / 10 + (p * damage) / 20) * (200 / (w + 100)) * 1.35 + 14) *
      (kbGrowth / 100)) +
      baseKb * 8.5) *
    0.135;

  const launchSpeed = Math.min(13.5, Math.max(2.1, rawKb));
  const rad = (launchAngleDeg * Math.PI) / 180;

  victim.vx = Math.cos(rad) * launchSpeed * knockDir;
  victim.vy = -Math.sin(rad) * launchSpeed;
  victim.grounded = false;
  victim.moveKey = null;
  victim.hitstun = Math.min(58, Math.max(10, Math.round(launchSpeed * 3.8)));
  victim.hitFlashTimer = Math.max(5, hitstop);

  sim.hitstopTimer = Math.max(sim.hitstopTimer, hitstop);
  const isHeavy = damage >= 12 || launchSpeed >= 6.8;
  sim.pendingSfx.push(isHeavy ? 'hitHeavy' : 'hitLight');
  sim.pendingShake = Math.max(sim.pendingShake, isHeavy ? 6.5 : 2.6);

  spawnParticles(
    sim,
    victim.x,
    victim.y - 11,
    isHeavy ? 10 : 6,
    'spark',
    isHeavy ? '#FDE047' : '#F8FAFC',
    isHeavy ? 4.2 : 2.6,
  );
}

function stepFighterControl(sim: SimulationState, f: FighterEntity, rawMask: number): void {
  const stats = f.blueprint.stats;
  updateInputBuffer(f.input, rawMask);

  if (f.respawnTimer > 0) {
    f.respawnTimer--;
    f.vx = 0;
    f.vy = 0;
    if (f.respawnTimer === 0) {
      f.invulnTimer = 85;
    }
    return;
  }

  if (f.invulnTimer > 0) f.invulnTimer--;
  if (f.hitFlashTimer > 0) f.hitFlashTimer--;
  if (f.dropThroughTimer > 0) f.dropThroughTimer--;
  if (f.shieldStunTimer > 0) f.shieldStunTimer--;
  if (f.wallJumpLockTimer > 0) f.wallJumpLockTimer--;
  if (f.wallClingGraceTimer > 0 && f.wallClingDir === 0) f.wallClingGraceTimer--;

  f.squashX += (1 - f.squashX) * 0.22;
  f.squashY += (1 - f.squashY) * 0.22;

  // Hitstun state
  if (f.hitstun > 0) {
    f.hitstun--;
    f.shielding = false;
    f.animState = 'hurt';
    if (f.hitstun % 3 === 0 && Math.hypot(f.vx, f.vy) > 4.2) {
      spawnParticles(sim, f.x, f.y - 10, 1, 'smoke', '#CBD5E1', 0.5);
    }
    return;
  }

  // Active move state machine
  if (f.moveKey) {
    const move = f.blueprint.moveset[f.moveKey];
    f.moveTick++;

    if (f.moveTick === move.startup) {
      if (move.velocityBoostX !== undefined) {
        f.vx = move.velocityBoostX * f.facing;
      }
      if (move.velocityBoostY !== undefined) {
        f.vy = move.velocityBoostY;
        f.grounded = false;
      }
      if (move.projectile) {
        const pal = f.blueprint.palettes[f.paletteIndex]?.colors ?? f.blueprint.palettes[0].colors;
        sim.projectiles.push({
          id: sim.nextProjId++,
          ownerSlot: f.slot,
          x: f.x + 12 * f.facing,
          y: f.y - 11,
          vx: move.projectile.speedX * f.facing,
          vy: move.projectile.speedY,
          gravity: move.projectile.gravity,
          radius: move.projectile.radius,
          life: move.projectile.lifetime,
          color: pal[move.projectile.colorIndex] || '#FACC15',
          glowColor: pal[move.projectile.glowIndex] || '#FFFFFF',
          bounces: Boolean(move.projectile.bounces),
          damage: move.damage,
          baseKnockback: move.baseKnockback,
          knockbackGrowth: move.knockbackGrowth,
          launchAngleDeg: move.launchAngleDeg,
          hitstop: move.hitstop,
        });
        sim.pendingSfx.push('shoot');
      }
    }

    const totalFrames = move.startup + move.active + move.endlag;
    if (f.moveTick >= totalFrames) {
      f.moveKey = null;
      f.moveTick = 0;
      f.moveHitApplied = false;
    } else {
      // Gently decelerate while executing grounded attacks
      if (f.grounded) {
        f.vx *= 0.84;
      } else {
        if (rawMask & INPUT_LEFT) f.vx = Math.max(-stats.airSpeed, f.vx - 0.12);
        if (rawMask & INPUT_RIGHT) f.vx = Math.min(stats.airSpeed, f.vx + 0.12);
      }
      return;
    }
  }

  // Shield handling
  if ((rawMask & INPUT_SHIELD) && f.grounded && f.shieldStunTimer === 0 && f.shieldHp > 5) {
    f.shielding = true;
    f.shieldHp = Math.max(0, f.shieldHp - 0.35);
    f.vx *= 0.72;
    f.animState = 'idle';
    return;
  } else {
    f.shielding = false;
    if (f.shieldStunTimer === 0) {
      f.shieldHp = Math.min(100, f.shieldHp + 0.28);
    }
  }

  // Horizontal movement (briefly respects wall-jump kick momentum)
  const moveLeft = Boolean(rawMask & INPUT_LEFT);
  const moveRight = Boolean(rawMask & INPUT_RIGHT);

  if (f.wallJumpLockTimer === 0) {
    if (moveLeft && !moveRight) {
      f.facing = -1;
      const maxSpd = f.grounded ? stats.runSpeed : stats.airSpeed;
      const accel = f.grounded ? 0.45 : 0.24;
      f.vx = Math.max(-maxSpd, f.vx - accel);
    } else if (moveRight && !moveLeft) {
      f.facing = 1;
      const maxSpd = f.grounded ? stats.runSpeed : stats.airSpeed;
      const accel = f.grounded ? 0.45 : 0.24;
      f.vx = Math.min(maxSpd, f.vx + accel);
    } else if (f.grounded) {
      if (Math.abs(f.vx) <= stats.traction) f.vx = 0;
      else f.vx -= Math.sign(f.vx) * stats.traction;
    } else {
      f.vx *= 0.965;
    }
  }

  // Detach from wall cling if holding down or pulling strongly away
  if (f.wallClingDir !== 0) {
    const pullingAway =
      (f.wallClingDir === 1 && moveLeft && !moveRight) ||
      (f.wallClingDir === -1 && moveRight && !moveLeft);
    if ((rawMask & INPUT_DOWN) || pullingAway) {
      f.wallClingDir = 0;
    }
  }

  // Platform drop-through & fast-fall
  if ((f.input.justPressedMask & INPUT_DOWN) && f.grounded) {
    f.dropThroughTimer = 11;
    f.grounded = false;
    f.y += 2;
  } else if ((rawMask & INPUT_DOWN) && !f.grounded && f.vy > 0) {
    f.vy = Math.min(stats.fastFallSpeed, f.vy + 0.45);
  }

  // Buffered Wall Jump, Ground Jump, Double Jump, and 3rd Jump
  if (consumeBufferedAction(f.input, INPUT_JUMP)) {
    const canWallJump = !f.grounded && (f.wallClingDir !== 0 || f.wallClingGraceTimer > 0);
    if (canWallJump) {
      const wallSide = f.wallClingDir !== 0 ? f.wallClingDir : f.lastWallClingDir;
      const kickDir: 1 | -1 = wallSide === 1 ? -1 : 1;
      f.vx = kickDir * Math.max(stats.airSpeed * 1.45, 3.2);
      f.vy = -stats.jumpForce * 0.98;
      f.facing = kickDir;
      f.wallClingDir = 0;
      f.wallClingGraceTimer = 0;
      f.wallJumpLockTimer = 9;
      f.jumpsLeft = Math.max(f.jumpsLeft, 1);
      f.squashX = 0.72;
      f.squashY = 1.28;
      sim.pendingSfx.push('wallJump');
      spawnParticles(
        sim,
        f.x + wallSide * HURTBOX_HALF_W,
        f.y - 10,
        7,
        'spark',
        '#F8FAFC',
        2.3,
      );
    } else if (f.jumpsLeft > 0) {
      const isGroundJump = f.grounded;
      const usedJumps = stats.maxJumps - f.jumpsLeft;
      const isThirdJump = !isGroundJump && usedJumps >= 2;
      f.vy = -(isGroundJump
        ? stats.jumpForce
        : isThirdJump
          ? stats.doubleJumpForce * 0.96
          : stats.doubleJumpForce);
      f.grounded = false;
      f.jumpsLeft--;
      f.squashX = 0.76;
      f.squashY = 1.26;
      sim.pendingSfx.push(
        isGroundJump ? 'jump' : isThirdJump ? 'tripleJump' : 'doubleJump',
      );
      spawnParticles(
        sim,
        f.x,
        f.y,
        isThirdJump ? 8 : 5,
        isThirdJump ? 'spark' : 'dust',
        isThirdJump ? '#38BDF8' : '#E2E8F0',
        isThirdJump ? 2.1 : 1.4,
      );
    }
  }

  // Buffered Attacks / Specials
  if (consumeBufferedAction(f.input, INPUT_SPECIAL)) {
    if ((rawMask & INPUT_UP) && !f.upSpecialUsed) {
      f.moveKey = 'upSpecial';
      f.moveTick = 0;
      f.moveHitApplied = false;
      f.upSpecialUsed = true;
      f.animState = 'special';
      f.animTick = 0;
      sim.pendingSfx.push('doubleJump');
      return;
    } else {
      f.moveKey = 'neutralSpecial';
      f.moveTick = 0;
      f.moveHitApplied = false;
      f.animState = 'special';
      f.animTick = 0;
      return;
    }
  }

  if (consumeBufferedAction(f.input, INPUT_SMASH)) {
    f.moveKey = f.grounded ? 'smash' : 'aerial';
    f.moveTick = 0;
    f.moveHitApplied = false;
    f.animState = f.grounded ? 'smash' : 'attack';
    f.animTick = 0;
    return;
  }

  if (consumeBufferedAction(f.input, INPUT_ATTACK)) {
    f.moveKey = f.grounded ? 'jab' : 'aerial';
    f.moveTick = 0;
    f.moveHitApplied = false;
    f.animState = 'attack';
    f.animTick = 0;
    return;
  }

  // Set locomotive animation state
  if (!f.grounded) {
    f.animState = 'jump';
  } else if (Math.abs(f.vx) > 0.35) {
    f.animState = 'walk';
  } else {
    f.animState = 'idle';
  }
}

function integrateFighterPhysics(sim: SimulationState, f: FighterEntity): void {
  if (f.respawnTimer > 0) return;

  const stats = f.blueprint.stats;
  const prevY = f.y;

  // Apply gravity & air friction (reduced gravity while clinging to a wall)
  if (!f.grounded) {
    if (f.wallClingDir !== 0 && f.vy >= 0) {
      f.wallClingStamina = Math.max(0, f.wallClingStamina - 1);
      const maxSlide = f.wallClingStamina > 0 ? 0.34 : 1.6;
      f.vy = Math.min(maxSlide, f.vy + stats.gravity * 0.25);
    } else {
      f.vy = Math.min(stats.fastFallSpeed, f.vy + stats.gravity);
    }
  }
  f.x += f.vx;
  f.y += f.vy;

  const wasGrounded = f.grounded;
  f.grounded = false;
  f.wallClingDir = 0;

  // Resolve stage surface collisions & solid wall clinging on the 2D combat plane
  const holdingDown = Boolean(f.input.heldMask & INPUT_DOWN);
  const holdingLeft = Boolean(f.input.heldMask & INPUT_LEFT);
  const holdingRight = Boolean(f.input.heldMask & INPUT_RIGHT);

  for (const vol of sim.stage.volumes) {
    // Allow solid volumes on the combat plane (z === 0), including structural under-keels for deep wall clings
    if (vol.decorative && vol.z !== 0) continue;
    const left = vol.x - vol.width * 0.5;
    const right = vol.x + vol.width * 0.5;
    const top = vol.topY;
    const bottom = vol.topY + vol.height;

    const withinX = f.x + HURTBOX_HALF_W * 0.65 > left && f.x - HURTBOX_HALF_W * 0.65 < right;

    // Top landing surface (non-decorative platforms & main stage deck)
    if (!vol.decorative && withinX && f.vy >= 0 && prevY <= top + 5 && f.y >= top) {
      if (vol.passThrough && f.dropThroughTimer > 0) {
        continue;
      }
      f.y = top;
      f.vy = 0;
      f.grounded = true;
      f.jumpsLeft = stats.maxJumps;
      f.upSpecialUsed = false;
      f.wallClingStamina = 95;
      f.wallClingGraceTimer = 0;
      if (!wasGrounded) {
        f.squashX = 1.2;
        f.squashY = 0.82;
        spawnParticles(sim, f.x, f.y, 4, 'dust', '#CBD5E1', 1.2);
      }
    } else if (!vol.passThrough) {
      // Solid side walls + Wall Cling latching
      const withinY = f.y > top + 4 && f.y - HURTBOX_HEIGHT < bottom;
      if (withinY) {
        const touchingLeftFace = f.x + HURTBOX_HALF_W >= left - 2 && f.x < vol.x;
        const touchingRightFace = f.x - HURTBOX_HALF_W <= right + 2 && f.x > vol.x;

        if (touchingLeftFace) {
          if (f.x + HURTBOX_HALF_W > left) {
            f.x = left - HURTBOX_HALF_W;
            f.vx = f.hitstun > 0 ? -Math.abs(f.vx) * 0.6 : Math.min(0, f.vx);
          }
          if (
            !f.grounded &&
            f.hitstun === 0 &&
            !f.moveKey &&
            f.wallJumpLockTimer === 0 &&
            !holdingDown &&
            (holdingRight || f.vy > -0.8)
          ) {
            f.x = left - HURTBOX_HALF_W;
            f.vx = 0;
            f.wallClingDir = 1;
            f.lastWallClingDir = 1;
            f.wallClingGraceTimer = 6;
            f.facing = -1;
            if (sim.matchTimeTicks % 7 === 0) {
              spawnParticles(sim, left, f.y - 8, 1, 'dust', '#E2E8F0', 0.6);
            }
          }
        } else if (touchingRightFace) {
          if (f.x - HURTBOX_HALF_W < right) {
            f.x = right + HURTBOX_HALF_W;
            f.vx = f.hitstun > 0 ? Math.abs(f.vx) * 0.6 : Math.max(0, f.vx);
          }
          if (
            !f.grounded &&
            f.hitstun === 0 &&
            !f.moveKey &&
            f.wallJumpLockTimer === 0 &&
            !holdingDown &&
            (holdingLeft || f.vy > -0.8)
          ) {
            f.x = right + HURTBOX_HALF_W;
            f.vx = 0;
            f.wallClingDir = -1;
            f.lastWallClingDir = -1;
            f.wallClingGraceTimer = 6;
            f.facing = 1;
            if (sim.matchTimeTicks % 7 === 0) {
              spawnParticles(sim, right, f.y - 8, 1, 'dust', '#E2E8F0', 0.6);
            }
          }
        }
      }
    }
  }

  // Blast-zone KO check
  const bz = sim.stage.blastZones;
  if (f.x < bz.left || f.x > bz.right || f.y < bz.top || f.y > bz.bottom) {
    const opp = sim.fighters[f.slot === 0 ? 1 : 0];
    opp.kosScored++;
    f.stocks = Math.max(0, f.stocks - 1);
    sim.pendingSfx.push('ko');
    sim.pendingKo = { x: f.x, y: f.y };

    spawnParticles(
      sim,
      Math.max(bz.left + 20, Math.min(bz.right - 20, f.x)),
      Math.max(bz.top + 20, Math.min(bz.bottom - 20, f.y)),
      18,
      'ko',
      f.slot === 0 ? '#EF4444' : '#3B82F6',
      5.2,
    );

    if (f.stocks <= 0) {
      sim.winnerSlot = opp.slot;
      sim.pendingSfx.push('victory');
      f.respawnTimer = 9999;
    } else {
      const spawn = sim.stage.spawnPoints[f.slot];
      f.x = spawn.x;
      f.y = spawn.y - 34;
      f.vx = 0;
      f.vy = 0;
      f.damagePct = 0;
      f.hitstun = 0;
      f.moveKey = null;
      f.jumpsLeft = stats.maxJumps;
      f.upSpecialUsed = false;
      f.shieldHp = 100;
      f.respawnTimer = 42;
      f.invulnTimer = 90;
    }
  }
}

export function stepSimulation(
  sim: SimulationState,
  p1HumanMask: number,
  p2HumanMask: number,
): void {
  if (sim.winnerSlot !== null) {
    stepParticles(sim);
    return;
  }

  sim.matchTimeTicks++;

  if (sim.hitstopTimer > 0) {
    sim.hitstopTimer--;
    stepParticles(sim);
    return;
  }

  const [f0, f1] = sim.fighters;

  const mask0 =
    f0.controlType === 'cpu'
      ? computeCpuInputMask(
          { ...f0, moveState: f0.moveKey, isRespawning: f0.respawnTimer > 0 },
          { ...f1, moveState: f1.moveKey, isRespawning: f1.respawnTimer > 0 },
          sim.stage,
          sim.cpuDifficulty,
          f0.ai,
          sim.matchTimeTicks,
        )
      : p1HumanMask;

  const mask1 =
    f1.controlType === 'cpu'
      ? computeCpuInputMask(
          { ...f1, moveState: f1.moveKey, isRespawning: f1.respawnTimer > 0 },
          { ...f0, moveState: f0.moveKey, isRespawning: f0.respawnTimer > 0 },
          sim.stage,
          sim.cpuDifficulty,
          f1.ai,
          sim.matchTimeTicks,
        )
      : p2HumanMask;

  stepFighterControl(sim, f0, mask0);
  stepFighterControl(sim, f1, mask1);

  integrateFighterPhysics(sim, f0);
  integrateFighterPhysics(sim, f1);

  f0.animTick++;
  f1.animTick++;

  // Melee hitbox checks
  for (const attacker of sim.fighters) {
    if (attacker.moveHitApplied || attacker.respawnTimer > 0) continue;
    const hb = getActiveHitbox(attacker);
    if (!hb) continue;
    const victim = sim.fighters[attacker.slot === 0 ? 1 : 0];
    if (victim.respawnTimer > 0) continue;

    const vx = victim.x - HURTBOX_HALF_W;
    const vy = victim.y - HURTBOX_HEIGHT;
    if (rectsOverlap(hb.x, hb.y, hb.w, hb.h, vx, vy, HURTBOX_HALF_W * 2, HURTBOX_HEIGHT)) {
      attacker.moveHitApplied = true;
      const dir: 1 | -1 = victim.x >= attacker.x ? 1 : -1;
      applyHit(
        sim,
        attacker,
        victim,
        hb.move.damage,
        hb.move.baseKnockback,
        hb.move.knockbackGrowth,
        hb.move.launchAngleDeg,
        hb.move.hitstop,
        dir,
      );
    }
  }

  // Projectiles
  for (let i = sim.projectiles.length - 1; i >= 0; i--) {
    const p = sim.projectiles[i];
    p.life--;
    p.vy += p.gravity;
    p.x += p.vx;
    p.y += p.vy;

    // Bounce off top of platforms if bouncing projectile (e.g. Mario fireball)
    if (p.bounces) {
      for (const vol of sim.stage.volumes) {
        if (vol.decorative) continue;
        const left = vol.x - vol.width * 0.5;
        const right = vol.x + vol.width * 0.5;
        if (p.x > left && p.x < right && p.vy > 0 && p.y + p.radius >= vol.topY && p.y < vol.topY + 10) {
          p.y = vol.topY - p.radius;
          p.vy = -2.4;
          spawnParticles(sim, p.x, p.y, 2, 'spark', p.glowColor, 1.1);
        }
      }
    }

    const victim = sim.fighters[p.ownerSlot === 0 ? 1 : 0];
    const owner = sim.fighters[p.ownerSlot];
    const hitVictim =
      victim.respawnTimer === 0 &&
      rectsOverlap(
        p.x - p.radius,
        p.y - p.radius,
        p.radius * 2,
        p.radius * 2,
        victim.x - HURTBOX_HALF_W,
        victim.y - HURTBOX_HEIGHT,
        HURTBOX_HALF_W * 2,
        HURTBOX_HEIGHT,
      );

    if (hitVictim) {
      const dir: 1 | -1 = p.vx >= 0 ? 1 : -1;
      applyHit(
        sim,
        owner,
        victim,
        p.damage,
        p.baseKnockback,
        p.knockbackGrowth,
        p.launchAngleDeg,
        p.hitstop,
        dir,
      );
      sim.projectiles.splice(i, 1);
      continue;
    }

    if (p.life <= 0) {
      sim.projectiles.splice(i, 1);
    }
  }

  stepParticles(sim);
}

function stepParticles(sim: SimulationState): void {
  for (let i = sim.particles.length - 1; i >= 0; i--) {
    const pt = sim.particles[i];
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
    if (pt.life <= 0) {
      sim.particles.splice(i, 1);
    }
  }
}
