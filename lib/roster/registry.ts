import type { ArchetypeId, FighterBlueprint } from '../types/fighter';
import { MARIO_BLUEPRINT } from './fighters/mario';
import { DONKEY_KONG_BLUEPRINT } from './fighters/donkeyKong';
import { LINK_BLUEPRINT } from './fighters/link';
import { SAMUS_BLUEPRINT } from './fighters/samus';
import { KIRBY_BLUEPRINT } from './fighters/kirby';
import { LUIGI_BLUEPRINT } from './fighters/luigi';
import { BOWSER_BLUEPRINT } from './fighters/bowser';
import { MEGAMAN_BLUEPRINT } from './fighters/megaman';
import { SONIC_BLUEPRINT } from './fighters/sonic';
import { SIMON_BLUEPRINT } from './fighters/simon';
import { RYU_HAYABUSA_BLUEPRINT } from './fighters/ryuHayabusa';
import { PIT_BLUEPRINT } from './fighters/pit';
import { LITTLE_MAC_BLUEPRINT } from './fighters/littleMac';
import { CHRONO_GANG_FIGHTERS } from './fighters/chronoGang';
import { CRYSTAL_45_FIGHTERS } from './fighters/crystalFourFive';
import { CRYSTAL_6_FIGHTERS } from './fighters/crystalSix';
import { clonePixelChart } from './chartParser';
import {
  packFighterForStorage,
  unpackFighterFromStorage,
  type PackedFighterRecord,
} from './nibbleCodec';

const STORAGE_KEY = 'pixel_brawl_25d_custom_fighters_v3';

/**
 * Full 23-character retro cast (13 NES/SEGA classics + 4 Time Trigger + 6 Crystal IV-VI).
 * Paired with the '?' Random tile on Character Select for an exact 8x3 (24-tile) Smash mosaic!
 */
export const BUILTIN_FIGHTERS: readonly FighterBlueprint[] = [
  MARIO_BLUEPRINT,
  DONKEY_KONG_BLUEPRINT,
  LINK_BLUEPRINT,
  SAMUS_BLUEPRINT,
  KIRBY_BLUEPRINT,
  LUIGI_BLUEPRINT,
  BOWSER_BLUEPRINT,
  MEGAMAN_BLUEPRINT,
  SONIC_BLUEPRINT,
  SIMON_BLUEPRINT,
  RYU_HAYABUSA_BLUEPRINT,
  PIT_BLUEPRINT,
  LITTLE_MAC_BLUEPRINT,
  ...CHRONO_GANG_FIGHTERS,
  ...CRYSTAL_45_FIGHTERS,
  ...CRYSTAL_6_FIGHTERS,
];

export function cloneFighterBlueprint(src: FighterBlueprint): FighterBlueprint {
  return {
    ...src,
    palettes: src.palettes.map((p) => ({ name: p.name, colors: [...p.colors] })),
    pixelChart: clonePixelChart(src.pixelChart),
    eraPacks: src.eraPacks
      ? {
          NES: {
            pixelChart: clonePixelChart(src.eraPacks.NES.pixelChart),
            palettes: src.eraPacks.NES.palettes.map((p) => ({
              name: p.name,
              colors: [...p.colors],
            })),
          },
          SNES_SEGA: {
            pixelChart: clonePixelChart(src.eraPacks.SNES_SEGA.pixelChart),
            palettes: src.eraPacks.SNES_SEGA.palettes.map((p) => ({
              name: p.name,
              colors: [...p.colors],
            })),
          },
        }
      : undefined,
    stats: { ...src.stats },
    moveset: {
      jab: { ...src.moveset.jab, hitbox: { ...src.moveset.jab.hitbox } },
      smash: { ...src.moveset.smash, hitbox: { ...src.moveset.smash.hitbox } },
      aerial: { ...src.moveset.aerial, hitbox: { ...src.moveset.aerial.hitbox } },
      neutralSpecial: {
        ...src.moveset.neutralSpecial,
        hitbox: { ...src.moveset.neutralSpecial.hitbox },
        projectile: src.moveset.neutralSpecial.projectile
          ? { ...src.moveset.neutralSpecial.projectile }
          : undefined,
      },
      upSpecial: {
        ...src.moveset.upSpecial,
        hitbox: { ...src.moveset.upSpecial.hitbox },
      },
    },
  };
}

export function getArchetypeTemplate(archetype: ArchetypeId): FighterBlueprint {
  return (
    BUILTIN_FIGHTERS.find((f) => f.archetype === archetype) ?? MARIO_BLUEPRINT
  );
}

/**
 * Loads built-in fighters merged with Base64 4-bit nibble custom/edited fighters from localStorage.
 */
export function loadRoster(): FighterBlueprint[] {
  const baseMap = new Map<string, FighterBlueprint>();
  for (const builtin of BUILTIN_FIGHTERS) {
    baseMap.set(builtin.id, cloneFighterBlueprint(builtin));
  }

  if (typeof window === 'undefined') {
    return Array.from(baseMap.values());
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return Array.from(baseMap.values());
    const parsed = JSON.parse(raw) as PackedFighterRecord[];
    if (Array.isArray(parsed)) {
      for (const rec of parsed) {
        if (rec && rec.id && rec.packedChart) {
          baseMap.set(rec.id, unpackFighterFromStorage(rec));
        }
      }
    }
  } catch {
    // chemx-allow: best-effort fallback to built-in roster if localStorage data is corrupted
  }

  return Array.from(baseMap.values());
}

/**
 * Persists edited built-ins and newly created/imported fighters as compact 4-bit Base64 nibbles.
 */
export function saveCustomFighterToStorage(
  roster: FighterBlueprint[],
  updated: FighterBlueprint,
): FighterBlueprint[] {
  const exists = roster.some((f) => f.id === updated.id);
  const nextRoster = exists
    ? roster.map((f) => (f.id === updated.id ? updated : f))
    : [...roster, updated];

  persistOverrides(nextRoster);
  return nextRoster;
}

export function deleteCustomFighterFromStorage(
  roster: FighterBlueprint[],
  fighterId: string,
): FighterBlueprint[] {
  const builtin = BUILTIN_FIGHTERS.find((f) => f.id === fighterId);
  const nextRoster = builtin
    ? roster.map((f) => (f.id === fighterId ? cloneFighterBlueprint(builtin) : f))
    : roster.filter((f) => f.id !== fighterId);

  persistOverrides(nextRoster);
  return nextRoster;
}

export function resetRosterToDefaults(): FighterBlueprint[] {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  return BUILTIN_FIGHTERS.map((f) => cloneFighterBlueprint(f));
}

function persistOverrides(roster: FighterBlueprint[]): void {
  if (typeof window === 'undefined') return;
  const builtinIds = new Set(BUILTIN_FIGHTERS.map((f) => f.id));
  const customOrModified = roster.filter(
    (f) => f.isCustom || !builtinIds.has(f.id),
  );
  const packed = customOrModified.map((f) => packFighterForStorage(f));
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(packed));
  } catch {
    // chemx-allow: best-effort quota guard so localStorage limits never break active session
  }
}
