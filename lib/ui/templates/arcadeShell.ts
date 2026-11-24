'use client';

import React from 'react';
import { useArcadeShellState } from '../../hooks/useArcadeShellState';
import { CharacterSelect } from '../organisms/characterSelect';
import { StageSelect } from '../organisms/stageSelect';
import { MatchViewport } from '../organisms/matchViewport';
import { PixelForgeDrawer } from '../organisms/pixelForgeDrawer';
import { PngImporterModal } from '../organisms/pngImporterModal';
import { SoundCloudMusicBar } from '../molecules/soundCloudMusicBar';

export function ArcadeShell(): React.ReactElement {
  const shell = useArcadeShellState();
  const { screen, roster, matchConfig, p1Fighter, p2Fighter, stage, forgeFighter, importerOpen, musicOpen } = shell;

  let screenEl: React.ReactElement;
  if (screen === 'PLAYING') {
    screenEl = React.createElement(MatchViewport, {
      fighters: [p1Fighter, p2Fighter],
      matchConfig,
      stage,
      musicOpen,
      onToggleEra: shell.toggleEra,
      onToggleMusic: shell.toggleMusic,
      onExitToCharacterSelect: () => shell.setScreen('CHARACTER_SELECT'),
      onExitToStageSelect: () => shell.setScreen('STAGE_SELECT'),
    });
  } else if (screen === 'STAGE_SELECT') {
    screenEl = React.createElement(StageSelect, {
      selectedStageId: matchConfig.stageId,
      p1Summary: `P1 ${p1Fighter.name}`,
      p2Summary: `P2 ${p2Fighter.name} (${matchConfig.players[1].controlType === 'cpu' ? 'CPU' : '2P'})`,
      stocks: matchConfig.stocks,
      graphicsEra: matchConfig.graphicsEra,
      musicOpen,
      onSelectStage: (stageId) => shell.setMatchConfig((prev) => ({ ...prev, stageId })),
      onSetEra: shell.setEra,
      onToggleMusic: shell.toggleMusic,
      onBack: () => shell.setScreen('CHARACTER_SELECT'),
      onLaunchMatch: () => shell.setScreen('PLAYING'),
    });
  } else {
    screenEl = React.createElement(CharacterSelect, {
      roster,
      matchConfig,
      onUpdateMatchConfig: shell.setMatchConfig,
      onOpenStageSelect: () => shell.setScreen('STAGE_SELECT'),
      onOpenPixelForge: (fighterId) => shell.setForgeFighterId(fighterId),
      onOpenPngImporter: () => shell.setImporterOpen(true),
      onResetRoster: shell.resetRoster,
    });
  }

  return React.createElement(
    React.Fragment,
    null,
    screenEl,
    React.createElement(SoundCloudMusicBar, {
      stage,
      isOpen: musicOpen,
      isInMatch: screen === 'PLAYING',
      onToggleOpen: shell.toggleMusic,
    }),
    forgeFighter
      ? React.createElement(PixelForgeDrawer, {
          key: `${forgeFighter.id}-${matchConfig.graphicsEra}`,
          fighter: forgeFighter,
          graphicsEra: matchConfig.graphicsEra,
          onClose: () => shell.setForgeFighterId(null),
          onSaveFighter: shell.saveFighter,
          onCloneNewFighter: shell.registerNewFighter,
        })
      : null,
    importerOpen
      ? React.createElement(PngImporterModal, {
          onClose: () => shell.setImporterOpen(false),
          onRegisterFighter: shell.registerNewFighter,
        })
      : null,
  );
}
