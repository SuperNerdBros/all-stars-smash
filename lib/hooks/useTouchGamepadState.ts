'use client';

import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { INPUT_DOWN, INPUT_LEFT, INPUT_RIGHT, INPUT_UP } from '../types/protocol';

export interface StickOffset {
  x: number;
  y: number;
}

export interface TouchPadView {
  pressedMask: number;
  stickOffset: StickOffset;
  dpadActive: boolean;
}

export interface ActionButtonHandlers {
  onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerCancel: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onLostPointerCapture: (e: React.PointerEvent<HTMLButtonElement>) => void;
}

export interface DpadHandlers {
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (e: React.PointerEvent<HTMLDivElement>) => void;
  onLostPointerCapture: (e: React.PointerEvent<HTMLDivElement>) => void;
}

export interface TouchGamepadState {
  dpadZoneRef: React.RefObject<HTMLDivElement | null>;
  view: TouchPadView;
  bindActionButton: (bitMask: number) => ActionButtonHandlers;
  dpadHandlers: DpadHandlers;
}

interface PointerTracker {
  masks: Map<number, number>;
  dpadPointerId: number | null;
}

function triggerSoftHaptic(): void {
  const canVibrate = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
  if (canVibrate) {
    navigator.vibrate(10);
  }
}

function computeDpadMaskFromOffset(dx: number, dy: number, deadzone: number): number {
  const insideDeadzone = Math.hypot(dx, dy) < deadzone;
  if (insideDeadzone) return 0;

  let mask = 0;
  const pushLeft = dx < -deadzone;
  const pushRight = dx > deadzone;
  const pushUp = dy < -deadzone;
  const pushDown = dy > deadzone;
  if (pushLeft) mask |= INPUT_LEFT;
  if (pushRight) mask |= INPUT_RIGHT;
  if (pushUp) mask |= INPUT_UP;
  if (pushDown) mask |= INPUT_DOWN;
  return mask;
}

function combineMasks(masks: Map<number, number>): number {
  let combined = 0;
  for (const bit of masks.values()) {
    combined |= bit;
  }
  return combined;
}

export function useTouchGamepadState(onMaskChange: (mask: number) => void): TouchGamepadState {
  const trackerRef = useRef<PointerTracker>({ masks: new Map(), dpadPointerId: null });
  const dpadZoneRef = useRef<HTMLDivElement | null>(null);
  const [view, setView] = useState<TouchPadView>({
    pressedMask: 0,
    stickOffset: { x: 0, y: 0 },
    dpadActive: false,
  });

  useEffect(() => {
    const tracker = trackerRef.current;
    return () => {
      tracker.masks.clear();
      tracker.dpadPointerId = null;
      onMaskChange(0);
    };
  }, [onMaskChange]);

  const emitMask = (nextOffset?: StickOffset, nextDpadActive?: boolean) => {
    const pressedMask = combineMasks(trackerRef.current.masks);
    onMaskChange(pressedMask);
    setView((prev) => ({
      pressedMask,
      stickOffset: nextOffset ?? prev.stickOffset,
      dpadActive: nextDpadActive ?? prev.dpadActive,
    }));
  };

  const releasePointer = (pointerId: number) => {
    trackerRef.current.masks.delete(pointerId);
    emitMask();
  };

  const bindActionButton = (bitMask: number): ActionButtonHandlers => ({
    onPointerDown: (e) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      trackerRef.current.masks.set(e.pointerId, bitMask);
      triggerSoftHaptic();
      emitMask();
    },
    onPointerUp: (e) => {
      e.preventDefault();
      releasePointer(e.pointerId);
    },
    onPointerCancel: (e) => releasePointer(e.pointerId),
    onLostPointerCapture: (e) => releasePointer(e.pointerId),
  });

  const updateDpadFromPointer = (clientX: number, clientY: number, pointerId: number) => {
    const zone = dpadZoneRef.current;
    if (!zone) return;
    const rect = zone.getBoundingClientRect();
    const rawDx = clientX - (rect.left + rect.width * 0.5);
    const rawDy = clientY - (rect.top + rect.height * 0.5);
    const maxRadius = rect.width * 0.34;
    const dist = Math.hypot(rawDx, rawDy);
    const clampRatio = dist > maxRadius ? maxRadius / dist : 1;
    const dirMask = computeDpadMaskFromOffset(rawDx, rawDy, 12);

    trackerRef.current.masks.set(pointerId, dirMask);
    emitMask({ x: rawDx * clampRatio, y: rawDy * clampRatio }, true);
  };

  const releaseDpad = (pointerId: number) => {
    const isTrackedPointer = trackerRef.current.dpadPointerId === pointerId;
    if (!isTrackedPointer) return;
    trackerRef.current.dpadPointerId = null;
    trackerRef.current.masks.delete(pointerId);
    emitMask({ x: 0, y: 0 }, false);
  };

  const dpadHandlers: DpadHandlers = {
    onPointerDown: (e) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      trackerRef.current.dpadPointerId = e.pointerId;
      triggerSoftHaptic();
      updateDpadFromPointer(e.clientX, e.clientY, e.pointerId);
    },
    onPointerMove: (e) => {
      const isTrackedPointer = trackerRef.current.dpadPointerId === e.pointerId;
      if (!isTrackedPointer) return;
      e.preventDefault();
      updateDpadFromPointer(e.clientX, e.clientY, e.pointerId);
    },
    onPointerUp: (e) => {
      e.preventDefault();
      releaseDpad(e.pointerId);
    },
    onPointerCancel: (e) => releaseDpad(e.pointerId),
    onLostPointerCapture: (e) => releaseDpad(e.pointerId),
  };

  return {
    dpadZoneRef,
    view,
    bindActionButton,
    dpadHandlers,
  };
}
