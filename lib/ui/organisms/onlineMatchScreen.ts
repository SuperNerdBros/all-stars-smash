'use client';

import React, { useMemo, useState } from 'react';
import type { FighterBlueprint, GraphicsEra } from '../../types/fighter';
import type { MatchConfig } from '../../types/protocol';
import { getStageById } from '../../stages/manifests';
import type { NetRoom, RoomView } from '../../net/netRoom';
import { MatchViewport } from './matchViewport';
import { OnlineRoomPanel } from './onlineRoomPanel';

export interface OnlineMatchScreenProps {
  room: NetRoom;
  view: RoomView;
  roster: readonly FighterBlueprint[];
  graphicsEra: GraphicsEra;
  musicOpen: boolean;
  onToggleEra: () => void;
  onToggleMusic: () => void;
  onLeave: () => void;
}

/** An online match: the normal viewport, driven by the room, with the room panel on top. */
export function OnlineMatchScreen(props: OnlineMatchScreenProps): React.ReactElement {
  const { room, view, roster, graphicsEra, musicOpen, onToggleEra, onToggleMusic, onLeave } = props;
  const [overForMatch, setOverForMatch] = useState<number | null>(null);
  const matchOver = overForMatch === view.matchId;

  const setup = view.setup;
  const fighters = useMemo(
    () => (setup ? setup.fighterIds.map((id, i) => roster.find((f) => f.id === id) ?? roster[i % roster.length]) : roster.slice(0, 2)),
    [setup, roster],
  );
  const matchConfig: MatchConfig = useMemo(
    () => ({
      players: (setup?.fighterIds ?? fighters.map((f) => f.id)).map((fighterId, i) => ({
        fighterId,
        paletteIndex: setup?.paletteIndices[i] ?? 0,
        controlType: setup?.controlTypes[i] ?? 'cpu',
        cpuDifficulty: setup?.cpuDifficulty ?? 'normal',
      })),
      stageId: setup?.stageId ?? 'sky-citadel',
      stocks: setup?.stocks ?? 3,
      graphicsEra,
    }),
    [setup, fighters, graphicsEra],
  );
  const seatLabels = view.seats.map((s) => (s.controlType === 'cpu' ? 'CPU' : s.isYou ? `${s.name} (you)` : s.name));

  return React.createElement(MatchViewport, {
    fighters,
    matchConfig,
    stage: getStageById(matchConfig.stageId),
    musicOpen,
    onToggleEra,
    onToggleMusic,
    onMatchComplete: () => setOverForMatch(view.matchId),
    onExitToCharacterSelect: onLeave,
    onExitToStageSelect: onLeave,
    online: room,
    seatLabels,
    overlay: React.createElement(OnlineRoomPanel, { room, view, matchOver, onLeave }),
  });
}
