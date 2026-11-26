import type { PlayerControlType } from '../types/protocol';
import type { SeatEvent } from './rollbackSession';
import type { SimSnapshot } from './rollbackState';

export type { SeatEvent };

/** Bumped whenever the wire format or the simulation changes in a way old builds can't follow. */
export const NET_PROTOCOL = 1;

/** One seat's input for one frame. Tuple keeps packets tiny: [seat, frame, mask]. */
export type InputItem = [seat: number, frame: number, mask: number];

/** Everything a peer needs to join a running match at `frame`. */
export interface SyncState {
  frame: number;
  snapshot: SimSnapshot;
  inputs: InputItem[];
  events: SeatEvent[];
}

/** Match setup every peer builds the same sim from. Fighters by id from the built-in roster. */
export interface NetMatchSetup {
  fighterIds: string[];
  paletteIndices: number[];
  controlTypes: PlayerControlType[];
  /** Display names per seat ('' for CPUs). */
  names: string[];
  stageId: string;
  stocks: number;
  cpuDifficulty: 'easy' | 'normal' | 'hard';
  /** Increments each rematch so stale packets from the previous match are ignored. */
  matchId: number;
}

export interface NetStart {
  localSeats: number[];
  inputDelay: number;
  isHost: boolean;
  matchId: number;
  sync?: SyncState;
}

export interface NetStats {
  frame: number;
  confirmed: number;
  rollbacks: number;
  rolledBackFrames: number;
  stalls: number;
}

// ── Wire packets (JSON over the WebRTC data channel) ──

export type GuestPacket =
  | { t: 'hello'; protocol: number; name: string; fighterId: string; paletteIndex: number }
  | { t: 'pick'; fighterId: string; paletteIndex: number }
  | { t: 'in'; m: number; items: InputItem[] }
  | { t: 'desync'; m: number; frame: number }
  | { t: 'bye' };

export type HostPacket =
  | { t: 'welcome'; seat: number; setup: NetMatchSetup; sync: SyncState; inputDelay: number }
  | { t: 'refuse'; reason: string }
  | { t: 'in'; m: number; items: InputItem[] }
  | { t: 'ev'; m: number; ev: SeatEvent; fills: InputItem[] }
  | { t: 'sum'; m: number; frame: number; hash: number }
  | { t: 'state'; m: number; sync: SyncState }
  | { t: 'start'; setup: NetMatchSetup; seat: number; inputDelay: number }
  | {
      t: 'roster';
      names: string[];
      controlTypes: PlayerControlType[];
      nextFighterIds?: string[];
      nextPaletteIndices?: number[];
    }
  | { t: 'bye'; reason: string };
