'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { chiptuneAudio } from '../../io/chiptuneAudio';

export interface DisclaimerScreenProps {
  onContinue: () => void;
}

const AUTO_ADVANCE_MS = 6800;

/**
 * Full-screen stark black broadcast parody disclaimer (South Park style)
 * displayed before entering the console arcade shell.
 */
export function DisclaimerScreen(props: DisclaimerScreenProps): React.ReactElement {
  const { onContinue } = props;
  const dismissedRef = useRef(false);

  const dismiss = () => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    chiptuneAudio.playMenuConfirm();
    onContinue();
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!dismissedRef.current) {
        dismissedRef.current = true;
        onContinue();
      }
    }, AUTO_ADVANCE_MS);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      if (!dismissedRef.current) {
        dismissedRef.current = true;
        chiptuneAudio.playMenuConfirm();
        onContinue();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onContinue]);

  return React.createElement(
    'div',
    {
      role: 'button',
      tabIndex: 0,
      onClick: dismiss,
      'aria-label': 'Continue past disclaimer',
      className:
        'fixed inset-0 z-50 h-screen w-screen overflow-hidden bg-black text-white flex flex-col items-center justify-center px-6 sm:px-14 select-none cursor-pointer',
    },
    React.createElement(
      motion.div,
      {
        initial: { opacity: 0, scale: 0.98 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 0.45, ease: 'easeOut' },
        className: 'max-w-3xl w-full flex flex-col items-center text-center gap-5 sm:gap-6 pb-10',
      },
      React.createElement(
        'div',
        {
          className:
            'font-display font-black uppercase tracking-[0.28em] text-sm sm:text-base text-white/90 border-b-2 border-white/80 pb-2 px-6',
        },
        'DISCLAIMER',
      ),
      React.createElement(
        'p',
        {
          className:
            'font-display font-bold uppercase text-base sm:text-xl md:text-[23px] leading-snug tracking-wide text-white',
        },
        'ALL CHARACTERS AND EVENTS IN THIS NON-COMMERCIAL FAN PARODY ARE ENTIRELY FICTIONAL. ALL PIXELATED LIKENESSES, MUSTACHES, SPIKY HAIR, CHILI DOGS, AND SUPLEXED TRAINS ARE PURELY COINCIDENTAL.',
      ),
      React.createElement(
        'p',
        {
          className:
            'font-display font-bold uppercase text-sm sm:text-base md:text-lg leading-relaxed tracking-wide text-white/90 max-w-2xl',
        },
        'NINTENDO OWNS ALL COPYRIGHTS AND TRADEMARKS TO ITS RESPECTIVE CHARACTERS, FRANCHISES, AND WORLDS (ALONG WITH SQUARE ENIX, CAPCOM, SEGA, AND KONAMI FOR THEIR RESPECTIVE PROPERTIES). THIS TRIBUTE IS NOT AFFILIATED WITH OR ENDORSED BY NINTENDO.',
      ),
      React.createElement(
        'p',
        {
          className:
            'font-display font-semibold uppercase text-xs sm:text-sm md:text-base leading-relaxed tracking-wider text-white/80 max-w-2xl',
        },
        'ALL STAGE MUSIC IS STREAMED DIRECTLY FROM THEIR OFFICIAL SOUNDCLOUD ARCHIVE (SOUNDCLOUD.COM/SSBU-OST) AND PUBLIC SOUNDCLOUD TRACKS.',
      ),
      React.createElement(
        'p',
        {
          className:
            'font-display font-semibold uppercase text-xs sm:text-sm leading-relaxed tracking-wider text-white/70 max-w-xl',
        },
        'THE FOLLOWING BRAWL CONTAINS EXTREME KNOCKBACK AND DUE TO ITS CONTENT IT SHOULD NOT BE PLAYED BY SORE LOSERS.',
      ),
    ),
    React.createElement(
      'div',
      {
        className:
          'fixed bottom-8 left-0 right-0 flex flex-col items-center gap-3 px-6 pointer-events-none',
      },
      React.createElement(
        'div',
        { className: 'w-48 sm:w-64 h-[2px] bg-white/20 overflow-hidden' },
        React.createElement(motion.div, {
          initial: { scaleX: 0 },
          animate: { scaleX: 1 },
          transition: { duration: AUTO_ADVANCE_MS / 1000, ease: 'linear' },
          style: { transformOrigin: 'left center' },
          className: 'h-full w-full bg-white',
        }),
      ),
      React.createElement(
        'span',
        {
          className:
            'font-mono text-[11px] uppercase tracking-[0.24em] text-white/60 whitespace-nowrap',
        },
        'PRESS ANY KEY OR CLICK TO CONTINUE',
      ),
    ),
  );
}
