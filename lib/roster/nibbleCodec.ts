import type { AnimState, IndexedFrame, PixelChart } from '../types/palette';
import { ANIM_STATES } from '../types/palette';
import type { FighterBlueprint } from '../types/fighter';

export interface PackedAnimClip {
  w: number;
  h: number;
  tpf: number;
  frames: string[];
}

export interface PackedFighterRecord
  extends Omit<FighterBlueprint, 'pixelChart' | 'eraPacks'> {
  packedChart: Record<AnimState, PackedAnimClip>;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(encoded: string): Uint8Array {
  const binary = atob(encoded);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

/**
 * Packs a 2D matrix of 4-bit palette indices (0-15) into 2 pixels per byte, Base64-encoded.
 */
export function encodeFrameToNibbles(frame: IndexedFrame): string {
  const h = frame.length;
  const w = frame[0]?.length ?? 0;
  const totalPixels = w * h;
  const bytes = new Uint8Array(Math.ceil(totalPixels / 2));

  let pixelIdx = 0;
  for (let y = 0; y < h; y++) {
    const row = frame[y];
    for (let x = 0; x < w; x++) {
      const val = (row[x] ?? 0) & 0x0f;
      const byteIdx = pixelIdx >> 1;
      if ((pixelIdx & 1) === 0) {
        bytes[byteIdx] = val << 4;
      } else {
        bytes[byteIdx] |= val;
      }
      pixelIdx++;
    }
  }
  return bytesToBase64(bytes);
}

/**
 * Decodes a Base64-encoded 4-bit nibble stream back into an IndexedFrame matrix.
 */
export function decodeNibblesToFrame(encoded: string, w: number, h: number): IndexedFrame {
  const bytes = base64ToBytes(encoded);
  const frame: IndexedFrame = [];
  let pixelIdx = 0;

  for (let y = 0; y < h; y++) {
    const row = new Array<number>(w);
    for (let x = 0; x < w; x++) {
      const byteIdx = pixelIdx >> 1;
      const b = bytes[byteIdx] ?? 0;
      row[x] = (pixelIdx & 1) === 0 ? (b >> 4) & 0x0f : b & 0x0f;
      pixelIdx++;
    }
    frame.push(row);
  }
  return frame;
}

export function packFighterForStorage(fighter: FighterBlueprint): PackedFighterRecord {
  const packedChart = {} as Record<AnimState, PackedAnimClip>;
  for (const state of ANIM_STATES) {
    const clip = fighter.pixelChart[state];
    const first = clip.frames[0];
    const h = first?.length ?? fighter.gridSize;
    const w = first?.[0]?.length ?? fighter.gridSize;
    packedChart[state] = {
      w,
      h,
      tpf: clip.ticksPerFrame,
      frames: clip.frames.map((frame) => encodeFrameToNibbles(frame)),
    };
  }
  const { pixelChart: _omitted, eraPacks: _omittedEra, ...rest } = fighter;
  void _omitted;
  void _omittedEra;
  return {
    ...rest,
    packedChart,
  };
}

export function unpackFighterFromStorage(record: PackedFighterRecord): FighterBlueprint {
  const pixelChart = {} as PixelChart;
  for (const state of ANIM_STATES) {
    const packed = record.packedChart[state];
    pixelChart[state] = {
      ticksPerFrame: packed.tpf,
      frames: packed.frames.map((b64) => decodeNibblesToFrame(b64, packed.w, packed.h)),
    };
  }
  const { packedChart: _omitted, ...rest } = record;
  void _omitted;
  return {
    ...rest,
    pixelChart,
  };
}
