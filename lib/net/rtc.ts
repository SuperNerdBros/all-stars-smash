// WebRTC links between a host tab and its guests, signaled through the Room DO.
// Ported from zombie-survival src/network/rtc-pipe.ts (guest) and host-session.ts (host side).
import {
  parseToGuestSignal,
  parseToHostSignal,
  type GuestSignal,
  type HostSignal,
  type IceCandidate,
  type IceServer,
  type RoomReport,
} from './lobby/lobby-protocol';
import { NET_PROTOCOL } from './netTypes';
import { socketUrl } from './playApi';

/** One negotiated, ordered, reliable channel set up identically on both ends. */
const GAME_CHANNEL: RTCDataChannelInit = { negotiated: true, id: 0, ordered: true };
const PING_MS = 20_000;

function rtcConfig(iceServers: readonly IceServer[], relayOnly: boolean): RTCConfiguration {
  return {
    iceServers: iceServers.map((s) => ({ ...s, urls: typeof s.urls === 'string' ? s.urls : [...s.urls] })),
    iceTransportPolicy: relayOnly ? 'relay' : 'all',
  };
}

const candidateOf = (event: RTCPeerConnectionIceEvent): IceCandidate | null =>
  event.candidate?.candidate
    ? { candidate: event.candidate.candidate, sdpMid: event.candidate.sdpMid, sdpMLineIndex: event.candidate.sdpMLineIndex }
    : null;

export interface Link {
  readonly id: string;
  send(text: string): void;
  close(): void;
}

// ── Guest ───────────────────────────────────────────────────────

export interface GuestHandlers {
  open(link: Link): void;
  message(text: string): void;
  /** Fires once. `code` is the Room's WebSocket close code before the channel opened, else 1006. */
  closed(code: number, reason: string): void;
}

export function connectAsGuest(code: string, handlers: GuestHandlers): Link {
  let signal: WebSocket | null = new WebSocket(socketUrl(`/v1/rooms/${code}/guest?protocol=${NET_PROTOCOL}`));
  let pc: RTCPeerConnection | null = null;
  let channel: RTCDataChannel | null = null;
  let early: IceCandidate[] = [];
  let answered = false;
  let done = false;

  const link: Link = {
    id: 'host',
    send: (text) => {
      if (channel?.readyState === 'open') channel.send(text);
    },
    close: () => {
      done = true;
      teardown();
    },
  };

  const tell = (m: GuestSignal) => {
    if (signal?.readyState === WebSocket.OPEN) signal.send(JSON.stringify(m));
  };
  const fail = (c: number, reason: string) => {
    if (done) return;
    done = true;
    teardown();
    handlers.closed(c, reason);
  };
  function teardown(): void {
    if (signal) {
      signal.onmessage = null;
      signal.onclose = null;
      if (signal.readyState <= WebSocket.OPEN) signal.close(1000, 'bye');
    }
    if (channel) {
      channel.onopen = channel.onmessage = channel.onclose = null;
      channel.close();
    }
    pc?.close();
    signal = null;
    pc = null;
    channel = null;
  }

  signal.onclose = (event) => {
    if (channel?.readyState !== 'open') fail(event.code, event.reason);
  };
  signal.onmessage = async (event) => {
    const m = parseToGuestSignal(event.data);
    if (!m) return;
    try {
      if (m.type === 'admitted') {
        pc = new RTCPeerConnection(rtcConfig(m.iceServers, m.relayOnly));
        channel = pc.createDataChannel('game', GAME_CHANNEL);
        channel.onopen = () => {
          signal?.close(1000, 'connected');
          handlers.open(link);
        };
        channel.onmessage = (e) => typeof e.data === 'string' && handlers.message(e.data);
        channel.onclose = () => fail(1006, '');
        pc.onicecandidate = (e) => {
          const ice = candidateOf(e);
          if (ice) tell({ type: 'ice', ice });
        };
        pc.onconnectionstatechange = () => pc?.connectionState === 'failed' && fail(1006, '');
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        tell({ type: 'offer', sdp: offer.sdp ?? '' });
      } else if (m.type === 'answer' && pc && !answered) {
        await pc.setRemoteDescription({ type: 'answer', sdp: m.sdp });
        answered = true;
        for (const ice of early) await pc.addIceCandidate(ice);
        early = [];
      } else if (m.type === 'ice') {
        if (!pc || !answered) early.push(m.ice);
        else await pc.addIceCandidate(m.ice);
      } else if (m.type === 'peer-left') {
        fail(4001, 'host away');
      }
    } catch {
      fail(1006, '');
    }
  };
  return link;
}

// ── Host ────────────────────────────────────────────────────────

export interface HostHandlers {
  /** Signaling is up: guests can now connect. */
  ready(): void;
  guestOpen(link: Link): void;
  guestMessage(link: Link, text: string): void;
  guestClosed(link: Link): void;
  /** The signal socket closed and will retry; existing guests keep playing. */
  signalLost(code: number): void;
}

interface GuestConn {
  pc: RTCPeerConnection;
  channel: RTCDataChannel;
  link: Link;
  early: IceCandidate[];
  described: boolean;
  open: boolean;
}

export class HostSignaling {
  private signal: WebSocket | null = null;
  private iceServers: readonly IceServer[] = [];
  private relayOnly = false;
  private readonly guests = new Map<string, GuestConn>();
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private ended = false;
  private lastReport: RoomReport | null = null;

  constructor(
    private readonly code: string,
    private readonly hostKey: string,
    private readonly handlers: HostHandlers,
  ) {
    this.connect();
  }

  report(report: RoomReport): void {
    this.lastReport = report;
    this.tell({ type: 'report', report });
  }

  /** Ends the room for good. */
  end(): void {
    this.ended = true;
    this.tell({ type: 'end', reason: 'host left' });
    for (const g of this.guests.values()) g.link.close();
    this.guests.clear();
    this.stopTimers();
    this.signal?.close(1000, 'end');
    this.signal = null;
  }

  private connect(): void {
    if (this.ended) return;
    const signal = new WebSocket(socketUrl(`/v1/rooms/${this.code}/host`));
    this.signal = signal;
    signal.onopen = () => signal.send(JSON.stringify({ type: 'auth', hostKey: this.hostKey } satisfies HostSignal));
    signal.onmessage = (event) => void this.fromRoom(event.data);
    signal.onclose = (event) => {
      if (this.signal !== signal) return;
      this.signal = null;
      this.stopTimers();
      if (this.ended) return;
      this.handlers.signalLost(event.code);
      // The Room keeps the code for 2 minutes after a drop; try to come back.
      const fatal = event.code === 1008 || event.code === 4010;
      if (!fatal) this.retryTimer = setTimeout(() => this.connect(), 3000);
    };
    this.pingTimer = setInterval(() => {
      if (this.signal?.readyState === WebSocket.OPEN) this.signal.send('ping');
    }, PING_MS);
  }

  private stopTimers(): void {
    if (this.pingTimer) clearInterval(this.pingTimer);
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.pingTimer = this.retryTimer = null;
  }

  private tell(m: HostSignal): void {
    if (this.signal?.readyState === WebSocket.OPEN) this.signal.send(JSON.stringify(m));
  }

  private async fromRoom(raw: unknown): Promise<void> {
    const m = parseToHostSignal(raw);
    if (!m) return;
    try {
      if (m.type === 'ready') {
        this.iceServers = m.iceServers;
        this.relayOnly = m.relayOnly;
        if (this.lastReport) this.tell({ type: 'report', report: this.lastReport });
        this.handlers.ready();
      } else if (m.type === 'offer') {
        await this.acceptGuest(m.peerId, m.sdp);
      } else if (m.type === 'ice') {
        const g = this.guests.get(m.peerId);
        if (!g) return;
        if (!g.described) g.early.push(m.ice);
        else await g.pc.addIceCandidate(m.ice);
      } else if (m.type === 'peer-left') {
        const g = this.guests.get(m.peerId);
        // A guest closes its signal socket once connected; only drop it if the channel never opened.
        if (g && !g.open) setTimeout(() => this.guests.get(m.peerId) === g && !g.open && this.dropGuest(m.peerId), 4000);
      }
    } catch {
      if (m.type === 'offer') this.dropGuest(m.peerId);
    }
  }

  private async acceptGuest(peerId: string, sdp: string): Promise<void> {
    this.dropGuest(peerId);
    const pc = new RTCPeerConnection(rtcConfig(this.iceServers, this.relayOnly));
    const channel = pc.createDataChannel('game', GAME_CHANNEL);
    const link: Link = {
      id: peerId,
      send: (text) => channel.readyState === 'open' && channel.send(text),
      close: () => this.dropGuest(peerId),
    };
    const conn: GuestConn = { pc, channel, link, early: [], described: false, open: false };
    this.guests.set(peerId, conn);
    channel.onopen = () => {
      conn.open = true;
      this.handlers.guestOpen(link);
    };
    channel.onmessage = (e) => typeof e.data === 'string' && this.handlers.guestMessage(link, e.data);
    channel.onclose = () => this.dropGuest(peerId);
    pc.onicecandidate = (e) => {
      const ice = candidateOf(e);
      if (ice) this.tell({ type: 'ice', peerId, ice });
    };
    pc.onconnectionstatechange = () => pc.connectionState === 'failed' && this.dropGuest(peerId);
    await pc.setRemoteDescription({ type: 'offer', sdp });
    conn.described = true;
    for (const ice of conn.early) await pc.addIceCandidate(ice);
    conn.early = [];
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    this.tell({ type: 'answer', peerId, sdp: answer.sdp ?? '' });
  }

  private dropGuest(peerId: string): void {
    const g = this.guests.get(peerId);
    if (!g) return;
    this.guests.delete(peerId);
    g.channel.onopen = g.channel.onmessage = g.channel.onclose = null;
    try {
      g.channel.close();
      g.pc.close();
    } catch {
      // already closed
    }
    if (g.open) this.handlers.guestClosed(g.link);
  }
}
