import type { GraphicsEra } from '../types/fighter';
import type { SfxEvent } from '../types/protocol';
import { audioMixer } from './audioMixer';
import { SFX_CATALOG_BY_ID } from './sfxCatalog';
import { SFX_RECIPES, type SynthRig } from './sfxSynth';

const REMAP_STORAGE_KEY = 'all-stars.sfxRemap';
/** Makeup gain into the compressor so retro SFX cut cleanly over mastered SoundCloud OSTs. */
const SFX_MAKEUP_GAIN = 2.4;

export interface PlaySfxOptions {
  readonly bypassRemap?: boolean;
  readonly eraOverride?: GraphicsEra;
}

export type SfxRemapTable = Partial<Record<SfxEvent, SfxEvent>>;

function loadStoredRemaps(): SfxRemapTable {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(REMAP_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const clean: SfxRemapTable = {};
    for (const [key, val] of Object.entries(parsed)) {
      const isValidPair =
        key in SFX_CATALOG_BY_ID &&
        typeof val === 'string' &&
        val in SFX_CATALOG_BY_ID &&
        key !== val;
      if (isValidPair) {
        clean[key as SfxEvent] = val as SfxEvent;
      }
    }
    return clean;
  } catch {
    // chemx-allow: best-effort fallback when storage is unavailable
    return {};
  }
}

function createWhiteNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * 1.2);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    channel[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

/**
 * Pure Web Audio API multi-layered retro SFX engine synced to audioMixer,
 * with studio compression/makeup gain, NES/16-Bit profiles, and live analyser output.
 */
class ChiptuneAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private eraProfile: GraphicsEra = 'SNES_SEGA';
  private remaps: SfxRemapTable = {};
  private hydrated = false;

  private hydrate(): void {
    const shouldHydrate = !this.hydrated && typeof window !== 'undefined';
    if (!shouldHydrate) return;
    this.hydrated = true;
    this.remaps = loadStoredRemaps();
    audioMixer.subscribe(() => this.syncMasterGain());
  }

  public isMuted(): boolean {
    return audioMixer.getSnapshot().sfxMuted;
  }

  public setMuted(next: boolean): void {
    audioMixer.setSfxMuted(next);
    this.syncMasterGain();
  }

  public toggleMute(): boolean {
    const next = audioMixer.toggleSfxMute();
    this.syncMasterGain();
    return next;
  }

  public getVolume(): number {
    return audioMixer.getSnapshot().sfxVolume / 100;
  }

  public setVolume(next: number): void {
    audioMixer.setSfxVolume(Math.round(next * 100));
    this.syncMasterGain();
  }

  public getEraProfile(): GraphicsEra {
    return this.eraProfile;
  }

  public setEraProfile(era: GraphicsEra): void {
    this.eraProfile = era;
  }

  public getEventMappings(): Readonly<SfxRemapTable> {
    this.hydrate();
    return { ...this.remaps };
  }

  public resolveMappedEvent(event: SfxEvent): SfxEvent {
    this.hydrate();
    return this.remaps[event] ?? event;
  }

  public setEventMapping(source: SfxEvent, target: SfxEvent): void {
    this.hydrate();
    if (source === target) {
      delete this.remaps[source];
    } else {
      this.remaps[source] = target;
    }
    this.persistRemaps();
  }

  public resetEventMappings(): void {
    this.hydrate();
    this.remaps = {};
    this.persistRemaps();
  }

  public readWaveform(target: Uint8Array<ArrayBuffer>): boolean {
    if (!this.analyser) return false;
    this.analyser.getByteTimeDomainData(target);
    return true;
  }

  public playMenuTick(): void {
    this.playSfx('menuTick');
  }

  public playMenuConfirm(): void {
    this.playSfx('menuConfirm');
  }

  public playMenuBack(): void {
    this.playSfx('menuBack');
  }

  public playEraSwap(): void {
    this.playSfx('eraSwap');
  }

  public playSfx(event: SfxEvent, options?: PlaySfxOptions): void {
    this.hydrate();
    const rig = this.ensureRig(options?.eraOverride ?? this.eraProfile);
    if (!rig) return;

    const targetEvent = options?.bypassRemap ? event : this.resolveMappedEvent(event);
    const recipe = SFX_RECIPES[targetEvent] ?? SFX_RECIPES[event];
    recipe(rig);
  }

  private persistRemaps(): void {
    try {
      window.localStorage.setItem(REMAP_STORAGE_KEY, JSON.stringify(this.remaps));
    } catch {
      // chemx-allow: best-effort persist remap preferences in sandboxed storage
    }
  }

  private computeGain(): number {
    const { sfxMuted, sfxVolume } = audioMixer.getSnapshot();
    if (sfxMuted) return 0;
    return (sfxVolume / 100) * SFX_MAKEUP_GAIN;
  }

  private syncMasterGain(): void {
    const hasGain = Boolean(this.masterGain && this.ctx);
    if (!hasGain || !this.masterGain || !this.ctx) return;
    this.masterGain.gain.setValueAtTime(this.computeGain(), this.ctx.currentTime);
  }

  private ensureRig(era: GraphicsEra): SynthRig | null {
    const snap = audioMixer.getSnapshot();
    const isSilentOrServer = snap.sfxMuted || snap.sfxVolume <= 0 || typeof window === 'undefined';
    if (isSilentOrServer) return null;

    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;

      const ctx = new Ctor();
      const masterGain = ctx.createGain();
      const compressor = ctx.createDynamicsCompressor();
      const analyser = ctx.createAnalyser();

      compressor.threshold.setValueAtTime(-10, ctx.currentTime);
      compressor.knee.setValueAtTime(14, ctx.currentTime);
      compressor.ratio.setValueAtTime(5, ctx.currentTime);
      compressor.attack.setValueAtTime(0.002, ctx.currentTime);
      compressor.release.setValueAtTime(0.11, ctx.currentTime);

      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.72;

      masterGain.gain.setValueAtTime(this.computeGain(), ctx.currentTime);
      masterGain.connect(compressor);
      compressor.connect(analyser);
      analyser.connect(ctx.destination);

      this.ctx = ctx;
      this.masterGain = masterGain;
      this.analyser = analyser;
      this.noiseBuffer = createWhiteNoiseBuffer(ctx);
    }

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }

    const rigReady = Boolean(this.masterGain && this.noiseBuffer);
    if (!rigReady || !this.masterGain || !this.noiseBuffer) return null;
    this.syncMasterGain();
    return {
      ctx: this.ctx,
      output: this.masterGain,
      era,
      noiseBuffer: this.noiseBuffer,
    };
  }
}

export const chiptuneAudio = new ChiptuneAudioEngine();
