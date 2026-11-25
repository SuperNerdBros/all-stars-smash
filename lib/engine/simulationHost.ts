import type { FighterBlueprint, GraphicsEra } from '../types/fighter';
import type {
  CameraPreset,
  HudFighterSnapshot,
  HudSnapshot,
  WorkerInMessage,
  WorkerOutMessage,
} from '../types/protocol';
import {
  bakeFighterSprites,
  type BakedFighterSprites,
} from '../roster/paletteBaker';
import { resolveFighterForEra } from '../roster/eraResolver';
import {
  createCameraRig,
  stepCameraRig,
  triggerCameraShake,
  triggerKoZoom,
  type CameraRig,
} from './camera';
import { bakeStageSlices, type BakedStageCache } from './stageBaker';
import {
  createSimulationState,
  refreshFighterMoves,
  stepSimulation,
  type SimulationState,
} from './physics';
import { SoftwareRenderer25D } from './renderer';
import {
  applyTargetAssist,
  createTargetAssistMemory,
  resolveActiveTargetSlot,
} from './targetAssist';
import { RollbackSession } from '../net/rollbackSession';
import type { InputItem, SyncState } from '../net/netTypes';

const FIXED_STEP_MS = 1000 / 60;

export class SimulationHost {
  private readonly emit: (msg: WorkerOutMessage) => void;
  private readonly renderer = new SoftwareRenderer25D();

  private targetCanvas: OffscreenCanvas | HTMLCanvasElement | null = null;
  private targetCtx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null = null;
  private viewportWidth = 960;
  private viewportHeight = 540;

  private sim: SimulationState | null = null;
  private rawFighters: FighterBlueprint[] | null = null;
  private graphicsEra: GraphicsEra = 'NES';
  private cam: CameraRig = createCameraRig('SIDE_25D');
  private stageCache: BakedStageCache | null = null;
  private bakedFighters: BakedFighterSprites[] | null = null;

  private masks: number[] = [];
  /** Online match state (null for local play). */
  private net: RollbackSession | null = null;
  private netMatchId = 0;
  private netIsHost = false;
  private paused = false;
  private hitboxesVisible = false;
  private lockedTargetSlot: number | null = null;
  private targetAssistMem = createTargetAssistMemory();

  private rafId: number | null = null;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private running = false;
  private lastTimeMs = 0;
  private accumulatorMs = 0;
  private hudEmitCounter = 0;

  constructor(emit: (msg: WorkerOutMessage) => void) {
    this.emit = emit;
  }

  public attachCanvasDirect(
    canvas: OffscreenCanvas | HTMLCanvasElement,
    width: number,
    height: number,
  ): void {
    this.targetCanvas = canvas;
    this.viewportWidth = Math.max(320, Math.round(width));
    this.viewportHeight = Math.max(270, Math.round(height));
    canvas.width = this.viewportWidth;
    canvas.height = this.viewportHeight;
    const ctx = canvas.getContext('2d') as
      | OffscreenCanvasRenderingContext2D
      | CanvasRenderingContext2D
      | null;
    if (!ctx) {
      this.emit({ type: 'ERROR', message: 'Failed to acquire 2D canvas context' });
      return;
    }
    ctx.imageSmoothingEnabled = false;
    this.targetCtx = ctx;
    this.emit({ type: 'READY' });
  }

  public handleMessage(msg: WorkerInMessage): void {
    switch (msg.type) {
      case 'INIT_CANVAS': {
        this.attachCanvasDirect(msg.canvas, msg.viewportWidth, msg.viewportHeight);
        break;
      }
      case 'RESIZE': {
        this.viewportWidth = Math.max(320, Math.round(msg.viewportWidth));
        this.viewportHeight = Math.max(270, Math.round(msg.viewportHeight));
        if (this.targetCanvas) {
          this.targetCanvas.width = this.viewportWidth;
          this.targetCanvas.height = this.viewportHeight;
        }
        break;
      }
      case 'START_MATCH': {
        this.graphicsEra = msg.graphicsEra ?? 'NES';
        this.rawFighters = msg.fighters;
        const resolved = msg.fighters.map((f) => resolveFighterForEra(f, this.graphicsEra));
        this.sim = createSimulationState(
          resolved.map((blueprint, i) => ({
            blueprint,
            paletteIndex: msg.paletteIndices[i] ?? 0,
            controlType: msg.controlTypes[i] ?? 'cpu',
          })),
          msg.cpuDifficulty,
          msg.stage,
          msg.stocks,
        );
        this.cam = createCameraRig(this.cam.preset);
        this.renderer.preloadBackdrop(msg.stage.backdropImage);
        this.stageCache = bakeStageSlices(msg.stage);
        this.bakedFighters = resolved.map((bp, i) => bakeFighterSprites(bp, msg.paletteIndices[i] ?? 0));
        this.paused = false;
        this.masks = [];
        this.lockedTargetSlot = null;
        this.targetAssistMem = createTargetAssistMemory();
        this.accumulatorMs = 0;
        this.net = null;
        if (msg.net) {
          this.netMatchId = msg.net.matchId;
          this.netIsHost = msg.net.isHost;
          this.net = new RollbackSession(this.sim, { localSeats: msg.net.localSeats, inputDelay: msg.net.inputDelay });
          if (msg.net.sync) this.applySync(msg.net.sync);
        }
        this.startLoop();
        this.emitHudSnapshot();
        break;
      }
      case 'NET_INPUTS': {
        if (!this.net || msg.matchId !== this.netMatchId) break;
        for (const [seat, frame, mask] of msg.items) this.net.addRemoteInput(seat, frame, mask);
        break;
      }
      case 'NET_EVENT': {
        if (!this.net || msg.matchId !== this.netMatchId) break;
        for (const [seat, frame, mask] of msg.fills) this.net.addRemoteInput(seat, frame, mask);
        this.net.addEvent(msg.ev);
        if (msg.ev.controlType === 'human' && this.net.localSeats.includes(msg.ev.seat)) this.emitLocal(this.net.fillLocalGap());
        break;
      }
      case 'NET_CHECK': {
        if (!this.net || msg.matchId !== this.netMatchId) break;
        const mine = this.net.checksumAt(msg.frame);
        const settled = msg.frame <= this.net.confirmedFrame();
        if (settled && mine !== undefined && mine !== msg.hash) {
          this.emit({ type: 'NET_DESYNC', matchId: this.netMatchId, frame: msg.frame });
        }
        break;
      }
      case 'NET_RESYNC': {
        if (!this.net || msg.matchId !== this.netMatchId) break;
        this.applySync(msg.sync);
        break;
      }
      case 'NET_SYNC_REQUEST': {
        const sync = this.net ? this.toWireSync() : null;
        this.emit({ type: 'NET_SYNC', reqId: msg.reqId, sync });
        break;
      }
      case 'NET_SCHEDULE_SEAT': {
        if (!this.net) break;
        const { ev, fills } = this.net.scheduleSeat(msg.seat, msg.controlType, msg.lead, msg.eliminate);
        this.emit({ type: 'NET_SEAT_SCHEDULED', reqId: msg.reqId, ev, fills });
        break;
      }
      case 'INPUT_STATE': {
        this.masks = msg.masks;
        break;
      }
      case 'SET_CAMERA': {
        this.setCamera(msg.preset);
        break;
      }
      case 'SET_ERA': {
        this.graphicsEra = msg.era;
        if (this.sim && this.rawFighters && this.bakedFighters) {
          for (let i = 0; i < this.sim.fighters.length; i++) {
            const resolved = resolveFighterForEra(this.rawFighters[i], this.graphicsEra);
            this.sim.fighters[i].blueprint = resolved;
            refreshFighterMoves(this.sim.fighters[i]);
            this.bakedFighters[i] = bakeFighterSprites(resolved, this.sim.fighters[i].paletteIndex);
          }
        }
        this.emitHudSnapshot();
        break;
      }
      case 'TOGGLE_HITBOX': {
        this.hitboxesVisible =
          msg.visible !== undefined ? msg.visible : !this.hitboxesVisible;
        this.emitHudSnapshot();
        break;
      }
      case 'SET_PAUSED': {
        this.paused = msg.paused;
        this.emitHudSnapshot();
        break;
      }
      case 'SET_TARGET_LOCK': {
        this.lockedTargetSlot = msg.targetSlot;
        this.emitHudSnapshot();
        break;
      }
      case 'HOT_RELOAD_FIGHTER': {
        if (!this.sim || !this.bakedFighters) break;
        for (let i = 0; i < this.sim.fighters.length; i++) {
          const ent = this.sim.fighters[i];
          if (ent.blueprint.id === msg.fighter.id) {
            if (this.rawFighters) this.rawFighters[i] = msg.fighter;
            const resolved = resolveFighterForEra(msg.fighter, this.graphicsEra);
            ent.blueprint = resolved;
            refreshFighterMoves(ent);
            this.bakedFighters[i] = bakeFighterSprites(resolved, ent.paletteIndex);
          }
        }
        break;
      }
      case 'STOP': {
        this.stopLoop();
        break;
      }
    }
  }

  private setCamera(preset: CameraPreset): void {
    this.cam.preset = preset;
    this.emitHudSnapshot();
  }

  private startLoop(): void {
    if (this.running) return;
    this.running = true;
    this.lastTimeMs = performance.now();
    this.scheduleNextTick();
  }

  public stopLoop(): void {
    this.running = false;
    if (this.rafId !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  private scheduleNextTick(): void {
    if (!this.running) return;
    if (typeof requestAnimationFrame === 'function') {
      this.rafId = requestAnimationFrame((now) => this.tickFrame(now));
    } else {
      this.timeoutId = setTimeout(() => this.tickFrame(performance.now()), 16);
    }
  }

  private tickFrame(nowMs: number): void {
    if (!this.running) return;
    const elapsed = Math.min(80, Math.max(0, nowMs - this.lastTimeMs));
    this.lastTimeMs = nowMs;

    if (this.sim && this.stageCache && this.bakedFighters && this.targetCtx) {
      if (!this.paused) {
        this.accumulatorMs += elapsed;
        let steps = 0;
        while (this.accumulatorMs >= FIXED_STEP_MS && steps < 4) {
          if (this.net) {
            if (!this.stepNet()) {
              // Stalled waiting on a remote input: don't bank time, or we'd fast-forward later.
              this.accumulatorMs = Math.min(this.accumulatorMs, FIXED_STEP_MS);
              break;
            }
            // Fell behind the other peers (slow tab, background throttling): run one extra frame.
            const behind = this.net.maxRemoteFrame - this.net.frame > this.net.inputDelay + 3;
            if (behind) this.stepNet();
          } else {
            const assistedMasks = this.computeLocalAssistedMasks();
            stepSimulation(this.sim, assistedMasks);
          }

          if (this.sim.pendingShake > 0) {
            triggerCameraShake(this.cam, this.sim.pendingShake);
            this.sim.pendingShake = 0;
          }
          if (this.sim.pendingKo) {
            triggerKoZoom(this.cam, this.sim.pendingKo.x, this.sim.pendingKo.y);
            this.sim.pendingKo = null;
          }

          stepCameraRig(
            this.cam,
            this.sim.fighters.map((f) => ({
              x: f.x,
              y: f.y,
              facing: f.facing,
              active: f.respawnTimer === 0 && f.stocks > 0,
            })),
            this.sim.matchTimeTicks,
          );

          this.accumulatorMs -= FIXED_STEP_MS;
          steps++;
        }
      }

      this.renderer.renderFrame(
        this.targetCtx,
        this.viewportWidth,
        this.viewportHeight,
        this.sim,
        this.cam,
        this.stageCache,
        this.bakedFighters,
        this.hitboxesVisible,
        this.lockedTargetSlot,
      );

      this.hudEmitCounter++;
      if (this.hudEmitCounter >= 2 || this.sim.pendingSfx.length > 0 || this.sim.winnerSlot !== null) {
        this.hudEmitCounter = 0;
        this.emitHudSnapshot();
      }
    }

    this.scheduleNextTick();
  }

  /** One online frame: schedule local inputs, advance the rollback session, publish checksums. */
  private stepNet(): boolean {
    const net = this.net;
    if (!net) return false;
    const target = net.frame + net.inputDelay;
    const items: InputItem[] = [];
    net.localSeats.forEach((seat, k) => {
      if (net.hasInput(seat, target)) return;
      const rawMask = this.masks[k] ?? 0;
      const mask = k === 0 ? this.assistSeatMask(seat, rawMask) : rawMask;
      net.addLocalInput(seat, mask);
      items.push([seat, target, mask]);
    });
    this.emitLocal(items);
    const advanced = net.advance();
    if (advanced && this.netIsHost && net.frame % 30 === 0) {
      const frame = net.confirmedFrame();
      const hash = net.checksumAt(frame);
      if (hash !== undefined) this.emit({ type: 'NET_SUM', matchId: this.netMatchId, frame, hash });
    }
    return advanced;
  }

  private computeLocalAssistedMasks(): number[] {
    if (!this.sim || this.lockedTargetSlot === null) {
      return this.masks;
    }
    const nextMasks = [...this.masks];
    nextMasks[0] = this.assistSeatMask(0, nextMasks[0] ?? 0);
    return nextMasks;
  }

  private assistSeatMask(selfSlot: number, rawMask: number): number {
    if (!this.sim || this.lockedTargetSlot === null) {
      return rawMask;
    }
    const activeTargetSlot = resolveActiveTargetSlot(this.sim, selfSlot, this.lockedTargetSlot);
    if (activeTargetSlot !== this.lockedTargetSlot) {
      this.lockedTargetSlot = activeTargetSlot;
    }
    if (activeTargetSlot === null) {
      return rawMask;
    }
    const self = this.sim.fighters[selfSlot];
    const target = this.sim.fighters[activeTargetSlot];
    if (!self || !target) {
      return rawMask;
    }
    return applyTargetAssist(
      rawMask,
      self,
      target,
      this.sim.stage,
      this.sim.matchTimeTicks,
      this.targetAssistMem,
    );
  }

  private emitLocal(items: InputItem[]): void {
    if (items.length) this.emit({ type: 'NET_LOCAL', matchId: this.netMatchId, items });
  }

  private applySync(sync: SyncState): void {
    const net = this.net;
    if (!net) return;
    net.resync(sync.frame, sync.snapshot);
    for (const [seat, frame, mask] of sync.inputs) net.addRemoteInput(seat, frame, mask);
    for (const ev of sync.events) net.addEvent(ev);
    this.emitLocal(net.fillLocalGap());
  }

  private toWireSync(): SyncState {
    const s = (this.net as RollbackSession).syncState();
    return { frame: s.frame, snapshot: s.snapshot, inputs: s.inputs, events: s.events };
  }

  private emitHudSnapshot(): void {
    if (!this.sim) return;
    const sfxQueue = this.sim.pendingSfx.splice(0, this.sim.pendingSfx.length);
    const makeHudFighter = (slot: number): HudFighterSnapshot => {
      const f = this.sim!.fighters[slot];
      return {
        slot,
        fighterId: f.blueprint.id,
        name: f.blueprint.name,
        paletteIndex: f.paletteIndex,
        damagePct: Math.floor(f.damagePct),
        stocks: f.stocks,
        maxStocks: f.maxStocks,
        shieldHp: Math.round(f.shieldHp),
        isInvulnerable: f.invulnTimer > 0,
        isRespawning: f.respawnTimer > 0,
        damageDealt: f.damageDealt,
        kosScored: f.kosScored,
      };
    };

    const snapshot: HudSnapshot = {
      fighters: this.sim.fighters.map((f) => makeHudFighter(f.slot)),
      cameraPreset: this.cam.preset,
      graphicsEra: this.graphicsEra,
      hitboxesVisible: this.hitboxesVisible,
      paused: this.paused,
      matchTimeTicks: this.sim.matchTimeTicks,
      winnerSlot: this.sim.winnerSlot,
      lockedTargetSlot: this.lockedTargetSlot,
      ...(this.net ? { net: { ...this.net.stats } } : {}),
      sfxQueue,
    };

    this.emit({ type: 'HUD_SNAPSHOT', snapshot });
  }
}
