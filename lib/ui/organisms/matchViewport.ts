'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, Trophy, Users } from 'lucide-react';
import type { FighterBlueprint } from '../../types/fighter';
import type {
  CameraPreset,
  HudSnapshot,
  MatchConfig,
} from '../../types/protocol';
import type { StageManifest } from '../../types/stage';
import { EngineWorkerBridge } from '../../engine/workerBridge';
import { MainThreadInputPoller } from '../../io/inputPoller';
import { chiptuneAudio } from '../../io/chiptuneAudio';
import { ArcadeButton } from '../atoms/button';
import { SpriteCanvas } from '../atoms/spriteCanvas';
import { CameraSwitcher } from '../molecules/cameraSwitcher';
import { HudFighterCard } from '../molecules/hudFighterCard';

export interface MatchViewportProps {
  fighters: [FighterBlueprint, FighterBlueprint];
  matchConfig: MatchConfig;
  stage: StageManifest;
  onExitToCharacterSelect: () => void;
  onExitToStageSelect: () => void;
}

export function MatchViewport(props: MatchViewportProps): React.ReactElement {
  const {
    fighters,
    matchConfig,
    stage,
    onExitToCharacterSelect,
    onExitToStageSelect,
  } = props;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const bridgeRef = useRef<EngineWorkerBridge | null>(null);
  const pausedRef = useRef<boolean>(false);

  const [hud, setHud] = useState<HudSnapshot | null>(null);
  const [muted, setMuted] = useState<boolean>(() => chiptuneAudio.isMuted());
  const [engineError, setEngineError] = useState<string | null>(null);

  const p1Id = fighters[0].id;
  const p2Id = fighters[1].id;
  const p1Pal = matchConfig.players[0].paletteIndex;
  const p2Pal = matchConfig.players[1].paletteIndex;
  const p1Ctrl = matchConfig.players[0].controlType;
  const p2Ctrl = matchConfig.players[1].controlType;
  const cpuDiff = matchConfig.players[1].cpuDifficulty;
  const stocks = matchConfig.stocks;
  const stageId = stage.id;

  // Strictly client-side worker + OffscreenCanvas mount & teardown inside useEffect
  useEffect(() => {
    const canvasHost = canvasHostRef.current;
    const container = containerRef.current;
    if (!canvasHost || !container) return;

    const bridge = new EngineWorkerBridge();
    bridgeRef.current = bridge;

    const rect = container.getBoundingClientRect();
    const initW = Math.max(480, Math.floor(rect.width));
    const initH = Math.max(270, Math.floor(rect.height));

    bridge.mount(canvasHost, initW, initH, {
      onReady: () => {
        bridge.startMatch({
          fighters,
          paletteIndices: [p1Pal, p2Pal],
          controlTypes: [p1Ctrl, p2Ctrl],
          cpuDifficulty: cpuDiff,
          stage,
          stocks,
        });
      },
      onHudSnapshot: (snapshot) => {
        pausedRef.current = snapshot.paused;
        setHud(snapshot);
        for (const sfx of snapshot.sfxQueue) {
          chiptuneAudio.playSfx(sfx);
        }
      },
      onError: (msg) => {
        setEngineError(msg);
      },
    });

    const poller = new MainThreadInputPoller({
      onInputs: (p1Mask, p2Mask) => bridge.sendInputs(p1Mask, p2Mask),
      onCameraHotkey: (preset) => {
        chiptuneAudio.playMenuTick();
        bridge.setCamera(preset);
      },
      onToggleHitbox: () => {
        chiptuneAudio.playMenuTick();
        bridge.toggleHitboxes();
      },
      onTogglePause: () => {
        chiptuneAudio.playMenuTick();
        bridge.setPaused(!pausedRef.current);
      },
    });
    poller.start();

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const w = Math.max(480, Math.floor(entry.contentRect.width));
      const h = Math.max(270, Math.floor(entry.contentRect.height));
      bridge.resize(w, h);
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      poller.stop();
      bridge.destroy();
      bridgeRef.current = null;
    };
    // Intentionally keyed on primitive match identifiers so canvas transfer happens cleanly per match mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p1Id, p2Id, p1Pal, p2Pal, p1Ctrl, p2Ctrl, cpuDiff, stocks, stageId]);

  const handleSelectCamera = (preset: CameraPreset) => {
    chiptuneAudio.playMenuTick();
    bridgeRef.current?.setCamera(preset);
  };

  const handleToggleHitbox = () => {
    chiptuneAudio.playMenuTick();
    bridgeRef.current?.toggleHitboxes();
  };

  const handleToggleMute = () => {
    setMuted(chiptuneAudio.toggleMute());
  };

  const handleTogglePause = () => {
    chiptuneAudio.playMenuTick();
    bridgeRef.current?.setPaused(!pausedRef.current);
  };

  const handleRematch = () => {
    chiptuneAudio.playMenuConfirm();
    bridgeRef.current?.startMatch({
      fighters,
      paletteIndices: [p1Pal, p2Pal],
      controlTypes: [p1Ctrl, p2Ctrl],
      cpuDifficulty: cpuDiff,
      stage,
      stocks,
    });
  };

  const activePreset: CameraPreset = hud?.cameraPreset ?? 'SIDE_25D';
  const hitboxesVisible = hud?.hitboxesVisible ?? false;
  const paused = hud?.paused ?? false;
  const winnerSlot = hud?.winnerSlot ?? null;

  const p2ControlLabel =
    p2Ctrl === 'cpu'
      ? `CPU ${cpuDiff[0].toUpperCase()}${cpuDiff.slice(1)}`
      : 'Local 2P';

  const matchSeconds = hud ? Math.floor(hud.matchTimeTicks / 60) : 0;

  return React.createElement(
    'div',
    {
      ref: containerRef,
      className:
        'fixed inset-0 w-screen h-screen bg-[#070B16] text-[#F1F5F9] overflow-hidden select-none',
    },

    // Full-Bleed Edge-to-Edge 2.5D OffscreenCanvas Stage Viewport
    React.createElement('div', {
      ref: canvasHostRef,
      className: 'absolute inset-0 w-full h-full',
    }),

    // Subtle Floating Top Camera, Timer & Utility Controls
    React.createElement(CameraSwitcher, {
      activePreset,
      hitboxesVisible,
      muted,
      stageName: stage.name,
      matchSeconds,
      onSelectCamera: handleSelectCamera,
      onToggleHitbox: handleToggleHitbox,
      onToggleMute: handleToggleMute,
      onPause: handleTogglePause,
    }),

    // Floating Smash Bros. Ultimate Bottom Fighter Plaques
    hud
      ? React.createElement(
          'div',
          {
            className:
              'pointer-events-none fixed bottom-5 left-0 right-0 z-10 flex items-end justify-center gap-8 sm:gap-16 px-6',
          },
          React.createElement(HudFighterCard, {
            snapshot: hud.fighters[0],
            fighter: fighters[0],
            controlLabel: 'Human',
          }),
          React.createElement(HudFighterCard, {
            snapshot: hud.fighters[1],
            fighter: fighters[1],
            controlLabel: p2ControlLabel,
          }),
        )
      : null,

    engineError
      ? React.createElement(
          'div',
          {
            className:
              'fixed inset-0 z-30 flex items-center justify-center bg-[#0B1020]/90 p-6',
          },
          React.createElement(
            'div',
            {
              className:
                'max-w-md rounded-lg bg-[#141C2F] border border-[#EF4444]/50 p-6 text-center flex flex-col gap-4',
            },
            React.createElement('h2', { className: 'font-display text-lg font-bold text-white' }, 'Renderer Error'),
            React.createElement('p', { className: 'text-sm text-[#CBD5E1]' }, engineError),
            React.createElement(ArcadeButton, {
              label: 'Return to Character Select',
              variant: 'primary',
              onClick: onExitToCharacterSelect,
            }),
          ),
        )
      : null,

    // Pause Overlay Modal
    paused && winnerSlot === null
      ? React.createElement(
          'div',
          {
            className:
              'fixed inset-0 bg-[#0B1020]/78 backdrop-blur-xs flex items-center justify-center p-6 z-30',
          },
          React.createElement(
            'div',
            {
              className:
                'w-full max-w-md rounded-lg bg-[#141C2F] border border-[#2B3858] p-6 flex flex-col gap-5',
            },
            React.createElement(
              'div',
              null,
              React.createElement(
                'h2',
                { className: 'font-display text-2xl font-extrabold text-white' },
                'Match Paused',
              ),
              React.createElement(
                'p',
                { className: 'text-xs text-[#94A3B8] mt-1' },
                `${stage.name} · Press Esc to resume`,
              ),
            ),
            React.createElement(
              'div',
              { className: 'rounded-md bg-[#0B1020] border border-[#2B3858] p-3.5 text-xs text-[#CBD5E1] flex flex-col gap-1.5' },
              React.createElement('div', { className: 'font-semibold text-white' }, 'Controls Reference'),
              React.createElement('div', null, 'P1: WASD + Space (Triple Jump & Wall Jump) · Push into stage walls to Wall Cling'),
              React.createElement('div', null, 'P1 Combat: J Attack · K Smash · L Special · W+L Recovery · Shift Shield'),
              React.createElement('div', null, 'P2 Local: Arrows · Num1/Comma Attack · Num2/Period Smash · Num3/Slash Special'),
              React.createElement('div', null, 'Camera: 1 Side · 2 Isometric · 3 Top 62° · 4 Third-Person · H Hitboxes'),
            ),
            React.createElement(
              'div',
              { className: 'flex flex-col gap-2' },
              React.createElement(ArcadeButton, {
                label: 'Resume Match',
                variant: 'primary',
                icon: React.createElement(Play, { className: 'w-4 h-4' }),
                onClick: handleTogglePause,
              }),
              React.createElement(ArcadeButton, {
                label: 'Restart Match',
                variant: 'secondary',
                icon: React.createElement(RotateCcw, { className: 'w-4 h-4' }),
                onClick: handleRematch,
              }),
              React.createElement(
                'div',
                { className: 'grid grid-cols-2 gap-2 pt-1' },
                React.createElement(ArcadeButton, {
                  label: 'Change Stage',
                  variant: 'ghost',
                  onClick: onExitToStageSelect,
                }),
                React.createElement(ArcadeButton, {
                  label: 'Change Fighters',
                  variant: 'ghost',
                  onClick: onExitToCharacterSelect,
                }),
              ),
            ),
          ),
        )
      : null,

    // Victory Summary Modal
    winnerSlot !== null && hud
      ? React.createElement(
          'div',
          {
            className:
              'fixed inset-0 bg-[#0B1020]/82 backdrop-blur-xs flex items-center justify-center p-6 z-30',
          },
          React.createElement(
            'div',
            {
              className:
                'w-full max-w-md rounded-lg bg-[#141C2F] border border-[#F59E0B] p-6 flex flex-col items-center text-center gap-5',
            },
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
              {
                className:
                  'w-28 h-28 rounded-lg bg-[#0B1020] border border-[#2B3858] flex items-center justify-center',
              },
              React.createElement(SpriteCanvas, {
                pixelChart: fighters[winnerSlot].pixelChart,
                palette:
                  fighters[winnerSlot].palettes[matchConfig.players[winnerSlot].paletteIndex]
                    ?.colors ?? fighters[winnerSlot].palettes[0].colors,
                animState: 'jump',
                sizePx: 96,
                animate: true,
              }),
            ),
            React.createElement(
              'div',
              {
                className:
                  'w-full grid grid-cols-2 gap-3 rounded-md bg-[#0B1020] border border-[#2B3858] p-3 text-xs',
              },
              ...hud.fighters.map((fSnap) =>
                React.createElement(
                  'div',
                  { key: fSnap.slot, className: 'flex flex-col gap-0.5' },
                  React.createElement(
                    'span',
                    {
                      className: 'font-semibold',
                      style: { color: fSnap.slot === 0 ? '#EF4444' : '#3B82F6' },
                    },
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
                onClick: handleRematch,
              }),
              React.createElement(ArcadeButton, {
                label: 'Fighters',
                variant: 'secondary',
                className: 'flex-1',
                icon: React.createElement(Users, { className: 'w-4 h-4' }),
                onClick: onExitToCharacterSelect,
              }),
            ),
          ),
        )
      : null,
  );
}
