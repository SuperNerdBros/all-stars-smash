'use client';

import { ComicLogo } from '../molecules/comicLogo';
import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Gamepad2,
  Globe,
  LogIn,
  Music,
  Paintbrush,
  Play,
  Shuffle,
  Sliders,
  Swords,
  Volume2,
} from 'lucide-react';
import type { FighterBlueprint, GraphicsEra } from '../../types/fighter';
import type { MatchConfig } from '../../types/protocol';
import type { StageManifest } from '../../types/stage';
import { chiptuneAudio } from '../../io/chiptuneAudio';
import { AttractBattleCanvas } from '../atoms/attractBattleCanvas';
import { TitleSettingsOverlay } from '../molecules/titleSettingsOverlay';

export interface TitleScreenProps {
  stage: StageManifest;
  attractFighters: ReadonlyArray<FighterBlueprint>;
  matchConfig: MatchConfig;
  musicOpen: boolean;
  onPlay: () => void;
  /** Host your own online room (CPUs fill the seats until people join). */
  onPlayOnline: () => void;
  /** Join by room code; empty string = quick join a public room. */
  onJoinRoom: (code: string) => void;
  onQuickBrawl: () => void;
  onOpenPixelForge: () => void;
  onOpenSoundTest: () => void;
  onUpdateMatchConfig: (updater: (prev: MatchConfig) => MatchConfig) => void;
  onSetEra: (era: GraphicsEra) => void;
  onToggleMusic: () => void;
  onShuffleAttract: () => void;
}

type MenuActionId = 'online' | 'join' | 'play' | 'quick' | 'forge' | 'soundTest' | 'settings' | 'controls';

interface MenuItemSpec {
  id: MenuActionId;
  label: string;
  sublabel: string;
  accent: string;
  primary?: boolean;
}

const MENU_ITEMS: ReadonlyArray<MenuItemSpec> = [
  { id: 'online', label: 'PLAY ONLINE', sublabel: 'Host a room · CPUs fight until friends join', accent: '#FACC15', primary: true },
  { id: 'join', label: 'JOIN ROOM', sublabel: 'Enter a code, or quick-join an open room', accent: '#F97316' },
  { id: 'play', label: 'LOCAL VERSUS', sublabel: 'Same-screen 2P or vs. CPU', accent: '#FDE047' },
  { id: 'quick', label: 'QUICK BRAWL', sublabel: 'Jump straight into this live arena', accent: '#EF4444' },
  { id: 'forge', label: 'PIXEL FORGE', sublabel: 'Sprite editor & #FF00FF importer', accent: '#38BDF8' },
  { id: 'soundTest', label: 'SOUND TEST', sublabel: 'Audition & map all 32 arcade SFX', accent: '#10B981' },
  { id: 'settings', label: 'SETTINGS', sublabel: 'Era, stocks, CPU level & audio', accent: '#A855F7' },
  { id: 'controls', label: 'CONTROLS', sublabel: 'P1, Local 2P & 2.5D camera keys', accent: '#22C55E' },
];


function renderMenuIcon(id: MenuActionId): React.ReactElement {
  if (id === 'online') return React.createElement(Globe, { className: 'w-5 h-5' });
  if (id === 'join') return React.createElement(LogIn, { className: 'w-5 h-5' });
  if (id === 'play') return React.createElement(Play, { className: 'w-5 h-5 fill-current' });
  if (id === 'quick') return React.createElement(Swords, { className: 'w-5 h-5' });
  if (id === 'forge') return React.createElement(Paintbrush, { className: 'w-5 h-5' });
  if (id === 'soundTest') return React.createElement(Volume2, { className: 'w-5 h-5' });
  if (id === 'settings') return React.createElement(Sliders, { className: 'w-5 h-5' });
  return React.createElement(Gamepad2, { className: 'w-5 h-5' });
}

type TitleKeyIntent = 'close' | 'down' | 'up' | 'confirm' | 'none';

function classifyTitleKey(key: string, hasOverlay: boolean): TitleKeyIntent {
  if (hasOverlay) return key === 'Escape' ? 'close' : 'none';
  if (key === 'ArrowDown' || key === 's' || key === 'S') return 'down';
  if (key === 'ArrowUp' || key === 'w' || key === 'W') return 'up';
  if (key === 'Enter' || key === ' ') return 'confirm';
  return 'none';
}

/**
 * Official full-screen console Title Screen ("SUPER KNERD BROS: BIT BEAT")
 * layered over a live 3-CPU easy-mode full-stage 2.5D battle with matched SoundCloud OST.
 */
export function TitleScreen(props: TitleScreenProps): React.ReactElement {
  const {
    stage,
    attractFighters,
    matchConfig,
    musicOpen,
    onPlay,
    onPlayOnline,
    onJoinRoom,
    onQuickBrawl,
    onOpenPixelForge,
    onOpenSoundTest,
    onUpdateMatchConfig,
    onSetEra,
    onToggleMusic,
    onShuffleAttract,
  } = props;

  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [overlayMode, setOverlayMode] = useState<'settings' | 'controls' | null>(null);

  const runAction = (id: MenuActionId) => {
    chiptuneAudio.playMenuConfirm();
    const handlers: Record<MenuActionId, () => void> = {
      online: onPlayOnline,
      join: () => {
        const typed = window.prompt('Room code (leave blank to quick-join an open room):', '');
        if (typed !== null) onJoinRoom(typed.trim());
      },
      play: onPlay,
      quick: onQuickBrawl,
      forge: onOpenPixelForge,
      soundTest: onOpenSoundTest,
      settings: () => setOverlayMode('settings'),
      controls: () => setOverlayMode('controls'),
    };
    handlers[id]();
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const hasModifier = e.metaKey || e.ctrlKey || e.altKey;
      if (hasModifier) return;
      const intent = classifyTitleKey(e.key, overlayMode !== null);
      if (intent === 'none') return;
      e.preventDefault();
      if (intent === 'close') {
        chiptuneAudio.playMenuTick();
        setOverlayMode(null);
      } else if (intent === 'down') {
        chiptuneAudio.playMenuTick();
        setSelectedIndex((prev) => (prev + 1) % MENU_ITEMS.length);
      } else if (intent === 'up') {
        chiptuneAudio.playMenuTick();
        setSelectedIndex((prev) => (prev - 1 + MENU_ITEMS.length) % MENU_ITEMS.length);
      } else {
        const item = MENU_ITEMS[selectedIndex];
        if (item) runAction(item.id);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex, overlayMode]);

  return React.createElement(
    'div',
    {
      className:
        'fixed inset-0 z-30 h-screen w-screen overflow-hidden bg-black text-white select-none flex flex-col justify-between',
    },

    // Live 3-CPU Easy-Mode Full-Stage 2.5D Background Battle
    React.createElement(AttractBattleCanvas, {
      stage,
      fighters: attractFighters,
      graphicsEra: matchConfig.graphicsEra,
    }),

    // Subtle theatrical framing scrim so logo & menu pop while the full stage shines clearly
    React.createElement('div', {
      'aria-hidden': 'true',
      className: 'pointer-events-none fixed inset-0 z-10',
      style: {
        background:
          'radial-gradient(ellipse at 68% 48%, rgba(4,8,20,0.08) 0%, rgba(4,8,20,0.52) 62%, rgba(2,4,12,0.86) 100%)',
      },
    }),

    // Main Console Title + Menu Layout
    React.createElement(
      'main',
      {
        className:
          'relative z-20 flex-1 flex flex-col lg:flex-row items-center lg:items-center justify-center lg:justify-between gap-8 px-6 sm:px-12 lg:px-16 py-6 min-h-0',
      },

      // Left/Center comic-book game emblem (see lib/branding.ts)
      React.createElement(
        motion.div,
        {
          initial: { x: -60, opacity: 0, scale: 0.94 },
          animate: { x: 0, opacity: 1, scale: 1 },
          transition: { type: 'spring', stiffness: 220, damping: 20 },
          className: 'relative flex flex-col items-center lg:items-start text-center lg:text-left max-w-xl',
        },

        React.createElement(ComicLogo),
      ),

      // Right Console Main Menu Stack
      React.createElement(
        motion.nav,
        {
          'aria-label': 'Main Menu',
          initial: { x: 60, opacity: 0 },
          animate: { x: 0, opacity: 1 },
          transition: { delay: 0.12, type: 'spring', stiffness: 220, damping: 22 },
          className: 'w-full max-w-[360px] flex flex-col gap-2.5',
        },
        ...MENU_ITEMS.map((item, idx) => {
          const isSelected = idx === selectedIndex;
          return React.createElement(
            'button',
            {
              key: item.id,
              type: 'button',
              onMouseEnter: () => {
                if (selectedIndex !== idx) {
                  chiptuneAudio.playMenuTick();
                  setSelectedIndex(idx);
                }
              },
              onClick: () => runAction(item.id),
              className: [
                'group relative w-full -skew-x-12 border-[3px] border-black px-5 py-3 text-left cursor-pointer transition-transform duration-100',
                isSelected
                  ? 'translate-x-[-8px] shadow-[7px_7px_0_#000] scale-[1.02]'
                  : 'bg-[#0D1326]/90 hover:bg-[#17203B]/95 shadow-[4px_4px_0_#000]',
              ].join(' '),
              style: isSelected
                ? {
                    background: item.primary
                      ? 'linear-gradient(90deg, #FDE047 0%, #F59E0B 100%)'
                      : 'linear-gradient(90deg, #DC2626 0%, #991B1B 100%)',
                  }
                : undefined,
            },
            React.createElement('span', {
              'aria-hidden': 'true',
              className: 'block absolute left-0 top-0 bottom-0 w-2',
              style: { backgroundColor: item.accent },
            }),
            React.createElement(
              'span',
              {
                className: [
                  'skew-x-12 flex items-center justify-between gap-3 pl-2',
                  isSelected && item.primary ? 'text-black' : 'text-white',
                ].join(' '),
              },
              React.createElement(
                'span',
                { className: 'flex flex-col min-w-0' },
                React.createElement(
                  'span',
                  {
                    className:
                      'font-display font-black italic uppercase text-lg sm:text-xl leading-none tracking-wide whitespace-nowrap',
                  },
                  item.label,
                ),
                React.createElement(
                  'span',
                  {
                    className: [
                      'text-[11px] font-semibold mt-0.5 truncate',
                      isSelected && item.primary ? 'text-black/75' : 'text-white/75',
                    ].join(' '),
                  },
                  item.sublabel,
                ),
              ),
              React.createElement('span', { className: 'shrink-0' }, renderMenuIcon(item.id)),
            ),
          );
        }),
      ),
    ),

    // Bottom Live 3-CPU Easy Attract Ticker & Random Stage Controls
    React.createElement(
      'footer',
      {
        className:
          'relative z-20 flex flex-wrap items-center justify-between gap-3 px-5 sm:px-8 py-2.5 bg-black/82 border-t-[3px] border-black',
      },
      React.createElement(
        'div',
        { className: 'flex items-center gap-3 min-w-0' },
        React.createElement(
          'span',
          {
            className:
              '-skew-x-12 px-2.5 py-0.5 bg-[#EF4444] border-2 border-black font-display font-black text-[10px] uppercase tracking-wider text-white shrink-0',
          },
          React.createElement('span', { className: 'inline-block skew-x-12' }, '3-CPU LIVE'),
        ),
        React.createElement(
          'span',
          { className: 'font-display font-black uppercase text-xs sm:text-sm text-[#FDE047] truncate' },
          `${stage.name} · ${stage.series}`,
        ),
        React.createElement(
          'span',
          { className: 'hidden xl:inline font-mono text-[11px] text-white/70 truncate' },
          attractFighters.map((f) => f.name).join(' · '),
        ),
      ),
      React.createElement(
        'div',
        { className: 'flex items-center gap-2 shrink-0 pr-0 sm:pr-52' },
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: () => {
              chiptuneAudio.playMenuConfirm();
              onShuffleAttract();
            },
            className:
              'inline-flex items-center gap-1.5 px-3 py-1 bg-[#1E293B] hover:bg-[#334155] border-2 border-black text-[11px] font-black uppercase tracking-wide text-white cursor-pointer whitespace-nowrap',
          },
          React.createElement(Shuffle, { className: 'w-3.5 h-3.5 text-[#38BDF8]' }),
          'Next Live Stage',
        ),
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: onToggleMusic,
            className: [
              'inline-flex items-center gap-1.5 px-3 py-1 border-2 border-black text-[11px] font-black uppercase tracking-wide cursor-pointer whitespace-nowrap',
              musicOpen ? 'bg-[#FACC15] text-black' : 'bg-[#1E293B] hover:bg-[#334155] text-white',
            ].join(' '),
          },
          React.createElement(Music, { className: 'w-3.5 h-3.5' }),
          'BGM',
        ),
      ),
    ),

    overlayMode
      ? React.createElement(TitleSettingsOverlay, {
          mode: overlayMode,
          matchConfig,
          stageName: stage.name,
          musicOpen,
          onUpdateMatchConfig,
          onSetEra,
          onToggleMusic,
          onShuffleStage: onShuffleAttract,
          onOpenSoundTest: () => {
            setOverlayMode(null);
            onOpenSoundTest();
          },
          onClose: () => setOverlayMode(null),
        })
      : null,
  );
}
