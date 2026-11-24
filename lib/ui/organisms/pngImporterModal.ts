'use client';

import React, { useEffect, useState } from 'react';
import { Check, Sparkles, Upload, X } from 'lucide-react';
import type { ArchetypeId, FighterBlueprint } from '../../types/fighter';
import { quantizeImageToFighter, type QuantizedImportResult } from '../../io/pngImporter';
import { chiptuneAudio } from '../../io/chiptuneAudio';
import { ArcadeButton } from '../atoms/button';
import { SpriteCanvas } from '../atoms/spriteCanvas';

export interface PngImporterModalProps {
  onClose: () => void;
  onRegisterFighter: (fighter: FighterBlueprint) => void;
}

const ARCHETYPES: ReadonlyArray<{ id: ArchetypeId; label: string }> = [
  { id: 'brawler', label: 'Balanced Brawler (Mario)' },
  { id: 'high-jumper', label: 'Floaty High-Jumper (Luigi)' },
  { id: 'sword-hero', label: 'Sword & Shield (Link)' },
  { id: 'zoner', label: 'Arm-Cannon Zoner (Mega Man)' },
  { id: 'speedster', label: 'Hyper Speedster (Sonic)' },
  { id: 'heavy-gunner', label: 'Heavy Gunner (Samus)' },
];

/** Generates a synthetic 4x1 sprite sheet on #FF00FF magenta so users can test import in one click. */
function generateSampleMagentaSheetDataUrl(): string {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 16;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#FF00FF';
  ctx.fillRect(0, 0, 64, 16);

  for (let f = 0; f < 4; f++) {
    const ox = f * 16;
    const bounce = f % 2 === 1 ? -1 : 0;
    // Retro Knight Silhouette on #FF00FF
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(ox + 4, 2 + bounce, 8, 5);
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(ox + 5, 3 + bounce, 6, 2);
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(ox + 6, 1 + bounce, 4, 1);
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(ox + 4, 7 + bounce, 8, 5);
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(ox + 2, 8 + bounce, 2, 4);
    // Swinging energy blade on frame 2 & 3
    if (f >= 2) {
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(ox + 12, 5 + bounce, 3, 6);
    }
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(ox + 4 + (f % 2), 12, 3, 3);
    ctx.fillRect(ox + 9 - (f % 2), 12, 3, 3);
  }
  return c.toDataURL('image/png');
}

export function PngImporterModal(props: PngImporterModalProps): React.ReactElement {
  const { onClose, onRegisterFighter } = props;

  const [sourceImg, setSourceImg] = useState<HTMLImageElement | null>(null);
  const [name, setName] = useState<string>('Custom Sprite');
  const [cols, setCols] = useState<number>(4);
  const [rows, setRows] = useState<number>(1);
  const [targetSize, setTargetSize] = useState<16 | 24>(16);
  const [tolerance, setTolerance] = useState<number>(28);
  const [archetype, setArchetype] = useState<ArchetypeId>('brawler');
  const [result, setResult] = useState<QuantizedImportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadDataUrl = (url: string, suggestedName?: string) => {
    const img = new Image();
    img.onload = () => {
      setErrorMsg(null);
      setSourceImg(img);
      if (suggestedName) setName(suggestedName);
    };
    img.onerror = () => {
      setErrorMsg('Could not decode PNG image.');
    };
    img.src = url;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const clean = file.name.replace(/\.[^.]+$/, '').slice(0, 18);
        loadDataUrl(reader.result, clean);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLoadSample = () => {
    chiptuneAudio.playMenuTick();
    setCols(4);
    setRows(1);
    setTargetSize(16);
    loadDataUrl(generateSampleMagentaSheetDataUrl(), 'Cyber Knight');
  };

  useEffect(() => {
    if (!sourceImg) return;
    try {
      const quantized = quantizeImageToFighter(sourceImg, {
        name,
        cols,
        rows,
        targetSize,
        magentaTolerance: tolerance,
        archetype,
        ticksPerFrame: 8,
      });
      setResult(quantized);
      setErrorMsg(null);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Quantization failed');
    }
  }, [sourceImg, name, cols, rows, targetSize, tolerance, archetype]);

  const handleRegister = () => {
    if (!result) return;
    chiptuneAudio.playMenuConfirm();
    onRegisterFighter(result.blueprint);
    onClose();
  };

  return React.createElement(
    'div',
    {
      className:
        'fixed inset-0 z-40 bg-[#070B16]/80 backdrop-blur-xs flex items-center justify-center p-4',
    },
    React.createElement(
      'div',
      {
        className:
          'w-full max-w-2xl rounded-lg bg-[#0E1529] border border-[#2B3858] flex flex-col max-h-[92vh] overflow-hidden',
      },

      // Header
      React.createElement(
        'div',
        { className: 'flex items-center justify-between gap-4 px-6 py-4 border-b border-[#2B3858]' },
        React.createElement(
          'div',
          null,
          React.createElement(
            'h2',
            { className: 'font-display text-xl font-bold text-white' },
            'PNG-to-Indexed-Chart Importer',
          ),
          React.createElement(
            'p',
            { className: 'text-xs text-[#94A3B8] mt-0.5' },
            'Strips #FF00FF magenta backgrounds, quantizes into 16 colors, slices grid frames, and registers a playable fighter.',
          ),
        ),
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: onClose,
            'aria-label': 'Close PNG Importer',
            className: 'p-2 rounded-md bg-[#141C2F] hover:bg-[#1D2740] text-[#CBD5E1] cursor-pointer',
          },
          React.createElement(X, { className: 'w-4 h-4' }),
        ),
      ),

      // Content
      React.createElement(
        'div',
        { className: 'flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5' },

        // Upload + Sample trigger row
        React.createElement(
          'div',
          { className: 'flex flex-wrap items-center gap-3' },
          React.createElement(
            'label',
            {
              className:
                'inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#1D2740] hover:bg-[#263455] border border-[#2B3858] text-sm font-medium text-white cursor-pointer whitespace-nowrap',
            },
            React.createElement(Upload, { className: 'w-4 h-4 text-[#38BDF8]' }),
            'Upload PNG Sprite Sheet',
            React.createElement('input', {
              type: 'file',
              accept: 'image/png,image/gif,image/webp',
              onChange: handleFileChange,
              className: 'hidden',
            }),
          ),
          React.createElement(ArcadeButton, {
            label: 'Try Sample #FF00FF Sheet',
            variant: 'secondary',
            size: 'md',
            icon: React.createElement(Sparkles, { className: 'w-4 h-4 text-[#F59E0B]' }),
            onClick: handleLoadSample,
          }),
        ),

        // Grid & Quantization Settings
        React.createElement(
          'div',
          { className: 'grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg bg-[#141C2F] border border-[#2B3858] p-4' },
          React.createElement(
            'label',
            { className: 'flex flex-col gap-1 text-xs text-[#94A3B8]' },
            'Fighter Name',
            React.createElement('input', {
              type: 'text',
              value: name,
              maxLength: 20,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value),
              className:
                'bg-[#0B1020] border border-[#2B3858] rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#F59E0B]',
            }),
          ),
          React.createElement(
            'label',
            { className: 'flex flex-col gap-1 text-xs text-[#94A3B8]' },
            'Moveset Archetype',
            React.createElement(
              'select',
              {
                value: archetype,
                onChange: (e: React.ChangeEvent<HTMLSelectElement>) =>
                  setArchetype(e.target.value as ArchetypeId),
                className:
                  'bg-[#0B1020] border border-[#2B3858] rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#F59E0B]',
              },
              ...ARCHETYPES.map((a) =>
                React.createElement('option', { key: a.id, value: a.id }, a.label),
              ),
            ),
          ),
          React.createElement(
            'div',
            { className: 'grid grid-cols-2 gap-2' },
            React.createElement(
              'label',
              { className: 'flex flex-col gap-1 text-xs text-[#94A3B8]' },
              'Grid Columns',
              React.createElement('input', {
                type: 'number',
                min: 1,
                max: 12,
                value: cols,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                  setCols(Math.max(1, Number(e.target.value) || 1)),
                className:
                  'bg-[#0B1020] border border-[#2B3858] rounded px-2.5 py-1.5 text-sm font-mono tabular-nums text-white',
              }),
            ),
            React.createElement(
              'label',
              { className: 'flex flex-col gap-1 text-xs text-[#94A3B8]' },
              'Grid Rows',
              React.createElement('input', {
                type: 'number',
                min: 1,
                max: 12,
                value: rows,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                  setRows(Math.max(1, Number(e.target.value) || 1)),
                className:
                  'bg-[#0B1020] border border-[#2B3858] rounded px-2.5 py-1.5 text-sm font-mono tabular-nums text-white',
              }),
            ),
          ),
          React.createElement(
            'div',
            { className: 'flex flex-col gap-2' },
            React.createElement(
              'div',
              { className: 'flex items-center justify-between text-xs text-[#94A3B8]' },
              React.createElement('span', null, 'Target Resolution'),
              React.createElement(
                'div',
                { className: 'flex gap-1' },
                ...([16, 24] as const).map((sz) =>
                  React.createElement(
                    'button',
                    {
                      key: sz,
                      type: 'button',
                      onClick: () => setTargetSize(sz),
                      className: [
                        'px-2.5 py-0.5 rounded font-mono text-xs cursor-pointer',
                        targetSize === sz
                          ? 'bg-[#F59E0B] text-[#0B1020] font-bold'
                          : 'bg-[#0B1020] text-[#CBD5E1]',
                      ].join(' '),
                    },
                    `${sz}×${sz}`,
                  ),
                ),
              ),
            ),
            React.createElement(
              'div',
              { className: 'flex items-center justify-between gap-2 text-xs text-[#94A3B8]' },
              React.createElement('span', null, '#FF00FF Key Tol.'),
              React.createElement('input', {
                type: 'range',
                min: 5,
                max: 90,
                value: tolerance,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                  setTolerance(Number(e.target.value)),
                className: 'flex-1 accent-[#F59E0B]',
              }),
              React.createElement('span', { className: 'font-mono tabular-nums text-white' }, String(tolerance)),
            ),
          ),
        ),

        errorMsg
          ? React.createElement(
              'div',
              { className: 'text-xs text-[#FCA5A5] bg-[#7F1D1D]/40 border border-[#EF4444]/40 rounded px-3 py-2' },
              errorMsg,
            )
          : null,

        // Live Quantized Preview
        result
          ? React.createElement(
              'div',
              { className: 'rounded-lg bg-[#141C2F] border border-[#2B3858] p-4 flex flex-col sm:flex-row items-center gap-5' },
              React.createElement(
                'div',
                { className: 'w-28 h-28 rounded-md bg-[#0B1020] border border-[#2B3858] flex items-center justify-center shrink-0' },
                React.createElement(SpriteCanvas, {
                  pixelChart: result.pixelChart,
                  palette: result.palette,
                  animState: 'walk',
                  sizePx: 96,
                  animate: true,
                }),
              ),
              React.createElement(
                'div',
                { className: 'flex-1 flex flex-col gap-2' },
                React.createElement(
                  'div',
                  { className: 'text-sm font-semibold text-white' },
                  `${result.blueprint.name} · ${result.frames.length} Quantized Frames (${targetSize}×${targetSize})`,
                ),
                React.createElement(
                  'div',
                  { className: 'text-xs text-[#94A3B8]' },
                  'Extracted 16-color indexed palette (slot 0 = transparent):',
                ),
                React.createElement(
                  'div',
                  { className: 'flex flex-wrap gap-1.5' },
                  ...result.palette.slice(1).map((hex, i) =>
                    React.createElement('span', {
                      key: i,
                      title: `${i + 1}: ${hex}`,
                      style: { backgroundColor: hex },
                      className: 'w-5 h-5 rounded-xs border border-white/20',
                    }),
                  ),
                ),
              ),
            )
          : React.createElement(
              'div',
              { className: 'rounded-lg border border-dashed border-[#2B3858] p-8 text-center text-sm text-[#94A3B8]' },
              'Upload a PNG sprite sheet (such as a 5×6 grid on #FF00FF magenta) or click "Try Sample #FF00FF Sheet" above to preview quantization.',
            ),
      ),

      // Footer
      React.createElement(
        'div',
        { className: 'flex items-center justify-end gap-3 px-6 py-4 border-t border-[#2B3858] bg-[#0B1020]' },
        React.createElement(ArcadeButton, {
          label: 'Cancel',
          variant: 'ghost',
          onClick: onClose,
        }),
        React.createElement(ArcadeButton, {
          label: 'Register Fighter',
          variant: 'primary',
          disabled: !result,
          icon: React.createElement(Check, { className: 'w-4 h-4' }),
          onClick: handleRegister,
        }),
      ),
    ),
  );
}
