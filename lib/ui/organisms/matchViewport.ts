'use client';

import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { Play, RotateCcw } from 'lucide-react';
import type { FighterBlueprint, GraphicsEra } from '../../types/fighter';
import type { CameraPreset, HudSnapshot, MatchConfig } from '../../types/protocol';
import type { StageManifest } from '../../types/stage';
import { chiptuneAudio } from '../../io/chiptuneAudio';
import { useMatchEngine } from '../../hooks/useMatchEngine';
import { useVictoryTransition } from '../../hooks/useVictoryTransition';
import { ArcadeButton } from '../atoms/button';
import { CameraSwitcher } from '../molecules/cameraSwitcher';
import { HudFighterCard } from '../molecules/hudFighterCard';

export interface MatchViewportProps {
  fighters: [FighterBlueprint, FighterBlueprint];
  matchConfig: MatchConfig;
  stage: StageManifest;
  musicOpen: boolean;
  onToggleEra: () => void;
  onToggleMusic: () => void;
  onMatchComplete: (hud: HudSnapshot) => void;
  onExitToCharacterSelect: () => void;
  onExitToStageSelect: () => void;
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
    { className: 'fixed inset-0 bg-[#0B1020]/78 backdrop-blur-xs flex items-center justify-center p-6 z-30' },
    React.createElement(
      'div',
      { className: 'w-full max-w-md bg-[#141C2F] border-[3px] border-black shadow-[8px_8px_0_#000] p-6 flex flex-col gap-5' },
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
        React.createElement('div', null, 'P1: WASD + Space (Triple Jump & Wall Jump) · Push into stage walls to Wall Cling'),
        React.createElement('div', null, 'P1 Combat: J Attack · K Smash · L Special · W+L Recovery · Shift Shield'),
        React.createElement('div', null, 'P2 Local: Arrows · Num1/Comma Attack · Num2/Period Smash · Num3/Slash Special'),
        React.createElement('div', null, 'Camera: 1 Side · 2 Isometric · 3 Top 62° · 4 Third-Person · H Hitboxes · E NES/16-Bit'),
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
          'px-10 py-4 bg-gradient-to-b from-[#FDE047] via-[#F59E0B] to-[#DC2626] border-[6px] border-black shadow-[10px_10px_0_#000]',
      },
      React.createElement(
        'span',
        {
          className:
            'font-display font-black italic uppercase text-6xl sm:text-8xl tracking-tight text-white block leading-none',
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
  winnerSlot: 0 | 1 | null;
  p2ControlLabel: string;
  matchSeconds: number;
}

function deriveViewportModel(hud: HudSnapshot | null, matchConfig: MatchConfig): ViewportModel {
  const cpuDiff = matchConfig.players[1].cpuDifficulty;
  const isCpu = matchConfig.players[1].controlType === 'cpu';
  const p2ControlLabel = isCpu ? `CPU ${cpuDiff[0].toUpperCase()}${cpuDiff.slice(1)}` : 'Local 2P';

  if (!hud) {
    return {
      activePreset: 'SIDE_25D',
      activeEra: matchConfig.graphicsEra,
      hitboxesVisible: false,
      paused: false,
      winnerSlot: null,
      p2ControlLabel,
      matchSeconds: 0,
    };
  }

  return {
    activePreset: hud.cameraPreset,
    activeEra: hud.graphicsEra,
    hitboxesVisible: hud.hitboxesVisible,
    paused: hud.paused,
    winnerSlot: hud.winnerSlot,
    p2ControlLabel,
    matchSeconds: Math.floor(hud.matchTimeTicks / 60),
  };
}

function renderHudCards(
  hud: HudSnapshot | null,
  fighters: [FighterBlueprint, FighterBlueprint],
  activeEra: GraphicsEra,
  p2ControlLabel: string,
): React.ReactElement | null {
  if (!hud) return null;
  return React.createElement(
    'div',
    {
      className:
        'pointer-events-none fixed bottom-5 left-0 right-0 z-10 flex items-end justify-center gap-8 sm:gap-16 px-6',
    },
    React.createElement(HudFighterCard, {
      snapshot: hud.fighters[0],
      fighter: fighters[0],
      graphicsEra: activeEra,
      controlLabel: 'Human',
    }),
    React.createElement(HudFighterCard, {
      snapshot: hud.fighters[1],
      fighter: fighters[1],
      graphicsEra: activeEra,
      controlLabel: p2ControlLabel,
    }),
  );
}

function renderEngineErrorModal(
  engineError: string,
  onExit: () => void,
): React.ReactElement {
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
  } = props;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasHostRef = useRef<HTMLDivElement | null>(null);

  const { state, selectCamera, toggleControl, restartMatch } = useMatchEngine(
    containerRef,
    canvasHostRef,
    fighters,
    matchConfig,
    stage,
    onToggleEra,
  );
  const model = deriveViewportModel(state.hud, matchConfig);
  useVictoryTransition(model.winnerSlot, state.hud, onMatchComplete);

  const handleToggleEra = () => {
    chiptuneAudio.playMenuTick();
    onToggleEra();
  };
  const handleToggleHitbox = () => toggleControl('hitbox');
  const handleToggleMute = () => toggleControl('mute');
  const handleTogglePause = () => toggleControl('pause');

  return React.createElement(
    'div',
    {
      ref: containerRef,
      className: 'fixed inset-0 w-screen h-screen bg-[#070B16] text-[#F1F5F9] overflow-hidden select-none',
    },
    React.createElement('div', { ref: canvasHostRef, className: 'absolute inset-0 w-full h-full' }),
    React.createElement(CameraSwitcher, {
      activePreset: model.activePreset,
      graphicsEra: model.activeEra,
      hitboxesVisible: model.hitboxesVisible,
      muted: state.isMuted,
      musicOpen,
      stageName: stage.name,
      matchSeconds: model.matchSeconds,
      onSelectCamera: selectCamera,
      onToggleEra: handleToggleEra,
      onToggleHitbox: handleToggleHitbox,
      onToggleMute: handleToggleMute,
      onToggleMusic,
      onPause: handleTogglePause,
    }),
    renderHudCards(state.hud, fighters, model.activeEra, model.p2ControlLabel),
    renderActiveOverlay({
      engineError: state.engineError,
      model,
      stageName: stage.name,
      onResume: handleTogglePause,
      onRematch: restartMatch,
      onStageSelect: onExitToStageSelect,
      onCharSelect: onExitToCharacterSelect,
    }),
  );
}
