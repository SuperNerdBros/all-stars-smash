import type {
  CloudConfig,
  PlatformMotion,
  SkyPalette,
  SpriteStackVolume,
  StageManifest,
  StagePattern,
  StageVfxKind,
  SurfaceEffect,
} from '../types/stage';
import { STAGE_BACKDROPS } from '../engine/backdropLoader';

export const SSBU_SOUNDCLOUD_PROFILE_URL = 'https://soundcloud.com/ssbu-ost';

type LayoutArchetype =
  | 'battlefield'
  | 'final-dest'
  | 'dual-towers'
  | 'pipe-plaza'
  | 'lava-bridge'
  | 'temple-tiers'
  | 'cavern-walls'
  | 'boxing-ring'
  | 'ship-deck'
  | 'pagoda-spire'
  | 'stepped-pyramid'
  | 'sky-islands';

interface VolumePatch {
  motion?: PlatformMotion;
  surfaceEffect?: SurfaceEffect;
  springPower?: number;
  conveyorSpeed?: number;
}

interface StageSeed {
  id: string;
  name: string;
  series: string;
  layoutTag: string;
  description: string;
  ostTitle: string;
  ostTrackIndex: number;
  soundCloudUrl: string;
  backdropImage: string;
  vfx: StageVfxKind;
  layout: LayoutArchetype;
  sky: SkyPalette;
  clouds: CloudConfig;
  mainPattern: StagePattern;
  platPattern: StagePattern;
  patches?: Record<string, VolumePatch>;
  colors: {
    top: string;
    mid: string;
    side: string;
    trim: string;
    platTop: string;
    platMid: string;
    platSide: string;
    platTrim: string;
    accentTop?: string;
    accentMid?: string;
    accentSide?: string;
    accentTrim?: string;
  };
}

type LayoutBuilder = (
  seed: StageSeed,
  accent: { top: string; mid: string; side: string; trim: string },
) => SpriteStackVolume[];

const LAYOUT_BUILDERS: Record<LayoutArchetype, LayoutBuilder> = {
  'pipe-plaza': (s, a) => {
    const c = s.colors;
    return [
      { id: 'floor', x: 0, topY: 44, z: 0, width: 244, height: 34, depth: 48, slices: 9, passThrough: false, pattern: s.mainPattern, topColor: c.top, midColor: c.mid, sideColor: c.side, trimColor: c.trim },
      { id: 'pipe-l', x: -94, topY: 10, z: 0, width: 30, height: 34, depth: 30, slices: 8, passThrough: false, pattern: 'crystal-pillar', topColor: a.top, midColor: a.mid, sideColor: a.side, trimColor: a.trim },
      { id: 'pipe-r', x: 94, topY: 10, z: 0, width: 30, height: 34, depth: 30, slices: 8, passThrough: false, pattern: 'crystal-pillar', topColor: a.top, midColor: a.mid, sideColor: a.side, trimColor: a.trim },
      { id: 'q-blocks', x: 0, topY: -12, z: 0, width: 76, height: 10, depth: 26, slices: 4, passThrough: true, pattern: s.platPattern, topColor: c.platTop, midColor: c.platMid, sideColor: c.platSide, trimColor: c.platTrim },
      { id: 'high-brick', x: 0, topY: -54, z: 0, width: 56, height: 9, depth: 24, slices: 4, passThrough: true, pattern: s.platPattern, topColor: c.platTop, midColor: c.platMid, sideColor: c.platSide, trimColor: c.platTrim },
    ];
  },
  'lava-bridge': (s, a) => {
    const c = s.colors;
    return [
      { id: 'bridge-core', x: 0, topY: 44, z: 0, width: 236, height: 22, depth: 44, slices: 8, passThrough: false, pattern: s.mainPattern, topColor: c.top, midColor: c.mid, sideColor: c.side, trimColor: c.trim },
      { id: 'pillar-l', x: -102, topY: 16, z: -26, width: 28, height: 74, depth: 22, slices: 7, passThrough: false, decorative: true, pattern: 'brick-fortress', topColor: a.top, midColor: a.mid, sideColor: a.side, trimColor: a.trim },
      { id: 'pillar-r', x: 102, topY: 16, z: -26, width: 28, height: 74, depth: 22, slices: 7, passThrough: false, decorative: true, pattern: 'brick-fortress', topColor: a.top, midColor: a.mid, sideColor: a.side, trimColor: a.trim },
      { id: 'grate-l', x: -64, topY: -8, z: 0, width: 64, height: 9, depth: 26, slices: 4, passThrough: true, pattern: s.platPattern, topColor: c.platTop, midColor: c.platMid, sideColor: c.platSide, trimColor: c.platTrim },
      { id: 'grate-r', x: 64, topY: -8, z: 0, width: 64, height: 9, depth: 26, slices: 4, passThrough: true, pattern: s.platPattern, topColor: c.platTop, midColor: c.platMid, sideColor: c.platSide, trimColor: c.platTrim },
    ];
  },
  'temple-tiers': (s) => {
    const c = s.colors;
    return [
      { id: 'lower-sanctum', x: -34, topY: 50, z: 0, width: 170, height: 32, depth: 48, slices: 9, passThrough: false, pattern: s.mainPattern, topColor: c.top, midColor: c.mid, sideColor: c.side, trimColor: c.trim },
      { id: 'east-cliff', x: 96, topY: 24, z: 0, width: 84, height: 56, depth: 46, slices: 10, passThrough: false, pattern: s.mainPattern, topColor: c.top, midColor: c.mid, sideColor: c.side, trimColor: c.trim },
      { id: 'mid-arch', x: -56, topY: 0, z: 0, width: 78, height: 9, depth: 28, slices: 4, passThrough: true, pattern: s.platPattern, topColor: c.platTop, midColor: c.platMid, sideColor: c.platSide, trimColor: c.platTrim },
      { id: 'high-pavilion', x: 24, topY: -36, z: 0, width: 86, height: 9, depth: 28, slices: 4, passThrough: true, pattern: s.platPattern, topColor: c.platTop, midColor: c.platMid, sideColor: c.platSide, trimColor: c.platTrim },
    ];
  },
  'cavern-walls': (s, a) => {
    const c = s.colors;
    return [
      { id: 'cavern-floor', x: 0, topY: 46, z: 0, width: 224, height: 36, depth: 48, slices: 9, passThrough: false, pattern: s.mainPattern, topColor: c.top, midColor: c.mid, sideColor: c.side, trimColor: c.trim },
      { id: 'wall-l', x: -116, topY: -20, z: 0, width: 24, height: 102, depth: 36, slices: 9, passThrough: false, pattern: 'obsidian-gold', topColor: a.top, midColor: a.mid, sideColor: a.side, trimColor: a.trim },
      { id: 'wall-r', x: 116, topY: -20, z: 0, width: 24, height: 102, depth: 36, slices: 9, passThrough: false, pattern: 'obsidian-gold', topColor: a.top, midColor: a.mid, sideColor: a.side, trimColor: a.trim },
      { id: 'mid-ledge', x: 0, topY: -4, z: 0, width: 72, height: 9, depth: 26, slices: 4, passThrough: true, pattern: s.platPattern, topColor: c.platTop, midColor: c.platMid, sideColor: c.platSide, trimColor: c.platTrim },
      { id: 'top-ledge', x: 0, topY: -48, z: 0, width: 58, height: 9, depth: 24, slices: 4, passThrough: true, pattern: s.platPattern, topColor: c.platTop, midColor: c.platMid, sideColor: c.platSide, trimColor: c.platTrim },
    ];
  },
  'boxing-ring': (s, a) => {
    const c = s.colors;
    return [
      { id: 'ring-canvas', x: 0, topY: 44, z: 0, width: 260, height: 32, depth: 56, slices: 9, passThrough: false, pattern: s.mainPattern, topColor: c.top, midColor: c.mid, sideColor: c.side, trimColor: c.trim },
      { id: 'post-l', x: -116, topY: 16, z: -22, width: 14, height: 32, depth: 14, slices: 6, passThrough: false, decorative: true, pattern: 'crystal-pillar', topColor: a.top, midColor: a.mid, sideColor: a.side, trimColor: a.trim },
      { id: 'post-r', x: 116, topY: 16, z: -22, width: 14, height: 32, depth: 14, slices: 6, passThrough: false, decorative: true, pattern: 'crystal-pillar', topColor: a.top, midColor: a.mid, sideColor: a.side, trimColor: a.trim },
      { id: 'jumbotron', x: 0, topY: -44, z: 0, width: 92, height: 14, depth: 30, slices: 5, passThrough: true, pattern: s.platPattern, topColor: c.platTop, midColor: c.platMid, sideColor: c.platSide, trimColor: c.platTrim },
    ];
  },
  'ship-deck': (s, a) => {
    const c = s.colors;
    return [
      { id: 'hull-main', x: -16, topY: 44, z: 0, width: 224, height: 30, depth: 50, slices: 9, passThrough: false, pattern: s.mainPattern, topColor: c.top, midColor: c.mid, sideColor: c.side, trimColor: c.trim },
      { id: 'bridge-tower', x: 84, topY: 12, z: 0, width: 66, height: 62, depth: 44, slices: 9, passThrough: false, pattern: 'obsidian-gold', topColor: a.top, midColor: a.mid, sideColor: a.side, trimColor: a.trim },
      { id: 'wing-plat', x: -84, topY: -2, z: 0, width: 64, height: 9, depth: 26, slices: 4, passThrough: true, pattern: s.platPattern, topColor: c.platTop, midColor: c.platMid, sideColor: c.platSide, trimColor: c.platTrim },
      { id: 'radar-deck', x: 78, topY: -32, z: 0, width: 58, height: 9, depth: 24, slices: 4, passThrough: true, pattern: s.platPattern, topColor: c.platTop, midColor: c.platMid, sideColor: c.platSide, trimColor: c.platTrim },
    ];
  },
  'pagoda-spire': (s, a) => {
    const c = s.colors;
    return [
      { id: 'pagoda-base', x: 0, topY: 46, z: 0, width: 230, height: 34, depth: 48, slices: 9, passThrough: false, pattern: s.mainPattern, topColor: c.top, midColor: c.mid, sideColor: c.side, trimColor: c.trim },
      { id: 'eave-l', x: -72, topY: 2, z: 0, width: 64, height: 9, depth: 28, slices: 4, passThrough: true, pattern: s.platPattern, topColor: c.platTop, midColor: c.platMid, sideColor: c.platSide, trimColor: c.platTrim },
      { id: 'eave-r', x: 72, topY: 2, z: 0, width: 64, height: 9, depth: 28, slices: 4, passThrough: true, pattern: s.platPattern, topColor: c.platTop, midColor: c.platMid, sideColor: c.platSide, trimColor: c.platTrim },
      { id: 'eave-mid', x: 0, topY: -34, z: 0, width: 92, height: 9, depth: 26, slices: 4, passThrough: true, pattern: s.platPattern, topColor: a.top, midColor: a.mid, sideColor: a.side, trimColor: a.trim },
      { id: 'eave-peak', x: 0, topY: -70, z: 0, width: 48, height: 9, depth: 22, slices: 4, passThrough: true, pattern: s.platPattern, topColor: a.top, midColor: a.mid, sideColor: a.side, trimColor: a.trim },
    ];
  },
  'stepped-pyramid': (s, a) => {
    const c = s.colors;
    return [
      { id: 'tier-1', x: 0, topY: 48, z: 0, width: 248, height: 28, depth: 50, slices: 8, passThrough: false, pattern: s.mainPattern, topColor: c.top, midColor: c.mid, sideColor: c.side, trimColor: c.trim },
      { id: 'tier-2', x: 0, topY: 24, z: 0, width: 132, height: 24, depth: 38, slices: 6, passThrough: false, pattern: s.mainPattern, topColor: a.top, midColor: a.mid, sideColor: a.side, trimColor: a.trim },
      { id: 'side-l', x: -86, topY: -8, z: 0, width: 54, height: 9, depth: 24, slices: 4, passThrough: true, pattern: s.platPattern, topColor: c.platTop, midColor: c.platMid, sideColor: c.platSide, trimColor: c.platTrim },
      { id: 'side-r', x: 86, topY: -8, z: 0, width: 54, height: 9, depth: 24, slices: 4, passThrough: true, pattern: s.platPattern, topColor: c.platTop, midColor: c.platMid, sideColor: c.platSide, trimColor: c.platTrim },
    ];
  },
  'sky-islands': (s) => {
    const c = s.colors;
    return [
      { id: 'isle-l', x: -84, topY: 40, z: 0, width: 88, height: 28, depth: 42, slices: 8, passThrough: false, pattern: s.mainPattern, topColor: c.top, midColor: c.mid, sideColor: c.side, trimColor: c.trim },
      { id: 'isle-r', x: 84, topY: 40, z: 0, width: 88, height: 28, depth: 42, slices: 8, passThrough: false, pattern: s.mainPattern, topColor: c.top, midColor: c.mid, sideColor: c.side, trimColor: c.trim },
      { id: 'cloud-mid', x: 0, topY: 16, z: 0, width: 64, height: 10, depth: 28, slices: 4, passThrough: true, pattern: s.platPattern, topColor: c.platTop, midColor: c.platMid, sideColor: c.platSide, trimColor: c.platTrim },
      { id: 'cloud-high-l', x: -64, topY: -28, z: 0, width: 56, height: 9, depth: 24, slices: 4, passThrough: true, pattern: s.platPattern, topColor: c.platTop, midColor: c.platMid, sideColor: c.platSide, trimColor: c.platTrim },
      { id: 'cloud-high-r', x: 64, topY: -28, z: 0, width: 56, height: 9, depth: 24, slices: 4, passThrough: true, pattern: s.platPattern, topColor: c.platTop, midColor: c.platMid, sideColor: c.platSide, trimColor: c.platTrim },
    ];
  },
  'dual-towers': (s, a) => {
    const c = s.colors;
    return [
      { id: 'tower-l', x: -76, topY: 40, z: 0, width: 96, height: 48, depth: 46, slices: 9, passThrough: false, pattern: s.mainPattern, topColor: c.top, midColor: c.mid, sideColor: c.side, trimColor: c.trim },
      { id: 'tower-r', x: 76, topY: 40, z: 0, width: 96, height: 48, depth: 46, slices: 9, passThrough: false, pattern: s.mainPattern, topColor: c.top, midColor: c.mid, sideColor: c.side, trimColor: c.trim },
      { id: 'span-mid', x: 0, topY: 22, z: 0, width: 64, height: 9, depth: 28, slices: 4, passThrough: true, pattern: s.platPattern, topColor: c.platTop, midColor: c.platMid, sideColor: c.platSide, trimColor: c.platTrim },
      { id: 'top-arch', x: 0, topY: -34, z: 0, width: 78, height: 9, depth: 26, slices: 4, passThrough: true, pattern: s.platPattern, topColor: a.top, midColor: a.mid, sideColor: a.side, trimColor: a.trim },
    ];
  },
  'final-dest': (s, a) => {
    const c = s.colors;
    return [
      { id: 'flat-main', x: 0, topY: 44, z: 0, width: 252, height: 32, depth: 52, slices: 10, passThrough: false, pattern: s.mainPattern, topColor: c.top, midColor: c.mid, sideColor: c.side, trimColor: c.trim },
      { id: 'flat-keel', x: 0, topY: 76, z: 0, width: 152, height: 22, depth: 34, slices: 6, passThrough: false, decorative: true, pattern: s.mainPattern, topColor: a.top, midColor: a.mid, sideColor: a.side, trimColor: a.trim },
    ];
  },
  battlefield: (s, a) => {
    const c = s.colors;
    return [
      { id: 'main', x: 0, topY: 42, z: 0, width: 226, height: 34, depth: 48, slices: 9, passThrough: false, pattern: s.mainPattern, topColor: c.top, midColor: c.mid, sideColor: c.side, trimColor: c.trim },
      { id: 'pl-l', x: -66, topY: -6, z: 0, width: 60, height: 9, depth: 26, slices: 4, passThrough: true, pattern: s.platPattern, topColor: c.platTop, midColor: c.platMid, sideColor: c.platSide, trimColor: c.platTrim },
      { id: 'pl-r', x: 66, topY: -6, z: 0, width: 60, height: 9, depth: 26, slices: 4, passThrough: true, pattern: s.platPattern, topColor: c.platTop, midColor: c.platMid, sideColor: c.platSide, trimColor: c.platTrim },
      { id: 'pl-t', x: 0, topY: -48, z: 0, width: 66, height: 9, depth: 26, slices: 4, passThrough: true, pattern: s.platPattern, topColor: a.top, midColor: a.mid, sideColor: a.side, trimColor: a.trim },
    ];
  },
};

function buildVolumes(seed: StageSeed): SpriteStackVolume[] {
  const c = seed.colors;
  const accent = {
    top: c.accentTop ?? c.top,
    mid: c.accentMid ?? c.mid,
    side: c.accentSide ?? c.side,
    trim: c.accentTrim ?? c.trim,
  };
  const volumes = LAYOUT_BUILDERS[seed.layout](seed, accent);
  if (!seed.patches) return volumes;
  return volumes.map((vol) => {
    const patch = seed.patches?.[vol.id];
    return patch ? { ...vol, ...patch } : vol;
  });
}

const EXTRA_STAGE_SEEDS: StageSeed[] = [
  {
    id: 'mushroom-kingdom-1-1',
    name: 'Mushroom Kingdom 1-1',
    series: 'Super Mario Bros.',
    layoutTag: 'Warp Pipes · Wall-Cling',
    description: 'Classic NES 1-1 brick plaza flanked by climbable green warp pipes and floating question blocks.',
    ostTitle: 'Ground Theme - Super Mario Bros.',
    ostTrackIndex: 3,
    soundCloudUrl: 'https://soundcloud.com/ssbu-ost/ground-theme-super-mario-bros',
    backdropImage: STAGE_BACKDROPS.kingdom,
    vfx: 'none',
    layout: 'pipe-plaza',
    sky: { zenith: '#3C88FC', mid: '#5C94FC', horizon: '#98C4FC', sunColor: '#FDE047', mountainFar: '#008800', mountainNear: '#00A800' },
    clouds: { count: 7, baseColor: '#FFFFFF', shadeColor: '#CBD5E1', speed: 0.2, minY: -98, maxY: 50 },
    mainPattern: 'brick-fortress',
    platPattern: 'obsidian-gold',
    patches: { 'high-brick': { motion: { kind: 'horizontal', ampX: 38, ampY: 0, speed: 0.02 } } },
    colors: { top: '#E87838', mid: '#C84C0C', side: '#883000', trim: '#FCA044', platTop: '#F8B800', platMid: '#C87800', platSide: '#784000', platTrim: '#FFF080', accentTop: '#58D854', accentMid: '#00A800', accentSide: '#006800', accentTrim: '#B8F8B8' },
  },
  {
    id: 'bowsers-lava-keep',
    name: "Bowser's Lava Keep",
    series: 'Super Mario Bros.',
    layoutTag: 'Molten Bridge · Moving',
    description: 'Obsidian fortress bridge suspended above crimson magma with dual reciprocating iron grates.',
    ostTitle: 'King Bowser - Super Mario Bros. 3',
    ostTrackIndex: 4,
    soundCloudUrl: 'https://soundcloud.com/ssbu-ost/king-bowser-super-mario-bros-3',
    backdropImage: STAGE_BACKDROPS.volcano,
    vfx: 'embers',
    layout: 'lava-bridge',
    sky: { zenith: '#180508', mid: '#4C0D12', horizon: '#DC2626', sunColor: '#F97316', mountainFar: '#3B0A0E', mountainNear: '#220609' },
    clouds: { count: 5, baseColor: '#7F1D1D', shadeColor: '#450A0A', speed: 0.14, minY: -86, maxY: 70 },
    mainPattern: 'brick-fortress',
    platPattern: 'obsidian-gold',
    patches: {
      'grate-l': { motion: { kind: 'vertical', ampX: 0, ampY: 22, speed: 0.024, phase: 0 } },
      'grate-r': { motion: { kind: 'vertical', ampX: 0, ampY: 22, speed: 0.024, phase: Math.PI } },
    },
    colors: { top: '#64748B', mid: '#475569', side: '#1E293B', trim: '#F97316', platTop: '#94A3B8', platMid: '#475569', platSide: '#1E293B', platTrim: '#EF4444', accentTop: '#475569', accentMid: '#334155', accentSide: '#0F172A', accentTrim: '#F59E0B' },
  },
  {
    id: 'hyrule-temple',
    name: 'Hyrule Temple',
    series: 'Legend of Zelda',
    layoutTag: 'Multi-Tier · Sanctuary',
    description: 'Asymmetric ancient marble temple with eastern cliff keep, stone arches, and sky pavilion.',
    ostTitle: 'Great Temple / Temple Theme - Zelda II',
    ostTrackIndex: 5,
    soundCloudUrl: 'https://soundcloud.com/aaron-jeshua-martinez-cepeda/great-temple_temple-theme',
    backdropImage: STAGE_BACKDROPS.temple,
    vfx: 'petals',
    layout: 'temple-tiers',
    sky: { zenith: '#1E3A8A', mid: '#3B82F6', horizon: '#BAE6FD', sunColor: '#FEF08A', mountainFar: '#334155', mountainNear: '#1E293B' },
    clouds: { count: 6, baseColor: '#F8FAFC', shadeColor: '#CBD5E1', speed: 0.16, minY: -96, maxY: 64 },
    mainPattern: 'brick-fortress',
    platPattern: 'wood-bridge',
    colors: { top: '#CBD5E1', mid: '#94A3B8', side: '#475569', trim: '#FACC15', platTop: '#E2E8F0', platMid: '#94A3B8', platSide: '#64748B', platTrim: '#38BDF8' },
  },
  {
    id: 'brinstar-depths',
    name: 'Brinstar Depths',
    series: 'Metroid',
    layoutTag: 'Wall-Jump Cavern',
    description: 'Alien Zebes cavern framed by climbable bio-rock side walls above glowing emerald depths.',
    ostTitle: 'Brinstar Depths - Metroid',
    ostTrackIndex: 6,
    soundCloudUrl: 'https://soundcloud.com/user-135578251/brinstar-depths',
    backdropImage: STAGE_BACKDROPS.gothic,
    vfx: 'bubbles',
    layout: 'cavern-walls',
    sky: { zenith: '#140826', mid: '#3B0764', horizon: '#9D174D', starColor: '#F472B6', mountainFar: '#2E1065', mountainNear: '#1E083D' },
    clouds: { count: 4, baseColor: '#6B21A8', shadeColor: '#3B0764', speed: 0.11, minY: -88, maxY: 72 },
    mainPattern: 'obsidian-gold',
    platPattern: 'crystal-pillar',
    patches: { 'mid-ledge': { motion: { kind: 'horizontal', ampX: 44, ampY: 0, speed: 0.022 } } },
    colors: { top: '#C026D3', mid: '#701A75', side: '#3B0764', trim: '#4ADE80', platTop: '#4ADE80', platMid: '#15803D', platSide: '#064E3B', platTrim: '#BBF7D0', accentTop: '#86198F', accentMid: '#581C87', accentSide: '#2E1065', accentTrim: '#E879F9' },
  },
  {
    id: 'green-greens',
    name: 'Green Greens',
    series: "Kirby's Adventure",
    layoutTag: 'Tri-Platform · Meadow',
    description: 'Vibrant Dream Land meadow with twin timber canopy decks and a pillowy top cloud.',
    ostTitle: 'Green Greens - Kirby',
    ostTrackIndex: 7,
    soundCloudUrl: 'https://soundcloud.com/super-smash-bros-anthology-682267904/41-green-greens',
    backdropImage: STAGE_BACKDROPS.dreamland,
    vfx: 'petals',
    layout: 'battlefield',
    sky: { zenith: '#0284C7', mid: '#38BDF8', horizon: '#E0F2FE', sunColor: '#FDE047', mountainFar: '#16A34A', mountainNear: '#15803D' },
    clouds: { count: 8, baseColor: '#FFFFFF', shadeColor: '#BAE6FD', speed: 0.22, minY: -98, maxY: 58 },
    mainPattern: 'grass-stone',
    platPattern: 'wood-bridge',
    colors: { top: '#4ADE80', mid: '#A16207', side: '#713F12', trim: '#F472B6', platTop: '#FDE68A', platMid: '#B45309', platSide: '#78350F', platTrim: '#FFFFFF', accentTop: '#FFFFFF', accentMid: '#BAE6FD', accentSide: '#7DD3FC', accentTrim: '#F472B6' },
  },
  {
    id: 'kongo-jungle-75m',
    name: 'Kongo Jungle 75m',
    series: 'Donkey Kong',
    layoutTag: 'Girder Pyramid · Moving',
    description: 'Stepped sunset jungle stronghold inspired by classic red steel girders and elevator lifts.',
    ostTitle: 'Donkey Kong Medley - SSBU',
    ostTrackIndex: 8,
    soundCloudUrl: 'https://soundcloud.com/ninlistener/donkey-kong-medley-super-smash-bros-ultimate',
    backdropImage: STAGE_BACKDROPS.jungle,
    vfx: 'none',
    layout: 'stepped-pyramid',
    sky: { zenith: '#451A03', mid: '#B45309', horizon: '#FCD34D', sunColor: '#FEF08A', mountainFar: '#14532D', mountainNear: '#052E16' },
    clouds: { count: 5, baseColor: '#FEF3C7', shadeColor: '#F59E0B', speed: 0.17, minY: -90, maxY: 60 },
    mainPattern: 'wood-bridge',
    platPattern: 'brick-fortress',
    patches: {
      'side-l': { motion: { kind: 'elevator', ampX: 0, ampY: 26, speed: 0.025, phase: 0 } },
      'side-r': { motion: { kind: 'elevator', ampX: 0, ampY: 26, speed: 0.025, phase: Math.PI } },
    },
    colors: { top: '#D97706', mid: '#92400E', side: '#451A03', trim: '#22C55E', platTop: '#EF4444', platMid: '#B91C1C', platSide: '#7F1D1D', platTrim: '#FDE047', accentTop: '#B45309', accentMid: '#78350F', accentSide: '#451A03', accentTrim: '#FACC15' },
  },
  {
    id: 'wily-castle-roof',
    name: 'Wily Castle Roof',
    series: 'Mega Man 2',
    layoutTag: 'Twin Towers · Fortress',
    description: 'Stormy midnight robotics fortress with cobalt steel battlements and sliding plasma catwalk.',
    ostTitle: 'Dr. Wily Stage - Mega Man 2',
    ostTrackIndex: 9,
    soundCloudUrl: 'https://soundcloud.com/smashbrosfor3ds/title-dr-wily-stage-mega-man-2-super-smash-bros-3ds-soundtrack',
    backdropImage: STAGE_BACKDROPS.cyber,
    vfx: 'rain',
    layout: 'dual-towers',
    sky: { zenith: '#020617', mid: '#0F172A', horizon: '#1E3A8A', starColor: '#38BDF8', mountainFar: '#1E293B', mountainNear: '#0F172A' },
    clouds: { count: 6, baseColor: '#334155', shadeColor: '#1E293B', speed: 0.28, minY: -92, maxY: 56 },
    mainPattern: 'obsidian-gold',
    platPattern: 'crystal-pillar',
    patches: { 'top-arch': { motion: { kind: 'horizontal', ampX: 52, ampY: 0, speed: 0.022 } } },
    colors: { top: '#38BDF8', mid: '#1D4ED8', side: '#1E1B4B', trim: '#FACC15', platTop: '#94A3B8', platMid: '#475569', platSide: '#1E293B', platTrim: '#38BDF8', accentTop: '#FACC15', accentMid: '#CA8A04', accentSide: '#713F12', accentTrim: '#FFFFFF' },
  },
  {
    id: 'green-hill-zone',
    name: 'Green Hill Zone',
    series: 'Sonic the Hedgehog',
    layoutTag: 'Spring Deck · Speed',
    description: 'Iconic 16-bit emerald turf over checkered amber soil with a high-launch Sonic spring pad.',
    ostTitle: 'Green Hill Zone - Sonic the Hedgehog',
    ostTrackIndex: 10,
    soundCloudUrl: 'https://soundcloud.com/gustavo-fitz-546396357/sonic-the-hedgehog-green-hill-zone',
    backdropImage: STAGE_BACKDROPS.meadow,
    vfx: 'speedlines',
    layout: 'battlefield',
    sky: { zenith: '#1D4ED8', mid: '#2563EB', horizon: '#60A5FA', sunColor: '#FEF08A', mountainFar: '#15803D', mountainNear: '#166534' },
    clouds: { count: 7, baseColor: '#FFFFFF', shadeColor: '#93C5FD', speed: 0.34, minY: -96, maxY: 52 },
    mainPattern: 'grass-stone',
    platPattern: 'grass-stone',
    patches: {
      'pl-t': { surfaceEffect: 'spring', springPower: 1.55 },
      'pl-l': { motion: { kind: 'horizontal', ampX: 18, ampY: 0, speed: 0.026 } },
    },
    colors: { top: '#22C55E', mid: '#B45309', side: '#78350F', trim: '#86EFAC', platTop: '#4ADE80', platMid: '#D97706', platSide: '#92400E', platTrim: '#FACC15', accentTop: '#EF4444', accentMid: '#B91C1C', accentSide: '#7F1D1D', accentTrim: '#FDE047' },
  },
  {
    id: 'draculas-clock-tower',
    name: "Dracula's Clock Tower",
    series: 'Castlevania',
    layoutTag: 'Orbit Gears · Wall-Cling',
    description: 'Blood-moon Transylvanian belfry with towering stone walls and orbiting gilded clock gears.',
    ostTitle: 'Vampire Killer - Castlevania',
    ostTrackIndex: 11,
    soundCloudUrl: 'https://soundcloud.com/jessethedraxol0tl/super-smash-bros-ultimate-ost-vampire-killer-castlevania-judgment',
    backdropImage: STAGE_BACKDROPS.gothic,
    vfx: 'rain',
    layout: 'cavern-walls',
    sky: { zenith: '#09050F', mid: '#3B0A1E', horizon: '#991B1B', starColor: '#FDE68A', sunColor: '#EF4444', mountainFar: '#1F1024', mountainNear: '#120816' },
    clouds: { count: 5, baseColor: '#450A0A', shadeColor: '#1F0812', speed: 0.18, minY: -94, maxY: 62 },
    mainPattern: 'brick-fortress',
    platPattern: 'obsidian-gold',
    patches: {
      'mid-ledge': { motion: { kind: 'orbit', ampX: 46, ampY: 18, speed: 0.022, phase: 0 } },
      'top-ledge': { motion: { kind: 'orbit', ampX: 38, ampY: 14, speed: 0.022, phase: Math.PI } },
    },
    colors: { top: '#64748B', mid: '#334155', side: '#0F172A', trim: '#DC2626', platTop: '#F59E0B', platMid: '#92400E', platSide: '#451A03', platTrim: '#FEF08A', accentTop: '#475569', accentMid: '#1E293B', accentSide: '#090D16', accentTrim: '#DC2626' },
  },
  {
    id: 'skyworld-sanctuary',
    name: 'Skyworld Sanctuary',
    series: 'Kid Icarus',
    layoutTag: 'Pendulum Cloud Isles',
    description: 'Twin golden marble sky islands linked by swinging cloud altars high above the heavens.',
    ostTitle: 'Underworld / Skyworld - Kid Icarus',
    ostTrackIndex: 12,
    soundCloudUrl: 'https://soundcloud.com/ninlistener/kid-icarus-title-remix-super-smash-bros-ultimate',
    backdropImage: STAGE_BACKDROPS.skyworld,
    vfx: 'stars',
    layout: 'sky-islands',
    sky: { zenith: '#0369A1', mid: '#38BDF8', horizon: '#FEF3C7', sunColor: '#FEF08A', mountainFar: '#7DD3FC', mountainNear: '#BAE6FD' },
    clouds: { count: 9, baseColor: '#FFFFFF', shadeColor: '#E0F2FE', speed: 0.24, minY: -100, maxY: 74 },
    mainPattern: 'cloud-deck',
    platPattern: 'cloud-deck',
    patches: { 'cloud-mid': { motion: { kind: 'pendulum', ampX: 36, ampY: 14, speed: 0.024 } } },
    colors: { top: '#FFFBEB', mid: '#E2E8F0', side: '#94A3B8', trim: '#F59E0B', platTop: '#FFFFFF', platMid: '#CBD5E1', platSide: '#64748B', platTrim: '#FACC15' },
  },
  {
    id: 'boxing-ring',
    name: 'WVBA Boxing Ring',
    series: 'Punch-Out!!',
    layoutTag: 'Championship Ring · Flat+',
    description: 'Spotlight championship canvas with corner turnbuckles and a high suspended jumbotron deck.',
    ostTitle: 'Jogging / Countdown - Punch-Out!!',
    ostTrackIndex: 13,
    soundCloudUrl: 'https://soundcloud.com/kye-gunvolt-kyle-l/jogging-countdown-punch-out-super-smash-bros-wii-u',
    backdropImage: STAGE_BACKDROPS.boxing,
    vfx: 'none',
    layout: 'boxing-ring',
    sky: { zenith: '#09090B', mid: '#18181B', horizon: '#1E3A8A', starColor: '#FDE047', mountainFar: '#1E1B4B', mountainNear: '#09090B' },
    clouds: { count: 3, baseColor: '#3B82F6', shadeColor: '#1E3A8A', speed: 0.08, minY: -96, maxY: 36 },
    mainPattern: 'obsidian-gold',
    platPattern: 'crystal-pillar',
    colors: { top: '#E2E8F0', mid: '#2563EB', side: '#1E3A8A', trim: '#EF4444', platTop: '#38BDF8', platMid: '#0F172A', platSide: '#020617', platTrim: '#FACC15', accentTop: '#EF4444', accentMid: '#B91C1C', accentSide: '#7F1D1D', accentTrim: '#FFFFFF' },
  },
  {
    id: 'shinobi-pagoda',
    name: 'Shinobi Pagoda',
    series: 'Ninja Gaiden',
    layoutTag: 'Tiered Eaves · Vertical',
    description: 'Moonlit four-tier crimson dojo roof built for high-flying aerial duels and rapid vertical combos.',
    ostTitle: 'Unbreakable Determination - Ninja Gaiden',
    ostTrackIndex: 14,
    soundCloudUrl: 'https://soundcloud.com/professorbeetus/ninja-gaiden-nes-unbreakable-determination-stage-4-2-orchestrated-remix',
    backdropImage: STAGE_BACKDROPS.dojo,
    vfx: 'petals',
    layout: 'pagoda-spire',
    sky: { zenith: '#0F172A', mid: '#312E81', horizon: '#C2410C', starColor: '#F8FAFC', sunColor: '#FEF9C3', mountainFar: '#1E1B4B', mountainNear: '#0F172A' },
    clouds: { count: 6, baseColor: '#FDBA74', shadeColor: '#7C2D12', speed: 0.2, minY: -94, maxY: 60 },
    mainPattern: 'wood-bridge',
    platPattern: 'brick-fortress',
    colors: { top: '#B91C1C', mid: '#7F1D1D', side: '#450A0A', trim: '#FACC15', platTop: '#DC2626', platMid: '#991B1B', platSide: '#450A0A', platTrim: '#FDE047', accentTop: '#1E293B', accentMid: '#0F172A', accentSide: '#020617', accentTrim: '#EF4444' },
  },
  {
    id: 'yoshis-cloud-island',
    name: "Yoshi's Cloud Island",
    series: 'Super Mario World',
    layoutTag: 'Sunny Meadow · Moving',
    description: 'Cheerful 16-bit storybook island floating over fluffy pastel clouds and bobbing sky decks.',
    ostTitle: 'Super Mario World Medley - SSBU',
    ostTrackIndex: 15,
    soundCloudUrl: 'https://soundcloud.com/ssbu-ost/super-mario-world-medley',
    backdropImage: STAGE_BACKDROPS.ocean,
    vfx: 'petals',
    layout: 'battlefield',
    sky: { zenith: '#0EA5E9', mid: '#7DD3FC', horizon: '#FEF9C3', sunColor: '#FDE047', mountainFar: '#4ADE80', mountainNear: '#22C55E' },
    clouds: { count: 8, baseColor: '#FFFFFF', shadeColor: '#E0F2FE', speed: 0.21, minY: -98, maxY: 66 },
    mainPattern: 'grass-stone',
    platPattern: 'cloud-deck',
    patches: { 'pl-t': { motion: { kind: 'horizontal', ampX: 34, ampY: 0, speed: 0.018 } } },
    colors: { top: '#86EFAC', mid: '#D97706', side: '#92400E', trim: '#FACC15', platTop: '#FFFFFF', platMid: '#BAE6FD', platSide: '#7DD3FC', platTrim: '#F472B6', accentTop: '#FEF08A', accentMid: '#F59E0B', accentSide: '#B45309', accentTrim: '#FFFFFF' },
  },
  {
    id: 'norfair-magma-core',
    name: 'Norfair Magma Core',
    series: 'Super Metroid',
    layoutTag: 'Volcanic Lift · Dual',
    description: 'Superheated subterranean magma core with twin basalt ledges and rising thermal lift deck.',
    ostTitle: 'Norfair - Metroid (Smash Remix)',
    ostTrackIndex: 16,
    soundCloudUrl: 'https://soundcloud.com/taco-john-dolan/norfair-metroid-super-smash-bros-brawl-remix',
    backdropImage: STAGE_BACKDROPS.volcano,
    vfx: 'embers',
    layout: 'dual-towers',
    sky: { zenith: '#2A0800', mid: '#7C2D12', horizon: '#F97316', sunColor: '#FDE047', mountainFar: '#431407', mountainNear: '#2A0800' },
    clouds: { count: 5, baseColor: '#EA580C', shadeColor: '#7C2D12', speed: 0.15, minY: -84, maxY: 74 },
    mainPattern: 'obsidian-gold',
    platPattern: 'obsidian-gold',
    patches: { 'span-mid': { motion: { kind: 'vertical', ampX: 0, ampY: 22, speed: 0.025 } } },
    colors: { top: '#F97316', mid: '#9A3412', side: '#431407', trim: '#FDE047', platTop: '#CBD5E1', platMid: '#64748B', platSide: '#334155', platTrim: '#F97316', accentTop: '#FB923C', accentMid: '#C2410C', accentSide: '#7C2D12', accentTrim: '#FEF08A' },
  },
  {
    id: 'corneria-cruiser',
    name: 'Corneria Cruiser',
    series: 'Star Fox',
    layoutTag: 'Starship Deck · Shuttle',
    description: 'Soaring titanium battleship hull slicing through stratosphere clouds with patrolling Arwing wing deck.',
    ostTitle: 'Corneria - Star Fox (SSBU)',
    ostTrackIndex: 17,
    soundCloudUrl: 'https://soundcloud.com/user-698088388/8008s',
    backdropImage: STAGE_BACKDROPS.starship,
    vfx: 'speedlines',
    layout: 'ship-deck',
    sky: { zenith: '#0C4A6E', mid: '#0284C7', horizon: '#BAE6FD', sunColor: '#FFFFFF', mountainFar: '#0369A1', mountainNear: '#075985' },
    clouds: { count: 9, baseColor: '#F8FAFC', shadeColor: '#94A3B8', speed: 0.42, minY: -98, maxY: 74 },
    mainPattern: 'obsidian-gold',
    platPattern: 'crystal-pillar',
    patches: { 'wing-plat': { motion: { kind: 'horizontal', ampX: 38, ampY: 0, speed: 0.026 } } },
    colors: { top: '#CBD5E1', mid: '#64748B', side: '#334155', trim: '#38BDF8', platTop: '#E2E8F0', platMid: '#94A3B8', platSide: '#475569', platTrim: '#F59E0B', accentTop: '#94A3B8', accentMid: '#475569', accentSide: '#1E293B', accentTrim: '#38BDF8' },
  },
  {
    id: 'fountain-of-dreams',
    name: 'Fountain of Dreams',
    series: 'Kirby Super Star',
    layoutTag: 'Dreamscape · Rising Decks',
    description: 'Starlit indigo sanctuary bathed in moonlight with Melee-style rising crystal water decks.',
    ostTitle: 'Fountain of Dreams - SSBU',
    ostTrackIndex: 18,
    soundCloudUrl: 'https://soundcloud.com/neil-winters-753009113/super-smash-bros-ultimate-fountain-of-dreams-super-smash-bros-melee-super-smash-bros-brawl',
    backdropImage: STAGE_BACKDROPS.dreamland,
    vfx: 'stars',
    layout: 'battlefield',
    sky: { zenith: '#09071C', mid: '#1E1B4B', horizon: '#6D28D9', starColor: '#FDE68A', sunColor: '#E0E7FF', mountainFar: '#312E81', mountainNear: '#1E1B4B' },
    clouds: { count: 6, baseColor: '#C4B5FD', shadeColor: '#5B21B6', speed: 0.13, minY: -96, maxY: 66 },
    mainPattern: 'crystal-pillar',
    platPattern: 'crystal-pillar',
    patches: {
      'pl-l': { motion: { kind: 'vertical', ampX: 0, ampY: 22, speed: 0.018, phase: 0 } },
      'pl-r': { motion: { kind: 'vertical', ampX: 0, ampY: 22, speed: 0.018, phase: Math.PI * 0.85 } },
    },
    colors: { top: '#FDE68A', mid: '#818CF8', side: '#312E81', trim: '#F472B6', platTop: '#A5F3FC', platMid: '#38BDF8', platSide: '#1D4ED8', platTrim: '#FFFFFF', accentTop: '#FDE68A', accentMid: '#A855F7', accentSide: '#4C1D95', accentTrim: '#FFFFFF' },
  },
  {
    id: 'chemical-plant',
    name: 'Chemical Plant Zone',
    series: 'Sonic 2 (SEGA)',
    layoutTag: 'Neon Conveyor · Pipes',
    description: 'Electric magenta-and-cyan Genesis refinery with conveyor floor deck and climbable chemical vats.',
    ostTitle: 'Chemical Plant Zone - Sonic 2',
    ostTrackIndex: 19,
    soundCloudUrl: 'https://soundcloud.com/user-445991624/sonic-mania-chemical-plant-zone-act-2',
    backdropImage: STAGE_BACKDROPS.cyber,
    vfx: 'bubbles',
    layout: 'pipe-plaza',
    sky: { zenith: '#09051A', mid: '#1E1B4B', horizon: '#701A75', starColor: '#38BDF8', mountainFar: '#312E81', mountainNear: '#1E1B4B' },
    clouds: { count: 5, baseColor: '#A855F7', shadeColor: '#4C1D95', speed: 0.25, minY: -94, maxY: 58 },
    mainPattern: 'obsidian-gold',
    platPattern: 'crystal-pillar',
    patches: {
      'q-blocks': { surfaceEffect: 'conveyor-right', conveyorSpeed: 1.3 },
      'high-brick': { motion: { kind: 'vertical', ampX: 0, ampY: 16, speed: 0.025 } },
    },
    colors: { top: '#38BDF8', mid: '#1E40AF', side: '#0F172A', trim: '#FACC15', platTop: '#E879F9', platMid: '#A21CAF', platSide: '#4A044E', platTrim: '#FFFFFF', accentTop: '#FACC15', accentMid: '#CA8A04', accentSide: '#713F12', accentTrim: '#38BDF8' },
  },
  {
    id: 'death-mountain-peak',
    name: 'Death Mountain Peak',
    series: 'Legend of Zelda',
    layoutTag: 'Craggy Summit · Bridge',
    description: 'Jagged volcanic ridge above Hyrule clouds with twin stone ledges and high lookouts.',
    ostTitle: 'Gerudo Valley - Legend of Zelda (SSBU)',
    ostTrackIndex: 20,
    soundCloudUrl: 'https://soundcloud.com/hadeel-terjally/gerudo-valley-remix-super',
    backdropImage: STAGE_BACKDROPS.desert,
    vfx: 'embers',
    layout: 'temple-tiers',
    sky: { zenith: '#1C1917', mid: '#57534E', horizon: '#EA580C', sunColor: '#FB923C', mountainFar: '#44403C', mountainNear: '#292524' },
    clouds: { count: 6, baseColor: '#D6D3D1', shadeColor: '#57534E', speed: 0.19, minY: -92, maxY: 64 },
    mainPattern: 'brick-fortress',
    platPattern: 'wood-bridge',
    colors: { top: '#A8A29E', mid: '#57534E', side: '#292524', trim: '#F97316', platTop: '#D97706', platMid: '#78350F', platSide: '#451A03', platTrim: '#FDE68A' },
  },
  {
    id: 'halberd-airship',
    name: 'Battleship Halberd',
    series: 'Kirby Super Star',
    layoutTag: 'Warship Elevator · Air',
    description: 'Meta Knight crimson steel dreadnought with a rising battle elevator slicing through twilight clouds.',
    ostTitle: "Meta Knight's Revenge - Kirby",
    ostTrackIndex: 21,
    soundCloudUrl: 'https://soundcloud.com/spongyoshi-spongette/super-smash-bros-meta-knight-revenge',
    backdropImage: STAGE_BACKDROPS.airship,
    vfx: 'speedlines',
    layout: 'ship-deck',
    sky: { zenith: '#1E1B4B', mid: '#7F1D1D', horizon: '#F59E0B', sunColor: '#FEF08A', mountainFar: '#450A0A', mountainNear: '#1E1B4B' },
    clouds: { count: 8, baseColor: '#FDE68A', shadeColor: '#B45309', speed: 0.36, minY: -96, maxY: 72 },
    mainPattern: 'obsidian-gold',
    platPattern: 'obsidian-gold',
    patches: { 'radar-deck': { motion: { kind: 'elevator', ampX: 0, ampY: 22, speed: 0.022 } } },
    colors: { top: '#94A3B8', mid: '#475569', side: '#1E293B', trim: '#FACC15', platTop: '#DC2626', platMid: '#991B1B', platSide: '#450A0A', platTrim: '#FDE047', accentTop: '#B91C1C', accentMid: '#7F1D1D', accentSide: '#450A0A', accentTrim: '#FACC15' },
  },
  {
    id: 'eight-bit-summit',
    name: '8-Bit Retro Summit',
    series: 'NES Classics',
    layoutTag: 'Pure Flat · 8-Bit Arena',
    description: 'Ultra-crisp competitive flat NES pixel stage floating above a starry midnight chiptune skyline.',
    ostTitle: 'Super Mario Bros. Medley - SSBU',
    ostTrackIndex: 0,
    soundCloudUrl: 'https://soundcloud.com/ssbu-ost/super-mario-bros-medley',
    backdropImage: STAGE_BACKDROPS.cosmos,
    vfx: 'stars',
    layout: 'final-dest',
    sky: { zenith: '#000000', mid: '#081848', horizon: '#0058F8', starColor: '#FFFFFF', mountainFar: '#002888', mountainNear: '#001450' },
    clouds: { count: 5, baseColor: '#3CBCFC', shadeColor: '#0058F8', speed: 0.16, minY: -98, maxY: 76 },
    mainPattern: 'crystal-pillar',
    platPattern: 'crystal-pillar',
    colors: { top: '#3CBCFC', mid: '#0058F8', side: '#0028A8', trim: '#F8D800', platTop: '#FCFCFC', platMid: '#3CBCFC', platSide: '#0058F8', platTrim: '#FFFFFF', accentTop: '#0058F8', accentMid: '#0028A8', accentSide: '#001058', accentTrim: '#3CBCFC' },
  },
];

export const EXTRA_20_STAGES: StageManifest[] = EXTRA_STAGE_SEEDS.map((seed) => ({
  id: seed.id,
  name: seed.name,
  series: seed.series,
  layoutTag: seed.layoutTag,
  description: seed.description,
  ostTitle: seed.ostTitle,
  ostTrackIndex: seed.ostTrackIndex,
  soundCloudUrl: seed.soundCloudUrl,
  backdropImage: seed.backdropImage,
  vfx: seed.vfx,
  sky: seed.sky,
  clouds: seed.clouds,
  blastZones: {
    left: -285,
    right: 285,
    top: -195,
    bottom: 168,
  },
  spawnPoints: [
    { x: -68, y: -16 },
    { x: 68, y: -16 },
  ],
  volumes: buildVolumes(seed),
}));
