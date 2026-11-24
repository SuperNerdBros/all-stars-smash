'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Swords } from 'lucide-react';
import type { FighterBlueprint, GraphicsEra } from '../../types/fighter';
import type { MatchConfig } from '../../types/protocol';
import type { StageManifest } from '../../types/stage';
import { chiptuneAudio } from '../../io/chiptuneAudio';
import { resolveFighterForEra } from '../../roster/eraResolver';
import { SpriteCanvas } from '../atoms/spriteCanvas';

export interface VsIntroScreenProps {
  fighters: [FighterBlueprint, FighterBlueprint];
  matchConfig: MatchConfig;
  stage: StageManifest;
  onComplete: () => void;
}

const VS_DURATION_MS = 2900;

const COMIC_STROKE_STYLE: React.CSSProperties = {
  textShadow:
    '3px 3px 0 #000, -3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 0 6px 14px rgba(0,0,0,0.9)',
};

const HALFTONE_OVERLAY_STYLE: React.CSSProperties = {
  backgroundImage: 'radial-gradient(rgba(0,0,0,0.34) 1.5px, transparent 1.5px)',
  backgroundSize: '8px 8px',
};

interface ComicSidePanelProps {
  slot: 0 | 1;
  fighter: FighterBlueprint;
  graphicsEra: GraphicsEra;
  paletteIndex: number;
  controlTag: string;
}

function renderComicSidePanel(p: ComicSidePanelProps): React.ReactElement {
  const isP1 = p.slot === 0;
  const resolved = resolveFighterForEra(p.fighter, p.graphicsEra);
  const safeIdx = p.paletteIndex % Math.max(1, resolved.palettes.length);
  const palette = resolved.palettes[safeIdx]?.colors ?? resolved.palettes[0].colors;

  const panelClip = isP1
    ? 'polygon(0 0, 56% 0, 44% 100%, 0 100%)'
    : 'polygon(56% 0, 100% 0, 100% 100%, 44% 100%)';

  const panelGradient = isP1
    ? 'linear-gradient(135deg, rgba(185,28,28,0.88) 0%, rgba(127,29,29,0.72) 55%, rgba(15,10,20,0.84) 100%)'
    : 'linear-gradient(225deg, rgba(37,99,235,0.88) 0%, rgba(29,78,216,0.72) 55%, rgba(10,16,36,0.86) 100%)';

  return React.createElement(
    motion.div,
    {
      initial: { x: isP1 ? '-100%' : '100%', opacity: 0.2 },
      animate: { x: '0%', opacity: 1 },
      transition: { type: 'spring', stiffness: 250, damping: 24, mass: 0.9 },
      style: { clipPath: panelClip, background: panelGradient },
      className: 'absolute inset-0 overflow-hidden',
    },
    React.createElement('div', {
      'aria-hidden': 'true',
      style: HALFTONE_OVERLAY_STYLE,
      className: 'pointer-events-none absolute inset-0 opacity-75',
    }),
    React.createElement(
      'div',
      {
        className: [
          'absolute top-6 z-20 flex flex-col gap-1',
          isP1 ? 'left-6 sm:left-10 items-start' : 'right-6 sm:right-10 items-end',
        ].join(' '),
      },
      React.createElement(
        'span',
        {
          className: [
            '-skew-x-12 px-4 py-1 border-[3px] border-black font-display font-black text-sm sm:text-base uppercase tracking-widest shadow-[4px_4px_0_#000]',
            isP1 ? 'bg-[#FACC15] text-black' : 'bg-[#38BDF8] text-black',
          ].join(' '),
        },
        React.createElement('span', { className: 'inline-block skew-x-12' }, p.controlTag),
      ),
      React.createElement(
        'span',
        {
          className: 'font-mono text-xs font-bold uppercase tracking-[0.2em] text-white/90',
          style: { textShadow: '2px 2px 0 #000' },
        },
        p.fighter.originTag,
      ),
    ),
    React.createElement(
      motion.div,
      {
        initial: { x: isP1 ? -90 : 90, scale: 0.78, opacity: 0 },
        animate: { x: 0, scale: 1, opacity: 1 },
        transition: { delay: 0.14, type: 'spring', stiffness: 220, damping: 18 },
        className: [
          'absolute top-1/2 -translate-y-1/2 z-10 flex items-center justify-center',
          isP1 ? 'left-[8%] sm:left-[12%]' : 'right-[8%] sm:right-[12%]',
        ].join(' '),
        style: {
          filter: 'drop-shadow(0 14px 20px rgba(0,0,0,0.85)) drop-shadow(0 0 28px rgba(255,255,255,0.28))',
        },
      },
      React.createElement(SpriteCanvas, {
        pixelChart: resolved.pixelChart,
        palette,
        animState: 'walk',
        sizePx: 228,
        flipX: !isP1,
        animate: true,
      }),
    ),
    React.createElement(
      motion.div,
      {
        initial: { y: 40, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        transition: { delay: 0.22, duration: 0.3, ease: 'easeOut' },
        className: [
          'absolute bottom-20 sm:bottom-24 z-20 flex flex-col max-w-[44%]',
          isP1 ? 'left-6 sm:left-10 items-start text-left' : 'right-6 sm:right-10 items-end text-right',
        ].join(' '),
      },
      p.fighter.nickname
        ? React.createElement(
            'div',
            {
              className:
                '-skew-x-12 bg-black border-2 border-[#FACC15] px-3 py-0.5 mb-1.5 shadow-[3px_3px_0_#000]',
            },
            React.createElement(
              'span',
              {
                className:
                  'inline-block skew-x-12 font-display font-black uppercase text-xs sm:text-sm tracking-widest text-[#FDE047] whitespace-nowrap',
              },
              `"${p.fighter.nickname}"`,
            ),
          )
        : null,
      React.createElement(
        'h2',
        {
          className:
            'font-display font-black uppercase italic text-4xl sm:text-6xl lg:text-7xl leading-none tracking-tight text-white',
          style: COMIC_STROKE_STYLE,
        },
        p.fighter.name,
      ),
    ),
  );
}

/**
 * Full-screen comic-book dual-panel VS splash screen played before battle starts.
 */
export function VsIntroScreen(props: VsIntroScreenProps): React.ReactElement {
  const { fighters, matchConfig, stage, onComplete } = props;
  const doneRef = useRef(false);

  const finishIntro = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    chiptuneAudio.playMenuConfirm();
    onComplete();
  };

  useEffect(() => {
    chiptuneAudio.playMenuConfirm();
    const timer = window.setTimeout(() => {
      if (!doneRef.current) {
        doneRef.current = true;
        onComplete();
      }
    }, VS_DURATION_MS);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        if (!doneRef.current) {
          doneRef.current = true;
          chiptuneAudio.playMenuConfirm();
          onComplete();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onComplete]);

  const p2Tag =
    matchConfig.players[1].controlType === 'cpu'
      ? `CPU · LV ${matchConfig.players[1].cpuDifficulty.toUpperCase()}`
      : 'PLAYER 2';

  return React.createElement(
    'div',
    {
      role: 'button',
      tabIndex: 0,
      onClick: finishIntro,
      'aria-label': 'Start battle now',
      className:
        'fixed inset-0 z-40 h-screen w-screen overflow-hidden bg-black text-white select-none cursor-pointer',
    },
    React.createElement(motion.img, {
      src: '/assets/screens/vs_comic_clash.jpg',
      alt: 'Comic clash battle splash backdrop',
      referrerPolicy: 'no-referrer',
      initial: { scale: 1.12, opacity: 0.6 },
      animate: { scale: 1.02, opacity: 1 },
      transition: { duration: 1.8, ease: 'easeOut' },
      className: 'absolute inset-0 h-full w-full object-cover',
    }),
    renderComicSidePanel({
      slot: 0,
      fighter: fighters[0],
      graphicsEra: matchConfig.graphicsEra,
      paletteIndex: matchConfig.players[0].paletteIndex,
      controlTag: 'PLAYER 1',
    }),
    renderComicSidePanel({
      slot: 1,
      fighter: fighters[1],
      graphicsEra: matchConfig.graphicsEra,
      paletteIndex: matchConfig.players[1].paletteIndex,
      controlTag: p2Tag,
    }),
    React.createElement('div', {
      'aria-hidden': 'true',
      className: 'pointer-events-none absolute inset-0 z-20',
      style: {
        background:
          'linear-gradient(101deg, transparent 48.8%, #000000 48.8%, #000000 49.5%, #FACC15 49.5%, #FACC15 50.5%, #000000 50.5%, #000000 51.2%, transparent 51.2%)',
      },
    }),
    React.createElement(
      motion.div,
      {
        initial: { scale: 3.4, rotate: -22, opacity: 0 },
        animate: { scale: 1, rotate: -7, opacity: 1 },
        transition: { delay: 0.25, type: 'spring', stiffness: 320, damping: 18 },
        className:
          'pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex items-center justify-center',
      },
      React.createElement(
        'div',
        {
          className:
            'relative px-7 py-4 bg-gradient-to-b from-[#FDE047] via-[#F59E0B] to-[#DC2626] border-[6px] border-black shadow-[8px_8px_0_#000]',
        },
        React.createElement(
          'span',
          {
            className:
              'font-display font-black italic text-6xl sm:text-8xl tracking-tighter text-white leading-none block',
            style: COMIC_STROKE_STYLE,
          },
          'VS',
        ),
      ),
    ),
    React.createElement(
      motion.div,
      {
        initial: { y: 60, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        transition: { delay: 0.35, duration: 0.32, ease: 'easeOut' },
        className:
          'absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 px-6 py-2 bg-black/92 border-[3px] border-[#FACC15] -skew-x-12 shadow-[6px_6px_0_#000] max-w-[92vw]',
      },
      React.createElement(
        'div',
        { className: 'skew-x-12 flex items-center gap-3 min-w-0' },
        React.createElement('img', {
          src: stage.backdropImage,
          alt: stage.name,
          referrerPolicy: 'no-referrer',
          className: 'w-14 h-9 object-cover border-2 border-white/80 shrink-0',
        }),
        React.createElement(
          'div',
          { className: 'flex flex-col min-w-0' },
          React.createElement(
            'span',
            { className: 'font-mono text-[10px] font-bold uppercase tracking-widest text-[#FDE047]' },
            `STAGE · ${stage.series} · ${matchConfig.stocks} STOCKS`,
          ),
          React.createElement(
            'span',
            { className: 'font-display font-black uppercase text-sm sm:text-base text-white truncate' },
            stage.name,
          ),
        ),
        React.createElement(
          'span',
          {
            className:
              'hidden sm:inline-flex items-center gap-1.5 ml-3 pl-3 border-l border-white/25 font-mono text-[11px] font-bold uppercase tracking-wider text-white/80 whitespace-nowrap',
          },
          React.createElement(Swords, { className: 'w-3.5 h-3.5 text-[#FACC15]' }),
          'CLICK OR SPACE TO FIGHT',
        ),
      ),
    ),
  );
}
