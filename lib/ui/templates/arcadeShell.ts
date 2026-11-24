'use client';

import React from 'react';
import { useArcadeShellState } from '../../hooks/useArcadeShellState';
import { DisclaimerScreen } from '../organisms/disclaimerScreen';
import { TitleScreen } from '../organisms/titleScreen';
import { CharacterSelect } from '../organisms/characterSelect';
import { StageSelect } from '../organisms/stageSelect';
import { VsIntroScreen } from '../organisms/vsIntroScreen';
import { MatchViewport } from '../organisms/matchViewport';
import { VictoryScreen } from '../organisms/victoryScreen';
import { PixelForgeDrawer } from '../organisms/pixelForgeDrawer';
import { PngImporterModal } from '../organisms/pngImporterModal';
import { SoundCloudMusicBar } from '../molecules/soundCloudMusicBar';

export function ArcadeShell(): React.ReactElement {
  const shell = useArcadeShellState();
  const {
    screen,
    roster,
    matchConfig,
    attractFighters,
    lastMatchHud,
    p1Fighter,
    p2Fighter,
    stage,
    forgeFighter,
    importerOpen,
    musicOpen,
    musicAutoStart,
  } = shell;

  let screenEl: React.ReactElement;
  if (screen === 'DISCLAIMER') {
    screenEl = React.createElement(DisclaimerScreen, {
      onContinue: shell.dismissDisclaimer,
    });
  } else if (screen === 'TITLE') {
    screenEl = React.createElement(TitleScreen, {
      stage,
      attractFighters,
      matchConfig,
      musicOpen,
      onPlay: () => shell.setScreen('CHARACTER_SELECT'),
      onQuickBrawl: shell.startQuickBrawl,
      onOpenPixelForge: () => shell.setForgeFighterId(p1Fighter.id),
      onUpdateMatchConfig: shell.setMatchConfig,
      onSetEra: shell.setEra,
      onToggleMusic: shell.toggleMusic,
      onShuffleAttract: shell.shuffleAttract,
    });
  } else if (screen === 'VS_INTRO') {
    screenEl = React.createElement(VsIntroScreen, {
      fighters: shell.matchFighters,
      matchConfig,
      stage,
      onComplete: () => shell.setScreen('PLAYING'),
    });
  } else if (screen === 'PLAYING') {
    screenEl = React.createElement(MatchViewport, {
      fighters: shell.matchFighters,
      matchConfig,
      stage,
      musicOpen,
      onToggleEra: shell.toggleEra,
      onToggleMusic: shell.toggleMusic,
      onMatchComplete: shell.completeMatch,
      onExitToCharacterSelect: () => shell.setScreen('CHARACTER_SELECT'),
      onExitToStageSelect: () => shell.setScreen('STAGE_SELECT'),
    });
  } else if (screen === 'VICTORY' && lastMatchHud) {
    screenEl = React.createElement(VictoryScreen, {
      hud: lastMatchHud,
      fighters: shell.matchFighters,
      matchConfig,
      stage,
      onRematch: shell.launchVsIntro,
      onStageSelect: () => shell.setScreen('STAGE_SELECT'),
      onCharacterSelect: () => shell.setScreen('CHARACTER_SELECT'),
    });
  } else if (screen === 'STAGE_SELECT') {
    screenEl = React.createElement(StageSelect, {
      selectedStageId: matchConfig.stageId,
      p1Summary: `P1 ${p1Fighter.name}`,
      p2Summary: matchConfig.players.length > 2 ? `+${matchConfig.players.length - 1} opponents` : `P2 ${p2Fighter.name} (${matchConfig.players[1].controlType === 'cpu' ? 'CPU' : '2P'})`,
      stocks: matchConfig.stocks,
      graphicsEra: matchConfig.graphicsEra,
      musicOpen,
      onSelectStage: (stageId) => shell.setMatchConfig((prev) => ({ ...prev, stageId })),
      onSetEra: shell.setEra,
      onToggleMusic: shell.toggleMusic,
      onBack: () => shell.setScreen('CHARACTER_SELECT'),
      onLaunchMatch: shell.launchVsIntro,
    });
  } else {
    screenEl = React.createElement(CharacterSelect, {
      roster,
      matchConfig,
      onUpdateMatchConfig: shell.setMatchConfig,
      onBackToTitle: () => shell.setScreen('TITLE'),
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
    screen !== 'DISCLAIMER'
      ? React.createElement(SoundCloudMusicBar, {
          stage,
          isOpen: musicOpen,
          isInMatch: screen === 'PLAYING',
          autoStart: musicAutoStart,
          onToggleOpen: shell.toggleMusic,
        })
      : null,
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
