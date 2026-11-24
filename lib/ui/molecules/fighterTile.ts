'use client';

import React from 'react';
import type { FighterBlueprint, GraphicsEra } from '../../types/fighter';
import type { PlayerControlType } from '../../types/protocol';
import { resolveFighterForEra } from '../../roster/eraResolver';
import { SpriteCanvas } from '../atoms/spriteCanvas';

export interface FighterTileProps {
  fighter: FighterBlueprint;
  graphicsEra: GraphicsEra;
  isP1: boolean;
  isP2: boolean;
  p2ControlType: PlayerControlType;
  p1PaletteIndex: number;
  p2PaletteIndex: number;
  onSelect: () => void;
}

const NAMEPLATE_SHADOW =
  '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0 2px 3px rgba(0,0,0,0.95)';

function resolveTilePaletteIndex(isP1: boolean, isP2: boolean, p1Idx: number, p2Idx: number): number {
  if (isP1) return p1Idx;
  if (isP2) return p2Idx;
  return 0;
}

function resolveRingStyle(isP1: boolean, isP2: boolean, p2Ctrl: PlayerControlType): string {
  if (isP1 && isP2) return 'ring-2 ring-inset ring-[#FACC15] z-10';
  if (isP1) return 'ring-2 ring-inset ring-[#EF4444] z-10';
  if (!isP2) return '';
  return p2Ctrl === 'cpu'
    ? 'ring-2 ring-inset ring-[#E5E7EB] z-10'
    : 'ring-2 ring-inset ring-[#3B82F6] z-10';
}

function renderP2Badge(p2ControlType: PlayerControlType): React.ReactElement {
  const isCpu = p2ControlType === 'cpu';
  return React.createElement(
    'span',
    {
      className: [
        'absolute top-1 right-1 z-[3] w-6 h-6 rounded-full border-2 font-display font-black text-[9px] flex items-center justify-center shadow-md',
        isCpu ? 'bg-[#D4D4D8] border-black text-black' : 'bg-[#2563EB] border-white text-white',
      ].join(' '),
    },
    isCpu ? 'CPU' : 'P2',
  );
}

export function FighterTile(props: FighterTileProps): React.ReactElement {
  const {
    fighter,
    graphicsEra,
    isP1,
    isP2,
    p2ControlType,
    p1PaletteIndex,
    p2PaletteIndex,
    onSelect,
  } = props;

  const resolved = resolveFighterForEra(fighter, graphicsEra);
  const activeIdx = resolveTilePaletteIndex(isP1, isP2, p1PaletteIndex, p2PaletteIndex);
  const safeIdx = activeIdx % Math.max(1, resolved.palettes.length);
  const palette = resolved.palettes[safeIdx]?.colors ?? resolved.palettes[0].colors;

  return React.createElement(
    'button',
    {
      type: 'button',
      onClick: onSelect,
      className: [
        'group relative flex flex-col items-center justify-between overflow-hidden h-[54px] sm:h-[58px] lg:h-[60px] w-full cursor-pointer select-none transition-transform duration-100',
        'border-[1.5px] border-black bg-gradient-to-b from-white/10 via-transparent to-black/50',
        'hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FACC15]',
        resolveRingStyle(isP1, isP2, p2ControlType),
      ].join(' '),
    },

    React.createElement('span', {
      'aria-hidden': 'true',
      className:
        'pointer-events-none block absolute -top-6 -left-6 w-24 h-24 bg-white/15 rotate-12 transition-opacity group-hover:opacity-100 opacity-75',
    }),

    React.createElement(
      'span',
      {
        className:
          'relative z-[1] flex-1 w-full flex items-center justify-center pt-0.5 transition-transform duration-100 group-hover:scale-110',
        style: { filter: 'drop-shadow(0 3px 3px rgba(0, 0, 0, 0.72))' },
      },
      React.createElement(SpriteCanvas, {
        pixelChart: resolved.pixelChart,
        palette,
        animState: isP1 || isP2 ? 'walk' : 'idle',
        sizePx: 40,
        animate: true,
      }),
    ),

    React.createElement(
      'span',
      {
        className:
          'relative z-[2] block w-full px-1 pb-0.5 text-center font-display font-black uppercase tracking-tight text-[11px] sm:text-xs leading-none text-white truncate',
        style: { textShadow: NAMEPLATE_SHADOW },
      },
      fighter.name,
    ),

    isP1
      ? React.createElement(
          'span',
          {
            className:
              'absolute top-1 left-1 z-[3] w-6 h-6 rounded-full bg-[#E11D2E] border-2 border-white text-white font-display font-black text-[10px] flex items-center justify-center shadow-md',
          },
          'P1',
        )
      : null,

    isP2 ? renderP2Badge(p2ControlType) : null,
  );
}

export interface RandomFighterTileProps {
  onSelectRandom: () => void;
}

export function RandomFighterTile(props: RandomFighterTileProps): React.ReactElement {
  return React.createElement(
    'button',
    {
      type: 'button',
      onClick: props.onSelectRandom,
      title: 'Select Random Fighter',
      className:
        'group relative flex flex-col items-center justify-center overflow-hidden h-[54px] sm:h-[58px] lg:h-[60px] w-full cursor-pointer select-none border-[1.5px] border-black bg-yellow-400/25 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
    },
    React.createElement(
      'span',
      {
        className:
          'font-display font-black text-3xl sm:text-4xl text-white leading-none transition-transform duration-100 group-hover:scale-110',
        style: {
          textShadow:
            '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 4px 6px rgba(0,0,0,0.6)',
        },
      },
      '?',
    ),
    React.createElement(
      'span',
      {
        className:
          'absolute bottom-0.5 inset-x-0 text-center font-display font-black uppercase text-[10px] tracking-wider text-white',
        style: { textShadow: NAMEPLATE_SHADOW },
      },
      'RANDOM',
    ),
  );
}
