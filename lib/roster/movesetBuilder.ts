import type { FighterBlueprint, MoveFrameData, MoveOverride } from '../types/fighter';
import { MOVE_SLOTS, type MoveSlot } from '../types/moves';

export type FullMoveset = Record<MoveSlot, MoveFrameData>;

/**
 * Derives the full 23-slot move matrix from a fighter's 5 core moves.
 *
 * How to author a fighter:
 *   1. Fill in `moveset` (jab, smash, aerial, neutralSpecial, upSpecial) — required.
 *   2. Add `moves: { utilt: {...}, dair: {...} }` to override any derived slot.
 *      Overrides are shallow-merged over the template, so `{ damage: 14 }` is enough.
 *   3. Run `validateMoveset` (the dev test does this for every built-in fighter).
 */
export function buildFullMoveset(bp: FighterBlueprint): FullMoveset {
  const core = bp.moveset;
  const jab = core.jab;
  const smash = core.smash;
  const air = core.aerial;
  const ns = core.neutralSpecial;
  const runSpeed = bp.stats.runSpeed;

  const derive = (src: MoveFrameData, patch: MoveOverride): MoveFrameData => ({
    ...src,
    projectile: undefined,
    velocityBoostX: undefined,
    velocityBoostY: undefined,
    hitboxes: undefined,
    ...patch,
    hitbox: { ...src.hitbox, ...(patch.hitbox ?? {}) },
  });
  const r = (n: number) => Math.round(n * 10) / 10;
  const hb = (m: MoveFrameData) => m.hitbox;

  const templates: FullMoveset = {
    // ── Grounded normals ──
    jab: { ...jab },
    dashAttack: derive(jab, {
      name: `Dashing ${jab.name}`,
      startup: jab.startup + 3,
      active: jab.active + 3,
      endlag: jab.endlag + 12,
      damage: r(jab.damage * 1.35),
      baseKnockback: jab.baseKnockback * 1.25,
      launchAngleDeg: 50,
      velocityBoostX: runSpeed * 1.15,
    }),
    ftilt: derive(jab, {
      name: `${jab.name} Thrust`,
      startup: jab.startup + 3,
      active: jab.active,
      endlag: jab.endlag + 6,
      damage: r(jab.damage * 1.45),
      knockbackGrowth: jab.knockbackGrowth * 1.6,
      launchAngleDeg: 32,
      hitbox: { offsetX: hb(jab).offsetX + 4, width: hb(jab).width + 4 },
    }),
    utilt: derive(jab, {
      name: 'Rising Swipe',
      startup: jab.startup + 2,
      endlag: jab.endlag + 6,
      damage: r(jab.damage * 1.25),
      knockbackGrowth: jab.knockbackGrowth * 1.5,
      launchAngleDeg: 92,
      weightIndependent: false,
      hitbox: { offsetX: 4, offsetY: -24, width: 20, height: 14 },
    }),
    dtilt: derive(jab, {
      name: 'Low Sweep',
      startup: Math.max(3, jab.startup),
      endlag: jab.endlag + 2,
      damage: r(jab.damage * 1.0),
      knockbackGrowth: jab.knockbackGrowth * 1.2,
      launchAngleDeg: 78,
      hitbox: { offsetX: hb(jab).offsetX + 3, offsetY: -3, width: hb(jab).width + 4, height: 8 },
    }),

    // ── Smash attacks (chargeable) ──
    fsmash: { ...smash, chargeable: true },
    usmash: derive(smash, {
      name: 'Skyward Smash',
      startup: smash.startup + 1,
      damage: r(smash.damage * 0.95),
      launchAngleDeg: 88,
      chargeable: true,
      hitbox: { offsetX: 2, offsetY: -26, width: 22, height: 16 },
    }),
    dsmash: derive(smash, {
      name: 'Ground Splitter',
      startup: Math.max(5, smash.startup - 2),
      endlag: smash.endlag + 4,
      damage: r(smash.damage * 0.85),
      launchAngleDeg: 28,
      chargeable: true,
      hitbox: { offsetX: 12, offsetY: -4, width: 16, height: 9 },
      hitboxes: [
        { id: 0, offsetX: 12, offsetY: -4, width: 16, height: 9 },
        { id: 1, offsetX: -12, offsetY: -4, width: 16, height: 9, damage: r(smash.damage * 0.75) },
      ],
    }),

    // ── Aerials ──
    nair: derive(air, {
      name: 'Spin Kick',
      startup: Math.max(3, air.startup - 2),
      active: air.active + 4,
      damage: r(air.damage * 0.8),
      knockbackGrowth: air.knockbackGrowth * 0.9,
      launchAngleDeg: 45,
      landingLag: 7,
      hitbox: { offsetX: 0, offsetY: -11, width: 26, height: 22 },
    }),
    fair: { ...air, landingLag: air.landingLag ?? 10 },
    bair: derive(air, {
      name: 'Back Kick',
      startup: air.startup + 1,
      damage: r(air.damage * 1.12),
      knockbackGrowth: air.knockbackGrowth * 1.12,
      launchAngleDeg: 38,
      landingLag: 9,
      hitbox: { offsetX: -hb(air).offsetX - 2 },
    }),
    uair: derive(air, {
      name: 'Overhead Arc',
      startup: Math.max(3, air.startup - 1),
      damage: r(air.damage * 0.9),
      launchAngleDeg: 85,
      landingLag: 8,
      hitbox: { offsetX: 0, offsetY: -28, width: 22, height: 12 },
    }),
    dair: derive(air, {
      name: 'Meteor Stomp',
      startup: air.startup + 6,
      active: air.active,
      endlag: air.endlag + 6,
      damage: r(air.damage * 1.1),
      baseKnockback: air.baseKnockback * 1.1,
      knockbackGrowth: air.knockbackGrowth * 0.95,
      launchAngleDeg: -75,
      landingLag: 16,
      hitbox: { offsetX: 0, offsetY: 4, width: 14, height: 12 },
      hitboxes: [
        // sweet-spot meteor at the feet, sour-spot body pops upward
        { id: 0, offsetX: 0, offsetY: 4, width: 12, height: 10, hitlagMult: 1.25 },
        { id: 1, offsetX: 0, offsetY: -10, width: 18, height: 14, launchAngleDeg: 70, damage: r(air.damage * 0.7), hitlagMult: 0.7 },
      ],
    }),

    // ── Specials ──
    neutralSpecial: { ...ns },
    sideSpecial: derive(smash, {
      name: 'Lunge Strike',
      startup: 9,
      active: 8,
      endlag: 20,
      damage: r(smash.damage * 0.7),
      knockbackGrowth: smash.knockbackGrowth * 0.8,
      launchAngleDeg: 35,
      velocityBoostX: runSpeed * 1.9,
      landingLag: 14,
    }),
    upSpecial: { ...core.upSpecial },
    downSpecial: derive(jab, {
      name: 'Cyclone Spin',
      startup: 6,
      active: 24,
      endlag: 16,
      damage: 2,
      baseKnockback: 1.4,
      knockbackGrowth: 25,
      launchAngleDeg: 80,
      multiHitInterval: 5,
      weightIndependent: true,
      hitbox: { offsetX: 0, offsetY: -11, width: 30, height: 20 },
    }),

    // ── Grabs & throws ── (throw hitbox is unused: throws release from the hold)
    grab: derive(jab, {
      name: 'Grab',
      startup: 6,
      active: 2,
      endlag: 24,
      damage: 0,
      baseKnockback: 0,
      knockbackGrowth: 0,
      launchAngleDeg: 0,
      hitbox: { offsetX: 11, offsetY: -12, width: 12, height: 14 },
    }),
    pummel: derive(jab, {
      name: 'Pummel', startup: 2, active: 1, endlag: 10,
      damage: 1.5, baseKnockback: 0, knockbackGrowth: 0, launchAngleDeg: 0,
    }),
    fthrow: derive(jab, {
      name: 'Forward Throw', startup: 8, active: 1, endlag: 18,
      damage: 7, baseKnockback: 6.5, knockbackGrowth: 55, launchAngleDeg: 40,
    }),
    bthrow: derive(jab, {
      name: 'Back Throw', startup: 12, active: 1, endlag: 20,
      damage: 9, baseKnockback: 6, knockbackGrowth: 72, launchAngleDeg: 42,
    }),
    uthrow: derive(jab, {
      name: 'Up Throw', startup: 9, active: 1, endlag: 18,
      damage: 7, baseKnockback: 7, knockbackGrowth: 60, launchAngleDeg: 90,
    }),
    dthrow: derive(jab, {
      name: 'Down Throw', startup: 10, active: 1, endlag: 16,
      damage: 5, baseKnockback: 6, knockbackGrowth: 35, launchAngleDeg: 75,
      weightIndependent: true,
    }),
  };

  const overrides = bp.moves ?? {};
  const out = {} as FullMoveset;
  for (const slot of MOVE_SLOTS) {
    const base = templates[slot];
    const ov = overrides[slot];
    out[slot] = ov
      ? { ...base, ...ov, hitbox: { ...base.hitbox, ...(ov.hitbox ?? {}) } }
      : base;
  }
  return out;
}

export interface MovesetIssue {
  slot: MoveSlot;
  message: string;
}

/** Catches broken frame data before it reaches the engine. */
export function validateMoveset(moves: FullMoveset): MovesetIssue[] {
  const issues: MovesetIssue[] = [];
  for (const slot of MOVE_SLOTS) {
    const m = moves[slot];
    const push = (message: string) => issues.push({ slot, message });
    if (!m) {
      push('missing');
      continue;
    }
    if (!Number.isInteger(m.startup) || m.startup < 1) push(`startup must be an integer ≥ 1 (got ${m.startup})`);
    if (!Number.isInteger(m.active) || m.active < 1) push(`active must be an integer ≥ 1 (got ${m.active})`);
    if (!Number.isInteger(m.endlag) || m.endlag < 0) push(`endlag must be an integer ≥ 0 (got ${m.endlag})`);
    if (m.damage < 0 || m.damage > 60) push(`damage out of range (got ${m.damage})`);
    if (m.knockbackGrowth < 0 || m.knockbackGrowth > 250) push(`knockbackGrowth out of range (got ${m.knockbackGrowth})`);
    if (m.launchAngleDeg < -90 || m.launchAngleDeg > 180) push(`launchAngleDeg out of range (got ${m.launchAngleDeg})`);
    if (m.hitbox.width <= 0 || m.hitbox.height <= 0) push('hitbox must have positive size');
    if (m.hitboxes) {
      const ids = new Set<number>();
      for (const h of m.hitboxes) {
        if (ids.has(h.id)) push(`duplicate hitbox id ${h.id}`);
        ids.add(h.id);
        if (h.width <= 0 || h.height <= 0) push(`hitbox ${h.id} must have positive size`);
      }
    }
    if (m.multiHitInterval !== undefined && m.multiHitInterval < 1) push('multiHitInterval must be ≥ 1');
  }
  return issues;
}
