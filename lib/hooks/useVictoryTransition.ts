'use client';

import { useEffect, useRef } from 'react';
import type { HudSnapshot } from '../types/protocol';

const FINISH_BANNER_DELAY_MS = 1250;

/**
 * Holds the GAME! finish banner briefly after a final KO before invoking onMatchComplete.
 */
export function useVictoryTransition(
  winnerSlot: 0 | 1 | null,
  hud: HudSnapshot | null,
  onMatchComplete: (hud: HudSnapshot) => void,
): void {
  const completedRef = useRef<boolean>(false);
  const latestHudRef = useRef<HudSnapshot | null>(null);

  useEffect(() => {
    latestHudRef.current = hud;
  }, [hud]);

  useEffect(() => {
    const hasWinner = winnerSlot !== null;
    if (!hasWinner) {
      completedRef.current = false;
      return;
    }
    if (completedRef.current) return;
    completedRef.current = true;
    const timer = window.setTimeout(() => {
      if (latestHudRef.current) {
        onMatchComplete(latestHudRef.current);
      }
    }, FINISH_BANNER_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [winnerSlot, onMatchComplete]);
}
