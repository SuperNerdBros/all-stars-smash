import type { AnimState, IndexedFrame, PixelChart } from '../../types/palette';

/**
 * Www Fighters: the game's own build-a-fighter cast. Every sprite is generated from parts on a
 * posed skeleton, then auto-outlined and shaded, so any combination of parts looks finished in both
 * the 16x24 8-bit era and the 24x32 16-bit era.
 *
 * Palette indices (see SEMANTIC_PALETTE_LABELS): 1 outline · 2 skin · 3/4 top + shade ·
 * 5/6 bottoms + shade · 7 accent · 8 accent warm · 9 shoes · 10/11 metal light/dark · 12 hair ·
 * 13/14 energy core/glow · 15 white (eyes, sparkle).
 */

export type WwwArchetype = 'brawler' | 'blade' | 'blaster';
export type WwwBuild = 'slim' | 'standard' | 'heavy';
export type WwwHair = 'none' | 'spiky' | 'bob' | 'mohawk' | 'ponytail' | 'afro' | 'swoop';
export type WwwHeadwear = 'none' | 'cap' | 'headband' | 'beanie' | 'visor' | 'headphones';
export type WwwOutfit = 'hoodie' | 'jacket' | 'gi' | 'armor' | 'tracksuit';

export interface WwwLook {
  archetype: WwwArchetype;
  build: WwwBuild;
  hair: WwwHair;
  headwear: WwwHeadwear;
  outfit: WwwOutfit;
}

type Pt = [number, number];

interface Pose {
  /** Torso shift (x lean, y bob). */
  lean: number;
  bob: number;
  front: Pt; // front hand
  back: Pt; // back hand
  frontFoot: Pt;
  backFoot: Pt;
  /** Weapon angle in degrees (0 = forward, -90 = up). */
  weapon: number;
  hurt?: boolean;
  charge?: boolean;
  blink?: boolean;
  /** Motion smear behind the weapon / fist. */
  smear?: boolean;
}

const P = (lean: number, bob: number, front: Pt, back: Pt, frontFoot: Pt, backFoot: Pt, weapon = 20, extra: Partial<Pose> = {}): Pose =>
  ({ lean, bob, front, back, frontFoot, backFoot, weapon, ...extra });

/** Poses on the 24x32 master canvas (facing right, feet on y=31). */
const POSES: Record<AnimState, Pose[]> = {
  idle: [
    P(0, 0, [17, 21], [8, 21], [15, 31], [9, 31], 35),
    P(0, 1, [17, 22], [8, 22], [15, 31], [9, 31], 38, { blink: false }),
    P(0, 1, [17, 22], [8, 22], [15, 31], [9, 31], 38, { blink: true }),
  ],
  walk: [
    P(1, 0, [16, 20], [9, 22], [17, 31], [7, 30], 30),
    P(1, 1, [15, 21], [10, 21], [14, 30], [10, 31], 32),
    P(1, 0, [13, 22], [12, 20], [8, 31], [16, 30], 34),
    P(1, 1, [15, 21], [10, 21], [11, 31], [13, 30], 32),
  ],
  jump: [
    P(0, -1, [19, 13], [5, 15], [15, 28], [9, 29], -30),
    P(1, 0, [18, 17], [6, 18], [16, 29], [8, 27], 0),
  ],
  attack: [
    P(-1, 0, [10, 18], [6, 21], [15, 31], [8, 31], -60),
    P(2, 0, [22, 17], [8, 21], [17, 31], [8, 31], 5, { smear: true }),
    P(1, 0, [19, 19], [8, 21], [16, 31], [8, 31], 25),
  ],
  smash: [
    P(-2, 1, [7, 10], [5, 18], [14, 31], [7, 31], -120, { charge: true }),
    P(2, 0, [21, 12], [10, 20], [18, 31], [7, 31], -50, { smear: true }),
    P(3, 1, [22, 22], [9, 21], [19, 31], [6, 31], 40, { smear: true }),
  ],
  special: [
    P(-1, 0, [12, 19], [9, 19], [15, 31], [8, 31], 0, { charge: true }),
    P(1, 0, [21, 18], [17, 19], [16, 31], [8, 31], 0, { charge: true }),
    P(1, 0, [22, 18], [16, 20], [16, 31], [8, 31], 0),
  ],
  hurt: [
    P(-2, 1, [14, 12], [6, 13], [14, 31], [10, 30], -80, { hurt: true }),
    P(-3, 2, [13, 11], [5, 12], [15, 30], [10, 31], -90, { hurt: true }),
  ],
};

const TICKS: Record<AnimState, number> = { idle: 14, walk: 6, jump: 10, attack: 4, smash: 6, special: 6, hurt: 8 };

// ── Canvas with scaling (master 24x32 → era size) ───────────────

class Canvas {
  readonly px: number[][];
  constructor(readonly w: number, readonly h: number, private readonly sx: number, private readonly sy: number) {
    this.px = Array.from({ length: h }, () => new Array<number>(w).fill(0));
  }
  X(x: number): number {
    return Math.round(x * this.sx);
  }
  Y(y: number): number {
    return Math.round(y * this.sy);
  }
  set(x: number, y: number, c: number): void {
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.px[y][x] = c;
  }
  get(x: number, y: number): number {
    return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.px[y][x] : 0;
  }
  /** Filled rect in master coords (inclusive). */
  rect(x0: number, y0: number, x1: number, y1: number, c: number): void {
    const a = this.X(Math.min(x0, x1));
    const b = this.X(Math.max(x0, x1));
    const t = this.Y(Math.min(y0, y1));
    const d = this.Y(Math.max(y0, y1));
    for (let y = t; y <= d; y++) for (let x = a; x <= b; x++) this.set(x, y, c);
  }
  /** Rounded rect: corners trimmed. */
  rrect(x0: number, y0: number, x1: number, y1: number, c: number): void {
    const a = this.X(x0);
    const b = this.X(x1);
    const t = this.Y(y0);
    const d = this.Y(y1);
    for (let y = t; y <= d; y++) {
      for (let x = a; x <= b; x++) {
        const corner = (y === t || y === d) && (x === a || x === b);
        if (!corner) this.set(x, y, c);
      }
    }
  }
  /** Thick line in master coords. */
  line(p: Pt, q: Pt, c: number, thick = 2): void {
    const x0 = this.X(p[0]);
    const y0 = this.Y(p[1]);
    const x1 = this.X(q[0]);
    const y1 = this.Y(q[1]);
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    const r = Math.max(1, Math.round(thick * this.sx));
    for (let i = 0; i <= steps; i++) {
      const x = Math.round(x0 + ((x1 - x0) * i) / steps);
      const y = Math.round(y0 + ((y1 - y0) * i) / steps);
      for (let dy = 0; dy < r; dy++) for (let dx = 0; dx < r; dx++) this.set(x + dx - (r >> 1), y + dy - (r >> 1), c);
    }
  }
  /** Ray of `len` master px from p at angle (deg). Returns the tip. */
  ray(p: Pt, deg: number, len: number, c: number, thick = 1): Pt {
    const rad = (deg * Math.PI) / 180;
    const tip: Pt = [p[0] + Math.cos(rad) * len, p[1] + Math.sin(rad) * len];
    this.line(p, tip, c, thick);
    return tip;
  }
  /** Outline every filled pixel's empty 4-neighbours with index 1. */
  outline(): void {
    const marks: Pt[] = [];
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.px[y][x] !== 0) continue;
        const touches = this.get(x - 1, y) > 1 || this.get(x + 1, y) > 1 || this.get(x, y - 1) > 1 || this.get(x, y + 1) > 1;
        if (touches) marks.push([x, y]);
      }
    }
    for (const [x, y] of marks) this.px[y][x] = 1;
  }
  /** Bottom-right rim of each region in its shade index (light from the upper-left). */
  shade(main: number, shadow: number): void {
    for (let y = this.h - 1; y >= 0; y--) {
      for (let x = this.w - 1; x >= 0; x--) {
        if (this.px[y][x] !== main) continue;
        const below = this.get(x, y + 1);
        const right = this.get(x + 1, y);
        if ((below !== main && below !== shadow) || (right !== main && right !== shadow)) this.px[y][x] = shadow;
      }
    }
  }
}

// ── Body drawing ────────────────────────────────────────────────

const BUILD_W: Record<WwwBuild, number> = { slim: -1, standard: 0, heavy: 1 };

function drawFighter(cv: Canvas, look: WwwLook, pose: Pose): void {
  const wb = BUILD_W[look.build];
  const L = pose.lean;
  const B = pose.bob;
  const hipY = 22 + B;
  const torso = { x0: 8 + L - wb, x1: 16 + L + wb, y0: 14 + B, y1: hipY };
  const hipF: Pt = [14 + L, hipY];
  const hipB: Pt = [10 + L, hipY];
  const shF: Pt = [15 + L + wb, 16 + B];
  const shB: Pt = [9 + L - wb, 16 + B];

  // Back limbs first (darker = depth)
  cv.line(hipB, pose.backFoot, 6, 3);
  cv.rect(pose.backFoot[0] - 1, pose.backFoot[1] - 1, pose.backFoot[0] + 2, pose.backFoot[1], 9);
  const sleeve = look.outfit === 'armor' ? 11 : 4;
  cv.line(shB, pose.back, sleeve, 2);
  cv.rect(pose.back[0] - 1, pose.back[1] - 1, pose.back[0], pose.back[1], look.archetype === 'brawler' ? 8 : 2);

  // Front leg
  cv.line(hipF, pose.frontFoot, 5, 3);
  cv.rect(pose.frontFoot[0] - 1, pose.frontFoot[1] - 1, pose.frontFoot[0] + 3, pose.frontFoot[1], 9);

  // Torso by outfit
  cv.rrect(torso.x0, torso.y0, torso.x1, torso.y1, 3);
  if (look.outfit === 'hoodie') {
    cv.rect(torso.x0 + 2, torso.y0 + 5, torso.x1 - 2, torso.y0 + 6, 4); // pocket
    cv.rect(torso.x0 + 3, torso.y0, torso.x0 + 3, torso.y0 + 3, 15); // drawstrings
    cv.rect(torso.x0 + 5, torso.y0, torso.x0 + 5, torso.y0 + 3, 15);
  } else if (look.outfit === 'jacket') {
    cv.rect(torso.x0 + 4, torso.y0, torso.x0 + 4, torso.y1 - 1, 7); // zipper
    cv.rect(torso.x0 + 3, torso.y0, torso.x0 + 5, torso.y0 + 1, 5); // collar
  } else if (look.outfit === 'gi') {
    cv.line([torso.x0 + 2, torso.y0], [torso.x0 + 5, torso.y0 + 5], 15, 1); // lapel
    cv.rect(torso.x0, torso.y1 - 2, torso.x1, torso.y1 - 1, 7); // belt
  } else if (look.outfit === 'armor') {
    cv.rrect(torso.x0 + 1, torso.y0 + 1, torso.x1 - 1, torso.y0 + 5, 10); // breastplate
    cv.rect(torso.x0 + 4, torso.y0 + 2, torso.x0 + 5, torso.y0 + 3, 13); // core gem
  } else {
    cv.rect(torso.x0, torso.y0 + 3, torso.x1, torso.y0 + 3, 15); // tracksuit stripe
    cv.rect(torso.x0, torso.y0 + 4, torso.x1, torso.y0 + 4, 7);
  }
  // Chest emblem: the Www link cursor
  if (look.outfit !== 'armor') {
    const ex = torso.x1 - 3;
    const ey = torso.y0 + 2;
    cv.set(cv.X(ex), cv.Y(ey), 7);
    cv.set(cv.X(ex), cv.Y(ey) + 1, 7);
    cv.set(cv.X(ex) + 1, cv.Y(ey) + 1, 7);
  }
  // Waistband
  cv.rect(torso.x0, torso.y1, torso.x1, torso.y1, 6);

  // Head
  drawHead(cv, look, pose, L, B);

  // Front arm + weapon
  cv.line(shF, pose.front, sleeve === 11 ? 10 : 3, 2);
  drawWeapon(cv, look, pose);
}

function drawHead(cv: Canvas, look: WwwLook, pose: Pose, L: number, B: number): void {
  const hx0 = 7 + L;
  const hx1 = 17 + L;
  const hy0 = 3 + B;
  const hy1 = 13 + B;
  // Back hair (ponytail / bob) under the head
  if (look.hair === 'ponytail') cv.line([hx0, hy0 + 3], [hx0 - 3, hy0 + 8], 12, 2);
  if (look.hair === 'bob') cv.rect(hx0 - 1, hy0 + 2, hx0 + 1, hy1 - 1, 12);
  if (look.hair === 'afro') {
    cv.rrect(hx0 - 3, hy0 - 4, hx1 + 1, hy0 + 7, 12);
    cv.rrect(hx0 - 1, hy0 - 5, hx1 - 2, hy0 - 3, 12);
  }

  cv.rrect(hx0, hy0, hx1, hy1, 2); // face
  // Ear
  cv.rect(hx0 + 2, hy0 + 5, hx0 + 3, hy0 + 7, 2);

  // Eyes (facing right)
  const ey = hy0 + 5;
  if (pose.hurt) {
    for (const ex of [hx1 - 5, hx1 - 2]) {
      cv.set(cv.X(ex) - 1, cv.Y(ey) - 1, 1);
      cv.set(cv.X(ex) + 1, cv.Y(ey) - 1, 1);
      cv.set(cv.X(ex), cv.Y(ey), 1);
      cv.set(cv.X(ex) - 1, cv.Y(ey) + 1, 1);
      cv.set(cv.X(ex) + 1, cv.Y(ey) + 1, 1);
    }
  } else if (pose.blink) {
    cv.rect(hx1 - 5, ey + 1, hx1 - 4, ey + 1, 1);
    cv.rect(hx1 - 2, ey + 1, hx1 - 1, ey + 1, 1);
  } else {
    cv.rect(hx1 - 5, ey, hx1 - 5, ey + 2, 1);
    cv.rect(hx1 - 2, ey, hx1 - 2, ey + 2, 1);
    cv.set(cv.X(hx1 - 5), cv.Y(ey), 15);
    cv.set(cv.X(hx1 - 2), cv.Y(ey), 15);
  }
  // Mouth: a small dark line (open "o" when hurt), with cheek blush under the front eye.
  if (pose.hurt) cv.rect(hx1 - 3, hy1 - 3, hx1 - 3, hy1 - 2, 1);
  else cv.set(cv.X(hx1 - 3), cv.Y(hy1 - 2), 1);
  cv.set(cv.X(hx1 - 1), cv.Y(ey + 3), 8);

  // Front hair
  if (look.hair === 'spiky') {
    for (let i = 0; i < 4; i++) cv.line([hx0 + 1 + i * 3, hy0 + 1], [hx0 + i * 3, hy0 - 3], 12, 2);
    cv.rect(hx0, hy0, hx1, hy0 + 2, 12);
  } else if (look.hair === 'bob' || look.hair === 'ponytail' || look.hair === 'swoop') {
    cv.rect(hx0, hy0 - 1, hx1, hy0 + 2, 12);
    if (look.hair === 'swoop') cv.line([hx0 + 4, hy0 + 1], [hx1 + 1, hy0 + 4], 12, 2);
    else cv.rect(hx1 - 2, hy0 + 2, hx1, hy0 + 3, 12);
  } else if (look.hair === 'mohawk') {
    cv.rect(hx0 + 2, hy0 - 5, hx0 + 7, hy0 + 1, 12);
    cv.rect(hx0 + 3, hy0 - 6, hx0 + 6, hy0 - 6, 12);
  } else if (look.hair === 'afro') {
    cv.rect(hx0, hy0, hx1, hy0 + 1, 12);
  }

  // Headwear
  if (look.headwear === 'cap') {
    cv.rrect(hx0, hy0 - 2, hx1, hy0 + 1, 5);
    cv.rect(hx1 - 1, hy0 + 1, hx1 + 3, hy0 + 2, 6); // brim forward
    cv.set(cv.X(hx0 + 5), cv.Y(hy0 - 1), 7);
  } else if (look.headwear === 'headband') {
    cv.rect(hx0, hy0 + 2, hx1, hy0 + 3, 7);
    cv.line([hx0, hy0 + 3], [hx0 - 3, hy0 + 6], 7, 1);
  } else if (look.headwear === 'beanie') {
    cv.rrect(hx0, hy0 - 3, hx1, hy0 + 2, 5);
    cv.rect(hx0, hy0 + 1, hx1, hy0 + 2, 6);
    cv.rect(hx0 + 4, hy0 - 5, hx0 + 5, hy0 - 4, 7); // pompom
  } else if (look.headwear === 'visor') {
    cv.rect(hx1 - 7, hy0 + 4, hx1 + 1, hy0 + 6, 14);
    cv.rect(hx1 - 6, hy0 + 5, hx1, hy0 + 5, 13);
  } else if (look.headwear === 'headphones') {
    cv.line([hx0, hy0 + 1], [hx1 - 3, hy0 - 2], 11, 1);
    cv.rrect(hx0 - 1, hy0 + 3, hx0 + 2, hy0 + 8, 11);
    cv.rect(hx0, hy0 + 4, hx0 + 1, hy0 + 7, 7);
  }
}

function drawWeapon(cv: Canvas, look: WwwLook, pose: Pose): void {
  const h = pose.front;
  if (look.archetype === 'brawler') {
    // Big wrapped fist
    cv.rrect(h[0] - 1, h[1] - 2, h[0] + 2, h[1] + 1, 8);
    cv.rect(h[0] - 1, h[1], h[0] + 2, h[1], 7);
    if (pose.smear) {
      cv.rect(h[0] - 7, h[1] - 1, h[0] - 3, h[1] - 1, 14);
      cv.rect(h[0] - 9, h[1] + 1, h[0] - 4, h[1] + 1, 14);
    }
    if (pose.charge) cv.rect(h[0] - 2, h[1] - 3, h[0] + 3, h[1] - 3, 13);
  } else if (look.archetype === 'blade') {
    cv.rect(h[0] - 1, h[1] - 1, h[0], h[1], 2); // hand
    const guard = cv.ray(h, pose.weapon, 2, 11, 2);
    cv.ray(guard, pose.weapon, 10, 10, 2);
    cv.ray(guard, pose.weapon, 10, 15, 1);
    if (pose.smear) cv.ray(h, pose.weapon + 35, 9, 14, 1);
  } else {
    // Blaster: chunky retro ray gun
    cv.rect(h[0] - 1, h[1] - 1, h[0], h[1], 2);
    cv.rrect(h[0] - 1, h[1] - 3, h[0] + 5, h[1] - 1, 11);
    cv.rect(h[0], h[1] - 3, h[0] + 4, h[1] - 3, 10);
    cv.rect(h[0] + 5, h[1] - 3, h[0] + 6, h[1] - 2, 13);
    if (pose.charge || pose.smear) {
      cv.rect(h[0] + 7, h[1] - 4, h[0] + 9, h[1] - 1, 14);
      cv.rect(h[0] + 8, h[1] - 3, h[0] + 8, h[1] - 2, 15);
    }
  }
}

// ── Public ──────────────────────────────────────────────────────

function render(look: WwwLook, pose: Pose, w: number, h: number): IndexedFrame {
  const cv = new Canvas(w, h, w / 24, h / 32);
  drawFighter(cv, look, pose);
  cv.shade(3, 4);
  cv.shade(5, 6);
  cv.shade(12, 1);
  cv.shade(10, 11);
  cv.outline();
  return cv.px;
}

/** Full animation chart for one era size. 16-bit: 24x32. 8-bit: 16x24. */
export function buildWwwChart(look: WwwLook, size: { w: number; h: number }): PixelChart {
  const chart = {} as PixelChart;
  for (const state of Object.keys(POSES) as AnimState[]) {
    chart[state] = {
      frames: POSES[state].map((pose) => render(look, pose, size.w, size.h)),
      ticksPerFrame: TICKS[state],
    };
  }
  return chart;
}
