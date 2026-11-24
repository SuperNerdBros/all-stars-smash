'use client';

import React from 'react';
import { Box, Cpu, Music, Pause, Sparkles, Volume2, VolumeX } from 'lucide-react';
import type { GraphicsEra } from '../../types/fighter';
import type { CameraPreset } from '../../types/protocol';

export interface CameraSwitcherProps {
  activePreset: CameraPreset;
  graphicsEra: GraphicsEra;
  hitboxesVisible: boolean;
  muted: boolean;
  musicOpen: boolean;
  stageName: string;
  matchSeconds: number;
  onSelectCamera: (preset: CameraPreset) => void;
  onToggleEra: () => void;
  onToggleHitbox: () => void;
  onToggleMute: () => void;
  onToggleMusic: () => void;
  onPause: () => void;
}

const CAMERA_MODES: ReadonlyArray<{ preset: CameraPreset; keyHint: string; label: string }> = [
  { preset: 'SIDE_25D', keyHint: '1', label: 'Side' },
  { preset: 'ISOMETRIC', keyHint: '2', label: 'Iso' },
  { preset: 'TOP_DOWN', keyHint: '3', label: 'Top 62°' },
  { preset: 'THIRD_PERSON', keyHint: '4', label: '3rd' },
];

export function CameraSwitcher(props: CameraSwitcherProps): React.ReactElement {
  const {
    activePreset,
    graphicsEra,
    hitboxesVisible,
    muted,
    musicOpen,
    stageName,
    matchSeconds,
    onSelectCamera,
    onToggleEra,
    onToggleHitbox,
    onToggleMute,
    onToggleMusic,
    onPause,
  } = props;

  const mins = Math.floor(matchSeconds / 60);
  const secs = String(matchSeconds % 60).padStart(2, '0');
  const isNes = graphicsEra === 'NES';

  return React.createElement(
    'div',
    {
      className:
        'pointer-events-none fixed top-0 left-0 right-0 z-10 flex items-center justify-between gap-3 px-4 py-3',
    },

    // Floating Top-Left Camera Angle Switcher + Live Era Toggle
    React.createElement(
      'div',
      { className: 'pointer-events-auto flex items-center gap-1.5' },
      React.createElement(
        'div',
        {
          className:
            'flex items-center gap-1 p-1 rounded-md bg-[#090E1C]/72 backdrop-blur-xs border border-white/12',
        },
        ...CAMERA_MODES.map((m) =>
          React.createElement(
            'button',
            {
              key: m.preset,
              type: 'button',
              onClick: () => onSelectCamera(m.preset),
              className: [
                'px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5',
                activePreset === m.preset
                  ? 'bg-[#F59E0B] text-[#0B1020] font-bold'
                  : 'text-[#E2E8F0] hover:text-white hover:bg-white/10',
              ].join(' '),
            },
            React.createElement('span', { className: 'font-mono text-[11px] opacity-80' }, m.keyHint),
            React.createElement('span', null, m.label),
          ),
        ),
      ),

      // Live NES 8-BIT / SNES·SEGA 16-BIT Toggle (E)
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: onToggleEra,
          title: 'Switch NES 8-Bit / SNES·SEGA 16-Bit Sprites Live (E)',
          className: [
            'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-black uppercase tracking-wide border backdrop-blur-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer',
            isNes
              ? 'bg-[#DC2626]/85 border-[#FCA5A5]/60 text-white'
              : 'bg-[#2563EB]/85 border-[#93C5FD]/60 text-white',
          ].join(' '),
        },
        isNes
          ? React.createElement(Cpu, { className: 'w-3.5 h-3.5' })
          : React.createElement(Sparkles, { className: 'w-3.5 h-3.5' }),
        isNes ? 'NES 8-Bit' : '16-Bit',
      ),
    ),

    // Floating Centered Stage & Clock Strip
    React.createElement(
      'div',
      {
        className:
          'hidden lg:flex items-center gap-2.5 px-4 py-1.5 rounded-md bg-[#090E1C]/68 backdrop-blur-xs border border-white/10 text-xs',
      },
      React.createElement('span', { className: 'font-display font-bold text-white' }, stageName),
      React.createElement('span', { className: 'text-white/35', 'aria-hidden': 'true' }, '·'),
      React.createElement(
        'span',
        { className: 'font-mono font-bold tabular-nums text-[#FDE047]' },
        `${mins}:${secs}`,
      ),
    ),

    // Floating Top-Right Match Controls
    React.createElement(
      'div',
      { className: 'pointer-events-auto flex items-center gap-1.5 shrink-0' },
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: onToggleMusic,
          title: 'Toggle SSBU-OST SoundCloud Player',
          className: [
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border backdrop-blur-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer',
            musicOpen
              ? 'bg-[#FACC15] border-[#FACC15] text-black font-bold'
              : 'bg-[#090E1C]/72 border-white/12 text-[#E2E8F0] hover:text-white hover:bg-[#090E1C]/90',
          ].join(' '),
        },
        React.createElement(Music, { className: 'w-3.5 h-3.5' }),
        'OST',
      ),
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: onToggleHitbox,
          title: 'Toggle Hitboxes & Blast Zones (H)',
          className: [
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border backdrop-blur-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer',
            hitboxesVisible
              ? 'bg-[#10B981]/25 border-[#10B981] text-[#6EE7B7]'
              : 'bg-[#090E1C]/72 border-white/12 text-[#E2E8F0] hover:text-white hover:bg-[#090E1C]/90',
          ].join(' '),
        },
        React.createElement(Box, { className: 'w-3.5 h-3.5' }),
        'Hitboxes',
      ),
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: onToggleMute,
          title: muted ? 'Unmute Chiptune SFX' : 'Mute Chiptune SFX',
          className:
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#090E1C]/72 backdrop-blur-xs border border-white/12 text-[#E2E8F0] hover:text-white hover:bg-[#090E1C]/90 whitespace-nowrap shrink-0 cursor-pointer',
        },
        muted
          ? React.createElement(VolumeX, { className: 'w-3.5 h-3.5 text-[#EF4444]' })
          : React.createElement(Volume2, { className: 'w-3.5 h-3.5 text-[#F59E0B]' }),
        muted ? 'Muted' : 'SFX',
      ),
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: onPause,
          title: 'Pause Match (Esc)',
          className:
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#090E1C]/72 backdrop-blur-xs border border-white/12 text-[#E2E8F0] hover:text-white hover:bg-[#090E1C]/90 whitespace-nowrap shrink-0 cursor-pointer',
        },
        React.createElement(Pause, { className: 'w-3.5 h-3.5' }),
        'Pause',
      ),
    ),
  );
}
