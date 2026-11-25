'use client';

import { useEffect, useState } from 'react';
import type React from 'react';
import { chiptuneAudio } from '../io/chiptuneAudio';
import { normalizeRoomCode } from '../net/lobby/room-code';

export const BATTLE_MODE_MENU_ATTR = 'data-battle-mode-menu';

export type BattleModeAction = 'solo' | 'vs' | 'online' | 'host' | 'join';

export interface BattleModeMenuState {
  open: boolean;
  joinExpanded: boolean;
  roomCode: string;
  joinError: string | null;
}

const INITIAL_MENU_STATE: BattleModeMenuState = {
  open: false,
  joinExpanded: false,
  roomCode: '',
  joinError: null,
};

export interface BattleModeMenuHandlers {
  onSelectSolo: () => void;
  onSelectVs: () => void;
  onOnlineBattle: () => void;
  onHostBattle: () => void;
  onJoinRoom: (code: string) => void;
}

export function useBattleModeMenu(handlers: BattleModeMenuHandlers) {
  const [menu, setMenu] = useState<BattleModeMenuState>(INITIAL_MENU_STATE);

  useEffect(() => {
    const isMenuClosed = !menu.open;
    if (isMenuClosed) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const isOutsideMenu = !target?.closest(`[${BATTLE_MODE_MENU_ATTR}]`);
      if (isOutsideMenu) {
        setMenu((prev) => ({ ...prev, open: false, joinExpanded: false, joinError: null }));
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const isEscapeKey = event.key === 'Escape';
      if (isEscapeKey) {
        setMenu((prev) => ({ ...prev, open: false, joinExpanded: false, joinError: null }));
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [menu.open]);

  const closeMenu = () => {
    setMenu((prev) => ({ ...prev, open: false, joinExpanded: false, joinError: null }));
  };

  const toggleMenu = () => {
    chiptuneAudio.playMenuTick();
    if (menu.open) {
      closeMenu();
    } else {
      setMenu((prev) => ({ ...prev, open: true }));
    }
  };

  const modeDispatch: Record<BattleModeAction, () => void> = {
    solo: () => {
      chiptuneAudio.playMenuTick();
      handlers.onSelectSolo();
      closeMenu();
    },
    vs: () => {
      chiptuneAudio.playMenuTick();
      handlers.onSelectVs();
      closeMenu();
    },
    online: () => {
      chiptuneAudio.playMenuConfirm();
      closeMenu();
      handlers.onOnlineBattle();
    },
    host: () => {
      chiptuneAudio.playMenuConfirm();
      closeMenu();
      handlers.onHostBattle();
    },
    join: () => {
      chiptuneAudio.playMenuTick();
      setMenu((prev) => ({ ...prev, joinExpanded: !prev.joinExpanded, joinError: null }));
    },
  };

  const selectMode = (mode: BattleModeAction) => {
    modeDispatch[mode]();
  };

  const updateRoomCode = (raw: string) => {
    const cleaned = raw.toUpperCase().replace(/[^A-Z]/g, '');
    setMenu((prev) => ({ ...prev, roomCode: cleaned, joinError: null }));
  };

  const submitJoinCode = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const check = normalizeRoomCode(menu.roomCode);
    if (check.ok) {
      chiptuneAudio.playMenuConfirm();
      setMenu(INITIAL_MENU_STATE);
      handlers.onJoinRoom(check.code);
    } else {
      setMenu((prev) => ({ ...prev, joinError: check.reason }));
    }
  };

  return { menu, toggleMenu, selectMode, updateRoomCode, submitJoinCode };
}
