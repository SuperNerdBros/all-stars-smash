'use client';

import { useSyncExternalStore } from 'react';
import { audioMixer, type AudioMixerSnapshot } from '../io/audioMixer';
import { chiptuneAudio } from '../io/chiptuneAudio';

export function useAudioMixer() {
  const mixer: AudioMixerSnapshot = useSyncExternalStore(
    audioMixer.subscribe,
    audioMixer.getSnapshot,
    audioMixer.getServerSnapshot,
  );

  const setBgmVolume = (pct: number) => {
    audioMixer.setBgmVolume(pct);
  };

  const toggleBgmMute = () => {
    audioMixer.toggleBgmMute();
  };

  const setSfxVolume = (pct: number) => {
    audioMixer.setSfxVolume(pct);
  };

  const toggleSfxMute = () => {
    const nextMuted = audioMixer.toggleSfxMute();
    if (!nextMuted) chiptuneAudio.playMenuTick();
  };

  return { mixer, setBgmVolume, toggleBgmMute, setSfxVolume, toggleSfxMute };
}
