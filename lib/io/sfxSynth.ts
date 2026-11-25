import type { GraphicsEra } from '../types/fighter';
import type { SfxEvent } from '../types/protocol';

export interface SynthRig {
  readonly ctx: AudioContext;
  readonly output: AudioNode;
  readonly era: GraphicsEra;
  readonly noiseBuffer: AudioBuffer;
}

interface ToneSpec {
  type: OscillatorType;
  startFreq: number;
  endFreq: number;
  duration: number;
  volume: number;
  delay?: number;
  attack?: number;
  filterFreq?: number;
}

interface NoiseSpec {
  duration: number;
  volume: number;
  delay?: number;
  filterType?: BiquadFilterType;
  freqStart?: number;
  freqEnd?: number;
  q?: number;
}

interface FmToneSpec {
  carrierType?: OscillatorType;
  modType?: OscillatorType;
  carrierStart: number;
  carrierEnd: number;
  modFreq: number;
  modDepth: number;
  duration: number;
  volume: number;
  delay?: number;
}

function adaptWave(type: OscillatorType, era: GraphicsEra): OscillatorType {
  if (era === 'NES' && type === 'sine') return 'triangle';
  return type;
}

function playTone(rig: SynthRig, spec: ToneSpec): void {
  const { ctx, output, era } = rig;
  const now = ctx.currentTime + (spec.delay ?? 0);
  const attack = spec.attack ?? 0.004;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = adaptWave(spec.type, era);
  osc.frequency.setValueAtTime(Math.max(20, spec.startFreq), now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, spec.endFreq), now + spec.duration);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(spec.volume, now + attack);
  gain.gain.exponentialRampToValueAtTime(0.0008, now + spec.duration);

  if (spec.filterFreq && era === 'SNES_SEGA') {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(spec.filterFreq, now);
    osc.connect(filter);
    filter.connect(gain);
  } else {
    osc.connect(gain);
  }

  gain.connect(output);
  osc.start(now);
  osc.stop(now + spec.duration + 0.02);
}

function playNoise(rig: SynthRig, spec: NoiseSpec): void {
  const { ctx, output, noiseBuffer } = rig;
  const now = ctx.currentTime + (spec.delay ?? 0);
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;

  const filter = ctx.createBiquadFilter();
  filter.type = spec.filterType ?? 'bandpass';
  const startF = Math.max(40, spec.freqStart ?? 1200);
  const endF = Math.max(40, spec.freqEnd ?? startF);
  filter.frequency.setValueAtTime(startF, now);
  filter.frequency.exponentialRampToValueAtTime(endF, now + spec.duration);
  filter.Q.setValueAtTime(spec.q ?? 1.2, now);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(spec.volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0008, now + spec.duration);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(output);
  src.start(now, Math.random() * 0.25, spec.duration + 0.02);
}

function playFmTone(rig: SynthRig, spec: FmToneSpec): void {
  const { ctx, output, era } = rig;
  const now = ctx.currentTime + (spec.delay ?? 0);
  const carrier = ctx.createOscillator();
  const mod = ctx.createOscillator();
  const modGain = ctx.createGain();
  const outGain = ctx.createGain();

  carrier.type = adaptWave(spec.carrierType ?? 'square', era);
  mod.type = spec.modType ?? 'sine';

  carrier.frequency.setValueAtTime(Math.max(20, spec.carrierStart), now);
  carrier.frequency.exponentialRampToValueAtTime(Math.max(20, spec.carrierEnd), now + spec.duration);
  mod.frequency.setValueAtTime(spec.modFreq, now);
  modGain.gain.setValueAtTime(spec.modDepth, now);
  modGain.gain.exponentialRampToValueAtTime(1, now + spec.duration);

  outGain.gain.setValueAtTime(spec.volume, now);
  outGain.gain.exponentialRampToValueAtTime(0.0008, now + spec.duration);

  mod.connect(modGain);
  modGain.connect(carrier.frequency);
  carrier.connect(outGain);
  outGain.connect(output);

  carrier.start(now);
  mod.start(now);
  carrier.stop(now + spec.duration + 0.02);
  mod.stop(now + spec.duration + 0.02);
}

function playArpeggio(
  rig: SynthRig,
  notes: ReadonlyArray<number>,
  stepSec: number,
  noteDur: number,
  volume: number,
  type: OscillatorType = 'square',
): void {
  notes.forEach((freq, idx) => {
    playTone(rig, {
      type,
      startFreq: freq,
      endFreq: freq * 1.015,
      duration: noteDur,
      volume,
      delay: idx * stepSec,
    });
  });
}

export type SfxRecipeFn = (rig: SynthRig) => void;

export const SFX_RECIPES: Readonly<Record<SfxEvent, SfxRecipeFn>> = {
  // ── Movement & Stage ────────────────────────────────────────────
  jump: (rig) => {
    playTone(rig, { type: 'square', startFreq: 195, endFreq: 560, duration: 0.095, volume: 0.14, filterFreq: 2600 });
    playTone(rig, { type: 'triangle', startFreq: 130, endFreq: 290, duration: 0.08, volume: 0.12 });
  },
  doubleJump: (rig) => {
    playNoise(rig, { duration: 0.055, volume: 0.09, filterType: 'bandpass', freqStart: 1600, freqEnd: 3400, q: 1.5 });
    playTone(rig, { type: 'square', startFreq: 310, endFreq: 780, duration: 0.11, volume: 0.13, filterFreq: 3200 });
    playTone(rig, { type: 'triangle', startFreq: 465, endFreq: 960, duration: 0.095, volume: 0.1, delay: 0.02 });
  },
  tripleJump: (rig) => {
    playNoise(rig, { duration: 0.06, volume: 0.09, filterType: 'highpass', freqStart: 2400, freqEnd: 5200 });
    playArpeggio(rig, [523.25, 659.25, 783.99, 1046.5], 0.032, 0.075, 0.11, 'square');
    playTone(rig, { type: 'triangle', startFreq: 523.25, endFreq: 1320, duration: 0.16, volume: 0.1 });
  },
  wallJump: (rig) => {
    playNoise(rig, { duration: 0.045, volume: 0.16, filterType: 'bandpass', freqStart: 1800, freqEnd: 800, q: 1.6 });
    playTone(rig, { type: 'square', startFreq: 270, endFreq: 860, duration: 0.11, volume: 0.14 });
    playTone(rig, { type: 'triangle', startFreq: 160, endFreq: 90, duration: 0.05, volume: 0.15 });
  },
  land: (rig) => {
    playTone(rig, { type: 'triangle', startFreq: 135, endFreq: 46, duration: 0.085, volume: 0.2 });
    playNoise(rig, { duration: 0.055, volume: 0.12, filterType: 'lowpass', freqStart: 950, freqEnd: 260 });
  },
  springBounce: (rig) => {
    playFmTone(rig, {
      carrierType: 'triangle',
      modType: 'sine',
      carrierStart: 185,
      carrierEnd: 740,
      modFreq: 26,
      modDepth: 110,
      duration: 0.25,
      volume: 0.22,
    });
    playTone(rig, { type: 'square', startFreq: 370, endFreq: 1180, duration: 0.18, volume: 0.09, delay: 0.03 });
  },
  wallCling: (rig) => {
    playNoise(rig, { duration: 0.06, volume: 0.12, filterType: 'bandpass', freqStart: 2200, freqEnd: 1100, q: 2.0 });
    playTone(rig, { type: 'triangle', startFreq: 240, endFreq: 150, duration: 0.05, volume: 0.09 });
  },

  // ── Attacks & Swings ────────────────────────────────────────────
  whiffLight: (rig) => {
    playNoise(rig, { duration: 0.09, volume: 0.14, filterType: 'bandpass', freqStart: 2800, freqEnd: 900, q: 1.8 });
    playTone(rig, { type: 'triangle', startFreq: 420, endFreq: 180, duration: 0.07, volume: 0.06 });
  },
  whiffHeavy: (rig) => {
    playNoise(rig, { duration: 0.16, volume: 0.2, filterType: 'bandpass', freqStart: 1600, freqEnd: 380, q: 1.4 });
    playTone(rig, { type: 'sawtooth', startFreq: 240, endFreq: 78, duration: 0.15, volume: 0.11, filterFreq: 900 });
  },
  smashCharge: (rig) => {
    playTone(rig, { type: 'square', startFreq: 440, endFreq: 660, duration: 0.11, volume: 0.08, filterFreq: 2200 });
    playTone(rig, { type: 'triangle', startFreq: 660, endFreq: 990, duration: 0.11, volume: 0.08, delay: 0.02 });
  },
  shoot: (rig) => {
    playTone(rig, { type: 'square', startFreq: 1180, endFreq: 220, duration: 0.12, volume: 0.13, filterFreq: 3400 });
    playTone(rig, { type: 'sawtooth', startFreq: 640, endFreq: 140, duration: 0.11, volume: 0.08, filterFreq: 1800 });
    playNoise(rig, { duration: 0.04, volume: 0.1, filterType: 'highpass', freqStart: 2600, freqEnd: 1200 });
  },
  specialCast: (rig) => {
    playFmTone(rig, {
      carrierType: 'sawtooth',
      modType: 'square',
      carrierStart: 280,
      carrierEnd: 880,
      modFreq: 42,
      modDepth: 95,
      duration: 0.17,
      volume: 0.15,
    });
    playNoise(rig, { duration: 0.11, volume: 0.11, filterType: 'bandpass', freqStart: 1400, freqEnd: 3600, q: 1.4 });
  },
  upSpecial: (rig) => {
    playNoise(rig, { duration: 0.22, volume: 0.17, filterType: 'bandpass', freqStart: 900, freqEnd: 3800, q: 1.3 });
    playTone(rig, { type: 'sawtooth', startFreq: 220, endFreq: 1080, duration: 0.22, volume: 0.13, filterFreq: 2800 });
    playTone(rig, { type: 'square', startFreq: 440, endFreq: 1320, duration: 0.16, volume: 0.09, delay: 0.05 });
  },

  // ── Impacts & Elements ──────────────────────────────────────────
  hitLight: (rig) => {
    playNoise(rig, { duration: 0.065, volume: 0.22, filterType: 'bandpass', freqStart: 2400, freqEnd: 650, q: 1.1 });
    playTone(rig, { type: 'triangle', startFreq: 210, endFreq: 68, duration: 0.085, volume: 0.24 });
    playTone(rig, { type: 'square', startFreq: 340, endFreq: 110, duration: 0.06, volume: 0.1 });
  },
  hitMedium: (rig) => {
    playNoise(rig, { duration: 0.11, volume: 0.28, filterType: 'bandpass', freqStart: 1900, freqEnd: 420, q: 0.9 });
    playTone(rig, { type: 'sawtooth', startFreq: 240, endFreq: 56, duration: 0.13, volume: 0.22, filterFreq: 1400 });
    playTone(rig, { type: 'square', startFreq: 480, endFreq: 120, duration: 0.07, volume: 0.12 });
  },
  hitHeavy: (rig) => {
    // Iconic home-run-style critical crack + sub-bass boom + bright star ping!
    playNoise(rig, { duration: 0.18, volume: 0.34, filterType: 'lowpass', freqStart: 3200, freqEnd: 280 });
    playTone(rig, { type: 'triangle', startFreq: 165, endFreq: 34, duration: 0.24, volume: 0.36 });
    playTone(rig, { type: 'sawtooth', startFreq: 310, endFreq: 54, duration: 0.18, volume: 0.2, filterFreq: 1600 });
    playTone(rig, { type: 'square', startFreq: 1568, endFreq: 2093, duration: 0.16, volume: 0.12, delay: 0.015 });
    playTone(rig, { type: 'triangle', startFreq: 2093, endFreq: 2637, duration: 0.2, volume: 0.11, delay: 0.03 });
  },
  hitFire: (rig) => {
    playNoise(rig, { duration: 0.23, volume: 0.3, filterType: 'lowpass', freqStart: 2100, freqEnd: 240 });
    playNoise(rig, { duration: 0.18, volume: 0.16, delay: 0.04, filterType: 'highpass', freqStart: 2800, freqEnd: 1400 });
    playTone(rig, { type: 'sawtooth', startFreq: 190, endFreq: 48, duration: 0.2, volume: 0.22, filterFreq: 1100 });
  },
  hitElectric: (rig) => {
    playFmTone(rig, {
      carrierType: 'sawtooth',
      modType: 'square',
      carrierStart: 540,
      carrierEnd: 160,
      modFreq: 78,
      modDepth: 260,
      duration: 0.24,
      volume: 0.24,
    });
    playNoise(rig, { duration: 0.14, volume: 0.22, filterType: 'highpass', freqStart: 3200, freqEnd: 1600 });
    playTone(rig, { type: 'square', startFreq: 1240, endFreq: 420, duration: 0.08, volume: 0.12, delay: 0.05 });
  },
  hitIce: (rig) => {
    playNoise(rig, { duration: 0.12, volume: 0.22, filterType: 'highpass', freqStart: 3600, freqEnd: 1800 });
    playArpeggio(rig, [1760, 2349.3, 2793.8], 0.024, 0.14, 0.12, 'triangle');
    playTone(rig, { type: 'square', startFreq: 1318, endFreq: 880, duration: 0.12, volume: 0.09 });
  },
  meteorBounce: (rig) => {
    playTone(rig, { type: 'triangle', startFreq: 140, endFreq: 38, duration: 0.19, volume: 0.32 });
    playNoise(rig, { duration: 0.14, volume: 0.26, filterType: 'lowpass', freqStart: 1400, freqEnd: 220 });
    playTone(rig, { type: 'square', startFreq: 210, endFreq: 420, duration: 0.11, volume: 0.11, delay: 0.04 });
  },

  // ── Defense & Grabs ─────────────────────────────────────────────
  shield: (rig) => {
    playTone(rig, { type: 'triangle', startFreq: 920, endFreq: 620, duration: 0.1, volume: 0.18 });
    playTone(rig, { type: 'square', startFreq: 1380, endFreq: 980, duration: 0.07, volume: 0.08 });
    playNoise(rig, { duration: 0.05, volume: 0.12, filterType: 'bandpass', freqStart: 2200, freqEnd: 1400, q: 2.2 });
  },
  shieldBreak: (rig) => {
    playNoise(rig, { duration: 0.2, volume: 0.28, filterType: 'highpass', freqStart: 2800, freqEnd: 900 });
    playArpeggio(rig, [1975.5, 1480, 1108.7, 784], 0.032, 0.11, 0.13, 'square');
    playFmTone(rig, {
      carrierType: 'triangle',
      modType: 'sine',
      carrierStart: 620,
      carrierEnd: 180,
      modFreq: 18,
      modDepth: 80,
      duration: 0.34,
      volume: 0.18,
      delay: 0.07,
    });
  },
  armorClang: (rig) => {
    playFmTone(rig, {
      carrierType: 'square',
      modType: 'square',
      carrierStart: 760,
      carrierEnd: 520,
      modFreq: 315,
      modDepth: 220,
      duration: 0.18,
      volume: 0.2,
    });
    playTone(rig, { type: 'triangle', startFreq: 180, endFreq: 75, duration: 0.11, volume: 0.22 });
  },
  grab: (rig) => {
    playNoise(rig, { duration: 0.045, volume: 0.18, filterType: 'bandpass', freqStart: 1500, freqEnd: 700, q: 1.5 });
    playTone(rig, { type: 'square', startFreq: 320, endFreq: 520, duration: 0.06, volume: 0.13 });
    playTone(rig, { type: 'triangle', startFreq: 240, endFreq: 160, duration: 0.055, volume: 0.15, delay: 0.035 });
  },
  throwLaunch: (rig) => {
    playNoise(rig, { duration: 0.14, volume: 0.19, filterType: 'bandpass', freqStart: 900, freqEnd: 3200, q: 1.4 });
    playTone(rig, { type: 'sawtooth', startFreq: 220, endFreq: 680, duration: 0.14, volume: 0.14, filterFreq: 2000 });
    playTone(rig, { type: 'square', startFreq: 480, endFreq: 210, duration: 0.08, volume: 0.1, delay: 0.08 });
  },

  // ── Match Flow & UI ─────────────────────────────────────────────
  ko: (rig) => {
    playNoise(rig, { duration: 0.48, volume: 0.34, filterType: 'lowpass', freqStart: 2800, freqEnd: 160 });
    playTone(rig, { type: 'sawtooth', startFreq: 420, endFreq: 36, duration: 0.48, volume: 0.26, filterFreq: 1500 });
    playTone(rig, { type: 'triangle', startFreq: 150, endFreq: 28, duration: 0.42, volume: 0.34 });
    playTone(rig, { type: 'square', startFreq: 880, endFreq: 110, duration: 0.32, volume: 0.12, delay: 0.04 });
  },
  respawn: (rig) => {
    playArpeggio(rig, [523.25, 659.25, 783.99, 1046.5], 0.045, 0.12, 0.09, 'triangle');
  },
  victory: (rig) => {
    const melody = [523.25, 659.25, 783.99, 659.25, 1046.5];
    const delays = [0, 0.09, 0.18, 0.28, 0.38];
    const durs = [0.09, 0.09, 0.09, 0.09, 0.36];
    melody.forEach((freq, idx) => {
      playTone(rig, { type: 'square', startFreq: freq, endFreq: freq * 1.008, duration: durs[idx], volume: 0.14, delay: delays[idx], filterFreq: 3400 });
      playTone(rig, { type: 'triangle', startFreq: freq * 0.5, endFreq: freq * 0.5, duration: durs[idx], volume: 0.13, delay: delays[idx] });
    });
  },
  menuTick: (rig) => {
    playTone(rig, { type: 'square', startFreq: 680, endFreq: 960, duration: 0.045, volume: 0.09, filterFreq: 3200 });
  },
  menuConfirm: (rig) => {
    playTone(rig, { type: 'square', startFreq: 523.25, endFreq: 783.99, duration: 0.075, volume: 0.11, filterFreq: 3400 });
    playTone(rig, { type: 'square', startFreq: 783.99, endFreq: 1046.5, duration: 0.11, volume: 0.12, delay: 0.055, filterFreq: 3800 });
  },
  menuBack: (rig) => {
    playTone(rig, { type: 'triangle', startFreq: 560, endFreq: 310, duration: 0.09, volume: 0.13 });
    playTone(rig, { type: 'square', startFreq: 420, endFreq: 240, duration: 0.07, volume: 0.07, delay: 0.025 });
  },
  eraSwap: (rig) => {
    playArpeggio(rig, [392, 587.33, 783.99], 0.038, 0.09, 0.11, 'square');
    playNoise(rig, { duration: 0.04, volume: 0.12, filterType: 'bandpass', freqStart: 2400, freqEnd: 1200, q: 1.5 });
  },
};
