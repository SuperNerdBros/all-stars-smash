'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import { audioMixer } from '../io/audioMixer';

const SOUNDCLOUD_ORIGIN = 'https://w.soundcloud.com';

function buildEmbedSrc(trackUrl: string, autoPlay: boolean): string {
  return (
    'https://w.soundcloud.com/player/?url=' +
    encodeURIComponent(trackUrl) +
    `&color=%23facc15&auto_play=${autoPlay ? 'true' : 'false'}` +
    '&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false'
  );
}

function postScCommand(
  iframe: HTMLIFrameElement | null,
  method: string,
  value?: number | string | boolean,
): void {
  const win = iframe?.contentWindow;
  if (!win) return;
  const payload = value === undefined ? { method } : { method, value };
  try {
    win.postMessage(JSON.stringify(payload), SOUNDCLOUD_ORIGIN);
  } catch {
    // chemx-allow: best-effort postMessage before cross-origin SoundCloud iframe boots
  }
}

function parseScEvent(raw: unknown): string | null {
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as { method?: string };
      return parsed?.method ?? null;
    } catch {
      // chemx-allow: best-effort ignore non-JSON widget messages from SoundCloud iframe
      return null;
    }
  }
  const isObject = Boolean(raw && typeof raw === 'object');
  if (isObject) {
    return (raw as { method?: string }).method ?? null;
  }
  return null;
}

function effectiveBgmVolume(): number {
  const snap = audioMixer.getSnapshot();
  return snap.bgmMuted ? 0 : snap.bgmVolume;
}

export interface SoundCloudPlayerState {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  embedSrc: string;
}

export function useSoundCloudPlayer(
  trackUrl: string,
  iframeRef: RefObject<HTMLIFrameElement | null>,
  autoStart = false,
) {
  const isPlayingRef = useRef<boolean>(autoStart);

  const [state, setState] = useState<SoundCloudPlayerState>(() => {
    const snap = audioMixer.getSnapshot();
    return {
      isPlaying: false,
      isMuted: snap.bgmMuted,
      volume: snap.bgmVolume,
      embedSrc: '',
    };
  });

  useEffect(() => {
    const applyMixerToWidget = () => {
      const snap = audioMixer.getSnapshot();
      const targetVol = snap.bgmMuted ? 0 : snap.bgmVolume;
      postScCommand(iframeRef.current, 'setVolume', targetVol);
      setState((prev) => ({ ...prev, isMuted: snap.bgmMuted, volume: snap.bgmVolume }));
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== SOUNDCLOUD_ORIGIN) return;
      const method = parseScEvent(event.data);
      if (!method) return;

      if (method === 'ready') {
        postScCommand(iframeRef.current, 'addEventListener', 'play');
        postScCommand(iframeRef.current, 'addEventListener', 'pause');
        postScCommand(iframeRef.current, 'addEventListener', 'finish');
        const targetVol = effectiveBgmVolume();
        postScCommand(iframeRef.current, 'setVolume', targetVol);
        const shouldPlayNow = isPlayingRef.current && targetVol > 0;
        if (shouldPlayNow) {
          postScCommand(iframeRef.current, 'play');
        }
      } else if (method === 'play') {
        isPlayingRef.current = true;
        postScCommand(iframeRef.current, 'setVolume', effectiveBgmVolume());
        setState((prev) => ({ ...prev, isPlaying: true }));
      } else if (method === 'pause') {
        isPlayingRef.current = false;
        setState((prev) => ({ ...prev, isPlaying: false }));
      } else if (method === 'finish') {
        postScCommand(iframeRef.current, 'seekTo', 0);
        postScCommand(iframeRef.current, 'play');
      }
    };

    const unsubscribe = audioMixer.subscribe(applyMixerToWidget);
    window.addEventListener('message', handleMessage);
    return () => {
      unsubscribe();
      window.removeEventListener('message', handleMessage);
    };
  }, [iframeRef]);

  useEffect(() => {
    const canAutoStart = autoStart && effectiveBgmVolume() > 0;
    if (canAutoStart) {
      isPlayingRef.current = true;
    }
    const timer = window.setTimeout(() => {
      const shouldAutoPlay = (autoStart || isPlayingRef.current) && effectiveBgmVolume() > 0;
      setState((prev) => ({ ...prev, embedSrc: buildEmbedSrc(trackUrl, shouldAutoPlay) }));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [trackUrl, autoStart]);

  const togglePlay = () => {
    if (state.isPlaying) {
      isPlayingRef.current = false;
      postScCommand(iframeRef.current, 'pause');
      setState((prev) => ({ ...prev, isPlaying: false }));
    } else {
      isPlayingRef.current = true;
      postScCommand(iframeRef.current, 'setVolume', effectiveBgmVolume());
      postScCommand(iframeRef.current, 'play');
      setState((prev) => ({ ...prev, isPlaying: true }));
    }
  };

  const toggleMute = () => {
    audioMixer.toggleBgmMute();
  };

  return { state, togglePlay, toggleMute };
}
