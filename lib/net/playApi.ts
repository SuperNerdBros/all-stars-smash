// The browser's side of play-api (ported from zombie-survival src/network/play-api.ts).
import type { CreateRoomRequest, CreateRoomResult } from './lobby/lobby-http';
import { normalizeRoomCode } from './lobby/room-code';
import type { MatchRequest, MatchResult, RoomCard } from './lobby/types';

/** The API origin without a trailing slash. Override with NEXT_PUBLIC_PLAY_API (e.g. a local `cf dev`). */
export const PLAY_API: string = (process.env.NEXT_PUBLIC_PLAY_API || 'https://smash-api.forthexp.com').replace(/\/+$/, '');

export const API_TIMEOUT_MS = 10_000;
const OFFLINE = 'Could not reach the online rooms. Check your connection.';

/** The socket URL for a path on the API: https becomes wss. */
export function socketUrl(path: string, api: string = PLAY_API): string {
  const url = new URL(path, `${api}/`);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
}

async function call(url: string, init?: RequestInit): Promise<Response | null> {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(API_TIMEOUT_MS) });
  } catch {
    return null;
  }
}

export type Created = { ok: true; room: CreateRoomResult } | { ok: false; reason: string };

export async function createRoom(request: CreateRoomRequest, api: string = PLAY_API): Promise<Created> {
  const response = await call(`${api}/v1/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response) return { ok: false, reason: OFFLINE };
  if (response.status === 429) return { ok: false, reason: 'You have opened too many rooms. Wait a while and try again.' };
  if (!response.ok) return { ok: false, reason: 'The online rooms are busy. Try again in a moment.' };
  try {
    return { ok: true, room: (await response.json()) as CreateRoomResult };
  } catch {
    return { ok: false, reason: 'The online rooms are busy. Try again in a moment.' };
  }
}

export type Lookup = { ok: true; card: RoomCard } | { ok: false; reason: string };

const LOOKUP_TEXT: Readonly<Record<number, string>> = {
  400: 'That is not a room code.',
  404: 'No room has that code. Check the letters.',
  410: 'That room has closed.',
  429: 'Too many tries. Wait a moment and try again.',
};

export async function lookupRoom(code: string, api: string = PLAY_API): Promise<Lookup> {
  const response = await call(`${api}/v1/rooms/${encodeURIComponent(code)}`);
  if (!response) return { ok: false, reason: OFFLINE };
  if (response.ok) return { ok: true, card: (await response.json()) as RoomCard };
  return { ok: false, reason: LOOKUP_TEXT[response.status] ?? OFFLINE };
}

export type Matched = { ok: true; match: Exclude<MatchResult, { kind: 'busy' }> } | { ok: false; reason: string };

/** Quick join: joins the best open public room, or makes this player the host of a new one. */
export async function matchRoom(request: MatchRequest, api: string = PLAY_API): Promise<Matched> {
  const response = await call(`${api}/v1/match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response) return { ok: false, reason: OFFLINE };
  if (response.status === 429) return { ok: false, reason: 'Too many searches. Wait a moment and try again.' };
  const busy = { ok: false, reason: 'The online rooms are busy. Try again in a moment.' } as const;
  if (!response.ok) return busy;
  try {
    const raw = (await response.json()) as Record<string, unknown>;
    const isCode = (v: unknown): v is string => typeof v === 'string' && normalizeRoomCode(v).ok;
    if (raw.kind === 'join' && isCode(raw.code)) return { ok: true, match: { kind: 'join', code: raw.code, card: raw.card as RoomCard } };
    if (raw.kind === 'host' && isCode(raw.code) && typeof raw.hostKey === 'string') {
      return { ok: true, match: { kind: 'host', code: raw.code, hostKey: raw.hostKey } };
    }
    return busy;
  } catch {
    return busy;
  }
}

export async function listRooms(protocol: number, api: string = PLAY_API): Promise<RoomCard[]> {
  const response = await call(`${api}/v1/rooms?protocol=${protocol}`);
  if (!response?.ok) return [];
  try {
    return (await response.json()) as RoomCard[];
  } catch {
    return [];
  }
}

/** `?join=CODE` from the current URL, normalized, or null. */
export function joinCodeFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = new URLSearchParams(window.location.search).get('join');
  if (!raw) return null;
  const check = normalizeRoomCode(raw);
  return check.ok ? check.code : null;
}

export function inviteLink(code: string): string {
  if (typeof window === 'undefined') return `https://smash.forthexp.com/?join=${code}`;
  return `${window.location.origin}${window.location.pathname}?join=${code}`;
}
