import {
  INPUT_ATTACK,
  INPUT_DOWN,
  INPUT_JUMP,
  INPUT_LEFT,
  INPUT_RIGHT,
  INPUT_SHIELD,
  INPUT_SMASH,
  INPUT_SPECIAL,
  INPUT_UP,
  type CameraPreset,
} from '../types/protocol';

export interface InputPollerHandlers {
  onInputs: (p1Mask: number, p2Mask: number) => void;
  onCameraHotkey: (preset: CameraPreset) => void;
  onToggleEra?: () => void;
  onToggleHitbox: () => void;
  onTogglePause: () => void;
}

/**
 * Polls Keyboard (1P & 2P local bindings) + Gamepad API on the main thread
 * and streams compact 16-bit bitmasks to the Web Worker at 60Hz.
 */
export class MainThreadInputPoller {
  private readonly keys = new Set<string>();
  private readonly handlers: InputPollerHandlers;
  private rafId: number | null = null;
  private lastP1 = -1;
  private lastP2 = -1;
  private attached = false;

  constructor(handlers: InputPollerHandlers) {
    this.handlers = handlers;
  }

  public start(): void {
    if (typeof window === 'undefined' || this.attached) return;
    this.attached = true;
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    this.loop();
  }

  public stop(): void {
    if (!this.attached) return;
    this.attached = false;
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.keys.clear();
  }

  private handleBlur = (): void => {
    this.keys.clear();
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    // Do not intercept typing inside form fields
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    if (!e.repeat) {
      if (e.code === 'Digit1') {
        this.handlers.onCameraHotkey('SIDE_25D');
        return;
      }
      if (e.code === 'Digit2') {
        this.handlers.onCameraHotkey('ISOMETRIC');
        return;
      }
      if (e.code === 'Digit3') {
        this.handlers.onCameraHotkey('TOP_DOWN');
        return;
      }
      if (e.code === 'Digit4') {
        this.handlers.onCameraHotkey('THIRD_PERSON');
        return;
      }
      if (e.code === 'KeyE') {
        this.handlers.onToggleEra?.();
        return;
      }
      if (e.code === 'KeyH') {
        this.handlers.onToggleHitbox();
        return;
      }
      if (e.code === 'Escape') {
        this.handlers.onTogglePause();
        return;
      }
    }

    if (
      e.code === 'Space' ||
      e.code === 'ArrowUp' ||
      e.code === 'ArrowDown' ||
      e.code === 'ArrowLeft' ||
      e.code === 'ArrowRight'
    ) {
      e.preventDefault();
    }
    this.keys.add(e.code);
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code);
  };

  private loop = (): void => {
    if (!this.attached) return;
    const p1 = this.sampleP1Mask();
    const p2 = this.sampleP2Mask();

    if (p1 !== this.lastP1 || p2 !== this.lastP2) {
      this.lastP1 = p1;
      this.lastP2 = p2;
      this.handlers.onInputs(p1, p2);
    }

    this.rafId = requestAnimationFrame(this.loop);
  };

  private sampleP1Mask(): number {
    let m = 0;
    const k = this.keys;
    if (k.has('KeyA')) m |= INPUT_LEFT;
    if (k.has('KeyD')) m |= INPUT_RIGHT;
    if (k.has('KeyW')) m |= INPUT_UP;
    if (k.has('KeyS')) m |= INPUT_DOWN;
    if (k.has('Space') || k.has('KeyW')) m |= INPUT_JUMP;
    if (k.has('KeyJ') || k.has('KeyF')) m |= INPUT_ATTACK;
    if (k.has('KeyK') || k.has('KeyG')) m |= INPUT_SMASH;
    if (k.has('KeyL') || k.has('KeyR')) m |= INPUT_SPECIAL;
    if (k.has('ShiftLeft') || k.has('KeyU')) m |= INPUT_SHIELD;

    m |= this.sampleGamepadMask(0);
    return m;
  }

  private sampleP2Mask(): number {
    let m = 0;
    const k = this.keys;
    if (k.has('ArrowLeft')) m |= INPUT_LEFT;
    if (k.has('ArrowRight')) m |= INPUT_RIGHT;
    if (k.has('ArrowUp')) m |= INPUT_UP | INPUT_JUMP;
    if (k.has('ArrowDown')) m |= INPUT_DOWN;
    if (k.has('Numpad1') || k.has('Comma')) m |= INPUT_ATTACK;
    if (k.has('Numpad2') || k.has('Period')) m |= INPUT_SMASH;
    if (k.has('Numpad3') || k.has('Slash')) m |= INPUT_SPECIAL;
    if (k.has('ShiftRight') || k.has('Numpad0')) m |= INPUT_SHIELD;

    m |= this.sampleGamepadMask(1);
    return m;
  }

  private sampleGamepadMask(padIndex: number): number {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return 0;
    const pads = navigator.getGamepads();
    const pad = pads?.[padIndex];
    if (!pad) return 0;

    let m = 0;
    const ax0 = pad.axes[0] ?? 0;
    const ax1 = pad.axes[1] ?? 0;
    if (ax0 < -0.35 || pad.buttons[14]?.pressed) m |= INPUT_LEFT;
    if (ax0 > 0.35 || pad.buttons[15]?.pressed) m |= INPUT_RIGHT;
    if (ax1 < -0.45 || pad.buttons[12]?.pressed) m |= INPUT_UP;
    if (ax1 > 0.45 || pad.buttons[13]?.pressed) m |= INPUT_DOWN;

    if (pad.buttons[0]?.pressed || pad.buttons[3]?.pressed) m |= INPUT_JUMP;
    if (pad.buttons[2]?.pressed) m |= INPUT_ATTACK;
    if (pad.buttons[1]?.pressed) m |= INPUT_SPECIAL;
    if (pad.buttons[5]?.pressed || pad.buttons[7]?.pressed) m |= INPUT_SMASH;
    if (pad.buttons[4]?.pressed || pad.buttons[6]?.pressed) m |= INPUT_SHIELD;
    return m;
  }
}
