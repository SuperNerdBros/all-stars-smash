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
import { OnlineMatchScreen } from '../organisms/onlineMatchScreen';
import { useOnlineRoom } from '../../hooks/useOnlineRoom';
import { joinCodeFromUrl } from '../../net/playApi';

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
  const online = useOnlineRoom(matchConfig, matchConfig.graphicsEra);
  const goOnline = (start: () => unknown) => {
    start();
    shell.setScreen('ONLINE');
  };
  const leaveOnline = () => {
    online.leave();
    shell.setScreen('TITLE');
  };
  // Opened from an invite link: join that room as soon as the player is past the disclaimer.
  const autoJoined = React.useRef(false);
  React.useEffect(() => {
    if (autoJoined.current || screen !== 'TITLE') return;
    autoJoined.current = true;
    const code = joinCodeFromUrl();
    if (code) goOnline(() => online.join(code));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

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
      onPlayOnline: () => goOnline(online.host),
      onJoinRoom: (code: string) => goOnline(() => online.join(code)),
      onQuickBrawl: shell.startQuickBrawl,
      onOpenPixelForge: () => shell.setForgeFighterId(p1Fighter.id),
      onUpdateMatchConfig: shell.setMatchConfig,
      onSetEra: shell.setEra,
      onToggleMusic: shell.toggleMusic,
      onShuffleAttract: shell.shuffleAttract,
    });
  } else if (screen === 'ONLINE' && online.room && online.view) {
    screenEl = React.createElement(OnlineMatchScreen, {
      room: online.room,
      view: online.view,
      roster,
      graphicsEra: matchConfig.graphicsEra,
      musicOpen,
      onToggleEra: shell.toggleEra,
      onToggleMusic: shell.toggleMusic,
      onLeave: leaveOnline,
    });
  } else if (screen === 'ONLINE') {
    screenEl = React.createElement(
      'div',
      { className: 'fixed inset-0 flex flex-col items-center justify-center gap-4 bg-[#070B16] text-white font-display font-black uppercase' },
      React.createElement('div', { className: 'text-2xl animate-pulse' }, online.error ?? 'Finding a room…'),
      React.createElement('button', { type: 'button', onClick: leaveOnline, className: 'px-4 py-2 bg-[#7F1D1D] border-2 border-black text-sm cursor-pointer' }, 'Back'),
    );
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
          isInMatch: screen === 'PLAYING' || screen === 'ONLINE',
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
