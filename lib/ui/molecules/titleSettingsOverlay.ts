'use client';

import React from 'react';
import {
  Cpu,
  Gamepad2,
  Github,
  Music,
  Shuffle,
  Sliders,
  Sparkles,
  Volume2,
  X,
} from 'lucide-react';
import type { GraphicsEra } from '../../types/fighter';
import type { CpuDifficulty, MatchConfig } from '../../types/protocol';
import { chiptuneAudio } from '../../io/chiptuneAudio';
import { BRAND } from '../../branding';
import { AudioMixerControls } from './audioMixerControls';

export interface TitleSettingsOverlayProps {
  mode: 'settings' | 'controls';
  matchConfig: MatchConfig;
  stageName: string;
  musicOpen: boolean;
  onUpdateMatchConfig: (updater: (prev: MatchConfig) => MatchConfig) => void;
  onSetEra: (era: GraphicsEra) => void;
  onToggleMusic: () => void;
  onShuffleStage: () => void;
  onOpenSoundTest?: () => void;
  onClose: () => void;
}

const CPU_LEVELS: ReadonlyArray<{ id: CpuDifficulty; label: string }> = [
  { id: 'easy', label: 'Lv. 3' },
  { id: 'normal', label: 'Lv. 6' },
  { id: 'hard', label: 'Lv. 9' },
];

function renderSettingsBody(props: TitleSettingsOverlayProps): React.ReactElement {
  const { matchConfig, stageName, musicOpen, onUpdateMatchConfig, onSetEra, onToggleMusic, onShuffleStage } = props;
  const p2 = matchConfig.players[1];

  return React.createElement(
    'div',
    { className: 'flex flex-col gap-4' },

    // Graphics Era (hot-swaps live 3-CPU battle behind the overlay!)
    React.createElement(
      'div',
      { className: 'flex items-center justify-between gap-4 border-b border-white/10 pb-3' },
      React.createElement(
        'div',
        null,
        React.createElement('div', { className: 'font-display font-black uppercase text-sm text-white' }, 'Sprite Graphics Era'),
        React.createElement('div', { className: 'text-[11px] text-white/65' }, 'Swaps live across all 3 background fighters'),
      ),
      React.createElement(
        'div',
        { className: 'flex bg-black p-0.5 border-2 border-black' },
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: () => {
              chiptuneAudio.playEraSwap();
              onSetEra('NES');
            },
            className: [
              'inline-flex items-center gap-1 px-3 py-1.5 text-xs font-black uppercase cursor-pointer whitespace-nowrap',
              matchConfig.graphicsEra === 'NES' ? 'bg-[#EF4444] text-white' : 'text-white/65 hover:text-white',
            ].join(' '),
          },
          React.createElement(Cpu, { className: 'w-3.5 h-3.5' }),
          'NES 8-BIT',
        ),
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: () => {
              chiptuneAudio.playEraSwap();
              onSetEra('SNES_SEGA');
            },
            className: [
              'inline-flex items-center gap-1 px-3 py-1.5 text-xs font-black uppercase cursor-pointer whitespace-nowrap',
              matchConfig.graphicsEra === 'SNES_SEGA' ? 'bg-[#2563EB] text-white' : 'text-white/65 hover:text-white',
            ].join(' '),
          },
          React.createElement(Sparkles, { className: 'w-3.5 h-3.5' }),
          'SNES / SEGA',
        ),
      ),
    ),

    // Default Stocks
    React.createElement(
      'div',
      { className: 'flex items-center justify-between gap-4 border-b border-white/10 pb-3' },
      React.createElement(
        'div',
        null,
        React.createElement('div', { className: 'font-display font-black uppercase text-sm text-white' }, 'Match Stocks'),
        React.createElement('div', { className: 'text-[11px] text-white/65' }, 'Lives per fighter in Versus & Quick Brawl'),
      ),
      React.createElement(
        'div',
        { className: 'flex gap-1' },
        ...[1, 2, 3, 5].map((n) =>
          React.createElement(
            'button',
            {
              key: n,
              type: 'button',
              onClick: () => {
                chiptuneAudio.playMenuTick();
                onUpdateMatchConfig((prev) => ({ ...prev, stocks: n }));
              },
              className: [
                'w-9 py-1.5 font-mono font-black text-xs border-2 border-black cursor-pointer',
                matchConfig.stocks === n ? 'bg-[#FACC15] text-black' : 'bg-[#1E293B] text-white hover:bg-[#334155]',
              ].join(' '),
            },
            String(n),
          ),
        ),
      ),
    ),

    // Opponent Mode & CPU Level
    React.createElement(
      'div',
      { className: 'flex items-center justify-between gap-4 border-b border-white/10 pb-3' },
      React.createElement(
        'div',
        null,
        React.createElement('div', { className: 'font-display font-black uppercase text-sm text-white' }, 'Player 2 Control'),
        React.createElement('div', { className: 'text-[11px] text-white/65' }, 'Solo vs CPU bot or Local 2P keyboard'),
      ),
      React.createElement(
        'div',
        { className: 'flex items-center gap-1.5' },
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: () => {
              chiptuneAudio.playMenuTick();
              onUpdateMatchConfig((prev) => ({
                ...prev,
                players: [
                  prev.players[0],
                  { ...prev.players[1], controlType: prev.players[1].controlType === 'cpu' ? 'human' : 'cpu' },
                ],
              }));
            },
            className:
              'px-3 py-1.5 bg-[#1E293B] hover:bg-[#334155] border-2 border-black text-xs font-black uppercase text-[#FDE047] cursor-pointer whitespace-nowrap',
          },
          p2.controlType === 'cpu' ? 'CPU Bot' : 'Local 2P',
        ),
        ...CPU_LEVELS.map((lv) =>
          React.createElement(
            'button',
            {
              key: lv.id,
              type: 'button',
              disabled: p2.controlType !== 'cpu',
              onClick: () => {
                chiptuneAudio.playMenuTick();
                onUpdateMatchConfig((prev) => ({
                  ...prev,
                  players: [prev.players[0], { ...prev.players[1], cpuDifficulty: lv.id }],
                }));
              },
              className: [
                'px-2.5 py-1.5 font-mono text-xs font-black border-2 border-black cursor-pointer disabled:opacity-35',
                p2.cpuDifficulty === lv.id ? 'bg-[#38BDF8] text-black' : 'bg-[#0F172A] text-white/80',
              ].join(' '),
            },
            lv.label,
          ),
        ),
      ),
    ),

    // Audio Balance Mixer (BGM & SFX sliders)
    React.createElement(
      'div',
      { className: 'flex flex-col gap-2 border-b border-white/10 pb-3' },
      React.createElement(
        'div',
        null,
        React.createElement('div', { className: 'font-display font-black uppercase text-sm text-white' }, 'Audio Balance'),
        React.createElement('div', { className: 'text-[11px] text-white/65' }, 'Adjust Music (BGM) and Sound FX (SFX) independently'),
      ),
      React.createElement(AudioMixerControls, { variant: 'panel' }),
    ),

    // Audio & Live Attract Stage Controls
    React.createElement(
      'div',
      { className: 'flex flex-wrap items-center justify-between gap-2 pt-1' },
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: onToggleMusic,
          className: [
            'inline-flex items-center gap-2 px-3.5 py-2 border-2 border-black text-xs font-black uppercase cursor-pointer whitespace-nowrap',
            musicOpen ? 'bg-[#FACC15] text-black' : 'bg-[#1E293B] hover:bg-[#334155] text-white',
          ].join(' '),
        },
        React.createElement(Music, { className: 'w-4 h-4' }),
        musicOpen ? 'Hide OST Deck' : 'Stage OST Deck',
      ),
      props.onOpenSoundTest
        ? React.createElement(
            'button',
            {
              type: 'button',
              onClick: () => {
                chiptuneAudio.playMenuConfirm();
                props.onOpenSoundTest?.();
              },
              className:
                'inline-flex items-center gap-2 px-3.5 py-2 bg-[#047857] hover:bg-[#059669] border-2 border-black text-xs font-black uppercase text-white cursor-pointer whitespace-nowrap',
            },
            React.createElement(Volume2, { className: 'w-4 h-4' }),
            'Sound Test',
          )
        : null,
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: () => {
            chiptuneAudio.playMenuConfirm();
            onShuffleStage();
          },
          className:
            'inline-flex items-center gap-2 px-3.5 py-2 bg-[#B91C1C] hover:bg-[#DC2626] border-2 border-black text-xs font-black uppercase text-white cursor-pointer whitespace-nowrap',
        },
        React.createElement(Shuffle, { className: 'w-4 h-4' }),
        `New Stage (${stageName})`,
      ),
    ),
  );
}

function renderControlsBody(): React.ReactElement {
  const rows: ReadonlyArray<{ title: string; keys: string }> = [
    { title: 'P1 Movement & Jumps', keys: 'W A S D · Space (Triple Jump + Wall Jump & Cling)' },
    { title: 'P1 Attacks & Specials', keys: 'J Jab · K Smash · L Special · W + L Up-Recovery · Shift Shield' },
    { title: 'Grab, Hold & Throw', keys: 'I / O / Shift+J Grab · While Holding: W/A/S/D or K/I Throw · J Pummel' },
    { title: 'P2 Local Keyboard', keys: 'Arrows · Num1/, Atk · Num2/. Smash · Num3// Spec · Num4/; Grab' },
    { title: 'Live 2.5D Camera & Era', keys: '1 Side · 2 Isometric · 3 Top 62° · 4 3rd-Person · E NES/16-Bit · H Hitboxes' },
  ];

  return React.createElement(
    'div',
    { className: 'flex flex-col gap-3' },
    ...rows.map((row) =>
      React.createElement(
        'div',
        { key: row.title, className: 'bg-black/65 border-l-4 border-[#FACC15] px-4 py-2.5' },
        React.createElement('div', { className: 'font-display font-black uppercase text-xs text-[#FDE047]' }, row.title),
        React.createElement('div', { className: 'font-mono text-xs text-white/90 mt-0.5' }, row.keys),
      ),
    ),
  );
}

export function TitleSettingsOverlay(props: TitleSettingsOverlayProps): React.ReactElement {
  const { mode, onClose } = props;

  return React.createElement(
    'div',
    {
      onClick: onClose,
      className:
        'fixed inset-0 z-50 bg-black/72 backdrop-blur-xs flex items-center justify-center p-4 select-none',
    },
    React.createElement(
      'div',
      {
        onClick: (e: React.MouseEvent) => e.stopPropagation(),
        className:
          'w-full max-w-xl bg-[#0D1326] border-[4px] border-black shadow-[10px_10px_0_#000] overflow-hidden',
      },
      React.createElement(
        'div',
        {
          className:
            'flex items-center justify-between px-5 py-3 bg-[#C81D25] border-b-[3px] border-black',
        },
        React.createElement(
          'div',
          { className: 'flex items-center gap-2.5 font-display font-black uppercase text-lg tracking-wide text-white' },
          mode === 'settings'
            ? React.createElement(Sliders, { className: 'w-5 h-5 text-[#FACC15]' })
            : React.createElement(Gamepad2, { className: 'w-5 h-5 text-[#FACC15]' }),
          mode === 'settings' ? 'Game Settings' : 'Fighter Controls',
        ),
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: onClose,
            'aria-label': 'Close overlay',
            className: 'p-1.5 bg-black/45 hover:bg-black/75 border-2 border-black text-white cursor-pointer',
          },
          React.createElement(X, { className: 'w-4 h-4' }),
        ),
      ),
      React.createElement(
        'div',
        { className: 'p-5' },
        mode === 'settings' ? renderSettingsBody(props) : renderControlsBody(),
      ),
      // Project link
      React.createElement(
        'a',
        {
          href: BRAND.githubUrl,
          target: '_blank',
          rel: 'noopener noreferrer',
          className:
            'flex items-center justify-center gap-2 px-5 py-2.5 border-t-[3px] border-black bg-black/40 hover:bg-black/70 font-display font-black uppercase text-xs tracking-wider text-white/85 hover:text-[#FACC15]',
        },
        React.createElement(Github, { className: 'w-4 h-4' }),
        'Source on GitHub · SuperNerdBros/all-stars-smash',
      ),
    ),
  );
}
