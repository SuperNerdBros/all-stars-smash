import {
  INPUT_ATTACK,
  INPUT_DOWN,
  INPUT_GRAB,
  INPUT_JUMP,
  INPUT_LEFT,
  INPUT_RIGHT,
  INPUT_SMASH,
  INPUT_SPECIAL,
  INPUT_UP,
} from '../types/protocol';
import type { StageManifest } from '../types/stage';
import type { FighterEntity, SimulationState } from './physics';
import { computeVolumeState } from './platformMotion';

export interface TargetAssistMemory {
  jumpPulseCooldown: number;
}

interface SafeStageBounds {
  readonly minX: number;
  readonly maxX: number;
  readonly mainTopY: number;
}

const MANUAL_DIR_MASK = INPUT_LEFT | INPUT_RIGHT | INPUT_UP | INPUT_DOWN;
const MELEE_RANGE_X = 20;
const PROJECTILE_RANGE_X = 44;

export function createTargetAssistMemory(): TargetAssistMemory {
  return { jumpPulseCooldown: 0 };
}

export function resolveActiveTargetSlot(
  sim: SimulationState,
  selfSlot: number,
  requestedSlot: number | null,
): number | null {
  if (requestedSlot === null) {
    return null;
  }

  const requested = sim.fighters[requestedSlot];
  const requestedIsValid =
    requested !== undefined && requested.slot !== selfSlot && requested.stocks > 0;
  if (requestedIsValid) {
    return requestedSlot;
  }

  const self = sim.fighters[selfSlot];
  if (!self) {
    return null;
  }

  let bestSlot: number | null = null;
  let bestDistSq = Infinity;
  for (const candidate of sim.fighters) {
    const isLivingOpponent = candidate.slot !== selfSlot && candidate.stocks > 0;
    if (!isLivingOpponent) continue;
    const dx = candidate.x - self.x;
    const dy = candidate.y - self.y;
    const distSq = dx * dx + dy * dy;
    if (distSq < bestDistSq) {
      bestDistSq = distSq;
      bestSlot = candidate.slot;
    }
  }
  return bestSlot;
}

function computeStageSafeBounds(stage: StageManifest, tick: number): SafeStageBounds {
  let minX = Infinity;
  let maxX = -Infinity;
  let mainTopY = Infinity;

  for (const vol of stage.volumes) {
    const isSolidMainFloor = !vol.passThrough && !vol.decorative;
    if (!isSolidMainFloor) continue;
    const pose = computeVolumeState(vol, tick);
    if (!pose.solidActive) continue;
    minX = Math.min(minX, pose.x - vol.width * 0.5 + 12);
    maxX = Math.max(maxX, pose.x + vol.width * 0.5 - 12);
    mainTopY = Math.min(mainTopY, pose.topY);
  }

  if (!Number.isFinite(minX)) {
    return { minX: -140, maxX: 140, mainTopY: 48 };
  }
  return { minX, maxX, mainTopY };
}

function computeRecoveryAssist(
  rawMask: number,
  self: FighterEntity,
  bounds: SafeStageBounds,
  mem: TargetAssistMemory,
): number | null {
  if (self.wallClingDir !== 0 && mem.jumpPulseCooldown === 0) {
    const inwardDir = self.x < 0 ? INPUT_RIGHT : INPUT_LEFT;
    mem.jumpPulseCooldown = 10;
    return rawMask | INPUT_JUMP | inwardDir;
  }

  const offLeft = self.x < bounds.minX - 6;
  const offRight = self.x > bounds.maxX + 6;
  const belowStage = self.y > bounds.mainTopY + 14;
  const needsRecovery = offLeft || offRight || belowStage;
  if (!needsRecovery) {
    return null;
  }

  const inwardDir = self.x < 0 ? INPUT_RIGHT : INPUT_LEFT;
  let mask = rawMask | inwardDir;
  const fallingLow = self.vy > 0.5 || self.y > bounds.mainTopY + 2;

  if (fallingLow) {
    const canAirJump = self.jumpsLeft > 0 && mem.jumpPulseCooldown === 0;
    const needsUpSpecial = !self.upSpecialUsed && self.y > bounds.mainTopY + 4;
    if (canAirJump) {
      mask |= INPUT_JUMP;
      mem.jumpPulseCooldown = 14;
    } else if (needsUpSpecial) {
      mask |= INPUT_UP | INPUT_SPECIAL;
    }
  }
  return mask;
}

export function applyTargetAssist(
  rawMask: number,
  self: FighterEntity,
  target: FighterEntity,
  stage: StageManifest,
  tick: number,
  mem: TargetAssistMemory,
): number {
  if (mem.jumpPulseCooldown > 0) {
    mem.jumpPulseCooldown--;
  }

  const fighterUnavailable = self.respawnTimer > 0 || self.hitstun > 0 || self.stocks <= 0;
  if (fighterUnavailable) {
    return rawMask;
  }

  const hasManualDirection = (rawMask & MANUAL_DIR_MASK) !== 0;
  if (hasManualDirection) {
    return rawMask;
  }

  const bounds = computeStageSafeBounds(stage, tick);
  const recoveryMask = computeRecoveryAssist(rawMask, self, bounds, mem);
  if (recoveryMask !== null) {
    return recoveryMask;
  }

  const targetUnavailable = target.respawnTimer > 0 || target.stocks <= 0;
  if (targetUnavailable) {
    return rawMask;
  }

  const dx = target.x - self.x;
  const dy = target.y - self.y;
  const absX = Math.abs(dx);
  const targetDir = dx >= 0 ? INPUT_RIGHT : INPUT_LEFT;
  const desiredFacing: 1 | -1 = dx >= 0 ? 1 : -1;
  const facingTarget = self.facing === desiredFacing;

  const pressingSpecial = (rawMask & INPUT_SPECIAL) !== 0;
  const pressingCombat = (rawMask & (INPUT_ATTACK | INPUT_SMASH | INPUT_GRAB)) !== 0;

  let mask = rawMask;

  if (pressingSpecial && facingTarget && absX >= PROJECTILE_RANGE_X) {
    return mask;
  }

  const shouldChase = absX > MELEE_RANGE_X;
  const shouldTurnToFace = !facingTarget && (pressingCombat || pressingSpecial || absX > 6);
  if (shouldChase || shouldTurnToFace) {
    mask |= targetDir;
  }

  const targetAbove = dy < -24;
  const canClimbJump =
    mem.jumpPulseCooldown === 0 &&
    (self.grounded || (self.jumpsLeft > 0 && self.vy >= 0 && dy < -30));
  if (targetAbove && canClimbJump) {
    mask |= INPUT_JUMP;
    mem.jumpPulseCooldown = 18;
  }

  const targetBelow = dy > 28 && self.grounded && absX < 64;
  if (targetBelow && !pressingCombat && !pressingSpecial) {
    mask |= INPUT_DOWN;
  }

  return mask;
}
