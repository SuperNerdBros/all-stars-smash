import type { FighterBlueprint, GraphicsEra } from './fighter';
import type { StageManifest } from './stage';
import type { InputItem, NetStart, NetStats, SeatEvent, SyncState } from '../net/netTypes';

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

/** Most fighters in one match (and seats in one online room). */
export { MAX_FIGHTERS, MIN_FIGHTERS } from './seats';

export type PlayerControlType = 'human' | 'cpu';

export interface PlayerSlotConfig {
  fighterId: string;
  paletteIndex: number;
  controlType: PlayerControlType;
  cpuDifficulty: CpuDifficulty;
}

export interface MatchConfig {
  /** One entry per seat, 2..MAX_FIGHTERS. Seats 0 and 1 are the local P1/P2 keyboards. */
  players: PlayerSlotConfig[];
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
  slot: number;
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
  fighters: HudFighterSnapshot[];
  cameraPreset: CameraPreset;
  graphicsEra: GraphicsEra;
  hitboxesVisible: boolean;
  paused: boolean;
  matchTimeTicks: number;
  winnerSlot: number | null;
  /** Online matches only. */
  net?: NetStats;
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
      fighters: FighterBlueprint[];
      paletteIndices: number[];
      controlTypes: PlayerControlType[];
      cpuDifficulty: CpuDifficulty;
      stage: StageManifest;
      stocks: number;
      graphicsEra: GraphicsEra;
      /** Present for online matches: runs the rollback session instead of plain local stepping. */
      net?: NetStart;
    }
  | { type: 'NET_INPUTS'; matchId: number; items: InputItem[] }
  | { type: 'NET_EVENT'; matchId: number; ev: SeatEvent; fills: InputItem[] }
  | { type: 'NET_CHECK'; matchId: number; frame: number; hash: number }
  | { type: 'NET_RESYNC'; matchId: number; sync: SyncState }
  | { type: 'NET_SYNC_REQUEST'; reqId: number }
  | { type: 'NET_SCHEDULE_SEAT'; reqId: number; seat: number; controlType: PlayerControlType; lead: number; eliminate?: boolean }
  | {
      type: 'INPUT_STATE';
      /** Input mask per seat; CPU seats ignore theirs. */
      masks: number[];
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
    }
  | { type: 'NET_LOCAL'; matchId: number; items: InputItem[] }
  | { type: 'NET_SUM'; matchId: number; frame: number; hash: number }
  | { type: 'NET_DESYNC'; matchId: number; frame: number }
  | { type: 'NET_SYNC'; reqId: number; sync: SyncState | null }
  | { type: 'NET_SEAT_SCHEDULED'; reqId: number; ev: SeatEvent; fills: InputItem[] };
