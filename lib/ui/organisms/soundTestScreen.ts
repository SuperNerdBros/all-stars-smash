'use client';

import React, { useEffect } from 'react';
import {
  ArrowLeft,
  RotateCcw,
} from 'lucide-react';
import type { GraphicsEra } from '../../types/fighter';
import { chiptuneAudio } from '../../io/chiptuneAudio';
import {
  SFX_CATALOG,
  SFX_CATALOG_BY_ID,
  SFX_CATEGORIES,
} from '../../io/sfxCatalog';
import { useSoundTest } from '../../hooks/useSoundTest';
import { AudioMixerControls } from '../molecules/audioMixerControls';
import { SoundTestInspector } from '../molecules/soundTestInspector';

export interface SoundTestScreenProps {
  graphicsEra: GraphicsEra;
  onSetEra: (era: GraphicsEra) => void;
  onBack: () => void;
}

export function SoundTestScreen(props: SoundTestScreenProps): React.ReactElement {
  const { graphicsEra, onSetEra, onBack } = props;
  const { state, selectSound, stepSelection, runSequence, updateAudio } = useSoundTest(graphicsEra, onSetEra);

  const visibleCatalog = state.category === 'all'
    ? SFX_CATALOG
    : SFX_CATALOG.filter((entry) => entry.category === state.category);
  const customRemapCount = Object.keys(state.remaps).length;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const targetTag = (event.target as HTMLElement | null)?.tagName;
      const isFormInput = targetTag === 'SELECT' || targetTag === 'INPUT';
      if (isFormInput) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        chiptuneAudio.playMenuBack();
        onBack();
      } else if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        selectSound(state.selectedId, true);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        stepSelection(1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        stepSelection(-1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selectedId, state.category, state.era]);

  return React.createElement(
    'div',
    {
      className:
        'min-h-screen w-screen bg-[#070B14] text-white flex flex-col overflow-x-hidden select-none',
    },

    // Top Console Header Bar
    React.createElement(
      'header',
      {
        className:
          'sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-2.5 bg-[#C81D25] border-b-4 border-black',
      },
      React.createElement(
        'div',
        { className: 'flex items-center gap-3' },
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: () => {
              chiptuneAudio.playMenuBack();
              onBack();
            },
            className:
              'min-h-[40px] inline-flex items-center gap-1.5 px-3 bg-[#7F1D1D] hover:bg-[#991B1B] border-2 border-black text-xs font-black uppercase text-white cursor-pointer whitespace-nowrap',
          },
          React.createElement(ArrowLeft, { className: 'w-4 h-4' }),
          'Back',
        ),
        React.createElement(
          'div',
          { className: '-skew-x-12 bg-[#FACC15] border-[3px] border-black px-4 py-1 text-black shadow-sm' },
          React.createElement(
            'h1',
            { className: 'skew-x-12 font-display font-black text-sm sm:text-base tracking-tight whitespace-nowrap' },
            'Sound Test',
          ),
        ),
      ),

      React.createElement(
        'div',
        { className: 'flex flex-wrap items-center gap-2.5' },

        // Dual BGM + SFX Volume & Mute Controls
        React.createElement(AudioMixerControls, { variant: 'compact' }),

        // NES / SNES-SEGA Audio Timbre Toggle
        React.createElement(
          'div',
          {
            role: 'group',
            'aria-label': 'Audio Era Timbre',
            className: 'flex items-center -skew-x-12 bg-black p-[3px] border-2 border-black',
          },
          React.createElement(
            'button',
            {
              type: 'button',
              onClick: () => updateAudio({ kind: 'era', era: 'NES' }),
              className: [
                'px-3 py-1 text-xs font-display font-black tracking-wide transition-colors cursor-pointer whitespace-nowrap',
                state.era === 'NES' ? 'bg-[#EF4444] text-white' : 'bg-[#18181B] text-[#A1A1AA] hover:text-white',
              ].join(' '),
            },
            React.createElement('span', { className: 'inline-block skew-x-12' }, 'NES 8-BIT'),
          ),
          React.createElement(
            'button',
            {
              type: 'button',
              onClick: () => updateAudio({ kind: 'era', era: 'SNES_SEGA' }),
              className: [
                'px-3 py-1 text-xs font-display font-black tracking-wide transition-colors cursor-pointer whitespace-nowrap',
                state.era === 'SNES_SEGA' ? 'bg-[#3B82F6] text-white' : 'bg-[#18181B] text-[#A1A1AA] hover:text-white',
              ].join(' '),
            },
            React.createElement('span', { className: 'inline-block skew-x-12' }, 'SNES / SEGA'),
          ),
        ),

        customRemapCount > 0
          ? React.createElement(
              'button',
              {
                type: 'button',
                onClick: () => updateAudio({ kind: 'resetAllMaps' }),
                className:
                  'min-h-[36px] inline-flex items-center gap-1.5 px-3 bg-[#7F1D1D] hover:bg-[#991B1B] border-2 border-black text-xs font-bold text-white cursor-pointer whitespace-nowrap',
              },
              React.createElement(RotateCcw, { className: 'w-3.5 h-3.5' }),
              `Reset Maps (${customRemapCount})`,
            )
          : null,
      ),
    ),

    // Main Sound Test Studio Body
    React.createElement(
      'main',
      { className: 'flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col gap-5' },

      // Focal Console Inspector + Oscilloscope
      React.createElement(SoundTestInspector, {
        state,
        onPlaySelected: () => selectSound(state.selectedId, true),
        onStep: stepSelection,
        onRunSequence: runSequence,
        onUpdateAudio: updateAudio,
      }),

      // Interactive Category Filter Bar
      React.createElement(
        'div',
        { className: 'flex flex-wrap items-center justify-between gap-3' },
        React.createElement(
          'div',
          {
            role: 'tablist',
            'aria-label': 'Sound Categories',
            className: 'flex flex-wrap items-center gap-1.5',
          },
          ...SFX_CATEGORIES.map((cat) => {
            const isSelected = state.category === cat.id;
            const count = cat.id === 'all'
              ? SFX_CATALOG.length
              : SFX_CATALOG.filter((item) => item.category === cat.id).length;
            const tabClass = isSelected
              ? 'bg-[#FACC15] text-black border-black'
              : 'bg-[#111827] hover:bg-[#1E293B] text-white/80 border-black';
            return React.createElement(
              'button',
              {
                key: cat.id,
                type: 'button',
                role: 'tab',
                'aria-selected': isSelected,
                onClick: () => updateAudio({ kind: 'category', category: cat.id }),
                className: `min-h-[40px] px-3.5 py-1.5 border-2 font-display font-black text-xs tracking-wide whitespace-nowrap cursor-pointer transition-colors ${tabClass}`,
              },
              `${cat.label} (${count})`,
            );
          }),
        ),
        React.createElement(
          'div',
          { className: 'text-xs font-mono text-white/55 hidden md:block' },
          'Click any pad to audition · Space replays · Left/Right steps',
        ),
      ),

      // Interactive Arcade Sound Pads Grid
      React.createElement(
        'section',
        {
          'aria-label': 'Sound Effect Pads',
          className: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5 pb-16',
        },
        ...visibleCatalog.map((entry) => {
          const isSelected = state.selectedId === entry.id;
          const isFiring = state.playingId === entry.id;
          const mappedTarget = state.remaps[entry.id];
          const padBorder = isSelected ? 'border-[#FACC15] bg-[#17213B]' : 'border-black bg-[#0E1529] hover:bg-[#16203B]';
          const padScale = isFiring ? 'scale-[0.97]' : '';

          return React.createElement(
            'button',
            {
              key: entry.id,
              type: 'button',
              onClick: () => selectSound(entry.id, true),
              className: `min-h-[78px] p-3 border-2 text-left flex flex-col justify-between gap-1.5 cursor-pointer transition-transform ${padBorder} ${padScale}`,
            },
            React.createElement(
              'div',
              { className: 'flex items-center justify-between gap-2 w-full' },
              React.createElement(
                'span',
                {
                  className: isSelected
                    ? 'font-mono text-xs font-black tabular-nums text-[#FACC15]'
                    : 'font-mono text-xs font-bold tabular-nums text-white/50',
                },
                entry.code,
              ),
              mappedTarget
                ? React.createElement(
                    'span',
                    { className: 'font-mono text-[10px] font-bold text-[#38BDF8] truncate' },
                    `→ ${SFX_CATALOG_BY_ID[mappedTarget].code}`,
                  )
                : React.createElement(
                    'span',
                    { className: 'font-mono text-[10px] tabular-nums text-white/40' },
                    `${entry.durationMs}ms`,
                  ),
            ),
            React.createElement(
              'div',
              { className: 'font-display font-black text-sm text-white leading-tight truncate' },
              entry.name,
            ),
            React.createElement(
              'div',
              { className: 'text-[11px] text-white/60 leading-tight truncate' },
              entry.trigger,
            ),
          );
        }),
      ),
    ),
  );
}
