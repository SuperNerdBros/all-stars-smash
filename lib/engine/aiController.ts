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
} from '../types/protocol';
import type { StageManifest } from '../types/stage';
import { computeVolumeState } from './platformMotion';

export interface AiFighterView {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  grounded: boolean;
  jumpsLeft: number;
  wallClingDir: -1 | 0 | 1;
  damagePct: number;
  moveState: string | null;
  upSpecialUsed: boolean;
  hitstun: number;
  isRespawning: boolean;
}

export interface AiMemory {
  decisionCooldown: number;
  cachedMask: number;
  attackCooldown: number;
  jumpPulseCooldown: number;
}

const CADENCE_BY_DIFF: Record<CpuDifficulty, number> = {
  easy: 13,
  normal: 7,
  hard: 3,
};

const AGGRESSION_BY_DIFF: Record<CpuDifficulty, number> = {
  easy: 0.25,
  normal: 0.45,
  hard: 0.68,
};

export function createAiMemory(): AiMemory {
  return {
    decisionCooldown: 0,
    cachedMask: 0,
    attackCooldown: 0,
    jumpPulseCooldown: 0,
  };
}

/**
 * Generates a standard 16-bit input bitmask for CPU fighters with off-stage recovery,
 * moving-stage awareness, wall-jump recovery, spacing, and kill-confirm smash checks.
 */
export function computeCpuInputMask(
  self: AiFighterView,
  target: AiFighterView,
  stage: StageManifest,
  difficulty: CpuDifficulty,
  mem: AiMemory,
  tick: number,
): number {
  if (self.isRespawning || self.hitstun > 0) {
    return 0;
  }

  if (mem.attackCooldown > 0) mem.attackCooldown--;
  if (mem.jumpPulseCooldown > 0) mem.jumpPulseCooldown--;

  let safeMinX = Infinity;
  let safeMaxX = -Infinity;
  let mainTopY = Infinity;
  for (const vol of stage.volumes) {
    if (!vol.passThrough && !vol.decorative) {
      const pose = computeVolumeState(vol, tick);
      if (!pose.solidActive) continue;
      safeMinX = Math.min(safeMinX, pose.x - vol.width * 0.5 + 10);
      safeMaxX = Math.max(safeMaxX, pose.x + vol.width * 0.5 - 10);
      mainTopY = Math.min(mainTopY, pose.topY);
    }
  }
  if (!Number.isFinite(safeMinX)) {
    safeMinX = -140;
    safeMaxX = 140;
    mainTopY = 48;
  }

  let mask = 0;

  if (self.wallClingDir !== 0 && mem.jumpPulseCooldown === 0) {
    mask |= INPUT_JUMP;
    mask |= self.x < 0 ? INPUT_RIGHT : INPUT_LEFT;
    mem.jumpPulseCooldown = 10;
    return mask;
  }

  const offLeft = self.x < safeMinX - 8;
  const offRight = self.x > safeMaxX + 8;
  const belowStage = self.y > mainTopY + 12;

  if (offLeft || offRight || belowStage) {
    if (self.x < 0) mask |= INPUT_RIGHT;
    else mask |= INPUT_LEFT;

    if (self.vy > 0.6 || self.y > mainTopY + 2) {
      if (self.jumpsLeft > 0 && mem.jumpPulseCooldown === 0) {
        mask |= INPUT_JUMP;
        mem.jumpPulseCooldown = 14;
      } else if (!self.upSpecialUsed && self.y > mainTopY - 4) {
        mask |= INPUT_UP | INPUT_SPECIAL;
      }
    }
    return mask;
  }

  const cadence = CADENCE_BY_DIFF[difficulty];
  if (mem.decisionCooldown > 0) {
    mem.decisionCooldown--;
    return mem.cachedMask & (INPUT_LEFT | INPUT_RIGHT | INPUT_SHIELD);
  }
  mem.decisionCooldown = cadence;

  const dx = target.x - self.x;
  const dy = target.y - self.y;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  if (absX > 22) {
    mask |= dx > 0 ? INPUT_RIGHT : INPUT_LEFT;
  } else if (absX < 10 && target.moveState !== null && difficulty !== 'easy') {
    mask |= INPUT_SHIELD;
  }

  if (dy < -24 && self.grounded && mem.jumpPulseCooldown === 0) {
    mask |= INPUT_JUMP;
    mem.jumpPulseCooldown = 18;
  } else if (dy > 28 && self.grounded && absX < 55) {
    mask |= INPUT_DOWN;
  }

  if (mem.attackCooldown === 0 && !target.isRespawning) {
    const aggression = AGGRESSION_BY_DIFF[difficulty];
    const pseudoRand = ((tick * 1103515245 + 12345) & 0x7fff) / 0x7fff;

    if (absX < 34 && absY < 26 && pseudoRand < aggression) {
      mask |= dx >= 0 ? INPUT_RIGHT : INPUT_LEFT;
      if (!self.grounded) {
        mask |= INPUT_ATTACK;
        mem.attackCooldown = difficulty === 'hard' ? 14 : 22;
      } else if (target.damagePct >= 75 && pseudoRand < aggression * 0.7) {
        mask |= INPUT_SMASH;
        mem.attackCooldown = difficulty === 'hard' ? 22 : 34;
      } else {
        mask |= INPUT_ATTACK;
        mem.attackCooldown = difficulty === 'hard' ? 12 : 22;
      }
    } else if (absX >= 58 && absX < 155 && absY < 28 && pseudoRand < aggression * 0.35) {
      // Neutral stick so it resolves to neutral-B (projectile), not side-B. Turn first if needed.
      if (self.facing === (dx >= 0 ? 1 : -1)) {
        mask &= ~(INPUT_LEFT | INPUT_RIGHT);
        mask |= INPUT_SPECIAL;
      }
      mem.attackCooldown = difficulty === 'hard' ? 32 : 52;
    }
  }

  mem.cachedMask = mask;
  return mask;
}
