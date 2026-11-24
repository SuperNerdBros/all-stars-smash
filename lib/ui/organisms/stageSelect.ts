'use client';

import React from 'react';
import { ArrowLeft, Cpu, Music, Play, Sparkles } from 'lucide-react';
import type { GraphicsEra } from '../../types/fighter';
import type { StageManifest } from '../../types/stage';
import { STAGE_MANIFESTS } from '../../stages/manifests';
import { getStageFeatureLabel } from '../../engine/platformMotion';
import { chiptuneAudio } from '../../io/chiptuneAudio';
import { StagePreviewCanvas } from '../atoms/stagePreviewCanvas';

export interface StageSelectProps {
  selectedStageId: string;
  p1Summary: string;
  p2Summary: string;
  stocks: number;
  graphicsEra: GraphicsEra;
  musicOpen: boolean;
  onSelectStage: (stageId: string) => void;
  onSetEra: (era: GraphicsEra) => void;
  onToggleMusic: () => void;
  onBack: () => void;
  onLaunchMatch: () => void;
}

const OUTLINE_TEXT_STYLE: React.CSSProperties = {
  textShadow:
    '1.5px 1.5px 0 #000, -1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 0 2px 3px rgba(0,0,0,0.9)',
};

function renderMiniStageGraphic(stage: StageManifest): React.ReactElement {
  const combatVolumes = stage.volumes.filter((v) => !v.decorative);
  const bgStyle: React.CSSProperties = {
    background: `linear-gradient(180deg, ${stage.sky.zenith} 0%, ${stage.sky.mid} 55%, ${stage.sky.horizon} 100%)`,
  };

  return React.createElement(
    'span',
    { className: 'relative block w-full h-full overflow-hidden', style: bgStyle },
    React.createElement('img', {
      src: stage.backdropImage,
      alt: `${stage.name} backdrop`,
      referrerPolicy: 'no-referrer',
      loading: 'lazy',
      className:
        'absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300',
    }),
    React.createElement('span', {
      className: 'absolute block inset-0 opacity-28',
      style: { backgroundColor: stage.sky.mid },
    }),
    ...combatVolumes.map((vol) => {
      const leftPct = Math.max(6, Math.min(84, 50 + (vol.x - vol.width / 2) / 14));
      const widthPct = Math.max(11, Math.min(84, vol.width / 14));
      const topPct = Math.max(20, Math.min(76, 56 + vol.topY / 11));
      const heightPx = vol.passThrough ? 3 : Math.max(5, Math.min(10, vol.height / 14));
      return React.createElement('span', {
        key: vol.id,
        className: 'absolute block rounded-[1px]',
        style: {
          left: `${leftPct}%`,
          width: `${widthPct}%`,
          top: `${topPct}%`,
          height: `${heightPx}px`,
          backgroundColor: vol.topColor,
          borderBottom: `2px solid ${vol.sideColor}`,
          boxShadow: '0 2px 4px rgba(0,0,0,0.85)',
        },
      });
    }),
  );
}

function renderStageTile(
  stage: StageManifest,
  idx: number,
  isSelected: boolean,
  onSelect: () => void,
  onDoubleSelect: () => void,
): React.ReactElement {
  const featureLabel = getStageFeatureLabel(stage);

  return React.createElement(
    'button',
    {
      key: stage.id,
      type: 'button',
      onClick: onSelect,
      onDoubleClick: onDoubleSelect,
      className: [
        'group relative min-h-[92px] h-full overflow-hidden text-left cursor-pointer transition-transform focus-visible:outline-none',
        isSelected
          ? 'ring-[3px] ring-[#FACC15] z-10 scale-[1.015]'
          : 'hover:brightness-110 hover:z-10',
      ].join(' '),
    },
    renderMiniStageGraphic(stage),
    React.createElement(
      'span',
      { className: 'absolute top-1 left-1.5 right-1.5 flex items-center justify-between gap-1 pointer-events-none' },
      React.createElement(
        'span',
        {
          className: 'font-mono text-[9px] font-black text-white/95',
          style: OUTLINE_TEXT_STYLE,
        },
        String(idx + 1).padStart(2, '0'),
      ),
      isSelected
        ? React.createElement(
            'span',
            { className: 'px-1 py-[1px] bg-[#FACC15] text-black text-[8px] font-black uppercase rounded-xs border border-black' },
            'ACTIVE',
          )
        : React.createElement(
            'span',
            {
              className: 'text-[8px] font-bold uppercase tracking-wider text-[#FDE047]',
              style: OUTLINE_TEXT_STYLE,
            },
            featureLabel === 'Classic' ? '' : featureLabel,
          ),
    ),
    React.createElement(
      'span',
      {
        className:
          'absolute block inset-x-0 bottom-0 px-1.5 pb-1 pt-5 bg-gradient-to-t from-black/95 via-black/72 to-transparent',
      },
      React.createElement(
        'span',
        {
          className: 'block font-display font-black text-[11px] leading-tight uppercase text-white truncate',
          style: OUTLINE_TEXT_STYLE,
        },
        stage.name,
      ),
      React.createElement(
        'span',
        { className: 'block text-[9px] font-semibold text-[#CBD5E1] truncate' },
        stage.series,
      ),
    ),
  );
}

export function StageSelect(props: StageSelectProps): React.ReactElement {
  const {
    selectedStageId,
    p1Summary,
    p2Summary,
    stocks,
    graphicsEra,
    musicOpen,
    onSelectStage,
    onSetEra,
    onToggleMusic,
    onBack,
    onLaunchMatch,
  } = props;

  const selectedStage: StageManifest =
    STAGE_MANIFESTS.find((s) => s.id === selectedStageId) ?? STAGE_MANIFESTS[0];

  const handleRandomStage = () => {
    chiptuneAudio.playMenuTick();
    const pick = STAGE_MANIFESTS[Math.floor(Math.random() * STAGE_MANIFESTS.length)];
    if (pick) onSelectStage(pick.id);
  };

  const featureSummary = getStageFeatureLabel(selectedStage);

  return React.createElement(
    'div',
    { className: 'min-h-screen w-full bg-[#090C14] text-white flex flex-col select-none' },

    // Official Smash Crimson Top Ribbon
    React.createElement(
      'header',
      {
        className:
          'relative z-20 flex flex-wrap items-center justify-between gap-3 px-3 sm:px-5 py-2 bg-[#B91C1C] border-b-[3px] border-black shadow-md',
      },

      React.createElement(
        'div',
        { className: 'flex items-center gap-2 sm:gap-3' },
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: () => {
              chiptuneAudio.playMenuTick();
              onBack();
            },
            className:
              'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm bg-[#7F1D1D] hover:bg-[#991B1B] border-2 border-black text-xs font-black uppercase tracking-wide text-white cursor-pointer whitespace-nowrap',
          },
          React.createElement(ArrowLeft, { className: 'w-3.5 h-3.5' }),
          'Fighters',
        ),
        React.createElement(
          'div',
          {
            className:
              'flex items-center gap-2.5 px-5 py-1.5 bg-[#FACC15] border-[3px] border-black -skew-x-12 shadow-[3px_3px_0_#000]',
          },
          React.createElement(
            'span',
            { className: 'skew-x-12 font-display font-black text-base sm:text-lg tracking-tight text-black uppercase whitespace-nowrap' },
            'Stage Select',
          ),
          React.createElement(
            'span',
            { className: 'skew-x-12 font-mono text-xs font-black px-1.5 py-0.5 rounded-xs bg-black text-[#FACC15]' },
            `${STAGE_MANIFESTS.length}`,
          ),
        ),
      ),

      React.createElement(
        'div',
        { className: 'flex flex-wrap items-center gap-2 sm:gap-3' },
        React.createElement(
          'div',
          { className: 'hidden xl:flex items-center gap-2 text-xs font-bold text-white/90' },
          React.createElement('span', { className: 'text-[#FCA5A5]' }, p1Summary),
          React.createElement('span', { className: 'text-white/60' }, 'VS'),
          React.createElement('span', { className: 'text-[#93C5FD]' }, p2Summary),
          React.createElement('span', { className: 'text-white/40' }, '·'),
          React.createElement('span', { className: 'font-mono text-[#FDE047]' }, `${stocks}★`),
        ),

        React.createElement(
          'div',
          { className: 'flex items-center rounded-sm bg-black p-0.5 border-2 border-black shadow-sm' },
          React.createElement(
            'button',
            {
              type: 'button',
              onClick: () => {
                chiptuneAudio.playMenuTick();
                onSetEra('NES');
              },
              className: [
                'inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider cursor-pointer transition-colors whitespace-nowrap',
                graphicsEra === 'NES' ? 'bg-[#EF4444] text-white' : 'bg-[#1F2937] text-[#9CA3AF] hover:text-white',
              ].join(' '),
            },
            React.createElement(Cpu, { className: 'w-3 h-3' }),
            'NES 8-BIT',
          ),
          React.createElement(
            'button',
            {
              type: 'button',
              onClick: () => {
                chiptuneAudio.playMenuTick();
                onSetEra('SNES_SEGA');
              },
              className: [
                'inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider cursor-pointer transition-colors whitespace-nowrap',
                graphicsEra === 'SNES_SEGA' ? 'bg-[#2563EB] text-white' : 'bg-[#1F2937] text-[#9CA3AF] hover:text-white',
              ].join(' '),
            },
            React.createElement(Sparkles, { className: 'w-3 h-3' }),
            'SNES / SEGA',
          ),
        ),
      ),

      React.createElement(
        'div',
        { className: 'flex items-center gap-2' },
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: onToggleMusic,
            className: [
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border-2 border-black text-xs font-black uppercase tracking-wide cursor-pointer transition-colors whitespace-nowrap',
              musicOpen ? 'bg-[#FACC15] text-black' : 'bg-[#111827] text-white hover:bg-[#1E293B]',
            ].join(' '),
          },
          React.createElement(Music, { className: 'w-3.5 h-3.5' }),
          'SSBU OST',
        ),
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: () => {
              chiptuneAudio.playMenuConfirm();
              onLaunchMatch();
            },
            className:
              'inline-flex items-center gap-1.5 px-4 py-1.5 rounded-sm bg-[#FACC15] hover:bg-[#FDE047] border-2 border-black text-black font-display font-black text-sm uppercase tracking-tight shadow-[2px_2px_0_#000] cursor-pointer active:translate-y-0.5 whitespace-nowrap',
          },
          React.createElement(Play, { className: 'w-4 h-4 fill-current' }),
          'Start Match',
        ),
      ),
    ),

    // Main Body: Left Live Animated 2.5D Showcase + Right Full-Bleed 6x6 (36-Tile) Stage Board
    React.createElement(
      'main',
      {
        className:
          'flex-1 grid grid-cols-1 lg:grid-cols-12 bg-gradient-to-b from-[#0E172A] via-[#0B1120] to-[#080C17]',
      },

      // Left Live 2.5D Preview Column (4 cols)
      React.createElement(
        'section',
        {
          className:
            'lg:col-span-4 p-4 sm:p-5 flex flex-col justify-between gap-4 border-b-[3px] lg:border-b-0 lg:border-r-[3px] border-black bg-gradient-to-br from-[#0F2442] via-[#101C36] to-[#090F1E]',
        },
        React.createElement(
          'div',
          { className: 'flex flex-col gap-3' },
          React.createElement(
            'div',
            { className: 'flex items-center justify-between gap-2 text-[11px] font-black uppercase tracking-widest' },
            React.createElement('span', { className: 'text-[#38BDF8]' }, selectedStage.series),
            React.createElement('span', { className: 'text-[#FDE047]' }, selectedStage.layoutTag),
          ),

          React.createElement(
            'div',
            { className: 'rounded-sm overflow-hidden border-[3px] border-black shadow-[0_10px_24px_rgba(0,0,0,0.65)]' },
            React.createElement(StagePreviewCanvas, {
              key: selectedStage.id,
              stage: selectedStage,
            }),
          ),

          React.createElement(
            'div',
            null,
            React.createElement(
              'h1',
              {
                className: 'font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-white',
                style: OUTLINE_TEXT_STYLE,
              },
              selectedStage.name,
            ),
            React.createElement(
              'p',
              { className: 'text-xs sm:text-sm text-[#CBD5E1] mt-1.5 leading-relaxed' },
              selectedStage.description,
            ),
          ),

          React.createElement(
            'button',
            {
              type: 'button',
              onClick: onToggleMusic,
              className:
                'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-sm bg-black/60 hover:bg-black/80 border-2 border-[#FACC15]/60 text-left cursor-pointer transition-colors',
            },
            React.createElement(
              'span',
              { className: 'flex items-center gap-2.5 min-w-0' },
              React.createElement(Music, { className: 'w-4 h-4 text-[#FACC15] shrink-0' }),
              React.createElement(
                'span',
                { className: 'block min-w-0' },
                React.createElement(
                  'span',
                  { className: 'block text-xs font-black text-[#FDE047] truncate' },
                  selectedStage.ostTitle,
                ),
                React.createElement(
                  'span',
                  { className: 'block text-[10px] text-[#94A3B8] truncate' },
                  'Matched Stage BGM · SoundCloud',
                ),
              ),
            ),
            React.createElement(
              'span',
              { className: 'text-[10px] font-black uppercase text-white/80 shrink-0' },
              musicOpen ? 'Hide' : 'Play',
            ),
          ),
        ),

        React.createElement(
          'div',
          { className: 'flex flex-col gap-3 pt-3 border-t border-white/10' },
          React.createElement(
            'div',
            { className: 'flex items-center justify-between text-xs text-[#94A3B8] font-mono' },
            React.createElement(
              'span',
              null,
              `${selectedStage.volumes.filter((v) => !v.decorative).length} decks · ${featureSummary}`,
            ),
            React.createElement(
              'span',
              null,
              selectedStage.gravityScale ? `${Math.round(selectedStage.gravityScale * 100)}% Gravity` : '100% Gravity',
            ),
          ),
          React.createElement(
            'button',
            {
              type: 'button',
              onClick: () => {
                chiptuneAudio.playMenuConfirm();
                onLaunchMatch();
              },
              className:
                'w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-sm bg-[#FACC15] hover:bg-[#FDE047] border-[3px] border-black text-black font-display font-black text-base uppercase tracking-wide shadow-[4px_4px_0_#000] cursor-pointer active:translate-y-0.5',
            },
            React.createElement(Play, { className: 'w-5 h-5 fill-current' }),
            `Fight on ${selectedStage.name}`,
          ),
        ),
      ),

      // Right Full-Height 6x6 (35 Stages + Random ?) Smash Mosaic Board (8 cols)
      React.createElement(
        'section',
        { className: 'lg:col-span-8 p-2 sm:p-2.5 bg-black flex flex-col' },
        React.createElement(
          'div',
          {
            className:
              'flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 auto-rows-fr gap-[3px] bg-black',
          },
          ...STAGE_MANIFESTS.map((stage, idx) =>
            renderStageTile(
              stage,
              idx,
              stage.id === selectedStage.id,
              () => {
                chiptuneAudio.playMenuTick();
                onSelectStage(stage.id);
              },
              () => {
                chiptuneAudio.playMenuConfirm();
                onSelectStage(stage.id);
                onLaunchMatch();
              },
            ),
          ),

          // 36th Tile: Golden Random Stage Selector (?)
          React.createElement(
            'button',
            {
              type: 'button',
              onClick: handleRandomStage,
              title: `Pick Random Stage from all ${STAGE_MANIFESTS.length} Arenas`,
              className:
                'relative min-h-[92px] h-full overflow-hidden cursor-pointer flex flex-col items-center justify-center bg-gradient-to-br from-[#FACC15] via-[#EAB308] to-[#CA8A04] hover:brightness-110 transition-all',
            },
            React.createElement(
              'span',
              {
                className: 'font-display font-black text-4xl text-white leading-none',
                style: OUTLINE_TEXT_STYLE,
              },
              '?',
            ),
            React.createElement(
              'span',
              {
                className: 'font-display font-black text-[10px] uppercase tracking-wider text-white mt-1',
                style: OUTLINE_TEXT_STYLE,
              },
              'RANDOM',
            ),
          ),
        ),
      ),
    ),
  );
}
