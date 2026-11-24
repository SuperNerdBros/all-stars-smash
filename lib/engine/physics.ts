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
} from '../types/protocol';
import { consumeBufferedAction, updateInputBuffer } from './inputBuffer';
import { computeCpuInputMask } from './aiController';
import { computeVolumeState } from './platformMotion';
import {
  createSimulationState,
  getActiveHitbox,
  HURTBOX_HALF_W,
  HURTBOX_HEIGHT,
  rectsOverlap,
  resolveJumpSpec,
  spawnParticles,
  stepParticles,
  type ActiveHitboxWorld,
  type ActiveMoveKey,
  type FighterEntity,
  type ParticleEntity,
  type ProjectileEntity,
  type SimulationState,
} from './combatTypes';
import { integrateFighterStagePhysics } from './stageCollision';

export {
  createSimulationState,
  getActiveHitbox,
  HURTBOX_HALF_W,
  HURTBOX_HEIGHT,
  type ActiveHitboxWorld,
  type ActiveMoveKey,
  type FighterEntity,
  type ParticleEntity,
  type ProjectileEntity,
  type SimulationState,
};

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

function stepActiveMove(sim: SimulationState, f: FighterEntity, rawMask: number): boolean {
  if (!f.moveKey) return false;

  const stats = f.blueprint.stats;
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
    return false;
  }

  if (f.grounded) {
    f.vx *= 0.84;
  } else {
    if (rawMask & INPUT_LEFT) f.vx = Math.max(-stats.airSpeed, f.vx - 0.12);
    if (rawMask & INPUT_RIGHT) f.vx = Math.min(stats.airSpeed, f.vx + 0.12);
  }
  return true;
}

function handleJumpInput(sim: SimulationState, f: FighterEntity): void {
  const stats = f.blueprint.stats;
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
    spawnParticles(sim, f.x + wallSide * HURTBOX_HALF_W, f.y - 10, 7, 'spark', '#F8FAFC', 2.3);
    return;
  }

  if (f.jumpsLeft <= 0) return;

  const isGroundJump = f.grounded;
  const usedJumps = stats.maxJumps - f.jumpsLeft;
  const isThirdJump = !isGroundJump && usedJumps >= 2;
  const spec = resolveJumpSpec(isGroundJump, isThirdJump, stats.jumpForce, stats.doubleJumpForce);

  f.vy = -spec.impulse;
  f.grounded = false;
  f.jumpsLeft--;
  f.squashX = 0.76;
  f.squashY = 1.26;
  sim.pendingSfx.push(spec.sfx);
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

function tryStartCombatMove(sim: SimulationState, f: FighterEntity, rawMask: number): boolean {
  if (consumeBufferedAction(f.input, INPUT_SPECIAL)) {
    const isUpSpecial = Boolean(rawMask & INPUT_UP) && !f.upSpecialUsed;
    f.moveKey = isUpSpecial ? 'upSpecial' : 'neutralSpecial';
    f.moveTick = 0;
    f.moveHitApplied = false;
    f.animState = 'special';
    f.animTick = 0;
    if (isUpSpecial) {
      f.upSpecialUsed = true;
      sim.pendingSfx.push('doubleJump');
    }
    return true;
  }

  if (consumeBufferedAction(f.input, INPUT_SMASH)) {
    f.moveKey = f.grounded ? 'smash' : 'aerial';
    f.moveTick = 0;
    f.moveHitApplied = false;
    f.animState = f.grounded ? 'smash' : 'attack';
    f.animTick = 0;
    return true;
  }

  if (consumeBufferedAction(f.input, INPUT_ATTACK)) {
    f.moveKey = f.grounded ? 'jab' : 'aerial';
    f.moveTick = 0;
    f.moveHitApplied = false;
    f.animState = 'attack';
    f.animTick = 0;
    return true;
  }

  return false;
}

function stepFighterControl(sim: SimulationState, f: FighterEntity, rawMask: number): void {
  const stats = f.blueprint.stats;
  updateInputBuffer(f.input, rawMask);

  if (f.respawnTimer > 0) {
    f.respawnTimer--;
    f.vx = 0;
    f.vy = 0;
    if (f.respawnTimer === 0) f.invulnTimer = 85;
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

  if (f.hitstun > 0) {
    f.hitstun--;
    f.shielding = false;
    f.animState = 'hurt';
    if (f.hitstun % 3 === 0 && Math.hypot(f.vx, f.vy) > 4.2) {
      spawnParticles(sim, f.x, f.y - 10, 1, 'smoke', '#CBD5E1', 0.5);
    }
    return;
  }

  if (stepActiveMove(sim, f, rawMask)) return;

  const canShield = Boolean(rawMask & INPUT_SHIELD) && f.grounded && f.shieldStunTimer === 0 && f.shieldHp > 5;
  if (canShield) {
    f.shielding = true;
    f.shieldHp = Math.max(0, f.shieldHp - 0.35);
    f.vx *= 0.72;
    f.animState = 'idle';
    return;
  }

  f.shielding = false;
  if (f.shieldStunTimer === 0) {
    f.shieldHp = Math.min(100, f.shieldHp + 0.28);
  }

  const moveLeft = Boolean(rawMask & INPUT_LEFT);
  const moveRight = Boolean(rawMask & INPUT_RIGHT);

  if (f.wallJumpLockTimer === 0) {
    const traction = f.onIce ? stats.traction * 0.22 : stats.traction;
    const groundAccel = f.onIce ? 0.22 : 0.45;
    if (moveLeft && !moveRight) {
      f.facing = -1;
      const maxSpd = f.grounded ? stats.runSpeed : stats.airSpeed;
      f.vx = Math.max(-maxSpd, f.vx - (f.grounded ? groundAccel : 0.24));
    } else if (moveRight && !moveLeft) {
      f.facing = 1;
      const maxSpd = f.grounded ? stats.runSpeed : stats.airSpeed;
      f.vx = Math.min(maxSpd, f.vx + (f.grounded ? groundAccel : 0.24));
    } else if (f.grounded) {
      if (Math.abs(f.vx) <= traction) f.vx = 0;
      else f.vx -= Math.sign(f.vx) * traction;
    } else {
      f.vx *= 0.965;
    }
  }

  if (f.wallClingDir !== 0) {
    const pullingAway =
      (f.wallClingDir === 1 && moveLeft && !moveRight) ||
      (f.wallClingDir === -1 && moveRight && !moveLeft);
    if ((rawMask & INPUT_DOWN) || pullingAway) {
      f.wallClingDir = 0;
    }
  }

  if ((f.input.justPressedMask & INPUT_DOWN) && f.grounded) {
    f.dropThroughTimer = 11;
    f.grounded = false;
    f.y += 2;
  } else if ((rawMask & INPUT_DOWN) && !f.grounded && f.vy > 0) {
    f.vy = Math.min(stats.fastFallSpeed, f.vy + 0.45);
  }

  if (consumeBufferedAction(f.input, INPUT_JUMP)) {
    handleJumpInput(sim, f);
  }

  if (tryStartCombatMove(sim, f, rawMask)) return;

  if (!f.grounded) {
    f.animState = 'jump';
  } else if (Math.abs(f.vx) > 0.35) {
    f.animState = 'walk';
  } else {
    f.animState = 'idle';
  }
}

function stepProjectiles(sim: SimulationState): void {
  for (let i = sim.projectiles.length - 1; i >= 0; i--) {
    const p = sim.projectiles[i];
    p.life--;
    p.vy += p.gravity;
    p.x += p.vx;
    p.y += p.vy;

    if (p.bounces) {
      for (const vol of sim.stage.volumes) {
        if (vol.decorative) continue;
        const pose = computeVolumeState(vol, sim.matchTimeTicks);
        if (!pose.solidActive) continue;
        const left = pose.x - vol.width * 0.5;
        const right = pose.x + vol.width * 0.5;
        if (p.x > left && p.x < right && p.vy > 0 && p.y + p.radius >= pose.topY && p.y < pose.topY + 10) {
          p.y = pose.topY - p.radius;
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
      applyHit(sim, owner, victim, p.damage, p.baseKnockback, p.knockbackGrowth, p.launchAngleDeg, p.hitstop, dir);
      sim.projectiles.splice(i, 1);
      continue;
    }

    if (p.life <= 0) {
      sim.projectiles.splice(i, 1);
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

  integrateFighterStagePhysics(sim, f0);
  integrateFighterStagePhysics(sim, f1);

  f0.animTick++;
  f1.animTick++;

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

  stepProjectiles(sim);
  stepParticles(sim);
}
