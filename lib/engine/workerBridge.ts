import type {
  CameraPreset,
  CpuDifficulty,
  HudSnapshot,
  PlayerControlType,
  WorkerInMessage,
  WorkerOutMessage,
} from '../types/protocol';
import type { FighterBlueprint, GraphicsEra } from '../types/fighter';
import type { StageManifest } from '../types/stage';
import { SimulationHost } from './simulationHost';

export interface WorkerBridgeCallbacks {
  onReady?: () => void;
  onHudSnapshot: (snapshot: HudSnapshot) => void;
  onError?: (message: string) => void;
}

/**
 * Client-only bridge that transfers the viewport canvas to a dedicated Web Worker
 * via transferControlToOffscreen(), with automatic graceful fallback to an in-thread
 * SimulationHost if the host browser restricts OffscreenCanvas transfer.
 */
export class EngineWorkerBridge {
  private worker: Worker | null = null;
  private fallbackHost: SimulationHost | null = null;
  private canvasEl: HTMLCanvasElement | null = null;
  private hostEl: HTMLElement | null = null;
  private lastWidth = 960;
  private lastHeight = 540;
  private pendingStartParams: Parameters<EngineWorkerBridge['startMatch']>[0] | null = null;
  private destroyed = false;

  private createFreshCanvas(host: HTMLElement): HTMLCanvasElement {
    if (this.canvasEl && this.canvasEl.parentElement) {
      this.canvasEl.parentElement.removeChild(this.canvasEl);
    }
    const canvas = document.createElement('canvas');
    canvas.className = 'pixelated w-full h-full block';
    host.appendChild(canvas);
    this.canvasEl = canvas;
    return canvas;
  }

  private bootFallback(callbacks: WorkerBridgeCallbacks): void {
    if (this.destroyed || !this.hostEl || this.fallbackHost) return;
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    const freshCanvas = this.createFreshCanvas(this.hostEl);
    const host = new SimulationHost((data) => {
      if (this.destroyed) return;
      if (data.type === 'READY') callbacks.onReady?.();
      else if (data.type === 'HUD_SNAPSHOT') callbacks.onHudSnapshot(data.snapshot);
      else if (data.type === 'ERROR') callbacks.onError?.(data.message);
    });
    this.fallbackHost = host;
    host.attachCanvasDirect(freshCanvas, this.lastWidth, this.lastHeight);
    if (this.pendingStartParams) {
      host.handleMessage({
        type: 'START_MATCH',
        ...this.pendingStartParams,
      });
    }
  }

  public mount(
    hostElement: HTMLElement,
    width: number,
    height: number,
    callbacks: WorkerBridgeCallbacks,
  ): void {
    if (typeof window === 'undefined' || this.destroyed) return;

    this.hostEl = hostElement;
    this.lastWidth = width;
    this.lastHeight = height;

    const canvas = this.createFreshCanvas(hostElement);

    const canTransfer =
      typeof Worker !== 'undefined' &&
      typeof OffscreenCanvas !== 'undefined' &&
      typeof canvas.transferControlToOffscreen === 'function';

    if (canTransfer) {
      try {
        const worker = new Worker(new URL('./game.worker.ts', import.meta.url), {
          type: 'module',
        });
        const offscreen = canvas.transferControlToOffscreen();

        worker.onmessage = (event: MessageEvent<WorkerOutMessage>) => {
          if (this.destroyed) return;
          const data = event.data;
          if (data.type === 'READY') callbacks.onReady?.();
          else if (data.type === 'HUD_SNAPSHOT') callbacks.onHudSnapshot(data.snapshot);
          else if (data.type === 'ERROR') callbacks.onError?.(data.message);
        };

        worker.onerror = () => {
          // Seamlessly fall back to an in-thread SimulationHost on a fresh canvas.
          this.bootFallback(callbacks);
        };

        this.worker = worker;
        worker.postMessage(
          {
            type: 'INIT_CANVAS',
            canvas: offscreen,
            viewportWidth: width,
            viewportHeight: height,
          } satisfies WorkerInMessage,
          [offscreen],
        );
        return;
      } catch {
        // chemx-allow: best-effort fallback to in-thread SimulationHost when OffscreenCanvas transfer fails
      }
    }

    this.bootFallback(callbacks);
  }

  public startMatch(params: {
    fighters: FighterBlueprint[];
    paletteIndices: number[];
    controlTypes: PlayerControlType[];
    cpuDifficulty: CpuDifficulty;
    stage: StageManifest;
    stocks: number;
    graphicsEra: GraphicsEra;
  }): void {
    this.pendingStartParams = params;
    this.post({
      type: 'START_MATCH',
      ...params,
    });
  }

  public sendInputs(masks: number[]): void {
    this.post({ type: 'INPUT_STATE', masks });
  }

  public setCamera(preset: CameraPreset): void {
    this.post({ type: 'SET_CAMERA', preset });
  }

  public setEra(era: GraphicsEra): void {
    if (this.pendingStartParams) {
      this.pendingStartParams = { ...this.pendingStartParams, graphicsEra: era };
    }
    this.post({ type: 'SET_ERA', era });
  }

  public toggleHitboxes(visible?: boolean): void {
    this.post({ type: 'TOGGLE_HITBOX', visible });
  }

  public setPaused(paused: boolean): void {
    this.post({ type: 'SET_PAUSED', paused });
  }

  public hotReloadFighter(fighter: FighterBlueprint): void {
    this.post({ type: 'HOT_RELOAD_FIGHTER', fighter });
  }

  public resize(viewportWidth: number, viewportHeight: number): void {
    this.lastWidth = viewportWidth;
    this.lastHeight = viewportHeight;
    this.post({ type: 'RESIZE', viewportWidth, viewportHeight });
  }

  public destroy(): void {
    this.destroyed = true;
    this.post({ type: 'STOP' });
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    if (this.fallbackHost) {
      this.fallbackHost.stopLoop();
      this.fallbackHost = null;
    }
    if (this.canvasEl && this.canvasEl.parentElement) {
      this.canvasEl.parentElement.removeChild(this.canvasEl);
    }
    this.canvasEl = null;
    this.hostEl = null;
  }

  private post(msg: WorkerInMessage): void {
    if (this.worker) {
      this.worker.postMessage(msg);
    } else if (this.fallbackHost) {
      this.fallbackHost.handleMessage(msg);
    }
  }
}
