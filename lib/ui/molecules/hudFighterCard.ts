'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Crosshair } from 'lucide-react';
import type { FighterBlueprint, GraphicsEra } from '../../types/fighter';
import type { HudFighterSnapshot } from '../../types/protocol';
import { resolveFighterForEra } from '../../roster/eraResolver';
import { SpriteCanvas } from '../atoms/spriteCanvas';

export interface HudFighterCardProps {
  snapshot: HudFighterSnapshot;
  fighter: FighterBlueprint;
  graphicsEra: GraphicsEra;
  controlLabel: string;
  canTarget?: boolean;
  isLockedTarget?: boolean;
  compact?: boolean;
  onSelectTarget?: (slot: number) => void;
}

const SLOT_ACCENTS = ['#EF4444', '#3B82F6', '#F59E0B', '#10B981', '#A855F7', '#06B6D4', '#F97316', '#EC4899'];

const DAMAGE_THRESHOLDS: ReadonlyArray<{ minPct: number; color: string }> = [
  { minPct: 140, color: '#DC2626' },
  { minPct: 95, color: '#F97316' },
  { minPct: 50, color: '#FACC15' },
  { minPct: 20, color: '#FEF08A' },
];

function resolveDamageColor(damagePct: number): string {
  return DAMAGE_THRESHOLDS.find((entry) => damagePct >= entry.minPct)?.color ?? '#FFFFFF';
}

function resolvePortraitAnimState(isRespawning: boolean, shaking: boolean): 'jump' | 'hurt' | 'idle' {
  if (isRespawning) return 'jump';
  if (shaking) return 'hurt';
  return 'idle';
}

function useDamageShake(damagePct: number): boolean {
  const prevDamageRef = useRef<number>(damagePct);
  const [shaking, setShaking] = useState<boolean>(false);

  useEffect(() => {
    const tookDamage = damagePct > prevDamageRef.current;
    prevDamageRef.current = damagePct;
    if (!tookDamage) return;

    const startTimer = window.setTimeout(() => setShaking(true), 0);
    const endTimer = window.setTimeout(() => setShaking(false), 180);
    return () => {
      window.clearTimeout(startTimer);
      window.clearTimeout(endTimer);
    };
  }, [damagePct]);

  return shaking;
}

function renderLockedBadge(): React.ReactElement {
  return React.createElement(
    'div',
    {
      className:
        'absolute -top-3 right-1.5 sm:right-2 z-20 flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 bg-[#FACC15] text-[#090E1C] border-2 border-black font-mono text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0_#000]',
    },
    React.createElement(Crosshair, { className: 'w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[2.75]' }),
    'Locked',
  );
}

function renderStockPips(stocks: number, maxStocks: number, accentHex: string): React.ReactElement {
  return React.createElement(
    'div',
    { className: 'flex items-center gap-1 sm:gap-1.5 mt-0.5 sm:mt-1' },
    ...Array.from({ length: maxStocks }, (_, i) => {
      const filled = i < stocks;
      return React.createElement('span', {
        key: i,
        className: 'w-2 h-2 sm:w-3 sm:h-3 rounded-full border sm:border-2 transition-opacity',
        style: {
          backgroundColor: filled ? accentHex : 'rgba(15,23,42,0.7)',
          borderColor: filled ? '#FFFFFF' : '#475569',
          opacity: filled ? 1 : 0.45,
        },
      });
    }),
    React.createElement(
      'span',
      { className: 'font-mono text-[9px] sm:text-[11px] tabular-nums text-[#CBD5E1] ml-0.5 font-semibold' },
      `${stocks}`,
    ),
  );
}

function renderDamageMeter(damagePct: number): React.ReactElement {
  const pctColor = resolveDamageColor(damagePct);
  return React.createElement(
    'div',
    { className: 'flex items-baseline shrink-0 pl-0.5' },
    React.createElement(
      'span',
      {
        className: 'font-mono font-extrabold text-xl sm:text-5xl leading-none tabular-nums tracking-tighter',
        style: {
          color: pctColor,
          textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0 4px 10px rgba(0,0,0,0.9)',
        },
      },
      `${Math.round(damagePct)}`,
    ),
    React.createElement(
      'span',
      {
        className: 'font-mono font-extrabold text-xs sm:text-2xl ml-0.5',
        style: { color: pctColor, textShadow: '2px 2px 0 #000, -1px -1px 0 #000' },
      },
      '%',
    ),
  );
}

interface CardContentParams {
  snapshot: HudFighterSnapshot;
  fighter: FighterBlueprint;
  graphicsEra: GraphicsEra;
  controlLabel: string;
  isLockedTarget: boolean;
  isInteractive: boolean;
  compact: boolean;
  shaking: boolean;
}

function renderCardContent(p: CardContentParams): React.ReactElement {
  const resolved = resolveFighterForEra(p.fighter, p.graphicsEra);
  const accentHex = SLOT_ACCENTS[p.snapshot.slot % SLOT_ACCENTS.length];
  const borderColor = p.isLockedTarget ? '#FACC15' : accentHex;
  const glowColor = p.isLockedTarget ? 'rgba(250, 204, 21, 0.42)' : `${accentHex}45`;
  const palette = resolved.palettes[p.snapshot.paletteIndex]?.colors ?? resolved.palettes[0].colors;
  const showLockHint = p.isInteractive && !p.isLockedTarget;
  const sizeClasses = p.compact
    ? 'w-full sm:w-auto pl-10 sm:pl-14 pr-2.5 sm:pr-4 py-1.5 sm:py-2 sm:min-w-[235px]'
    : 'w-full sm:w-auto pl-10 sm:pl-16 pr-2.5 sm:pr-5 py-1.5 sm:py-2.5 sm:min-w-[285px]';
  const portraitWrap = p.compact
    ? 'absolute -left-1 bottom-0.5 w-11 h-11 sm:w-16 sm:h-16 flex items-end justify-center pointer-events-none'
    : 'absolute -left-1.5 bottom-0.5 sm:bottom-1 w-11 h-11 sm:w-20 sm:h-20 flex items-end justify-center pointer-events-none';

  return React.createElement(
    React.Fragment,
    null,
    p.isLockedTarget ? renderLockedBadge() : null,
    React.createElement(
      'div',
      {
        className: [
          'relative flex items-center gap-1.5 sm:gap-3 -skew-x-12 rounded-sm bg-[#090E1C]/90 border-2 transition-all min-w-0',
          sizeClasses,
          p.isLockedTarget ? 'ring-2 ring-[#FACC15]/75' : '',
          showLockHint ? 'hover:bg-[#131C33]/95' : '',
        ].join(' '),
        style: { borderColor, boxShadow: `inset 0 0 22px ${glowColor}` },
      },
      React.createElement('div', { className: 'absolute left-0 top-0 bottom-0 w-2 sm:w-3', style: { backgroundColor: borderColor } }),
      React.createElement(
        'div',
        { className: 'skew-x-12 flex items-center justify-between gap-1.5 sm:gap-4 w-full min-w-0' },
        React.createElement(
          'div',
          { className: 'flex flex-col min-w-0 text-left' },
          React.createElement(
            'div',
            { className: 'flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[11px] font-bold tracking-wider uppercase' },
            React.createElement('span', { style: { color: accentHex } }, `P${p.snapshot.slot + 1}`),
            React.createElement('span', { className: 'hidden sm:inline text-[#94A3B8] truncate' }, p.controlLabel),
            showLockHint
              ? React.createElement(
                  'span',
                  { className: 'inline-flex items-center gap-0.5 text-[#FACC15]' },
                  React.createElement(Crosshair, { className: 'w-2.5 h-2.5 sm:w-3 sm:h-3' }),
                  React.createElement('span', { className: 'text-[9px] sm:text-[10px]' }, 'Lock'),
                )
              : null,
          ),
          React.createElement(
            'div',
            {
              className: 'font-display font-extrabold text-xs sm:text-xl leading-tight text-white tracking-tight truncate',
              style: { textShadow: '0 2px 4px rgba(0,0,0,0.85)' },
            },
            p.snapshot.name,
          ),
          renderStockPips(p.snapshot.stocks, p.snapshot.maxStocks, accentHex),
        ),
        renderDamageMeter(p.snapshot.damagePct),
      ),
    ),
    React.createElement(
      'div',
      { className: portraitWrap, style: { filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.85))' } },
      React.createElement(SpriteCanvas, {
        pixelChart: resolved.pixelChart,
        palette,
        animState: resolvePortraitAnimState(p.snapshot.isRespawning, p.shaking),
        sizePx: p.compact ? 42 : 64,
        flipX: p.snapshot.slot !== 0,
        animate: true,
        className: 'max-h-11 sm:max-h-none w-auto h-auto',
      }),
    ),
  );
}

export function HudFighterCard(props: HudFighterCardProps): React.ReactElement {
  const {
    snapshot,
    fighter,
    graphicsEra,
    controlLabel,
    canTarget = false,
    isLockedTarget = false,
    compact = false,
    onSelectTarget,
  } = props;

  const shaking = useDamageShake(snapshot.damagePct);
  const isEliminated = snapshot.stocks <= 0;
  const isInteractive = canTarget && !isEliminated && Boolean(onSelectTarget);
  const content = renderCardContent({
    snapshot,
    fighter,
    graphicsEra,
    controlLabel,
    isLockedTarget,
    isInteractive,
    compact,
    shaking,
  });

  const sharedClassName = [
    'relative flex items-end select-none transition-transform duration-100 w-full sm:w-auto min-w-0 min-h-[48px]',
    shaking ? 'scale-105 -translate-y-1' : 'scale-100 translate-y-0',
    isEliminated ? 'opacity-50 grayscale' : '',
    isInteractive
      ? 'pointer-events-auto cursor-pointer touch-manipulation active:scale-95 focus-visible:outline-2 focus-visible:outline-[#FACC15]'
      : 'pointer-events-none',
  ].join(' ');

  const dropShadowStyle = { filter: 'drop-shadow(0 8px 18px rgba(0, 0, 0, 0.72))' };

  if (isInteractive) {
    return React.createElement(
      'button',
      {
        type: 'button',
        onClick: () => onSelectTarget?.(snapshot.slot),
        'aria-pressed': isLockedTarget,
        'aria-label': isLockedTarget ? `Unlock auto-target from ${snapshot.name}` : `Lock auto-target onto ${snapshot.name}`,
        title: isLockedTarget ? `Locked onto ${snapshot.name} - tap to unlock` : `Tap to auto-lock onto ${snapshot.name}`,
        className: sharedClassName,
        style: dropShadowStyle,
      },
      content,
    );
  }

  return React.createElement('div', { className: sharedClassName, style: dropShadowStyle }, content);
}
