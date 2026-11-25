'use client';

import React from 'react';
import { Music, Volume2, VolumeX } from 'lucide-react';
import { useAudioMixer } from '../../hooks/useAudioMixer';
import { chiptuneAudio } from '../../io/chiptuneAudio';

export interface AudioMixerControlsProps {
  variant?: 'compact' | 'panel';
}

interface ChannelSliderProps {
  label: string;
  ariaLabel: string;
  value: number;
  muted: boolean;
  accentClass: string;
  icon: React.ComponentType<{ className?: string }>;
  compact: boolean;
  onChange: (pct: number) => void;
  onToggleMute: () => void;
  onPreview?: () => void;
}

function ChannelSlider(props: ChannelSliderProps): React.ReactElement {
  const {
    label,
    ariaLabel,
    value,
    muted,
    accentClass,
    icon: ActiveIcon,
    compact,
    onChange,
    onToggleMute,
    onPreview,
  } = props;
  const effectiveValue = muted ? 0 : value;
  const rowClass = compact
    ? 'flex items-center gap-1.5 bg-black/75 border-2 border-black px-2 py-1'
    : 'flex items-center justify-between gap-2.5 bg-[#090E1C] border-2 border-black px-2.5 py-1.5';
  const sliderWidth = compact ? 'w-16 sm:w-20' : 'flex-1 min-w-0';

  return React.createElement(
    'div',
    { className: rowClass },
    React.createElement(
      'button',
      {
        type: 'button',
        onClick: onToggleMute,
        title: muted ? `Unmute ${label}` : `Mute ${label}`,
        'aria-label': muted ? `Unmute ${label}` : `Mute ${label}`,
        className: 'p-1 text-white hover:text-[#FACC15] cursor-pointer shrink-0',
      },
      muted
        ? React.createElement(VolumeX, { className: 'w-4 h-4 text-[#FCA5A5]' })
        : React.createElement(ActiveIcon, { className: `w-4 h-4 ${accentClass}` }),
    ),
    React.createElement(
      'span',
      { className: 'font-display font-black text-[11px] uppercase tracking-wide text-white/90 w-9 shrink-0' },
      label,
    ),
    React.createElement('input', {
      type: 'range',
      min: 0,
      max: 100,
      value: effectiveValue,
      'aria-label': ariaLabel,
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => onChange(Number(event.target.value)),
      onMouseUp: onPreview,
      onTouchEnd: onPreview,
      className: `${sliderWidth} accent-[#FACC15] cursor-pointer`,
    }),
    React.createElement(
      'span',
      { className: 'font-mono text-[11px] font-bold tabular-nums w-9 text-right text-white/90 shrink-0' },
      `${effectiveValue}%`,
    ),
  );
}

/**
 * Reusable Music (BGM) + Sound FX (SFX) mixer control pair synced globally via audioMixer.
 */
export function AudioMixerControls(props: AudioMixerControlsProps): React.ReactElement {
  const { variant = 'panel' } = props;
  const compact = variant === 'compact';
  const { mixer, setBgmVolume, toggleBgmMute, setSfxVolume, toggleSfxMute } = useAudioMixer();

  return React.createElement(
    'div',
    {
      className: compact
        ? 'flex flex-wrap items-center gap-2'
        : 'flex flex-col gap-1.5',
    },
    React.createElement(ChannelSlider, {
      label: 'BGM',
      ariaLabel: 'Music volume',
      value: mixer.bgmVolume,
      muted: mixer.bgmMuted,
      accentClass: 'text-[#FACC15]',
      icon: Music,
      compact,
      onChange: setBgmVolume,
      onToggleMute: toggleBgmMute,
    }),
    React.createElement(ChannelSlider, {
      label: 'SFX',
      ariaLabel: 'Sound effects volume',
      value: mixer.sfxVolume,
      muted: mixer.sfxMuted,
      accentClass: 'text-[#4ADE80]',
      icon: Volume2,
      compact,
      onChange: setSfxVolume,
      onToggleMute: toggleSfxMute,
      onPreview: () => chiptuneAudio.playMenuTick(),
    }),
  );
}
