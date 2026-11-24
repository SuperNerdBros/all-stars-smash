import type { ArchetypeId, FighterBlueprint, FighterMoveset, FighterStats, MoveOverride } from '../../types/fighter';
import type { PalettePreset } from '../../types/palette';
import type { MoveSlot } from '../../types/moves';
import { buildWwwChart, type WwwArchetype, type WwwBuild, type WwwLook } from './wwwSpriteBuilder';

/**
 * WWW FIGHTERS: the house cast of Super All Stars! : The Late 1900's.
 * Build-a-fighter kids from the dial-up era. Three archetypes (Brawler, Blade, Blaster), three builds,
 * and swappable hair / headwear / outfits, all drawn by wwwSpriteBuilder.
 */

interface WwwSpec {
  id: string;
  name: string;
  nickname: string;
  bio: string;
  look: WwwLook;
  /** Main colors: top, bottoms, accent, hair, skin. */
  colors: { top: string; bottoms: string; accent: string; hair: string; skin: string };
}

// ── Color helpers ───────────────────────────────────────────────

function shadeHex(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v * f)));
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0').toUpperCase()}`;
}

function palette(name: string, c: WwwSpec['colors'], era: 'NES' | 'SNES'): PalettePreset {
  // 8-bit era: flatter shading (shade = closer to main), like the hardware would allow.
  const k = era === 'NES' ? 0.8 : 0.66;
  return {
    name,
    colors: [
      '',
      '#14111C', // outline
      c.skin,
      c.top,
      shadeHex(c.top, k),
      c.bottoms,
      shadeHex(c.bottoms, k),
      c.accent,
      '#F28A3C', // blush / warm
      '#2B2230', // shoes
      '#E3E9F0', // metal light
      '#7A8496', // metal dark
      c.hair,
      '#62F3FF', // energy core
      '#2AA0E8', // energy glow
      '#FFFFFF',
    ],
  };
}

/** Four team-readable variants: the fighter's own colors, then red / blue / green tops. */
function palettesFor(spec: WwwSpec, era: 'NES' | 'SNES'): PalettePreset[] {
  const base = spec.colors;
  return [
    palette(`${spec.nickname} Classic`, base, era),
    palette('Red Team', { ...base, top: '#E23A47', accent: '#FFD23F' }, era),
    palette('Blue Team', { ...base, top: '#2F6FE0', accent: '#7CF0FF' }, era),
    palette('Green Team', { ...base, top: '#2FAE5A', accent: '#E8FF6A' }, era),
  ];
}

// ── Stats & moves by archetype/build ────────────────────────────

const BASE_STATS: Record<WwwArchetype, FighterStats> = {
  brawler: { weight: 104, runSpeed: 2.5, airSpeed: 2.1, jumpForce: 5.8, doubleJumpForce: 5.3, maxJumps: 2, gravity: 0.27, fallSpeed: 4.7, fastFallSpeed: 6.9, traction: 0.26 },
  blade: { weight: 96, runSpeed: 2.6, airSpeed: 2.2, jumpForce: 6.0, doubleJumpForce: 5.5, maxJumps: 2, gravity: 0.25, fallSpeed: 4.5, fastFallSpeed: 6.6, traction: 0.24 },
  blaster: { weight: 92, runSpeed: 2.3, airSpeed: 2.0, jumpForce: 5.7, doubleJumpForce: 5.2, maxJumps: 2, gravity: 0.24, fallSpeed: 4.3, fastFallSpeed: 6.3, traction: 0.22 },
};

function statsFor(look: WwwLook): FighterStats {
  const s = { ...BASE_STATS[look.archetype] };
  const b: Record<WwwBuild, [number, number, number]> = { slim: [-12, 0.25, 0.3], standard: [0, 0, 0], heavy: [16, -0.3, -0.35] };
  const [dw, dRun, dJump] = b[look.build];
  return { ...s, weight: s.weight + dw, runSpeed: s.runSpeed + dRun, airSpeed: s.airSpeed + dRun * 0.6, jumpForce: s.jumpForce + dJump, doubleJumpForce: s.doubleJumpForce + dJump };
}

const MOVES: Record<WwwArchetype, { core: FighterMoveset; extra: Partial<Record<MoveSlot, MoveOverride>> }> = {
  brawler: {
    core: {
      jab: { name: 'Dial-Up Jab', startup: 3, active: 3, endlag: 7, hitbox: { offsetX: 11, offsetY: -12, width: 12, height: 10 }, damage: 4, baseKnockback: 2.2, knockbackGrowth: 30, launchAngleDeg: 40, hitstop: 4 },
      smash: { name: 'Broadband Haymaker', startup: 12, active: 4, endlag: 20, hitbox: { offsetX: 13, offsetY: -13, width: 16, height: 14 }, damage: 18, baseKnockback: 4.4, knockbackGrowth: 96, launchAngleDeg: 38, hitstop: 9 },
      aerial: { name: 'Elbow Drop', startup: 5, active: 6, endlag: 10, hitbox: { offsetX: 9, offsetY: -10, width: 14, height: 14 }, damage: 11, baseKnockback: 3.0, knockbackGrowth: 66, launchAngleDeg: 35, hitstop: 6 },
      neutralSpecial: { name: 'Shockwave Punch', startup: 9, active: 4, endlag: 18, hitbox: { offsetX: 14, offsetY: -12, width: 12, height: 12 }, damage: 9, baseKnockback: 3.2, knockbackGrowth: 55, launchAngleDeg: 30, hitstop: 6, projectile: { speedX: 3.6, speedY: 0, gravity: 0, radius: 6, lifetime: 26, colorIndex: 13, glowIndex: 14 } },
      upSpecial: { name: 'Rising Uplink', startup: 4, active: 12, endlag: 22, hitbox: { offsetX: 6, offsetY: -20, width: 14, height: 18 }, damage: 11, baseKnockback: 3.6, knockbackGrowth: 70, launchAngleDeg: 80, hitstop: 6, velocityBoostY: -7.4, velocityBoostX: 1.2 },
    },
    extra: { dair: { name: 'Pile Driver', damage: 15 }, bthrow: { name: 'Suplex.exe', damage: 11 } },
  },
  blade: {
    core: {
      jab: { name: 'Cursor Cut', startup: 4, active: 4, endlag: 8, hitbox: { offsetX: 15, offsetY: -12, width: 18, height: 12 }, damage: 5, baseKnockback: 2.3, knockbackGrowth: 34, launchAngleDeg: 38, hitstop: 4 },
      smash: { name: 'Hyperlink Slash', startup: 11, active: 5, endlag: 19, hitbox: { offsetX: 17, offsetY: -13, width: 22, height: 14 }, damage: 16, baseKnockback: 4.0, knockbackGrowth: 92, launchAngleDeg: 36, hitstop: 8, hitboxes: [{ id: 0, offsetX: 24, offsetY: -13, width: 8, height: 10, damage: 18, hitlagMult: 1.25 }, { id: 1, offsetX: 13, offsetY: -13, width: 14, height: 14, damage: 12, hitlagMult: 0.8 }] },
      aerial: { name: 'Arc Slash', startup: 6, active: 6, endlag: 11, hitbox: { offsetX: 13, offsetY: -12, width: 20, height: 16 }, damage: 10, baseKnockback: 2.9, knockbackGrowth: 62, launchAngleDeg: 40, hitstop: 6 },
      neutralSpecial: { name: 'Boomerang Disk', startup: 10, active: 4, endlag: 18, hitbox: { offsetX: 14, offsetY: -12, width: 10, height: 10 }, damage: 7, baseKnockback: 2.6, knockbackGrowth: 45, launchAngleDeg: 32, hitstop: 5, projectile: { speedX: 4.4, speedY: -0.4, gravity: 0.03, radius: 5, lifetime: 48, colorIndex: 10, glowIndex: 14 } },
      upSpecial: { name: 'Uplink Spin', startup: 5, active: 14, endlag: 22, hitbox: { offsetX: 0, offsetY: -14, width: 26, height: 22 }, damage: 10, baseKnockback: 3.3, knockbackGrowth: 64, launchAngleDeg: 78, hitstop: 6, velocityBoostY: -7.0, velocityBoostX: 1.6 },
    },
    extra: { fair: { name: 'Downlink Chop', launchAngleDeg: 28 } },
  },
  blaster: {
    core: {
      jab: { name: 'Muzzle Bop', startup: 4, active: 3, endlag: 8, hitbox: { offsetX: 12, offsetY: -12, width: 12, height: 10 }, damage: 4, baseKnockback: 2.1, knockbackGrowth: 30, launchAngleDeg: 40, hitstop: 4 },
      smash: { name: 'Point-Blank Blast', startup: 13, active: 5, endlag: 21, hitbox: { offsetX: 16, offsetY: -13, width: 18, height: 12 }, damage: 17, baseKnockback: 4.2, knockbackGrowth: 94, launchAngleDeg: 34, hitstop: 9, element: 'electric' },
      aerial: { name: 'Recoil Shot', startup: 7, active: 5, endlag: 12, hitbox: { offsetX: 14, offsetY: -11, width: 14, height: 10 }, damage: 9, baseKnockback: 2.8, knockbackGrowth: 58, launchAngleDeg: 30, hitstop: 5, velocityBoostX: -1.6 },
      neutralSpecial: { name: '56k Laser', startup: 8, active: 4, endlag: 14, hitbox: { offsetX: 14, offsetY: -12, width: 10, height: 6 }, damage: 6, baseKnockback: 1.8, knockbackGrowth: 35, launchAngleDeg: 20, hitstop: 4, element: 'electric', projectile: { speedX: 7.2, speedY: 0, gravity: 0, radius: 4, lifetime: 40, colorIndex: 13, glowIndex: 14 } },
      upSpecial: { name: 'Jet Pack Reboot', startup: 6, active: 16, endlag: 20, hitbox: { offsetX: -2, offsetY: -4, width: 12, height: 10 }, damage: 6, baseKnockback: 2.4, knockbackGrowth: 50, launchAngleDeg: -70, hitstop: 5, velocityBoostY: -8.0 },
    },
    extra: { downSpecial: { name: 'Static Field', element: 'electric', multiHitInterval: 6 } },
  },
};

const ARCHETYPE_INFO: Record<WwwArchetype, { id: ArchetypeId; label: string }> = {
  brawler: { id: 'brawler', label: 'Www Brawler' },
  blade: { id: 'sword-hero', label: 'Www Blade' },
  blaster: { id: 'zoner', label: 'Www Blaster' },
};

// ── The cast ────────────────────────────────────────────────────

const SKIN = { a: '#F7D2B0', b: '#E0A779', c: '#B97A4F', d: '#7C4A2D', e: '#F2C9A0' };

export const WWW_SPECS: readonly WwwSpec[] = [
  // Brawlers
  { id: 'www-dana', name: 'Dial-Up Dana', nickname: 'Dana', bio: 'Screeches like a 28.8k modem right before the haymaker lands.', look: { archetype: 'brawler', build: 'standard', hair: 'ponytail', headwear: 'headband', outfit: 'tracksuit' }, colors: { top: '#8A3FE0', bottoms: '#2A2350', accent: '#FFD23F', hair: '#3A1F14', skin: SKIN.b } },
  { id: 'www-bo', name: 'Boombox Bo', nickname: 'Bo', bio: 'Carries the bass. Throws the punches on the downbeat.', look: { archetype: 'brawler', build: 'heavy', hair: 'afro', headwear: 'headphones', outfit: 'jacket' }, colors: { top: '#E85D2A', bottoms: '#24324F', accent: '#7CF0FF', hair: '#1C1410', skin: SKIN.d } },
  { id: 'www-ari', name: 'Arcade Ari', nickname: 'Ari', bio: 'Every quarter in town has her initials on it.', look: { archetype: 'brawler', build: 'slim', hair: 'mohawk', headwear: 'none', outfit: 'gi' }, colors: { top: '#F3F0E8', bottoms: '#2B2B36', accent: '#E23A47', hair: '#FF4FA3', skin: SKIN.a } },
  { id: 'www-max', name: 'Mixtape Max', nickname: 'Max', bio: 'Side A: punches. Side B: more punches.', look: { archetype: 'brawler', build: 'heavy', hair: 'spiky', headwear: 'cap', outfit: 'hoodie' }, colors: { top: '#2FAE5A', bottoms: '#3A2E26', accent: '#FFD23F', hair: '#6B3A1E', skin: SKIN.c } },
  // Blades
  { id: 'www-fen', name: 'Floppy Fen', nickname: 'Fen', bio: '1.44 MB of pure swordsmanship. Write-protected.', look: { archetype: 'blade', build: 'standard', hair: 'swoop', headwear: 'none', outfit: 'jacket' }, colors: { top: '#2F6FE0', bottoms: '#1E2540', accent: '#C0C8D8', hair: '#E8D24A', skin: SKIN.a } },
  { id: 'www-pax', name: 'Pager Pax', nickname: 'Pax', bio: 'Always on call. Always cutting it close.', look: { archetype: 'blade', build: 'slim', hair: 'bob', headwear: 'visor', outfit: 'tracksuit' }, colors: { top: '#14B8A6', bottoms: '#263238', accent: '#F9F871', hair: '#2A1A40', skin: SKIN.b } },
  { id: 'www-mika', name: 'Modem Mika', nickname: 'Mika', bio: 'Handshakes are a formality. The blade is not.', look: { archetype: 'blade', build: 'standard', hair: 'spiky', headwear: 'headband', outfit: 'gi' }, colors: { top: '#C2343F', bottoms: '#2B2230', accent: '#F3F0E8', hair: '#121018', skin: SKIN.e } },
  { id: 'www-knox', name: 'Kilobyte Knox', nickname: 'Knox', bio: 'Small file size. Huge sword.', look: { archetype: 'blade', build: 'heavy', hair: 'none', headwear: 'beanie', outfit: 'armor' }, colors: { top: '#5B6B7F', bottoms: '#2E3440', accent: '#FFB84D', hair: '#3A2A20', skin: SKIN.c } },
  // Blasters
  { id: 'www-cal', name: 'Cassette Cal', nickname: 'Cal', bio: 'Rewinds with a pencil. Fast-forwards with a laser.', look: { archetype: 'blaster', build: 'standard', hair: 'swoop', headwear: 'headphones', outfit: 'hoodie' }, colors: { top: '#F25CA2', bottoms: '#2A2A40', accent: '#62F3FF', hair: '#5A2E1A', skin: SKIN.b } },
  { id: 'www-pip', name: 'Pixel Pip', nickname: 'Pip', bio: 'Sixteen colors, zero chill.', look: { archetype: 'blaster', build: 'slim', hair: 'ponytail', headwear: 'visor', outfit: 'tracksuit' }, colors: { top: '#FFD23F', bottoms: '#2F3A8C', accent: '#E23A47', hair: '#C2343F', skin: SKIN.a } },
  { id: 'www-bex', name: 'Beeper Bex', nickname: 'Bex', bio: '911? No. 1337.', look: { archetype: 'blaster', build: 'standard', hair: 'afro', headwear: 'none', outfit: 'jacket' }, colors: { top: '#6C4BD8', bottoms: '#1F2933', accent: '#FFB84D', hair: '#2A1A12', skin: SKIN.d } },
  { id: 'www-nova', name: 'Neon Nova', nickname: 'Nova', bio: 'Glows in the dark. Shoots in the dark too.', look: { archetype: 'blaster', build: 'heavy', hair: 'mohawk', headwear: 'none', outfit: 'armor' }, colors: { top: '#22313F', bottoms: '#151B24', accent: '#39FF88', hair: '#39FF88', skin: SKIN.e } },
];

function toBlueprint(spec: WwwSpec): FighterBlueprint {
  const nes = { pixelChart: buildWwwChart(spec.look, { w: 16, h: 24 }), palettes: palettesFor(spec, 'NES') };
  const snes = { pixelChart: buildWwwChart(spec.look, { w: 24, h: 32 }), palettes: palettesFor(spec, 'SNES') };
  const moves = MOVES[spec.look.archetype];
  const info = ARCHETYPE_INFO[spec.look.archetype];
  return {
    id: spec.id,
    name: spec.name,
    nickname: spec.nickname,
    era: 'NES',
    originTag: 'Www Fighters',
    archetype: info.id,
    archetypeLabel: info.label,
    gridSize: 16,
    palettes: nes.palettes,
    pixelChart: nes.pixelChart,
    eraPacks: { NES: nes, SNES_SEGA: snes },
    stats: statsFor(spec.look),
    moveset: moves.core,
    moves: moves.extra,
  };
}

/** The Www Fighters cast, ready for the registry. */
export const WWW_FIGHTERS: readonly FighterBlueprint[] = WWW_SPECS.map(toBlueprint);
