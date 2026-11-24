'use client';

import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Crown, Map, RotateCcw, Trophy, Users } from 'lucide-react';
import type { FighterBlueprint, GraphicsEra } from '../../types/fighter';
import type { HudFighterSnapshot, HudSnapshot, MatchConfig } from '../../types/protocol';
import type { StageManifest } from '../../types/stage';
import { chiptuneAudio } from '../../io/chiptuneAudio';
import { resolveFighterForEra } from '../../roster/eraResolver';
import { SpriteCanvas } from '../atoms/spriteCanvas';

export interface VictoryScreenProps {
  hud: HudSnapshot;
  fighters: [FighterBlueprint, FighterBlueprint];
  matchConfig: MatchConfig;
  stage: StageManifest;
  onRematch: () => void;
  onStageSelect: () => void;
  onCharacterSelect: () => void;
}

const ARCADE_STROKE: React.CSSProperties = {
  textShadow:
    '3px 3px 0 #000, -3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 0 8px 18px rgba(0,0,0,0.9)',
};

function formatMatchTime(ticks: number): string {
  const totalSec = Math.max(0, Math.floor(ticks / 60));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

interface PlacementRowProps {
  placeLabel: string;
  isWinner: boolean;
  snapshot: HudFighterSnapshot;
  fighter: FighterBlueprint;
  graphicsEra: GraphicsEra;
  controlTag: string;
}

function renderPlacementRow(p: PlacementRowProps): React.ReactElement {
  const resolved = resolveFighterForEra(p.fighter, p.graphicsEra);
  const safeIdx = p.snapshot.paletteIndex % Math.max(1, resolved.palettes.length);
  const palette = resolved.palettes[safeIdx]?.colors ?? resolved.palettes[0].colors;
  const accent = p.snapshot.slot === 0 ? '#EF4444' : '#3B82F6';

  return React.createElement(
    'div',
    {
      className: [
        'relative flex items-center gap-4 px-5 py-3.5 border-l-[6px] bg-black/75 border-y border-r border-white/15',
        p.isWinner ? 'shadow-[0_10px_28px_rgba(250,204,21,0.22)]' : 'opacity-90',
      ].join(' '),
      style: { borderLeftColor: p.isWinner ? '#FACC15' : accent },
    },
    React.createElement(
      'div',
      {
        className: [
          'w-12 h-12 shrink-0 flex items-center justify-center font-display font-black italic text-xl border-2 border-black shadow-[3px_3px_0_#000]',
          p.isWinner ? 'bg-[#FACC15] text-black' : 'bg-[#334155] text-white',
        ].join(' '),
      },
      p.placeLabel,
    ),
    React.createElement(
      'div',
      { className: 'w-14 h-14 shrink-0 flex items-center justify-center bg-black/60 border border-white/15' },
      React.createElement(SpriteCanvas, {
        pixelChart: resolved.pixelChart,
        palette,
        animState: p.isWinner ? 'jump' : 'idle',
        sizePx: 48,
        animate: true,
      }),
    ),
    React.createElement(
      'div',
      { className: 'flex-1 min-w-0' },
      React.createElement(
        'div',
        { className: 'flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider' },
        React.createElement('span', { style: { color: accent }, className: 'font-black' }, p.controlTag),
        p.fighter.nickname
          ? React.createElement('span', { className: 'text-[#FDE047] font-bold truncate' }, `"${p.fighter.nickname}"`)
          : null,
      ),
      React.createElement(
        'div',
        { className: 'font-display font-black uppercase text-xl text-white leading-tight truncate' },
        p.fighter.name,
      ),
    ),
    React.createElement(
      'div',
      { className: 'flex items-center gap-5 shrink-0 font-mono tabular-nums text-right' },
      React.createElement(
        'div',
        null,
        React.createElement('div', { className: 'text-[10px] uppercase text-white/60' }, 'KOs'),
        React.createElement('div', { className: 'text-xl font-black text-[#FACC15]' }, String(p.snapshot.kosScored)),
      ),
      React.createElement(
        'div',
        null,
        React.createElement('div', { className: 'text-[10px] uppercase text-white/60' }, 'Damage'),
        React.createElement('div', { className: 'text-xl font-black text-white' }, `${p.snapshot.damageDealt}%`),
      ),
      React.createElement(
        'div',
        { className: 'hidden sm:block' },
        React.createElement('div', { className: 'text-[10px] uppercase text-white/60' }, 'Stocks'),
        React.createElement('div', { className: 'text-xl font-black text-[#38BDF8]' }, String(p.snapshot.stocks)),
      ),
    ),
  );
}

function resolveWinnerBanner(winnerSlot: 0 | 1, isP2Cpu: boolean): string {
  if (winnerSlot === 0) return 'PLAYER 1 WINS!';
  return isP2Cpu ? 'CPU WINS!' : 'PLAYER 2 WINS!';
}

/**
 * Full-screen console-game Victory Celebration page replacing the boxed popup modal.
 */
export function VictoryScreen(props: VictoryScreenProps): React.ReactElement {
  const { hud, fighters, matchConfig, stage, onRematch, onStageSelect, onCharacterSelect } = props;
  const winnerSlot: 0 | 1 = hud.winnerSlot === 1 ? 1 : 0;
  const loserSlot: 0 | 1 = winnerSlot === 0 ? 1 : 0;
  const winnerFighter = fighters[winnerSlot];
  const loserFighter = fighters[loserSlot];
  const winnerSnap = hud.fighters[winnerSlot];
  const loserSnap = hud.fighters[loserSlot];
  const resolvedWinner = resolveFighterForEra(winnerFighter, hud.graphicsEra);
  const palIdx = winnerSnap.paletteIndex % Math.max(1, resolvedWinner.palettes.length);
  const winnerPreset = resolvedWinner.palettes[palIdx] ?? resolvedWinner.palettes[0];

  const isP2Cpu = matchConfig.players[1].controlType === 'cpu';
  const winnerLabel = resolveWinnerBanner(winnerSlot, isP2Cpu);
  const p2ControlTag = isP2Cpu ? 'CPU' : 'P2';
  const backdropUrl =
    winnerSlot === 0
      ? '/assets/screens/victory_spotlight_gold.jpg'
      : '/assets/screens/victory_spotlight_crimson.jpg';

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        chiptuneAudio.playMenuConfirm();
        onRematch();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onRematch]);

  return React.createElement(
    'div',
    {
      className:
        'fixed inset-0 z-40 h-screen w-screen overflow-hidden bg-[#050814] text-white select-none flex flex-col',
    },
    React.createElement(motion.img, {
      src: backdropUrl,
      alt: 'Victory stadium spotlight backdrop',
      referrerPolicy: 'no-referrer',
      initial: { scale: 1.09, opacity: 0.45 },
      animate: { scale: 1, opacity: 1 },
      transition: { duration: 1.4, ease: 'easeOut' },
      className: 'absolute inset-0 h-full w-full object-cover',
    }),
    React.createElement('div', {
      'aria-hidden': 'true',
      className:
        'pointer-events-none absolute inset-0 bg-gradient-to-r from-black/45 via-black/35 to-black/82',
    }),

    // Top Diagonal Console Victory Header Banner
    React.createElement(
      motion.header,
      {
        initial: { y: -70, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        transition: { type: 'spring', stiffness: 240, damping: 22 },
        className:
          'relative z-20 flex items-center justify-between gap-4 px-6 sm:px-10 py-4 border-b-[4px] border-black bg-gradient-to-r from-black/92 via-[#111827]/88 to-black/92',
      },
      React.createElement(
        'div',
        { className: 'flex items-center gap-4' },
        React.createElement(
          'div',
          {
            className:
              '-skew-x-12 px-5 py-1.5 bg-[#FACC15] border-[3px] border-black text-black shadow-[4px_4px_0_#000]',
          },
          React.createElement(
            'span',
            {
              className:
                'skew-x-12 inline-flex items-center gap-2 font-display font-black uppercase text-base sm:text-xl tracking-wide whitespace-nowrap',
            },
            React.createElement(Trophy, { className: 'w-5 h-5 stroke-[2.5]' }),
            winnerLabel,
          ),
        ),
        React.createElement(
          'span',
          { className: 'hidden md:inline font-mono text-xs uppercase tracking-[0.22em] text-white/80' },
          `${stage.name} · ${formatMatchTime(hud.matchTimeTicks)}`,
        ),
      ),
      React.createElement(
        'span',
        {
          className:
            'font-display font-black italic uppercase tracking-widest text-sm sm:text-base text-[#FDE047]',
          style: { textShadow: '2px 2px 0 #000' },
        },
        hud.graphicsEra === 'NES' ? 'NES 8-BIT' : 'SNES / SEGA 16-BIT',
      ),
    ),

    // Main Full-Bleed Split Composition: Left Hero Spotlight + Right Results Ledger
    React.createElement(
      'main',
      {
        className:
          'relative z-20 flex-1 grid grid-cols-1 lg:grid-cols-12 items-center px-6 sm:px-10 py-6 gap-6 overflow-hidden',
      },

      // Left Champion Spotlight
      React.createElement(
        'section',
        { className: 'lg:col-span-6 flex flex-col items-center justify-center text-center gap-3' },
        React.createElement(
          motion.div,
          {
            initial: { scale: 0.65, y: 40, opacity: 0 },
            animate: { scale: 1, y: 0, opacity: 1 },
            transition: { delay: 0.12, type: 'spring', stiffness: 200, damping: 16 },
            className: 'relative flex items-center justify-center',
            style: {
              filter:
                'drop-shadow(0 20px 28px rgba(0,0,0,0.9)) drop-shadow(0 0 38px rgba(250,204,21,0.48))',
            },
          },
          React.createElement(SpriteCanvas, {
            pixelChart: resolvedWinner.pixelChart,
            palette: winnerPreset.colors,
            animState: 'jump',
            sizePx: 248,
            animate: true,
          }),
        ),
        React.createElement(
          motion.div,
          {
            initial: { y: 30, opacity: 0 },
            animate: { y: 0, opacity: 1 },
            transition: { delay: 0.24, duration: 0.35 },
            className: 'flex flex-col items-center gap-1.5',
          },
          winnerFighter.nickname
            ? React.createElement(
                'div',
                {
                  className:
                    '-skew-x-12 bg-black/90 border-2 border-[#FACC15] px-4 py-1 shadow-[4px_4px_0_#000]',
                },
                React.createElement(
                  'span',
                  {
                    className:
                      'skew-x-12 inline-flex items-center gap-1.5 font-display font-black uppercase text-xs sm:text-sm tracking-[0.2em] text-[#FDE047]',
                  },
                  React.createElement(Crown, { className: 'w-4 h-4' }),
                  `"${winnerFighter.nickname}"`,
                ),
              )
            : null,
          React.createElement(
            'h1',
            {
              className:
                'font-display font-black italic uppercase text-5xl sm:text-7xl leading-none tracking-tight text-white',
              style: ARCADE_STROKE,
            },
            winnerFighter.name,
          ),
          React.createElement(
            'p',
            {
              className: 'font-mono text-xs sm:text-sm uppercase tracking-[0.2em] text-white/85',
              style: { textShadow: '2px 2px 0 #000' },
            },
            `${winnerFighter.originTag} · ${winnerPreset.name}`,
          ),
        ),
      ),

      // Right Console Match Results Board & Actions
      React.createElement(
        motion.section,
        {
          initial: { x: 80, opacity: 0 },
          animate: { x: 0, opacity: 1 },
          transition: { delay: 0.18, type: 'spring', stiffness: 220, damping: 22 },
          className: 'lg:col-span-6 flex flex-col justify-center gap-4 max-w-2xl w-full mx-auto',
        },
        React.createElement(
          'div',
          { className: 'flex items-center justify-between border-b-2 border-[#FACC15] pb-2' },
          React.createElement(
            'span',
            { className: 'font-display font-black uppercase italic text-xl tracking-wider text-white' },
            'BATTLE RESULTS',
          ),
          React.createElement(
            'span',
            { className: 'font-mono text-xs uppercase tracking-widest text-[#FDE047]' },
            `TIME ${formatMatchTime(hud.matchTimeTicks)}`,
          ),
        ),
        renderPlacementRow({
          placeLabel: '1ST',
          isWinner: true,
          snapshot: winnerSnap,
          fighter: winnerFighter,
          graphicsEra: hud.graphicsEra,
          controlTag: winnerSlot === 0 ? 'P1' : p2ControlTag,
        }),
        renderPlacementRow({
          placeLabel: '2ND',
          isWinner: false,
          snapshot: loserSnap,
          fighter: loserFighter,
          graphicsEra: hud.graphicsEra,
          controlTag: loserSlot === 0 ? 'P1' : p2ControlTag,
        }),
        React.createElement(
          'div',
          {
            className:
              'flex items-center justify-between gap-3 px-4 py-2.5 bg-black/70 border border-white/15',
          },
          React.createElement(
            'div',
            { className: 'flex items-center gap-3 min-w-0' },
            React.createElement('img', {
              src: stage.backdropImage,
              alt: stage.name,
              referrerPolicy: 'no-referrer',
              className: 'w-16 h-10 object-cover border border-white/30 shrink-0',
            }),
            React.createElement(
              'div',
              { className: 'min-w-0' },
              React.createElement(
                'div',
                { className: 'font-display font-black uppercase text-sm text-white truncate' },
                stage.name,
              ),
              React.createElement(
                'div',
                { className: 'font-mono text-[11px] text-white/70 truncate' },
                `${stage.series} · ${matchConfig.stocks} Stocks`,
              ),
            ),
          ),
          React.createElement(
            'span',
            { className: 'font-mono text-[11px] uppercase tracking-wider text-white/60 shrink-0 hidden sm:inline' },
            'ENTER = REMATCH',
          ),
        ),
        React.createElement(
          'div',
          { className: 'grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2' },
          React.createElement(
            'button',
            {
              type: 'button',
              onClick: () => {
                chiptuneAudio.playMenuConfirm();
                onRematch();
              },
              className:
                '-skew-x-12 py-3.5 px-4 bg-[#FACC15] hover:bg-[#FDE047] border-[3px] border-black text-black shadow-[4px_4px_0_#000] cursor-pointer active:translate-y-0.5 transition-colors',
            },
            React.createElement(
              'span',
              {
                className:
                  'skew-x-12 inline-flex items-center justify-center gap-2 font-display font-black uppercase text-sm tracking-wide whitespace-nowrap',
              },
              React.createElement(RotateCcw, { className: 'w-4 h-4 stroke-[2.75]' }),
              'Rematch',
            ),
          ),
          React.createElement(
            'button',
            {
              type: 'button',
              onClick: () => {
                chiptuneAudio.playMenuTick();
                onStageSelect();
              },
              className:
                '-skew-x-12 py-3.5 px-4 bg-[#1E293B] hover:bg-[#334155] border-[3px] border-black text-white shadow-[4px_4px_0_#000] cursor-pointer active:translate-y-0.5 transition-colors',
            },
            React.createElement(
              'span',
              {
                className:
                  'skew-x-12 inline-flex items-center justify-center gap-2 font-display font-black uppercase text-sm tracking-wide whitespace-nowrap',
              },
              React.createElement(Map, { className: 'w-4 h-4' }),
              'Stage Select',
            ),
          ),
          React.createElement(
            'button',
            {
              type: 'button',
              onClick: () => {
                chiptuneAudio.playMenuTick();
                onCharacterSelect();
              },
              className:
                '-skew-x-12 py-3.5 px-4 bg-[#B91C1C] hover:bg-[#DC2626] border-[3px] border-black text-white shadow-[4px_4px_0_#000] cursor-pointer active:translate-y-0.5 transition-colors',
            },
            React.createElement(
              'span',
              {
                className:
                  'skew-x-12 inline-flex items-center justify-center gap-2 font-display font-black uppercase text-sm tracking-wide whitespace-nowrap',
              },
              React.createElement(Users, { className: 'w-4 h-4' }),
              'Fighters',
            ),
          ),
        ),
      ),
    ),
  );
}
