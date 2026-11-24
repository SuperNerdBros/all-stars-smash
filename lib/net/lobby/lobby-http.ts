// The JSON bodies of the Lobby's HTTP API (/v1), and their runtime guards. The Worker and the browser both import them.
import { MAX_FIGHTERS, MIN_FIGHTERS } from '../../types/seats.ts';
import { normalizeRoomCode } from './room-code.ts';
import { MAX_AVOID, type HostDevice, type MatchRequest, type Visibility } from './types.ts';

/** A request body larger than this is refused before it is parsed. */
export const LOBBY_BODY_MAX_BYTES = 4096;
const PROTOCOL_MAX = 9999;
export const NAME_MAX_LENGTH = 12;

/** The JSON body of POST /v1/rooms. */
export interface CreateRoomRequest {
  readonly protocol: number;
  readonly visibility: Visibility;
  readonly device: HostDevice;
  readonly maxSeats: number;
  /** The host's name, shown on a private room's card. A public room never carries one. */
  readonly label?: string;
}

/** The answer to POST /v1/rooms. The hostKey is sent once, here, and never appears in a URL. */
export interface CreateRoomResult {
  readonly code: string;
  readonly hostKey: string;
}

type Raw = Record<string, unknown>;

const isRaw = (value: unknown): value is Raw => typeof value === 'object' && value !== null && !Array.isArray(value);
const isWhole = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;

export const isProtocol = (value: unknown): value is number => isWhole(value, 1, PROTOCOL_MAX);
export const isVisibility = (value: unknown): value is Visibility => value === 'public' || value === 'private';
export const isHostDevice = (value: unknown): value is HostDevice => value === 'desktop' || value === 'phone';
export const isSeatCount = (value: unknown): value is number => isWhole(value, MIN_FIGHTERS, MAX_FIGHTERS);

/** Player names: control characters stripped, trimmed, capped. */
export function cleanName(raw: string): string {
  return [...raw.replace(/[\u0000-\u001f\u007f-\u009f]/g, '').trim()].slice(0, NAME_MAX_LENGTH).join('');
}

export function parseCreateRoom(value: unknown): CreateRoomRequest | null {
  if (!isRaw(value)) return null;
  const { protocol, visibility, device, maxSeats, label } = value;
  const isBadShape = !isProtocol(protocol) || !isVisibility(visibility) || !isHostDevice(device) || !isSeatCount(maxSeats);
  if (isBadShape) return null;
  const isBadLabel = label !== undefined && typeof label !== 'string';
  if (isBadLabel) return null;
  const base = { protocol, visibility, device, maxSeats };
  const cleaned = visibility === 'private' && label ? cleanName(label) : '';
  return cleaned ? { ...base, label: cleaned } : base;
}

/** Codes in `avoid` that are not room codes are dropped, not refused. */
export function parseMatchRequest(value: unknown): MatchRequest | null {
  if (!isRaw(value)) return null;
  const { protocol, avoid, device, maxSeats } = value;
  if (!isProtocol(protocol)) return null;
  const isBadDevice = device !== undefined && !isHostDevice(device);
  if (isBadDevice) return null;
  const isBadSeats = maxSeats !== undefined && !isSeatCount(maxSeats);
  if (isBadSeats) return null;
  const isBadAvoidList = avoid !== undefined && (!Array.isArray(avoid) || avoid.length > MAX_AVOID);
  if (isBadAvoidList) return null;
  const codes = (avoid ?? []).flatMap((raw: unknown) => {
    const check = normalizeRoomCode(raw);
    return check.ok ? [check.code] : [];
  });
  return {
    protocol,
    ...(codes.length ? { avoid: codes } : {}),
    ...(device === undefined ? {} : { device }),
    ...(maxSeats === undefined ? {} : { maxSeats }),
  };
}
