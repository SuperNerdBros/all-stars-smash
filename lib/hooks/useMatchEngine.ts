'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import type { FighterBlueprint, GraphicsEra } from '../types/fighter';
import type { CameraPreset, HudSnapshot, MatchConfig } from '../types/protocol';
import type { NetRoom } from '../net/netRoom';
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
  poller: MainThreadInputPoller | null;
  isPaused: boolean;
  onToggleEra: () => void;
  era: GraphicsEra;
}

export function useMatchEngine(
  containerRef: RefObject<HTMLDivElement | null>,
  canvasHostRef: RefObject<HTMLDivElement | null>,
  fighters: FighterBlueprint[],
  matchConfig: MatchConfig,
  stage: StageManifest,
  onToggleEra: () => void,
  /** Online room driving this viewport (it starts matches itself and owns the netcode traffic). */
  online?: NetRoom | null,
) {
  const runtimeRef = useRef<RuntimeRefs>({
    bridge: null,
    poller: null,
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

  const paletteIndices = matchConfig.players.map((p) => p.paletteIndex);
  const controlTypes = matchConfig.players.map((p) => p.controlType);
  const cpuDiff = matchConfig.players.find((p) => p.controlType === 'cpu')?.cpuDifficulty ?? 'normal';
  /** Primitive key so the OffscreenCanvas is transferred once per match setup. */
  const seatKey = matchConfig.players
    .map((p, i) => `${fighters[i]?.id}:${p.paletteIndex}:${p.controlType}`)
    .join('|');
  // Online: the room restarts matches on the same bridge, so keep the canvas for the room's lifetime.
  const engineKey = online ? 'online' : `${seatKey}|${cpuDiff}|${matchConfig.stocks}|${stage.id}`;
  const stocks = matchConfig.stocks;
  const stageId = stage.id;

  useEffect(() => {
    const canvasHost = canvasHostRef.current;
    const container = containerRef.current;
    if (!canvasHost || !container) return;

    const runtime = runtimeRef.current;
    const bridge = new EngineWorkerBridge();
    runtime.bridge = bridge;

    const rect = container.getBoundingClientRect();
    const initW = Math.max(320, Math.floor(rect.width));
    const initH = Math.max(270, Math.floor(rect.height));

    bridge.mount(canvasHost, initW, initH, {
      onReady: () => {
        if (online) {
          online.attach(bridge);
          return;
        }
        bridge.startMatch({
          fighters,
          paletteIndices,
          controlTypes,
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
      onNet: (msg) => online?.onNet(msg),
      onError: (msg) => {
        setState((prev) => ({ ...prev, engineError: msg }));
      },
    });

    const poller = new MainThreadInputPoller({
      onInputs: (p1Mask, p2Mask) => bridge.sendInputs([p1Mask, p2Mask]),
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
        // Online matches can't pause: everyone else would stall waiting on this player's inputs.
        if (online) return;
        chiptuneAudio.playMenuTick();
        bridge.setPaused(!runtimeRef.current.isPaused);
      },
    });
    runtime.poller = poller;
    poller.start();

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      bridge.resize(
        Math.max(320, Math.floor(entry.contentRect.width)),
        Math.max(270, Math.floor(entry.contentRect.height)),
      );
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      poller.stop();
      runtime.poller = null;
      online?.detach(bridge);
      bridge.destroy();
      runtime.bridge = null;
    };
    // Intentionally keyed on primitive match identifiers so OffscreenCanvas transfer occurs once per match
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engineKey, online]);

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
    if (online) return;
    runtimeRef.current.bridge?.setPaused(!runtimeRef.current.isPaused);
  };

  const restartMatch = () => {
    chiptuneAudio.playMenuConfirm();
    if (online) {
      online.nextMatch();
      return;
    }
    runtimeRef.current.bridge?.startMatch({
      fighters,
      paletteIndices,
      controlTypes,
      cpuDifficulty: cpuDiff,
      stage,
      stocks,
      graphicsEra: matchConfig.graphicsEra,
    });
  };

  const setTargetLock = (targetSlot: number | null) => {
    chiptuneAudio.playMenuTick();
    runtimeRef.current.bridge?.setTargetLock(targetSlot);
  };

  const setVirtualInputMask = (mask: number) => {
    runtimeRef.current.poller?.setVirtualP1Mask(mask);
  };

  return { state, selectCamera, toggleControl, restartMatch, setTargetLock, setVirtualInputMask };
}
