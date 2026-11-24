export type AnimState =
  | 'idle'
  | 'walk'
  | 'jump'
  | 'attack'
  | 'smash'
  | 'special'
  | 'hurt';

export const ANIM_STATES: readonly AnimState[] = [
  'idle',
  'walk',
  'jump',
  'attack',
  'smash',
  'special',
  'hurt',
] as const;

/** 2D matrix of semantic palette indices (0 = transparent, 1-15 = palette color) */
export type IndexedFrame = number[][];

export interface AnimClip {
  frames: IndexedFrame[];
  ticksPerFrame: number;
}

export type PixelChart = Record<AnimState, AnimClip>;

/** 16-entry color table where index 0 is transparent ('') and 1-15 are hex colors */
export type ColorPalette = readonly string[];

export interface PalettePreset {
  name: string;
  colors: string[];
}

export const SEMANTIC_PALETTE_LABELS: readonly string[] = [
  'Transparent',
  'Outline / Dark',
  'Skin / Highlight',
  'Primary Main',
  'Primary Shade',
  'Secondary Main',
  'Secondary Shade',
  'Accent Bright',
  'Accent Warm',
  'Footwear / Trim',
  'Metal / Light',
  'Metal / Dark',
  'Hair / Detail',
  'Energy Core',
  'Energy Glow',
  'Pure White FX',
] as const;
