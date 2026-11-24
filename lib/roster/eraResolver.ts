import type { FighterBlueprint, GraphicsEra } from '../types/fighter';

/**
 * Resolves a FighterBlueprint to the active console era's sprite chart and hardware palettes.
 * Custom/PNG-imported fighters without explicit eraPacks transparently keep their authored chart.
 */
export function resolveFighterForEra(
  fighter: FighterBlueprint,
  era: GraphicsEra,
): FighterBlueprint {
  const pack = fighter.eraPacks?.[era];
  if (!pack) return fighter;
  const firstFrame = pack.pixelChart.idle.frames[0];
  const resolvedH = firstFrame?.length ?? fighter.gridSize;
  const resolvedW = firstFrame?.[0]?.length ?? resolvedH;
  return {
    ...fighter,
    gridSize: Math.max(resolvedW, resolvedH),
    pixelChart: pack.pixelChart,
    palettes: pack.palettes,
  };
}

export function getEraLabel(era: GraphicsEra): string {
  return era === 'NES' ? '8-Bit NES' : '16-Bit SNES / SEGA';
}

export function getEraShortLabel(era: GraphicsEra): string {
  return era === 'NES' ? 'NES 8-BIT' : 'SNES / SEGA';
}
