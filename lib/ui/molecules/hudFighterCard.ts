'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { FighterBlueprint } from '../../types/fighter';
import type { HudFighterSnapshot } from '../../types/protocol';
import { SpriteCanvas } from '../atoms/spriteCanvas';

export interface HudFighterCardProps {
  snapshot: HudFighterSnapshot;
  fighter: FighterBlueprint;
  controlLabel: string;
}

/**
 * Super Smash Bros. Ultimate-inspired floating angled combat plaque.
 * Displays an overlapping animated pixel portrait, slanted player color flare,
 * stock head pips, shield gauge, and oversized shaking damage percentage readout.
 */
export function HudFighterCard(props: HudFighterCardProps): React.ReactElement {
  const { snapshot, fighter, controlLabel } = props;
  const isP1 = snapshot.slot === 0;
  const accentHex = isP1 ? '#EF4444' : '#3B82F6';
  const accentGlow = isP1 ? 'rgba(239, 68, 68, 0.35)' : 'rgba(59, 130, 246, 0.35)';
  const palette =
    fighter.palettes[snapshot.paletteIndex]?.colors ?? fighter.palettes[0].colors;

  const prevDamageRef = useRef<number>(snapshot.damagePct);
  const [shaking, setShaking] = useState<boolean>(false);

  useEffect(() => {
    if (snapshot.damagePct > prevDamageRef.current) {
      const startTimer = window.setTimeout(() => setShaking(true), 0);
      const endTimer = window.setTimeout(() => setShaking(false), 180);
      prevDamageRef.current = snapshot.damagePct;
      return () => {
        window.clearTimeout(startTimer);
        window.clearTimeout(endTimer);
      };
    }
    prevDamageRef.current = snapshot.damagePct;
  }, [snapshot.damagePct]);

  // Classic Smash damage color escalation paired with explicit numeric readout
  let pctColor = '#FFFFFF';
  if (snapshot.damagePct >= 140) {
    pctColor = '#DC2626';
  } else if (snapshot.damagePct >= 95) {
    pctColor = '#F97316';
  } else if (snapshot.damagePct >= 50) {
    pctColor = '#FACC15';
  } else if (snapshot.damagePct >= 20) {
    pctColor = '#FEF08A';
  }

  return React.createElement(
    'div',
    {
      className: [
        'relative flex items-end select-none transition-transform duration-100',
        shaking ? 'scale-105 -translate-y-1' : 'scale-100 translate-y-0',
      ].join(' '),
      style: {
        filter: 'drop-shadow(0 8px 18px rgba(0, 0, 0, 0.72))',
      },
    },

    // Slanted Smash Ultimate Plaque Backing
    React.createElement(
      'div',
      {
        className:
          'relative flex items-center gap-3 pl-16 pr-5 py-2.5 -skew-x-12 rounded-sm bg-[#090E1C]/88 border-2 min-w-[270px] sm:min-w-[310px]',
        style: {
          borderColor: accentHex,
          boxShadow: `inset 0 0 24px ${accentGlow}`,
        },
      },

      // Diagonal colored accent ribbon on left side
      React.createElement('div', {
        className: 'absolute left-0 top-0 bottom-0 w-3',
        style: { backgroundColor: accentHex },
      }),

      // Un-skewed inner content row
      React.createElement(
        'div',
        { className: 'skew-x-12 flex items-center justify-between gap-4 w-full' },

        // Left: Fighter Name + Slot + Stock Pips
        React.createElement(
          'div',
          { className: 'flex flex-col min-w-0' },
          React.createElement(
            'div',
            { className: 'flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase' },
            React.createElement('span', { style: { color: accentHex } }, isP1 ? 'P1' : 'P2'),
            React.createElement('span', { className: 'text-[#94A3B8]' }, controlLabel),
          ),
          React.createElement(
            'div',
            {
              className:
                'font-display font-extrabold text-lg sm:text-xl leading-tight text-white tracking-tight truncate',
              style: { textShadow: '0 2px 4px rgba(0,0,0,0.85)' },
            },
            snapshot.name,
          ),
          // Stock icons row + numeric stock readout
          React.createElement(
            'div',
            { className: 'flex items-center gap-1.5 mt-1.5' },
            ...Array.from({ length: snapshot.maxStocks }, (_, i) =>
              React.createElement('span', {
                key: i,
                className: 'w-3 h-3 rounded-full border-2 transition-opacity',
                style: {
                  backgroundColor: i < snapshot.stocks ? accentHex : 'rgba(15,23,42,0.7)',
                  borderColor: i < snapshot.stocks ? '#FFFFFF' : '#475569',
                  opacity: i < snapshot.stocks ? 1 : 0.45,
                },
              }),
            ),
            React.createElement(
              'span',
              { className: 'font-mono text-[11px] tabular-nums text-[#CBD5E1] ml-1 font-semibold' },
              `${snapshot.stocks}`,
            ),
          ),
        ),

        // Right: Oversized Smash Ultimate Damage Percentage
        React.createElement(
          'div',
          { className: 'flex items-baseline shrink-0 pl-1' },
          React.createElement(
            'span',
            {
              className:
                'font-mono font-extrabold text-4xl sm:text-5xl leading-none tabular-nums tracking-tighter',
              style: {
                color: pctColor,
                textShadow:
                  '2px 2px 0 #000000, -1px -1px 0 #000000, 1px -1px 0 #000000, -1px 1px 0 #000000, 0 4px 10px rgba(0,0,0,0.9)',
              },
            },
            `${snapshot.damagePct}`,
          ),
          React.createElement(
            'span',
            {
              className: 'font-mono font-extrabold text-xl sm:text-2xl ml-0.5',
              style: {
                color: pctColor,
                textShadow: '2px 2px 0 #000000, -1px -1px 0 #000000',
              },
            },
            '%',
          ),
        ),
      ),
    ),

    // Overlapping Crisp Pixel Fighter Portrait bursting cleanly from left edge
    React.createElement(
      'div',
      {
        className:
          'absolute -left-2 bottom-1 w-20 h-20 flex items-end justify-center pointer-events-none',
        style: { filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.85))' },
      },
      React.createElement(SpriteCanvas, {
        pixelChart: fighter.pixelChart,
        palette,
        animState: snapshot.isRespawning ? 'jump' : shaking ? 'hurt' : 'idle',
        sizePx: 72,
        flipX: !isP1,
        animate: true,
      }),
    ),
  );
}
