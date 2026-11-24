import { INPUT_DOWN, INPUT_LEFT, INPUT_RIGHT } from '../types/protocol';
import { computeVolumeState } from './platformMotion';
import {
  HURTBOX_HALF_W,
  HURTBOX_HEIGHT,
  spawnParticles,
  type FighterEntity,
  type SimulationState,
} from './combatTypes';

function handleWallFaceContact(
  sim: SimulationState,
  f: FighterEntity,
  faceX: number,
  side: 1 | -1,
  holdingToward: boolean,
  holdingDown: boolean,
): void {
  const penetrating = side === 1
    ? f.x + HURTBOX_HALF_W > faceX
    : f.x - HURTBOX_HALF_W < faceX;

  if (penetrating) {
    f.x = side === 1 ? faceX - HURTBOX_HALF_W : faceX + HURTBOX_HALF_W;
    if (f.hitstun > 0) {
      f.vx = side === 1 ? -Math.abs(f.vx) * 0.6 : Math.abs(f.vx) * 0.6;
    } else {
      f.vx = side === 1 ? Math.min(0, f.vx) : Math.max(0, f.vx);
    }
  }

  const canLatch =
    !f.grounded &&
    f.hitstun === 0 &&
    !f.moveKey &&
    f.wallJumpLockTimer === 0 &&
    !holdingDown &&
    (holdingToward || f.vy > -0.8);

  if (!canLatch) return;

  f.x = side === 1 ? faceX - HURTBOX_HALF_W : faceX + HURTBOX_HALF_W;
  f.vx = 0;
  f.wallClingDir = side;
  f.lastWallClingDir = side;
  f.wallClingGraceTimer = 6;
  f.facing = side === 1 ? -1 : 1;

  const shouldEmitDust = sim.matchTimeTicks % 7 === 0;
  if (shouldEmitDust) {
    spawnParticles(sim, faceX, f.y - 8, 1, 'dust', '#E2E8F0', 0.6);
  }
}

function handleBlastZoneKo(sim: SimulationState, f: FighterEntity): void {
  const bz = sim.stage.blastZones;
  const outX = f.x < bz.left || f.x > bz.right;
  const outY = f.y < bz.top || f.y > bz.bottom;
  if (!outX && !outY) return;

  const opp = sim.fighters[f.slot === 0 ? 1 : 0];
  opp.kosScored++;
  f.stocks = Math.max(0, f.stocks - 1);
  sim.pendingSfx.push('ko');
  sim.pendingKo = { x: f.x, y: f.y };

  const clampedX = Math.max(bz.left + 20, Math.min(bz.right - 20, f.x));
  const clampedY = Math.max(bz.top + 20, Math.min(bz.bottom - 20, f.y));
  const burstColor = f.slot === 0 ? '#EF4444' : '#3B82F6';
  spawnParticles(sim, clampedX, clampedY, 18, 'ko', burstColor, 5.2);

  const isEliminated = f.stocks <= 0;
  if (isEliminated) {
    sim.winnerSlot = opp.slot;
    sim.pendingSfx.push('victory');
    f.respawnTimer = 9999;
    return;
  }

  const spawn = sim.stage.spawnPoints[f.slot];
  f.x = spawn.x;
  f.y = spawn.y - 34;
  f.vx = 0;
  f.vy = 0;
  f.damagePct = 0;
  f.hitstun = 0;
  f.moveKey = null;
  f.jumpsLeft = f.blueprint.stats.maxJumps;
  f.upSpecialUsed = false;
  f.shieldHp = 100;
  f.respawnTimer = 42;
  f.invulnTimer = 90;
}

/**
 * Integrates fighter gravity (respecting low-gravity stages), moving-platform carry,
 * spring bounce pads, conveyor belts, icy surfaces, wall clinging, and blast-zone KOs.
 */
export function integrateFighterStagePhysics(
  sim: SimulationState,
  f: FighterEntity,
): void {
  const isRespawning = f.respawnTimer > 0;
  if (isRespawning) return;

  const stats = f.blueprint.stats;
  const gravScale = sim.stage.gravityScale ?? 1;
  const prevY = f.y;

  if (!f.grounded) {
    const isSlidingWall = f.wallClingDir !== 0 && f.vy >= 0;
    if (isSlidingWall) {
      f.wallClingStamina = Math.max(0, f.wallClingStamina - 1);
      const maxSlide = f.wallClingStamina > 0 ? 0.34 : 1.6;
      f.vy = Math.min(maxSlide, f.vy + stats.gravity * 0.25 * gravScale);
    } else {
      f.vy = Math.min(stats.fastFallSpeed, f.vy + stats.gravity * gravScale);
    }
  }

  f.x += f.vx;
  f.y += f.vy;

  const wasGrounded = f.grounded;
  f.grounded = false;
  f.onIce = false;
  f.wallClingDir = 0;

  const holdingDown = Boolean(f.input.heldMask & INPUT_DOWN);
  const holdingLeft = Boolean(f.input.heldMask & INPUT_LEFT);
  const holdingRight = Boolean(f.input.heldMask & INPUT_RIGHT);

  for (const vol of sim.stage.volumes) {
    const skipBackdropVolume = vol.decorative && vol.z !== 0;
    if (skipBackdropVolume) continue;

    const pose = computeVolumeState(vol, sim.matchTimeTicks);
    if (!pose.solidActive) continue;

    const left = pose.x - vol.width * 0.5;
    const right = pose.x + vol.width * 0.5;
    const top = pose.topY;
    const bottom = pose.topY + vol.height;

    const withinX = f.x + HURTBOX_HALF_W * 0.65 > left && f.x - HURTBOX_HALF_W * 0.65 < right;
    const snapMargin = 5 + Math.abs(pose.dy) + 1;
    const crossingTop = !vol.decorative && withinX && f.vy >= -Math.abs(pose.dy) && prevY <= top + snapMargin && f.y >= top - Math.max(0, -pose.dy);

    if (crossingTop) {
      const droppingThrough = vol.passThrough && f.dropThroughTimer > 0;
      if (droppingThrough) continue;

      // Apply spring bounce pad launch
      if (vol.surfaceEffect === 'spring') {
        const power = vol.springPower ?? 1.48;
        f.y = top - 1;
        f.vy = -stats.jumpForce * power;
        f.grounded = false;
        f.jumpsLeft = stats.maxJumps;
        f.upSpecialUsed = false;
        f.squashX = 0.68;
        f.squashY = 1.38;
        sim.pendingSfx.push('tripleJump');
        spawnParticles(sim, f.x, top, 9, 'spark', '#FACC15', 3.0);
        continue;
      }

      // Land & inherit moving platform carry velocity
      f.y = top;
      f.x += pose.dx;
      f.vy = 0;
      f.grounded = true;
      f.jumpsLeft = stats.maxJumps;
      f.upSpecialUsed = false;
      f.wallClingStamina = 95;
      f.wallClingGraceTimer = 0;

      if (vol.surfaceEffect === 'ice') {
        f.onIce = true;
      } else if (vol.surfaceEffect === 'conveyor-right') {
        f.x += vol.conveyorSpeed ?? 1.15;
      } else if (vol.surfaceEffect === 'conveyor-left') {
        f.x -= vol.conveyorSpeed ?? 1.15;
      }

      if (!wasGrounded) {
        f.squashX = 1.2;
        f.squashY = 0.82;
        spawnParticles(sim, f.x, f.y, 4, 'dust', '#CBD5E1', 1.2);
      }
      continue;
    }

    if (vol.passThrough) continue;

    const withinY = f.y > top + 4 && f.y - HURTBOX_HEIGHT < bottom;
    if (!withinY) continue;

    const touchingLeftFace = f.x + HURTBOX_HALF_W >= left - 2 && f.x < pose.x;
    const touchingRightFace = f.x - HURTBOX_HALF_W <= right + 2 && f.x > pose.x;

    if (touchingLeftFace) {
      handleWallFaceContact(sim, f, left, 1, holdingRight, holdingDown);
    } else if (touchingRightFace) {
      handleWallFaceContact(sim, f, right, -1, holdingLeft, holdingDown);
    }
  }

  handleBlastZoneKo(sim, f);
}
