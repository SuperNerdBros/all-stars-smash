'use client';

import { useEffect, useState } from 'react';
import type { FighterBlueprint, GraphicsEra } from '../types/fighter';
import { MAX_FIGHTERS, MIN_FIGHTERS, type HudSnapshot, type MatchConfig } from '../types/protocol';
import {
  BUILTIN_FIGHTERS,
  loadRoster,
  resetRosterToDefaults,
  saveCustomFighterToStorage,
} from '../roster/registry';
import { getStageById, STAGE_MANIFESTS } from '../stages/manifests';

export type ScreenState =
  | 'DISCLAIMER'
  | 'TITLE'
  | 'ONLINE'
  | 'CHARACTER_SELECT'
  | 'STAGE_SELECT'
  | 'VS_INTRO'
  | 'PLAYING'
  | 'VICTORY';

const ATTRACT_CPU_COUNT = 3;

const INITIAL_CONFIG: MatchConfig = {
  players: [
    { fighterId: 'mario', paletteIndex: 0, controlType: 'human', cpuDifficulty: 'normal' },
    { fighterId: 'spiky-time', paletteIndex: 0, controlType: 'cpu', cpuDifficulty: 'normal' },
  ],
  stageId: 'mushroom-kingdom-1-1',
  stocks: 3,
  graphicsEra: 'SNES_SEGA',
};

function pickRandomStageId(excludeId?: string): string {
  const pool = STAGE_MANIFESTS.filter((s) => s.id !== excludeId);
  const source = pool.length > 0 ? pool : STAGE_MANIFESTS;
  return source[Math.floor(Math.random() * source.length)]?.id ?? STAGE_MANIFESTS[0].id;
}

function pickRandomFighterIds(roster: ReadonlyArray<FighterBlueprint>, count: number): string[] {
  const pool = roster.map((f) => f.id);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
  }
  return pool.slice(0, Math.min(count, pool.length));
}

interface ShellState {
  screen: ScreenState;
  roster: FighterBlueprint[];
  matchConfig: MatchConfig;
  attractFighterIds: string[];
  lastMatchHud: HudSnapshot | null;
  forgeFighterId: string | null;
  importerOpen: boolean;
  musicOpen: boolean;
  musicAutoStart: boolean;
}

export function useArcadeShellState() {
  const [state, setState] = useState<ShellState>(() => ({
    screen: 'DISCLAIMER',
    roster: [...BUILTIN_FIGHTERS],
    matchConfig: INITIAL_CONFIG,
    attractFighterIds: BUILTIN_FIGHTERS.slice(0, ATTRACT_CPU_COUNT).map((f) => f.id),
    lastMatchHud: null,
    forgeFighterId: null,
    importerOpen: false,
    musicOpen: false,
    musicAutoStart: false,
  }));

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const loaded = loadRoster();
      const randomStageId = pickRandomStageId();
      const randomAttract = pickRandomFighterIds(loaded, ATTRACT_CPU_COUNT);
      setState((prev) => ({
        ...prev,
        roster: loaded,
        attractFighterIds: randomAttract,
        matchConfig: { ...prev.matchConfig, stageId: randomStageId },
      }));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const p1Fighter =
    state.roster.find((f) => f.id === state.matchConfig.players[0].fighterId) ?? state.roster[0];
  const p2Fighter =
    state.roster.find((f) => f.id === state.matchConfig.players[1].fighterId) ??
    state.roster[1] ??
    state.roster[0];
  /** One blueprint per seat (2..MAX_FIGHTERS). */
  const matchFighters: FighterBlueprint[] = state.matchConfig.players.map(
    (p, i) => state.roster.find((f) => f.id === p.fighterId) ?? state.roster[i % Math.max(1, state.roster.length)],
  );
  const stage = getStageById(state.matchConfig.stageId);
  const forgeFighter = state.forgeFighterId
    ? state.roster.find((f) => f.id === state.forgeFighterId) ?? null
    : null;

  const attractFighters: FighterBlueprint[] = state.attractFighterIds
    .map((id) => state.roster.find((f) => f.id === id))
    .filter((f): f is FighterBlueprint => Boolean(f));

  return {
    ...state,
    p1Fighter,
    p2Fighter,
    matchFighters,
    attractFighters: attractFighters.length > 0 ? attractFighters : state.roster.slice(0, ATTRACT_CPU_COUNT),
    stage,
    forgeFighter,
    setScreen: (screen: ScreenState) => setState((prev) => ({ ...prev, screen })),
    dismissDisclaimer: () =>
      setState((prev) => ({
        ...prev,
        screen: 'TITLE',
        musicAutoStart: true,
      })),
    shuffleAttract: () =>
      setState((prev) => ({
        ...prev,
        attractFighterIds: pickRandomFighterIds(prev.roster, ATTRACT_CPU_COUNT),
        matchConfig: {
          ...prev.matchConfig,
          stageId: pickRandomStageId(prev.matchConfig.stageId),
        },
      })),
    startQuickBrawl: () =>
      setState((prev) => {
        const picks = pickRandomFighterIds(prev.roster, prev.matchConfig.players.length);
        return {
          ...prev,
          lastMatchHud: null,
          screen: 'VS_INTRO',
          matchConfig: {
            ...prev.matchConfig,
            players: prev.matchConfig.players.map((p, i) => ({
              ...p,
              fighterId: picks[i] ?? p.fighterId,
              paletteIndex: 0,
            })),
          },
        };
      }),
    launchVsIntro: () =>
      setState((prev) => ({ ...prev, lastMatchHud: null, screen: 'VS_INTRO' })),
    completeMatch: (hud: HudSnapshot) =>
      setState((prev) => ({ ...prev, lastMatchHud: hud, screen: 'VICTORY' })),
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
          players: prev.matchConfig.players.map((p, i) =>
            i === 0 ? { ...p, fighterId: created.id, paletteIndex: 0 } : p,
          ),
        },
      })),
    /** Grows (with CPU seats) or shrinks the match to `size` seats. Seats 0/1 are kept. */
    setRoomSize: (size: number) =>
      setState((prev) => {
        const n = Math.max(MIN_FIGHTERS, Math.min(MAX_FIGHTERS, Math.round(size)));
        const players = prev.matchConfig.players.slice(0, n);
        const picks = pickRandomFighterIds(prev.roster, n);
        const difficulty = players.find((p) => p.controlType === 'cpu')?.cpuDifficulty ?? 'normal';
        while (players.length < n) {
          players.push({
            fighterId: picks[players.length] ?? prev.roster[0]?.id ?? '',
            paletteIndex: players.length % 4,
            controlType: 'cpu',
            cpuDifficulty: difficulty,
          });
        }
        return { ...prev, matchConfig: { ...prev.matchConfig, players } };
      }),
    resetRoster: () =>
      setState((prev) => ({
        ...prev,
        roster: resetRosterToDefaults(),
        matchConfig: INITIAL_CONFIG,
      })),
  };
}
