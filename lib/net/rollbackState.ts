import type { FighterEntity, SimulationState } from '../engine/combatTypes';

/**
 * Save/restore of everything gameplay-relevant in a SimulationState, for rollback netcode.
 * Blueprints, derived movesets and the stage are immutable references and are not copied;
 * particles are cosmetic and stay local.
 */

type FighterSnap = Omit<FighterEntity, 'blueprint' | 'moves'>;

export interface SimSnapshot {
  fighters: FighterSnap[];
  projectiles: SimulationState['projectiles'];
  hitstopTimer: number;
  hitstopVictims: number[];
  matchTimeTicks: number;
  winnerSlot: number | null;
  nextProjId: number;
}

function snapFighter(f: FighterEntity): FighterSnap {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { blueprint, moves, ...rest } = f;
  return {
    ...rest,
    input: { ...rest.input, dirPressAge: [...rest.input.dirPressAge] as FighterSnap['input']['dirPressAge'] },
    ai: { ...rest.ai },
    staleQueue: [...rest.staleQueue],
    pendingLaunch: rest.pendingLaunch ? { ...rest.pendingLaunch } : null,
  };
}

export function saveState(sim: SimulationState): SimSnapshot {
  return {
    fighters: sim.fighters.map(snapFighter),
    projectiles: sim.projectiles.map((p) => ({ ...p })),
    hitstopTimer: sim.hitstopTimer,
    hitstopVictims: [...sim.hitstopVictims],
    matchTimeTicks: sim.matchTimeTicks,
    winnerSlot: sim.winnerSlot,
    nextProjId: sim.nextProjId,
  };
}

/** Restores in place, keeping each fighter's blueprint and moveset references. */
export function loadState(sim: SimulationState, snap: SimSnapshot): void {
  for (let i = 0; i < snap.fighters.length; i++) {
    const f = sim.fighters[i];
    const s = snapFighter(snap.fighters[i] as FighterEntity);
    Object.assign(f, s);
  }
  sim.projectiles = snap.projectiles.map((p) => ({ ...p }));
  sim.hitstopTimer = snap.hitstopTimer;
  sim.hitstopVictims = [...snap.hitstopVictims];
  sim.matchTimeTicks = snap.matchTimeTicks;
  sim.winnerSlot = snap.winnerSlot;
  sim.nextProjId = snap.nextProjId;
}

/** Re-runs: cosmetic side effects (sfx, shake, KO zoom) must not repeat during rollback. */
export function clearSideEffects(sim: SimulationState): void {
  sim.pendingSfx.length = 0;
  sim.pendingShake = 0;
  sim.pendingKo = null;
}

/**
 * 32-bit FNV-1a over the state peers must agree on. Positions are quantized to 1/16 px so
 * sub-ulp float noise never reads as a desync, while any real divergence does.
 */
export function checksum(sim: SimulationState): number {
  let h = 0x811c9dc5;
  const mix = (n: number) => {
    h ^= n & 0xffff;
    h = Math.imul(h, 0x01000193);
    h ^= (n >>> 16) & 0xffff;
    h = Math.imul(h, 0x01000193);
  };
  const q = (v: number) => Math.round(v * 16) | 0;
  mix(sim.matchTimeTicks);
  for (const f of sim.fighters) {
    mix(q(f.x)); mix(q(f.y)); mix(q(f.vx + f.kbVx)); mix(q(f.vy + f.kbVy));
    mix(q(f.damagePct)); mix(f.stocks); mix(f.hitstun); mix(f.moveTick);
    mix(f.moveKey ? f.moveKey.length * 31 + f.moveKey.charCodeAt(0) : 0);
    mix(f.facing); mix(f.respawnTimer); mix(f.holdingSlot ?? -1);
  }
  for (const p of sim.projectiles) {
    mix(q(p.x)); mix(q(p.y)); mix(p.ownerSlot);
  }
  return h >>> 0;
}
