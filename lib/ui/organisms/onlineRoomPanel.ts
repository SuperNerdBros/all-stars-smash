'use client';

import React, { useState } from 'react';
import { Bot, Copy, LogOut, Minus, Play, Plus, User, Users, Wifi, X } from 'lucide-react';
import type { RoomView, NetRoom } from '../../net/netRoom';
import type { NetStats } from '../../net/netTypes';
import { inviteLink } from '../../net/playApi';
import { MAX_FIGHTERS, MIN_FIGHTERS } from '../../types/protocol';
import { chiptuneAudio } from '../../io/chiptuneAudio';

export interface OnlineRoomPanelProps {
  room: NetRoom;
  view: RoomView;
  matchOver: boolean;
  net?: NetStats;
  onLeave: () => void;
}

const INK = '#0B0B0F';

function statusLine(view: RoomView): string {
  if (view.error) return view.error;
  if (view.role === 'guest') {
    if (view.status === 'joining') return `Joining ${view.code ?? ''}…`;
    if (view.status === 'closed') return 'Disconnected.';
    return 'Connected. You take over a CPU in a moment.';
  }
  if (!view.code) return 'Opening your room…';
  return 'Room open: share the code. Friends take over CPU seats.';
}

function SeatRow(p: { seat: RoomView['seats'][number]; canKick: boolean; onKick: () => void }): React.ReactElement {
  const { seat } = p;
  const Icon = seat.controlType === 'cpu' ? Bot : User;
  return React.createElement(
    'li',
    { className: 'flex items-center gap-2 px-2 py-1 bg-black/35 border-2', style: { borderColor: seat.isYou ? '#FACC15' : '#1F2937' } },
    React.createElement('span', { className: 'font-mono text-[10px] text-white/50 w-6' }, `P${seat.seat + 1}`),
    React.createElement(Icon, { className: `w-3.5 h-3.5 ${seat.controlType === 'cpu' ? 'text-white/50' : 'text-[#22C55E]'}` }),
    React.createElement('span', { className: 'flex-1 truncate text-xs font-bold text-white' }, `${seat.name}${seat.isYou ? ' (you)' : ''}`),
    p.canKick
      ? React.createElement(
          'button',
          {
            type: 'button',
            title: 'Kick this CPU',
            onClick: p.onKick,
            className: 'p-0.5 bg-[#7F1D1D] hover:bg-[#B91C1C] border border-black text-white cursor-pointer',
          },
          React.createElement(X, { className: 'w-3 h-3' }),
        )
      : null,
  );
}

/** Floating room panel over an online match. */
export function OnlineRoomPanel(props: OnlineRoomPanelProps): React.ReactElement {
  const { room, view, matchOver, net, onLeave } = props;
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const isHost = view.role === 'host';
  const humans = view.seats.filter((s) => s.controlType === 'human').length;

  const copy = async () => {
    if (!view.code) return;
    try {
      await navigator.clipboard.writeText(inviteLink(view.code));
      setCopied(true);
      chiptuneAudio.playMenuConfirm();
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt('Copy this invite link:', inviteLink(view.code));
    }
  };

  if (!open) {
    return React.createElement(
      'button',
      {
        type: 'button',
        onClick: () => setOpen(true),
        className: 'fixed top-16 right-3 z-20 flex items-center gap-2 px-3 py-1.5 bg-[#2563EB] border-[3px] font-display font-black uppercase text-xs text-white shadow-[4px_4px_0_#0B0B0F] cursor-pointer',
        style: { borderColor: INK },
      },
      React.createElement(Users, { className: 'w-4 h-4' }),
      `${view.code ?? '…'} · ${humans}/${view.roomSize}`,
    );
  }

  return React.createElement(
    'aside',
    {
      className: 'fixed top-16 right-3 z-20 w-72 max-w-[calc(100vw-24px)] bg-[#111827]/95 border-[3px] shadow-[6px_6px_0_#0B0B0F] text-white',
      style: { borderColor: INK },
    },
    // Header
    React.createElement(
      'div',
      { className: 'flex items-center justify-between px-3 py-2 bg-[#2563EB] border-b-[3px]', style: { borderColor: INK } },
      React.createElement(
        'div',
        { className: 'flex items-center gap-2 font-display font-black uppercase text-sm' },
        React.createElement(Wifi, { className: 'w-4 h-4 text-[#FDE047]' }),
        isHost ? 'Your Room' : 'Online Room',
      ),
      React.createElement(
        'button',
        { type: 'button', onClick: () => setOpen(false), 'aria-label': 'Minimize room panel', className: 'p-1 bg-black/40 hover:bg-black/70 border border-black cursor-pointer' },
        React.createElement(Minus, { className: 'w-3 h-3' }),
      ),
    ),
    React.createElement(
      'div',
      { className: 'p-3 flex flex-col gap-3' },
      // Code + invite
      React.createElement(
        'div',
        { className: 'flex items-center gap-2' },
        React.createElement(
          'div',
          { className: 'flex-1 text-center font-mono font-black text-2xl tracking-[0.3em] text-[#FDE047] bg-black/50 border-2 py-1', style: { borderColor: INK } },
          view.code ?? '·····',
        ),
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: copy,
            disabled: !view.code,
            title: 'Copy invite link',
            className: 'flex items-center gap-1 px-2 py-2 bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-40 border-2 font-display font-black uppercase text-[10px] cursor-pointer',
            style: { borderColor: INK },
          },
          React.createElement(Copy, { className: 'w-3.5 h-3.5' }),
          copied ? 'Copied!' : 'Invite',
        ),
      ),
      React.createElement('p', { className: `text-[11px] leading-snug ${view.error ? 'text-[#FCA5A5]' : 'text-white/70'}` }, statusLine(view)),

      // Room size (host)
      isHost
        ? React.createElement(
            'div',
            { className: 'flex items-center justify-between gap-2' },
            React.createElement('span', { className: 'font-display font-black uppercase text-xs' }, 'Room size'),
            React.createElement(
              'div',
              { className: 'flex items-center gap-1' },
              React.createElement(
                'button',
                { type: 'button', onClick: () => room.setRoomSize(view.roomSize - 1), disabled: view.roomSize <= Math.max(MIN_FIGHTERS, humans), className: 'p-1 bg-black/50 border border-black disabled:opacity-30 cursor-pointer', 'aria-label': 'Smaller room' },
                React.createElement(Minus, { className: 'w-3 h-3' }),
              ),
              React.createElement('span', { className: 'w-6 text-center font-mono font-black' }, String(view.roomSize)),
              React.createElement(
                'button',
                { type: 'button', onClick: () => room.setRoomSize(view.roomSize + 1), disabled: view.roomSize >= MAX_FIGHTERS, className: 'p-1 bg-black/50 border border-black disabled:opacity-30 cursor-pointer', 'aria-label': 'Bigger room' },
                React.createElement(Plus, { className: 'w-3 h-3' }),
              ),
            ),
          )
        : null,
      isHost && view.setup && view.roomSize !== view.setup.fighterIds.length
        ? React.createElement('p', { className: 'text-[10px] text-[#FDE047]/80 -mt-2' }, 'New size applies next match.')
        : null,

      // Seats
      React.createElement(
        'ul',
        { className: 'flex flex-col gap-1 max-h-56 overflow-y-auto' },
        ...view.seats.map((seat) =>
          React.createElement(SeatRow, {
            key: seat.seat,
            seat,
            canKick: isHost && seat.controlType === 'cpu' && !matchOver,
            onKick: () => room.kickCpu(seat.seat),
          }),
        ),
      ),

      // Actions
      React.createElement(
        'div',
        { className: 'flex gap-2' },
        isHost
          ? React.createElement(
              'button',
              {
                type: 'button',
                onClick: () => room.nextMatch(),
                className: `flex-1 flex items-center justify-center gap-1 px-2 py-2 border-2 font-display font-black uppercase text-xs cursor-pointer ${matchOver ? 'bg-[#22C55E] hover:bg-[#16A34A] animate-pulse' : 'bg-[#374151] hover:bg-[#4B5563]'}`,
                style: { borderColor: INK },
              },
              React.createElement(Play, { className: 'w-3.5 h-3.5' }),
              matchOver ? 'Next match' : 'Restart',
            )
          : React.createElement(
              'div',
              { className: 'flex-1 text-center text-[11px] text-white/60 py-2' },
              matchOver ? 'Waiting for the host to start the next match…' : '',
            ),
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: onLeave,
            className: 'flex items-center gap-1 px-2 py-2 bg-[#7F1D1D] hover:bg-[#B91C1C] border-2 font-display font-black uppercase text-xs cursor-pointer',
            style: { borderColor: INK },
          },
          React.createElement(LogOut, { className: 'w-3.5 h-3.5' }),
          'Leave',
        ),
      ),
      net
        ? React.createElement(
            'p',
            { className: 'font-mono text-[9px] text-white/40' },
            `frame ${net.frame} · confirmed ${net.confirmed} · rollbacks ${net.rollbacks}`,
          )
        : null,
    ),
  );
}
