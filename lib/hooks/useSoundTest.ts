'use client';

import { useEffect, useState } from 'react';
import type { GraphicsEra } from '../types/fighter';
import type { SfxEvent } from '../types/protocol';
import { chiptuneAudio, type SfxRemapTable } from '../io/chiptuneAudio';
import {
  SFX_CATALOG,
  SFX_COMBO_SEQUENCES,
  type SfxCategory,
} from '../io/sfxCatalog';

export type SoundTestFilter = 'all' | SfxCategory;

export interface SoundTestState {
  selectedId: SfxEvent;
  category: SoundTestFilter;
  volume: number;
  muted: boolean;
  era: GraphicsEra;
  remaps: SfxRemapTable;
  playingId: SfxEvent | null;
  activeSequenceId: string | null;
}

export type AudioSettingUpdate =
  | { kind: 'category'; category: SoundTestFilter }
  | { kind: 'volume'; volume: number }
  | { kind: 'toggleMute' }
  | { kind: 'era'; era: GraphicsEra }
  | { kind: 'remap'; source: SfxEvent; target: SfxEvent }
  | { kind: 'resetAllMaps' };

export function useSoundTest(initialEra: GraphicsEra, onSyncEra: (era: GraphicsEra) => void) {
  const [state, setState] = useState<SoundTestState>(() => ({
    selectedId: 'hitHeavy',
    category: 'all',
    volume: chiptuneAudio.getVolume(),
    muted: chiptuneAudio.isMuted(),
    era: initialEra,
    remaps: chiptuneAudio.getEventMappings(),
    playingId: null,
    activeSequenceId: null,
  }));

  useEffect(() => {
    chiptuneAudio.setEraProfile(state.era);
  }, [state.era]);

  const fireSound = (id: SfxEvent, bypassRemap: boolean) => {
    chiptuneAudio.playSfx(id, { bypassRemap, eraOverride: state.era });
    setState((prev) => ({ ...prev, selectedId: id, playingId: id }));
    window.setTimeout(() => {
      setState((prev) => (prev.playingId === id ? { ...prev, playingId: null } : prev));
    }, 240);
  };

  const selectSound = (id: SfxEvent, shouldPlay = true) => {
    if (shouldPlay) {
      fireSound(id, false);
    } else {
      setState((prev) => ({ ...prev, selectedId: id }));
    }
  };

  const stepSelection = (delta: -1 | 1) => {
    const visible = state.category === 'all'
      ? SFX_CATALOG
      : SFX_CATALOG.filter((item) => item.category === state.category);
    const list = visible.length > 0 ? visible : SFX_CATALOG;
    const currentIdx = list.findIndex((item) => item.id === state.selectedId);
    const safeIdx = currentIdx >= 0 ? currentIdx : 0;
    const next = list[(safeIdx + delta + list.length) % list.length];
    if (next) fireSound(next.id, false);
  };

  const runSequence = (sequenceId: string) => {
    const preset = SFX_COMBO_SEQUENCES.find((s) => s.id === sequenceId);
    if (!preset) return;
    setState((prev) => ({ ...prev, activeSequenceId: sequenceId }));
    const maxDelay = preset.steps.reduce((acc, step) => Math.max(acc, step.delayMs), 0);
    preset.steps.forEach((step) => {
      window.setTimeout(() => {
        chiptuneAudio.playSfx(step.event, { eraOverride: state.era });
        setState((prev) => ({ ...prev, selectedId: step.event, playingId: step.event }));
      }, step.delayMs);
    });
    window.setTimeout(() => {
      setState((prev) => ({ ...prev, playingId: null, activeSequenceId: null }));
    }, maxDelay + 360);
  };

  const updateAudio = (update: AudioSettingUpdate) => {
    if (update.kind === 'category') {
      chiptuneAudio.playMenuTick();
      setState((prev) => ({ ...prev, category: update.category }));
    } else if (update.kind === 'volume') {
      chiptuneAudio.setVolume(update.volume);
      if (state.muted && update.volume > 0) chiptuneAudio.setMuted(false);
      setState((prev) => ({ ...prev, volume: update.volume, muted: update.volume === 0 }));
    } else if (update.kind === 'toggleMute') {
      const nextMuted = chiptuneAudio.toggleMute();
      setState((prev) => ({ ...prev, muted: nextMuted }));
      if (!nextMuted) chiptuneAudio.playMenuTick();
    } else if (update.kind === 'era') {
      chiptuneAudio.setEraProfile(update.era);
      chiptuneAudio.playEraSwap();
      onSyncEra(update.era);
      setState((prev) => ({ ...prev, era: update.era }));
    } else if (update.kind === 'remap') {
      chiptuneAudio.setEventMapping(update.source, update.target);
      const nextRemaps = chiptuneAudio.getEventMappings();
      setState((prev) => ({ ...prev, remaps: nextRemaps }));
      fireSound(update.source, false);
    } else {
      chiptuneAudio.resetEventMappings();
      chiptuneAudio.playMenuBack();
      setState((prev) => ({ ...prev, remaps: {} }));
    }
  };

  return { state, selectSound, stepSelection, runSequence, updateAudio };
}
