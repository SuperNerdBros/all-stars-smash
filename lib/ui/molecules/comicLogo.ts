'use client';

import React from 'react';
import { BRAND } from '../../branding';

/** 14-point starburst polygon (percent coords) for the "POW" flash behind the wordmark. */
const BURST_POINTS = Array.from({ length: 28 }, (_, i) => {
  const a = (Math.PI * 2 * i) / 28 - Math.PI / 2;
  const r = i % 2 === 0 ? 50 : 36;
  return `${(50 + Math.cos(a) * r).toFixed(1)}% ${(50 + Math.sin(a) * r * 0.82).toFixed(1)}%`;
}).join(', ');

const INK = '#0B0B0F';

/** Thick inked outline + hard offset shadow, the classic comic lettering look. */
const INKED_TEXT: React.CSSProperties = {
  WebkitTextStroke: `3px ${INK}`,
  paintOrder: 'stroke fill',
  textShadow: `5px 5px 0 ${INK}, 7px 7px 0 rgba(0,0,0,0.35)`,
};

const HALFTONE_RED: React.CSSProperties = {
  backgroundColor: '#E11D48',
  backgroundImage: 'radial-gradient(rgba(255,255,255,0.28) 22%, transparent 24%)',
  backgroundSize: '9px 9px',
};

const HALFTONE_YELLOW: React.CSSProperties = {
  backgroundColor: '#FACC15',
  backgroundImage: 'radial-gradient(rgba(249,115,22,0.55) 26%, transparent 28%)',
  backgroundSize: '8px 8px',
};

/**
 * Original comic-book title treatment: halftone starburst, tilted ink-outlined wordmark,
 * Ben-Day dot banner, and a "speech-caption" tagline box.
 */
export function ComicLogo(): React.ReactElement {
  return React.createElement(
    'div',
    { className: 'relative flex flex-col items-center lg:items-start select-none' },

    // Starburst flash
    React.createElement('div', {
      'aria-hidden': 'true',
      className: 'pointer-events-none absolute -z-10 left-1/2 lg:left-[42%] top-[46%] -translate-x-1/2 -translate-y-1/2 w-[130%] aspect-[1.35] opacity-95',
      style: { ...HALFTONE_YELLOW, clipPath: `polygon(${BURST_POINTS})`, filter: `drop-shadow(6px 6px 0 ${INK})` },
    }),
    React.createElement('div', {
      'aria-hidden': 'true',
      className: 'pointer-events-none absolute -z-10 left-1/2 lg:left-[42%] top-[46%] -translate-x-1/2 -translate-y-1/2 w-[104%] aspect-[1.35]',
      style: { ...HALFTONE_RED, clipPath: `polygon(${BURST_POINTS})` },
    }),

    // Kicker
    React.createElement(
      'span',
      {
        className: '-rotate-6 font-display font-black italic uppercase tracking-[0.3em] text-2xl sm:text-3xl text-[#FDE047] leading-none mb-1 ml-1',
        style: INKED_TEXT,
      },
      BRAND.kicker,
    ),

    // Wordmark
    React.createElement(
      'h1',
      {
        className: '-rotate-3 font-display font-black italic uppercase text-6xl sm:text-8xl xl:text-[104px] leading-[0.86] tracking-tight text-white',
        style: { ...INKED_TEXT, WebkitTextStroke: `4px ${INK}` },
      },
      BRAND.wordmark,
    ),

    // Banner
    React.createElement(
      'div',
      {
        className: 'mt-3 -rotate-2 -skew-x-12 inline-flex items-center px-7 sm:px-10 py-2 border-[4px] shadow-[8px_8px_0_#0B0B0F]',
        style: { borderColor: INK, backgroundColor: '#2563EB', backgroundImage: 'radial-gradient(rgba(255,255,255,0.22) 24%, transparent 26%)', backgroundSize: '8px 8px' },
      },
      React.createElement(
        'span',
        {
          className: 'skew-x-12 font-display font-black italic uppercase text-3xl sm:text-5xl tracking-[0.1em] text-[#FDE047] leading-none whitespace-nowrap',
          style: { ...INKED_TEXT, textShadow: `4px 4px 0 ${INK}` },
        },
        BRAND.banner,
      ),
    ),

    // Caption box
    React.createElement(
      'div',
      {
        className: 'mt-5 rotate-1 px-3 py-1.5 bg-[#FEF9C3] border-[3px] font-mono text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em] text-[#0B0B0F] shadow-[4px_4px_0_#0B0B0F]',
        style: { borderColor: INK },
      },
      `${BRAND.tagline} · Local 2P · CPU Brawls`,
    ),
  );
}
