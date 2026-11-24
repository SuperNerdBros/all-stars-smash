'use client';

import React from 'react';
import type { FighterBlueprint } from '../../types/fighter';
import { SpriteCanvas } from '../atoms/spriteCanvas';

export interface FighterTileProps {
  fighter: FighterBlueprint;
  isP1: boolean;
  isP2: boolean;
  p1PaletteIndex: number;
  p2PaletteIndex: number;
  onSelect: () => void;
  onOpenForge?: () => void;
}

export function FighterTile(props: FighterTileProps): React.ReactElement {
  const {
    fighter,
    isP1,
    isP2,
    p1PaletteIndex,
    p2PaletteIndex,
    onSelect,
  } = props;

  const activePaletteIdx = isP1 ? p1PaletteIndex : isP2 ? p2PaletteIndex : 0;
  const palette = fighter.palettes[activePaletteIdx]?.colors ?? fighter.palettes[0].colors;

  let borderClass = 'border-[#2B3858] hover:border-[#4B6194]';
  if (isP1 && isP2) borderClass = 'border-[#F59E0B] ring-1 ring-[#F59E0B]/50';
  else if (isP1) borderClass = 'border-[#EF4444] ring-1 ring-[#EF4444]/40';
  else if (isP2) borderClass = 'border-[#3B82F6] ring-1 ring-[#3B82F6]/40';

  const slotLabel = isP1 && isP2 ? 'P1 · P2' : isP1 ? 'P1' : isP2 ? 'P2' : null;
  const slotColor =
    isP1 && isP2 ? 'text-[#F59E0B]' : isP1 ? 'text-[#EF4444]' : 'text-[#3B82F6]';

  return React.createElement(
    'button',
    {
      type: 'button',
      onClick: onSelect,
      className: [
        'group relative flex flex-col items-center p-4 rounded-lg bg-[#141C2F] border transition-all duration-150 text-left w-full cursor-pointer',
        'hover:bg-[#1A243D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]',
        borderClass,
      ].join(' '),
    },
    slotLabel
      ? React.createElement(
          'span',
          {
            className: `absolute top-2.5 right-3 font-mono text-xs font-bold tracking-wider ${slotColor}`,
          },
          slotLabel,
        )
      : null,
    React.createElement(
      'div',
      {
        className:
          'w-20 h-20 flex items-center justify-center rounded-md bg-[#0B1020] mb-3 transition-transform duration-150 group-hover:scale-105',
      },
      React.createElement(SpriteCanvas, {
        pixelChart: fighter.pixelChart,
        palette,
        animState: isP1 || isP2 ? 'walk' : 'idle',
        sizePx: 64,
        animate: true,
      }),
    ),
    React.createElement(
      'div',
      { className: 'w-full text-center' },
      React.createElement(
        'div',
        { className: 'font-display font-bold text-base text-[#F1F5F9] truncate' },
        fighter.name,
      ),
      React.createElement(
        'div',
        { className: 'text-xs text-[#94A3B8] mt-0.5 truncate' },
        `${fighter.era} · ${fighter.archetypeLabel}`,
      ),
    ),
  );
}
