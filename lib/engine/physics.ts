import {
  INPUT_ATTACK,
  INPUT_CSTICK_ANY,
  INPUT_CSTICK_DOWN,
  INPUT_CSTICK_LEFT,
  INPUT_CSTICK_RIGHT,
  INPUT_CSTICK_UP,
  INPUT_DOWN,
  INPUT_GRAB,
  INPUT_JUMP,
  INPUT_LEFT,
  INPUT_RIGHT,
  INPUT_SHIELD,
  INPUT_SMASH,
  INPUT_SPECIAL,
  INPUT_UP,
} from '../types/protocol';
import { isAerialSlot, isThrowSlot, type MoveElement, type MoveSlot, type ThrowSlot } from '../types/moves';
import type { MoveFrameData } from '../types/fighter';
import { consumeBufferedAction, consumeCStick, peekBuffered, recentDirectionMask, updateInputBuffer } from './inputBuffer';
import { computeCpuInputMask } from './aiController';
import { computeVolumeState } from './platformMotion';
import {
  createSimulationState,
  getActiveHitbox,
  getActiveHitboxes,
  HURTBOX_HALF_W,
  HURTBOX_HEIGHT,
  rectsOverlap,
  refreshFighterMoves,
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
import {
  applyDirectionalInfluence,
  chargeMultiplier,
  computeHitstop,
  computeKnockback,
  computeLaunchVector,
  ENGINE_TUNING,
  hitstunFrames,
  pushStale,
  staleMultiplier,
} from './combatFormulas';
import { resolveMove, type ButtonPress } from './moveResolver';
import { integrateFighterStagePhysics } from './stageCollision';

export {
  createSimulationState,
  getActiveHitbox,
  getActiveHitboxes,
  HURTBOX_HALF_W,
  HURTBOX_HEIGHT,
  refreshFighterMoves,
  type ActiveHitboxWorld,
  type ActiveMoveKey,
  type FighterEntity,
  type ParticleEntity,
  type ProjectileEntity,
  type SimulationState,
};

const DIRECTIONS = INPUT_LEFT | INPUT_RIGHT | INPUT_UP | INPUT_DOWN;
const GRAB_HOLD_OFFSET = 12;

// ── Hit resolution ──────────────────────────────────────────────

interface HitParams {
  slot: MoveSlot;
  damage: number;
  baseKb: number;
  growth: number;
  /** Angle relative to knockDir (0 = away, 90 = up, negative = down). */
  angleDeg: number;
  knockDir: 1 | -1;
  hitlagMult?: number;
  element?: MoveElement;
  weightIndependent?: boolean;
  chargeMult?: number;
  /** Throws and grabs ignore shields. */
  ignoreShield?: boolean;
  /** Pummels: damage + hitstop, no launch. */
  noLaunch?: boolean;
}

function hitParamsFrom(slot: MoveSlot, move: MoveFrameData, hb: ActiveHitboxWorld | null, knockDir: 1 | -1, chargeMult = 1): HitParams {
  const spec = hb?.spec;
  return {
    slot,
    damage: spec?.damage ?? move.damage,
    baseKb: spec?.baseKnockback ?? move.baseKnockback,
    growth: spec?.knockbackGrowth ?? move.knockbackGrowth,
    angleDeg: spec?.launchAngleDeg ?? move.launchAngleDeg,
    hitlagMult: (spec?.hitlagMult ?? 1) * (move.hitlagMult ?? 1),
    element: spec?.element ?? move.element,
    weightIndependent: move.weightIndependent,
    chargeMult,
    knockDir,
  };
}

function isIntangible(f: FighterEntity): boolean {
  if (!f.moveKey) return false;
  const win = f.moves[f.moveKey].intangible;
  return Boolean(win && f.moveTick >= win[0] && f.moveTick < win[1]);
}

function releaseGrab(sim: SimulationState, holder: FighterEntity, pushApart: boolean): void {
  if (holder.holdingSlot === null) return;
  const victim = sim.fighters[holder.holdingSlot];
  holder.holdingSlot = null;
  victim.grabbedBySlot = null;
  holder.grabTimer = 0;
  if (pushApart) {
    victim.vx = 2.4 * holder.facing;
    holder.vx = -1.6 * holder.facing;
    victim.invulnTimer = Math.max(victim.invulnTimer, 10);
    holder.landingLagTimer = 12;
  }
}

function freezeFor(sim: SimulationState, frames: number, victim?: FighterEntity): void {
  sim.hitstopTimer = Math.max(sim.hitstopTimer, frames);
  if (victim && !sim.hitstopVictims.includes(victim.slot)) sim.hitstopVictims.push(victim.slot);
}

/** Returns true if the hit connected (including on shield). */
function applyHit(sim: SimulationState, attacker: FighterEntity, victim: FighterEntity, hit: HitParams): boolean {
  if (victim.invulnTimer > 0 || victim.respawnTimer > 0 || isIntangible(victim)) return false;

  const rawDamage = hit.damage * (hit.chargeMult ?? 1);
  const damage = rawDamage * staleMultiplier(attacker.staleQueue, hit.slot);
  const electric = hit.element === 'electric';
  pushStale(attacker.staleQueue, hit.slot);

  if (!hit.ignoreShield && victim.shielding && victim.shieldHp > 0) {
    victim.shieldHp = Math.max(0, victim.shieldHp - damage * 2.4);
    victim.vx += hit.knockDir * 2.2;
    freezeFor(sim, computeHitstop({ damage, hitlagMult: hit.hitlagMult, electric, shielded: true }));
    sim.pendingSfx.push('shield');
    spawnParticles(sim, victim.x, victim.y - 11, 5, 'spark', '#38BDF8', 2.0);
    if (victim.shieldHp <= 0) {
      victim.shielding = false;
      victim.hitstun = 55;
      victim.shieldStunTimer = 90;
    }
    return true;
  }

  victim.damagePct = Math.min(999, Math.round((victim.damagePct + damage) * 10) / 10);
  attacker.damageDealt += damage;

  // Getting hit breaks any grab the victim was doing.
  releaseGrab(sim, victim, false);

  const crouching = victim.crouching && victim.grounded;
  const hitstop = computeHitstop({ damage, hitlagMult: hit.hitlagMult, electric, crouching });

  if (hit.noLaunch) {
    victim.hitFlashTimer = Math.max(4, hitstop);
    freezeFor(sim, hitstop);
    sim.pendingSfx.push('hitLight');
    spawnParticles(sim, victim.x, victim.y - 11, 4, 'spark', '#F8FAFC', 1.8);
    return true;
  }

  const kb = computeKnockback({
    percent: victim.damagePct,
    damage,
    weight: victim.blueprint.stats.weight,
    growth: hit.growth,
    base: hit.baseKb,
    weightIndependent: hit.weightIndependent,
    attackerPercent: attacker.damagePct,
    crouching,
  });

  const armor = victim.moveKey ? victim.moves[victim.moveKey].armorKb : undefined;
  if (armor !== undefined && kb < armor) {
    victim.hitFlashTimer = Math.max(4, hitstop);
    freezeFor(sim, hitstop);
    sim.pendingSfx.push('hitLight');
    return true;
  }

  const worldAngleDeg = hit.knockDir === 1 ? hit.angleDeg : 180 - hit.angleDeg;
  victim.pendingLaunch = { kb, worldAngleDeg, hitstun: hitstunFrames(kb) };
  victim.hitstun = Math.max(victim.hitstun, 1);
  victim.moveKey = null;
  victim.shielding = false;
  victim.crouching = false;
  victim.hitFlashTimer = Math.max(5, hitstop);
  freezeFor(sim, hitstop, victim);

  const isHeavy = damage >= 12 || kb >= 60;
  sim.pendingSfx.push(isHeavy ? 'hitHeavy' : 'hitLight');
  sim.pendingShake = Math.max(sim.pendingShake, isHeavy ? 6.5 : 2.6);
  spawnParticles(sim, victim.x, victim.y - 11, isHeavy ? 10 : 6, 'spark', isHeavy ? '#FDE047' : '#F8FAFC', isHeavy ? 4.2 : 2.6);
  return true;
}

/** Called on the last frame of hitstop with the defender's held stick (DI, spec §2.2). */
function executeLaunch(f: FighterEntity, heldMask: number): void {
  const pl = f.pendingLaunch;
  if (!pl) return;
  f.pendingLaunch = null;
  const sx = (heldMask & INPUT_RIGHT ? 1 : 0) - (heldMask & INPUT_LEFT ? 1 : 0);
  const sy = (heldMask & INPUT_UP ? 1 : 0) - (heldMask & INPUT_DOWN ? 1 : 0);
  const angle = applyDirectionalInfluence(pl.worldAngleDeg, sx, sy);
  const v = computeLaunchVector(pl.kb, angle, 1, f.blueprint.stats.gravity);
  f.kbVx = v.vx;
  f.kbVy = v.vy;
  f.kbDecay = v.decay;
  f.vx = 0;
  f.vy = 0;
  f.hitstun = pl.hitstun;
  if (v.vy < -0.5) f.grounded = false;
}

/** SDI: each fresh direction press during hitstop nudges the defender (spec §2.2). */
function applySdi(f: FighterEntity): void {
  const jp = f.input.justPressedMask;
  if (!(jp & DIRECTIONS)) return;
  const d = ENGINE_TUNING.sdiDistance;
  if (jp & INPUT_LEFT) f.x -= d;
  if (jp & INPUT_RIGHT) f.x += d;
  if (jp & INPUT_UP) f.y -= d;
  if (jp & INPUT_DOWN && !f.grounded) f.y += d;
}

/** CPU DI: hard always survival-DIs, normal does on strong hits, easy never. */
function cpuDiMask(sim: SimulationState, f: FighterEntity): number {
  const pl = f.pendingLaunch;
  if (!pl || sim.cpuDifficulty === 'easy') return 0;
  if (sim.cpuDifficulty === 'normal' && pl.kb < 70) return 0;
  return INPUT_UP | (f.x < 0 ? INPUT_RIGHT : INPUT_LEFT);
}

// ── Moves ───────────────────────────────────────────────────────

function animFor(slot: MoveSlot): FighterEntity['animState'] {
  if (slot === 'fsmash' || slot === 'usmash' || slot === 'dsmash') return 'smash';
  if (slot === 'neutralSpecial' || slot === 'sideSpecial' || slot === 'upSpecial' || slot === 'downSpecial') return 'special';
  return 'attack';
}

function startMove(sim: SimulationState, f: FighterEntity, slot: MoveSlot, triggerMask: number, turnTo?: 1 | -1): void {
  if (turnTo) f.facing = turnTo;
  f.moveKey = slot;
  f.moveTick = 0;
  f.moveHitApplied = false;
  f.moveLastHitTick = -999;
  f.moveTriggerMask = triggerMask;
  f.chargeFrames = 0;
  f.moveChargeMult = 1;
  f.crouching = false;
  f.shielding = false;
  f.animState = animFor(slot);
  f.animTick = 0;
  if (slot === 'upSpecial') {
    f.upSpecialUsed = true;
    sim.pendingSfx.push('doubleJump');
  }
}

function spawnMoveProjectile(sim: SimulationState, f: FighterEntity, slot: MoveSlot, move: MoveFrameData): void {
  const proj = move.projectile;
  if (!proj) return;
  const pal = f.blueprint.palettes[f.paletteIndex]?.colors ?? f.blueprint.palettes[0].colors;
  sim.projectiles.push({
    id: sim.nextProjId++,
    ownerSlot: f.slot,
    x: f.x + 12 * f.facing,
    y: f.y - 11,
    vx: proj.speedX * f.facing,
    vy: proj.speedY,
    gravity: proj.gravity,
    radius: proj.radius,
    life: proj.lifetime,
    color: pal[proj.colorIndex] || '#FACC15',
    glowColor: pal[proj.glowIndex] || '#FFFFFF',
    bounces: Boolean(proj.bounces),
    damage: move.damage * f.moveChargeMult,
    baseKnockback: move.baseKnockback,
    knockbackGrowth: move.knockbackGrowth,
    launchAngleDeg: move.launchAngleDeg,
    hitstop: move.hitstop,
    moveSlot: slot,
    element: move.element,
  });
  sim.pendingSfx.push('shoot');
}

const THROW_DIR: Record<ThrowSlot, (facing: 1 | -1) => 1 | -1> = {
  fthrow: (fc) => fc,
  bthrow: (fc) => (fc === 1 ? -1 : 1),
  uthrow: (fc) => fc,
  dthrow: (fc) => fc,
};

/** Advances the current move. Returns true while the fighter is locked in it. */
function stepActiveMove(sim: SimulationState, f: FighterEntity, rawMask: number): boolean {
  if (!f.moveKey) return false;
  const slot = f.moveKey;
  const stats = f.blueprint.stats;
  const move = f.moves[slot];

  // Smash charge: hold the triggering button on the frame before the hitbox (spec §4.1).
  const chargeFrame = Math.max(0, move.startup - 2);
  if (move.chargeable && f.moveTick === chargeFrame && (rawMask & f.moveTriggerMask) && f.chargeFrames < ENGINE_TUNING.chargeMaxFrames) {
    f.chargeFrames++;
    f.moveChargeMult = chargeMultiplier(f.chargeFrames);
    if (f.chargeFrames % 8 === 0) spawnParticles(sim, f.x, f.y - 12, 2, 'spark', '#FDE047', 1.2);
    f.hitFlashTimer = f.chargeFrames % 10 < 5 ? 2 : 0;
    if (f.grounded) f.vx *= 0.8;
    return true;
  }

  f.moveTick++;

  if (f.moveTick === move.startup) {
    if (move.velocityBoostX !== undefined) f.vx = move.velocityBoostX * f.facing;
    if (move.velocityBoostY !== undefined) {
      f.vy = move.velocityBoostY;
      f.grounded = false;
    }
    spawnMoveProjectile(sim, f, slot, move);

    if (f.holdingSlot !== null) {
      const victim = sim.fighters[f.holdingSlot];
      if (slot === 'pummel') {
        applyHit(sim, f, victim, { ...hitParamsFrom(slot, move, null, f.facing), noLaunch: true, ignoreShield: true });
      } else if (isThrowSlot(slot)) {
        const dir = THROW_DIR[slot](f.facing);
        releaseGrab(sim, f, false);
        victim.invulnTimer = 0;
        applyHit(sim, f, victim, { ...hitParamsFrom(slot, move, null, dir), ignoreShield: true });
        if (slot === 'bthrow') f.facing = dir;
      }
    }
  }

  // Aerials auto-cancel into landing lag.
  if (isAerialSlot(slot) && f.grounded && f.moveTick > 1) {
    f.moveKey = null;
    f.moveTick = 0;
    f.landingLagTimer = move.landingLag ?? 8;
    f.animState = 'idle';
    return true;
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

// ── Jumping ─────────────────────────────────────────────────────

function handleJumpInput(sim: SimulationState, f: FighterEntity, shortHop = false): void {
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

  f.vy = -spec.impulse * (shortHop ? 0.64 : 1);
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

// ── Input → move ────────────────────────────────────────────────

function cstickToMask(c: number): number {
  return (c & INPUT_CSTICK_LEFT ? INPUT_LEFT : 0)
    | (c & INPUT_CSTICK_RIGHT ? INPUT_RIGHT : 0)
    | (c & INPUT_CSTICK_UP ? INPUT_UP : 0)
    | (c & INPUT_CSTICK_DOWN ? INPUT_DOWN : 0);
}

function readButtonPress(f: FighterEntity, rawMask: number): { press: ButtonPress; trigger: number } | null {
  const buf = f.input;
  if (consumeBufferedAction(buf, INPUT_SPECIAL)) return { press: { kind: 'special' }, trigger: INPUT_SPECIAL };
  const c = consumeCStick(buf);
  if (c) return { press: { kind: 'cstick', mask: c }, trigger: c };
  if (consumeBufferedAction(buf, INPUT_SMASH)) return { press: { kind: 'smash' }, trigger: INPUT_SMASH };
  if (consumeBufferedAction(buf, INPUT_GRAB)) return { press: { kind: 'grab' }, trigger: INPUT_GRAB };
  if (consumeBufferedAction(buf, INPUT_ATTACK)) {
    if (rawMask & INPUT_SHIELD && f.grounded) return { press: { kind: 'grab' }, trigger: INPUT_ATTACK };
    return { press: { kind: 'attack' }, trigger: INPUT_ATTACK };
  }
  return null;
}

function tryStartCombatMove(sim: SimulationState, f: FighterEntity, rawMask: number): boolean {
  const read = readButtonPress(f, rawMask);
  if (!read) return false;
  const resolved = resolveMove(
    {
      grounded: f.grounded,
      facing: f.facing,
      heldMask: rawMask,
      dirPressAge: f.input.dirPressAge,
      running: f.running,
      upSpecialUsed: f.upSpecialUsed,
    },
    read.press,
  );
  if (!resolved) return false;
  startMove(sim, f, resolved.slot, read.trigger, resolved.turnTo);
  return true;
}

/** Up-smash / up-special out of jumpsquat (and therefore out of shield, spec §3.2). */
function tryJumpSquatCancel(sim: SimulationState, f: FighterEntity, rawMask: number): boolean {
  if (!(rawMask & INPUT_UP)) return false;
  if (consumeBufferedAction(f.input, INPUT_SPECIAL)) {
    if (f.upSpecialUsed) return false;
    startMove(sim, f, 'upSpecial', INPUT_SPECIAL);
    return true;
  }
  const c = f.input.cstickBuffer > 0 && f.input.cstickBufferMask & INPUT_CSTICK_UP ? consumeCStick(f.input) : 0;
  if (c || consumeBufferedAction(f.input, INPUT_ATTACK) || consumeBufferedAction(f.input, INPUT_SMASH)) {
    startMove(sim, f, 'usmash', c || INPUT_ATTACK | INPUT_SMASH);
    return true;
  }
  return false;
}

// ── Grabs ───────────────────────────────────────────────────────

function beginGrab(sim: SimulationState, holder: FighterEntity, victim: FighterEntity): void {
  holder.moveKey = null;
  holder.moveTick = 0;
  holder.holdingSlot = victim.slot;
  holder.grabTimer = Math.min(240, Math.round(60 + victim.damagePct * 0.9));
  holder.vx = 0;
  victim.grabbedBySlot = holder.slot;
  victim.moveKey = null;
  victim.shielding = false;
  victim.hitstun = 0;
  victim.pendingLaunch = null;
  victim.kbVx = 0;
  victim.kbVy = 0;
  releaseGrab(sim, victim, false);
  sim.pendingSfx.push('hitLight');
  freezeFor(sim, 4);
}

function stepHolding(sim: SimulationState, f: FighterEntity, rawMask: number): void {
  const victim = sim.fighters[f.holdingSlot as 0 | 1];
  f.vx *= 0.6;
  f.animState = 'attack';

  const inThrowOrPummel = stepActiveMove(sim, f, rawMask);
  if (f.holdingSlot === null) return; // thrown this frame

  victim.x = f.x + GRAB_HOLD_OFFSET * f.facing;
  victim.y = f.y;
  victim.vx = 0;
  victim.vy = 0;
  if (inThrowOrPummel) return;

  f.grabTimer--;
  if (f.grabTimer <= 0) {
    releaseGrab(sim, f, true);
    return;
  }

  const c = consumeCStick(f.input);
  const dirMask = c ? cstickToMask(c) : recentDirectionMask(f.input);
  let throwSlot: ThrowSlot | null = null;
  if (dirMask & INPUT_UP) throwSlot = 'uthrow';
  else if (dirMask & INPUT_DOWN) throwSlot = 'dthrow';
  else if (dirMask & (f.facing === 1 ? INPUT_RIGHT : INPUT_LEFT)) throwSlot = 'fthrow';
  else if (dirMask & (f.facing === 1 ? INPUT_LEFT : INPUT_RIGHT)) throwSlot = 'bthrow';

  if (throwSlot) {
    startMove(sim, f, throwSlot, 0);
  } else if (consumeBufferedAction(f.input, INPUT_ATTACK) || consumeBufferedAction(f.input, INPUT_GRAB)) {
    startMove(sim, f, 'pummel', 0);
  }
}

const CPU_MASH_RATE = { easy: 1, normal: 2, hard: 3 } as const;

function stepGrabbed(sim: SimulationState, f: FighterEntity): void {
  const holder = sim.fighters[f.grabbedBySlot as 0 | 1];
  f.animState = 'hurt';
  f.shielding = false;
  const mashed = f.controlType === 'cpu'
    ? CPU_MASH_RATE[sim.cpuDifficulty]
    : f.input.justPressedMask ? 4 : 0;
  holder.grabTimer -= mashed;
}

// ── Per-fighter control ─────────────────────────────────────────

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

  if (f.grabbedBySlot !== null) {
    stepGrabbed(sim, f);
    return;
  }

  if (f.hitstun > 0) {
    f.hitstun--;
    f.shielding = false;
    f.crouching = false;
    f.animState = 'hurt';
    if (f.hitstun % 3 === 0 && Math.hypot(f.vx + f.kbVx, f.vy + f.kbVy) > 4.2) {
      spawnParticles(sim, f.x, f.y - 10, 1, 'smoke', '#CBD5E1', 0.5);
    }
    return;
  }

  if (f.holdingSlot !== null) {
    stepHolding(sim, f, rawMask);
    return;
  }

  if (f.landingLagTimer > 0) {
    f.landingLagTimer--;
    f.vx *= 0.8;
    f.animState = 'idle';
    return;
  }

  if (stepActiveMove(sim, f, rawMask)) return;

  if (f.jumpSquatTimer > 0) {
    if (tryJumpSquatCancel(sim, f, rawMask)) {
      f.jumpSquatTimer = 0;
      return;
    }
    f.jumpSquatTimer--;
    f.squashX = 1.14;
    f.squashY = 0.86;
    if (f.jumpSquatTimer === 0) {
      // Short hop: jump released before liftoff. CPUs always full-hop (their masks don't hold jump).
      const shortHop = f.controlType === 'human' && !(rawMask & INPUT_JUMP);
      handleJumpInput(sim, f, shortHop);
    }
    return;
  }

  const canShield = Boolean(rawMask & INPUT_SHIELD) && f.grounded && f.shieldStunTimer === 0 && f.shieldHp > 5;
  if (canShield) {
    f.shielding = true;
    f.crouching = false;
    f.running = false;
    f.shieldHp = Math.max(0, f.shieldHp - 0.35);
    f.vx *= 0.72;
    f.animState = 'idle';
    // Shield + A = grab (other out-of-shield options are phase 3).
    if (peekBuffered(f.input, INPUT_ATTACK) || peekBuffered(f.input, INPUT_GRAB)) {
      consumeBufferedAction(f.input, INPUT_ATTACK);
      consumeBufferedAction(f.input, INPUT_GRAB);
      startMove(sim, f, 'grab', INPUT_ATTACK);
    }
    return;
  }

  f.shielding = false;
  if (f.shieldStunTimer === 0) {
    f.shieldHp = Math.min(100, f.shieldHp + 0.28);
  }

  const moveLeft = Boolean(rawMask & INPUT_LEFT);
  const moveRight = Boolean(rawMask & INPUT_RIGHT);
  const holdingDown = Boolean(rawMask & INPUT_DOWN);

  f.crouching = f.grounded && holdingDown && !moveLeft && !moveRight;

  if (f.wallJumpLockTimer === 0) {
    const traction = f.onIce ? stats.traction * 0.22 : stats.traction;
    const groundAccel = f.onIce ? 0.22 : 0.45;
    if (f.crouching) {
      if (Math.abs(f.vx) <= traction) f.vx = 0;
      else f.vx -= Math.sign(f.vx) * traction;
      f.squashY = Math.min(f.squashY, 0.84);
      f.squashX = Math.max(f.squashX, 1.1);
    } else if (moveLeft && !moveRight) {
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
  f.running = f.grounded && Math.abs(f.vx) >= stats.runSpeed * 0.8 && (moveLeft || moveRight) && Math.sign(f.vx) === f.facing;

  if (f.wallClingDir !== 0) {
    const pullingAway =
      (f.wallClingDir === 1 && moveLeft && !moveRight) ||
      (f.wallClingDir === -1 && moveRight && !moveLeft);
    if (holdingDown || pullingAway) {
      f.wallClingDir = 0;
    }
  }

  // Drop through platforms after holding down for 2 frames, leaving a window for down-tilt/smash.
  const attackPending = peekBuffered(f.input, INPUT_ATTACK) || peekBuffered(f.input, INPUT_SMASH) ||
    peekBuffered(f.input, INPUT_SPECIAL) || f.input.cstickBuffer > 0;
  // CPUs only pulse down for one frame, so they drop immediately.
  const dropFrame = f.controlType === 'cpu' ? 1 : 2;
  if (f.grounded && f.onPassThrough && f.input.downHeldFrames === dropFrame && !attackPending) {
    f.dropThroughTimer = 11;
    f.grounded = false;
    f.crouching = false;
    f.y += 2;
  } else if (holdingDown && !f.grounded && f.vy > 0) {
    f.vy = Math.min(stats.fastFallSpeed, f.vy + 0.45);
  }

  if (consumeBufferedAction(f.input, INPUT_JUMP)) {
    const wallJump = !f.grounded && (f.wallClingDir !== 0 || f.wallClingGraceTimer > 0);
    if (f.grounded && !wallJump) {
      f.jumpSquatTimer = Math.max(1, stats.jumpSquat ?? 3);
      f.crouching = false;
      return;
    }
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

// ── Projectiles ─────────────────────────────────────────────────

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
      victim.grabbedBySlot === null &&
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
      const connected = applyHit(sim, owner, victim, {
        slot: p.moveSlot,
        damage: p.damage,
        baseKb: p.baseKnockback,
        growth: p.knockbackGrowth,
        angleDeg: p.launchAngleDeg,
        knockDir: dir,
        element: p.element,
      });
      if (connected) {
        sim.projectiles.splice(i, 1);
        continue;
      }
    }

    if (p.life <= 0) {
      sim.projectiles.splice(i, 1);
    }
  }
}

// ── Melee hit detection ─────────────────────────────────────────

function resolveMeleeHits(sim: SimulationState): void {
  for (const attacker of sim.fighters) {
    if (attacker.respawnTimer > 0 || !attacker.moveKey) continue;
    const slot = attacker.moveKey;
    const move = attacker.moves[slot];
    if (slot === 'pummel' || isThrowSlot(slot)) continue;

    const canRehit = move.multiHitInterval !== undefined &&
      attacker.moveTick - attacker.moveLastHitTick >= move.multiHitInterval;
    if (attacker.moveHitApplied && !canRehit) continue;

    const victim = sim.fighters[attacker.slot === 0 ? 1 : 0];
    if (victim.respawnTimer > 0 || victim.grabbedBySlot !== null) continue;

    const vx = victim.x - HURTBOX_HALF_W;
    const vy = victim.y - HURTBOX_HEIGHT;
    // Hitboxes are id-sorted, so the first overlap is the highest-priority one.
    const hb = getActiveHitboxes(attacker).find((h) =>
      rectsOverlap(h.x, h.y, h.w, h.h, vx, vy, HURTBOX_HALF_W * 2, HURTBOX_HEIGHT),
    );
    if (!hb) continue;

    if (slot === 'grab') {
      if (victim.invulnTimer > 0 || isIntangible(victim) || victim.holdingSlot !== null && sim.fighters[victim.holdingSlot] === attacker) continue;
      attacker.moveHitApplied = true;
      beginGrab(sim, attacker, victim);
      continue;
    }

    const dir: 1 | -1 = victim.x >= attacker.x ? 1 : -1;
    const connected = applyHit(sim, attacker, victim, hitParamsFrom(slot, move, hb, dir, attacker.moveChargeMult));
    if (connected) {
      attacker.moveHitApplied = true;
      attacker.moveLastHitTick = attacker.moveTick;
    }
  }
}

// ── Main tick ───────────────────────────────────────────────────

function computeMask(sim: SimulationState, f: FighterEntity, other: FighterEntity, humanMask: number): number {
  if (f.controlType !== 'cpu') return humanMask;
  return computeCpuInputMask(
    { ...f, moveState: f.moveKey, isRespawning: f.respawnTimer > 0 },
    { ...other, moveState: other.moveKey, isRespawning: other.respawnTimer > 0 },
    sim.stage,
    sim.cpuDifficulty,
    f.ai,
    sim.matchTimeTicks,
  );
}

function stepHitstop(sim: SimulationState, humanMasks: [number, number]): void {
  sim.hitstopTimer--;
  for (const f of sim.fighters) {
    const isVictim = sim.hitstopVictims.includes(f.slot);
    if (f.controlType === 'cpu') {
      if (isVictim) updateInputBuffer(f.input, cpuDiMask(sim, f), true);
      continue;
    }
    // Humans keep buffering through hitlag; defenders also get SDI.
    updateInputBuffer(f.input, humanMasks[f.slot], true);
    if (isVictim) applySdi(f);
  }
  if (sim.hitstopTimer <= 0) {
    for (const slot of sim.hitstopVictims) {
      const f = sim.fighters[slot];
      executeLaunch(f, f.input.heldMask);
    }
    sim.hitstopVictims = [];
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
    stepHitstop(sim, [p1HumanMask, p2HumanMask]);
    stepParticles(sim);
    return;
  }

  const [f0, f1] = sim.fighters;
  const mask0 = computeMask(sim, f0, f1, p1HumanMask);
  const mask1 = computeMask(sim, f1, f0, p2HumanMask);

  stepFighterControl(sim, f0, mask0);
  stepFighterControl(sim, f1, mask1);

  integrateFighterStagePhysics(sim, f0);
  integrateFighterStagePhysics(sim, f1);

  f0.animTick++;
  f1.animTick++;

  resolveMeleeHits(sim);
  stepProjectiles(sim);
  stepParticles(sim);
}

/** Exposed for tests and tooling. */
export const __testing = { applyHit, executeLaunch, resolveMeleeHits, INPUT_CSTICK_ANY };
