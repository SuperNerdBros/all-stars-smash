'use client';

import React from 'react';
import {
  Check,
  ChevronDown,
  Globe,
  LogIn,
  Radio,
  Swords,
  User,
} from 'lucide-react';
import { BATTLE_MODE_MENU_ATTR, useBattleModeMenu } from '../../hooks/useBattleModeMenu';
import { ROOM_CODE_LENGTH } from '../../net/lobby/room-code';

export interface BattleModeDropdownProps {
  isSolo: boolean;
  onSelectSolo: () => void;
  onSelectVs: () => void;
  onOnlineBattle: () => void;
  onHostBattle: () => void;
  onJoinRoom: (code: string) => void;
}

interface ModeMenuRowProps {
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accentClass: string;
  active?: boolean;
  onClick: () => void;
}

function ModeMenuRow(props: ModeMenuRowProps): React.ReactElement {
  const { label, subtitle, icon: Icon, accentClass, active, onClick } = props;
  const rowBg = active
    ? 'bg-[#1E293B] text-white'
    : 'bg-transparent text-white/90 hover:bg-white/10';

  return React.createElement(
    'button',
    {
      type: 'button',
      role: 'menuitem',
      onClick,
      className: `w-full min-h-[44px] px-3 py-2 flex items-center justify-between gap-2.5 text-left transition-colors cursor-pointer ${rowBg}`,
    },
    React.createElement(
      'span',
      { className: 'flex items-center gap-2.5 min-w-0' },
      React.createElement(
        'span',
        {
          className: `w-8 h-8 shrink-0 flex items-center justify-center border-2 border-black ${accentClass}`,
        },
        React.createElement(Icon, { className: 'w-4 h-4' }),
      ),
      React.createElement(
        'span',
        { className: 'flex flex-col min-w-0' },
        React.createElement(
          'span',
          { className: 'font-display font-black text-xs sm:text-sm uppercase tracking-wide leading-tight' },
          label,
        ),
        React.createElement(
          'span',
          { className: 'text-[11px] text-white/65 leading-tight truncate' },
          subtitle,
        ),
      ),
    ),
    active
      ? React.createElement(Check, { className: 'w-4 h-4 shrink-0 text-[#FACC15] stroke-[3]' })
      : null,
  );
}

interface JoinCodePanelProps {
  code: string;
  error: string | null;
  onChangeCode: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

function JoinCodePanel(props: JoinCodePanelProps): React.ReactElement {
  const { code, error, onChangeCode, onSubmit } = props;

  return React.createElement(
    'form',
    {
      onSubmit,
      className: 'px-3 pb-3 pt-2 bg-[#0F172A] border-t border-white/10 flex flex-col gap-1.5',
    },
    React.createElement(
      'div',
      { className: 'flex items-center gap-1.5' },
      React.createElement('input', {
        type: 'text',
        value: code,
        maxLength: ROOM_CODE_LENGTH,
        placeholder: '5-LETTER CODE',
        autoFocus: true,
        autoCapitalize: 'characters',
        autoComplete: 'off',
        spellCheck: false,
        'aria-label': 'Online room code',
        onChange: (event: React.ChangeEvent<HTMLInputElement>) => onChangeCode(event.target.value),
        className:
          'flex-1 min-w-0 min-h-[40px] px-2.5 bg-black border-2 border-white/25 focus:border-[#FACC15] outline-none font-mono font-black text-sm tracking-[0.22em] text-white uppercase placeholder:text-white/35 placeholder:tracking-normal',
      }),
      React.createElement(
        'button',
        {
          type: 'submit',
          className:
            'min-h-[40px] px-3 bg-[#FACC15] hover:bg-[#FDE047] border-2 border-black font-display font-black text-xs uppercase text-black cursor-pointer shrink-0',
        },
        'Join',
      ),
    ),
    error
      ? React.createElement(
          'p',
          { role: 'alert', className: 'text-[11px] font-semibold text-[#FCA5A5]' },
          error,
        )
      : React.createElement(
          'p',
          { className: 'text-[10px] text-white/55' },
          'Ask the host for their 5-letter room code.',
        ),
  );
}

/**
 * Official Smash-style slanted mode selector dropdown exposing:
 * Solo, VS Battle, Online Battle (quick match), Host Battle, and Join Battle.
 */
export function BattleModeDropdown(props: BattleModeDropdownProps): React.ReactElement {
  const { isSolo } = props;
  const { menu, toggleMenu, selectMode, updateRoomCode, submitJoinCode } = useBattleModeMenu(props);
  const currentLabel = isSolo ? 'Solo' : 'VS Battle';
  const chevronClass = menu.open
    ? 'w-4 h-4 stroke-[3] transition-transform rotate-180'
    : 'w-4 h-4 stroke-[3] transition-transform';

  return React.createElement(
    'div',
    { [BATTLE_MODE_MENU_ATTR]: 'true', className: 'relative z-40' },
    React.createElement(
      'button',
      {
        type: 'button',
        onClick: toggleMenu,
        'aria-haspopup': 'menu',
        'aria-expanded': menu.open,
        title: 'Choose Solo, VS Battle, Online Battle, Host Battle, or Join Battle',
        className:
          'relative -skew-x-12 bg-[#FACC15] hover:bg-[#FDE047] border-[3px] border-black px-4 sm:px-6 py-1 text-black shadow-md cursor-pointer transition-colors',
      },
      React.createElement(
        'span',
        {
          className:
            'skew-x-12 flex items-center gap-2 font-display font-black text-sm sm:text-base tracking-tight whitespace-nowrap',
        },
        React.createElement('span', null, currentLabel),
        React.createElement(ChevronDown, { className: chevronClass }),
      ),
    ),
    menu.open
      ? React.createElement(
          'div',
          {
            role: 'menu',
            'aria-label': 'Battle Mode Menu',
            className:
              'absolute left-0 top-full mt-2 z-50 w-72 max-w-[calc(100vw-2rem)] bg-[#090D18] border-[3px] border-black shadow-[6px_6px_0_0_rgba(0,0,0,0.85)] overflow-hidden',
          },
          React.createElement(
            'div',
            {
              className:
                'px-3 py-1.5 bg-[#111827] border-b-2 border-black flex items-center justify-between',
            },
            React.createElement(
              'span',
              { className: 'font-mono text-[10px] font-black uppercase tracking-widest text-[#FACC15]' },
              'Battle Mode',
            ),
            React.createElement(
              'span',
              { className: 'font-mono text-[10px] uppercase text-white/50' },
              'Local · Online',
            ),
          ),
          React.createElement(
            'div',
            { className: 'py-1' },
            React.createElement(ModeMenuRow, {
              label: 'Solo',
              subtitle: '1P vs CPU Fighter',
              icon: User,
              accentClass: 'bg-[#FACC15] text-black',
              active: isSolo,
              onClick: () => selectMode('solo'),
            }),
            React.createElement(ModeMenuRow, {
              label: 'VS Battle',
              subtitle: '2P Local Versus',
              icon: Swords,
              accentClass: 'bg-[#3B82F6] text-white',
              active: !isSolo,
              onClick: () => selectMode('vs'),
            }),
          ),
          React.createElement('div', { className: 'border-t-2 border-black bg-white/10 h-[2px]' }),
          React.createElement(
            'div',
            { className: 'py-1' },
            React.createElement(ModeMenuRow, {
              label: 'Online Battle',
              subtitle: 'Quick Match · Auto-Join or Host',
              icon: Globe,
              accentClass: 'bg-[#06B6D4] text-black',
              onClick: () => selectMode('online'),
            }),
            React.createElement(ModeMenuRow, {
              label: 'Host Battle',
              subtitle: 'Create Room & Share Code',
              icon: Radio,
              accentClass: 'bg-[#22C55E] text-black',
              onClick: () => selectMode('host'),
            }),
            React.createElement(ModeMenuRow, {
              label: 'Join Battle',
              subtitle: 'Enter a 5-Letter Room Code',
              icon: LogIn,
              accentClass: 'bg-[#F97316] text-black',
              active: menu.joinExpanded,
              onClick: () => selectMode('join'),
            }),
          ),
          menu.joinExpanded
            ? React.createElement(JoinCodePanel, {
                code: menu.roomCode,
                error: menu.joinError,
                onChangeCode: updateRoomCode,
                onSubmit: submitJoinCode,
              })
            : null,
        )
      : null,
  );
}
