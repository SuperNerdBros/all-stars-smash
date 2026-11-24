'use client';

import { useEffect, useState } from 'react';
import type { FighterBlueprint, GraphicsEra } from '../types/fighter';
import type { MatchConfig } from '../types/protocol';
import {
  BUILTIN_FIGHTERS,
  loadRoster,
  resetRosterToDefaults,
  saveCustomFighterToStorage,
} from '../roster/registry';
import { getStageById } from '../stages/manifests';

export type ScreenState = 'CHARACTER_SELECT' | 'STAGE_SELECT' | 'PLAYING';

const INITIAL_CONFIG: MatchConfig = {
  players: [
    { fighterId: 'mario', paletteIndex: 0, controlType: 'human', cpuDifficulty: 'normal' },
    { fighterId: 'spiky-time', paletteIndex: 0, controlType: 'cpu', cpuDifficulty: 'normal' },
  ],
  stageId: 'mushroom-kingdom-1-1',
  stocks: 3,
  graphicsEra: 'SNES_SEGA',
};

interface ShellState {
  screen: ScreenState;
  roster: FighterBlueprint[];
  matchConfig: MatchConfig;
  forgeFighterId: string | null;
  importerOpen: boolean;
  musicOpen: boolean;
}

export function useArcadeShellState() {
  const [state, setState] = useState<ShellState>(() => ({
    screen: 'CHARACTER_SELECT',
    roster: [...BUILTIN_FIGHTERS],
    matchConfig: INITIAL_CONFIG,
    forgeFighterId: null,
    importerOpen: false,
    musicOpen: false,
  }));

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setState((prev) => ({ ...prev, roster: loadRoster() }));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const p1Fighter =
    state.roster.find((f) => f.id === state.matchConfig.players[0].fighterId) ?? state.roster[0];
  const p2Fighter =
    state.roster.find((f) => f.id === state.matchConfig.players[1].fighterId) ??
    state.roster[1] ??
    state.roster[0];
  const stage = getStageById(state.matchConfig.stageId);
  const forgeFighter = state.forgeFighterId
    ? state.roster.find((f) => f.id === state.forgeFighterId) ?? null
    : null;

  return {
    ...state,
    p1Fighter,
    p2Fighter,
    stage,
    forgeFighter,
    setScreen: (screen: ScreenState) => setState((prev) => ({ ...prev, screen })),
    setMatchConfig: (updater: MatchConfig | ((prev: MatchConfig) => MatchConfig)) =>
      setState((prev) => ({
        ...prev,
        matchConfig: typeof updater === 'function' ? updater(prev.matchConfig) : updater,
      })),
    setForgeFighterId: (forgeFighterId: string | null) =>
      setState((prev) => ({ ...prev, forgeFighterId })),
    setImporterOpen: (importerOpen: boolean) => setState((prev) => ({ ...prev, importerOpen })),
    toggleMusic: () => setState((prev) => ({ ...prev, musicOpen: !prev.musicOpen })),
    setEra: (graphicsEra: GraphicsEra) =>
      setState((prev) => ({ ...prev, matchConfig: { ...prev.matchConfig, graphicsEra } })),
    toggleEra: () =>
      setState((prev) => ({
        ...prev,
        matchConfig: {
          ...prev.matchConfig,
          graphicsEra: prev.matchConfig.graphicsEra === 'NES' ? 'SNES_SEGA' : 'NES',
        },
      })),
    saveFighter: (updated: FighterBlueprint) =>
      setState((prev) => ({ ...prev, roster: saveCustomFighterToStorage(prev.roster, updated) })),
    registerNewFighter: (created: FighterBlueprint) =>
      setState((prev) => ({
        ...prev,
        roster: saveCustomFighterToStorage(prev.roster, created),
        matchConfig: {
          ...prev.matchConfig,
          players: [
            { ...prev.matchConfig.players[0], fighterId: created.id, paletteIndex: 0 },
            prev.matchConfig.players[1],
          ],
        },
      })),
    resetRoster: () =>
      setState((prev) => ({
        ...prev,
        roster: resetRosterToDefaults(),
        matchConfig: INITIAL_CONFIG,
      })),
  };
}
