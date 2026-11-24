'use client';

import React, { useRef } from 'react';
import {
  ChevronDown,
  Disc3,
  ExternalLink,
  Music,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { StageManifest } from '../../types/stage';
import { useSoundCloudPlayer } from '../../hooks/useSoundCloudPlayer';

export interface SoundCloudMusicBarProps {
  stage: StageManifest;
  isOpen: boolean;
  isInMatch: boolean;
  autoStart?: boolean;
  onToggleOpen: () => void;
}

/**
 * Persistent stage-matched SoundCloud OST player that stays mounted across
 * Title Screen, Stage Select, and live Matches so audio never resets on launch.
 */
export function SoundCloudMusicBar(
  props: SoundCloudMusicBarProps,
): React.ReactElement {
  const { stage, isOpen, isInMatch, autoStart = false, onToggleOpen } = props;
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const { state, togglePlay, toggleMute } = useSoundCloudPlayer(
    stage.soundCloudUrl,
    iframeRef,
    autoStart,
  );
  const { isPlaying, isMuted, embedSrc } = state;

  return React.createElement(
    'div',
    {
      className:
        'fixed bottom-3 right-3 z-40 flex flex-col items-end gap-2 pointer-events-none',
    },

    React.createElement(
      'div',
      {
        className: [
          'w-[340px] sm:w-[390px] rounded-md border-2 border-black bg-[#0D1326] text-white shadow-[0_14px_32px_rgba(0,0,0,0.75)] overflow-hidden transition-all duration-200 origin-bottom-right',
          isOpen
            ? 'pointer-events-auto opacity-100 scale-100 max-h-[300px]'
            : 'pointer-events-none opacity-0 scale-95 max-h-0 border-0',
        ].join(' '),
      },

      React.createElement(
        'div',
        {
          className:
            'flex items-center justify-between gap-2 px-3 py-2 bg-[#B91C1C] border-b-2 border-black',
        },
        React.createElement(
          'div',
          { className: 'flex items-center gap-2 min-w-0' },
          React.createElement(Disc3, {
            className: [
              'w-4 h-4 text-[#FACC15] shrink-0',
              isPlaying ? 'animate-spin' : '',
            ].join(' '),
          }),
          React.createElement(
            'div',
            { className: 'min-w-0' },
            React.createElement(
              'div',
              { className: 'text-[11px] font-black uppercase tracking-wider text-[#FDE047] truncate' },
              stage.ostTitle,
            ),
            React.createElement(
              'div',
              { className: 'text-[10px] font-semibold text-white/85 truncate' },
              `${stage.name} · ${stage.series}`,
            ),
          ),
        ),
        React.createElement(
          'div',
          { className: 'flex items-center gap-1 shrink-0' },
          React.createElement(
            'a',
            {
              href: stage.soundCloudUrl,
              target: '_blank',
              rel: 'noopener noreferrer',
              title: 'Open Track on SoundCloud',
              className:
                'p-1 rounded bg-black/35 hover:bg-black/60 text-white transition-colors',
            },
            React.createElement(ExternalLink, { className: 'w-3.5 h-3.5' }),
          ),
          React.createElement(
            'button',
            {
              type: 'button',
              onClick: onToggleOpen,
              title: 'Minimize OST Player',
              className:
                'p-1 rounded bg-black/35 hover:bg-black/60 text-white transition-colors cursor-pointer',
            },
            React.createElement(ChevronDown, { className: 'w-3.5 h-3.5' }),
          ),
        ),
      ),

      React.createElement(
        'div',
        {
          className:
            'flex items-center justify-between gap-2 px-3 py-2 bg-[#141C34] border-b border-white/10',
        },
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: togglePlay,
            title: isPlaying ? 'Pause Stage OST' : 'Play Stage OST',
            className:
              'inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#FACC15] hover:bg-[#FDE047] text-black text-xs font-black uppercase tracking-wide cursor-pointer',
          },
          isPlaying
            ? React.createElement(Pause, { className: 'w-3.5 h-3.5' })
            : React.createElement(Play, { className: 'w-3.5 h-3.5' }),
          isPlaying ? 'Pause OST' : 'Play Stage OST',
        ),
        React.createElement(
          'div',
          { className: 'flex items-center gap-2' },
          React.createElement(
            'span',
            { className: 'text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]' },
            'Stage Match',
          ),
          React.createElement(
            'button',
            {
              type: 'button',
              onClick: toggleMute,
              title: isMuted ? 'Unmute BGM' : 'Mute BGM',
              className:
                'p-1.5 rounded bg-black/40 hover:bg-black/70 text-white cursor-pointer',
            },
            isMuted
              ? React.createElement(VolumeX, { className: 'w-3.5 h-3.5 text-[#EF4444]' })
              : React.createElement(Volume2, { className: 'w-3.5 h-3.5 text-[#FACC15]' }),
          ),
        ),
      ),

      embedSrc
        ? React.createElement('iframe', {
            ref: iframeRef,
            title: `${stage.ostTitle} SoundCloud Player`,
            src: embedSrc,
            allow: 'autoplay; encrypted-media',
            className: 'w-full h-[166px] border-0 bg-[#0D1326]',
          })
        : React.createElement('div', {
            className: 'w-full h-[166px] bg-[#0D1326]',
          }),
    ),

    !isOpen && !isInMatch
      ? React.createElement(
          'button',
          {
            type: 'button',
            onClick: onToggleOpen,
            title: 'Open Stage SoundCloud OST Player',
            className:
              'pointer-events-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-sm bg-[#111827]/95 hover:bg-[#1E293B] border-2 border-black text-white shadow-[0_6px_16px_rgba(0,0,0,0.5)] cursor-pointer transition-transform active:scale-95',
          },
          React.createElement(Music, {
            className: [
              'w-3.5 h-3.5',
              isPlaying ? 'text-[#FACC15]' : 'text-[#94A3B8]',
            ].join(' '),
          }),
          React.createElement(
            'span',
            { className: 'text-[11px] font-black uppercase tracking-wide max-w-[200px] truncate' },
            stage.ostTitle,
          ),
        )
      : null,
  );
}
