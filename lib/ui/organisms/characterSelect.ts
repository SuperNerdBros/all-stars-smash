'use client';

import React, { useState } from 'react';
import {
  ArrowRight,
  ImagePlus,
  Paintbrush,
  RotateCcw,
  Swords,
} from 'lucide-react';
import type { FighterBlueprint } from '../../types/fighter';
import type { CpuDifficulty, MatchConfig } from '../../types/protocol';
import { chiptuneAudio } from '../../io/chiptuneAudio';
import { ArcadeButton } from '../atoms/button';
import { FighterTile } from '../molecules/fighterTile';
import { PlayerSlotCard } from '../molecules/playerSlotCard';

export interface CharacterSelectProps {
  roster: FighterBlueprint[];
  matchConfig: MatchConfig;
  onUpdateMatchConfig: (next: MatchConfig) => void;
  onOpenStageSelect: () => void;
  onOpenPixelForge: (fighterId: string) => void;
  onOpenPngImporter: () => void;
  onResetRoster: () => void;
}

export function CharacterSelect(props: CharacterSelectProps): React.ReactElement {
  const {
    roster,
    matchConfig,
    onUpdateMatchConfig,
    onOpenStageSelect,
    onOpenPixelForge,
    onOpenPngImporter,
    onResetRoster,
  } = props;

  const [activeSlot, setActiveSlot] = useState<0 | 1>(0);

  const p1Config = matchConfig.players[0];
  const p2Config = matchConfig.players[1];
  const p1Fighter = roster.find((f) => f.id === p1Config.fighterId) ?? roster[0];
  const p2Fighter = roster.find((f) => f.id === p2Config.fighterId) ?? roster[1] ?? roster[0];

  const handleSelectFighter = (fighter: FighterBlueprint) => {
    chiptuneAudio.playMenuTick();
    const nextPlayers: MatchConfig['players'] = [
      { ...p1Config },
      { ...p2Config },
    ];
    nextPlayers[activeSlot] = {
      ...nextPlayers[activeSlot],
      fighterId: fighter.id,
      paletteIndex:
        activeSlot === 1 && p1Config.fighterId === fighter.id
          ? (p1Config.paletteIndex + 1) % fighter.palettes.length
          : 0,
    };
    onUpdateMatchConfig({ ...matchConfig, players: nextPlayers });
  };

  const handleCyclePalette = (slot: 0 | 1, delta: number) => {
    chiptuneAudio.playMenuTick();
    const fighter = slot === 0 ? p1Fighter : p2Fighter;
    const count = Math.max(1, fighter.palettes.length);
    const nextPlayers: MatchConfig['players'] = [
      { ...p1Config },
      { ...p2Config },
    ];
    const current = nextPlayers[slot].paletteIndex;
    nextPlayers[slot].paletteIndex = (current + delta + count) % count;
    onUpdateMatchConfig({ ...matchConfig, players: nextPlayers });
  };

  const handleToggleP2Control = () => {
    chiptuneAudio.playMenuTick();
    const nextPlayers: MatchConfig['players'] = [
      { ...p1Config },
      {
        ...p2Config,
        controlType: p2Config.controlType === 'cpu' ? 'human' : 'cpu',
      },
    ];
    onUpdateMatchConfig({ ...matchConfig, players: nextPlayers });
  };

  const handleSetCpuDifficulty = (diff: CpuDifficulty) => {
    chiptuneAudio.playMenuTick();
    const nextPlayers: MatchConfig['players'] = [
      { ...p1Config },
      { ...p2Config, cpuDifficulty: diff },
    ];
    onUpdateMatchConfig({ ...matchConfig, players: nextPlayers });
  };

  const handleStocksChange = (stocks: number) => {
    chiptuneAudio.playMenuTick();
    onUpdateMatchConfig({ ...matchConfig, stocks });
  };

  return React.createElement(
    'div',
    { className: 'min-h-screen bg-[#0B1020] text-[#F1F5F9] flex flex-col' },

    // Clean 3-zone Top Bar Contract
    React.createElement(
      'header',
      {
        className:
          'flex items-center justify-between gap-8 px-6 py-4 border-b border-[#2B3858] bg-[#0E1529]',
      },
      React.createElement(
        'div',
        { className: 'font-display text-lg font-extrabold tracking-tight text-white whitespace-nowrap shrink-0' },
        'Pixel Brawl 2.5D',
      ),
      React.createElement(
        'nav',
        { className: 'hidden md:flex items-center gap-6 text-sm text-[#94A3B8]' },
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: () => setActiveSlot(0),
            className: `transition-colors whitespace-nowrap shrink-0 cursor-pointer ${activeSlot === 0 ? 'text-white font-semibold' : 'hover:text-white'}`,
          },
          'Select P1',
        ),
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: () => setActiveSlot(1),
            className: `transition-colors whitespace-nowrap shrink-0 cursor-pointer ${activeSlot === 1 ? 'text-white font-semibold' : 'hover:text-white'}`,
          },
          'Select P2',
        ),
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: () => onOpenPixelForge(activeSlot === 0 ? p1Fighter.id : p2Fighter.id),
            className: 'hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer',
          },
          'Pixel Forge',
        ),
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: onOpenPngImporter,
            className: 'hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer',
          },
          'PNG Importer',
        ),
      ),
      React.createElement(
        'div',
        { className: 'shrink-0' },
        React.createElement(ArcadeButton, {
          label: 'Select Stage',
          variant: 'primary',
          size: 'md',
          icon: React.createElement(ArrowRight, { className: 'w-4 h-4' }),
          onClick: () => {
            chiptuneAudio.playMenuConfirm();
            onOpenStageSelect();
          },
        }),
      ),
    ),

    // Main Content Area
    React.createElement(
      'main',
      { className: 'flex-1 w-full max-w-6xl mx-auto px-6 py-8 flex flex-col gap-8' },

      // Workspace Headline + Authoring Toolbar
      React.createElement(
        'div',
        { className: 'flex flex-col md:flex-row md:items-end justify-between gap-4' },
        React.createElement(
          'div',
          null,
          React.createElement(
            'h1',
            { className: 'font-display text-3xl font-extrabold tracking-tight text-white [text-wrap:balance]' },
            'Choose Your Fighters',
          ),
          React.createElement(
            'p',
            { className: 'text-sm text-[#94A3B8] mt-1' },
            `Assigning ${activeSlot === 0 ? 'Player 1' : 'Player 2'} · Click a slot below to switch active cursor · Keys 1–4 orbit the 2.5D camera live in combat.`,
          ),
        ),

        // Stocks + Forge/Import Toolbar
        React.createElement(
          'div',
          { className: 'flex flex-wrap items-center gap-2' },
          React.createElement(
            'div',
            {
              className:
                'flex items-center gap-1 p-1 rounded-md bg-[#141C2F] border border-[#2B3858]',
            },
            React.createElement(
              'span',
              { className: 'px-2 text-xs text-[#94A3B8] whitespace-nowrap' },
              'Stocks',
            ),
            ...[1, 2, 3, 5].map((n) =>
              React.createElement(
                'button',
                {
                  key: n,
                  type: 'button',
                  onClick: () => handleStocksChange(n),
                  className: [
                    'px-2.5 py-1 rounded text-xs font-mono tabular-nums transition-colors cursor-pointer',
                    matchConfig.stocks === n
                      ? 'bg-[#F59E0B] text-[#0B1020] font-bold'
                      : 'text-[#CBD5E1] hover:text-white',
                  ].join(' '),
                },
                String(n),
              ),
            ),
          ),
          React.createElement(ArcadeButton, {
            label: 'Pixel Forge',
            size: 'sm',
            variant: 'secondary',
            icon: React.createElement(Paintbrush, { className: 'w-3.5 h-3.5 text-[#F59E0B]' }),
            onClick: () => onOpenPixelForge(activeSlot === 0 ? p1Fighter.id : p2Fighter.id),
          }),
          React.createElement(ArcadeButton, {
            label: 'Import PNG',
            size: 'sm',
            variant: 'secondary',
            icon: React.createElement(ImagePlus, { className: 'w-3.5 h-3.5 text-[#38BDF8]' }),
            onClick: onOpenPngImporter,
          }),
          roster.some((f) => f.isCustom)
            ? React.createElement(ArcadeButton, {
                label: 'Reset Roster',
                size: 'sm',
                variant: 'ghost',
                icon: React.createElement(RotateCcw, { className: 'w-3.5 h-3.5' }),
                onClick: onResetRoster,
              })
            : null,
        ),
      ),

      // Roster Grid
      React.createElement(
        'section',
        {
          'aria-label': 'Fighter Roster Grid',
          className: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4',
        },
        ...roster.map((fighter) =>
          React.createElement(FighterTile, {
            key: fighter.id,
            fighter,
            isP1: p1Fighter.id === fighter.id,
            isP2: p2Fighter.id === fighter.id,
            p1PaletteIndex: p1Config.paletteIndex,
            p2PaletteIndex: p2Config.paletteIndex,
            onSelect: () => handleSelectFighter(fighter),
          }),
        ),
      ),

      // P1 vs P2 Loadout Row
      React.createElement(
        'section',
        {
          'aria-label': 'Active Matchup Loadouts',
          className: 'grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch',
        },
        React.createElement(PlayerSlotCard, {
          slot: 0,
          isActiveSlot: activeSlot === 0,
          config: p1Config,
          fighter: p1Fighter,
          onFocusSlot: () => {
            chiptuneAudio.playMenuTick();
            setActiveSlot(0);
          },
          onCyclePalette: (d) => handleCyclePalette(0, d),
          onOpenForge: () => onOpenPixelForge(p1Fighter.id),
        }),
        React.createElement(PlayerSlotCard, {
          slot: 1,
          isActiveSlot: activeSlot === 1,
          config: p2Config,
          fighter: p2Fighter,
          onFocusSlot: () => {
            chiptuneAudio.playMenuTick();
            setActiveSlot(1);
          },
          onCyclePalette: (d) => handleCyclePalette(1, d),
          onToggleControlType: handleToggleP2Control,
          onCycleCpuDifficulty: handleSetCpuDifficulty,
          onOpenForge: () => onOpenPixelForge(p2Fighter.id),
        }),
      ),

      // Quiet Controls Legend Footer
      React.createElement(
        'footer',
        {
          className:
            'flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#2B3858]/70 text-xs text-[#94A3B8]',
        },
        React.createElement(
          'div',
          { className: 'flex flex-wrap items-center gap-x-4 gap-y-1' },
          React.createElement('span', { className: 'text-[#E2E8F0] font-medium' }, 'P1 Controls:'),
          React.createElement('span', null, 'A/D Move · W/Space Jump · S Drop · J Attack · K Smash · L Special · Shift Shield'),
          React.createElement('span', { className: 'text-[#64748B]' }, '· Gamepad Supported'),
        ),
        React.createElement(ArcadeButton, {
          label: 'Proceed to Stage Select',
          variant: 'primary',
          size: 'md',
          icon: React.createElement(Swords, { className: 'w-4 h-4' }),
          onClick: () => {
            chiptuneAudio.playMenuConfirm();
            onOpenStageSelect();
          },
        }),
      ),
    ),
  );
}
