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
  fighters: FighterBlueprint[];
  matchConfig: MatchConfig;
  stage: StageManifest;
  onRematch: () => void;
  onStageSelect: () => void;
  onCharacterSelect: () => void;
}

const SLOT_ACCENTS = [
  '#EF4444',
  '#3B82F6',
  '#F59E0B',
  '#10B981',
  '#A855F7',
  '#06B6D4',
  '#F97316',
  '#EC4899',
];

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

function resolveSeatTag(seat: MatchConfig['players'][number] | undefined, slot: number): string {
  if (seat?.controlType === 'cpu') return 'CPU';
  return `P${slot + 1}`;
}

function resolveWinnerBanner(winnerSlot: number, isCpu: boolean): string {
  return isCpu ? 'CPU WINS!' : `PLAYER ${winnerSlot + 1} WINS!`;
}

function findRunnerUpSlot(hud: HudSnapshot, winnerSlot: number): number {
  const others = hud.fighters.filter((fighter) => fighter.slot !== winnerSlot);
  others.sort((a, b) => b.stocks - a.stocks || b.kosScored - a.kosScored || b.damageDealt - a.damageDealt);
  return others[0]?.slot ?? (winnerSlot === 0 ? 1 : 0);
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
  const accent = SLOT_ACCENTS[p.snapshot.slot % SLOT_ACCENTS.length];
  const roundedDamage = Math.round(p.snapshot.damageDealt);

  return React.createElement(
    'div',
    {
      className: [
        'relative flex items-center gap-2.5 sm:gap-4 px-3 sm:px-5 py-2.5 sm:py-3.5 border-l-[5px] sm:border-l-[6px] bg-black/75 border-y border-r border-white/15',
        p.isWinner ? 'shadow-[0_10px_28px_rgba(250,204,21,0.22)]' : 'opacity-90',
      ].join(' '),
      style: { borderLeftColor: p.isWinner ? '#FACC15' : accent },
    },
    React.createElement(
      'div',
      {
        className: [
          'w-10 h-10 sm:w-12 sm:h-12 shrink-0 flex items-center justify-center font-display font-black italic text-base sm:text-xl border-2 border-black shadow-[3px_3px_0_#000]',
          p.isWinner ? 'bg-[#FACC15] text-black' : 'bg-[#334155] text-white',
        ].join(' '),
      },
      p.placeLabel,
    ),
    React.createElement(
      'div',
      { className: 'w-11 h-11 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center bg-black/60 border border-white/15' },
      React.createElement(SpriteCanvas, {
        pixelChart: resolved.pixelChart,
        palette,
        animState: p.isWinner ? 'jump' : 'idle',
        sizePx: 44,
        animate: true,
        className: 'max-h-10 sm:max-h-12 w-auto h-auto',
      }),
    ),
    React.createElement(
      'div',
      { className: 'flex-1 min-w-0' },
      React.createElement(
        'div',
        { className: 'flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-mono uppercase tracking-wider min-w-0' },
        React.createElement('span', { style: { color: accent }, className: 'font-black shrink-0' }, p.controlTag),
        p.fighter.nickname
          ? React.createElement('span', { className: 'text-[#FDE047] font-bold truncate' }, `"${p.fighter.nickname}"`)
          : null,
      ),
      React.createElement(
        'div',
        { className: 'font-display font-black uppercase text-base sm:text-xl text-white leading-tight truncate' },
        p.fighter.name,
      ),
    ),
    React.createElement(
      'div',
      { className: 'flex items-center gap-3 sm:gap-5 shrink-0 font-mono tabular-nums text-right' },
      React.createElement(
        'div',
        null,
        React.createElement('div', { className: 'text-[9px] sm:text-[10px] uppercase text-white/60' }, 'KOs'),
        React.createElement('div', { className: 'text-base sm:text-xl font-black text-[#FACC15]' }, String(p.snapshot.kosScored)),
      ),
      React.createElement(
        'div',
        null,
        React.createElement('div', { className: 'text-[9px] sm:text-[10px] uppercase text-white/60' }, 'Damage'),
        React.createElement('div', { className: 'text-base sm:text-xl font-black text-white' }, `${roundedDamage}%`),
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

function renderVictoryHeader(
  winnerLabel: string,
  stageName: string,
  matchTicks: number,
  graphicsEra: GraphicsEra,
): React.ReactElement {
  const eraText = graphicsEra === 'NES' ? 'NES 8-BIT' : '16-BIT';
  const eraDesktopText = graphicsEra === 'NES' ? 'NES 8-BIT' : 'SNES / SEGA 16-BIT';

  return React.createElement(
    motion.header,
    {
      initial: { y: -70, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      transition: { type: 'spring', stiffness: 240, damping: 22 },
      className:
        'relative z-20 shrink-0 flex items-center justify-between gap-2 sm:gap-4 px-3.5 sm:px-10 py-2.5 sm:py-4 border-b-[4px] border-black bg-gradient-to-r from-black/92 via-[#111827]/88 to-black/92',
    },
    React.createElement(
      'div',
      { className: 'flex items-center gap-3 sm:gap-4 min-w-0' },
      React.createElement(
        'div',
        {
          className:
            '-skew-x-12 px-3 sm:px-5 py-1 sm:py-1.5 bg-[#FACC15] border-[3px] border-black text-black shadow-[4px_4px_0_#000]',
        },
        React.createElement(
          'span',
          {
            className:
              'skew-x-12 inline-flex items-center gap-1.5 sm:gap-2 font-display font-black uppercase text-sm sm:text-xl tracking-wide whitespace-nowrap',
          },
          React.createElement(Trophy, { className: 'w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]' }),
          winnerLabel,
        ),
      ),
      React.createElement(
        'span',
        { className: 'hidden md:inline font-mono text-xs uppercase tracking-[0.22em] text-white/80' },
        `${stageName} · ${formatMatchTime(matchTicks)}`,
      ),
    ),
    React.createElement(
      'span',
      {
        className:
          'font-display font-black italic uppercase tracking-widest text-xs sm:text-base text-[#FDE047] shrink-0',
        style: { textShadow: '2px 2px 0 #000' },
      },
      React.createElement('span', { className: 'sm:hidden' }, eraText),
      React.createElement('span', { className: 'hidden sm:inline' }, eraDesktopText),
    ),
  );
}

function renderVictoryActions(
  onRematch: () => void,
  onStageSelect: () => void,
  onCharacterSelect: () => void,
): React.ReactElement {
  return React.createElement(
    'div',
    { className: 'grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-1' },
    React.createElement(
      'button',
      {
        type: 'button',
        onClick: () => {
          chiptuneAudio.playMenuConfirm();
          onRematch();
        },
        className:
          'col-span-2 sm:col-span-1 -skew-x-12 min-h-[48px] py-3 px-4 bg-[#FACC15] hover:bg-[#FDE047] border-[3px] border-black text-black shadow-[4px_4px_0_#000] cursor-pointer active:translate-y-0.5 transition-colors touch-manipulation',
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
          '-skew-x-12 min-h-[48px] py-3 px-3 sm:px-4 bg-[#1E293B] hover:bg-[#334155] border-[3px] border-black text-white shadow-[4px_4px_0_#000] cursor-pointer active:translate-y-0.5 transition-colors touch-manipulation',
      },
      React.createElement(
        'span',
        {
          className:
            'skew-x-12 inline-flex items-center justify-center gap-1.5 sm:gap-2 font-display font-black uppercase text-xs sm:text-sm tracking-wide whitespace-nowrap',
        },
        React.createElement(Map, { className: 'w-4 h-4 shrink-0' }),
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
          '-skew-x-12 min-h-[48px] py-3 px-3 sm:px-4 bg-[#B91C1C] hover:bg-[#DC2626] border-[3px] border-black text-white shadow-[4px_4px_0_#000] cursor-pointer active:translate-y-0.5 transition-colors touch-manipulation',
      },
      React.createElement(
        'span',
        {
          className:
            'skew-x-12 inline-flex items-center justify-center gap-1.5 sm:gap-2 font-display font-black uppercase text-xs sm:text-sm tracking-wide whitespace-nowrap',
        },
        React.createElement(Users, { className: 'w-4 h-4 shrink-0' }),
        'Fighters',
      ),
    ),
  );
}

export function VictoryScreen(props: VictoryScreenProps): React.ReactElement {
  const { hud, fighters, matchConfig, stage, onRematch, onStageSelect, onCharacterSelect } = props;
  const winnerSlot = hud.winnerSlot ?? 0;
  const loserSlot = findRunnerUpSlot(hud, winnerSlot);
  const winnerFighter = fighters[winnerSlot];
  const loserFighter = fighters[loserSlot];
  const winnerSnap = hud.fighters[winnerSlot];
  const loserSnap = hud.fighters[loserSlot];
  const resolvedWinner = resolveFighterForEra(winnerFighter, hud.graphicsEra);
  const palIdx = winnerSnap.paletteIndex % Math.max(1, resolvedWinner.palettes.length);
  const winnerPreset = resolvedWinner.palettes[palIdx] ?? resolvedWinner.palettes[0];

  const winnerIsCpu = matchConfig.players[winnerSlot]?.controlType === 'cpu';
  const winnerLabel = resolveWinnerBanner(winnerSlot, winnerIsCpu);
  const winnerTag = resolveSeatTag(matchConfig.players[winnerSlot], winnerSlot);
  const loserTag = resolveSeatTag(matchConfig.players[loserSlot], loserSlot);
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
        'fixed inset-0 z-40 h-dvh w-screen overflow-hidden bg-[#050814] text-white select-none flex flex-col',
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
    renderVictoryHeader(winnerLabel, stage.name, hud.matchTimeTicks, hud.graphicsEra),
    React.createElement(
      'main',
      {
        className:
          'relative z-20 flex-1 overflow-y-auto lg:overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-start lg:items-center px-4 sm:px-10 pt-4 sm:pt-6 pb-24 lg:pb-6 gap-4 sm:gap-6',
      },
      React.createElement(
        'section',
        { className: 'lg:col-span-6 flex flex-col items-center justify-center text-center gap-2 sm:gap-3' },
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
            sizePx: 240,
            animate: true,
            className: 'max-h-36 sm:max-h-60 w-auto h-auto',
          }),
        ),
        React.createElement(
          motion.div,
          {
            initial: { y: 30, opacity: 0 },
            animate: { y: 0, opacity: 1 },
            transition: { delay: 0.24, duration: 0.35 },
            className: 'flex flex-col items-center gap-1 sm:gap-1.5',
          },
          winnerFighter.nickname
            ? React.createElement(
                'div',
                {
                  className:
                    '-skew-x-12 bg-black/90 border-2 border-[#FACC15] px-3 sm:px-4 py-0.5 sm:py-1 shadow-[4px_4px_0_#000]',
                },
                React.createElement(
                  'span',
                  {
                    className:
                      'skew-x-12 inline-flex items-center gap-1.5 font-display font-black uppercase text-[11px] sm:text-sm tracking-[0.18em] text-[#FDE047]',
                  },
                  React.createElement(Crown, { className: 'w-3.5 h-3.5 sm:w-4 sm:h-4' }),
                  `"${winnerFighter.nickname}"`,
                ),
              )
            : null,
          React.createElement(
            'h1',
            {
              className:
                'font-display font-black italic uppercase text-4xl sm:text-7xl leading-none tracking-tight text-white',
              style: ARCADE_STROKE,
            },
            winnerFighter.name,
          ),
          React.createElement(
            'p',
            {
              className: 'font-mono text-[11px] sm:text-sm uppercase tracking-[0.16em] text-white/85',
              style: { textShadow: '2px 2px 0 #000' },
            },
            `${winnerFighter.originTag} · ${winnerPreset.name}`,
          ),
        ),
      ),
      React.createElement(
        motion.section,
        {
          initial: { x: 80, opacity: 0 },
          animate: { x: 0, opacity: 1 },
          transition: { delay: 0.18, type: 'spring', stiffness: 220, damping: 22 },
          className: 'lg:col-span-6 flex flex-col justify-center gap-3 sm:gap-4 max-w-2xl w-full mx-auto',
        },
        React.createElement(
          'div',
          { className: 'flex items-center justify-between border-b-2 border-[#FACC15] pb-1.5 sm:pb-2' },
          React.createElement(
            'span',
            { className: 'font-display font-black uppercase italic text-lg sm:text-xl tracking-wider text-white' },
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
          controlTag: winnerTag,
        }),
        renderPlacementRow({
          placeLabel: '2ND',
          isWinner: false,
          snapshot: loserSnap,
          fighter: loserFighter,
          graphicsEra: hud.graphicsEra,
          controlTag: loserTag,
        }),
        React.createElement(
          'div',
          {
            className:
              'flex items-center justify-between gap-3 px-3 sm:px-4 py-2 sm:py-2.5 bg-black/70 border border-white/15',
          },
          React.createElement(
            'div',
            { className: 'flex items-center gap-2.5 sm:gap-3 min-w-0' },
            React.createElement('img', {
              src: stage.backdropImage,
              alt: stage.name,
              referrerPolicy: 'no-referrer',
              className: 'w-14 h-9 sm:w-16 sm:h-10 object-cover border border-white/30 shrink-0',
            }),
            React.createElement(
              'div',
              { className: 'min-w-0' },
              React.createElement(
                'div',
                { className: 'font-display font-black uppercase text-xs sm:text-sm text-white truncate' },
                stage.name,
              ),
              React.createElement(
                'div',
                { className: 'font-mono text-[10px] sm:text-[11px] text-white/70 truncate' },
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
        renderVictoryActions(onRematch, onStageSelect, onCharacterSelect),
      ),
    ),
  );
}
