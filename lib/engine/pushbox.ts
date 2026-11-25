import { HURTBOX_HEIGHT, type FighterEntity, type SimulationState } from './combatTypes';

/** Minimum horizontal center-to-center distance between overlapping fighters. */
export const PUSHBOX_MIN_DIST = 14;
/** Maximum horizontal push applied to each fighter per 60Hz tick (smooth, zero jitter). */
const PUSHBOX_MAX_STEP = 2.6;
/** Vertical proximity threshold under which two fighters collide body-to-body. */
const PUSHBOX_VERT_SPAN = HURTBOX_HEIGHT * 0.85;

function canCollidePushbox(f: FighterEntity): boolean {
  return (
    f.stocks > 0 &&
    f.respawnTimer === 0 &&
    f.grabbedBySlot === null &&
    f.holdingSlot === null
  );
}

function resolvePushDirection(dx: number, slotA: number, slotB: number): 1 | -1 {
  const isCentered = dx === 0;
  if (isCentered) {
    return slotA < slotB ? 1 : -1;
  }
  return dx > 0 ? 1 : -1;
}

function dampenInwardVelocity(f: FighterEntity, inwardDir: 1 | -1): void {
  const movingInward = f.grounded && Math.sign(f.vx) === inwardDir;
  if (movingInward) {
    f.vx *= 0.55;
  }
}

function separatePair(a: FighterEntity, b: FighterEntity): void {
  const verticallyClear = Math.abs(a.y - b.y) >= PUSHBOX_VERT_SPAN;
  if (verticallyClear) return;

  const dx = b.x - a.x;
  const absDx = Math.abs(dx);
  const horizontallyClear = absDx >= PUSHBOX_MIN_DIST;
  if (horizontallyClear) return;

  const dir = resolvePushDirection(dx, a.slot, b.slot);
  const overlap = PUSHBOX_MIN_DIST - absDx;
  const push = Math.min(PUSHBOX_MAX_STEP, overlap * 0.48);

  a.x -= dir * push;
  b.x += dir * push;

  dampenInwardVelocity(a, dir);
  dampenInwardVelocity(b, dir === 1 ? -1 : 1);
}

/**
 * Resolves pairwise fighter-to-fighter body pushboxes so fighters cannot stack on top
 * of each other while brawling up close. Purely deterministic for rollback netcode.
 */
export function resolveFighterPushboxes(sim: SimulationState): void {
  const fighters = sim.fighters;
  const count = fighters.length;
  for (let i = 0; i < count; i++) {
    const a = fighters[i];
    if (!canCollidePushbox(a)) continue;
    for (let j = i + 1; j < count; j++) {
      const b = fighters[j];
      if (!canCollidePushbox(b)) continue;
      separatePair(a, b);
    }
  }
}
