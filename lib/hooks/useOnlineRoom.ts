'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { FighterBlueprint, GraphicsEra } from '../types/fighter';
import type { MatchConfig } from '../types/protocol';
import { getStageById } from '../stages/manifests';
import { NetRoom, type RoomView } from '../net/netRoom';
import { normalizeRoomCode } from '../net/lobby/room-code';
import { BUILTIN_FIGHTERS } from '../roster/registry';

const NAME_KEY = 'all-stars.playerName';

function playerName(): string {
  try {
    const saved = window.localStorage.getItem(NAME_KEY);
    if (saved) return saved;
    const made = `Player${Math.floor(100 + Math.random() * 900)}`;
    window.localStorage.setItem(NAME_KEY, made);
    return made;
  } catch {
    return 'Player';
  }
}

/** Owns the current online room (if any) and exposes host / join / quick-join / leave. */
export function useOnlineRoom(matchConfig: MatchConfig, era: GraphicsEra) {
  const [room, setRoom] = useState<NetRoom | null>(null);
  const [view, setView] = useState<RoomView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const eraRef = useRef(era);
  /** The one live room. Anything else still calling back is stale and ignored. */
  const roomRef = useRef<NetRoom | null>(null);
  useEffect(() => {
    eraRef.current = era;
  }, [era]);

  // Online play only uses built-in fighters: every peer has them, so seats travel as ids.
  const deps = useCallback(
    () => ({
      roster: BUILTIN_FIGHTERS as readonly FighterBlueprint[],
      getStage: getStageById,
      era: () => eraRef.current,
      onChange: (v: RoomView, from: NetRoom) => {
        if (roomRef.current === null || from === roomRef.current) setView(v);
      },
    }),
    [],
  );

  const pick = () => {
    const me = matchConfig.players[0];
    const known = BUILTIN_FIGHTERS.some((f) => f.id === me.fighterId);
    return { fighterId: known ? me.fighterId : BUILTIN_FIGHTERS[0].id, paletteIndex: me.paletteIndex };
  };

  /** Makes `r` the live room, closing any previous one. */
  const adopt = (r: NetRoom | null) => {
    const prev = roomRef.current;
    if (prev && prev !== r) prev.leave();
    roomRef.current = r;
    setRoom(r);
    setView(r ? r.current : null);
    return r;
  };
  const live = () => {
    const r = roomRef.current;
    return r && r.current.status !== 'closed' ? r : null;
  };

  const host = () => {
    setError(null);
    // Double-clicks / a stray Enter must not open a second room.
    const existing = live();
    if (existing && existing.current.role === 'host') return existing;
    const r = NetRoom.host(deps(), {
      name: playerName(),
      ...pick(),
      roomSize: Math.max(4, matchConfig.players.length),
      visibility: 'public',
      cpuDifficulty: matchConfig.players.find((p) => p.controlType === 'cpu')?.cpuDifficulty ?? 'normal',
      stageId: matchConfig.stageId,
      stocks: matchConfig.stocks,
    });
    return adopt(r);
  };

  /** Empty code = quick join (public room near you, or host a new one). */
  const join = async (code: string) => {
    setError(null);
    const existing = live();
    if (existing && existing.current.role === 'guest' && (!code || existing.current.code === code.toUpperCase())) return existing;
    if (!code) {
      const r = await NetRoom.quickJoin(deps(), {
        name: playerName(),
        ...pick(),
        roomSize: 4,
        visibility: 'public',
        cpuDifficulty: 'normal',
        stageId: matchConfig.stageId,
        stocks: matchConfig.stocks,
      });
      return adopt(r);
    }
    const check = normalizeRoomCode(code);
    if (!check.ok) {
      setError(check.reason);
      return null;
    }
    const r = NetRoom.join(deps(), check.code, { name: playerName(), ...pick() });
    return adopt(r);
  };

  const leave = () => {
    adopt(null);
    if (typeof window !== 'undefined' && window.location.search.includes('join=')) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  // Leaving the page closes the room.
  useEffect(() => () => roomRef.current?.leave(), []);

  return { room, view, error, host, join, leave };
}
