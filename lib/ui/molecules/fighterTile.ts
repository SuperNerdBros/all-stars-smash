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

const TILE_BACKDROPS: Record<string, string> = {
  mario: 'linear-gradient(135deg, #EF4444 0%, #991B1B 58%, #1D4ED8 100%)',
  'donkey-kong': 'linear-gradient(135deg, #D97706 0%, #92400E 58%, #451A03 100%)',
  link: 'linear-gradient(135deg, #22C55E 0%, #15803D 58%, #0EA5E9 100%)',
  samus: 'linear-gradient(135deg, #F97316 0%, #C2410C 58%, #7F1D1D 100%)',
  kirby: 'linear-gradient(135deg, #F472B6 0%, #DB2777 62%, #831843 100%)',
  luigi: 'linear-gradient(135deg, #16A34A 0%, #166534 58%, #1E3A8A 100%)',
  bowser: 'linear-gradient(135deg, #EA580C 0%, #9A3412 55%, #166534 100%)',
  megaman: 'linear-gradient(135deg, #38BDF8 0%, #0284C7 58%, #1E3A8A 100%)',
  sonic: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 60%, #1E1B4B 100%)',
  simon: 'linear-gradient(135deg, #B45309 0%, #7C2D12 58%, #3B0764 100%)',
  'ryu-hayabusa': 'linear-gradient(135deg, #4F46E5 0%, #312E81 58%, #991B1B 100%)',
  pit: 'linear-gradient(135deg, #38BDF8 0%, #0369A1 55%, #F59E0B 100%)',
  'little-mac': 'linear-gradient(135deg, #10B981 0%, #065F46 58%, #111827 100%)',
  'spiky-time': 'linear-gradient(135deg, #F97316 0%, #DC2626 50%, #1D4ED8 100%)',
  'sir-ribbit': 'linear-gradient(135deg, #22C55E 0%, #15803D 52%, #B91C1C 100%)',
  'tin-can': 'linear-gradient(135deg, #F59E0B 0%, #B45309 55%, #0E7490 100%)',
  'cape-lord': 'linear-gradient(135deg, #9333EA 0%, #4C1D95 55%, #1E1B4B 100%)',
  'moon-knight': 'linear-gradient(135deg, #6366F1 0%, #312E81 55%, #0F172A 100%)',
  'jump-spear': 'linear-gradient(135deg, #2563EB 0%, #1E3A8A 55%, #991B1B 100%)',
  'job-hopper': 'linear-gradient(135deg, #38BDF8 0%, #1D4ED8 55%, #B91C1C 100%)',
  'esper-hair': 'linear-gradient(135deg, #EC4899 0%, #BE123C 55%, #059669 100%)',
  'train-suplex': 'linear-gradient(135deg, #FACC15 0%, #EA580C 52%, #1D4ED8 100%)',
  'laugh-clown': 'linear-gradient(135deg, #A855F7 0%, #DC2626 52%, #CA8A04 100%)',
};

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
  const bgGradient =
    TILE_BACKDROPS[fighter.id] ?? 'linear-gradient(135deg, #475569 0%, #1E293B 60%, #0F172A 100%)';

  return React.createElement(
    'button',
    {
      type: 'button',
      onClick: onSelect,
      style: { backgroundImage: bgGradient },
      className: [
        'group relative flex flex-col items-center justify-between overflow-hidden h-[70px] sm:h-[76px] lg:h-[78px] w-full cursor-pointer select-none transition-transform duration-100',
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
        sizePx: 50,
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
      style: {
        backgroundImage: 'linear-gradient(135deg, #FDE047 0%, #EAB308 55%, #CA8A04 100%)',
      },
      className:
        'group relative flex flex-col items-center justify-center overflow-hidden h-[70px] sm:h-[76px] lg:h-[78px] w-full cursor-pointer select-none hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
    },
    React.createElement(
      'span',
      {
        className:
          'font-display font-black text-4xl sm:text-5xl text-white leading-none transition-transform duration-100 group-hover:scale-110',
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
