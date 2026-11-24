'use client';

import React, { useRef } from 'react';
import { Play, RotateCcw, Trophy, Users } from 'lucide-react';
import type { FighterBlueprint, GraphicsEra } from '../../types/fighter';
import type { CameraPreset, HudSnapshot, MatchConfig } from '../../types/protocol';
import type { StageManifest } from '../../types/stage';
import { chiptuneAudio } from '../../io/chiptuneAudio';
import { resolveFighterForEra } from '../../roster/eraResolver';
import { useMatchEngine } from '../../hooks/useMatchEngine';
import { ArcadeButton } from '../atoms/button';
import { SpriteCanvas } from '../atoms/spriteCanvas';
import { CameraSwitcher } from '../molecules/cameraSwitcher';
import { HudFighterCard } from '../molecules/hudFighterCard';

export interface MatchViewportProps {
  fighters: [FighterBlueprint, FighterBlueprint];
  matchConfig: MatchConfig;
  stage: StageManifest;
  musicOpen: boolean;
  onToggleEra: () => void;
  onToggleMusic: () => void;
  onExitToCharacterSelect: () => void;
  onExitToStageSelect: () => void;
}

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
      { className: 'w-full max-w-md rounded-lg bg-[#141C2F] border border-[#2B3858] p-6 flex flex-col gap-5' },
      React.createElement(
        'div',
        null,
        React.createElement('h2', { className: 'font-display text-2xl font-extrabold text-white' }, 'Match Paused'),
        React.createElement('p', { className: 'text-xs text-[#94A3B8] mt-1' }, `${stageName} · Press Esc to resume`),
      ),
      React.createElement(
        'div',
        { className: 'rounded-md bg-[#0B1020] border border-[#2B3858] p-3.5 text-xs text-[#CBD5E1] flex flex-col gap-1.5' },
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

function renderVictoryModal(
  winnerSlot: 0 | 1,
  hud: HudSnapshot,
  fighters: [FighterBlueprint, FighterBlueprint],
  matchConfig: MatchConfig,
  activeEra: GraphicsEra,
  onRematch: () => void,
  onCharSelect: () => void,
): React.ReactElement {
  const resolvedWinner = resolveFighterForEra(fighters[winnerSlot], activeEra);
  const palIdx = matchConfig.players[winnerSlot].paletteIndex;
  const winnerPalette = resolvedWinner.palettes[palIdx]?.colors ?? resolvedWinner.palettes[0].colors;

  return React.createElement(
    'div',
    { className: 'fixed inset-0 bg-[#0B1020]/82 backdrop-blur-xs flex items-center justify-center p-6 z-30' },
    React.createElement(
      'div',
      { className: 'w-full max-w-md rounded-lg bg-[#141C2F] border border-[#F59E0B] p-6 flex flex-col items-center text-center gap-5' },
      React.createElement(
        'div',
        { className: 'flex items-center gap-2 text-[#F59E0B] font-semibold text-sm' },
        React.createElement(Trophy, { className: 'w-4 h-4' }),
        `Player ${winnerSlot + 1} Wins`,
      ),
      React.createElement(
        'h2',
        { className: 'font-display text-3xl font-extrabold text-white' },
        `${fighters[winnerSlot].name} Victory`,
      ),
      React.createElement(
        'div',
        { className: 'w-28 h-28 rounded-lg bg-[#0B1020] border border-[#2B3858] flex items-center justify-center' },
        React.createElement(SpriteCanvas, {
          pixelChart: resolvedWinner.pixelChart,
          palette: winnerPalette,
          animState: 'jump',
          sizePx: 96,
          animate: true,
        }),
      ),
      React.createElement(
        'div',
        { className: 'w-full grid grid-cols-2 gap-3 rounded-md bg-[#0B1020] border border-[#2B3858] p-3 text-xs' },
        ...hud.fighters.map((fSnap) =>
          React.createElement(
            'div',
            { key: fSnap.slot, className: 'flex flex-col gap-0.5' },
            React.createElement(
              'span',
              { className: 'font-semibold', style: { color: fSnap.slot === 0 ? '#EF4444' : '#3B82F6' } },
              `P${fSnap.slot + 1} · ${fSnap.name}`,
            ),
            React.createElement(
              'span',
              { className: 'font-mono tabular-nums text-[#CBD5E1]' },
              `${fSnap.kosScored} KOs · ${fSnap.damageDealt}% dealt`,
            ),
          ),
        ),
      ),
      React.createElement(
        'div',
        { className: 'w-full flex items-center gap-3' },
        React.createElement(ArcadeButton, {
          label: 'Rematch',
          variant: 'primary',
          className: 'flex-1',
          icon: React.createElement(RotateCcw, { className: 'w-4 h-4' }),
          onClick: onRematch,
        }),
        React.createElement(ArcadeButton, {
          label: 'Fighters',
          variant: 'secondary',
          className: 'flex-1',
          icon: React.createElement(Users, { className: 'w-4 h-4' }),
          onClick: onCharSelect,
        }),
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
      { className: 'max-w-md rounded-lg bg-[#141C2F] border border-[#EF4444]/50 p-6 text-center flex flex-col gap-4' },
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
  hud: HudSnapshot | null;
  model: ViewportModel;
  stageName: string;
  fighters: [FighterBlueprint, FighterBlueprint];
  matchConfig: MatchConfig;
  onResume: () => void;
  onRematch: () => void;
  onStageSelect: () => void;
  onCharSelect: () => void;
}

function renderActiveOverlay(p: OverlayParams): React.ReactElement | null {
  if (p.engineError) {
    return renderEngineErrorModal(p.engineError, p.onCharSelect);
  }
  if (p.model.winnerSlot !== null && p.hud) {
    return renderVictoryModal(
      p.model.winnerSlot,
      p.hud,
      p.fighters,
      p.matchConfig,
      p.model.activeEra,
      p.onRematch,
      p.onCharSelect,
    );
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
      hud: state.hud,
      model,
      stageName: stage.name,
      fighters,
      matchConfig,
      onResume: handleTogglePause,
      onRematch: restartMatch,
      onStageSelect: onExitToStageSelect,
      onCharSelect: onExitToCharacterSelect,
    }),
  );
}
