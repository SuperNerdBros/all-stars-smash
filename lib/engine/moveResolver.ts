import {
  INPUT_CSTICK_DOWN,
  INPUT_CSTICK_LEFT,
  INPUT_CSTICK_RIGHT,
  INPUT_CSTICK_UP,
  INPUT_DOWN,
  INPUT_LEFT,
  INPUT_RIGHT,
  INPUT_UP,
} from '../types/protocol';
import type { MoveSlot } from '../types/moves';
import { SMASH_FLICK_WINDOW } from './inputBuffer';

/**
 * Stick + button → move slot, platform-fighter style:
 *
 *   GROUND  A            neutral → jab · held side → ftilt · held up → utilt · held down → dtilt
 *           flick + A    side → fsmash · up → usmash · down → dsmash   (flick = direction pressed ≤3f ago)
 *           SMASH btn / C-stick  → smash in that direction
 *           A while running      → dash attack
 *   AIR     A / SMASH / C-stick  neutral → nair · toward facing → fair · away → bair · up → uair · down → dair
 *   ANY     B            neutral → neutralSpecial · side → sideSpecial (turns) · up → upSpecial · down → downSpecial
 *   GROUND  GRAB / shield+A      → grab
 */

export type Dir = 'neutral' | 'forward' | 'back' | 'up' | 'down';

export interface ResolveContext {
  grounded: boolean;
  facing: 1 | -1;
  heldMask: number;
  /** Frames since LEFT/RIGHT/UP/DOWN were pressed (see BufferedInputState.dirPressAge). */
  dirPressAge: readonly [number, number, number, number];
  running: boolean;
  upSpecialUsed: boolean;
}

export type ButtonPress =
  | { kind: 'attack' }
  | { kind: 'smash' }
  | { kind: 'special' }
  | { kind: 'grab' }
  | { kind: 'cstick'; mask: number };

export interface ResolvedMove {
  slot: MoveSlot;
  /** If set, the fighter turns to this facing before the move starts. */
  turnTo?: 1 | -1;
}

interface StickRead {
  /** Horizontal component in world space: -1, 0, 1 */
  x: -1 | 0 | 1;
  /** Vertical: 1 = up, -1 = down, 0 = none */
  y: -1 | 0 | 1;
  /** Dominant axis after resolving diagonals by most-recent press. */
  dominant: 'x' | 'y' | null;
  /** Age (frames) of the dominant direction's press. */
  age: number;
}

function readStick(mask: number, age: readonly [number, number, number, number]): StickRead {
  const l = Boolean(mask & INPUT_LEFT);
  const r = Boolean(mask & INPUT_RIGHT);
  const u = Boolean(mask & INPUT_UP);
  const d = Boolean(mask & INPUT_DOWN);
  const x: -1 | 0 | 1 = l === r ? 0 : l ? -1 : 1;
  const y: -1 | 0 | 1 = u === d ? 0 : u ? 1 : -1;
  const xAge = x === 0 ? Infinity : x === -1 ? age[0] : age[1];
  const yAge = y === 0 ? Infinity : y === 1 ? age[2] : age[3];
  if (x === 0 && y === 0) return { x, y, dominant: null, age: Infinity };
  // Diagonal: the more recently pressed direction wins; ties favor vertical.
  const dominant = yAge <= xAge ? 'y' : 'x';
  return { x, y, dominant, age: dominant === 'y' ? yAge : xAge };
}

function stickToDir(s: StickRead, facing: 1 | -1): Dir {
  if (s.dominant === null) return 'neutral';
  if (s.dominant === 'y') return s.y === 1 ? 'up' : 'down';
  return s.x === facing ? 'forward' : 'back';
}

function cstickRead(mask: number): StickRead {
  const x: -1 | 0 | 1 = mask & INPUT_CSTICK_LEFT ? -1 : mask & INPUT_CSTICK_RIGHT ? 1 : 0;
  const y: -1 | 0 | 1 = mask & INPUT_CSTICK_UP ? 1 : mask & INPUT_CSTICK_DOWN ? -1 : 0;
  const dominant = y !== 0 ? 'y' : x !== 0 ? 'x' : null;
  return { x, y, dominant, age: 0 };
}

const AERIAL_BY_DIR: Record<Dir, MoveSlot> = {
  neutral: 'nair',
  forward: 'fair',
  back: 'bair',
  up: 'uair',
  down: 'dair',
};

function smashFor(s: StickRead, facing: 1 | -1): ResolvedMove {
  if (s.dominant === 'y') return { slot: s.y === 1 ? 'usmash' : 'dsmash' };
  if (s.dominant === 'x' && s.x !== facing) return { slot: 'fsmash', turnTo: s.x === -1 ? -1 : 1 };
  return { slot: 'fsmash' };
}

export function resolveMove(ctx: ResolveContext, press: ButtonPress): ResolvedMove | null {
  const stick = press.kind === 'cstick' ? cstickRead(press.mask) : readStick(ctx.heldMask, ctx.dirPressAge);
  const dir = stickToDir(stick, ctx.facing);

  if (press.kind === 'special') {
    const s = readStick(ctx.heldMask, ctx.dirPressAge);
    const d = stickToDir(s, ctx.facing);
    if (d === 'up') return ctx.upSpecialUsed ? null : { slot: 'upSpecial' };
    if (d === 'down') return { slot: 'downSpecial' };
    if (d === 'forward' || d === 'back') return { slot: 'sideSpecial', turnTo: s.x === -1 ? -1 : 1 };
    return { slot: 'neutralSpecial' };
  }

  if (!ctx.grounded) {
    if (press.kind === 'grab') return { slot: 'nair' };
    return { slot: AERIAL_BY_DIR[dir] };
  }

  if (press.kind === 'grab') return { slot: 'grab' };
  if (press.kind === 'smash' || press.kind === 'cstick') return smashFor(stick, ctx.facing);

  // press.kind === 'attack' on the ground
  const flicked = stick.age <= SMASH_FLICK_WINDOW;
  if (ctx.running && dir === 'forward' && !(flicked && stick.dominant === 'y')) {
    return { slot: 'dashAttack' };
  }
  if (flicked && dir !== 'neutral') return smashFor(stick, ctx.facing);
  if (dir === 'up') return { slot: 'utilt' };
  if (dir === 'down') return { slot: 'dtilt' };
  if (dir === 'forward' || dir === 'back') return { slot: 'ftilt', turnTo: stick.x === -1 ? -1 : 1 };
  return { slot: 'jab' };
}
