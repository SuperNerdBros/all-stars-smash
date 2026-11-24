import type { SfxEvent } from '../types/protocol';

/**
 * Pure Web Audio API NES-style chiptune SFX synthesizer (pulse, triangle, noise).
 */
class ChiptuneAudioEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(next: boolean): void {
    this.muted = next;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public playMenuTick(): void {
    this.tone('square', 660, 880, 0.045, 0.06);
  }

  public playMenuConfirm(): void {
    this.tone('square', 523.25, 783.99, 0.07, 0.08, 0);
    this.tone('square', 783.99, 1046.5, 0.1, 0.08, 0.06);
  }

  public playSfx(event: SfxEvent): void {
    switch (event) {
      case 'jump':
        this.tone('square', 220, 520, 0.09, 0.08);
        break;
      case 'doubleJump':
        this.tone('square', 340, 740, 0.11, 0.08);
        break;
      case 'tripleJump':
        this.tone('square', 460, 980, 0.13, 0.09);
        this.tone('triangle', 680, 1180, 0.1, 0.07, 0.03);
        break;
      case 'wallJump':
        this.noiseBurst(0.035, 0.09);
        this.tone('square', 300, 820, 0.1, 0.09);
        break;
      case 'shoot':
        this.tone('square', 820, 260, 0.08, 0.07);
        break;
      case 'shield':
        this.tone('triangle', 580, 420, 0.07, 0.1);
        break;
      case 'hitLight':
        this.noiseBurst(0.06, 0.12);
        this.tone('square', 260, 120, 0.07, 0.09);
        break;
      case 'hitHeavy':
        this.noiseBurst(0.14, 0.18);
        this.tone('sawtooth', 190, 58, 0.15, 0.14);
        break;
      case 'ko':
        this.noiseBurst(0.28, 0.2);
        this.tone('sawtooth', 320, 48, 0.34, 0.15);
        break;
      case 'victory': {
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((n, idx) => {
          this.tone('square', n, n * 1.01, 0.14, 0.09, idx * 0.1);
        });
        break;
      }
    }
  }

  private tone(
    type: OscillatorType,
    startFreq: number,
    endFreq: number,
    duration: number,
    volume: number,
    delay = 0,
  ): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  private noiseBurst(duration: number, volume: number): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const gain = ctx.createGain();
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    src.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);
    src.stop(now + duration + 0.01);
  }
}

export const chiptuneAudio = new ChiptuneAudioEngine();
