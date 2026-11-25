'use client';

import { useEffect, useState } from 'react';
import type { HudFighterSnapshot, HudSnapshot } from '../types/protocol';
import { chiptuneAudio } from '../io/chiptuneAudio';

function detectTouchCapableDevice(): boolean {
  const isServer = typeof window === 'undefined';
  if (isServer) return false;
  const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const hasTouchPoints = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0;
  const isCompactScreen = window.innerWidth < 900;
  return hasCoarsePointer || hasTouchPoints || isCompactScreen;
}

export type TargetSelection = number | 'next' | null;

export interface MatchTouchControlsParams {
  hud: HudSnapshot | null;
  lockedTargetSlot: number | null;
  paused: boolean;
  winnerSlot: number | null;
  setTargetLock: (slot: number | null) => void;
  setVirtualInputMask: (mask: number) => void;
}

export interface MatchTouchControlsResult {
  touchPadOpen: boolean;
  lockedTargetName: string | null;
  hasLivingOpponents: boolean;
  toggleTouchPad: () => void;
  selectTarget: (selection: TargetSelection) => void;
}

function findLivingOpponents(hud: HudSnapshot | null): HudFighterSnapshot[] {
  if (!hud) return [];
  return hud.fighters.filter((fighter) => fighter.slot !== 0 && fighter.stocks > 0);
}

export function useMatchTouchControls(params: MatchTouchControlsParams): MatchTouchControlsResult {
  const { hud, lockedTargetSlot, paused, winnerSlot, setTargetLock, setVirtualInputMask } = params;
  const [touchPadOpen, setTouchPadOpen] = useState<boolean>(() => detectTouchCapableDevice());

  const livingOpponents = findLivingOpponents(hud);
  const lockedFighter =
    lockedTargetSlot !== null
      ? livingOpponents.find((fighter) => fighter.slot === lockedTargetSlot) ?? null
      : null;

  useEffect(() => {
    const matchInactive = paused || winnerSlot !== null;
    if (matchInactive) {
      setVirtualInputMask(0);
    }
  }, [paused, winnerSlot, setVirtualInputMask]);

  const toggleTouchPad = () => {
    chiptuneAudio.playMenuTick();
    setTouchPadOpen((prevOpen) => {
      if (prevOpen) setVirtualInputMask(0);
      return !prevOpen;
    });
  };

  const selectTarget = (selection: TargetSelection) => {
    const shouldClear = selection === null;
    if (shouldClear) {
      setTargetLock(null);
      return;
    }

    const shouldCycleNext = selection === 'next';
    if (shouldCycleNext) {
      const noOpponentsLeft = livingOpponents.length === 0;
      if (noOpponentsLeft) {
        setTargetLock(null);
        return;
      }
      const currentIndex = livingOpponents.findIndex((fighter) => fighter.slot === lockedTargetSlot);
      const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % livingOpponents.length;
      setTargetLock(livingOpponents[nextIndex].slot);
      return;
    }

    const isAlreadyLocked = lockedTargetSlot === selection;
    setTargetLock(isAlreadyLocked ? null : selection);
  };

  return {
    touchPadOpen,
    lockedTargetName: lockedFighter?.name ?? null,
    hasLivingOpponents: livingOpponents.length > 0,
    toggleTouchPad,
    selectTarget,
  };
}
