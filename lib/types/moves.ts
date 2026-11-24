/**
 * Universal move matrix (spec §4.1). Every fighter resolves to one MoveDef per slot.
 * Fighters only author what differs from the archetype-neutral templates in
 * `lib/roster/movesetBuilder.ts`; everything else is derived from their 5 core moves.
 */

export const GROUND_NORMAL_SLOTS = ['jab', 'dashAttack', 'ftilt', 'utilt', 'dtilt'] as const;
export const SMASH_SLOTS = ['fsmash', 'usmash', 'dsmash'] as const;
export const AERIAL_SLOTS = ['nair', 'fair', 'bair', 'uair', 'dair'] as const;
export const SPECIAL_SLOTS = ['neutralSpecial', 'sideSpecial', 'upSpecial', 'downSpecial'] as const;
export const GRAB_SLOTS = ['grab', 'pummel', 'fthrow', 'bthrow', 'uthrow', 'dthrow'] as const;

export const MOVE_SLOTS = [
  ...GROUND_NORMAL_SLOTS,
  ...SMASH_SLOTS,
  ...AERIAL_SLOTS,
  ...SPECIAL_SLOTS,
  ...GRAB_SLOTS,
] as const;

export type MoveSlot = (typeof MOVE_SLOTS)[number];
export type AerialSlot = (typeof AERIAL_SLOTS)[number];
export type ThrowSlot = 'fthrow' | 'bthrow' | 'uthrow' | 'dthrow';

export function isAerialSlot(slot: MoveSlot): slot is AerialSlot {
  return (AERIAL_SLOTS as readonly string[]).includes(slot);
}

export function isThrowSlot(slot: MoveSlot): slot is ThrowSlot {
  return slot === 'fthrow' || slot === 'bthrow' || slot === 'uthrow' || slot === 'dthrow';
}

/** Elemental flag (spec §2.1 `e`). Electric adds 1.5x hitstop. */
export type MoveElement = 'normal' | 'electric' | 'fire' | 'ice';

/**
 * One collision box of a move (spec §3.3). Lowest `id` wins when several overlap the
 * defender on the same frame, so author sweet-spots as id 0.
 * Any physics field left undefined falls back to the parent move's value.
 */
export interface HitboxSpec {
  id: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  damage?: number;
  baseKnockback?: number;
  knockbackGrowth?: number;
  launchAngleDeg?: number;
  /** Per-hitbox hitstop multiplier `h` (e.g. 1.25 sweet-spot, 0.7 sour-spot). */
  hitlagMult?: number;
  element?: MoveElement;
}
