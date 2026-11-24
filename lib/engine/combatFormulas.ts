/**
 * Pure combat math (spec §1–§3). No engine state here, so everything is unit-testable.
 * Tuning lives in ENGINE_TUNING; change values there rather than inline.
 */

export const ENGINE_TUNING = {
  /** Legacy roster baseKnockback → Smash-style `b`. */
  bkbUnit: 8.5,
  /** px/frame of launch speed per point of knockback. */
  launchSpeedPerKb: 0.135,
  /** px/frame² linear decay of launch speed (pre-balloon). */
  launchDecay: 0.23,
  /** Balloon curve: initial speed ×k, decay ×k² ⇒ same distance, 1/k the time (spec §1.3). */
  balloonK: 1.5,
  maxLaunchSpeed: 26,
  hitstunPerKb: 0.4,
  maxHitstun: 120,
  /** Gravity compensation reference (median roster gravity, px/frame²). */
  gravityRef: 0.26,
  gravityCompScale: 5,
  rageMax: 0.1,
  crouchCancel: 0.67,
  launchRate: 1,
  hitlagProfile: 'modern' as 'modern' | 'classic',
  maxHitstop: 30,
  /** Max trajectory rotation from DI, degrees. */
  diMaxDeg: 18,
  /** px moved per SDI input during hitstop. */
  sdiDistance: 3,
  chargeMaxFrames: 60,
  chargeMaxMult: 1.4,
  freshBonus: 1.05,
};

// ── §1.1 Knockback ──────────────────────────────────────────────

export interface KnockbackInput {
  /** Target percent AFTER this hit's damage is applied. */
  percent: number;
  /** Effective (staled) damage. */
  damage: number;
  weight: number;
  /** Smash-style scaling `s` (100 = neutral). */
  growth: number;
  /** Legacy-unit base knockback (converted via bkbUnit). */
  base: number;
  weightIndependent?: boolean;
  attackerPercent?: number;
  crouching?: boolean;
}

export function rageMultiplier(attackerPercent: number): number {
  const p = Math.min(150, Math.max(35, attackerPercent));
  return 1 + ((p - 35) / 115) * ENGINE_TUNING.rageMax;
}

export function computeKnockback(i: KnockbackInput): number {
  const w = i.weightIndependent ? 100 : i.weight;
  const p = i.percent;
  const d = i.damage;
  const b = i.base * ENGINE_TUNING.bkbUnit;
  let kb = (((p / 10 + (p * d) / 20) * (200 / (w + 100)) * 1.4 + 18) * (i.growth / 100)) + b;
  kb *= rageMultiplier(i.attackerPercent ?? 0);
  if (i.crouching) kb *= ENGINE_TUNING.crouchCancel;
  kb *= ENGINE_TUNING.launchRate;
  return Math.max(0, kb);
}

export function hitstunFrames(kb: number): number {
  return Math.min(ENGINE_TUNING.maxHitstun, Math.floor(kb * ENGINE_TUNING.hitstunPerKb));
}

// ── §1.2 / §1.3 Launch velocity ─────────────────────────────────

export interface LaunchVector {
  vx: number;
  vy: number;
  /** Per-frame speed decay to apply to the launch vector. */
  decay: number;
}

/**
 * @param angleDeg 0 = toward knockDir, 90 = up, negative = down.
 * @param gravity target gravity (px/frame²) for vertical compensation.
 */
export function computeLaunchVector(kb: number, angleDeg: number, knockDir: 1 | -1, gravity: number): LaunchVector {
  const t = ENGINE_TUNING;
  const rad = (angleDeg * Math.PI) / 180;
  const speed = kb * t.launchSpeedPerKb;
  let vx = Math.cos(rad) * speed * knockDir;
  let vyUp = Math.sin(rad) * speed;
  if (vyUp > 0) vyUp += (gravity - t.gravityRef) * t.gravityCompScale;
  const k = t.balloonK;
  vx *= k;
  vyUp *= k;
  const mag = Math.hypot(vx, vyUp);
  if (mag > t.maxLaunchSpeed) {
    vx *= t.maxLaunchSpeed / mag;
    vyUp *= t.maxLaunchSpeed / mag;
  }
  return { vx, vy: -vyUp, decay: t.launchDecay * k * k };
}

/** Decays a launch vector in place along its own direction; returns remaining speed. */
export function decayLaunch(v: { kbVx: number; kbVy: number; kbDecay: number }): number {
  const mag = Math.hypot(v.kbVx, v.kbVy);
  if (mag <= v.kbDecay || mag === 0) {
    v.kbVx = 0;
    v.kbVy = 0;
    return 0;
  }
  const s = (mag - v.kbDecay) / mag;
  v.kbVx *= s;
  v.kbVy *= s;
  return mag - v.kbDecay;
}

// ── §2.1 Hitstop ────────────────────────────────────────────────

export interface HitstopInput {
  damage: number;
  hitlagMult?: number;
  electric?: boolean;
  shielded?: boolean;
  crouching?: boolean;
  stateMult?: number;
}

export function computeHitstop(i: HitstopInput, profile = ENGINE_TUNING.hitlagProfile): number {
  const e = i.electric ? 1.5 : 1;
  const c = i.crouching ? ENGINE_TUNING.crouchCancel : 1;
  let frames: number;
  if (profile === 'classic') {
    frames = Math.floor(Math.floor(Math.floor(i.damage / 3 + 3) * e) * c);
  } else {
    const h = i.hitlagMult ?? 1;
    const s = i.shielded ? 0.67 : 1;
    const pm = i.stateMult ?? 1;
    frames = Math.floor(Math.floor(Math.floor((i.damage * 0.65 + 6) * h * e * s) * pm) * c);
  }
  return Math.max(1, Math.min(ENGINE_TUNING.maxHitstop, frames));
}

// ── §2.2 DI / SDI ───────────────────────────────────────────────

/**
 * Rotates a launch angle toward the held stick by the perpendicular component.
 * Angles in world degrees (0 = +x, 90 = up). Returns the new world angle.
 */
export function applyDirectionalInfluence(worldAngleDeg: number, stickX: number, stickY: number): number {
  if (stickX === 0 && stickY === 0) return worldAngleDeg;
  const stickDeg = (Math.atan2(stickY, stickX) * 180) / Math.PI;
  const diff = ((stickDeg - worldAngleDeg) * Math.PI) / 180;
  const perp = Math.sin(diff); // -1..1, 0 when parallel
  return worldAngleDeg + perp * ENGINE_TUNING.diMaxDeg;
}

// ── §3.1 Stale-move negation ────────────────────────────────────

export const STALE_QUEUE_SIZE = 9;
/** Penalty per queue slot, newest first. Slots 1+2+6 = 22.6% (spec §3.1). */
export const STALE_WEIGHTS = [0.09, 0.08545, 0.0764, 0.0677, 0.0593, 0.05035, 0.0418, 0.0333, 0.0248] as const;

export function staleMultiplier<T>(queue: readonly T[], move: T): number {
  let penalty = 0;
  let found = false;
  for (let i = 0; i < queue.length && i < STALE_QUEUE_SIZE; i++) {
    if (queue[i] === move) {
      penalty += STALE_WEIGHTS[i];
      found = true;
    }
  }
  return found ? 1 - penalty : ENGINE_TUNING.freshBonus;
}

/** Newest at index 0. Mutates and returns the queue. */
export function pushStale<T>(queue: T[], move: T): T[] {
  queue.unshift(move);
  if (queue.length > STALE_QUEUE_SIZE) queue.length = STALE_QUEUE_SIZE;
  return queue;
}

export function chargeMultiplier(chargeFrames: number): number {
  const t = ENGINE_TUNING;
  const c = Math.min(t.chargeMaxFrames, Math.max(0, chargeFrames));
  return 1 + (t.chargeMaxMult - 1) * (c / t.chargeMaxFrames);
}
