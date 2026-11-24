'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Cpu, Palette, User } from 'lucide-react';
import type { FighterBlueprint } from '../../types/fighter';
import type { CpuDifficulty, PlayerSlotConfig } from '../../types/protocol';
import { SpriteCanvas } from '../atoms/spriteCanvas';
import { StatBar } from '../atoms/statBar';

export interface PlayerSlotCardProps {
  slot: 0 | 1;
  isActiveSlot: boolean;
  config: PlayerSlotConfig;
  fighter: FighterBlueprint;
  onFocusSlot: () => void;
  onCyclePalette: (delta: number) => void;
  onToggleControlType?: () => void;
  onCycleCpuDifficulty?: (diff: CpuDifficulty) => void;
  onOpenForge: () => void;
}

const DIFFICULTIES: readonly CpuDifficulty[] = ['easy', 'normal', 'hard'];

export function PlayerSlotCard(props: PlayerSlotCardProps): React.ReactElement {
  const {
    slot,
    isActiveSlot,
    config,
    fighter,
    onFocusSlot,
    onCyclePalette,
    onToggleControlType,
    onCycleCpuDifficulty,
    onOpenForge,
  } = props;

  const isP1 = slot === 0;
  const accentHex = isP1 ? '#EF4444' : '#3B82F6';
  const safePalIdx = config.paletteIndex % fighter.palettes.length;
  const preset = fighter.palettes[safePalIdx] ?? fighter.palettes[0];

  const headerTitle = isP1
    ? 'Player 1 · Human'
    : config.controlType === 'cpu'
      ? `Player 2 · CPU (${config.cpuDifficulty[0].toUpperCase()}${config.cpuDifficulty.slice(1)})`
      : 'Player 2 · Local Human';

  return React.createElement(
    'div',
    {
      onClick: onFocusSlot,
      className: [
        'rounded-lg bg-[#141C2F] border p-5 transition-colors duration-150 cursor-pointer flex flex-col gap-4',
        isActiveSlot
          ? isP1
            ? 'border-[#EF4444]'
            : 'border-[#3B82F6]'
          : 'border-[#2B3858] hover:border-[#3F517E]',
      ].join(' '),
    },
    // Header row
    React.createElement(
      'div',
      { className: 'flex items-center justify-between gap-3' },
      React.createElement(
        'div',
        { className: 'min-w-0' },
        React.createElement(
          'div',
          {
            className: 'text-xs font-semibold tracking-wide',
            style: { color: accentHex },
          },
          headerTitle,
        ),
        React.createElement(
          'h3',
          { className: 'font-display text-xl font-bold text-white truncate mt-0.5' },
          fighter.name,
        ),
      ),
      !isP1 && onToggleControlType
        ? React.createElement(
            'button',
            {
              type: 'button',
              onClick: (e: React.MouseEvent) => {
                e.stopPropagation();
                onToggleControlType();
              },
              className:
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1D2740] hover:bg-[#263455] border border-[#2B3858] text-xs font-medium text-[#E2E8F0] whitespace-nowrap shrink-0 cursor-pointer',
            },
            config.controlType === 'cpu'
              ? React.createElement(Cpu, { className: 'w-3.5 h-3.5 text-[#3B82F6]' })
              : React.createElement(User, { className: 'w-3.5 h-3.5 text-[#10B981]' }),
            config.controlType === 'cpu' ? 'Switch to 2P' : 'Switch to CPU',
          )
        : React.createElement(
            'button',
            {
              type: 'button',
              onClick: (e: React.MouseEvent) => {
                e.stopPropagation();
                onOpenForge();
              },
              className:
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1D2740] hover:bg-[#263455] border border-[#2B3858] text-xs font-medium text-[#E2E8F0] whitespace-nowrap shrink-0 cursor-pointer',
            },
            React.createElement(Palette, { className: 'w-3.5 h-3.5 text-[#F59E0B]' }),
            'Edit Pixels',
          ),
    ),

    // CPU Difficulty segmented selector for P2 when CPU
    !isP1 && config.controlType === 'cpu' && onCycleCpuDifficulty
      ? React.createElement(
          'div',
          {
            className: 'flex items-center gap-1 p-1 rounded-md bg-[#0B1020] border border-[#2B3858]',
            onClick: (e: React.MouseEvent) => e.stopPropagation(),
          },
          ...DIFFICULTIES.map((diff) =>
            React.createElement(
              'button',
              {
                key: diff,
                type: 'button',
                onClick: () => onCycleCpuDifficulty(diff),
                className: [
                  'flex-1 py-1 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap',
                  config.cpuDifficulty === diff
                    ? 'bg-[#263455] text-white'
                    : 'text-[#94A3B8] hover:text-white',
                ].join(' '),
              },
              diff[0].toUpperCase() + diff.slice(1),
            ),
          ),
        )
      : null,

    // Preview + Stats split
    React.createElement(
      'div',
      { className: 'flex items-center gap-4' },
      React.createElement(
        'div',
        {
          className:
            'w-24 h-24 shrink-0 rounded-md bg-[#0B1020] border border-[#2B3858] flex items-center justify-center',
        },
        React.createElement(SpriteCanvas, {
          pixelChart: fighter.pixelChart,
          palette: preset.colors,
          animState: 'idle',
          sizePx: 80,
          flipX: !isP1,
          animate: true,
        }),
      ),
      React.createElement(
        'div',
        { className: 'flex-1 flex flex-col gap-2 min-w-0' },
        React.createElement(StatBar, {
          label: 'Speed',
          valueText: fighter.stats.runSpeed.toFixed(1),
          percent: (fighter.stats.runSpeed / 3.5) * 100,
          accentHex,
        }),
        React.createElement(StatBar, {
          label: 'Power',
          valueText: `${fighter.moveset.smash.damage}%`,
          percent: (fighter.moveset.smash.damage / 22) * 100,
          accentHex,
        }),
        React.createElement(StatBar, {
          label: 'Weight',
          valueText: `${fighter.stats.weight}`,
          percent: (fighter.stats.weight / 120) * 100,
          accentHex,
        }),
      ),
    ),

    // Live Palette Swapper Footer
    React.createElement(
      'div',
      {
        className: 'flex items-center justify-between pt-3 border-t border-[#2B3858]/70 gap-2',
        onClick: (e: React.MouseEvent) => e.stopPropagation(),
      },
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: () => onCyclePalette(-1),
          'aria-label': 'Previous color palette',
          className:
            'p-1.5 rounded-md bg-[#1D2740] hover:bg-[#263455] text-[#CBD5E1] cursor-pointer',
        },
        React.createElement(ChevronLeft, { className: 'w-4 h-4' }),
      ),
      React.createElement(
        'div',
        { className: 'flex items-center gap-2 min-w-0' },
        React.createElement(
          'div',
          { className: 'flex items-center gap-1 shrink-0' },
          ...[3, 5, 7, 13].map((idx) =>
            React.createElement('span', {
              key: idx,
              className: 'w-3 h-3 rounded-xs border border-white/20',
              style: { backgroundColor: preset.colors[idx] || '#475569' },
            }),
          ),
        ),
        React.createElement(
          'span',
          { className: 'text-xs font-medium text-[#E2E8F0] truncate' },
          `${safePalIdx + 1}/${fighter.palettes.length} · ${preset.name}`,
        ),
      ),
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: () => onCyclePalette(1),
          'aria-label': 'Next color palette',
          className:
            'p-1.5 rounded-md bg-[#1D2740] hover:bg-[#263455] text-[#CBD5E1] cursor-pointer',
        },
        React.createElement(ChevronRight, { className: 'w-4 h-4' }),
      ),
    ),
  );
}
