import type { PalettePreset, PixelChart } from './palette';
import type { HitboxSpec, MoveElement, MoveSlot } from './moves';

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

/**
 * Per-move authoring schema (spec §5).
 *
 * Units: frames at 60Hz; `baseKnockback` is in legacy roster units (×8.5 = Smash-style `b`);
 * `knockbackGrowth` is Smash-style `s` (100 = neutral); `launchAngleDeg` is 0 = forward,
 * 90 = straight up, negative = downward (meteor).
 */
export interface MoveFrameData {
  name: string;
  startup: number;
  active: number;
  endlag: number;
  /** Primary hitbox. Treated as id 0 when `hitboxes` is not given. */
  hitbox: HitboxDef;
  damage: number;
  baseKnockback: number;
  knockbackGrowth: number;
  launchAngleDeg: number;
  /** @deprecated Hitstop is now computed from damage (see combatFormulas). Kept for old data. */
  hitstop: number;
  velocityBoostX?: number;
  velocityBoostY?: number;
  projectile?: ProjectileDef;

  /** Extra / replacement hitboxes resolved by lowest id (spec §3.3). */
  hitboxes?: HitboxSpec[];
  /** Lock target weight to 100 for consistent combo trajectories. */
  weightIndependent?: boolean;
  /** Per-move hitstop multiplier `h`. Default 1. */
  hitlagMult?: number;
  element?: MoveElement;
  /** Aerials: frames of lag when landing mid-move. */
  landingLag?: number;
  /** Smash attacks: hold the button to charge for up to 60 frames (×1.4 damage). */
  chargeable?: boolean;
  /** Re-hit every N frames while active (multi-hit moves; SDI-able). */
  multiHitInterval?: number;
  /** Frames [from, to) of intangibility relative to move start. */
  intangible?: [number, number];
  /** Heavy armor: ignores knockback below this kb value while the move runs. */
  armorKb?: number;
}

/** Per-slot override: any subset of fields, merged over the derived template. */
export type MoveOverride = Partial<Omit<MoveFrameData, 'hitbox'>> & { hitbox?: Partial<HitboxDef> };

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
  /** Frames between jump press and liftoff. Default 3 (spec §3.2). */
  jumpSquat?: number;
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
  /** The 5 core moves every fighter authors; the full matrix is derived from these. */
  moveset: FighterMoveset;
  /** Optional per-slot overrides for the full 23-slot matrix (see lib/types/moves.ts). */
  moves?: Partial<Record<MoveSlot, MoveOverride>>;
  isCustom?: boolean;
}
