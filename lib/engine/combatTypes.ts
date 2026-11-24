import type { AnimState } from '../types/palette';
import type { FighterBlueprint, MoveFrameData } from '../types/fighter';
import type { StageManifest } from '../types/stage';
import type { CpuDifficulty, PlayerControlType, SfxEvent } from '../types/protocol';
import { createInputBuffer, type BufferedInputState } from './inputBuffer';
import { createAiMemory, type AiMemory } from './aiController';
import type { HitboxSpec, MoveSlot } from '../types/moves';
import { buildFullMoveset, type FullMoveset } from '../roster/movesetBuilder';

/** Any slot of the full move matrix. */
export type ActiveMoveKey = MoveSlot;
/** The 5 authored core moves (used by the attract-mode demo arena). */
export type CoreMoveKey = 'jab' | 'smash' | 'aerial' | 'neutralSpecial' | 'upSpecial';

/** Launch waiting for hitstop to finish so DI can be read on its last frame (spec §2.2). */
export interface PendingLaunch {
  kb: number;
  /** World angle in degrees, 0 = +x, 90 = up. */
  worldAngleDeg: number;
  hitstun: number;
}

export interface ActiveHitboxWorld {
  x: number;
  y: number;
  w: number;
  h: number;
  move: MoveFrameData;
  /** Resolved hitbox (id + physics overrides). */
  spec: HitboxSpec;
}

export interface FighterEntity {
  slot: number;
  blueprint: FighterBlueprint;
  paletteIndex: number;
  controlType: PlayerControlType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  grounded: boolean;
  onIce: boolean;
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
  /** Full derived move matrix for this blueprint. Rebuild via refreshFighterMoves(). */
  moves: FullMoveset;
  /** Tick of the last connected hit of the current move (multi-hit spacing). */
  moveLastHitTick: number;
  /** Buttons that started the current move; holding them charges a chargeable smash. */
  moveTriggerMask: number;
  chargeFrames: number;
  /** Charge actually applied to the current move (locked when charging ends). */
  moveChargeMult: number;
  landingLagTimer: number;
  jumpSquatTimer: number;
  crouching: boolean;
  running: boolean;
  onPassThrough: boolean;
  /** Newest-first queue of connected moves (spec §3.1). */
  staleQueue: MoveSlot[];
  /** Balloon launch vector, integrated on top of self-velocity. */
  kbVx: number;
  kbVy: number;
  kbDecay: number;
  pendingLaunch: PendingLaunch | null;
  /** Slot of the fighter this one is holding, or null. */
  holdingSlot: number | null;
  /** Slot of the fighter holding this one, or null. */
  grabbedBySlot: number | null;
  /** Bit per victim slot already hit by the current move. */
  moveHitMask: number;
  /** Who last damaged this fighter (credited with the KO). */
  lastHitBy: number | null;
  grabTimer: number;
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
  ownerSlot: number;
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
  moveSlot: MoveSlot;
  element?: HitboxSpec['element'];
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
  fighters: FighterEntity[];
  projectiles: ProjectileEntity[];
  particles: ParticleEntity[];
  cpuDifficulty: CpuDifficulty;
  hitstopTimer: number;
  /** Fighters currently frozen as the defender of a hit (DI/SDI is read for them). */
  hitstopVictims: number[];
  matchTimeTicks: number;
  winnerSlot: number | null;
  nextProjId: number;
  pendingSfx: SfxEvent[];
  pendingShake: number;
  pendingKo: { x: number; y: number } | null;
}

export const HURTBOX_HALF_W = 8;
export const HURTBOX_HEIGHT = 22;

const PARTICLE_SPEC: Record<ParticleEntity['kind'], { size: number; life: number }> = {
  ko: { size: 5, life: 32 },
  smoke: { size: 4, life: 18 },
  spark: { size: 3, life: 14 },
  dust: { size: 3, life: 14 },
};

type CombatExtras = Pick<
  FighterEntity,
  | 'moves' | 'moveLastHitTick' | 'moveTriggerMask' | 'chargeFrames' | 'moveChargeMult'
  | 'landingLagTimer' | 'jumpSquatTimer' | 'crouching' | 'running' | 'onPassThrough'
  | 'staleQueue' | 'kbVx' | 'kbVy' | 'kbDecay' | 'pendingLaunch'
  | 'holdingSlot' | 'grabbedBySlot' | 'grabTimer' | 'moveHitMask' | 'lastHitBy'
>;

/** Default values for the combat-engine fields added for the full move matrix. */
export function createCombatExtras(blueprint: FighterBlueprint): CombatExtras {
  return {
    moves: buildFullMoveset(blueprint),
    moveLastHitTick: -999,
    moveTriggerMask: 0,
    chargeFrames: 0,
    moveChargeMult: 1,
    landingLagTimer: 0,
    jumpSquatTimer: 0,
    crouching: false,
    running: false,
    onPassThrough: false,
    staleQueue: [],
    kbVx: 0,
    kbVy: 0,
    kbDecay: 0,
    pendingLaunch: null,
    holdingSlot: null,
    grabbedBySlot: null,
    grabTimer: 0,
    moveHitMask: 0,
    lastHitBy: null,
  };
}

function createFighterEntity(
  slot: number,
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
    facing: spawn.x <= 0 ? 1 : -1,
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
    ...createCombatExtras(blueprint),
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

export interface FighterSpawnSpec {
  blueprint: FighterBlueprint;
  paletteIndex: number;
  controlType: PlayerControlType;
}

/**
 * Spawn point for seat `i` of `n`. Seats 0/1 use the stage's authored points; more seats are spread
 * evenly between (and slightly beyond) them, alternating sides so neighbours start apart.
 */
export function spawnPointFor(stage: StageManifest, i: number, n: number): { x: number; y: number } {
  const [a, b] = stage.spawnPoints;
  if (n <= 2 || !b) return stage.spawnPoints[i] ?? a;
  const left = Math.min(a.x, b.x);
  const right = Math.max(a.x, b.x);
  const span = right - left;
  // Order seats left→right: 0, 2, 4 … on the left half, 1, 3, 5 … mirrored on the right.
  const t = n === 1 ? 0.5 : (i % 2 === 0 ? i / 2 : n - 1 - (i - 1) / 2) / (n - 1);
  return { x: left - span * 0.1 + span * 1.2 * t, y: Math.min(a.y, b.y) };
}

export function createSimulationState(
  specs: readonly FighterSpawnSpec[],
  cpuDifficulty: CpuDifficulty,
  stage: StageManifest,
  stocks: number,
): SimulationState {
  return {
    stage,
    fighters: specs.map((s, i) =>
      createFighterEntity(i, s.blueprint, s.paletteIndex, s.controlType, spawnPointFor(stage, i, specs.length), stocks),
    ),
    projectiles: [],
    particles: [],
    cpuDifficulty,
    hitstopTimer: 0,
    hitstopVictims: [],
    matchTimeTicks: 0,
    winnerSlot: null,
    nextProjId: 1,
    pendingSfx: [],
    pendingShake: 0,
    pendingKo: null,
  };
}

/** Fighters still in the match (have stocks left). */
export function aliveFighters(sim: SimulationState): FighterEntity[] {
  return sim.fighters.filter((f) => f.stocks > 0);
}

/** Nearest living opponent, or null. */
export function nearestOpponent(sim: SimulationState, f: FighterEntity): FighterEntity | null {
  let best: FighterEntity | null = null;
  let bestD = Infinity;
  for (const o of sim.fighters) {
    if (o === f || o.stocks <= 0 || o.respawnTimer > 0) continue;
    const d = Math.hypot(o.x - f.x, o.y - f.y);
    if (d < bestD) {
      bestD = d;
      best = o;
    }
  }
  return best;
}

export function refreshFighterMoves(f: FighterEntity): void {
  f.moves = buildFullMoveset(f.blueprint);
}

/** All live hitboxes of the current move, sorted by ascending id (spec §3.3). */
export function getActiveHitboxes(f: FighterEntity): ActiveHitboxWorld[] {
  if (!f.moveKey) return [];
  const move = f.moves[f.moveKey];
  if (f.moveTick < move.startup || f.moveTick >= move.startup + move.active) return [];
  const specs: HitboxSpec[] = move.hitboxes?.length
    ? [...move.hitboxes].sort((a, b) => a.id - b.id)
    : [{ id: 0, ...move.hitbox }];
  return specs.map((spec) => {
    const cx = f.x + spec.offsetX * f.facing;
    const cy = f.y + spec.offsetY;
    return { x: cx - spec.width * 0.5, y: cy - spec.height * 0.5, w: spec.width, h: spec.height, move, spec };
  });
}

/** First (lowest-id) active hitbox, kept for older call sites. */
export function getActiveHitbox(f: FighterEntity): ActiveHitboxWorld | null {
  return getActiveHitboxes(f)[0] ?? null;
}

export function rectsOverlap(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
): boolean {
  const overlapX = ax < bx + bw && ax + aw > bx;
  const overlapY = ay < by + bh && ay + ah > by;
  return overlapX && overlapY;
}

export function spawnParticles(
  sim: SimulationState,
  x: number,
  y: number,
  count: number,
  kind: ParticleEntity['kind'],
  color: string,
  speed = 2.6,
): void {
  const spec = PARTICLE_SPEC[kind];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + ((sim.matchTimeTicks * 17 + i * 31) % 10) * 0.08;
    const spd = speed * (0.45 + ((i * 37) % 10) * 0.09);
    const upwardDust = kind === 'dust' ? 0.8 : 0;
    sim.particles.push({
      x,
      y,
      z: ((i % 3) - 1) * 4,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd - upwardDust,
      vz: ((i % 5) - 2) * 0.25,
      size: spec.size,
      color,
      life: spec.life,
      maxLife: spec.life,
      kind,
    });
  }
}

export function resolveJumpSpec(
  isGroundJump: boolean,
  isThirdJump: boolean,
  jumpForce: number,
  doubleJumpForce: number,
): { impulse: number; sfx: SfxEvent } {
  if (isGroundJump) {
    return { impulse: jumpForce, sfx: 'jump' };
  }
  if (isThirdJump) {
    return { impulse: doubleJumpForce * 0.96, sfx: 'tripleJump' };
  }
  return { impulse: doubleJumpForce, sfx: 'doubleJump' };
}

export function stepParticles(sim: SimulationState): void {
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
