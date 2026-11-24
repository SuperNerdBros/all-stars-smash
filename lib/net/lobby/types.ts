// What the Lobby knows about a room, and what a client is shown. Pure types: the Worker and the browser both import them.
// Ported from the zombie-survival play-api and trimmed for a platform fighter.

/** Public rooms are listed and quick-joined; private rooms are reached by code / invite link only. */
export type Visibility = 'public' | 'private';

/** `lobby` = host is in the room screen (character pick); `playing` = a match is running. */
export type RoomPhase = 'lobby' | 'playing';

/** The host's coarse region, as Cloudflare reports it (request.cf.continent), or 'unknown'. */
export type Continent = 'AF' | 'AN' | 'AS' | 'EU' | 'NA' | 'OC' | 'SA' | 'unknown';

/** A phone host is ranked last: it runs the sim on a battery. */
export type HostDevice = 'desktop' | 'phone';

/** The Lobby's row for one room. Never leaves the Lobby whole: continent and seenAt stay inside. */
export interface RoomListing {
  readonly code: string;
  readonly protocol: number;
  readonly visibility: Visibility;
  readonly device: HostDevice;
  readonly continent: Continent;
  /** Human players in the room now (CPUs don't count). */
  readonly seats: number;
  /** Room size the host picked (2..8). */
  readonly maxSeats: number;
  readonly phase: RoomPhase;
  readonly locked: boolean;
  readonly createdAt: number;
  readonly seenAt: number;
}

/** What a client may see of a room. */
export interface RoomCard {
  readonly code: string;
  readonly protocol: number;
  readonly visibility: Visibility;
  readonly seats: number;
  readonly maxSeats: number;
  readonly phase: RoomPhase;
  readonly locked: boolean;
  /** The host's name. Only a private room carries one. */
  readonly hostLabel?: string;
}

/** The JSON body of POST /v1/match (quick join). */
export interface MatchRequest {
  readonly protocol: number;
  readonly avoid?: readonly string[];
  readonly device?: HostDevice;
  /** Room size to use if no room fits and this player becomes the host. */
  readonly maxSeats?: number;
}

export const MAX_AVOID = 5;

export type MatchResult =
  | { readonly kind: 'join'; readonly code: string; readonly card: RoomCard }
  | { readonly kind: 'host'; readonly code: string; readonly hostKey: string }
  | { readonly kind: 'busy' };
