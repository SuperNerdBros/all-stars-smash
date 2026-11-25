'use client';

import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import type { SfxEvent } from '../../types/protocol';
import type { SoundTestState, AudioSettingUpdate } from '../../hooks/useSoundTest';
import {
  SFX_CATALOG,
  SFX_CATALOG_BY_ID,
  SFX_COMBO_SEQUENCES,
} from '../../io/sfxCatalog';
import { chiptuneAudio } from '../../io/chiptuneAudio';
import { SfxOscilloscope } from '../atoms/sfxOscilloscope';

export interface SoundTestInspectorProps {
  state: SoundTestState;
  onPlaySelected: () => void;
  onStep: (delta: -1 | 1) => void;
  onRunSequence: (sequenceId: string) => void;
  onUpdateAudio: (update: AudioSettingUpdate) => void;
}

export function SoundTestInspector(props: SoundTestInspectorProps): React.ReactElement {
  const { state, onPlaySelected, onStep, onRunSequence, onUpdateAudio } = props;
  const entry = SFX_CATALOG_BY_ID[state.selectedId];
  const mappedId = state.remaps[entry.id] ?? entry.id;
  const isRemapped = mappedId !== entry.id;
  const mappedEntry = SFX_CATALOG_BY_ID[mappedId];

  return React.createElement(
    'section',
    {
      'aria-label': 'Active Sound Console',
      className:
        'grid grid-cols-1 lg:grid-cols-12 gap-5 p-4 sm:p-5 bg-[#0D1326] border-[3px] border-black shadow-[6px_6px_0_#000]',
    },

    // Left column: Live Oscilloscope + Combat Sequence Demos
    React.createElement(
      'div',
      { className: 'lg:col-span-6 flex flex-col gap-3 justify-between' },
      React.createElement(SfxOscilloscope, {
        era: state.era,
        activeLabel: `${entry.code} · ${mappedEntry.name}`,
      }),
      React.createElement(
        'div',
        { className: 'flex flex-col gap-1.5' },
        React.createElement(
          'div',
          { className: 'text-xs font-semibold text-white/65' },
          'Preview combat chains',
        ),
        React.createElement(
          'div',
          { className: 'grid grid-cols-2 sm:grid-cols-4 gap-2' },
          ...SFX_COMBO_SEQUENCES.map((seq) => {
            const isRunning = state.activeSequenceId === seq.id;
            const btnClass = isRunning
              ? 'bg-[#FACC15] text-black border-black'
              : 'bg-[#161F38] hover:bg-[#1E2B4D] text-white border-black';
            return React.createElement(
              'button',
              {
                key: seq.id,
                type: 'button',
                onClick: () => onRunSequence(seq.id),
                title: seq.description,
                className: `min-h-[40px] px-2.5 py-1.5 border-2 font-display font-black text-xs tracking-wide whitespace-nowrap truncate cursor-pointer transition-colors inline-flex items-center justify-center gap-1.5 ${btnClass}`,
              },
              React.createElement(Sparkles, { className: 'w-3.5 h-3.5 shrink-0' }),
              React.createElement('span', { className: 'truncate' }, seq.label),
            );
          }),
        ),
      ),
    ),

    // Right column: Selected SFX Details, Playback Controls, and Event Remapper
    React.createElement(
      'div',
      { className: 'lg:col-span-6 flex flex-col justify-between gap-4' },
      React.createElement(
        'div',
        { className: 'flex flex-col gap-1.5' },
        React.createElement(
          'div',
          { className: 'flex items-center gap-2 text-xs font-mono text-white/65 tabular-nums' },
          React.createElement('span', { className: 'text-[#FACC15] font-bold' }, `Track ${entry.code} / ${SFX_CATALOG.length}`),
          React.createElement('span', { 'aria-hidden': 'true' }, '·'),
          React.createElement('span', null, `${entry.durationMs}ms`),
          React.createElement('span', { 'aria-hidden': 'true' }, '·'),
          React.createElement('span', { className: 'truncate' }, entry.synthSummary),
        ),
        React.createElement(
          'h2',
          { className: 'font-display font-black text-2xl sm:text-3xl text-white tracking-tight leading-tight' },
          entry.name,
        ),
        React.createElement(
          'p',
          { className: 'text-sm text-white/75 leading-snug' },
          `Gameplay trigger: ${entry.trigger}`,
        ),
      ),

      // Playback bar
      React.createElement(
        'div',
        { className: 'flex flex-wrap items-center gap-2' },
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: () => onStep(-1),
            'aria-label': 'Previous sound',
            className:
              'min-h-[44px] px-3.5 bg-[#161F38] hover:bg-[#1E2B4D] border-2 border-black text-white cursor-pointer inline-flex items-center justify-center',
          },
          React.createElement(ChevronLeft, { className: 'w-4 h-4' }),
        ),
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: onPlaySelected,
            className:
              'min-h-[44px] px-6 bg-[#FACC15] hover:bg-[#FDE047] border-2 border-black font-display font-black text-sm uppercase tracking-wide text-black cursor-pointer inline-flex items-center gap-2 whitespace-nowrap active:scale-95 transition-transform',
          },
          React.createElement(Play, { className: 'w-4 h-4 fill-current' }),
          'Play Sound',
        ),
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: () => onStep(1),
            'aria-label': 'Next sound',
            className:
              'min-h-[44px] px-3.5 bg-[#161F38] hover:bg-[#1E2B4D] border-2 border-black text-white cursor-pointer inline-flex items-center justify-center',
          },
          React.createElement(ChevronRight, { className: 'w-4 h-4' }),
        ),
        isRemapped
          ? React.createElement(
              'button',
              {
                type: 'button',
                onClick: () => chiptuneAudio.playSfx(entry.id, { bypassRemap: true, eraOverride: state.era }),
                className:
                  'min-h-[44px] px-3.5 bg-[#161F38] hover:bg-[#1E2B4D] border-2 border-black text-xs font-semibold text-white/85 cursor-pointer whitespace-nowrap',
              },
              'Hear Default',
            )
          : null,
      ),

      // Event-to-SFX Remapper
      React.createElement(
        'div',
        { className: 'pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center gap-2.5' },
        React.createElement(
          'label',
          {
            htmlFor: 'sfx-remap-select',
            className: 'text-xs font-semibold text-white/75 whitespace-nowrap shrink-0',
          },
          'Mapped Output',
        ),
        React.createElement(
          'div',
          { className: 'flex items-center gap-2 flex-1 min-w-0' },
          React.createElement(
            'select',
            {
              id: 'sfx-remap-select',
              value: mappedId,
              onChange: (event: React.ChangeEvent<HTMLSelectElement>) =>
                onUpdateAudio({
                  kind: 'remap',
                  source: entry.id,
                  target: event.target.value as SfxEvent,
                }),
              className:
                'flex-1 min-w-0 min-h-[40px] px-3 bg-[#060A14] border-2 border-white/20 focus:border-[#FACC15] outline-none text-xs sm:text-sm font-semibold text-white cursor-pointer',
            },
            ...SFX_CATALOG.map((opt) =>
              React.createElement(
                'option',
                { key: opt.id, value: opt.id },
                `${opt.code} · ${opt.name}${opt.id === entry.id ? ' (Default)' : ''}`,
              ),
            ),
          ),
          isRemapped
            ? React.createElement(
                'button',
                {
                  type: 'button',
                  onClick: () =>
                    onUpdateAudio({
                      kind: 'remap',
                      source: entry.id,
                      target: entry.id,
                    }),
                  title: 'Restore default sound for this trigger',
                  className:
                    'min-h-[40px] px-3 bg-[#7F1D1D] hover:bg-[#991B1B] border-2 border-black text-xs font-bold text-white cursor-pointer inline-flex items-center gap-1 whitespace-nowrap shrink-0',
                },
                React.createElement(RotateCcw, { className: 'w-3.5 h-3.5' }),
                'Reset',
              )
            : null,
        ),
      ),
    ),
  );
}
