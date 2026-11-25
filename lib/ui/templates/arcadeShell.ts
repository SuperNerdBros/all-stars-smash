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
import { SoundTestScreen } from '../organisms/soundTestScreen';
import { useOnlineRoom } from '../../hooks/useOnlineRoom';
import { joinCodeFromUrl } from '../../net/playApi';

type ScreenOrigin = 'TITLE' | 'CHARACTER_SELECT';
type ShellState = ReturnType<typeof useArcadeShellState>;
type OnlineState = ReturnType<typeof useOnlineRoom>;

interface ScreenDispatchContext {
  shell: ShellState;
  online: OnlineState;
  goOnline: (start: () => unknown, origin?: ScreenOrigin) => void;
  leaveOnline: () => void;
  openSoundTest: (origin: ScreenOrigin) => void;
  leaveSoundTest: () => void;
}

function renderOnlineScreen(ctx: ScreenDispatchContext): React.ReactElement {
  const { shell, online, leaveOnline } = ctx;
  const hasLiveRoom = Boolean(online.room && online.view);
  if (hasLiveRoom && online.room && online.view) {
    return React.createElement(OnlineMatchScreen, {
      room: online.room,
      view: online.view,
      roster: shell.roster,
      graphicsEra: shell.matchConfig.graphicsEra,
      musicOpen: shell.musicOpen,
      onToggleEra: shell.toggleEra,
      onToggleMusic: shell.toggleMusic,
      onLeave: leaveOnline,
    });
  }
  return React.createElement(
    'div',
    { className: 'fixed inset-0 flex flex-col items-center justify-center gap-4 bg-[#070B16] text-white font-display font-black uppercase' },
    React.createElement('div', { className: 'text-2xl animate-pulse' }, online.error ?? 'Finding a room…'),
    React.createElement('button', { type: 'button', onClick: leaveOnline, className: 'px-4 py-2 bg-[#7F1D1D] border-2 border-black text-sm cursor-pointer' }, 'Back'),
  );
}

function buildP2Summary(shell: ShellState): string {
  const { matchConfig, p2Fighter } = shell;
  const isMultiOpponent = matchConfig.players.length > 2;
  if (isMultiOpponent) return `+${matchConfig.players.length - 1} opponents`;
  const p2Role = matchConfig.players[1].controlType === 'cpu' ? 'CPU' : '2P';
  return `P2 ${p2Fighter.name} (${p2Role})`;
}

const SCREEN_RENDERERS: Record<string, (ctx: ScreenDispatchContext) => React.ReactElement> = {
  DISCLAIMER: ({ shell }) => React.createElement(DisclaimerScreen, { onContinue: shell.dismissDisclaimer }),
  TITLE: ({ shell, online, goOnline, openSoundTest }) =>
    React.createElement(TitleScreen, {
      stage: shell.stage,
      attractFighters: shell.attractFighters,
      matchConfig: shell.matchConfig,
      musicOpen: shell.musicOpen,
      onPlay: () => shell.setScreen('CHARACTER_SELECT'),
      onPlayOnline: () => goOnline(online.host, 'TITLE'),
      onJoinRoom: (code: string) => goOnline(() => online.join(code), 'TITLE'),
      onQuickBrawl: shell.startQuickBrawl,
      onOpenPixelForge: () => shell.setForgeFighterId(shell.p1Fighter.id),
      onOpenSoundTest: () => openSoundTest('TITLE'),
      onUpdateMatchConfig: shell.setMatchConfig,
      onSetEra: shell.setEra,
      onToggleMusic: shell.toggleMusic,
      onShuffleAttract: shell.shuffleAttract,
    }),
  SOUND_TEST: ({ shell, leaveSoundTest }) =>
    React.createElement(SoundTestScreen, {
      graphicsEra: shell.matchConfig.graphicsEra,
      onSetEra: shell.setEra,
      onBack: leaveSoundTest,
    }),
  ONLINE: renderOnlineScreen,
  VS_INTRO: ({ shell }) =>
    React.createElement(VsIntroScreen, {
      fighters: shell.matchFighters,
      matchConfig: shell.matchConfig,
      stage: shell.stage,
      onComplete: () => shell.setScreen('PLAYING'),
    }),
  PLAYING: ({ shell }) =>
    React.createElement(MatchViewport, {
      fighters: shell.matchFighters,
      matchConfig: shell.matchConfig,
      stage: shell.stage,
      musicOpen: shell.musicOpen,
      onToggleEra: shell.toggleEra,
      onToggleMusic: shell.toggleMusic,
      onMatchComplete: shell.completeMatch,
      onExitToCharacterSelect: () => shell.setScreen('CHARACTER_SELECT'),
      onExitToStageSelect: () => shell.setScreen('STAGE_SELECT'),
    }),
  STAGE_SELECT: ({ shell }) =>
    React.createElement(StageSelect, {
      selectedStageId: shell.matchConfig.stageId,
      p1Summary: `P1 ${shell.p1Fighter.name}`,
      p2Summary: buildP2Summary(shell),
      stocks: shell.matchConfig.stocks,
      graphicsEra: shell.matchConfig.graphicsEra,
      musicOpen: shell.musicOpen,
      onSelectStage: (stageId) => shell.setMatchConfig((prev) => ({ ...prev, stageId })),
      onSetEra: shell.setEra,
      onToggleMusic: shell.toggleMusic,
      onBack: () => shell.setScreen('CHARACTER_SELECT'),
      onLaunchMatch: shell.launchVsIntro,
    }),
  CHARACTER_SELECT: ({ shell, online, goOnline, openSoundTest }) =>
    React.createElement(CharacterSelect, {
      roster: shell.roster,
      matchConfig: shell.matchConfig,
      onUpdateMatchConfig: shell.setMatchConfig,
      onBackToTitle: () => shell.setScreen('TITLE'),
      onOpenStageSelect: () => shell.setScreen('STAGE_SELECT'),
      onOpenPixelForge: (fighterId) => shell.setForgeFighterId(fighterId),
      onOpenPngImporter: () => shell.setImporterOpen(true),
      onOpenSoundTest: () => openSoundTest('CHARACTER_SELECT'),
      onResetRoster: shell.resetRoster,
      onOnlineBattle: () => goOnline(() => online.join(''), 'CHARACTER_SELECT'),
      onHostBattle: () => goOnline(online.host, 'CHARACTER_SELECT'),
      onJoinRoom: (code: string) => goOnline(() => online.join(code), 'CHARACTER_SELECT'),
    }),
};

function renderActiveScreen(ctx: ScreenDispatchContext): React.ReactElement {
  const { shell } = ctx;
  const isVictoryReady = shell.screen === 'VICTORY' && Boolean(shell.lastMatchHud);
  if (isVictoryReady && shell.lastMatchHud) {
    return React.createElement(VictoryScreen, {
      hud: shell.lastMatchHud,
      fighters: shell.matchFighters,
      matchConfig: shell.matchConfig,
      stage: shell.stage,
      onRematch: shell.launchVsIntro,
      onStageSelect: () => shell.setScreen('STAGE_SELECT'),
      onCharacterSelect: () => shell.setScreen('CHARACTER_SELECT'),
    });
  }
  const renderer = SCREEN_RENDERERS[shell.screen] ?? SCREEN_RENDERERS.CHARACTER_SELECT;
  return renderer(ctx);
}

export function ArcadeShell(): React.ReactElement {
  const shell = useArcadeShellState();
  const { screen, matchConfig, stage, forgeFighter, importerOpen, musicOpen, musicAutoStart } = shell;
  const online = useOnlineRoom(matchConfig, matchConfig.graphicsEra);
  const [returnOrigin, setReturnOrigin] = React.useState<ScreenOrigin>('TITLE');
  const goOnline = (start: () => unknown, origin: ScreenOrigin = 'TITLE') => {
    setReturnOrigin(origin);
    start();
    shell.setScreen('ONLINE');
  };
  const leaveOnline = () => {
    online.leave();
    shell.setScreen(returnOrigin);
  };
  const openSoundTest = (origin: ScreenOrigin) => {
    setReturnOrigin(origin);
    shell.setScreen('SOUND_TEST');
  };
  const leaveSoundTest = () => {
    shell.setScreen(returnOrigin);
  };
  // Opened from an invite link: join that room as soon as the player is past the disclaimer.
  const autoJoined = React.useRef(false);
  React.useEffect(() => {
    const shouldSkipAutoJoin = autoJoined.current || screen !== 'TITLE';
    if (shouldSkipAutoJoin) return;
    autoJoined.current = true;
    const code = joinCodeFromUrl();
    if (code) {
      online.join(code);
      shell.setScreen('ONLINE');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  const screenEl = renderActiveScreen({ shell, online, goOnline, leaveOnline, openSoundTest, leaveSoundTest });
  const isInMatch = screen === 'PLAYING' || screen === 'ONLINE';

  return React.createElement(
    React.Fragment,
    null,
    screenEl,
    screen !== 'DISCLAIMER'
      ? React.createElement(SoundCloudMusicBar, {
          stage,
          isOpen: musicOpen,
          isInMatch,
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
