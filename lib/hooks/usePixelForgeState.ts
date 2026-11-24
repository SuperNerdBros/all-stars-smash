'use client';

import { useState } from 'react';
import type { AnimState, IndexedFrame } from '../types/palette';
import type { FighterBlueprint, GraphicsEra } from '../types/fighter';
import { cloneFrame, createEmptyFrame, flipFrameX } from '../roster/chartParser';
import { resolveFighterForEra } from '../roster/eraResolver';
import { cloneFighterBlueprint } from '../roster/registry';
import { chiptuneAudio } from '../io/chiptuneAudio';

export type ForgeToolMode = 'brush' | 'eraser' | 'fill';

interface ForgeState {
  draft: FighterBlueprint;
  animState: AnimState;
  frameIdx: number;
  paletteIdx: number;
  colorIdx: number;
  tool: ForgeToolMode;
  isDrawing: boolean;
  undoStack: IndexedFrame[];
}

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

export function usePixelForgeState(
  fighter: FighterBlueprint,
  graphicsEra: GraphicsEra,
  onSaveFighter: (updated: FighterBlueprint) => void,
  onCloneNewFighter: (cloned: FighterBlueprint) => void,
  onClose: () => void,
) {
  const [state, setState] = useState<ForgeState>(() => ({
    draft: cloneFighterBlueprint(resolveFighterForEra(fighter, graphicsEra)),
    animState: 'idle',
    frameIdx: 0,
    paletteIdx: 0,
    colorIdx: 3,
    tool: 'brush',
    isDrawing: false,
    undoStack: [],
  }));

  const clip = state.draft.pixelChart[state.animState];
  const safeFrameIdx = Math.min(state.frameIdx, Math.max(0, clip.frames.length - 1));
  const activeFrame = clip.frames[safeFrameIdx] ?? createEmptyFrame(state.draft.gridSize);
  const activePalette = state.draft.palettes[state.paletteIdx]?.colors ?? state.draft.palettes[0].colors;
  const gridH = activeFrame.length;
  const gridW = activeFrame[0]?.length ?? gridH;
  const gridSize = Math.max(gridW, gridH);
  let cellPx = 11;
  if (gridSize <= 16) {
    cellPx = 20;
  } else if (gridSize <= 24) {
    cellPx = 14;
  }

  const mutateFrame = (nextFrame: IndexedFrame, pushUndo = true) => {
    setState((prev) => {
      const nextDraft = cloneFighterBlueprint(prev.draft);
      const idx = Math.min(prev.frameIdx, Math.max(0, nextDraft.pixelChart[prev.animState].frames.length - 1));
      const currFrame = nextDraft.pixelChart[prev.animState].frames[idx];
      nextDraft.pixelChart[prev.animState].frames[idx] = nextFrame;
      nextDraft.isCustom = true;
      return {
        ...prev,
        draft: nextDraft,
        undoStack: pushUndo && currFrame ? [...prev.undoStack.slice(-19), cloneFrame(currFrame)] : prev.undoStack,
      };
    });
  };

  const applyCell = (x: number, y: number, pushUndo: boolean) => {
    if (state.tool === 'fill') {
      mutateFrame(floodFill(activeFrame, x, y, state.colorIdx), true);
      return;
    }
    const nextVal = state.tool === 'eraser' ? 0 : state.colorIdx;
    if (activeFrame[y]?.[x] === nextVal) return;
    const copy = cloneFrame(activeFrame);
    copy[y][x] = nextVal;
    mutateFrame(copy, pushUndo);
  };

  const handleUndo = () => {
    const prevFrame = state.undoStack[state.undoStack.length - 1];
    if (!prevFrame) return;
    setState((prev) => {
      const nextDraft = cloneFighterBlueprint(prev.draft);
      const idx = Math.min(prev.frameIdx, Math.max(0, nextDraft.pixelChart[prev.animState].frames.length - 1));
      nextDraft.pixelChart[prev.animState].frames[idx] = prevFrame;
      return { ...prev, draft: nextDraft, undoStack: prev.undoStack.slice(0, -1) };
    });
  };

  const handleMirrorX = () => mutateFrame(flipFrameX(activeFrame), true);

  const handleAddFrame = (duplicateCurrent: boolean) => {
    chiptuneAudio.playMenuTick();
    setState((prev) => {
      const nextDraft = cloneFighterBlueprint(prev.draft);
      const frames = nextDraft.pixelChart[prev.animState].frames;
      const idx = Math.min(prev.frameIdx, Math.max(0, frames.length - 1));
      const inserted = duplicateCurrent ? cloneFrame(frames[idx]) : createEmptyFrame(nextDraft.gridSize);
      frames.splice(idx + 1, 0, inserted);
      nextDraft.isCustom = true;
      return { ...prev, draft: nextDraft, frameIdx: idx + 1 };
    });
  };

  const handleDeleteFrame = () => {
    if (clip.frames.length <= 1) return;
    chiptuneAudio.playMenuTick();
    setState((prev) => {
      const nextDraft = cloneFighterBlueprint(prev.draft);
      const idx = Math.min(prev.frameIdx, Math.max(0, nextDraft.pixelChart[prev.animState].frames.length - 1));
      nextDraft.pixelChart[prev.animState].frames.splice(idx, 1);
      nextDraft.isCustom = true;
      return { ...prev, draft: nextDraft, frameIdx: Math.max(0, idx - 1) };
    });
  };

  const handlePaletteColorChange = (swatchIndex: number, hex: string) => {
    if (swatchIndex === 0) return;
    setState((prev) => {
      const nextDraft = cloneFighterBlueprint(prev.draft);
      nextDraft.palettes[prev.paletteIdx].colors[swatchIndex] = hex.toUpperCase();
      nextDraft.isCustom = true;
      return { ...prev, draft: nextDraft };
    });
  };

  const buildPersistedDraft = (): FighterBlueprint => {
    const next = cloneFighterBlueprint(state.draft);
    next.isCustom = true;
    if (next.eraPacks) {
      next.eraPacks[graphicsEra] = {
        pixelChart: next.pixelChart,
        palettes: next.palettes,
      };
    }
    return next;
  };

  const handleSave = () => {
    chiptuneAudio.playMenuConfirm();
    onSaveFighter(buildPersistedDraft());
    onClose();
  };

  const handleCloneNew = () => {
    chiptuneAudio.playMenuConfirm();
    const cloned = buildPersistedDraft();
    cloned.id = `custom-${state.draft.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;
    cloned.name = `${state.draft.name} DX`;
    cloned.originTag = 'Pixel Forge';
    cloned.eraPacks = undefined;
    cloned.isCustom = true;
    onCloneNewFighter(cloned);
    onClose();
  };

  return {
    state,
    clip,
    safeFrameIdx,
    activeFrame,
    activePalette,
    gridSize,
    cellPx,
    setDrawing: (isDrawing: boolean) => setState((prev) => ({ ...prev, isDrawing })),
    setName: (name: string) => setState((prev) => ({ ...prev, draft: { ...prev.draft, name, isCustom: true } })),
    setAnimState: (animState: AnimState) => setState((prev) => ({ ...prev, animState, frameIdx: 0, undoStack: [] })),
    setFrameIdx: (frameIdx: number) => setState((prev) => ({ ...prev, frameIdx, undoStack: [] })),
    setPaletteIdx: (paletteIdx: number) => setState((prev) => ({ ...prev, paletteIdx })),
    selectSwatch: (colorIdx: number) =>
      setState((prev) => ({ ...prev, colorIdx, tool: colorIdx === 0 ? 'eraser' : 'brush' })),
    setTool: (tool: ForgeToolMode) => setState((prev) => ({ ...prev, tool })),
    setTicksPerFrame: (ticks: number) =>
      setState((prev) => {
        const nextDraft = cloneFighterBlueprint(prev.draft);
        nextDraft.pixelChart[prev.animState].ticksPerFrame = ticks;
        return { ...prev, draft: nextDraft };
      }),
    applyCell,
    handleUndo,
    handleMirrorX,
    handleAddFrame,
    handleDeleteFrame,
    handlePaletteColorChange,
    handleSave,
    handleCloneNew,
  };
}
