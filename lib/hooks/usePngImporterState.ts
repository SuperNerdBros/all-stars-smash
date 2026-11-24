'use client';

import { useEffect, useState } from 'react';
import type { ArchetypeId, FighterBlueprint } from '../types/fighter';
import { quantizeImageToFighter, type QuantizedImportResult } from '../io/pngImporter';
import { chiptuneAudio } from '../io/chiptuneAudio';

interface PngImporterState {
  sourceImg: HTMLImageElement | null;
  name: string;
  cols: number;
  rows: number;
  targetSize: 16 | 24 | 32;
  tolerance: number;
  archetype: ArchetypeId;
  result: QuantizedImportResult | null;
  errorMsg: string | null;
}

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

export function usePngImporterState(
  onRegisterFighter: (fighter: FighterBlueprint) => void,
  onClose: () => void,
) {
  const [state, setState] = useState<PngImporterState>({
    sourceImg: null,
    name: 'Custom Sprite',
    cols: 4,
    rows: 1,
    targetSize: 16,
    tolerance: 28,
    archetype: 'brawler',
    result: null,
    errorMsg: null,
  });

  const loadDataUrl = (url: string, suggestedName?: string) => {
    const img = new Image();
    img.onload = () => {
      setState((prev) => ({
        ...prev,
        sourceImg: img,
        errorMsg: null,
        name: suggestedName ?? prev.name,
      }));
    };
    img.onerror = () => {
      setState((prev) => ({ ...prev, errorMsg: 'Could not decode PNG image.' }));
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
    setState((prev) => ({ ...prev, cols: 4, rows: 1, targetSize: 16 }));
    loadDataUrl(generateSampleMagentaSheetDataUrl(), 'Cyber Knight');
  };

  const { sourceImg, name, cols, rows, targetSize, tolerance, archetype } = state;

  useEffect(() => {
    if (!sourceImg) return;
    const timer = window.setTimeout(() => {
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
        setState((prev) => ({ ...prev, result: quantized, errorMsg: null }));
      } catch (err) {
        setState((prev) => ({
          ...prev,
          errorMsg: err instanceof Error ? err.message : 'Quantization failed',
        }));
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [sourceImg, name, cols, rows, targetSize, tolerance, archetype]);

  const handleRegister = () => {
    if (!state.result) return;
    chiptuneAudio.playMenuConfirm();
    onRegisterFighter(state.result.blueprint);
    onClose();
  };

  return {
    state,
    update: (patch: Partial<PngImporterState>) => setState((prev) => ({ ...prev, ...patch })),
    handleFileChange,
    handleLoadSample,
    handleRegister,
  };
}
