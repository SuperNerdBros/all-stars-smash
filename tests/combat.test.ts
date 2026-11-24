import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyDirectionalInfluence,
  computeHitstop,
  computeKnockback,
  computeLaunchVector,
  decayLaunch,
  ENGINE_TUNING,
  pushStale,
  staleMultiplier,
} from '../lib/engine/combatFormulas';
import { resolveMove, type ResolveContext } from '../lib/engine/moveResolver';
import { buildFullMoveset, validateMoveset } from '../lib/roster/movesetBuilder';
import { BUILTIN_FIGHTERS } from '../lib/roster/registry';
import { STAGE_MANIFESTS } from '../lib/stages/manifests';
import { createSimulationState, stepSimulation, type SimulationState } from '../lib/engine/physics';
import {
  INPUT_ATTACK,
  INPUT_DOWN,
  INPUT_GRAB,
  INPUT_JUMP,
  INPUT_RIGHT,
  INPUT_UP,
} from '../lib/types/protocol';

// ── Formulas ────────────────────────────────────────────────────

test('knockback grows with percent and shrinks with weight', () => {
  const base = { damage: 10, growth: 100, base: 3, weight: 100 };
  assert.ok(computeKnockback({ ...base, percent: 120 }) > computeKnockback({ ...base, percent: 20 }));
  assert.ok(computeKnockback({ ...base, percent: 80, weight: 130 }) < computeKnockback({ ...base, percent: 80, weight: 80 }));
});

test('weight-independent moves ignore weight', () => {
  const m = { damage: 6, growth: 50, base: 4, percent: 60, weightIndependent: true };
  assert.equal(computeKnockback({ ...m, weight: 70 }), computeKnockback({ ...m, weight: 140 }));
});

test('rage and crouch cancel scale knockback', () => {
  const m = { damage: 10, growth: 100, base: 3, percent: 80, weight: 100 };
  const k = computeKnockback(m);
  assert.ok(computeKnockback({ ...m, attackerPercent: 150 }) > k * 1.09);
  assert.ok(Math.abs(computeKnockback({ ...m, crouching: true }) - k * 0.67) < 1e-9);
});

test('modern hitstop formula and multipliers', () => {
  assert.equal(computeHitstop({ damage: 10 }), 12); // floor(10*0.65+6)
  assert.equal(computeHitstop({ damage: 10, electric: true }), 18); // floor(12.5*1.5)
  assert.equal(computeHitstop({ damage: 10, hitlagMult: 1.25 }), 15);
  assert.equal(computeHitstop({ damage: 10, shielded: true }), 8);
  assert.equal(computeHitstop({ damage: 999 }), ENGINE_TUNING.maxHitstop);
});

test('classic hitstop formula', () => {
  assert.equal(computeHitstop({ damage: 12 }, 'classic'), 7); // floor(12/3+3)
  assert.equal(computeHitstop({ damage: 12, crouching: true }, 'classic'), 4);
});

test('stale queue: slots 1, 2 and 6 cost 22.6%; fresh moves get 1.05x', () => {
  const q = ['a', 'a', 'x', 'y', 'z', 'a', 'w'];
  assert.ok(Math.abs(staleMultiplier(q, 'a') - (1 - 0.226)) < 1e-3);
  assert.equal(staleMultiplier(q, 'never'), 1.05);
  const big: string[] = [];
  for (let i = 0; i < 20; i++) pushStale(big, `m${i}`);
  assert.equal(big.length, 9);
  assert.equal(big[0], 'm19');
});

test('DI rotates by the perpendicular component only', () => {
  assert.equal(applyDirectionalInfluence(45, 1, 1), 45); // parallel
  assert.ok(Math.abs(applyDirectionalInfluence(0, 0, 1) - ENGINE_TUNING.diMaxDeg) < 1e-9); // perpendicular up
  assert.ok(Math.abs(applyDirectionalInfluence(0, 0, -1) + ENGINE_TUNING.diMaxDeg) < 1e-9);
  assert.equal(applyDirectionalInfluence(30, 0, 0), 30);
});

test('balloon launch covers the same distance in less time', () => {
  const kb = 90;
  const v0 = kb * ENGINE_TUNING.launchSpeedPerKb;
  const expected = (v0 * v0) / (2 * ENGINE_TUNING.launchDecay);
  const lv = computeLaunchVector(kb, 0, 1, ENGINE_TUNING.gravityRef);
  const st = { kbVx: lv.vx, kbVy: lv.vy, kbDecay: lv.decay };
  let dist = 0;
  let frames = 0;
  while (st.kbVx !== 0 && frames < 1000) {
    dist += st.kbVx;
    decayLaunch(st);
    frames++;
  }
  assert.ok(Math.abs(dist - expected) / expected < 0.08, `dist ${dist} vs ${expected}`);
  assert.ok(frames < v0 / ENGINE_TUNING.launchDecay);
});

// ── Resolver ────────────────────────────────────────────────────

const OLD = 30;
function ctx(over: Partial<ResolveContext> = {}): ResolveContext {
  return {
    grounded: true,
    facing: 1,
    heldMask: 0,
    dirPressAge: [OLD, OLD, OLD, OLD],
    running: false,
    upSpecialUsed: false,
    ...over,
  };
}

test('ground A: neutral, tilts, and flick smashes', () => {
  assert.equal(resolveMove(ctx(), { kind: 'attack' })?.slot, 'jab');
  assert.equal(resolveMove(ctx({ heldMask: INPUT_RIGHT }), { kind: 'attack' })?.slot, 'ftilt');
  assert.equal(resolveMove(ctx({ heldMask: INPUT_UP }), { kind: 'attack' })?.slot, 'utilt');
  assert.equal(resolveMove(ctx({ heldMask: INPUT_DOWN }), { kind: 'attack' })?.slot, 'dtilt');
  assert.equal(resolveMove(ctx({ heldMask: INPUT_RIGHT, dirPressAge: [OLD, 1, OLD, OLD] }), { kind: 'attack' })?.slot, 'fsmash');
  assert.equal(resolveMove(ctx({ heldMask: INPUT_UP, dirPressAge: [OLD, OLD, 0, OLD] }), { kind: 'attack' })?.slot, 'usmash');
  assert.equal(resolveMove(ctx({ heldMask: INPUT_DOWN, dirPressAge: [OLD, OLD, OLD, 2] }), { kind: 'attack' })?.slot, 'dsmash');
  assert.equal(resolveMove(ctx({ heldMask: INPUT_RIGHT, running: true }), { kind: 'attack' })?.slot, 'dashAttack');
});

test('back flick turns around for fsmash', () => {
  const r = resolveMove(ctx({ heldMask: 1 /* LEFT */, dirPressAge: [0, OLD, OLD, OLD] }), { kind: 'attack' });
  assert.deepEqual(r, { slot: 'fsmash', turnTo: -1 });
});

test('aerials resolve relative to facing', () => {
  const air = { grounded: false };
  assert.equal(resolveMove(ctx(air), { kind: 'attack' })?.slot, 'nair');
  assert.equal(resolveMove(ctx({ ...air, heldMask: INPUT_RIGHT }), { kind: 'attack' })?.slot, 'fair');
  assert.equal(resolveMove(ctx({ ...air, facing: -1, heldMask: INPUT_RIGHT }), { kind: 'attack' })?.slot, 'bair');
  assert.equal(resolveMove(ctx({ ...air, heldMask: INPUT_UP }), { kind: 'attack' })?.slot, 'uair');
  assert.equal(resolveMove(ctx({ ...air, heldMask: INPUT_DOWN }), { kind: 'smash' })?.slot, 'dair');
  assert.equal(resolveMove(ctx(air), { kind: 'cstick', mask: 1 << 12 /* C-down */ })?.slot, 'dair');
});

test('specials and grab', () => {
  assert.equal(resolveMove(ctx(), { kind: 'special' })?.slot, 'neutralSpecial');
  assert.equal(resolveMove(ctx({ heldMask: INPUT_UP }), { kind: 'special' })?.slot, 'upSpecial');
  assert.equal(resolveMove(ctx({ heldMask: INPUT_UP, upSpecialUsed: true }), { kind: 'special' }), null);
  assert.equal(resolveMove(ctx({ heldMask: INPUT_DOWN }), { kind: 'special' })?.slot, 'downSpecial');
  assert.deepEqual(resolveMove(ctx({ heldMask: 1 }), { kind: 'special' }), { slot: 'sideSpecial', turnTo: -1 });
  assert.equal(resolveMove(ctx(), { kind: 'grab' })?.slot, 'grab');
});

// ── Roster data ─────────────────────────────────────────────────

test('every built-in fighter derives a valid 23-slot moveset', () => {
  for (const bp of BUILTIN_FIGHTERS) {
    const issues = validateMoveset(buildFullMoveset(bp));
    assert.deepEqual(issues, [], `${bp.id}: ${JSON.stringify(issues)}`);
  }
});

test('per-slot overrides merge over the template', () => {
  const bp = { ...BUILTIN_FIGHTERS[0], moves: { utilt: { damage: 42, hitbox: { width: 30 } } } };
  const m = buildFullMoveset(bp);
  assert.equal(m.utilt.damage, 42);
  assert.equal(m.utilt.hitbox.width, 30);
  assert.equal(m.utilt.hitbox.offsetY, -24);
});

// ── Simulation ──────────────────────────────────────────────────

function makeSim(): SimulationState {
  const bp = BUILTIN_FIGHTERS[0];
  const sim = createSimulationState([bp, bp], [0, 1], ['human', 'human'], 'normal', STAGE_MANIFESTS[0], 3);
  for (const f of sim.fighters) f.invulnTimer = 0;
  return sim;
}

function settle(sim: SimulationState, frames = 90): void {
  for (let i = 0; i < frames; i++) stepSimulation(sim, 0, 0);
}

test('fighters land and stand on the stage', () => {
  const sim = makeSim();
  settle(sim);
  assert.ok(sim.fighters[0].grounded && sim.fighters[1].grounded);
});

test('flick + A in sim starts fsmash; held direction + A starts ftilt', () => {
  const sim = makeSim();
  settle(sim);
  stepSimulation(sim, INPUT_RIGHT | INPUT_ATTACK, 0);
  assert.equal(sim.fighters[0].moveKey, 'fsmash');

  const sim2 = makeSim();
  settle(sim2);
  for (let i = 0; i < 8; i++) stepSimulation(sim2, INPUT_RIGHT, 0);
  stepSimulation(sim2, INPUT_RIGHT | INPUT_ATTACK, 0);
  const k = sim2.fighters[0].moveKey;
  assert.ok(k === 'ftilt' || k === 'dashAttack', `got ${k}`);
});

test('short hop vs full hop', () => {
  const peak = (holdFrames: number) => {
    const sim = makeSim();
    settle(sim);
    const f = sim.fighters[0];
    const y0 = f.y;
    let minY = y0;
    for (let i = 0; i < 60; i++) {
      stepSimulation(sim, i < holdFrames ? INPUT_JUMP : 0, 0);
      minY = Math.min(minY, f.y);
    }
    return y0 - minY;
  };
  assert.ok(peak(20) > peak(1) * 1.5);
});

test('grab → up throw launches and stales', () => {
  const sim = makeSim();
  settle(sim);
  const [a, b] = sim.fighters;
  b.x = a.x + 14;
  a.facing = 1;
  stepSimulation(sim, INPUT_GRAB, 0);
  for (let i = 0; i < 12 && a.holdingSlot === null; i++) stepSimulation(sim, 0, 0);
  assert.equal(a.holdingSlot, 1, 'grab connected');
  stepSimulation(sim, INPUT_UP, 0);
  for (let i = 0; i < 40; i++) stepSimulation(sim, 0, 0);
  assert.equal(a.holdingSlot, null);
  assert.ok(b.damagePct > 0);
  assert.ok(b.y < a.y - 10, 'thrown upward');
  assert.equal(a.staleQueue[0], 'uthrow');
});
