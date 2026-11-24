import type { FighterBlueprint, GraphicsEra } from './fighter';
import type { StageManifest } from './stage';

/** 16-bit input bitmask constants shared across main thread and worker */
export const INPUT_LEFT = 1 << 0;
export const INPUT_RIGHT = 1 << 1;
export const INPUT_UP = 1 << 2;
export const INPUT_DOWN = 1 << 3;
export const INPUT_JUMP = 1 << 4;
export const INPUT_ATTACK = 1 << 5;
export const INPUT_SMASH = 1 << 6;
export const INPUT_SPECIAL = 1 << 7;
export const INPUT_SHIELD = 1 << 8;
/** Right analog stick ("C-stick"): smash attack on the ground, aerial in the air. */
export const INPUT_CSTICK_LEFT = 1 << 9;
export const INPUT_CSTICK_RIGHT = 1 << 10;
export const INPUT_CSTICK_UP = 1 << 11;
export const INPUT_CSTICK_DOWN = 1 << 12;
export const INPUT_GRAB = 1 << 13;
export const INPUT_CSTICK_ANY = INPUT_CSTICK_LEFT | INPUT_CSTICK_RIGHT | INPUT_CSTICK_UP | INPUT_CSTICK_DOWN;

export type CameraPreset =
  | 'SIDE_25D'
  | 'ISOMETRIC'
  | 'TOP_DOWN'
  | 'THIRD_PERSON';

export type CpuDifficulty = 'easy' | 'normal' | 'hard';

export type PlayerControlType = 'human' | 'cpu';

export interface PlayerSlotConfig {
  fighterId: string;
  paletteIndex: number;
  controlType: PlayerControlType;
  cpuDifficulty: CpuDifficulty;
}

export interface MatchConfig {
  players: [PlayerSlotConfig, PlayerSlotConfig];
  stageId: string;
  stocks: number;
  graphicsEra: GraphicsEra;
}

export type SfxEvent =
  | 'jump'
  | 'doubleJump'
  | 'tripleJump'
  | 'wallJump'
  | 'hitLight'
  | 'hitHeavy'
  | 'shoot'
  | 'shield'
  | 'ko'
  | 'victory';

export interface HudFighterSnapshot {
  slot: 0 | 1;
  fighterId: string;
  name: string;
  paletteIndex: number;
  damagePct: number;
  stocks: number;
  maxStocks: number;
  shieldHp: number;
  isInvulnerable: boolean;
  isRespawning: boolean;
  damageDealt: number;
  kosScored: number;
}

export interface HudSnapshot {
  fighters: [HudFighterSnapshot, HudFighterSnapshot];
  cameraPreset: CameraPreset;
  graphicsEra: GraphicsEra;
  hitboxesVisible: boolean;
  paused: boolean;
  matchTimeTicks: number;
  winnerSlot: 0 | 1 | null;
  sfxQueue: SfxEvent[];
}

export type WorkerInMessage =
  | {
      type: 'INIT_CANVAS';
      canvas: OffscreenCanvas;
      viewportWidth: number;
      viewportHeight: number;
    }
  | {
      type: 'START_MATCH';
      fighters: [FighterBlueprint, FighterBlueprint];
      paletteIndices: [number, number];
      controlTypes: [PlayerControlType, PlayerControlType];
      cpuDifficulty: CpuDifficulty;
      stage: StageManifest;
      stocks: number;
      graphicsEra: GraphicsEra;
    }
  | {
      type: 'INPUT_STATE';
      p1Mask: number;
      p2Mask: number;
    }
  | {
      type: 'SET_CAMERA';
      preset: CameraPreset;
    }
  | {
      type: 'SET_ERA';
      era: GraphicsEra;
    }
  | {
      type: 'TOGGLE_HITBOX';
      visible?: boolean;
    }
  | {
      type: 'SET_PAUSED';
      paused: boolean;
    }
  | {
      type: 'HOT_RELOAD_FIGHTER';
      fighter: FighterBlueprint;
    }
  | {
      type: 'RESIZE';
      viewportWidth: number;
      viewportHeight: number;
    }
  | {
      type: 'STOP';
    };

export type WorkerOutMessage =
  | {
      type: 'READY';
    }
  | {
      type: 'HUD_SNAPSHOT';
      snapshot: HudSnapshot;
    }
  | {
      type: 'ERROR';
      message: string;
    };
