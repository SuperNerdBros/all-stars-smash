'use client';

import React from 'react';
import { Box, Camera, Cpu, Gamepad2, Music, Pause, Sparkles, Volume2, VolumeX } from 'lucide-react';
import type { GraphicsEra } from '../../types/fighter';
import type { CameraPreset } from '../../types/protocol';

export interface CameraSwitcherProps {
  activePreset: CameraPreset;
  graphicsEra: GraphicsEra;
  hitboxesVisible: boolean;
  muted: boolean;
  musicOpen: boolean;
  touchPadOpen: boolean;
  stageName: string;
  matchSeconds: number;
  onSelectCamera: (preset: CameraPreset) => void;
  onToggleEra: () => void;
  onToggleHitbox: () => void;
  onToggleMute: () => void;
  onToggleMusic: () => void;
  onToggleTouchPad: () => void;
  onPause: () => void;
}

interface CameraModeSpec {
  readonly preset: CameraPreset;
  readonly keyHint: string;
  readonly label: string;
  readonly shortLabel: string;
}

const CAMERA_MODES: ReadonlyArray<CameraModeSpec> = [
  { preset: 'SIDE_25D', keyHint: '1', label: 'Side', shortLabel: 'Side' },
  { preset: 'ISOMETRIC', keyHint: '2', label: 'Iso', shortLabel: 'Iso' },
  { preset: 'TOP_DOWN', keyHint: '3', label: 'Top 62°', shortLabel: 'Top' },
  { preset: 'THIRD_PERSON', keyHint: '4', label: '3rd', shortLabel: '3rd' },
];

function findNextCameraPreset(activePreset: CameraPreset): CameraPreset {
  const index = CAMERA_MODES.findIndex((mode) => mode.preset === activePreset);
  const nextIndex = index === -1 ? 0 : (index + 1) % CAMERA_MODES.length;
  return CAMERA_MODES[nextIndex].preset;
}

function findActiveCameraShortLabel(activePreset: CameraPreset): string {
  return CAMERA_MODES.find((mode) => mode.preset === activePreset)?.shortLabel ?? 'Side';
}

function renderDesktopCameraStrip(
  activePreset: CameraPreset,
  onSelectCamera: (preset: CameraPreset) => void,
): React.ReactElement {
  return React.createElement(
    'div',
    {
      className:
        'hidden sm:flex items-center gap-1 p-1 rounded-md bg-[#090E1C]/72 backdrop-blur-xs border border-white/12',
    },
    ...CAMERA_MODES.map((mode) => {
      const isSelected = activePreset === mode.preset;
      return React.createElement(
        'button',
        {
          key: mode.preset,
          type: 'button',
          onClick: () => onSelectCamera(mode.preset),
          className: [
            'px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5',
            isSelected
              ? 'bg-[#F59E0B] text-[#0B1020] font-bold'
              : 'text-[#E2E8F0] hover:text-white hover:bg-white/10',
          ].join(' '),
        },
        React.createElement('span', { className: 'font-mono text-[11px] opacity-80' }, mode.keyHint),
        React.createElement('span', null, mode.label),
      );
    }),
  );
}

export function CameraSwitcher(props: CameraSwitcherProps): React.ReactElement {
  const {
    activePreset,
    graphicsEra,
    hitboxesVisible,
    muted,
    musicOpen,
    touchPadOpen,
    stageName,
    matchSeconds,
    onSelectCamera,
    onToggleEra,
    onToggleHitbox,
    onToggleMute,
    onToggleMusic,
    onToggleTouchPad,
    onPause,
  } = props;

  const mins = Math.floor(matchSeconds / 60);
  const secs = String(matchSeconds % 60).padStart(2, '0');
  const isNes = graphicsEra === 'NES';
  const shortCameraLabel = findActiveCameraShortLabel(activePreset);
  const nextCameraPreset = findNextCameraPreset(activePreset);

  return React.createElement(
    'div',
    {
      className:
        'pointer-events-none fixed top-0 left-0 right-0 z-10 flex items-center justify-between gap-1.5 sm:gap-3 px-2 sm:px-4 py-2 sm:py-3',
    },

    React.createElement(
      'div',
      { className: 'pointer-events-auto flex items-center gap-1.5 min-w-0' },
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: () => onSelectCamera(nextCameraPreset),
          title: 'Cycle Camera Angle (1-4)',
          className:
            'sm:hidden inline-flex items-center gap-1 min-h-[36px] px-2.5 py-1.5 rounded-md text-xs font-bold bg-[#F59E0B] text-[#0B1020] border border-black/40 whitespace-nowrap shrink-0 cursor-pointer touch-manipulation',
        },
        React.createElement(Camera, { className: 'w-3.5 h-3.5 shrink-0' }),
        shortCameraLabel,
      ),
      renderDesktopCameraStrip(activePreset, onSelectCamera),
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: onToggleEra,
          title: 'Switch NES 8-Bit / SNES-SEGA 16-Bit Sprites Live (E)',
          className: [
            'inline-flex items-center gap-1 sm:gap-1.5 min-h-[36px] px-2 sm:px-2.5 py-1.5 rounded-md text-xs font-black uppercase tracking-wide border backdrop-blur-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer touch-manipulation',
            isNes
              ? 'bg-[#DC2626]/85 border-[#FCA5A5]/60 text-white'
              : 'bg-[#2563EB]/85 border-[#93C5FD]/60 text-white',
          ].join(' '),
        },
        isNes
          ? React.createElement(Cpu, { className: 'w-3.5 h-3.5 shrink-0' })
          : React.createElement(Sparkles, { className: 'w-3.5 h-3.5 shrink-0' }),
        React.createElement('span', { className: 'sm:hidden' }, isNes ? '8B' : '16B'),
        React.createElement('span', { className: 'hidden sm:inline' }, isNes ? 'NES 8-Bit' : '16-Bit'),
      ),
    ),

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

    React.createElement(
      'div',
      { className: 'pointer-events-auto flex items-center gap-1 sm:gap-1.5 shrink-0' },
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: onToggleTouchPad,
          title: 'Toggle On-Screen Gamepad & Auto-Lock Controls',
          className: [
            'inline-flex items-center gap-1 sm:gap-1.5 min-h-[36px] px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium border backdrop-blur-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer touch-manipulation',
            touchPadOpen
              ? 'bg-[#38BDF8] border-[#7DD3FC] text-[#082F49] font-bold'
              : 'bg-[#090E1C]/72 border-white/12 text-[#E2E8F0] hover:text-white hover:bg-[#090E1C]/90',
          ].join(' '),
        },
        React.createElement(Gamepad2, { className: 'w-3.5 h-3.5 shrink-0' }),
        'Pad',
      ),
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: onToggleMusic,
          title: 'Toggle SSBU-OST SoundCloud Player',
          className: [
            'inline-flex items-center gap-1 sm:gap-1.5 min-h-[36px] px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium border backdrop-blur-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer touch-manipulation',
            musicOpen
              ? 'bg-[#FACC15] border-[#FACC15] text-black font-bold'
              : 'bg-[#090E1C]/72 border-white/12 text-[#E2E8F0] hover:text-white hover:bg-[#090E1C]/90',
          ].join(' '),
        },
        React.createElement(Music, { className: 'w-3.5 h-3.5 shrink-0' }),
        'OST',
      ),
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: onToggleHitbox,
          title: 'Toggle Hitboxes & Blast Zones (H)',
          className: [
            'hidden md:inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-md text-xs font-medium border backdrop-blur-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer',
            hitboxesVisible
              ? 'bg-[#10B981]/25 border-[#10B981] text-[#6EE7B7]'
              : 'bg-[#090E1C]/72 border-white/12 text-[#E2E8F0] hover:text-white hover:bg-[#090E1C]/90',
          ].join(' '),
        },
        React.createElement(Box, { className: 'w-3.5 h-3.5 shrink-0' }),
        'Hitboxes',
      ),
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: onToggleMute,
          'aria-label': muted ? 'Unmute Chiptune SFX' : 'Mute Chiptune SFX',
          title: muted ? 'Unmute Chiptune SFX' : 'Mute Chiptune SFX',
          className:
            'inline-flex items-center justify-center gap-1.5 min-w-[36px] min-h-[36px] px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium bg-[#090E1C]/72 backdrop-blur-xs border border-white/12 text-[#E2E8F0] hover:text-white hover:bg-[#090E1C]/90 whitespace-nowrap shrink-0 cursor-pointer touch-manipulation',
        },
        muted
          ? React.createElement(VolumeX, { className: 'w-3.5 h-3.5 text-[#EF4444]' })
          : React.createElement(Volume2, { className: 'w-3.5 h-3.5 text-[#F59E0B]' }),
        React.createElement('span', { className: 'hidden sm:inline' }, muted ? 'Muted' : 'SFX'),
      ),
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: onPause,
          'aria-label': 'Pause Match',
          title: 'Pause Match (Esc)',
          className:
            'inline-flex items-center justify-center gap-1.5 min-w-[36px] min-h-[36px] px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium bg-[#090E1C]/72 backdrop-blur-xs border border-white/12 text-[#E2E8F0] hover:text-white hover:bg-[#090E1C]/90 whitespace-nowrap shrink-0 cursor-pointer touch-manipulation',
        },
        React.createElement(Pause, { className: 'w-3.5 h-3.5' }),
        React.createElement('span', { className: 'hidden sm:inline' }, 'Pause'),
      ),
    ),
  );
}
