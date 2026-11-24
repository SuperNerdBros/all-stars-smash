'use client';

import React, { useState } from 'react';
import {
  ChevronDown,
  ImagePlus,
  Paintbrush,
  RotateCcw,
  Swords,
} from 'lucide-react';
import type { FighterBlueprint, GraphicsEra } from '../../types/fighter';
import type { CpuDifficulty, MatchConfig } from '../../types/protocol';
import { chiptuneAudio } from '../../io/chiptuneAudio';
import { resolveFighterForEra } from '../../roster/eraResolver';
import { FighterTile, RandomFighterTile } from '../molecules/fighterTile';
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
  const graphicsEra = matchConfig.graphicsEra;
  const isSolo = p2Config.controlType === 'cpu';

  const handleSelectFighter = (fighter: FighterBlueprint) => {
    chiptuneAudio.playMenuTick();
    const resolved = resolveFighterForEra(fighter, graphicsEra);
    const nextPlayers: MatchConfig['players'] = [{ ...p1Config }, { ...p2Config }];
    nextPlayers[activeSlot] = {
      ...nextPlayers[activeSlot],
      fighterId: fighter.id,
      paletteIndex:
        activeSlot === 1 && p1Config.fighterId === fighter.id
          ? (p1Config.paletteIndex + 1) % Math.max(1, resolved.palettes.length)
          : 0,
    };
    onUpdateMatchConfig({ ...matchConfig, players: nextPlayers });
  };

  const handleSelectRandom = () => {
    if (roster.length === 0) return;
    const pick = roster[Math.floor(Math.random() * roster.length)];
    handleSelectFighter(pick);
  };

  const handleCyclePalette = (slot: 0 | 1, delta: number) => {
    chiptuneAudio.playMenuTick();
    const rawFighter = slot === 0 ? p1Fighter : p2Fighter;
    const resolved = resolveFighterForEra(rawFighter, graphicsEra);
    const count = Math.max(1, resolved.palettes.length);
    const nextPlayers: MatchConfig['players'] = [{ ...p1Config }, { ...p2Config }];
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

  const handleSetEra = (era: GraphicsEra) => {
    if (era === graphicsEra) return;
    chiptuneAudio.playMenuConfirm();
    onUpdateMatchConfig({ ...matchConfig, graphicsEra: era });
  };

  return React.createElement(
    'div',
    {
      className:
        'min-h-screen w-full bg-black text-white flex flex-col overflow-x-hidden select-none',
    },

    // ── OFFICIAL SMASH ULTIMATE CRIMSON TOP BAR + SLANTED YELLOW MODE BANNER ──
    React.createElement(
      'header',
      {
        className:
          'relative z-20 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-2 bg-[#C81D25] border-b-4 border-black',
      },

      // Left cluster: Utility buttons + Official Slanted Yellow "Solo Battle" / "VS Battle" Banner
      React.createElement(
        'div',
        { className: 'flex items-center gap-3' },
        React.createElement(
          'div',
          { className: 'flex items-center gap-1.5' },
          React.createElement(
            'button',
            {
              type: 'button',
              onClick: () => onOpenPixelForge(activeSlot === 0 ? p1Fighter.id : p2Fighter.id),
              title: 'Open Pixel Forge Sprite Editor',
              className:
                'inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#991B1B] hover:bg-[#7F1D1D] border-2 border-black text-xs font-bold text-white cursor-pointer whitespace-nowrap',
            },
            React.createElement(Paintbrush, { className: 'w-3.5 h-3.5 text-[#FACC15]' }),
            React.createElement('span', { className: 'hidden sm:inline' }, 'Forge'),
          ),
          React.createElement(
            'button',
            {
              type: 'button',
              onClick: onOpenPngImporter,
              title: 'Import #FF00FF PNG Sprite Sheet',
              className:
                'inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#991B1B] hover:bg-[#7F1D1D] border-2 border-black text-xs font-bold text-white cursor-pointer whitespace-nowrap',
            },
            React.createElement(ImagePlus, { className: 'w-3.5 h-3.5 text-[#38BDF8]' }),
            React.createElement('span', { className: 'hidden sm:inline' }, 'Import'),
          ),
          roster.some((f) => f.isCustom)
            ? React.createElement(
                'button',
                {
                  type: 'button',
                  onClick: onResetRoster,
                  title: 'Reset Custom Fighters',
                  className:
                    'p-1.5 bg-[#991B1B] hover:bg-[#7F1D1D] border-2 border-black text-white/90 cursor-pointer',
                },
                React.createElement(RotateCcw, { className: 'w-3.5 h-3.5' }),
              )
            : null,
        ),

        // Slanted Yellow Smash Mode Banner (Click to toggle Solo Battle vs 2P VS Battle)
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: handleToggleP2Control,
            title: 'Click to switch Solo Battle (CPU) / 2P VS Battle',
            className:
              'relative -skew-x-12 bg-[#FACC15] hover:bg-[#FDE047] border-[3px] border-black px-5 sm:px-7 py-1 text-black shadow-md cursor-pointer transition-colors',
          },
          React.createElement(
            'span',
            {
              className:
                'skew-x-12 flex items-center gap-2 font-display font-black text-sm sm:text-base tracking-tight whitespace-nowrap',
            },
            React.createElement('span', null, isSolo ? 'Solo Battle' : 'VS Battle'),
            React.createElement(ChevronDown, { className: 'w-4 h-4 stroke-[3]' }),
          ),
        ),
      ),

      // Center-Right: NES 8-BIT <-> SNES/SEGA 16-BIT ERA TOGGLE + STOCKS + READY TO FIGHT
      React.createElement(
        'div',
        { className: 'flex flex-wrap items-center gap-2.5' },

        // Prominent NES / SNES·SEGA Era Toggle Switch
        React.createElement(
          'div',
          {
            role: 'group',
            'aria-label': 'Sprite Era Mode',
            className: 'flex items-center -skew-x-12 bg-black p-[3px] border-2 border-black',
          },
          React.createElement(
            'button',
            {
              type: 'button',
              onClick: () => handleSetEra('NES'),
              className: [
                'px-3 py-1 text-xs font-display font-black tracking-wide transition-colors cursor-pointer whitespace-nowrap',
                graphicsEra === 'NES'
                  ? 'bg-[#EF4444] text-white'
                  : 'bg-[#18181B] text-[#A1A1AA] hover:text-white',
              ].join(' '),
            },
            React.createElement('span', { className: 'inline-block skew-x-12' }, 'NES 8-BIT'),
          ),
          React.createElement(
            'button',
            {
              type: 'button',
              onClick: () => handleSetEra('SNES_SEGA'),
              className: [
                'px-3 py-1 text-xs font-display font-black tracking-wide transition-colors cursor-pointer whitespace-nowrap',
                graphicsEra === 'SNES_SEGA'
                  ? 'bg-[#3B82F6] text-white'
                  : 'bg-[#18181B] text-[#A1A1AA] hover:text-white',
              ].join(' '),
            },
            React.createElement('span', { className: 'inline-block skew-x-12' }, 'SNES / SEGA'),
          ),
        ),

        // Stocks selector
        React.createElement(
          'div',
          {
            className:
              'hidden md:flex items-center gap-0.5 bg-black/80 border-2 border-black px-1.5 py-0.5',
          },
          React.createElement(
            'span',
            { className: 'text-[10px] font-bold uppercase text-white/75 px-1' },
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
                  'px-2 py-0.5 text-xs font-mono font-black tabular-nums cursor-pointer',
                  matchConfig.stocks === n
                    ? 'bg-[#FACC15] text-black'
                    : 'text-white/80 hover:text-white',
                ].join(' '),
              },
              String(n),
            ),
          ),
        ),

        // Bold READY TO FIGHT / SELECT STAGE Button
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: () => {
              chiptuneAudio.playMenuConfirm();
              onOpenStageSelect();
            },
            className:
              '-skew-x-12 bg-gradient-to-b from-[#FDE047] to-[#F59E0B] hover:from-[#FEF08A] hover:to-[#FBBF24] border-[3px] border-black px-5 py-1.5 text-black shadow-md cursor-pointer transition-transform active:scale-95',
          },
          React.createElement(
            'span',
            {
              className:
                'skew-x-12 inline-flex items-center gap-2 font-display font-black uppercase text-xs sm:text-sm tracking-wider whitespace-nowrap',
            },
            React.createElement(Swords, { className: 'w-4 h-4 stroke-[2.75]' }),
            'Ready to Fight!',
          ),
        ),
      ),
    ),

    // ── OFFICIAL SMASH ULTIMATE JET-BLACK FRAMED ROSTER MOSAIC GRID ──
    React.createElement(
      'section',
      {
        'aria-label': 'Fighter Roster Grid',
        className: 'w-full bg-black px-3 sm:px-8 py-3 border-b-4 border-black',
      },
      React.createElement(
        'div',
        {
          className:
            'max-w-7xl mx-auto grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-[3px] bg-black border-[3px] border-black',
        },
        ...roster.map((fighter) =>
          React.createElement(FighterTile, {
            key: fighter.id,
            fighter,
            graphicsEra,
            isP1: p1Fighter.id === fighter.id,
            isP2: p2Fighter.id === fighter.id,
            p2ControlType: p2Config.controlType,
            p1PaletteIndex: p1Config.paletteIndex,
            p2PaletteIndex: p2Config.paletteIndex,
            onSelect: () => handleSelectFighter(fighter),
          }),
        ),
        React.createElement(RandomFighterTile, {
          key: '__random__',
          onSelectRandom: handleSelectRandom,
        }),
      ),
    ),

    // ── OFFICIAL SMASH ULTIMATE BRIGHT CYAN-BLUE BOTTOM SHOWCASE STAGE ──
    React.createElement(
      'section',
      {
        'aria-label': 'Active Matchup Loadouts',
        className:
          'relative flex-1 w-full px-3 sm:px-8 py-4 flex flex-col justify-between gap-3',
        style: {
          backgroundImage:
            'linear-gradient(165deg, #38BDF8 0%, #2563EB 45%, #1E3A8A 100%)',
        },
      },

      // Crisp subtle diagonal speed lines in the cyan-blue Smash floor
      React.createElement('div', {
        'aria-hidden': 'true',
        className: 'pointer-events-none absolute inset-0 opacity-20',
        style: {
          backgroundImage:
            'repeating-linear-gradient(125deg, rgba(255,255,255,0.28) 0px, rgba(255,255,255,0.28) 2px, transparent 2px, transparent 28px)',
        },
      }),

      // P1 vs P2 Official Split Showcase Panels
      React.createElement(
        'div',
        {
          className:
            'relative z-10 max-w-7xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 my-auto',
        },
        React.createElement(PlayerSlotCard, {
          slot: 0,
          isActiveSlot: activeSlot === 0,
          graphicsEra,
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
          graphicsEra,
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

      // Compact Bottom Controls & Active Cursor Strip
      React.createElement(
        'footer',
        {
          className:
            'relative z-10 max-w-7xl w-full mx-auto flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-black/55 border border-white/15 text-[11px] text-white/90',
        },
        React.createElement(
          'div',
          { className: 'flex items-center gap-2 font-semibold' },
          React.createElement(
            'span',
            {
              className: `px-1.5 py-0.5 font-display font-black text-[10px] ${
                activeSlot === 0 ? 'bg-[#E11D2E] text-white' : 'bg-[#2563EB] text-white'
              }`,
            },
            activeSlot === 0 ? 'ASSIGNING P1' : 'ASSIGNING P2',
          ),
          React.createElement(
            'span',
            { className: 'text-white/80' },
            'Click either bottom card to move token · Press E in-match to hot-swap NES / SNES·SEGA sprites',
          ),
        ),
        React.createElement(
          'div',
          { className: 'text-white/80 font-mono hidden lg:block' },
          'A/D Move · W/Space Triple Jump & Wall Jump · J Attack · K Smash · L Special · 1-4 Camera',
        ),
      ),
    ),
  );
}
