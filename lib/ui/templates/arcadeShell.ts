'use client';

import React, { useEffect, useState } from 'react';
import type { FighterBlueprint } from '../../types/fighter';
import type { MatchConfig } from '../../types/protocol';
import {
  BUILTIN_FIGHTERS,
  loadRoster,
  resetRosterToDefaults,
  saveCustomFighterToStorage,
} from '../../roster/registry';
import { getStageById } from '../../stages/manifests';
import { CharacterSelect } from '../organisms/characterSelect';
import { StageSelect } from '../organisms/stageSelect';
import { MatchViewport } from '../organisms/matchViewport';
import { PixelForgeDrawer } from '../organisms/pixelForgeDrawer';
import { PngImporterModal } from '../organisms/pngImporterModal';

type ScreenState = 'CHARACTER_SELECT' | 'STAGE_SELECT' | 'PLAYING';

const INITIAL_CONFIG: MatchConfig = {
  players: [
    {
      fighterId: 'mario',
      paletteIndex: 0,
      controlType: 'human',
      cpuDifficulty: 'normal',
    },
    {
      fighterId: 'link',
      paletteIndex: 0,
      controlType: 'cpu',
      cpuDifficulty: 'normal',
    },
  ],
  stageId: 'sky-citadel',
  stocks: 3,
};

export function ArcadeShell(): React.ReactElement {
  const [screen, setScreen] = useState<ScreenState>('CHARACTER_SELECT');
  const [roster, setRoster] = useState<FighterBlueprint[]>(() => [...BUILTIN_FIGHTERS]);
  const [matchConfig, setMatchConfig] = useState<MatchConfig>(INITIAL_CONFIG);
  const [forgeFighterId, setForgeFighterId] = useState<string | null>(null);
  const [importerOpen, setImporterOpen] = useState<boolean>(false);

  // Hydrate persisted 4-bit nibble custom fighters on client mount
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setRoster(loadRoster());
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const p1Fighter =
    roster.find((f) => f.id === matchConfig.players[0].fighterId) ?? roster[0];
  const p2Fighter =
    roster.find((f) => f.id === matchConfig.players[1].fighterId) ?? roster[1] ?? roster[0];
  const stage = getStageById(matchConfig.stageId);

  const forgeFighter = forgeFighterId
    ? roster.find((f) => f.id === forgeFighterId) ?? null
    : null;

  const handleSaveFighter = (updated: FighterBlueprint) => {
    setRoster((prev) => saveCustomFighterToStorage(prev, updated));
  };

  const handleRegisterNewFighter = (created: FighterBlueprint) => {
    setRoster((prev) => saveCustomFighterToStorage(prev, created));
    setMatchConfig((prev) => ({
      ...prev,
      players: [
        { ...prev.players[0], fighterId: created.id, paletteIndex: 0 },
        prev.players[1],
      ],
    }));
  };

  const handleResetRoster = () => {
    const defaults = resetRosterToDefaults();
    setRoster(defaults);
    setMatchConfig(INITIAL_CONFIG);
  };

  let screenEl: React.ReactElement;
  if (screen === 'PLAYING') {
    screenEl = React.createElement(MatchViewport, {
      fighters: [p1Fighter, p2Fighter],
      matchConfig,
      stage,
      onExitToCharacterSelect: () => setScreen('CHARACTER_SELECT'),
      onExitToStageSelect: () => setScreen('STAGE_SELECT'),
    });
  } else if (screen === 'STAGE_SELECT') {
    screenEl = React.createElement(StageSelect, {
      selectedStageId: matchConfig.stageId,
      p1Summary: `P1 ${p1Fighter.name}`,
      p2Summary: `P2 ${p2Fighter.name} (${matchConfig.players[1].controlType === 'cpu' ? 'CPU' : '2P'})`,
      stocks: matchConfig.stocks,
      onSelectStage: (stageId) => setMatchConfig((prev) => ({ ...prev, stageId })),
      onBack: () => setScreen('CHARACTER_SELECT'),
      onLaunchMatch: () => setScreen('PLAYING'),
    });
  } else {
    screenEl = React.createElement(CharacterSelect, {
      roster,
      matchConfig,
      onUpdateMatchConfig: setMatchConfig,
      onOpenStageSelect: () => setScreen('STAGE_SELECT'),
      onOpenPixelForge: (fighterId) => setForgeFighterId(fighterId),
      onOpenPngImporter: () => setImporterOpen(true),
      onResetRoster: handleResetRoster,
    });
  }

  return React.createElement(
    React.Fragment,
    null,
    screenEl,
    forgeFighter
      ? React.createElement(PixelForgeDrawer, {
          key: forgeFighter.id,
          fighter: forgeFighter,
          onClose: () => setForgeFighterId(null),
          onSaveFighter: handleSaveFighter,
          onCloneNewFighter: handleRegisterNewFighter,
        })
      : null,
    importerOpen
      ? React.createElement(PngImporterModal, {
          onClose: () => setImporterOpen(false),
          onRegisterFighter: handleRegisterNewFighter,
        })
      : null,
  );
}
