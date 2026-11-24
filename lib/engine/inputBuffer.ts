import {
  INPUT_ATTACK,
  INPUT_JUMP,
  INPUT_SMASH,
  INPUT_SPECIAL,
} from '../types/protocol';

const BUFFER_FRAMES = 5;

export interface BufferedInputState {
  prevMask: number;
  heldMask: number;
  justPressedMask: number;
  justReleasedMask: number;
  jumpBuffer: number;
  attackBuffer: number;
  smashBuffer: number;
  specialBuffer: number;
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
  };
}

/**
 * Advances worker-side input edge detection and 5-frame action buffer on every 60Hz tick.
 */
export function updateInputBuffer(buf: BufferedInputState, nextMask: number): void {
  buf.prevMask = buf.heldMask;
  buf.heldMask = nextMask;
  buf.justPressedMask = nextMask & ~buf.prevMask;
  buf.justReleasedMask = buf.prevMask & ~nextMask;

  if (buf.justPressedMask & INPUT_JUMP) {
    buf.jumpBuffer = BUFFER_FRAMES;
  } else if (buf.jumpBuffer > 0) {
    buf.jumpBuffer--;
  }

  if (buf.justPressedMask & INPUT_ATTACK) {
    buf.attackBuffer = BUFFER_FRAMES;
  } else if (buf.attackBuffer > 0) {
    buf.attackBuffer--;
  }

  if (buf.justPressedMask & INPUT_SMASH) {
    buf.smashBuffer = BUFFER_FRAMES;
  } else if (buf.smashBuffer > 0) {
    buf.smashBuffer--;
  }

  if (buf.justPressedMask & INPUT_SPECIAL) {
    buf.specialBuffer = BUFFER_FRAMES;
  } else if (buf.specialBuffer > 0) {
    buf.specialBuffer--;
  }
}

export function consumeBufferedAction(
  buf: BufferedInputState,
  flag: number,
): boolean {
  if (flag === INPUT_JUMP && buf.jumpBuffer > 0) {
    buf.jumpBuffer = 0;
    return true;
  }
  if (flag === INPUT_ATTACK && buf.attackBuffer > 0) {
    buf.attackBuffer = 0;
    return true;
  }
  if (flag === INPUT_SMASH && buf.smashBuffer > 0) {
    buf.smashBuffer = 0;
    return true;
  }
  if (flag === INPUT_SPECIAL && buf.specialBuffer > 0) {
    buf.specialBuffer = 0;
    return true;
  }
  return false;
}
