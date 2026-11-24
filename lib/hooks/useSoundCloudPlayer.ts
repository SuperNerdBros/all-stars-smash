'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

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
  if (raw && typeof raw === 'object') {
    return (raw as { method?: string }).method ?? null;
  }
  return null;
}

export interface SoundCloudPlayerState {
  isPlaying: boolean;
  isMuted: boolean;
  embedSrc: string;
}

export function useSoundCloudPlayer(
  trackUrl: string,
  iframeRef: RefObject<HTMLIFrameElement | null>,
) {
  const statusRef = useRef<{ isPlaying: boolean; isMuted: boolean }>({
    isPlaying: false,
    isMuted: false,
  });

  const [state, setState] = useState<SoundCloudPlayerState>(() => ({
    isPlaying: false,
    isMuted: false,
    embedSrc: '',
  }));

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== SOUNDCLOUD_ORIGIN) return;
      const method = parseScEvent(event.data);
      if (!method) return;

      if (method === 'ready') {
        postScCommand(iframeRef.current, 'addEventListener', 'play');
        postScCommand(iframeRef.current, 'addEventListener', 'pause');
        postScCommand(iframeRef.current, 'addEventListener', 'finish');
        postScCommand(iframeRef.current, 'setVolume', statusRef.current.isMuted ? 0 : 75);
      } else if (method === 'play') {
        statusRef.current.isPlaying = true;
        setState((prev) => ({ ...prev, isPlaying: true }));
      } else if (method === 'pause') {
        statusRef.current.isPlaying = false;
        setState((prev) => ({ ...prev, isPlaying: false }));
      } else if (method === 'finish') {
        postScCommand(iframeRef.current, 'seekTo', 0);
        postScCommand(iframeRef.current, 'play');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [iframeRef]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const shouldAutoPlay = statusRef.current.isPlaying && !statusRef.current.isMuted;
      setState((prev) => ({ ...prev, embedSrc: buildEmbedSrc(trackUrl, shouldAutoPlay) }));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [trackUrl]);

  const togglePlay = () => {
    if (state.isPlaying) {
      statusRef.current.isPlaying = false;
      postScCommand(iframeRef.current, 'pause');
      setState((prev) => ({ ...prev, isPlaying: false }));
      return;
    }
    statusRef.current.isPlaying = true;
    postScCommand(iframeRef.current, 'setVolume', state.isMuted ? 0 : 75);
    postScCommand(iframeRef.current, 'play');
    setState((prev) => ({ ...prev, isPlaying: true }));
  };

  const toggleMute = () => {
    const nextMuted = !state.isMuted;
    statusRef.current.isMuted = nextMuted;
    setState((prev) => ({ ...prev, isMuted: nextMuted }));
    postScCommand(iframeRef.current, 'setVolume', nextMuted ? 0 : 75);
  };

  return { state, togglePlay, toggleMute };
}
