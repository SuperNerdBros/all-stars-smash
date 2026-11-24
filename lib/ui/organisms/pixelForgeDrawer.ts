'use client';

import React, { useMemo, useState } from 'react';
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
import type { AnimState, IndexedFrame } from '../../types/palette';
import { ANIM_STATES, SEMANTIC_PALETTE_LABELS } from '../../types/palette';
import type { FighterBlueprint } from '../../types/fighter';
import { cloneFrame, createEmptyFrame, flipFrameX } from '../../roster/chartParser';
import { cloneFighterBlueprint } from '../../roster/registry';
import { chiptuneAudio } from '../../io/chiptuneAudio';
import { ArcadeButton } from '../atoms/button';
import { SpriteCanvas } from '../atoms/spriteCanvas';

export interface PixelForgeDrawerProps {
  fighter: FighterBlueprint;
  onClose: () => void;
  onSaveFighter: (updated: FighterBlueprint) => void;
  onCloneNewFighter: (cloned: FighterBlueprint) => void;
}

type ToolMode = 'brush' | 'eraser' | 'fill';

function floodFill(
  frame: IndexedFrame,
  startX: number,
  startY: number,
  replacement: number,
): IndexedFrame {
  const h = frame.length;
  const w = frame[0]?.length ?? 0;
  const target = frame[startY]?.[startX];
  if (target === undefined || target === replacement) return frame;

  const out = cloneFrame(frame);
  const stack: Array<[number, number]> = [[startX, startY]];
  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    if (x < 0 || x >= w || y < 0 || y >= h) continue;
    if (out[y][x] !== target) continue;
    out[y][x] = replacement;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  return out;
}

export function PixelForgeDrawer(props: PixelForgeDrawerProps): React.ReactElement {
  const { fighter, onClose, onSaveFighter, onCloneNewFighter } = props;

  const [draft, setDraft] = useState<FighterBlueprint>(() => cloneFighterBlueprint(fighter));
  const [animState, setAnimState] = useState<AnimState>('idle');
  const [frameIdx, setFrameIdx] = useState<number>(0);
  const [paletteIdx, setPaletteIdx] = useState<number>(0);
  const [colorIdx, setColorIdx] = useState<number>(3);
  const [tool, setTool] = useState<ToolMode>('brush');
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [undoStack, setUndoStack] = useState<IndexedFrame[]>([]);

  const clip = draft.pixelChart[animState];
  const safeFrameIdx = Math.min(frameIdx, Math.max(0, clip.frames.length - 1));
  const activeFrame = clip.frames[safeFrameIdx] ?? createEmptyFrame(draft.gridSize);
  const activePalette = draft.palettes[paletteIdx]?.colors ?? draft.palettes[0].colors;

  const gridSize = activeFrame.length;
  const cellPx = useMemo(() => (gridSize <= 16 ? 20 : 14), [gridSize]);

  const mutateFrame = (nextFrame: IndexedFrame, pushUndo = true) => {
    if (pushUndo) {
      setUndoStack((prev) => [...prev.slice(-19), cloneFrame(activeFrame)]);
    }
    setDraft((prev) => {
      const next = cloneFighterBlueprint(prev);
      next.pixelChart[animState].frames[safeFrameIdx] = nextFrame;
      next.isCustom = true;
      return next;
    });
  };

  const applyCell = (x: number, y: number, pushUndo: boolean) => {
    if (tool === 'fill') {
      mutateFrame(floodFill(activeFrame, x, y, colorIdx), true);
      return;
    }
    const nextVal = tool === 'eraser' ? 0 : colorIdx;
    if (activeFrame[y]?.[x] === nextVal) return;
    const copy = cloneFrame(activeFrame);
    copy[y][x] = nextVal;
    mutateFrame(copy, pushUndo);
  };

  const handleUndo = () => {
    const prevFrame = undoStack[undoStack.length - 1];
    if (!prevFrame) return;
    setUndoStack((s) => s.slice(0, -1));
    mutateFrame(prevFrame, false);
  };

  const handleMirrorX = () => {
    mutateFrame(flipFrameX(activeFrame), true);
  };

  const handleAddFrame = (duplicateCurrent: boolean) => {
    chiptuneAudio.playMenuTick();
    setDraft((prev) => {
      const next = cloneFighterBlueprint(prev);
      const frames = next.pixelChart[animState].frames;
      const inserted = duplicateCurrent
        ? cloneFrame(activeFrame)
        : createEmptyFrame(next.gridSize);
      frames.splice(safeFrameIdx + 1, 0, inserted);
      next.isCustom = true;
      return next;
    });
    setFrameIdx(safeFrameIdx + 1);
  };

  const handleDeleteFrame = () => {
    if (clip.frames.length <= 1) return;
    chiptuneAudio.playMenuTick();
    setDraft((prev) => {
      const next = cloneFighterBlueprint(prev);
      next.pixelChart[animState].frames.splice(safeFrameIdx, 1);
      next.isCustom = true;
      return next;
    });
    setFrameIdx(Math.max(0, safeFrameIdx - 1));
  };

  const handlePaletteColorChange = (swatchIndex: number, hex: string) => {
    if (swatchIndex === 0) return;
    setDraft((prev) => {
      const next = cloneFighterBlueprint(prev);
      next.palettes[paletteIdx].colors[swatchIndex] = hex.toUpperCase();
      next.isCustom = true;
      return next;
    });
  };

  const handleSave = () => {
    chiptuneAudio.playMenuConfirm();
    onSaveFighter({ ...draft, isCustom: true });
    onClose();
  };

  const handleCloneNew = () => {
    chiptuneAudio.playMenuConfirm();
    const cloned = cloneFighterBlueprint(draft);
    cloned.id = `custom-${draft.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;
    cloned.name = `${draft.name} DX`;
    cloned.originTag = 'Pixel Forge';
    cloned.isCustom = true;
    onCloneNewFighter(cloned);
    onClose();
  };

  return React.createElement(
    'div',
    {
      className:
        'fixed inset-0 z-40 bg-[#070B16]/75 backdrop-blur-xs flex justify-end',
      onMouseUp: () => setIsDrawing(false),
    },
    React.createElement(
      'aside',
      {
        className:
          'w-full max-w-2xl h-full bg-[#0E1529] border-l border-[#2B3858] flex flex-col overflow-hidden',
      },

      // Header
      React.createElement(
        'div',
        { className: 'flex items-center justify-between gap-4 px-6 py-4 border-b border-[#2B3858]' },
        React.createElement(
          'div',
          { className: 'min-w-0 flex-1' },
          React.createElement(
            'div',
            { className: 'text-xs text-[#F59E0B] font-semibold' },
            'Pixel Forge · Indexed Multi-Frame Editor',
          ),
          React.createElement('input', {
            type: 'text',
            value: draft.name,
            maxLength: 20,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
              setDraft((prev) => ({ ...prev, name: e.target.value, isCustom: true })),
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
            className:
              'p-2 rounded-md bg-[#141C2F] hover:bg-[#1D2740] text-[#CBD5E1] cursor-pointer',
          },
          React.createElement(X, { className: 'w-4 h-4' }),
        ),
      ),

      // Scrollable Body
      React.createElement(
        'div',
        { className: 'flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5' },

        // Animation State Tabs
        React.createElement(
          'div',
          { className: 'flex flex-wrap items-center gap-1 p-1 rounded-md bg-[#0B1020] border border-[#2B3858]' },
          ...ANIM_STATES.map((st) =>
            React.createElement(
              'button',
              {
                key: st,
                type: 'button',
                onClick: () => {
                  setAnimState(st);
                  setFrameIdx(0);
                  setUndoStack([]);
                },
                className: [
                  'px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors cursor-pointer',
                  animState === st
                    ? 'bg-[#263455] text-white font-semibold'
                    : 'text-[#94A3B8] hover:text-white',
                ].join(' '),
              },
              `${st} (${draft.pixelChart[st].frames.length})`,
            ),
          ),
        ),

        // Editor Canvas + Live Animated Preview
        React.createElement(
          'div',
          { className: 'flex flex-col sm:flex-row items-start gap-6' },

          // Interactive Pixel Grid
          React.createElement(
            'div',
            { className: 'flex flex-col gap-2' },
            React.createElement(
              'div',
              {
                className:
                  'inline-grid border border-[#3B4E7A] bg-[#070B16] select-none rounded-sm overflow-hidden',
                style: {
                  gridTemplateColumns: `repeat(${gridSize}, ${cellPx}px)`,
                },
                onMouseLeave: () => setIsDrawing(false),
              },
              ...activeFrame.flatMap((row, y) =>
                row.map((val, x) =>
                  React.createElement('div', {
                    key: `${x}-${y}`,
                    onMouseDown: (e: React.MouseEvent) => {
                      e.preventDefault();
                      setIsDrawing(true);
                      applyCell(x, y, true);
                    },
                    onMouseEnter: () => {
                      if (isDrawing && tool !== 'fill') {
                        applyCell(x, y, false);
                      }
                    },
                    style: {
                      width: `${cellPx}px`,
                      height: `${cellPx}px`,
                      backgroundColor:
                        val === 0
                          ? (x + y) % 2 === 0
                            ? '#0E1529'
                            : '#141C2F'
                          : activePalette[val] || '#FFFFFF',
                    },
                    className: 'border-[0.5px] border-white/5 cursor-crosshair',
                  }),
                ),
              ),
            ),

            // Drawing Tools Row
            React.createElement(
              'div',
              { className: 'flex flex-wrap items-center gap-1.5' },
              React.createElement(ArcadeButton, {
                label: 'Draw',
                size: 'sm',
                variant: tool === 'brush' ? 'tabActive' : 'secondary',
                icon: React.createElement(Pencil, { className: 'w-3.5 h-3.5' }),
                onClick: () => setTool('brush'),
              }),
              React.createElement(ArcadeButton, {
                label: 'Erase',
                size: 'sm',
                variant: tool === 'eraser' ? 'tabActive' : 'secondary',
                icon: React.createElement(Eraser, { className: 'w-3.5 h-3.5' }),
                onClick: () => setTool('eraser'),
              }),
              React.createElement(ArcadeButton, {
                label: 'Fill',
                size: 'sm',
                variant: tool === 'fill' ? 'tabActive' : 'secondary',
                icon: React.createElement(PaintBucket, { className: 'w-3.5 h-3.5' }),
                onClick: () => setTool('fill'),
              }),
              React.createElement(ArcadeButton, {
                label: 'Flip X',
                size: 'sm',
                variant: 'secondary',
                icon: React.createElement(FlipHorizontal2, { className: 'w-3.5 h-3.5' }),
                onClick: handleMirrorX,
              }),
              React.createElement(ArcadeButton, {
                label: 'Undo',
                size: 'sm',
                variant: 'secondary',
                disabled: undoStack.length === 0,
                icon: React.createElement(Undo2, { className: 'w-3.5 h-3.5' }),
                onClick: handleUndo,
              }),
            ),
          ),

          // Live Animated Preview + Multi-Frame Timeline
          React.createElement(
            'div',
            { className: 'flex-1 w-full flex flex-col gap-4' },
            React.createElement(
              'div',
              { className: 'rounded-lg bg-[#141C2F] border border-[#2B3858] p-4 flex flex-col items-center gap-2' },
              React.createElement(
                'div',
                { className: 'text-xs font-medium text-[#94A3B8]' },
                `Live ${animState} Preview`,
              ),
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
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                    const val = Number(e.target.value);
                    setDraft((prev) => {
                      const next = cloneFighterBlueprint(prev);
                      next.pixelChart[animState].ticksPerFrame = val;
                      return next;
                    });
                  },
                  className: 'w-24 accent-[#F59E0B]',
                }),
                React.createElement('span', { className: 'font-mono tabular-nums text-white' }, String(clip.ticksPerFrame)),
              ),
            ),

            // Frame Timeline Controls
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
                      onClick: () => handleAddFrame(true),
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
                      onClick: handleDeleteFrame,
                      title: 'Delete Frame',
                      className:
                        'p-1 rounded bg-[#1D2740] hover:bg-[#7F1D1D] text-[#CBD5E1] disabled:opacity-35 cursor-pointer',
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
                      onClick: () => {
                        setFrameIdx(idx);
                        setUndoStack([]);
                      },
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

        // 16-Color Semantic Palette Table & Live Swatch Editor
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
              ...draft.palettes.map((p, idx) =>
                React.createElement(
                  'button',
                  {
                    key: idx,
                    type: 'button',
                    onClick: () => setPaletteIdx(idx),
                    className: [
                      'px-2 py-0.5 rounded text-xs cursor-pointer',
                      idx === paletteIdx
                        ? 'bg-[#263455] text-white font-semibold'
                        : 'text-[#94A3B8] hover:text-white',
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
                  onClick: () => {
                    setColorIdx(idx);
                    setTool(idx === 0 ? 'eraser' : 'brush');
                  },
                  title: `${idx}: ${SEMANTIC_PALETTE_LABELS[idx]}`,
                  style: {
                    backgroundColor: idx === 0 ? '#0B1020' : hex,
                  },
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
                        handlePaletteColorChange(idx, e.target.value),
                      title: `Repaint palette slot ${idx}`,
                      className: 'w-7 h-3 bg-transparent border-0 cursor-pointer p-0',
                    })
                  : React.createElement(
                      'span',
                      { className: 'text-[10px] font-mono text-[#64748B]' },
                      '0',
                    ),
              ),
            ),
          ),
        ),
      ),

      // Footer Actions
      React.createElement(
        'div',
        { className: 'flex items-center justify-between gap-3 px-6 py-4 border-t border-[#2B3858] bg-[#0B1020]' },
        React.createElement(ArcadeButton, {
          label: 'Clone as New Fighter',
          variant: 'secondary',
          icon: React.createElement(CopyPlus, { className: 'w-4 h-4' }),
          onClick: handleCloneNew,
        }),
        React.createElement(ArcadeButton, {
          label: 'Save & Hot-Reload',
          variant: 'primary',
          icon: React.createElement(Save, { className: 'w-4 h-4' }),
          onClick: handleSave,
        }),
      ),
    ),
  );
}
