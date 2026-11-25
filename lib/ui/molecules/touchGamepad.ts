'use client';

import React from 'react';
import {
  ArrowUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Crosshair,
  Flame,
  Hand,
  RefreshCw,
  Shield,
  Swords,
  X,
  Zap,
} from 'lucide-react';
import {
  INPUT_ATTACK,
  INPUT_DOWN,
  INPUT_GRAB,
  INPUT_JUMP,
  INPUT_LEFT,
  INPUT_RIGHT,
  INPUT_SHIELD,
  INPUT_SMASH,
  INPUT_SPECIAL,
  INPUT_UP,
} from '../../types/protocol';
import {
  useTouchGamepadState,
  type ActionButtonHandlers,
  type DpadHandlers,
  type StickOffset,
} from '../../hooks/useTouchGamepadState';

export interface TouchGamepadProps {
  lockedTargetName: string | null;
  hasLivingOpponents: boolean;
  onMaskChange: (mask: number) => void;
  onCycleTarget: () => void;
  onClearTarget: () => void;
}

interface ActionPadSpec {
  readonly id: string;
  readonly label: string;
  readonly shortKey: string;
  readonly mask: number;
  readonly activeClasses: string;
  readonly idleClasses: string;
  readonly sizeClasses: string;
  readonly icon: React.ReactElement;
}

const DIAMOND_BUTTONS: ReadonlyArray<ActionPadSpec> = [
  {
    id: 'jump',
    label: 'Jump',
    shortKey: 'Jump',
    mask: INPUT_JUMP,
    sizeClasses: 'w-12 h-12 sm:w-16 sm:h-16',
    idleClasses: 'bg-[#059669]/80 border-[#6EE7B7]/85 text-white',
    activeClasses: 'bg-[#10B981] border-white text-[#052E16]',
    icon: React.createElement(ArrowUp, { className: 'w-4 h-4 sm:w-5 sm:h-5 stroke-[2.75]' }),
  },
  {
    id: 'smash',
    label: 'Smash Attack',
    shortKey: 'Smash',
    mask: INPUT_SMASH,
    sizeClasses: 'w-12 h-12 sm:w-16 sm:h-16',
    idleClasses: 'bg-[#D97706]/82 border-[#FDE047]/85 text-white',
    activeClasses: 'bg-[#FACC15] border-white text-[#0B1020]',
    icon: React.createElement(Flame, { className: 'w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]' }),
  },
  {
    id: 'special',
    label: 'Special Move',
    shortKey: 'Spec',
    mask: INPUT_SPECIAL,
    sizeClasses: 'w-12 h-12 sm:w-16 sm:h-16',
    idleClasses: 'bg-[#0284C7]/82 border-[#7DD3FC]/85 text-white',
    activeClasses: 'bg-[#38BDF8] border-white text-[#082F49]',
    icon: React.createElement(Zap, { className: 'w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]' }),
  },
  {
    id: 'attack',
    label: 'Attack',
    shortKey: 'Attack',
    mask: INPUT_ATTACK,
    sizeClasses: 'w-14 h-14 sm:w-[70px] sm:h-[70px]',
    idleClasses: 'bg-[#DC2626]/88 border-[#FCA5A5]/90 text-white',
    activeClasses: 'bg-[#EF4444] border-white text-white',
    icon: React.createElement(Swords, { className: 'w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]' }),
  },
];

function renderLockControls(
  lockedTargetName: string | null,
  hasLivingOpponents: boolean,
  onCycleTarget: () => void,
  onClearTarget: () => void,
): React.ReactElement {
  const isLocked = lockedTargetName !== null;
  return React.createElement(
    'div',
    {
      className:
        'flex items-center gap-1 bg-[#090E1C]/84 backdrop-blur-sm border border-white/15 rounded-lg p-1 shadow-[0_6px_16px_rgba(0,0,0,0.55)]',
    },
    React.createElement(
      'button',
      {
        type: 'button',
        disabled: !hasLivingOpponents,
        onClick: onCycleTarget,
        className: [
          'min-h-[38px] px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer touch-manipulation',
          isLocked ? 'bg-[#FACC15] text-[#090E1C]' : 'bg-[#1E293B] text-white hover:bg-[#334155]',
          !hasLivingOpponents ? 'opacity-40 cursor-not-allowed' : '',
        ].join(' '),
      },
      React.createElement(Crosshair, { className: 'w-3.5 h-3.5 shrink-0' }),
      React.createElement(
        'span',
        { className: 'max-w-[88px] truncate' },
        isLocked ? lockedTargetName : 'Auto-Lock',
      ),
      isLocked ? React.createElement(RefreshCw, { className: 'w-3 h-3 shrink-0 opacity-80' }) : null,
    ),
    isLocked
      ? React.createElement(
          'button',
          {
            type: 'button',
            onClick: onClearTarget,
            'aria-label': 'Turn off auto-target lock',
            title: 'Unlock Target',
            className:
              'min-w-[38px] min-h-[38px] rounded-md bg-white/10 hover:bg-white/20 text-[#E2E8F0] flex items-center justify-center cursor-pointer touch-manipulation',
          },
          React.createElement(X, { className: 'w-4 h-4' }),
        )
      : null,
  );
}

function renderDpadDisc(
  dpadZoneRef: React.RefObject<HTMLDivElement | null>,
  dpadHandlers: DpadHandlers,
  pressedMask: number,
  stickOffset: StickOffset,
  dpadActive: boolean,
  isLocked: boolean,
): React.ReactElement {
  const upActive = (pressedMask & INPUT_UP) !== 0;
  const downActive = (pressedMask & INPUT_DOWN) !== 0;
  const leftActive = (pressedMask & INPUT_LEFT) !== 0;
  const rightActive = (pressedMask & INPUT_RIGHT) !== 0;

  return React.createElement(
    'div',
    {
      ref: dpadZoneRef,
      role: 'application',
      'aria-label': 'Movement D-Pad',
      ...dpadHandlers,
      className: [
        'relative w-28 h-28 sm:w-36 sm:h-36 rounded-full touch-none select-none border-2 backdrop-blur-xs flex items-center justify-center transition-opacity shadow-[0_8px_22px_rgba(0,0,0,0.55)]',
        isLocked
          ? 'bg-[#090E1C]/58 border-[#FACC15]/45 opacity-80'
          : 'bg-[#090E1C]/78 border-white/22 opacity-100',
      ].join(' '),
    },
    React.createElement(ChevronUp, {
      className: `absolute top-2 w-4 h-4 sm:w-5 sm:h-5 transition-colors ${upActive ? 'text-[#FACC15]' : 'text-white/45'}`,
    }),
    React.createElement(ChevronDown, {
      className: `absolute bottom-2 w-4 h-4 sm:w-5 sm:h-5 transition-colors ${downActive ? 'text-[#FACC15]' : 'text-white/45'}`,
    }),
    React.createElement(ChevronLeft, {
      className: `absolute left-2 w-4 h-4 sm:w-5 sm:h-5 transition-colors ${leftActive ? 'text-[#FACC15]' : 'text-white/45'}`,
    }),
    React.createElement(ChevronRight, {
      className: `absolute right-2 w-4 h-4 sm:w-5 sm:h-5 transition-colors ${rightActive ? 'text-[#FACC15]' : 'text-white/45'}`,
    }),
    React.createElement('div', {
      className: [
        'w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 shadow-inner transition-colors pointer-events-none',
        dpadActive ? 'bg-[#FACC15]/90 border-white' : 'bg-[#1E293B]/90 border-white/35',
      ].join(' '),
      style: { transform: `translate3d(${stickOffset.x}px, ${stickOffset.y}px, 0)` },
    }),
  );
}

function renderActionButton(
  spec: ActionPadSpec,
  pressedMask: number,
  bindActionButton: (bitMask: number) => ActionButtonHandlers,
): React.ReactElement {
  const isPressed = (pressedMask & spec.mask) !== 0;
  return React.createElement(
    'button',
    {
      key: spec.id,
      type: 'button',
      'aria-label': spec.label,
      ...bindActionButton(spec.mask),
      className: [
        'touch-none select-none rounded-full border-2 flex flex-col items-center justify-center transition-transform duration-75 shadow-[0_6px_16px_rgba(0,0,0,0.55)] backdrop-blur-xs',
        spec.sizeClasses,
        isPressed ? `${spec.activeClasses} scale-92` : spec.idleClasses,
      ].join(' '),
    },
    spec.icon,
    React.createElement(
      'span',
      { className: 'font-display font-black text-[9px] sm:text-[10px] leading-none uppercase tracking-wider mt-0.5' },
      spec.shortKey,
    ),
  );
}

export function TouchGamepad(props: TouchGamepadProps): React.ReactElement {
  const { lockedTargetName, hasLivingOpponents, onMaskChange, onCycleTarget, onClearTarget } = props;
  const pad = useTouchGamepadState(onMaskChange);
  const { pressedMask, stickOffset, dpadActive } = pad.view;
  const shieldPressed = (pressedMask & INPUT_SHIELD) !== 0;
  const grabPressed = (pressedMask & INPUT_GRAB) !== 0;
  const isLocked = lockedTargetName !== null;

  return React.createElement(
    'div',
    {
      className:
        'pointer-events-none fixed inset-x-0 bottom-[78px] sm:bottom-24 z-20 flex items-end justify-between px-2.5 sm:px-6',
    },
    React.createElement(
      'div',
      { className: 'pointer-events-auto flex flex-col items-start gap-2' },
      renderLockControls(lockedTargetName, hasLivingOpponents, onCycleTarget, onClearTarget),
      renderDpadDisc(pad.dpadZoneRef, pad.dpadHandlers, pressedMask, stickOffset, dpadActive, isLocked),
    ),
    React.createElement(
      'div',
      { className: 'pointer-events-auto flex flex-col items-end gap-2' },
      React.createElement(
        'div',
        { className: 'flex items-center gap-1.5 sm:gap-2' },
        React.createElement(
          'button',
          {
            type: 'button',
            'aria-label': 'Shield',
            ...pad.bindActionButton(INPUT_SHIELD),
            className: [
              'touch-none select-none min-h-[40px] sm:min-h-[44px] px-2.5 sm:px-3.5 rounded-full border-2 flex items-center gap-1 text-[11px] sm:text-xs font-bold uppercase tracking-wide backdrop-blur-xs transition-transform duration-75 shadow-[0_4px_12px_rgba(0,0,0,0.5)]',
              shieldPressed
                ? 'bg-[#A855F7] border-white text-white scale-95'
                : 'bg-[#1E1B4B]/82 border-[#C084FC]/70 text-[#E9D5FF]',
            ].join(' '),
          },
          React.createElement(Shield, { className: 'w-3.5 h-3.5 sm:w-4 sm:h-4' }),
          'Shield',
        ),
        React.createElement(
          'button',
          {
            type: 'button',
            'aria-label': 'Grab',
            ...pad.bindActionButton(INPUT_GRAB),
            className: [
              'touch-none select-none min-h-[40px] sm:min-h-[44px] px-2.5 sm:px-3.5 rounded-full border-2 flex items-center gap-1 text-[11px] sm:text-xs font-bold uppercase tracking-wide backdrop-blur-xs transition-transform duration-75 shadow-[0_4px_12px_rgba(0,0,0,0.5)]',
              grabPressed
                ? 'bg-[#F97316] border-white text-white scale-95'
                : 'bg-[#29150A]/82 border-[#FDBA74]/70 text-[#FFEDD5]',
            ].join(' '),
          },
          React.createElement(Hand, { className: 'w-3.5 h-3.5 sm:w-4 sm:h-4' }),
          'Grab',
        ),
      ),
      React.createElement(
        'div',
        { className: 'grid grid-cols-3 grid-rows-3 items-center justify-items-center gap-0.5 sm:gap-1 w-[156px] h-[156px] sm:w-[196px] sm:h-[196px]' },
        React.createElement('div', { className: 'col-start-2 row-start-1' }, renderActionButton(DIAMOND_BUTTONS[0], pressedMask, pad.bindActionButton)),
        React.createElement('div', { className: 'col-start-1 row-start-2' }, renderActionButton(DIAMOND_BUTTONS[1], pressedMask, pad.bindActionButton)),
        React.createElement('div', { className: 'col-start-3 row-start-2' }, renderActionButton(DIAMOND_BUTTONS[2], pressedMask, pad.bindActionButton)),
        React.createElement('div', { className: 'col-start-2 row-start-3' }, renderActionButton(DIAMOND_BUTTONS[3], pressedMask, pad.bindActionButton)),
      ),
    ),
  );
}
