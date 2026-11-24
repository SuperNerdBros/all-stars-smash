import type { AnimState } from '../types/palette';
import type { FighterBlueprint, MoveFrameData } from '../types/fighter';
import type { StageManifest } from '../types/stage';
import type { CpuDifficulty, PlayerControlType, SfxEvent } from '../types/protocol';
import { createInputBuffer, type BufferedInputState } from './inputBuffer';
import { createAiMemory, type AiMemory } from './aiController';

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

const PARTICLE_SPEC: Record<ParticleEntity['kind'], { size: number; life: number }> = {
  ko: { size: 5, life: 32 },
  smoke: { size: 4, life: 18 },
  spark: { size: 3, life: 14 },
  dust: { size: 3, life: 14 },
};

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
  const isBeforeActive = f.moveTick < move.startup;
  const isAfterActive = f.moveTick >= move.startup + move.active;
  if (isBeforeActive || isAfterActive) {
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
