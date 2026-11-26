// Main-thread orchestration of one online room. The simulation (and its rollback session) lives in the
// game worker; this class moves packets between that worker and the WebRTC links.
//
// Host: owns the room code, seats guests into CPU slots, relays every player's inputs to every guest,
//       schedules seat changes (join / leave / kick) as frame-stamped events, publishes checksums,
//       and resyncs any guest that reports a desync.
// Guest: one link to the host; starts from the host's snapshot, sends its inputs, applies the rest.
import type { EngineWorkerBridge, NetInMessage, NetOutMessage } from '../engine/workerBridge';
import type { FighterBlueprint, GraphicsEra } from '../types/fighter';
import type { StageManifest } from '../types/stage';
import { MAX_FIGHTERS, MIN_FIGHTERS, type PlayerControlType } from '../types/protocol';
import { closeText } from './lobby/close-codes';
import { cleanName } from './lobby/lobby-http';
import type { Visibility } from './lobby/types';
import {
  NET_PROTOCOL,
  type GuestPacket,
  type HostPacket,
  type InputItem,
  type NetMatchSetup,
  type SeatEvent,
  type SyncState,
} from './netTypes';
import { createRoom, matchRoom } from './playApi';
import { connectAsGuest, HostSignaling, type Link } from './rtc';

export const INPUT_DELAY = 2;
/** Frames between deciding a seat handoff and it taking effect (~⅓ s), so the guest is caught up by then. */
const JOIN_LEAD_FRAMES = 20;

export type RoomStatus = 'connecting' | 'hosting' | 'joining' | 'playing' | 'closed';

export interface SeatView {
  seat: number;
  name: string;
  controlType: PlayerControlType;
  isYou: boolean;
  /** Remote human (another peer). */
  isRemote: boolean;
  fighterId: string;
  nextFighterId: string;
  nextPaletteIndex: number;
}

export interface RoomView {
  role: 'host' | 'guest';
  status: RoomStatus;
  code: string | null;
  visibility: Visibility;
  roomSize: number;
  seats: SeatView[];
  setup: NetMatchSetup | null;
  localSeat: number;
  localPick: { fighterId: string; paletteIndex: number };
  error: string | null;
  /** Bumps whenever a new match starts (so React remounts the viewport for guests). */
  matchId: number;
  /** Guest: host checksums received / mismatches found (each mismatch triggers a resync). */
  sumsChecked: number;
  desyncs: number;
  /** Packet counters for diagnostics. */
  traffic: { localSent: number; remoteRecv: number; sumsSent: number; pkts?: Record<string, number> };
}

export interface RoomDeps {
  roster: readonly FighterBlueprint[];
  getStage: (id: string) => StageManifest;
  era: () => GraphicsEra;
  onChange: (view: RoomView, room: NetRoom) => void;
}

interface GuestInfo {
  link: Link;
  name: string;
  fighterId: string;
  paletteIndex: number;
  seat: number;
}

type Pending = (msg: NetOutMessage) => void;

export class NetRoom {
  private bridge: EngineWorkerBridge | null = null;
  private signaling: HostSignaling | null = null;
  private hostLink: Link | null = null;
  private readonly guests = new Map<string, GuestInfo>();
  private readonly pending = new Map<number, Pending>();
  private nextReq = 1;
  private view: RoomView;
  /** Guest only: welcome/start received before the viewport's bridge was ready. */
  private queuedStart: { setup: NetMatchSetup; sync?: SyncState; inputDelay: number } | null = null;
  /** Guest only: the last match start, so a remounted viewport can rejoin it. */
  private lastStart: { setup: NetMatchSetup; sync?: SyncState; inputDelay: number } | null = null;
  /** Guest only: next-match fighter picks broadcast by the host. */
  private guestNextPicks: { fighterIds: string[]; paletteIndices: number[] } | null = null;

  private constructor(
    private readonly deps: RoomDeps,
    role: 'host' | 'guest',
    private readonly name: string,
    private pick: { fighterId: string; paletteIndex: number },
  ) {
    this.view = {
      role,
      status: 'connecting',
      code: null,
      visibility: 'private',
      roomSize: 4,
      seats: [],
      setup: null,
      localSeat: 0,
      localPick: { ...pick },
      error: null,
      matchId: 0,
      sumsChecked: 0,
      desyncs: 0,
      traffic: { localSent: 0, remoteRecv: 0, sumsSent: 0 },
    };
  }

  // ── Creating ─────────────────────────────────────────────────

  /** Host a room: you start fighting CPUs immediately; others join into CPU seats. */
  static host(deps: RoomDeps, opts: { name: string; fighterId: string; paletteIndex: number; roomSize: number; visibility: Visibility; cpuDifficulty: NetMatchSetup['cpuDifficulty']; stageId: string; stocks: number; hostKey?: { code: string; hostKey: string } }): NetRoom {
    const room = new NetRoom(deps, 'host', cleanName(opts.name) || 'Host', { fighterId: opts.fighterId, paletteIndex: opts.paletteIndex });
    room.view.roomSize = clampSize(opts.roomSize);
    room.view.visibility = opts.visibility;
    room.view.setup = room.buildSetup(opts.stageId, opts.stocks, opts.cpuDifficulty, 1);
    room.view.status = 'hosting';
    room.publish();
    void room.openHosting(opts.hostKey);
    return room;
  }

  /** Quick join: the Lobby puts you in the best public room, or makes you host of a new one. */
  static async quickJoin(deps: RoomDeps, opts: Parameters<typeof NetRoom.host>[1]): Promise<NetRoom> {
    const matched = await matchRoom({ protocol: NET_PROTOCOL, maxSeats: clampSize(opts.roomSize) });
    if (!matched.ok) {
      const room = NetRoom.host(deps, { ...opts, visibility: 'public' });
      return room;
    }
    if (matched.match.kind === 'join') return NetRoom.join(deps, matched.match.code, opts);
    return NetRoom.host(deps, { ...opts, visibility: 'public', hostKey: { code: matched.match.code, hostKey: matched.match.hostKey } });
  }

  static join(deps: RoomDeps, code: string, opts: { name: string; fighterId: string; paletteIndex: number }): NetRoom {
    const room = new NetRoom(deps, 'guest', cleanName(opts.name) || 'Guest', { fighterId: opts.fighterId, paletteIndex: opts.paletteIndex });
    room.view.code = code;
    room.view.status = 'joining';
    room.publish();
    room.hostLink = connectAsGuest(code, {
      open: (link) => room.send(link, { t: 'hello', protocol: NET_PROTOCOL, name: room.name, ...room.pick }),
      message: (text) => room.fromHost(text),
      closed: (c, reason) => room.fail(closeText(c, reason) ?? 'Lost the connection to the host.'),
    });
    return room;
  }

  // ── Public API (UI) ──────────────────────────────────────────

  get current(): RoomView {
    return this.view;
  }

  /** Called by the viewport once its engine bridge is up. Hosts start fighting right away. */
  attach(bridge: EngineWorkerBridge): void {
    this.bridge = bridge;
    if (this.view.role === 'host' && this.view.setup) this.startLocal(this.view.setup, undefined);
    else if (this.queuedStart) {
      const q = this.queuedStart;
      this.queuedStart = null;
      this.startLocal(q.setup, q.sync, q.inputDelay);
    } else if (this.view.role === 'guest' && this.lastStart && this.hostLink) {
      // The viewport (and its engine) was remounted mid-match: rebuild from the last start, then ask the
      // host for its current state so we catch up instead of replaying from the old snapshot.
      const l = this.lastStart;
      this.startLocal(l.setup, l.sync, l.inputDelay);
      this.send(this.hostLink, { t: 'desync', m: l.setup.matchId, frame: -1 });
    }
  }

  detach(bridge: EngineWorkerBridge): void {
    if (this.bridge === bridge) this.bridge = null;
  }

  /** Routes simulation output (inputs, checksums, sync replies) to the network. */
  onNet(msg: NetOutMessage): void {
    if (msg.type === 'NET_SYNC' || msg.type === 'NET_SEAT_SCHEDULED') {
      const cb = this.pending.get(msg.reqId);
      this.pending.delete(msg.reqId);
      cb?.(msg);
      return;
    }
    const matchId = this.view.setup?.matchId ?? 0;
    if (msg.type === 'NET_LOCAL') {
      this.view.traffic.localSent += msg.items.length;
      const packet = { t: 'in' as const, m: matchId, items: msg.items };
      if (this.view.role === 'host') this.broadcast(packet);
      else if (this.hostLink) this.send(this.hostLink, packet);
    } else if (msg.type === 'NET_SUM' && this.view.role === 'host') {
      this.view.traffic.sumsSent++;
      this.broadcast({ t: 'sum', m: matchId, frame: msg.frame, hash: msg.hash });
    } else if (msg.type === 'NET_DESYNC' && this.hostLink) {
      this.view.desyncs++;
      console.warn(`[net] desync at frame ${msg.frame}; requesting resync from host`);
      this.send(this.hostLink, { t: 'desync', m: matchId, frame: msg.frame });
      this.publish();
    }
  }

  /** Any player: choose a fighter and palette for the next match. */
  setFighter(fighterId: string, paletteIndex: number): void {
    const isKnownFighter = this.deps.roster.some((fighter) => fighter.id === fighterId);
    if (!isKnownFighter) return;
    const normalizedPalette = Math.max(0, Math.floor(paletteIndex)) % 4;
    this.pick = { fighterId, paletteIndex: normalizedPalette };

    if (this.view.role === 'host') {
      this.broadcastRoster();
      this.publish();
      return;
    }

    if (this.hostLink) {
      this.send(this.hostLink, { t: 'pick', fighterId, paletteIndex: normalizedPalette });
    }
    const setup = this.view.setup;
    if (setup) {
      const nextFighterIds = this.guestNextPicks ? [...this.guestNextPicks.fighterIds] : [...setup.fighterIds];
      const nextPaletteIndices = this.guestNextPicks ? [...this.guestNextPicks.paletteIndices] : [...setup.paletteIndices];
      nextFighterIds[this.view.localSeat] = fighterId;
      nextPaletteIndices[this.view.localSeat] = normalizedPalette;
      this.guestNextPicks = { fighterIds: nextFighterIds, paletteIndices: nextPaletteIndices };
    }
    this.publish();
  }

  /** Host: change room size (takes effect on the next match). */
  setRoomSize(size: number): void {
    if (this.view.role !== 'host') return;
    this.view.roomSize = clampSize(size);
    this.reportToLobby();
    this.publish();
  }

  setVisibility(v: Visibility): void {
    this.view.visibility = v;
    this.publish();
  }

  /** Host: remove a CPU from the current match (knocked out) and from the next one. */
  kickCpu(seat: number): void {
    if (this.view.role !== 'host' || !this.view.setup) return;
    if (this.view.setup.controlTypes[seat] !== 'cpu') return;
    this.schedule(seat, 'cpu', 2, true);
    this.view.roomSize = clampSize(Math.max(this.humanCount(), this.view.roomSize - 1));
    this.publish();
  }

  /** Host: start a fresh match with everyone currently in the room (and CPUs filling to room size). */
  nextMatch(stageId?: string): void {
    if (this.view.role !== 'host' || !this.view.setup) return;
    const prev = this.view.setup;
    const setup = this.buildSetup(stageId ?? prev.stageId, prev.stocks, prev.cpuDifficulty, prev.matchId + 1);
    this.view.setup = setup;
    for (const g of this.guests.values()) this.send(g.link, { t: 'start', setup, seat: g.seat, inputDelay: INPUT_DELAY });
    this.startLocal(setup, undefined);
    this.reportToLobby();
  }

  leave(): void {
    if (this.view.role === 'host') {
      for (const g of this.guests.values()) this.send(g.link, { t: 'bye', reason: 'host left' });
      this.signaling?.end();
    } else if (this.hostLink) {
      this.send(this.hostLink, { t: 'bye' });
      this.hostLink.close();
    }
    this.view.status = 'closed';
    this.publish();
  }

  // ── Host internals ───────────────────────────────────────────

  private async openHosting(preset?: { code: string; hostKey: string }): Promise<void> {
    const room = preset ?? await (async () => {
      const created = await createRoom({ protocol: NET_PROTOCOL, visibility: this.view.visibility, device: isPhone() ? 'phone' : 'desktop', maxSeats: this.view.roomSize, label: this.name });
      if (!created.ok) {
        this.view.error = `${created.reason} You can keep playing against CPUs.`;
        this.publish();
        return null;
      }
      return created.room;
    })();
    if (!room) return;
    this.view.code = room.code;
    this.publish();
    this.signaling = new HostSignaling(room.code, room.hostKey, {
      ready: () => {
        this.view.error = null;
        this.reportToLobby();
        this.publish();
      },
      guestOpen: () => {
        // Wait for the guest's hello before seating them.
      },
      guestMessage: (link, text) => this.fromGuest(link, text),
      guestClosed: (link) => this.guestLeft(link.id),
      signalLost: () => {
        this.view.error = 'Reconnecting the room… (current players keep playing)';
        this.publish();
      },
    });
  }

  private buildSetup(stageId: string, stocks: number, cpuDifficulty: NetMatchSetup['cpuDifficulty'], matchId: number): NetMatchSetup {
    const size = Math.max(this.view.roomSize, 1 + this.guests.size);
    const fighterIds: string[] = [];
    const paletteIndices: number[] = [];
    const controlTypes: PlayerControlType[] = [];
    const names: string[] = [];
    const used = new Set<string>();
    const push = (fid: string, pal: number, ct: PlayerControlType, name: string) => {
      fighterIds.push(fid);
      paletteIndices.push(pal);
      controlTypes.push(ct);
      names.push(name);
      used.add(fid);
    };
    push(this.pick.fighterId, this.pick.paletteIndex, 'human', this.name);
    let seat = 1;
    for (const g of this.guests.values()) {
      g.seat = seat++;
      push(g.fighterId, used.has(g.fighterId) ? (g.paletteIndex + 1) % 4 : g.paletteIndex, 'human', g.name);
    }
    const ids = this.deps.roster.map((f) => f.id);
    let k = matchId * 7;
    while (fighterIds.length < size) {
      const fid = ids[k++ % ids.length];
      if (used.has(fid) && used.size < ids.length) continue;
      push(fid, fighterIds.length % 4, 'cpu', '');
    }
    return { fighterIds, paletteIndices, controlTypes, names, stageId, stocks, cpuDifficulty, matchId };
  }

  private count(kind: string): void {
    const t = this.view.traffic;
    t.pkts = { ...(t.pkts ?? {}), [kind]: (t.pkts?.[kind] ?? 0) + 1 };
  }

  private fromGuest(link: Link, text: string): void {
    const p = parse<GuestPacket>(text);
    this.count(`rx:${p?.t ?? 'bad'}`);
    if (!p) return;
    const matchId = this.view.setup?.matchId ?? 0;
    if (p.t === 'hello') {
      void this.admit(link, p);
      return;
    }
    const g = this.guests.get(link.id);
    if (!g) return;
    if (p.t === 'pick') {
      const isKnownFighter = this.deps.roster.some((fighter) => fighter.id === p.fighterId);
      if (!isKnownFighter) return;
      g.fighterId = p.fighterId;
      g.paletteIndex = Math.max(0, Math.floor(p.paletteIndex)) % 4;
      this.broadcastRoster();
      this.publish();
    } else if (p.t === 'in' && p.m === matchId) {
      this.view.traffic.remoteRecv += p.items.length;
      const items = p.items.filter(([seat]) => seat === g.seat);
      this.bridge?.sendNet({ type: 'NET_INPUTS', matchId, items });
      this.broadcast({ t: 'in', m: matchId, items }, link.id);
    } else if (p.t === 'desync' && p.m === matchId) {
      this.request<SyncState | null>({ type: 'NET_SYNC_REQUEST', reqId: 0 }, (msg) => (msg.type === 'NET_SYNC' ? msg.sync : null), (sync) => {
        if (sync) this.send(link, { t: 'state', m: matchId, sync });
      });
    } else if (p.t === 'bye') {
      link.close();
      this.guestLeft(link.id);
    }
  }

  private async admit(link: Link, hello: Extract<GuestPacket, { t: 'hello' }>): Promise<void> {
    const setup = this.view.setup;
    if (hello.protocol !== NET_PROTOCOL) {
      this.send(link, { t: 'refuse', reason: 'You and the host are on different versions. Both reload the page.' });
      return;
    }
    if (!setup) return;
    const seat = setup.controlTypes.findIndex((c, i) => c === 'cpu' && !this.isSeatTaken(i));
    if (seat < 0) {
      this.send(link, { t: 'refuse', reason: 'That room is full.' });
      return;
    }
    const known = this.deps.roster.some((f) => f.id === hello.fighterId);
    const info: GuestInfo = {
      link,
      name: cleanName(hello.name) || `P${seat + 1}`,
      fighterId: known ? hello.fighterId : setup.fighterIds[seat],
      paletteIndex: hello.paletteIndex,
      seat,
    };
    this.guests.set(link.id, info);
    setup.controlTypes[seat] = 'human';
    setup.names[seat] = info.name;
    // 1) schedule the handoff, 2) snapshot (which then includes the event), 3) welcome the guest.
    this.schedule(seat, 'human', JOIN_LEAD_FRAMES, false, () => {
      this.request<SyncState | null>({ type: 'NET_SYNC_REQUEST', reqId: 0 }, (m) => (m.type === 'NET_SYNC' ? m.sync : null), (sync) => {
        if (!sync) return;
        this.send(link, { t: 'welcome', seat, setup, sync, inputDelay: INPUT_DELAY });
        this.broadcastRoster();
      });
    });
    this.reportToLobby();
    this.publish();
  }

  private guestLeft(linkId: string): void {
    const g = this.guests.get(linkId);
    if (!g) return;
    this.guests.delete(linkId);
    const setup = this.view.setup;
    if (setup && setup.controlTypes[g.seat] === 'human' && g.seat !== 0) {
      setup.controlTypes[g.seat] = 'cpu';
      setup.names[g.seat] = '';
      this.schedule(g.seat, 'cpu', 2);
    }
    this.broadcastRoster();
    this.reportToLobby();
    this.publish();
  }

  private schedule(seat: number, controlType: PlayerControlType, lead: number, eliminate = false, then?: () => void): void {
    const matchId = this.view.setup?.matchId ?? 0;
    this.request<{ ev: SeatEvent; fills: InputItem[] } | null>(
      { type: 'NET_SCHEDULE_SEAT', reqId: 0, seat, controlType, lead, eliminate },
      (m) => (m.type === 'NET_SEAT_SCHEDULED' ? { ev: m.ev, fills: m.fills } : null),
      (res) => {
        if (res) this.broadcast({ t: 'ev', m: matchId, ev: res.ev, fills: res.fills });
        then?.();
      },
    );
  }

  private isSeatTaken(seat: number): boolean {
    return [...this.guests.values()].some((g) => g.seat === seat);
  }

  private humanCount(): number {
    return 1 + this.guests.size;
  }

  private resolveHostNextPicks(setup: NetMatchSetup): { fighterIds: string[]; paletteIndices: number[] } {
    const fighterIds = [...setup.fighterIds];
    const paletteIndices = [...setup.paletteIndices];
    if (fighterIds.length > 0) {
      fighterIds[0] = this.pick.fighterId;
      paletteIndices[0] = this.pick.paletteIndex;
    }
    for (const guest of this.guests.values()) {
      const isValidSeat = guest.seat >= 0 && guest.seat < fighterIds.length;
      if (!isValidSeat) continue;
      fighterIds[guest.seat] = guest.fighterId;
      paletteIndices[guest.seat] = guest.paletteIndex;
    }
    return { fighterIds, paletteIndices };
  }

  private broadcastRoster(): void {
    const setup = this.view.setup;
    if (!setup) return;
    const nextPicks = this.resolveHostNextPicks(setup);
    this.broadcast({
      t: 'roster',
      names: setup.names,
      controlTypes: setup.controlTypes,
      nextFighterIds: nextPicks.fighterIds,
      nextPaletteIndices: nextPicks.paletteIndices,
    });
  }

  private reportToLobby(): void {
    this.signaling?.report({
      seats: Math.min(MAX_FIGHTERS, this.humanCount()),
      maxSeats: this.view.roomSize,
      phase: 'playing',
      locked: false,
    });
  }

  // ── Guest internals ──────────────────────────────────────────

  private fromHost(text: string): void {
    const p = parse<HostPacket>(text);
    this.count(`rx:${p?.t ?? 'bad'}`);
    if (!p) return;
    const matchId = this.view.setup?.matchId ?? -1;
    switch (p.t) {
      case 'welcome':
      case 'start': {
        this.view.localSeat = p.seat;
        this.view.status = 'playing';
        this.view.error = null;
        this.guestNextPicks = null;
        const sync = p.t === 'welcome' ? p.sync : undefined;
        this.lastStart = { setup: p.setup, sync, inputDelay: p.inputDelay };
        if (this.bridge) this.startLocal(p.setup, sync, p.inputDelay);
        else {
          this.view.setup = p.setup;
          this.queuedStart = { setup: p.setup, sync, inputDelay: p.inputDelay };
        }
        this.view.matchId = p.setup.matchId;
        this.publish();
        break;
      }
      case 'in':
        this.view.traffic.remoteRecv += p.items.length;
        if (p.m === matchId) this.bridge?.sendNet({ type: 'NET_INPUTS', matchId, items: p.items });
        break;
      case 'ev':
        if (p.m === matchId) {
          this.bridge?.sendNet({ type: 'NET_EVENT', matchId, ev: p.ev, fills: p.fills });
          if (this.view.setup) this.view.setup.controlTypes[p.ev.seat] = p.ev.controlType;
          this.publish();
        }
        break;
      case 'sum':
        if (p.m === matchId) {
          this.view.sumsChecked++;
          this.bridge?.sendNet({ type: 'NET_CHECK', matchId, frame: p.frame, hash: p.hash });
        }
        break;
      case 'state':
        if (p.m === matchId) this.bridge?.sendNet({ type: 'NET_RESYNC', matchId, sync: p.sync });
        break;
      case 'roster':
        if (this.view.setup) {
          this.view.setup.names = p.names;
          this.view.setup.controlTypes = p.controlTypes;
          const hasNextPicks = Array.isArray(p.nextFighterIds) && Array.isArray(p.nextPaletteIndices);
          if (hasNextPicks) {
            this.guestNextPicks = {
              fighterIds: p.nextFighterIds!,
              paletteIndices: p.nextPaletteIndices!,
            };
          }
          this.publish();
        }
        break;
      case 'refuse':
        this.fail(p.reason);
        break;
      case 'bye':
        this.fail(p.reason === 'host left' ? 'The host closed the room.' : p.reason);
        break;
    }
  }

  private fail(reason: string): void {
    if (this.view.status === 'closed') return;
    this.view.status = 'closed';
    this.view.error = reason;
    this.publish();
  }

  // ── Shared ───────────────────────────────────────────────────

  private startLocal(setup: NetMatchSetup, sync: SyncState | undefined, inputDelay = INPUT_DELAY): void {
    this.view.setup = setup;
    this.view.matchId = setup.matchId;
    if (this.view.role === 'host') this.view.localSeat = 0;
    this.publish();
    const bridge = this.bridge;
    if (!bridge) return;
    const fighters = setup.fighterIds.map((id, i) => this.deps.roster.find((f) => f.id === id) ?? this.deps.roster[i % this.deps.roster.length]);
    bridge.startMatch({
      fighters,
      paletteIndices: setup.paletteIndices,
      controlTypes: setup.controlTypes,
      cpuDifficulty: setup.cpuDifficulty,
      stage: this.deps.getStage(setup.stageId),
      stocks: setup.stocks,
      graphicsEra: this.deps.era(),
      net: { localSeats: [this.view.localSeat], inputDelay, isHost: this.view.role === 'host', matchId: setup.matchId, sync },
    });
  }

  private request<T>(msg: Extract<NetInMessage, { reqId: number }>, pick: (m: NetOutMessage) => T, done: (v: T) => void): void {
    if (!this.bridge) return;
    const reqId = this.nextReq++;
    this.pending.set(reqId, (m) => done(pick(m)));
    this.bridge.sendNet({ ...msg, reqId });
  }

  private broadcast(packet: HostPacket, exceptLinkId?: string): void {
    this.count(`tx:${packet.t}x${this.guests.size}`);
    const text = JSON.stringify(packet);
    for (const g of this.guests.values()) if (g.link.id !== exceptLinkId) g.link.send(text);
  }

  private send(link: Link, packet: HostPacket | GuestPacket): void {
    this.count(`tx:${packet.t}`);
    link.send(JSON.stringify(packet));
  }

  private publish(): void {
    const setup = this.view.setup;
    const nextPicks = setup
      ? this.view.role === 'host'
        ? this.resolveHostNextPicks(setup)
        : this.guestNextPicks
      : null;
    this.view.localPick = { ...this.pick };
    this.view.seats = setup
      ? setup.fighterIds.map((fid, seat) => ({
          seat,
          fighterId: fid,
          nextFighterId: nextPicks?.fighterIds[seat] ?? fid,
          nextPaletteIndex: nextPicks?.paletteIndices[seat] ?? setup.paletteIndices[seat] ?? 0,
          name: setup.names[seat] || (setup.controlTypes[seat] === 'cpu' ? 'CPU' : `P${seat + 1}`),
          controlType: setup.controlTypes[seat],
          isYou: seat === this.view.localSeat,
          isRemote: setup.controlTypes[seat] === 'human' && seat !== this.view.localSeat,
        }))
      : [];
    const snapshot = {
      ...this.view,
      localPick: { ...this.view.localPick },
      seats: [...this.view.seats],
      traffic: { ...this.view.traffic },
    };
    // Read-only debug handle for support and automated tests.
    if (this.view.status !== 'closed' && typeof window !== 'undefined') {
      // Live (not snapshotted) so counters are current when read.
      Object.defineProperty(window, '__allStarsRoom', { configurable: true, get: () => ({ ...this.view, traffic: { ...this.view.traffic, guests: this.guests.size } }) });
    }
    this.deps.onChange(snapshot, this);
  }
}

function clampSize(n: number): number {
  return Math.max(MIN_FIGHTERS, Math.min(MAX_FIGHTERS, Math.round(n)));
}

function isPhone(): boolean {
  return typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
}

function parse<T>(text: string): T | null {
  if (text.length > 512 * 1024) return null;
  try {
    const v = JSON.parse(text) as unknown;
    return v && typeof v === 'object' && 't' in (v as object) ? (v as T) : null;
  } catch {
    return null;
  }
}
