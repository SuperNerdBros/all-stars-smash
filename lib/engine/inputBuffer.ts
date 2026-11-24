import {
  INPUT_ATTACK,
  INPUT_CSTICK_ANY,
  INPUT_DOWN,
  INPUT_GRAB,
  INPUT_JUMP,
  INPUT_LEFT,
  INPUT_RIGHT,
  INPUT_SMASH,
  INPUT_SPECIAL,
  INPUT_UP,
} from '../types/protocol';

const BUFFER_FRAMES = 5;
/** Frames since a direction was pressed for it to count as a "flick" (smash input). */
export const SMASH_FLICK_WINDOW = 3;
const AGE_CAP = 255;

export const DIRECTION_BITS = [INPUT_LEFT, INPUT_RIGHT, INPUT_UP, INPUT_DOWN] as const;

export interface BufferedInputState {
  prevMask: number;
  heldMask: number;
  justPressedMask: number;
  justReleasedMask: number;
  jumpBuffer: number;
  attackBuffer: number;
  smashBuffer: number;
  specialBuffer: number;
  grabBuffer: number;
  /** Bitmask of C-stick directions pressed within the buffer window. */
  cstickBufferMask: number;
  cstickBuffer: number;
  /** Frames since each of LEFT/RIGHT/UP/DOWN was last freshly pressed (index = DIRECTION_BITS). */
  dirPressAge: [number, number, number, number];
  /** Frames DOWN has been continuously held. */
  downHeldFrames: number;
}

export function createInputBuffer(): BufferedInputState {
  return {
    prevMask: 0,
    heldMask: 0,
    justPressedMask: 0,
    justReleasedMask: 0,
    jumpBuffer: 0,
    attackBuffer: 0,
    smashBuffer: 0,
    specialBuffer: 0,
    grabBuffer: 0,
    cstickBufferMask: 0,
    cstickBuffer: 0,
    dirPressAge: [AGE_CAP, AGE_CAP, AGE_CAP, AGE_CAP],
    downHeldFrames: 0,
  };
}

function tickBuffer(pressed: boolean, current: number, frozen: boolean): number {
  if (pressed) return BUFFER_FRAMES;
  if (frozen) return current;
  return current > 0 ? current - 1 : 0;
}

/**
 * Advances worker-side input edge detection and 5-frame action buffer on every 60Hz tick.
 * With `frozen` (hitstop), presses are still recorded but buffers and press ages don't age,
 * so inputs made during hitlag come out on the first free frame.
 */
export function updateInputBuffer(buf: BufferedInputState, nextMask: number, frozen = false): void {
  buf.prevMask = buf.heldMask;
  buf.heldMask = nextMask;
  buf.justPressedMask = nextMask & ~buf.prevMask;
  buf.justReleasedMask = buf.prevMask & ~nextMask;
  const jp = buf.justPressedMask;

  buf.jumpBuffer = tickBuffer(Boolean(jp & INPUT_JUMP), buf.jumpBuffer, frozen);
  buf.attackBuffer = tickBuffer(Boolean(jp & INPUT_ATTACK), buf.attackBuffer, frozen);
  buf.smashBuffer = tickBuffer(Boolean(jp & INPUT_SMASH), buf.smashBuffer, frozen);
  buf.specialBuffer = tickBuffer(Boolean(jp & INPUT_SPECIAL), buf.specialBuffer, frozen);
  buf.grabBuffer = tickBuffer(Boolean(jp & INPUT_GRAB), buf.grabBuffer, frozen);

  if (jp & INPUT_CSTICK_ANY) {
    buf.cstickBufferMask = jp & INPUT_CSTICK_ANY;
    buf.cstickBuffer = BUFFER_FRAMES;
  } else if (buf.cstickBuffer > 0 && !frozen) {
    buf.cstickBuffer--;
    if (buf.cstickBuffer === 0) buf.cstickBufferMask = 0;
  }

  for (let i = 0; i < 4; i++) {
    if (jp & DIRECTION_BITS[i]) buf.dirPressAge[i] = 0;
    else if (!frozen) buf.dirPressAge[i] = Math.min(AGE_CAP, buf.dirPressAge[i] + 1);
  }
  buf.downHeldFrames = nextMask & INPUT_DOWN ? buf.downHeldFrames + 1 : 0;
}

export function consumeBufferedAction(buf: BufferedInputState, flag: number): boolean {
  const take = (key: 'jumpBuffer' | 'attackBuffer' | 'smashBuffer' | 'specialBuffer' | 'grabBuffer') => {
    if (buf[key] > 0) {
      buf[key] = 0;
      return true;
    }
    return false;
  };
  if (flag === INPUT_JUMP) return take('jumpBuffer');
  if (flag === INPUT_ATTACK) return take('attackBuffer');
  if (flag === INPUT_SMASH) return take('smashBuffer');
  if (flag === INPUT_SPECIAL) return take('specialBuffer');
  if (flag === INPUT_GRAB) return take('grabBuffer');
  return false;
}

/** Returns and clears the buffered C-stick direction mask (0 if none). */
export function consumeCStick(buf: BufferedInputState): number {
  if (buf.cstickBuffer === 0) return 0;
  const m = buf.cstickBufferMask;
  buf.cstickBuffer = 0;
  buf.cstickBufferMask = 0;
  return m;
}

export function peekBuffered(buf: BufferedInputState, flag: number): boolean {
  if (flag === INPUT_JUMP) return buf.jumpBuffer > 0;
  if (flag === INPUT_ATTACK) return buf.attackBuffer > 0;
  if (flag === INPUT_SMASH) return buf.smashBuffer > 0;
  if (flag === INPUT_SPECIAL) return buf.specialBuffer > 0;
  if (flag === INPUT_GRAB) return buf.grabBuffer > 0;
  return false;
}

/** Directions held now, or freshly pressed within the buffer window. */
export function recentDirectionMask(buf: BufferedInputState): number {
  let m = buf.heldMask & (INPUT_LEFT | INPUT_RIGHT | INPUT_UP | INPUT_DOWN);
  for (let i = 0; i < 4; i++) if (buf.dirPressAge[i] < BUFFER_FRAMES) m |= DIRECTION_BITS[i];
  return m;
}
