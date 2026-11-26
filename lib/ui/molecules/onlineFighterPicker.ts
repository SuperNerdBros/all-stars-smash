'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Play, Shuffle, X } from 'lucide-react';
import type { FighterBlueprint, GraphicsEra } from '../../types/fighter';
import { chiptuneAudio } from '../../io/chiptuneAudio';
import { resolveFighterForEra } from '../../roster/eraResolver';
import { SpriteCanvas } from '../atoms/spriteCanvas';

export interface OnlineFighterPickerProps {
  roster: readonly FighterBlueprint[];
  selectedFighterId: string;
  selectedPaletteIndex: number;
  graphicsEra: GraphicsEra;
  isHost: boolean;
  onSelect: (fighterId: string, paletteIndex: number) => void;
  onApplyRestart?: () => void;
  onClose: () => void;
}

const INK = '#0B0B0F';

export function OnlineFighterPicker(props: OnlineFighterPickerProps): React.ReactElement {
  const {
    roster,
    selectedFighterId,
    selectedPaletteIndex,
    graphicsEra,
    isHost,
    onSelect,
    onApplyRestart,
    onClose,
  } = props;

  const selectedFighter = roster.find((fighter) => fighter.id === selectedFighterId) ?? roster[0];
  const resolvedSelected = resolveFighterForEra(selectedFighter, graphicsEra);
  const paletteCount = Math.max(1, resolvedSelected.palettes.length);
  const safePaletteIndex = ((selectedPaletteIndex % paletteCount) + paletteCount) % paletteCount;
  const activePalette = resolvedSelected.palettes[safePaletteIndex] ?? resolvedSelected.palettes[0];

  const handleCyclePalette = (delta: number) => {
    chiptuneAudio.playMenuTick();
    const nextPalette = (safePaletteIndex + delta + paletteCount) % paletteCount;
    onSelect(selectedFighter.id, nextPalette);
  };

  const handleSelectFighter = (fighterId: string) => {
    chiptuneAudio.playMenuTick();
    onSelect(fighterId, 0);
  };

  const handlePickRandom = () => {
    if (roster.length === 0) return;
    chiptuneAudio.playMenuTick();
    const randomFighter = roster[Math.floor(Math.random() * roster.length)];
    onSelect(randomFighter.id, 0);
  };

  const handleApplyAndClose = () => {
    chiptuneAudio.playMenuConfirm();
    onApplyRestart?.();
    onClose();
  };

  return React.createElement(
    'div',
    {
      className: 'fixed inset-0 z-40 bg-[#070B16]/82 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6',
      onClick: onClose,
    },
    React.createElement(
      'div',
      {
        onClick: (e: React.MouseEvent) => e.stopPropagation(),
        className:
          'w-full max-w-2xl max-h-[88dvh] bg-[#111827] border-[3px] shadow-[8px_8px_0_#0B0B0F] text-white flex flex-col overflow-hidden',
        style: { borderColor: INK },
      },
      React.createElement(
        'div',
        {
          className: 'flex items-center justify-between px-3.5 py-2.5 bg-[#2563EB] border-b-[3px]',
          style: { borderColor: INK },
        },
        React.createElement(
          'div',
          { className: 'font-display font-black uppercase text-sm tracking-wide' },
          'Change Fighter',
        ),
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: onClose,
            'aria-label': 'Close fighter picker',
            className: 'p-1 bg-black/40 hover:bg-black/70 border border-black cursor-pointer',
          },
          React.createElement(X, { className: 'w-4 h-4' }),
        ),
      ),
      React.createElement(
        'div',
        {
          className: 'flex flex-wrap items-center justify-between gap-3 px-3.5 py-3 bg-[#0B1020] border-b-2 border-white/10',
        },
        React.createElement(
          'div',
          { className: 'flex items-center gap-3 min-w-0' },
          React.createElement(
            'div',
            { className: 'w-14 h-14 bg-[#1E293B] border-2 border-[#FACC15] flex items-center justify-center shrink-0' },
            React.createElement(SpriteCanvas, {
              pixelChart: resolvedSelected.pixelChart,
              palette: activePalette,
              animState: 'idle',
              sizePx: 48,
              animate: true,
            }),
          ),
          React.createElement(
            'div',
            { className: 'min-w-0' },
            React.createElement(
              'div',
              { className: 'font-display font-black uppercase text-base text-[#FDE047] truncate' },
              selectedFighter.name,
            ),
            React.createElement(
              'div',
              { className: 'text-[11px] text-white/65' },
              'Takes effect on the next match.',
            ),
          ),
        ),
        React.createElement(
          'div',
          { className: 'flex items-center gap-1.5' },
          React.createElement(
            'button',
            {
              type: 'button',
              onClick: () => handleCyclePalette(-1),
              'aria-label': 'Previous color palette',
              className: 'p-1.5 bg-[#1E293B] hover:bg-[#334155] border-2 border-black cursor-pointer',
            },
            React.createElement(ChevronLeft, { className: 'w-4 h-4' }),
          ),
          React.createElement(
            'span',
            { className: 'px-2 text-[11px] font-mono font-bold text-white/85 whitespace-nowrap' },
            `Color ${safePaletteIndex + 1}/${paletteCount}`,
          ),
          React.createElement(
            'button',
            {
              type: 'button',
              onClick: () => handleCyclePalette(1),
              'aria-label': 'Next color palette',
              className: 'p-1.5 bg-[#1E293B] hover:bg-[#334155] border-2 border-black cursor-pointer',
            },
            React.createElement(ChevronRight, { className: 'w-4 h-4' }),
          ),
          React.createElement(
            'button',
            {
              type: 'button',
              onClick: handlePickRandom,
              title: 'Random fighter',
              className:
                'ml-1 flex items-center gap-1 px-2.5 py-1.5 bg-[#F97316] hover:bg-[#EA580C] border-2 border-black font-display font-black uppercase text-[10px] cursor-pointer',
            },
            React.createElement(Shuffle, { className: 'w-3.5 h-3.5' }),
            'Random',
          ),
        ),
      ),
      React.createElement(
        'div',
        { className: 'flex-1 overflow-y-auto p-3 grid grid-cols-3 sm:grid-cols-5 gap-2' },
        ...roster.map((fighter) => {
          const isSelected = fighter.id === selectedFighter.id;
          const resolved = resolveFighterForEra(fighter, graphicsEra);
          const previewPalette = isSelected ? activePalette : resolved.palettes[0];
          return React.createElement(
            'button',
            {
              key: fighter.id,
              type: 'button',
              onClick: () => handleSelectFighter(fighter.id),
              className: [
                'flex flex-col items-center justify-center gap-1 p-2 border-2 transition-colors cursor-pointer touch-manipulation',
                isSelected
                  ? 'bg-[#1D4ED8]/45 border-[#FACC15] text-[#FDE047]'
                  : 'bg-black/40 hover:bg-white/10 border-white/15 text-white/90',
              ].join(' '),
            },
            React.createElement(SpriteCanvas, {
              pixelChart: resolved.pixelChart,
              palette: previewPalette,
              animState: 'idle',
              sizePx: 40,
              animate: false,
            }),
            React.createElement(
              'span',
              { className: 'w-full truncate text-center font-display font-bold uppercase text-[10px] leading-tight' },
              fighter.name,
            ),
          );
        }),
      ),
      React.createElement(
        'div',
        {
          className: 'flex items-center justify-end gap-2 px-3.5 py-2.5 bg-[#0B1020] border-t-2 border-white/10',
        },
        isHost && onApplyRestart
          ? React.createElement(
              'button',
              {
                type: 'button',
                onClick: handleApplyAndClose,
                className:
                  'flex items-center gap-1.5 px-3 py-2 bg-[#22C55E] hover:bg-[#16A34A] border-2 border-black font-display font-black uppercase text-xs text-white cursor-pointer',
              },
              React.createElement(Play, { className: 'w-3.5 h-3.5' }),
              'Apply & Restart',
            )
          : null,
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: onClose,
            className:
              'px-3.5 py-2 bg-[#374151] hover:bg-[#4B5563] border-2 border-black font-display font-black uppercase text-xs text-white cursor-pointer',
          },
          'Done',
        ),
      ),
    ),
  );
}
