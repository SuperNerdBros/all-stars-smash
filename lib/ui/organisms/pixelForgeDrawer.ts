'use client';

import React from 'react';
import {
  CopyPlus,
  Eraser,
  FlipHorizontal2,
  PaintBucket,
  Pencil,
  Plus,
  Save,
  Trash2,
  Undo2,
  X,
} from 'lucide-react';
import { ANIM_STATES, SEMANTIC_PALETTE_LABELS } from '../../types/palette';
import type { FighterBlueprint, GraphicsEra } from '../../types/fighter';
import { getEraLabel } from '../../roster/eraResolver';
import { usePixelForgeState } from '../../hooks/usePixelForgeState';
import { ArcadeButton } from '../atoms/button';
import { SpriteCanvas } from '../atoms/spriteCanvas';

export interface PixelForgeDrawerProps {
  fighter: FighterBlueprint;
  graphicsEra: GraphicsEra;
  onClose: () => void;
  onSaveFighter: (updated: FighterBlueprint) => void;
  onCloneNewFighter: (cloned: FighterBlueprint) => void;
}

function getCellBackground(val: number, x: number, y: number, palette: string[]): string {
  if (val === 0) {
    return (x + y) % 2 === 0 ? '#0E1529' : '#141C2F';
  }
  return palette[val] || '#FFFFFF';
}

export function PixelForgeDrawer(props: PixelForgeDrawerProps): React.ReactElement {
  const { fighter, graphicsEra, onClose, onSaveFighter, onCloneNewFighter } = props;
  const forge = usePixelForgeState(fighter, graphicsEra, onSaveFighter, onCloneNewFighter, onClose);
  const { state, clip, safeFrameIdx, activeFrame, activePalette, gridSize, cellPx } = forge;
  const { draft, animState, paletteIdx, colorIdx, tool, isDrawing, undoStack } = state;

  return React.createElement(
    'div',
    {
      className: 'fixed inset-0 z-40 bg-[#070B16]/75 backdrop-blur-xs flex justify-end',
      onMouseUp: () => forge.setDrawing(false),
    },
    React.createElement(
      'aside',
      { className: 'w-full max-w-2xl h-full bg-[#0E1529] border-l border-[#2B3858] flex flex-col overflow-hidden' },

      React.createElement(
        'div',
        { className: 'flex items-center justify-between gap-4 px-6 py-4 border-b border-[#2B3858]' },
        React.createElement(
          'div',
          { className: 'min-w-0 flex-1' },
          React.createElement(
            'div',
            { className: 'text-xs text-[#F59E0B] font-semibold' },
            `Pixel Forge · ${getEraLabel(graphicsEra)} Sprite Editor`,
          ),
          React.createElement('input', {
            type: 'text',
            value: draft.name,
            maxLength: 20,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => forge.setName(e.target.value),
            className:
              'mt-1 w-full max-w-xs bg-[#141C2F] border border-[#2B3858] rounded px-2.5 py-1 font-display text-base font-bold text-white focus:outline-none focus:border-[#F59E0B]',
          }),
        ),
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: onClose,
            'aria-label': 'Close Pixel Forge',
            className: 'p-2 rounded-md bg-[#141C2F] hover:bg-[#1D2740] text-[#CBD5E1] cursor-pointer',
          },
          React.createElement(X, { className: 'w-4 h-4' }),
        ),
      ),

      React.createElement(
        'div',
        { className: 'flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5' },

        React.createElement(
          'div',
          { className: 'flex flex-wrap items-center gap-1 p-1 rounded-md bg-[#0B1020] border border-[#2B3858]' },
          ...ANIM_STATES.map((st) =>
            React.createElement(
              'button',
              {
                key: st,
                type: 'button',
                onClick: () => forge.setAnimState(st),
                className: [
                  'px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors cursor-pointer',
                  animState === st ? 'bg-[#263455] text-white font-semibold' : 'text-[#94A3B8] hover:text-white',
                ].join(' '),
              },
              `${st} (${draft.pixelChart[st].frames.length})`,
            ),
          ),
        ),

        React.createElement(
          'div',
          { className: 'flex flex-col sm:flex-row items-start gap-6' },

          React.createElement(
            'div',
            { className: 'flex flex-col gap-2' },
            React.createElement(
              'div',
              {
                className: 'inline-grid border border-[#3B4E7A] bg-[#070B16] select-none rounded-sm overflow-hidden',
                style: { gridTemplateColumns: `repeat(${gridSize}, ${cellPx}px)` },
                onMouseLeave: () => forge.setDrawing(false),
              },
              ...activeFrame.flatMap((row, y) =>
                row.map((val, x) =>
                  React.createElement('div', {
                    key: `${x}-${y}`,
                    onMouseDown: (e: React.MouseEvent) => {
                      e.preventDefault();
                      forge.setDrawing(true);
                      forge.applyCell(x, y, true);
                    },
                    onMouseEnter: () => {
                      if (isDrawing && tool !== 'fill') {
                        forge.applyCell(x, y, false);
                      }
                    },
                    style: {
                      width: `${cellPx}px`,
                      height: `${cellPx}px`,
                      backgroundColor: getCellBackground(val, x, y, activePalette),
                    },
                    className: 'border-[0.5px] border-white/5 cursor-crosshair',
                  }),
                ),
              ),
            ),

            React.createElement(
              'div',
              { className: 'flex flex-wrap items-center gap-1.5' },
              React.createElement(ArcadeButton, {
                label: 'Draw',
                size: 'sm',
                variant: tool === 'brush' ? 'tabActive' : 'secondary',
                icon: React.createElement(Pencil, { className: 'w-3.5 h-3.5' }),
                onClick: () => forge.setTool('brush'),
              }),
              React.createElement(ArcadeButton, {
                label: 'Erase',
                size: 'sm',
                variant: tool === 'eraser' ? 'tabActive' : 'secondary',
                icon: React.createElement(Eraser, { className: 'w-3.5 h-3.5' }),
                onClick: () => forge.setTool('eraser'),
              }),
              React.createElement(ArcadeButton, {
                label: 'Fill',
                size: 'sm',
                variant: tool === 'fill' ? 'tabActive' : 'secondary',
                icon: React.createElement(PaintBucket, { className: 'w-3.5 h-3.5' }),
                onClick: () => forge.setTool('fill'),
              }),
              React.createElement(ArcadeButton, {
                label: 'Flip X',
                size: 'sm',
                variant: 'secondary',
                icon: React.createElement(FlipHorizontal2, { className: 'w-3.5 h-3.5' }),
                onClick: forge.handleMirrorX,
              }),
              React.createElement(ArcadeButton, {
                label: 'Undo',
                size: 'sm',
                variant: 'secondary',
                disabled: undoStack.length === 0,
                icon: React.createElement(Undo2, { className: 'w-3.5 h-3.5' }),
                onClick: forge.handleUndo,
              }),
            ),
          ),

          React.createElement(
            'div',
            { className: 'flex-1 w-full flex flex-col gap-4' },
            React.createElement(
              'div',
              { className: 'rounded-lg bg-[#141C2F] border border-[#2B3858] p-4 flex flex-col items-center gap-2' },
              React.createElement('div', { className: 'text-xs font-medium text-[#94A3B8]' }, `Live ${animState} Preview`),
              React.createElement(
                'div',
                { className: 'w-28 h-28 rounded-md bg-[#0B1020] flex items-center justify-center' },
                React.createElement(SpriteCanvas, {
                  pixelChart: draft.pixelChart,
                  palette: activePalette,
                  animState,
                  sizePx: 96,
                  animate: true,
                }),
              ),
              React.createElement(
                'div',
                { className: 'w-full flex items-center justify-between text-xs text-[#94A3B8] pt-1' },
                React.createElement('span', null, 'Ticks/Frame'),
                React.createElement('input', {
                  type: 'range',
                  min: 3,
                  max: 24,
                  value: clip.ticksPerFrame,
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                    forge.setTicksPerFrame(Number(e.target.value)),
                  className: 'w-24 accent-[#F59E0B]',
                }),
                React.createElement('span', { className: 'font-mono tabular-nums text-white' }, String(clip.ticksPerFrame)),
              ),
            ),

            React.createElement(
              'div',
              { className: 'rounded-lg bg-[#141C2F] border border-[#2B3858] p-3.5 flex flex-col gap-2.5' },
              React.createElement(
                'div',
                { className: 'flex items-center justify-between' },
                React.createElement('span', { className: 'text-xs font-semibold text-[#E2E8F0]' }, 'Frame Timeline'),
                React.createElement(
                  'div',
                  { className: 'flex items-center gap-1' },
                  React.createElement(
                    'button',
                    {
                      type: 'button',
                      onClick: () => forge.handleAddFrame(true),
                      title: 'Duplicate Current Frame',
                      className: 'p-1 rounded bg-[#1D2740] hover:bg-[#263455] text-[#CBD5E1] cursor-pointer',
                    },
                    React.createElement(Plus, { className: 'w-3.5 h-3.5' }),
                  ),
                  React.createElement(
                    'button',
                    {
                      type: 'button',
                      disabled: clip.frames.length <= 1,
                      onClick: forge.handleDeleteFrame,
                      title: 'Delete Frame',
                      className: 'p-1 rounded bg-[#1D2740] hover:bg-[#7F1D1D] text-[#CBD5E1] disabled:opacity-35 cursor-pointer',
                    },
                    React.createElement(Trash2, { className: 'w-3.5 h-3.5' }),
                  ),
                ),
              ),
              React.createElement(
                'div',
                { className: 'flex flex-wrap gap-1.5' },
                ...clip.frames.map((_, idx) =>
                  React.createElement(
                    'button',
                    {
                      key: idx,
                      type: 'button',
                      onClick: () => forge.setFrameIdx(idx),
                      className: [
                        'px-2.5 py-1 rounded text-xs font-mono tabular-nums border cursor-pointer',
                        idx === safeFrameIdx
                          ? 'bg-[#F59E0B] text-[#0B1020] border-[#F59E0B] font-bold'
                          : 'bg-[#0B1020] text-[#CBD5E1] border-[#2B3858] hover:border-[#4B6194]',
                      ].join(' '),
                    },
                    `F${idx + 1}`,
                  ),
                ),
              ),
            ),
          ),
        ),

        React.createElement(
          'div',
          { className: 'rounded-lg bg-[#141C2F] border border-[#2B3858] p-4 flex flex-col gap-3' },
          React.createElement(
            'div',
            { className: 'flex flex-wrap items-center justify-between gap-2' },
            React.createElement(
              'span',
              { className: 'text-xs font-semibold text-[#E2E8F0]' },
              `Palette ${paletteIdx + 1}: ${draft.palettes[paletteIdx]?.name ?? 'Custom'} · Active Index ${colorIdx} (${SEMANTIC_PALETTE_LABELS[colorIdx]})`,
            ),
            React.createElement(
              'div',
              { className: 'flex items-center gap-1' },
              ...draft.palettes.map((_, idx) =>
                React.createElement(
                  'button',
                  {
                    key: idx,
                    type: 'button',
                    onClick: () => forge.setPaletteIdx(idx),
                    className: [
                      'px-2 py-0.5 rounded text-xs cursor-pointer',
                      idx === paletteIdx ? 'bg-[#263455] text-white font-semibold' : 'text-[#94A3B8] hover:text-white',
                    ].join(' '),
                  },
                  `P${idx + 1}`,
                ),
              ),
            ),
          ),
          React.createElement(
            'div',
            { className: 'grid grid-cols-8 gap-2' },
            ...activePalette.map((hex, idx) =>
              React.createElement(
                'div',
                { key: idx, className: 'flex flex-col items-center gap-1' },
                React.createElement('button', {
                  type: 'button',
                  onClick: () => forge.selectSwatch(idx),
                  title: `${idx}: ${SEMANTIC_PALETTE_LABELS[idx]}`,
                  style: { backgroundColor: idx === 0 ? '#0B1020' : hex },
                  className: [
                    'w-8 h-8 rounded border transition-transform cursor-pointer',
                    colorIdx === idx
                      ? 'border-[#F59E0B] scale-110 ring-2 ring-[#F59E0B]/50'
                      : 'border-white/20 hover:scale-105',
                  ].join(' '),
                }),
                idx > 0
                  ? React.createElement('input', {
                      type: 'color',
                      value: hex || '#FFFFFF',
                      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                        forge.handlePaletteColorChange(idx, e.target.value),
                      title: `Repaint palette slot ${idx}`,
                      className: 'w-7 h-3 bg-transparent border-0 cursor-pointer p-0',
                    })
                  : React.createElement('span', { className: 'text-[10px] font-mono text-[#64748B]' }, '0'),
              ),
            ),
          ),
        ),
      ),

      React.createElement(
        'div',
        { className: 'flex items-center justify-between gap-3 px-6 py-4 border-t border-[#2B3858] bg-[#0B1020]' },
        React.createElement(ArcadeButton, {
          label: 'Clone as New Fighter',
          variant: 'secondary',
          icon: React.createElement(CopyPlus, { className: 'w-4 h-4' }),
          onClick: forge.handleCloneNew,
        }),
        React.createElement(ArcadeButton, {
          label: 'Save & Hot-Reload',
          variant: 'primary',
          icon: React.createElement(Save, { className: 'w-4 h-4' }),
          onClick: forge.handleSave,
        }),
      ),
    ),
  );
}
