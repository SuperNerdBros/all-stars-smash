'use client';

import React, { useRef } from 'react';
import {
  ChevronDown,
  Disc3,
  ExternalLink,
  Music,
  Pause,
  Play,
  Sliders,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { StageManifest } from '../../types/stage';
import { useSoundCloudPlayer } from '../../hooks/useSoundCloudPlayer';
import { AudioMixerControls } from './audioMixerControls';

export interface SoundCloudMusicBarProps {
  stage: StageManifest;
  isOpen: boolean;
  isInMatch: boolean;
  autoStart?: boolean;
  onToggleOpen: () => void;
}

interface CollapsedMusicBarProps {
  ostTitle: string;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  onToggleMute: () => void;
  onToggleOpen: () => void;
}

function CollapsedMusicBar(props: CollapsedMusicBarProps): React.ReactElement {
  const { ostTitle, isPlaying, isMuted, volume, onToggleMute, onToggleOpen } = props;
  const isAudible = isPlaying && !isMuted;
  const muteLabel = isMuted ? 'Unmute Music' : 'Mute Music';
  const iconClass = isAudible ? 'w-3.5 h-3.5 shrink-0 text-[#FACC15]' : 'w-3.5 h-3.5 shrink-0 text-[#94A3B8]';

  return React.createElement(
    'div',
    {
      className:
        'pointer-events-auto inline-flex items-center rounded-sm bg-[#111827]/95 border-2 border-black text-white shadow-[0_6px_16px_rgba(0,0,0,0.5)] overflow-hidden',
    },
    React.createElement(
      'button',
      {
        type: 'button',
        onClick: onToggleMute,
        title: muteLabel,
        'aria-label': muteLabel,
        className:
          'px-2.5 py-1.5 hover:bg-[#1E293B] border-r border-white/15 cursor-pointer flex items-center justify-center',
      },
      isMuted
        ? React.createElement(VolumeX, { className: 'w-3.5 h-3.5 text-[#FCA5A5]' })
        : React.createElement(Volume2, { className: 'w-3.5 h-3.5 text-[#FACC15]' }),
    ),
    React.createElement(
      'button',
      {
        type: 'button',
        onClick: onToggleOpen,
        title: 'Open Audio Mixer & Stage OST Controls',
        className:
          'inline-flex items-center gap-2 px-3 py-1.5 hover:bg-[#1E293B] cursor-pointer transition-colors',
      },
      React.createElement(Music, { className: iconClass }),
      React.createElement(
        'span',
        { className: 'text-[11px] font-black uppercase tracking-wide max-w-[165px] truncate' },
        ostTitle,
      ),
      React.createElement(
        'span',
        { className: 'font-mono text-[10px] font-bold tabular-nums text-[#FACC15]' },
        isMuted ? '0%' : `${volume}%`,
      ),
      React.createElement(Sliders, { className: 'w-3 h-3 text-white/65 shrink-0' }),
    ),
  );
}

/**
 * Persistent stage-matched SoundCloud OST & Audio Mixer bar mounted across
 * menus, Sound Test, and live matches so BGM & SFX levels stay adjustable anytime.
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
  const { isPlaying, isMuted, volume, embedSrc } = state;
  const drawerClass = isOpen
    ? 'pointer-events-auto opacity-100 scale-100 max-h-[430px]'
    : 'pointer-events-none opacity-0 scale-95 max-h-0 border-0';
  const discClass = isPlaying && !isMuted
    ? 'w-4 h-4 text-[#FACC15] shrink-0 animate-spin'
    : 'w-4 h-4 text-[#FACC15] shrink-0';
  const showCollapsedBar = !isOpen && !isInMatch;

  return React.createElement(
    'div',
    {
      className:
        'fixed bottom-3 right-3 z-40 flex flex-col items-end gap-2 pointer-events-none',
    },

    React.createElement(
      'div',
      {
        className: `w-[340px] sm:w-[390px] rounded-md border-2 border-black bg-[#0D1326] text-white shadow-[0_14px_32px_rgba(0,0,0,0.75)] overflow-hidden transition-all duration-200 origin-bottom-right ${drawerClass}`,
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
          React.createElement(Disc3, { className: discClass }),
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
              title: 'Minimize Audio Mixer & OST Player',
              className:
                'p-1 rounded bg-black/35 hover:bg-black/60 text-white transition-colors cursor-pointer',
            },
            React.createElement(ChevronDown, { className: 'w-3.5 h-3.5' }),
          ),
        ),
      ),

      React.createElement(
        'div',
        { className: 'px-3 py-2.5 bg-[#11182C] border-b border-white/10 flex flex-col gap-2' },
        React.createElement(
          'div',
          { className: 'flex items-center justify-between gap-2' },
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
            isPlaying ? 'Pause OST' : 'Play OST',
          ),
          React.createElement(
            'span',
            { className: 'text-[10px] font-mono font-bold uppercase tracking-wider text-white/60' },
            'Audio Mixer',
          ),
        ),
        React.createElement(AudioMixerControls, { variant: 'panel' }),
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

    showCollapsedBar
      ? React.createElement(CollapsedMusicBar, {
          ostTitle: stage.ostTitle,
          isPlaying,
          isMuted,
          volume,
          onToggleMute: toggleMute,
          onToggleOpen,
        })
      : null,
  );
}
