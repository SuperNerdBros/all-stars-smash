'use client';

import React from 'react';
import { ArrowLeft, Play } from 'lucide-react';
import type { StageManifest } from '../../types/stage';
import { STAGE_MANIFESTS } from '../../stages/manifests';
import { chiptuneAudio } from '../../io/chiptuneAudio';
import { ArcadeButton } from '../atoms/button';
import { StagePreviewCanvas } from '../atoms/stagePreviewCanvas';

export interface StageSelectProps {
  selectedStageId: string;
  p1Summary: string;
  p2Summary: string;
  stocks: number;
  onSelectStage: (stageId: string) => void;
  onBack: () => void;
  onLaunchMatch: () => void;
}

export function StageSelect(props: StageSelectProps): React.ReactElement {
  const {
    selectedStageId,
    p1Summary,
    p2Summary,
    stocks,
    onSelectStage,
    onBack,
    onLaunchMatch,
  } = props;

  const selectedStage: StageManifest =
    STAGE_MANIFESTS.find((s) => s.id === selectedStageId) ?? STAGE_MANIFESTS[0];

  return React.createElement(
    'div',
    { className: 'min-h-screen bg-[#0B1020] text-[#F1F5F9] flex flex-col' },

    // Top bar
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
        'div',
        { className: 'hidden md:flex items-center gap-3 text-xs text-[#94A3B8] whitespace-nowrap' },
        React.createElement('span', { className: 'text-[#EF4444] font-semibold' }, p1Summary),
        React.createElement('span', null, 'vs'),
        React.createElement('span', { className: 'text-[#3B82F6] font-semibold' }, p2Summary),
        React.createElement('span', { 'aria-hidden': 'true' }, '·'),
        React.createElement('span', { className: 'font-mono tabular-nums text-[#E2E8F0]' }, `${stocks} Stocks`),
      ),
      React.createElement(
        'div',
        { className: 'shrink-0' },
        React.createElement(ArcadeButton, {
          label: 'Start Match',
          variant: 'primary',
          icon: React.createElement(Play, { className: 'w-4 h-4' }),
          onClick: () => {
            chiptuneAudio.playMenuConfirm();
            onLaunchMatch();
          },
        }),
      ),
    ),

    React.createElement(
      'main',
      { className: 'flex-1 w-full max-w-6xl mx-auto px-6 py-8 flex flex-col gap-8' },

      React.createElement(
        'div',
        { className: 'flex flex-col sm:flex-row sm:items-center justify-between gap-4' },
        React.createElement(
          'div',
          null,
          React.createElement(
            'h1',
            { className: 'font-display text-3xl font-extrabold tracking-tight text-white [text-wrap:balance]' },
            'Select 2.5D Arena',
          ),
          React.createElement(
            'p',
            { className: 'text-sm text-[#94A3B8] mt-1' },
            'Every stage is pre-baked into 2.5D sprite-stacked slice bitmaps inside the Web Worker.',
          ),
        ),
        React.createElement(ArcadeButton, {
          label: 'Back to Fighters',
          variant: 'secondary',
          size: 'sm',
          icon: React.createElement(ArrowLeft, { className: 'w-4 h-4' }),
          onClick: () => {
            chiptuneAudio.playMenuTick();
            onBack();
          },
        }),
      ),

      // 3-Stage Card Grid
      React.createElement(
        'section',
        { className: 'grid grid-cols-1 md:grid-cols-3 gap-6' },
        ...STAGE_MANIFESTS.map((stage) => {
          const isSelected = stage.id === selectedStage.id;
          return React.createElement(
            'button',
            {
              key: stage.id,
              type: 'button',
              onClick: () => {
                chiptuneAudio.playMenuTick();
                onSelectStage(stage.id);
              },
              className: [
                'flex flex-col text-left rounded-lg bg-[#141C2F] border p-4 transition-all duration-150 cursor-pointer',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]',
                isSelected
                  ? 'border-[#F59E0B] ring-1 ring-[#F59E0B]/40 bg-[#1A243D]'
                  : 'border-[#2B3858] hover:border-[#4B6194]',
              ].join(' '),
            },
            React.createElement(StagePreviewCanvas, { stage, className: 'mb-4' }),
            React.createElement(
              'div',
              { className: 'flex items-baseline justify-between gap-2' },
              React.createElement(
                'h2',
                { className: 'font-display text-lg font-bold text-white' },
                stage.name,
              ),
              React.createElement(
                'span',
                { className: 'text-xs text-[#F59E0B] font-medium whitespace-nowrap' },
                isSelected ? 'Selected' : 'Choose',
              ),
            ),
            React.createElement(
              'div',
              { className: 'text-xs text-[#94A3B8] mt-0.5' },
              stage.layoutTag,
            ),
            React.createElement(
              'p',
              { className: 'text-sm text-[#CBD5E1] mt-2 leading-relaxed' },
              stage.description,
            ),
          );
        }),
      ),

      // Launch bar
      React.createElement(
        'div',
        {
          className:
            'flex items-center justify-between pt-4 border-t border-[#2B3858]/70 gap-4',
        },
        React.createElement(
          'div',
          { className: 'text-sm text-[#94A3B8]' },
          `Arena ready: `,
          React.createElement('span', { className: 'text-white font-semibold' }, selectedStage.name),
          ` · ${selectedStage.volumes.filter((v) => !v.decorative).length} combat surfaces`,
        ),
        React.createElement(ArcadeButton, {
          label: `Fight on ${selectedStage.name}`,
          variant: 'primary',
          size: 'lg',
          icon: React.createElement(Play, { className: 'w-4 h-4' }),
          onClick: () => {
            chiptuneAudio.playMenuConfirm();
            onLaunchMatch();
          },
        }),
      ),
    ),
  );
}
