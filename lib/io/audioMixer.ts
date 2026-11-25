const MIXER_STORAGE_KEY = 'all-stars.audioMixer.v1';

export interface AudioMixerSnapshot {
  readonly bgmVolume: number;
  readonly bgmMuted: boolean;
  readonly sfxVolume: number;
  readonly sfxMuted: boolean;
}

const DEFAULT_SNAPSHOT: AudioMixerSnapshot = {
  bgmVolume: 30,
  bgmMuted: false,
  sfxVolume: 100,
  sfxMuted: false,
};

function clampPct(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function readStoredMixer(): AudioMixerSnapshot {
  if (typeof window === 'undefined') return DEFAULT_SNAPSHOT;
  try {
    const raw = window.localStorage.getItem(MIXER_STORAGE_KEY);
    if (!raw) return DEFAULT_SNAPSHOT;
    const parsed = JSON.parse(raw) as Partial<AudioMixerSnapshot>;
    return {
      bgmVolume: typeof parsed.bgmVolume === 'number' ? clampPct(parsed.bgmVolume) : DEFAULT_SNAPSHOT.bgmVolume,
      bgmMuted: typeof parsed.bgmMuted === 'boolean' ? parsed.bgmMuted : DEFAULT_SNAPSHOT.bgmMuted,
      sfxVolume: typeof parsed.sfxVolume === 'number' ? clampPct(parsed.sfxVolume) : DEFAULT_SNAPSHOT.sfxVolume,
      sfxMuted: typeof parsed.sfxMuted === 'boolean' ? parsed.sfxMuted : DEFAULT_SNAPSHOT.sfxMuted,
    };
  } catch {
    // chemx-allow: best-effort fallback when localStorage is unavailable
    return DEFAULT_SNAPSHOT;
  }
}

type MixerListener = () => void;

class AudioMixerStore {
  private snapshot: AudioMixerSnapshot = DEFAULT_SNAPSHOT;
  private hydrated = false;
  private listeners = new Set<MixerListener>();

  private hydrate(): void {
    const canHydrate = !this.hydrated && typeof window !== 'undefined';
    if (!canHydrate) return;
    this.hydrated = true;
    this.snapshot = readStoredMixer();
  }

  public getSnapshot = (): AudioMixerSnapshot => {
    this.hydrate();
    return this.snapshot;
  };

  public getServerSnapshot = (): AudioMixerSnapshot => DEFAULT_SNAPSHOT;

  public subscribe = (listener: MixerListener): (() => void) => {
    this.hydrate();
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  public setBgmVolume(pct: number): void {
    const bgmVolume = clampPct(pct);
    const bgmMuted = bgmVolume === 0;
    this.commit({ ...this.getSnapshot(), bgmVolume, bgmMuted });
  }

  public setBgmMuted(bgmMuted: boolean): void {
    const prev = this.getSnapshot();
    const bgmVolume = !bgmMuted && prev.bgmVolume === 0 ? DEFAULT_SNAPSHOT.bgmVolume : prev.bgmVolume;
    this.commit({ ...prev, bgmMuted, bgmVolume });
  }

  public toggleBgmMute(): boolean {
    const nextMuted = !this.getSnapshot().bgmMuted;
    this.setBgmMuted(nextMuted);
    return nextMuted;
  }

  public setSfxVolume(pct: number): void {
    const sfxVolume = clampPct(pct);
    const sfxMuted = sfxVolume === 0;
    this.commit({ ...this.getSnapshot(), sfxVolume, sfxMuted });
  }

  public setSfxMuted(sfxMuted: boolean): void {
    const prev = this.getSnapshot();
    const sfxVolume = !sfxMuted && prev.sfxVolume === 0 ? DEFAULT_SNAPSHOT.sfxVolume : prev.sfxVolume;
    this.commit({ ...prev, sfxMuted, sfxVolume });
  }

  public toggleSfxMute(): boolean {
    const nextMuted = !this.getSnapshot().sfxMuted;
    this.setSfxMuted(nextMuted);
    return nextMuted;
  }

  private commit(next: AudioMixerSnapshot): void {
    this.snapshot = next;
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(MIXER_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // chemx-allow: best-effort persist mixer settings in sandboxed storage
      }
    }
    this.listeners.forEach((listener) => listener());
  }
}

export const audioMixer = new AudioMixerStore();
