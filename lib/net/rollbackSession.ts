import { stepSimulation } from '../engine/physics';
import { createAiMemory } from '../engine/aiController';
import { createInputBuffer } from '../engine/inputBuffer';
import type { SimulationState } from '../engine/combatTypes';
import type { PlayerControlType } from '../types/protocol';
import { checksum, clearSideEffects, loadState, saveState, type SimSnapshot } from './rollbackState';

/**
 * Input-sync rollback netcode for one peer (host or guest). Pure: it never touches the network.
 *
 *  - Every human seat's input for frame F is broadcast; local inputs are scheduled `inputDelay` frames ahead.
 *  - Missing remote inputs are predicted (repeat last known). When the real one arrives and differs,
 *    the session restores the snapshot from that frame and re-simulates to the present.
 *  - A peer never runs more than `maxRollback` frames past what every remote seat has confirmed (it stalls).
 *  - Seat changes (a guest takes over a CPU, a CPU is kicked) are frame-stamped events, so every peer
 *    applies them at the same frame.
 */

export interface SeatEvent {
  frame: number;
  seat: number;
  controlType: PlayerControlType;
  /** Kicked seats are knocked out of the match instead of handed to a CPU or player. */
  eliminate?: boolean;
}

export interface RollbackOptions {
  localSeats: readonly number[];
  inputDelay?: number;
  maxRollback?: number;
}

export interface RollbackStats {
  frame: number;
  confirmed: number;
  rollbacks: number;
  rolledBackFrames: number;
  stalls: number;
}

const SNAPSHOT_RING = 64;

export class RollbackSession {
  readonly sim: SimulationState;
  /** Next frame to simulate. */
  frame = 0;
  localSeats: number[];
  readonly inputDelay: number;
  readonly maxRollback: number;

  /** inputs[seat] = sparse array by frame of confirmed masks. */
  private readonly inputs: number[][] = [];
  /** What we fed the sim for each (seat, frame) while predicting. */
  private readonly used: number[][] = [];
  /** Highest frame f such that every frame ≤ f is known, per seat. */
  private readonly contiguous: number[] = [];
  private readonly snapshots: ({ frame: number; snap: SimSnapshot } | undefined)[] = new Array(SNAPSHOT_RING);
  private readonly sums = new Map<number, number>();
  private events: SeatEvent[] = [];
  private rollbackTo = Infinity;
  /** Highest frame any remote input has arrived for (to detect falling behind). */
  maxRemoteFrame = -1;
  readonly stats: RollbackStats = { frame: 0, confirmed: -1, rollbacks: 0, rolledBackFrames: 0, stalls: 0 };

  constructor(sim: SimulationState, opts: RollbackOptions) {
    this.sim = sim;
    this.localSeats = [...opts.localSeats];
    this.inputDelay = opts.inputDelay ?? 2;
    this.maxRollback = opts.maxRollback ?? 8;
    for (let s = 0; s < sim.fighters.length; s++) {
      this.inputs[s] = [];
      this.used[s] = [];
      // Frames before the input delay are "known" to be neutral for everyone.
      for (let f = 0; f < this.inputDelay; f++) this.inputs[s][f] = 0;
      this.contiguous[s] = this.inputDelay - 1;
    }
  }

  /** Human seats driven by another peer. */
  remoteSeats(): number[] {
    return this.sim.fighters
      .filter((f) => f.controlType === 'human' && !this.localSeats.includes(f.slot))
      .map((f) => f.slot);
  }

  /** Records this peer's input for its seats; returns the frame it applies to (to broadcast). */
  addLocalInput(seat: number, mask: number): number {
    const target = this.frame + this.inputDelay;
    this.store(seat, target, mask);
    return target;
  }

  /** A remote seat's input for `frame` arrived (possibly a duplicate or out of order). */
  addRemoteInput(seat: number, frame: number, mask: number): void {
    if (this.localSeats.includes(seat) || seat >= this.inputs.length) return;
    if (this.inputs[seat][frame] !== undefined) return;
    this.store(seat, frame, mask);
    if (frame > this.maxRemoteFrame) this.maxRemoteFrame = frame;
    const fedPrediction = frame < this.frame && this.used[seat][frame] !== undefined && this.used[seat][frame] !== mask;
    if (fedPrediction) this.rollbackTo = Math.min(this.rollbackTo, frame);
  }

  /** Frame-stamped seat change. Rolls back if we already simulated past it. */
  addEvent(ev: SeatEvent): void {
    if (this.events.some((e) => e.frame === ev.frame && e.seat === ev.seat)) return;
    this.events.push(ev);
    // A seat handed to a human only needs their inputs from the handoff on; before that a CPU drove it.
    if (ev.controlType === 'human' && this.inputs[ev.seat]) {
      for (let f = 0; f < ev.frame; f++) if (this.inputs[ev.seat][f] === undefined) this.inputs[ev.seat][f] = 0;
      this.recomputeContiguous(ev.seat);
    }
    if (ev.frame < this.frame) this.rollbackTo = Math.min(this.rollbackTo, ev.frame);
  }

  hasInput(seat: number, frame: number): boolean {
    return this.inputs[seat]?.[frame] !== undefined;
  }

  /**
   * Neutral inputs for this peer's own seats over any frames it never sent (e.g. right after joining),
   * so nobody waits forever on them. Returns what was filled, to broadcast.
   */
  fillLocalGap(): [number, number, number][] {
    const out: [number, number, number][] = [];
    const until = this.frame + this.inputDelay;
    for (const seat of this.localSeats) {
      for (let f = Math.max(0, this.contiguous[seat] + 1); f < until; f++) {
        if (this.inputs[seat][f] === undefined) {
          this.store(seat, f, 0);
          out.push([seat, f, 0]);
        }
      }
    }
    return out;
  }

  /**
   * Host only: schedules a seat change `lead` frames from now. When a human seat leaves, its missing
   * inputs up to the change are filled with neutral so the match can't deadlock on them.
   */
  scheduleSeat(seat: number, controlType: PlayerControlType, lead: number, eliminate = false): { ev: SeatEvent; fills: [number, number, number][] } {
    const frame = this.frame + Math.max(this.inputDelay + 1, lead);
    const fills: [number, number, number][] = [];
    const leavingHuman = this.sim.fighters[seat]?.controlType === 'human' && controlType !== 'human';
    if (leavingHuman) {
      for (let f = Math.max(0, this.contiguous[seat] + 1); f < frame; f++) {
        if (this.inputs[seat][f] === undefined) {
          this.store(seat, f, 0);
          fills.push([seat, f, 0]);
        }
      }
    }
    const ev: SeatEvent = { frame, seat, controlType, ...(eliminate ? { eliminate } : {}) };
    this.addEvent(ev);
    return { ev, fills };
  }

  /** State + confirmed inputs + events for a peer joining or resyncing (taken at the confirmed frame). */
  syncState(): { frame: number; snapshot: SimSnapshot; inputs: [number, number, number][]; events: SeatEvent[] } {
    let frame = Math.min(this.frame, this.confirmedFrame() + 1);
    let snapshot = frame === this.frame ? saveState(this.sim) : this.snapshotAt(frame);
    if (!snapshot) {
      frame = this.frame;
      snapshot = saveState(this.sim);
    }
    return {
      frame,
      snapshot,
      inputs: this.inputHistory(frame).map((i) => [i.seat, i.frame, i.mask] as [number, number, number]),
      events: this.pendingEvents(frame),
    };
  }

  /** Lowest frame every remote human seat has confirmed. */
  confirmedFrame(): number {
    const remote = this.remoteSeats();
    if (remote.length === 0) return this.frame - 1;
    return Math.min(...remote.map((s) => this.contiguous[s]));
  }

  /** Can we simulate another frame without exceeding the rollback window? */
  canAdvance(): boolean {
    if (this.sim.winnerSlot !== null) return false;
    for (const s of this.localSeats) if (this.inputs[s]?.[this.frame] === undefined) return false;
    return this.frame - this.confirmedFrame() <= this.maxRollback;
  }

  /** Applies any pending rollback, then simulates one frame if allowed. Returns whether it advanced. */
  advance(): boolean {
    this.applyRollback();
    if (!this.canAdvance()) {
      this.stats.stalls++;
      return false;
    }
    this.stepOne(false);
    this.stats.frame = this.frame;
    this.stats.confirmed = this.confirmedFrame();
    return true;
  }

  /** Our checksum for a past frame (state *before* simulating it), if still remembered. */
  checksumAt(frame: number): number | undefined {
    return this.sums.get(frame);
  }

  /** Snapshot of the state before `frame`, for resyncing a peer. */
  snapshotAt(frame: number): SimSnapshot | undefined {
    const slot = this.snapshots[frame % SNAPSHOT_RING];
    return slot && slot.frame === frame ? slot.snap : undefined;
  }

  /** Confirmed inputs for frames ≥ from (for a joining or resyncing peer). */
  inputHistory(from: number): { seat: number; frame: number; mask: number }[] {
    const out: { seat: number; frame: number; mask: number }[] = [];
    this.inputs.forEach((byFrame, seat) => {
      for (let f = from; f < byFrame.length; f++) if (byFrame[f] !== undefined) out.push({ seat, frame: f, mask: byFrame[f] });
    });
    return out;
  }

  pendingEvents(from: number): SeatEvent[] {
    return this.events.filter((e) => e.frame >= from);
  }

  /** Hard resync: adopt the host's state at `frame` (inputs after it are re-sent separately). */
  resync(frame: number, snap: SimSnapshot): void {
    loadState(this.sim, snap);
    clearSideEffects(this.sim);
    this.frame = frame;
    this.rollbackTo = Infinity;
    this.sums.clear();
    for (let s = 0; s < this.inputs.length; s++) {
      this.used[s] = [];
      this.contiguous[s] = Math.max(this.contiguous[s], frame - 1);
      this.recomputeContiguous(s);
    }
  }

  // ── internals ──

  private store(seat: number, frame: number, mask: number): void {
    this.inputs[seat][frame] = mask;
    this.recomputeContiguous(seat);
  }

  private recomputeContiguous(seat: number): void {
    let c = this.contiguous[seat];
    while (this.inputs[seat][c + 1] !== undefined) c++;
    this.contiguous[seat] = c;
  }

  private inputFor(seat: number, frame: number): number {
    const known = this.inputs[seat][frame];
    if (known !== undefined) return known;
    // Predict: repeat the latest known input at or before this frame.
    for (let f = Math.min(frame, this.inputs[seat].length - 1); f >= 0; f--) {
      const v = this.inputs[seat][f];
      if (v !== undefined) return v;
    }
    return 0;
  }

  private applyEvents(frame: number): void {
    for (const ev of this.events) {
      if (ev.frame !== frame) continue;
      const f = this.sim.fighters[ev.seat];
      if (!f) continue;
      f.controlType = ev.controlType;
      f.ai = createAiMemory();
      f.input = createInputBuffer();
      if (ev.eliminate) {
        f.stocks = 0;
        f.respawnTimer = 9999;
        f.y = this.sim.stage.blastZones.top - 200;
        const alive = this.sim.fighters.filter((o) => o.stocks > 0);
        if (alive.length <= 1) this.sim.winnerSlot = alive[0]?.slot ?? null;
      }
    }
  }

  private stepOne(resimulating: boolean): void {
    const frame = this.frame;
    this.snapshots[frame % SNAPSHOT_RING] = { frame, snap: saveState(this.sim) };
    this.sums.set(frame, checksum(this.sim));
    this.sums.delete(frame - SNAPSHOT_RING);
    this.applyEvents(frame);
    const masks = this.sim.fighters.map((f) => {
      const m = this.inputFor(f.slot, frame);
      this.used[f.slot][frame] = m;
      return m;
    });
    const particleCount = this.sim.particles.length;
    stepSimulation(this.sim, masks);
    if (resimulating) {
      // Cosmetics already played the first time through.
      clearSideEffects(this.sim);
      this.sim.particles.length = Math.min(this.sim.particles.length, particleCount);
    }
    this.frame = frame + 1;
  }

  private applyRollback(): void {
    if (this.rollbackTo >= this.frame) {
      this.rollbackTo = Infinity;
      return;
    }
    const target = this.rollbackTo;
    this.rollbackTo = Infinity;
    const saved = this.snapshots[target % SNAPSHOT_RING];
    if (!saved || saved.frame !== target) return; // too old; the host's checksum will trigger a resync
    const until = this.frame;
    loadState(this.sim, saved.snap);
    this.frame = target;
    this.stats.rollbacks++;
    this.stats.rolledBackFrames += until - target;
    while (this.frame < until) this.stepOne(true);
  }
}
