import type { ArchetypeId, FighterBlueprint } from '../types/fighter';
import { MARIO_BLUEPRINT } from './fighters/mario';
import { LUIGI_BLUEPRINT } from './fighters/luigi';
import { LINK_BLUEPRINT } from './fighters/link';
import { MEGAMAN_BLUEPRINT } from './fighters/megaman';
import { SONIC_BLUEPRINT } from './fighters/sonic';
import { SAMUS_BLUEPRINT } from './fighters/samus';
import { clonePixelChart } from './chartParser';
import {
  packFighterForStorage,
  unpackFighterFromStorage,
  type PackedFighterRecord,
} from './nibbleCodec';

const STORAGE_KEY = 'pixel_brawl_25d_custom_fighters_v1';

export const BUILTIN_FIGHTERS: readonly FighterBlueprint[] = [
  MARIO_BLUEPRINT,
  LUIGI_BLUEPRINT,
  LINK_BLUEPRINT,
  MEGAMAN_BLUEPRINT,
  SONIC_BLUEPRINT,
  SAMUS_BLUEPRINT,
];

export function cloneFighterBlueprint(src: FighterBlueprint): FighterBlueprint {
  return {
    ...src,
    palettes: src.palettes.map((p) => ({ name: p.name, colors: [...p.colors] })),
    pixelChart: clonePixelChart(src.pixelChart),
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
    // Ignore corrupted storage and fall back cleanly to built-in roster.
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
    // Quota guard: fail silently rather than breaking active session.
  }
}
