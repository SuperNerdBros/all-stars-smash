import type { PalettePreset, PixelChart } from './palette';

export type GraphicsEra = 'NES' | 'SNES_SEGA';

export type RetroEra = 'NES' | 'SNES' | 'SEGA';

export type ArchetypeId =
  | 'brawler'
  | 'high-jumper'
  | 'sword-hero'
  | 'zoner'
  | 'speedster'
  | 'heavy-gunner'
  | 'floaty-puff'
  | 'heavy-grappler'
  | 'whip-hunter'
  | 'shinobi'
  | 'sky-archer'
  | 'boxer';

export interface EraSpritePack {
  pixelChart: PixelChart;
  palettes: PalettePreset[];
}

export interface HitboxDef {
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
}

export interface ProjectileDef {
  speedX: number;
  speedY: number;
  gravity: number;
  radius: number;
  lifetime: number;
  colorIndex: number;
  glowIndex: number;
  bounces?: boolean;
}

export interface MoveFrameData {
  name: string;
  startup: number;
  active: number;
  endlag: number;
  hitbox: HitboxDef;
  damage: number;
  baseKnockback: number;
  knockbackGrowth: number;
  launchAngleDeg: number;
  hitstop: number;
  velocityBoostX?: number;
  velocityBoostY?: number;
  projectile?: ProjectileDef;
}

export interface FighterStats {
  weight: number;
  runSpeed: number;
  airSpeed: number;
  jumpForce: number;
  doubleJumpForce: number;
  maxJumps: number;
  gravity: number;
  fallSpeed: number;
  fastFallSpeed: number;
  traction: number;
}

export interface FighterMoveset {
  jab: MoveFrameData;
  smash: MoveFrameData;
  aerial: MoveFrameData;
  neutralSpecial: MoveFrameData;
  upSpecial: MoveFrameData;
}

export interface FighterBlueprint {
  id: string;
  name: string;
  nickname?: string;
  era: RetroEra;
  originTag: string;
  archetype: ArchetypeId;
  archetypeLabel: string;
  gridSize: number;
  palettes: PalettePreset[];
  pixelChart: PixelChart;
  /** Optional authentic dual-era packs toggled live between 8-bit NES and 16-bit SNES/SEGA */
  eraPacks?: Record<GraphicsEra, EraSpritePack>;
  stats: FighterStats;
  moveset: FighterMoveset;
  isCustom?: boolean;
}
