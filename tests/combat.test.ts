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
import { WWW_FIGHTERS } from '../lib/roster/www/wwwFighters';
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

test('built-in roster has the 50 legacy fighters plus the Www cast, all valid', () => {
  assert.equal(BUILTIN_FIGHTERS.length, 50 + WWW_FIGHTERS.length);
  const ids = new Set<string>();
  for (const bp of BUILTIN_FIGHTERS) {
    assert.equal(ids.has(bp.id), false, `duplicate fighter id: ${bp.id}`);
    ids.add(bp.id);
    assert.ok(bp.palettes.length >= 4, `${bp.id}: expected at least 4 palettes`);
    for (const pal of bp.palettes) {
      assert.equal(pal.colors.length, 16, `${bp.id} palette ${pal.name}: expected 16 colors`);
      assert.equal(pal.colors[0], '', `${bp.id} palette ${pal.name}: index 0 must be transparent`);
    }
    const checkChart = (label: string, chart: typeof bp.pixelChart) => {
      for (const [state, clip] of Object.entries(chart)) {
        assert.ok(clip.frames.length > 0, `${bp.id} ${label}.${state}: empty frames`);
        for (const frame of clip.frames) {
          assert.ok(frame.length > 0, `${bp.id} ${label}.${state}: empty height`);
          const w = frame[0].length;
          assert.ok(w > 0, `${bp.id} ${label}.${state}: empty width`);
          for (const row of frame) {
            assert.equal(row.length, w, `${bp.id} ${label}.${state}: non-rectangular row`);
          }
        }
      }
    };
    checkChart('pixelChart', bp.pixelChart);
    if (bp.eraPacks) {
      checkChart('NES', bp.eraPacks.NES.pixelChart);
      checkChart('SNES_SEGA', bp.eraPacks.SNES_SEGA.pixelChart);
    }
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
  const sim = createSimulationState(
    [0, 1].map((i) => ({ blueprint: bp, paletteIndex: i, controlType: 'human' as const })),
    'normal',
    STAGE_MANIFESTS[0],
    3,
  );
  for (const f of sim.fighters) f.invulnTimer = 0;
  return sim;
}

function settle(sim: SimulationState, frames = 90): void {
  for (let i = 0; i < frames; i++) stepSimulation(sim, [0, 0]);
}

test('fighters land and stand on the stage', () => {
  const sim = makeSim();
  settle(sim);
  assert.ok(sim.fighters[0].grounded && sim.fighters[1].grounded);
});

test('flick + A in sim starts fsmash; held direction + A starts ftilt', () => {
  const sim = makeSim();
  settle(sim);
  stepSimulation(sim, [INPUT_RIGHT | INPUT_ATTACK, 0]);
  assert.equal(sim.fighters[0].moveKey, 'fsmash');

  const sim2 = makeSim();
  settle(sim2);
  for (let i = 0; i < 8; i++) stepSimulation(sim2, [INPUT_RIGHT, 0]);
  stepSimulation(sim2, [INPUT_RIGHT | INPUT_ATTACK, 0]);
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
      stepSimulation(sim, [i < holdFrames ? INPUT_JUMP : 0, 0]);
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
  stepSimulation(sim, [INPUT_GRAB, 0]);
  for (let i = 0; i < 12 && a.holdingSlot === null; i++) stepSimulation(sim, [0, 0]);
  assert.equal(a.holdingSlot, 1, 'grab connected');
  stepSimulation(sim, [INPUT_UP, 0]);
  for (let i = 0; i < 40; i++) stepSimulation(sim, [0, 0]);
  assert.equal(a.holdingSlot, null);
  assert.ok(b.damagePct > 0);
  assert.ok(b.y < a.y - 10, 'thrown upward');
  assert.equal(a.staleQueue[0], 'uthrow');
});

test('8-fighter free-for-all runs to a single winner', () => {
  const specs = Array.from({ length: 8 }, (_, i) => ({
    blueprint: BUILTIN_FIGHTERS[i % BUILTIN_FIGHTERS.length],
    paletteIndex: 0,
    controlType: 'cpu' as const,
  }));
  const sim = createSimulationState(specs, 'hard', STAGE_MANIFESTS[0], 1);
  const xs = new Set(sim.fighters.map((f) => Math.round(f.x)));
  assert.equal(xs.size, 8, 'distinct spawn points');
  let t = 0;
  for (; t < 60 * 60 * 6 && sim.winnerSlot === null; t++) {
    stepSimulation(sim, []);
    sim.pendingSfx.length = 0;
  }
  assert.notEqual(sim.winnerSlot, null, 'match ended');
  assert.equal(sim.fighters.filter((f) => f.stocks > 0).length, 1);
  const kos = sim.fighters.reduce((n, f) => n + f.kosScored, 0);
  assert.ok(kos >= 1, 'KOs credited');
});

// ── Determinism & rollback ──────────────────────────────────────

import { checksum, clearSideEffects, loadState, saveState } from '../lib/net/rollbackState';

function scriptedMask(slot: number, t: number): number {
  // Cheap deterministic "player": cycles through moves and movement.
  const seq = [INPUT_RIGHT, INPUT_RIGHT | INPUT_ATTACK, 0, INPUT_JUMP, INPUT_DOWN | INPUT_ATTACK, INPUT_UP | INPUT_ATTACK, 1, INPUT_GRAB];
  return seq[(Math.floor(t / 7) + slot * 3) % seq.length];
}

function fourWay(): SimulationState {
  const specs = [0, 1, 2, 3].map((i) => ({
    blueprint: BUILTIN_FIGHTERS[i * 3],
    paletteIndex: 0,
    controlType: (i < 2 ? 'human' : 'cpu') as 'human' | 'cpu',
  }));
  return createSimulationState(specs, 'hard', STAGE_MANIFESTS[1], 3);
}

test('identical inputs give identical state (lockstep-safe)', () => {
  const a = fourWay();
  const b = fourWay();
  for (let t = 0; t < 3000; t++) {
    const masks = [scriptedMask(0, t), scriptedMask(1, t)];
    stepSimulation(a, masks);
    stepSimulation(b, masks);
    if (t % 100 === 0) assert.equal(checksum(a), checksum(b), `diverged at ${t}`);
  }
  assert.equal(checksum(a), checksum(b));
});

test('save → advance → load → replay reproduces the same frames', () => {
  const sim = fourWay();
  for (let t = 0; t < 600; t++) stepSimulation(sim, [scriptedMask(0, t), scriptedMask(1, t)]);
  const snap = saveState(sim);
  const forward: number[] = [];
  for (let t = 600; t < 660; t++) {
    stepSimulation(sim, [scriptedMask(0, t), scriptedMask(1, t)]);
    forward.push(checksum(sim));
  }
  loadState(sim, snap);
  clearSideEffects(sim);
  for (let t = 600; t < 660; t++) {
    stepSimulation(sim, [scriptedMask(0, t), scriptedMask(1, t)]);
    assert.equal(checksum(sim), forward[t - 600], `replay frame ${t}`);
  }
});

test('snapshot survives JSON (host → guest resync)', () => {
  const sim = fourWay();
  for (let t = 0; t < 400; t++) stepSimulation(sim, [scriptedMask(0, t), scriptedMask(1, t)]);
  const wire = JSON.parse(JSON.stringify(saveState(sim)));
  const other = fourWay();
  loadState(other, wire);
  assert.equal(checksum(other), checksum(sim));
  for (let t = 400; t < 700; t++) {
    const m = [scriptedMask(0, t), scriptedMask(1, t)];
    stepSimulation(sim, m);
    stepSimulation(other, m);
  }
  assert.equal(checksum(other), checksum(sim));
});

// ── Rollback session over a fake laggy network ──────────────────

import { RollbackSession } from '../lib/net/rollbackSession';

function sixSeatSim(): SimulationState {
  // seats 0,1,2 human (one per peer), 3..5 CPU
  const specs = [0, 1, 2, 3, 4, 5].map((i) => ({
    blueprint: BUILTIN_FIGHTERS[(i * 4) % BUILTIN_FIGHTERS.length],
    paletteIndex: 0,
    controlType: (i < 3 ? 'human' : 'cpu') as 'human' | 'cpu',
  }));
  return createSimulationState(specs, 'normal', STAGE_MANIFESTS[0], 4);
}

test('3 peers with 3-9 frame jittery lag stay in sync (rollback + seat event)', () => {
  const peers = [0, 1, 2].map((seat) => new RollbackSession(sixSeatSim(), { localSeats: [seat], inputDelay: 2, maxRollback: 10 }));
  // In-flight packets: deliver at tick `at`.
  const wire: { at: number; to: number; seat: number; frame: number; mask: number }[] = [];
  let rng = 12345;
  const rand = () => ((rng = (rng * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const event = { frame: 700, seat: 3, controlType: 'human' as const };

  for (let tick = 0; tick < 2400; tick++) {
    for (const [i, p] of peers.entries()) {
      // deliver arrived packets
      for (let k = wire.length - 1; k >= 0; k--) {
        const pk = wire[k];
        if (pk.to === i && pk.at <= tick) {
          p.addRemoteInput(pk.seat, pk.frame, pk.mask);
          wire.splice(k, 1);
        }
      }
      if (tick === 690) p.addEvent(event); // host announces; everyone applies at frame 700
      if (p.canAdvance() || p.frame - p.confirmedFrame() <= p.maxRollback) {
        const seats = tick >= 690 && i === 0 ? [0, 3] : [i];
        if (tick === 690 && i === 0) p.localSeats.push(3);
        for (const seat of seats) {
          const already = p['inputs'][seat][p.frame + p.inputDelay] !== undefined;
          if (already) continue;
          const mask = scriptedMask(seat, p.frame);
          const frame = p.addLocalInput(seat, mask);
          for (let to = 0; to < 3; to++) if (to !== i) wire.push({ at: tick + 3 + Math.floor(rand() * 7), to, seat, frame, mask });
        }
      }
      p.advance();
    }
  }
  // Let everything drain.
  for (let tick = 2400; tick < 2500; tick++) {
    for (const [i, p] of peers.entries()) {
      for (let k = wire.length - 1; k >= 0; k--) {
        const pk = wire[k];
        if (pk.to === i) { p.addRemoteInput(pk.seat, pk.frame, pk.mask); wire.splice(k, 1); }
      }
      p.advance();
    }
  }
  const common = Math.min(...peers.map((p) => p.confirmedFrame())) - 1;
  assert.ok(common > 1500, `progressed (common confirmed ${common})`);
  const sums = peers.map((p) => p.checksumAt(common));
  assert.ok(sums[0] !== undefined);
  assert.equal(sums[1], sums[0], 'guest 1 matches host');
  assert.equal(sums[2], sums[0], 'guest 2 matches host');
  assert.ok(peers.some((p) => p.stats.rollbacks > 0), 'rollbacks actually happened');
  assert.equal(peers[1].sim.fighters[3].controlType, 'human', 'seat event applied on guests');
});
