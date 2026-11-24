'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Cpu, Gamepad2, Paintbrush } from 'lucide-react';
import type { FighterBlueprint, GraphicsEra } from '../../types/fighter';
import type { CpuDifficulty, PlayerSlotConfig } from '../../types/protocol';
import { resolveFighterForEra } from '../../roster/eraResolver';
import { SpriteCanvas } from '../atoms/spriteCanvas';

export interface PlayerSlotCardProps {
  slot: 0 | 1;
  isActiveSlot: boolean;
  graphicsEra: GraphicsEra;
  config: PlayerSlotConfig;
  fighter: FighterBlueprint;
  onFocusSlot: () => void;
  onCyclePalette: (delta: number) => void;
  onToggleControlType?: () => void;
  onCycleCpuDifficulty?: (diff: CpuDifficulty) => void;
  onOpenForge: () => void;
}

interface SlotTheme {
  primary: string;
  dark: string;
  light: string;
  tag: string;
  plateLabel: string;
}

const CPU_LEVEL_MAP: Record<CpuDifficulty, { level: string; next: CpuDifficulty }> = {
  easy: { level: '3', next: 'normal' },
  normal: { level: '6', next: 'hard' },
  hard: { level: '9', next: 'easy' },
};

const HARD_OUTLINE =
  '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 4px 6px rgba(0,0,0,0.65)';

function resolveSlotTheme(isP1: boolean, isCpu: boolean): SlotTheme {
  if (isP1) {
    return { primary: '#E11D2E', dark: '#B91C1C', light: '#FCA5A5', tag: 'P1', plateLabel: 'Player 1' };
  }
  if (isCpu) {
    return { primary: '#9CA3AF', dark: '#6B7280', light: '#E5E7EB', tag: 'CPU', plateLabel: 'CPU' };
  }
  return { primary: '#2563EB', dark: '#1D4ED8', light: '#93C5FD', tag: 'P2', plateLabel: 'Player 2' };
}

function renderSlotControls(
  isP1: boolean,
  isCpu: boolean,
  theme: SlotTheme,
  cpuDiff: CpuDifficulty,
  onToggleControlType?: () => void,
  onCycleCpuDifficulty?: (diff: CpuDifficulty) => void,
): React.ReactElement {
  const cpuInfo = CPU_LEVEL_MAP[cpuDiff];
  const plate =
    isCpu && onCycleCpuDifficulty
      ? React.createElement(
          'button',
          {
            type: 'button',
            onClick: () => onCycleCpuDifficulty(cpuInfo.next),
            title: 'Click to change CPU Level (Lv. 3 / Lv. 6 / Lv. 9)',
            className:
              'w-full flex items-center justify-between px-3 py-1 bg-[#27272A] hover:bg-[#3F3F46] border-2 border-black text-white font-display font-bold text-sm cursor-pointer',
          },
          React.createElement('span', { className: 'tracking-wide' }, 'CPU Lv.'),
          React.createElement(
            'span',
            { className: 'font-mono font-black text-base text-[#5EEAD4] tabular-nums', style: { textShadow: '1px 1px 0 #000' } },
            cpuInfo.level,
          ),
        )
      : React.createElement(
          'div',
          {
            className:
              'w-full px-3 py-1 border-2 border-black text-center font-display font-extrabold text-sm text-black tracking-wide',
            style: { backgroundColor: theme.light },
          },
          theme.plateLabel,
        );

  const footerLeft =
    !isP1 && onToggleControlType
      ? React.createElement(
          'button',
          {
            type: 'button',
            onClick: onToggleControlType,
            title: 'Toggle CPU / Local 2P',
            className: 'inline-flex items-center gap-1.5 text-xs font-bold text-white/95 hover:text-[#FACC15] cursor-pointer',
          },
          isCpu ? React.createElement(Cpu, { className: 'w-4 h-4' }) : React.createElement(Gamepad2, { className: 'w-4 h-4' }),
          isCpu ? 'Switch to 2P' : 'Switch to CPU',
        )
      : React.createElement(
          'div',
          { className: 'inline-flex items-center gap-1.5 text-xs font-bold text-white/95' },
          React.createElement(Gamepad2, { className: 'w-4 h-4' }),
          React.createElement('span', { className: 'hidden sm:inline' }, 'Ready'),
        );

  return React.createElement(
    'div',
    { className: 'flex flex-col gap-1.5', onClick: (e: React.MouseEvent) => e.stopPropagation() },
    plate,
    React.createElement(
      'div',
      {
        className: 'w-full flex items-center justify-between px-3 py-1 border-2 border-black text-white',
        style: { backgroundColor: theme.dark },
      },
      footerLeft,
      React.createElement(
        'span',
        { className: 'font-display font-black text-xl leading-none tracking-wider', style: { textShadow: '2px 2px 0 #000' } },
        theme.tag,
      ),
    ),
  );
}

/**
 * Official Super Smash Bros. Ultimate bottom split fighter showcase card.
 */
export function PlayerSlotCard(props: PlayerSlotCardProps): React.ReactElement {
  const {
    slot, isActiveSlot, graphicsEra, config, fighter,
    onFocusSlot, onCyclePalette, onToggleControlType, onCycleCpuDifficulty, onOpenForge,
  } = props;

  const resolved = resolveFighterForEra(fighter, graphicsEra);
  const isP1 = slot === 0;
  const isCpu = !isP1 && config.controlType === 'cpu';
  const safePalIdx = config.paletteIndex % Math.max(1, resolved.palettes.length);
  const preset = resolved.palettes[safePalIdx] ?? resolved.palettes[0];
  const theme = resolveSlotTheme(isP1, isCpu);

  return React.createElement(
    'div',
    {
      onClick: onFocusSlot,
      className: [
        'relative cursor-pointer select-none transition-transform duration-150',
        isActiveSlot ? 'scale-[1.01] z-10' : 'opacity-95 hover:opacity-100',
      ].join(' '),
      style: {
        filter: isActiveSlot
          ? 'drop-shadow(0 0 0 #000) drop-shadow(0 6px 16px rgba(0,0,0,0.65))'
          : 'drop-shadow(0 4px 10px rgba(0,0,0,0.5))',
      },
    },
    React.createElement(
      'div',
      {
        className: 'relative p-[4px] bg-black',
        style: {
          clipPath: 'polygon(24px 0, 100% 0, 100% 100%, 0 100%, 0 24px)',
          boxShadow: isActiveSlot ? 'inset 0 0 0 2px #FACC15' : undefined,
        },
      },
      isActiveSlot
        ? React.createElement('div', {
            'aria-hidden': 'true',
            className: 'pointer-events-none absolute inset-0 border-2 border-[#FACC15] z-20',
            style: { clipPath: 'polygon(24px 0, 100% 0, 100% 100%, 0 100%, 0 24px)' },
          })
        : null,
      React.createElement(
        'div',
        {
          className: 'relative overflow-hidden h-[178px] sm:h-[196px] flex items-stretch bg-[#E2E8F0]',
          style: { clipPath: 'polygon(21px 0, 100% 0, 100% 100%, 0 100%, 0 21px)' },
        },
        React.createElement('div', {
          'aria-hidden': 'true',
          className: 'absolute inset-0 pointer-events-none',
          style: { background: `linear-gradient(112deg, #F1F5F9 0%, #CBD5E1 36%, ${theme.primary} 36.4%, ${theme.primary} 100%)` },
        }),
        React.createElement(
          'div',
          {
            'aria-hidden': 'true',
            className: 'pointer-events-none absolute right-5 top-2 font-display font-black text-[76px] leading-none uppercase opacity-15 text-black select-none',
          },
          fighter.name.slice(0, 2),
        ),
        React.createElement(
          'div',
          {
            className: 'relative z-[2] w-[42%] sm:w-[40%] flex items-end justify-center pb-2 pl-2',
            style: { filter: 'drop-shadow(0 6px 8px rgba(0, 0, 0, 0.5))' },
          },
          React.createElement(SpriteCanvas, {
            pixelChart: resolved.pixelChart,
            palette: preset.colors,
            animState: isActiveSlot ? 'walk' : 'idle',
            sizePx: 128,
            flipX: !isP1,
            animate: true,
          }),
        ),
        React.createElement(
          'div',
          { className: 'relative z-[3] flex-1 flex flex-col justify-between py-2.5 pr-4 pl-2 min-w-0' },
          React.createElement(
            'div',
            { className: 'flex items-center justify-end gap-1.5', onClick: (e: React.MouseEvent) => e.stopPropagation() },
            React.createElement(
              'div',
              { className: 'inline-flex items-center bg-black/55 border border-black/80 rounded-xs px-1 py-0.5 text-[11px] font-semibold text-white' },
              React.createElement('button', { type: 'button', onClick: () => onCyclePalette(-1), 'aria-label': 'Previous color palette', className: 'p-0.5 hover:text-[#FACC15] cursor-pointer' }, React.createElement(ChevronLeft, { className: 'w-3.5 h-3.5' })),
              React.createElement('span', { className: 'px-1.5 max-w-[110px] truncate text-[10px] sm:text-[11px]' }, preset.name),
              React.createElement('button', { type: 'button', onClick: () => onCyclePalette(1), 'aria-label': 'Next color palette', className: 'p-0.5 hover:text-[#FACC15] cursor-pointer' }, React.createElement(ChevronRight, { className: 'w-3.5 h-3.5' })),
            ),
            React.createElement('button', { type: 'button', onClick: onOpenForge, title: `Edit ${fighter.name} in Pixel Forge`, className: 'p-1 bg-black/60 hover:bg-black/85 border border-black text-[#FACC15] rounded-xs cursor-pointer' }, React.createElement(Paintbrush, { className: 'w-3.5 h-3.5' })),
          ),
          React.createElement(
            'div',
            { className: 'text-right my-auto' },
            React.createElement('h3', { className: 'font-display font-black text-2xl sm:text-3xl leading-none text-white tracking-tight truncate', style: { textShadow: HARD_OUTLINE } }, fighter.name),
            React.createElement('div', { className: 'text-[11px] font-bold text-white/90 tracking-wide mt-0.5 truncate', style: { textShadow: '1px 1px 0 rgba(0,0,0,0.85)' } }, `${fighter.originTag} · ${resolved.gridSize}px · ${fighter.stats.maxJumps} Jumps`),
          ),
          renderSlotControls(isP1, isCpu, theme, config.cpuDifficulty, onToggleControlType, onCycleCpuDifficulty),
        ),
      ),
    ),
  );
}
