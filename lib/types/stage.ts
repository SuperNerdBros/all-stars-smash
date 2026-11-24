export type StagePattern =
  | 'grass-stone'
  | 'brick-fortress'
  | 'obsidian-gold'
  | 'crystal-pillar'
  | 'cloud-deck'
  | 'wood-bridge';

export interface SpriteStackVolume {
  id: string;
  /** World X center on 2D combat plane */
  x: number;
  /** World Y top surface (higher Y = further down in screen-aligned 2D physics, lower Y = higher altitude) */
  topY: number;
  /** Depth center along Z axis */
  z: number;
  width: number;
  height: number;
  depth: number;
  slices: number;
  passThrough: boolean;
  decorative?: boolean;
  pattern: StagePattern;
  topColor: string;
  midColor: string;
  sideColor: string;
  trimColor: string;
}

export interface BlastZones {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface SkyPalette {
  zenith: string;
  mid: string;
  horizon: string;
  starColor?: string;
  sunColor?: string;
  mountainFar: string;
  mountainNear: string;
}

export interface CloudConfig {
  count: number;
  baseColor: string;
  shadeColor: string;
  speed: number;
  minY: number;
  maxY: number;
}

export interface StageManifest {
  id: string;
  name: string;
  layoutTag: string;
  description: string;
  sky: SkyPalette;
  clouds: CloudConfig;
  blastZones: BlastZones;
  spawnPoints: [
    { x: number; y: number },
    { x: number; y: number },
  ];
  volumes: SpriteStackVolume[];
}
