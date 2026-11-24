'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import type { FighterBlueprint, GraphicsEra } from '../types/fighter';
import type { CameraPreset, HudSnapshot, MatchConfig } from '../types/protocol';
import type { StageManifest } from '../types/stage';
import { EngineWorkerBridge } from '../engine/workerBridge';
import { MainThreadInputPoller } from '../io/inputPoller';
import { chiptuneAudio } from '../io/chiptuneAudio';

export interface MatchRuntimeState {
  hud: HudSnapshot | null;
  isMuted: boolean;
  engineError: string | null;
}

interface RuntimeRefs {
  bridge: EngineWorkerBridge | null;
  isPaused: boolean;
  onToggleEra: () => void;
  era: GraphicsEra;
}

export function useMatchEngine(
  containerRef: RefObject<HTMLDivElement | null>,
  canvasHostRef: RefObject<HTMLDivElement | null>,
  fighters: [FighterBlueprint, FighterBlueprint],
  matchConfig: MatchConfig,
  stage: StageManifest,
  onToggleEra: () => void,
) {
  const runtimeRef = useRef<RuntimeRefs>({
    bridge: null,
    isPaused: false,
    onToggleEra,
    era: matchConfig.graphicsEra,
  });

  const [state, setState] = useState<MatchRuntimeState>(() => ({
    hud: null,
    isMuted: chiptuneAudio.isMuted(),
    engineError: null,
  }));

  useEffect(() => {
    runtimeRef.current.onToggleEra = onToggleEra;
    runtimeRef.current.era = matchConfig.graphicsEra;
    runtimeRef.current.bridge?.setEra(matchConfig.graphicsEra);
  }, [onToggleEra, matchConfig.graphicsEra]);

  const p1Id = fighters[0].id;
  const p2Id = fighters[1].id;
  const p1Pal = matchConfig.players[0].paletteIndex;
  const p2Pal = matchConfig.players[1].paletteIndex;
  const p1Ctrl = matchConfig.players[0].controlType;
  const p2Ctrl = matchConfig.players[1].controlType;
  const cpuDiff = matchConfig.players[1].cpuDifficulty;
  const stocks = matchConfig.stocks;
  const stageId = stage.id;

  useEffect(() => {
    const canvasHost = canvasHostRef.current;
    const container = containerRef.current;
    if (!canvasHost || !container) return;

    const bridge = new EngineWorkerBridge();
    runtimeRef.current.bridge = bridge;

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
          graphicsEra: runtimeRef.current.era,
        });
      },
      onHudSnapshot: (snapshot) => {
        runtimeRef.current.isPaused = snapshot.paused;
        setState((prev) => ({ ...prev, hud: snapshot }));
        for (const sfx of snapshot.sfxQueue) {
          chiptuneAudio.playSfx(sfx);
        }
      },
      onError: (msg) => {
        setState((prev) => ({ ...prev, engineError: msg }));
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
      onToggleEra: () => {
        chiptuneAudio.playMenuTick();
        runtimeRef.current.onToggleEra();
      },
      onTogglePause: () => {
        chiptuneAudio.playMenuTick();
        bridge.setPaused(!runtimeRef.current.isPaused);
      },
    });
    poller.start();

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      bridge.resize(
        Math.max(480, Math.floor(entry.contentRect.width)),
        Math.max(270, Math.floor(entry.contentRect.height)),
      );
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      poller.stop();
      bridge.destroy();
      runtimeRef.current.bridge = null;
    };
    // Intentionally keyed on primitive match identifiers so OffscreenCanvas transfer occurs once per match
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p1Id, p2Id, p1Pal, p2Pal, p1Ctrl, p2Ctrl, cpuDiff, stocks, stageId]);

  const selectCamera = (preset: CameraPreset) => {
    chiptuneAudio.playMenuTick();
    runtimeRef.current.bridge?.setCamera(preset);
  };

  const toggleControl = (control: 'hitbox' | 'mute' | 'pause') => {
    if (control === 'mute') {
      setState((prev) => ({ ...prev, isMuted: chiptuneAudio.toggleMute() }));
      return;
    }
    chiptuneAudio.playMenuTick();
    if (control === 'hitbox') {
      runtimeRef.current.bridge?.toggleHitboxes();
      return;
    }
    runtimeRef.current.bridge?.setPaused(!runtimeRef.current.isPaused);
  };

  const restartMatch = () => {
    chiptuneAudio.playMenuConfirm();
    runtimeRef.current.bridge?.startMatch({
      fighters,
      paletteIndices: [p1Pal, p2Pal],
      controlTypes: [p1Ctrl, p2Ctrl],
      cpuDifficulty: cpuDiff,
      stage,
      stocks,
      graphicsEra: matchConfig.graphicsEra,
    });
  };

  return { state, selectCamera, toggleControl, restartMatch };
}
