'use client';

import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { Play, RotateCcw } from 'lucide-react';
import type { FighterBlueprint, GraphicsEra } from '../../types/fighter';
import type { CameraPreset, HudSnapshot, MatchConfig } from '../../types/protocol';
import type { StageManifest } from '../../types/stage';
import { chiptuneAudio } from '../../io/chiptuneAudio';
import { useMatchEngine } from '../../hooks/useMatchEngine';
import { useMatchTouchControls } from '../../hooks/useMatchTouchControls';
import { useVictoryTransition } from '../../hooks/useVictoryTransition';
import { ArcadeButton } from '../atoms/button';
import { CameraSwitcher } from '../molecules/cameraSwitcher';
import { HudFighterCard } from '../molecules/hudFighterCard';
import { TouchGamepad } from '../molecules/touchGamepad';
import type { NetRoom } from '../../net/netRoom';

export interface MatchViewportProps {
  fighters: FighterBlueprint[];
  matchConfig: MatchConfig;
  stage: StageManifest;
  musicOpen: boolean;
  onToggleEra: () => void;
  onToggleMusic: () => void;
  onMatchComplete: (hud: HudSnapshot) => void;
  onExitToCharacterSelect: () => void;
  onExitToStageSelect: () => void;
  online?: NetRoom | null;
  overlay?: React.ReactElement | null;
  seatLabels?: string[];
}

const GAME_STROKE_STYLE: React.CSSProperties = {
  textShadow:
    '4px 4px 0 #000, -4px -4px 0 #000, 4px -4px 0 #000, -4px 4px 0 #000, 0 12px 28px rgba(0,0,0,0.92)',
};

function renderPauseModal(
  stageName: string,
  onResume: () => void,
  onRematch: () => void,
  onStageSelect: () => void,
  onCharSelect: () => void,
): React.ReactElement {
  return React.createElement(
    'div',
    { className: 'fixed inset-0 bg-[#0B1020]/78 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 z-30' },
    React.createElement(
      'div',
      { className: 'w-full max-w-md max-h-[90dvh] overflow-y-auto bg-[#141C2F] border-[3px] border-black shadow-[8px_8px_0_#000] p-5 sm:p-6 flex flex-col gap-4 sm:gap-5' },
      React.createElement(
        'div',
        null,
        React.createElement('h2', { className: 'font-display text-2xl font-black uppercase text-white' }, 'Match Paused'),
        React.createElement('p', { className: 'text-xs text-[#94A3B8] mt-1' }, `${stageName} · Press Esc to resume`),
      ),
      React.createElement(
        'div',
        { className: 'bg-[#0B1020] border border-[#2B3858] p-3.5 text-xs text-[#CBD5E1] flex flex-col gap-1.5' },
        React.createElement('div', { className: 'font-semibold text-white' }, 'Controls Reference'),
        React.createElement('div', null, 'Touch / Auto-Lock: Tap any opponent name at the bottom to auto-lock, then press the on-screen gamepad buttons (toggle Pad at top-right)'),
        React.createElement('div', null, 'P1 Keyboard: WASD + Space (Jump) · J Attack · K Smash · L Special · W+L Recovery · Shift Shield · I Grab'),
        React.createElement('div', null, 'P2 Local: Arrows · Num1/Comma Attack · Num2/Period Smash · Num3/Slash Special'),
        React.createElement('div', null, 'Camera: 1 Side · 2 Iso · 3 Top 62° · 4 3rd-Person · H Hitboxes · E NES/16-Bit'),
      ),
      React.createElement(
        'div',
        { className: 'flex flex-col gap-2' },
        React.createElement(ArcadeButton, {
          label: 'Resume Match',
          variant: 'primary',
          icon: React.createElement(Play, { className: 'w-4 h-4' }),
          onClick: onResume,
        }),
        React.createElement(ArcadeButton, {
          label: 'Restart Match',
          variant: 'secondary',
          icon: React.createElement(RotateCcw, { className: 'w-4 h-4' }),
          onClick: onRematch,
        }),
        React.createElement(
          'div',
          { className: 'grid grid-cols-2 gap-2 pt-1' },
          React.createElement(ArcadeButton, { label: 'Change Stage', variant: 'ghost', onClick: onStageSelect }),
          React.createElement(ArcadeButton, { label: 'Change Fighters', variant: 'ghost', onClick: onCharSelect }),
        ),
      ),
    ),
  );
}

function renderGameFinishSplash(): React.ReactElement {
  return React.createElement(
    'div',
    {
      className:
        'pointer-events-none fixed inset-0 z-30 flex items-center justify-center bg-black/35',
    },
    React.createElement(
      motion.div,
      {
        initial: { scale: 2.6, rotate: -10, opacity: 0 },
        animate: { scale: 1, rotate: -4, opacity: 1 },
        transition: { type: 'spring', stiffness: 300, damping: 18 },
        className:
          'px-8 sm:px-10 py-3 sm:py-4 bg-gradient-to-b from-[#FDE047] via-[#F59E0B] to-[#DC2626] border-[6px] border-black shadow-[10px_10px_0_#000]',
      },
      React.createElement(
        'span',
        {
          className:
            'font-display font-black italic uppercase text-5xl sm:text-8xl tracking-tight text-white block leading-none',
          style: GAME_STROKE_STYLE,
        },
        'GAME!',
      ),
    ),
  );
}

interface ViewportModel {
  activePreset: CameraPreset;
  activeEra: GraphicsEra;
  hitboxesVisible: boolean;
  paused: boolean;
  winnerSlot: number | null;
  lockedTargetSlot: number | null;
  matchSeconds: number;
}

function deriveViewportModel(hud: HudSnapshot | null, matchConfig: MatchConfig): ViewportModel {
  if (!hud) {
    return {
      activePreset: 'SIDE_25D',
      activeEra: matchConfig.graphicsEra,
      hitboxesVisible: false,
      paused: false,
      winnerSlot: null,
      lockedTargetSlot: null,
      matchSeconds: 0,
    };
  }

  return {
    activePreset: hud.cameraPreset,
    activeEra: hud.graphicsEra,
    hitboxesVisible: hud.hitboxesVisible,
    paused: hud.paused,
    winnerSlot: hud.winnerSlot,
    lockedTargetSlot: hud.lockedTargetSlot,
    matchSeconds: Math.floor(hud.matchTimeTicks / 60),
  };
}

export function seatControlLabel(seat: MatchConfig['players'][number] | undefined, slot: number): string {
  if (!seat || seat.controlType === 'cpu') {
    const difficulty = seat?.cpuDifficulty ?? 'normal';
    return `CPU ${difficulty[0].toUpperCase()}${difficulty.slice(1)}`;
  }
  if (slot === 0) return 'Human';
  if (slot === 1) return 'Local 2P';
  return `P${slot + 1}`;
}

interface HudCardRenderParams {
  hud: HudSnapshot | null;
  fighters: FighterBlueprint[];
  activeEra: GraphicsEra;
  matchConfig: MatchConfig;
  lockedTargetSlot: number | null;
  canUseAutoTarget: boolean;
  compact: boolean;
  seatLabels?: string[];
  onSelectTarget: (slot: number) => void;
}

function resolveHudBarLayout(fighterCount: number): string {
  if (fighterCount <= 2) {
    return 'grid grid-cols-2 items-end gap-2 px-2.5 sm:flex sm:flex-wrap sm:justify-center sm:gap-10 sm:px-6';
  }
  if (fighterCount > 4) {
    return 'flex flex-nowrap overflow-x-auto items-end gap-2 px-2.5 sm:flex-wrap sm:overflow-visible sm:justify-center sm:gap-2 sm:scale-75 sm:origin-bottom sm:px-6';
  }
  return 'flex flex-nowrap overflow-x-auto items-end gap-2 px-2.5 sm:flex-wrap sm:overflow-visible sm:justify-center sm:gap-8 sm:px-6';
}

function renderHudCards(params: HudCardRenderParams): React.ReactElement | null {
  const {
    hud,
    fighters,
    activeEra,
    matchConfig,
    lockedTargetSlot,
    canUseAutoTarget,
    compact,
    seatLabels,
    onSelectTarget,
  } = params;
  if (!hud) return null;

  const fighterCount = hud.fighters.length;
  const isCrowded = fighterCount > 4;
  const isScrollableRow = fighterCount > 2;
  const barLayout = resolveHudBarLayout(fighterCount);

  return React.createElement(
    'div',
    {
      className: `pointer-events-none fixed bottom-2 sm:bottom-5 left-0 right-0 z-10 ${barLayout}`,
    },
    ...hud.fighters.map((snap) => {
      const seat = matchConfig.players[snap.slot];
      const fighter = fighters[snap.slot];
      if (!fighter) return null;
      const isOpponent = snap.slot !== 0;
      const card = React.createElement(HudFighterCard, {
        key: snap.slot,
        snapshot: snap,
        fighter,
        graphicsEra: activeEra,
        controlLabel: seatLabels?.[snap.slot] || seatControlLabel(seat, snap.slot),
        canTarget: canUseAutoTarget && isOpponent,
        isLockedTarget: lockedTargetSlot === snap.slot,
        compact: compact || isCrowded,
        onSelectTarget,
      });

      if (!isScrollableRow) return card;

      return React.createElement(
        'div',
        { key: snap.slot, className: 'shrink-0 w-[166px] sm:w-auto pointer-events-auto' },
        card,
      );
    }),
  );
}

function renderEngineErrorModal(engineError: string, onExit: () => void): React.ReactElement {
  return React.createElement(
    'div',
    { className: 'fixed inset-0 z-30 flex items-center justify-center bg-[#0B1020]/90 p-6' },
    React.createElement(
      'div',
      { className: 'max-w-md bg-[#141C2F] border border-[#EF4444]/50 p-6 text-center flex flex-col gap-4' },
      React.createElement('h2', { className: 'font-display text-lg font-bold text-white' }, 'Renderer Error'),
      React.createElement('p', { className: 'text-sm text-[#CBD5E1]' }, engineError),
      React.createElement(ArcadeButton, {
        label: 'Return to Character Select',
        variant: 'primary',
        onClick: onExit,
      }),
    ),
  );
}

interface OverlayParams {
  engineError: string | null;
  model: ViewportModel;
  stageName: string;
  onResume: () => void;
  onRematch: () => void;
  onStageSelect: () => void;
  onCharSelect: () => void;
}

function renderActiveOverlay(p: OverlayParams): React.ReactElement | null {
  if (p.engineError) {
    return renderEngineErrorModal(p.engineError, p.onCharSelect);
  }
  if (p.model.winnerSlot !== null) {
    return renderGameFinishSplash();
  }
  if (p.model.paused) {
    return renderPauseModal(
      p.stageName,
      p.onResume,
      p.onRematch,
      p.onStageSelect,
      p.onCharSelect,
    );
  }
  return null;
}

function VictoryWatcher(props: {
  winnerSlot: number | null;
  hud: HudSnapshot | null;
  onMatchComplete: (hud: HudSnapshot) => void;
}): null {
  useVictoryTransition(props.winnerSlot, props.hud, props.onMatchComplete);
  return null;
}

export function MatchViewport(props: MatchViewportProps): React.ReactElement {
  const {
    fighters,
    matchConfig,
    stage,
    musicOpen,
    onToggleEra,
    onToggleMusic,
    onMatchComplete,
    onExitToCharacterSelect,
    onExitToStageSelect,
    online,
    overlay,
    seatLabels,
  } = props;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasHostRef = useRef<HTMLDivElement | null>(null);

  const {
    state,
    selectCamera,
    toggleControl,
    restartMatch,
    setTargetLock,
    setVirtualInputMask,
  } = useMatchEngine(
    containerRef,
    canvasHostRef,
    fighters,
    matchConfig,
    stage,
    onToggleEra,
    online,
  );

  const model = deriveViewportModel(state.hud, matchConfig);

  const touchControls = useMatchTouchControls({
    hud: state.hud,
    lockedTargetSlot: model.lockedTargetSlot,
    paused: model.paused,
    winnerSlot: model.winnerSlot,
    setTargetLock,
    setVirtualInputMask,
  });

  const p1IsHuman = matchConfig.players[0]?.controlType === 'human' || Boolean(online);
  const isMatchActive = !model.paused && model.winnerSlot === null && !state.engineError;
  const showGamepad = touchControls.touchPadOpen && p1IsHuman && isMatchActive;

  const handleToggleEra = () => {
    chiptuneAudio.playMenuTick();
    onToggleEra();
  };

  return React.createElement(
    'div',
    {
      ref: containerRef,
      className: 'fixed inset-0 w-screen h-dvh bg-[#070B16] text-[#F1F5F9] overflow-hidden select-none',
    },
    React.createElement(VictoryWatcher, {
      winnerSlot: model.winnerSlot,
      hud: state.hud,
      onMatchComplete,
    }),
    React.createElement('div', { ref: canvasHostRef, className: 'absolute inset-0 w-full h-full' }),
    React.createElement(CameraSwitcher, {
      activePreset: model.activePreset,
      graphicsEra: model.activeEra,
      hitboxesVisible: model.hitboxesVisible,
      muted: state.isMuted,
      musicOpen,
      touchPadOpen: touchControls.touchPadOpen,
      stageName: stage.name,
      matchSeconds: model.matchSeconds,
      onSelectCamera: selectCamera,
      onToggleEra: handleToggleEra,
      onToggleHitbox: () => toggleControl('hitbox'),
      onToggleMute: () => toggleControl('mute'),
      onToggleMusic,
      onToggleTouchPad: touchControls.toggleTouchPad,
      onPause: () => toggleControl('pause'),
    }),
    showGamepad
      ? React.createElement(TouchGamepad, {
          lockedTargetName: touchControls.lockedTargetName,
          hasLivingOpponents: touchControls.hasLivingOpponents,
          onMaskChange: setVirtualInputMask,
          onCycleTarget: () => touchControls.selectTarget('next'),
          onClearTarget: () => touchControls.selectTarget(null),
        })
      : null,
    renderHudCards({
      hud: state.hud,
      fighters,
      activeEra: model.activeEra,
      matchConfig,
      lockedTargetSlot: model.lockedTargetSlot,
      canUseAutoTarget: p1IsHuman && isMatchActive,
      compact: touchControls.touchPadOpen,
      seatLabels,
      onSelectTarget: (slot) => touchControls.selectTarget(slot),
    }),
    overlay ?? null,
    renderActiveOverlay({
      engineError: state.engineError,
      model,
      stageName: stage.name,
      onResume: () => toggleControl('pause'),
      onRematch: restartMatch,
      onStageSelect: onExitToStageSelect,
      onCharSelect: onExitToCharacterSelect,
    }),
  );
}
