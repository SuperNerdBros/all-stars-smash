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
  stepSimulation,
  type SimulationState,
} from './physics';
import { SoftwareRenderer25D } from './renderer';

const FIXED_STEP_MS = 1000 / 60;

export class SimulationHost {
  private readonly emit: (msg: WorkerOutMessage) => void;
  private readonly renderer = new SoftwareRenderer25D();

  private targetCanvas: OffscreenCanvas | HTMLCanvasElement | null = null;
  private targetCtx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null = null;
  private viewportWidth = 960;
  private viewportHeight = 540;

  private sim: SimulationState | null = null;
  private cam: CameraRig = createCameraRig('SIDE_25D');
  private stageCache: BakedStageCache | null = null;
  private bakedFighters: [BakedFighterSprites, BakedFighterSprites] | null = null;

  private p1Mask = 0;
  private p2Mask = 0;
  private paused = false;
  private hitboxesVisible = false;

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
    this.viewportWidth = Math.max(480, Math.round(width));
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
        this.viewportWidth = Math.max(480, Math.round(msg.viewportWidth));
        this.viewportHeight = Math.max(270, Math.round(msg.viewportHeight));
        if (this.targetCanvas) {
          this.targetCanvas.width = this.viewportWidth;
          this.targetCanvas.height = this.viewportHeight;
        }
        break;
      }
      case 'START_MATCH': {
        this.sim = createSimulationState(
          msg.fighters,
          msg.paletteIndices,
          msg.controlTypes,
          msg.cpuDifficulty,
          msg.stage,
          msg.stocks,
        );
        this.cam = createCameraRig(this.cam.preset);
        this.stageCache = bakeStageSlices(msg.stage);
        this.bakedFighters = [
          bakeFighterSprites(msg.fighters[0], msg.paletteIndices[0]),
          bakeFighterSprites(msg.fighters[1], msg.paletteIndices[1]),
        ];
        this.paused = false;
        this.p1Mask = 0;
        this.p2Mask = 0;
        this.accumulatorMs = 0;
        this.startLoop();
        this.emitHudSnapshot();
        break;
      }
      case 'INPUT_STATE': {
        this.p1Mask = msg.p1Mask;
        this.p2Mask = msg.p2Mask;
        break;
      }
      case 'SET_CAMERA': {
        this.setCamera(msg.preset);
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
      case 'HOT_RELOAD_FIGHTER': {
        if (!this.sim || !this.bakedFighters) break;
        for (let i = 0; i < 2; i++) {
          const ent = this.sim.fighters[i];
          if (ent.blueprint.id === msg.fighter.id) {
            ent.blueprint = msg.fighter;
            this.bakedFighters[i] = bakeFighterSprites(msg.fighter, ent.paletteIndex);
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
          stepSimulation(this.sim, this.p1Mask, this.p2Mask);

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
      );

      this.hudEmitCounter++;
      if (this.hudEmitCounter >= 2 || this.sim.pendingSfx.length > 0 || this.sim.winnerSlot !== null) {
        this.hudEmitCounter = 0;
        this.emitHudSnapshot();
      }
    }

    this.scheduleNextTick();
  }

  private emitHudSnapshot(): void {
    if (!this.sim) return;
    const sfxQueue = this.sim.pendingSfx.splice(0, this.sim.pendingSfx.length);
    const makeHudFighter = (slot: 0 | 1): HudFighterSnapshot => {
      const f = this.sim!.fighters[slot];
      return {
        slot,
        fighterId: f.blueprint.id,
        name: f.blueprint.name,
        paletteIndex: f.paletteIndex,
        damagePct: f.damagePct,
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
      fighters: [makeHudFighter(0), makeHudFighter(1)],
      cameraPreset: this.cam.preset,
      hitboxesVisible: this.hitboxesVisible,
      paused: this.paused,
      matchTimeTicks: this.sim.matchTimeTicks,
      winnerSlot: this.sim.winnerSlot,
      sfxQueue,
    };

    this.emit({ type: 'HUD_SNAPSHOT', snapshot });
  }
}
