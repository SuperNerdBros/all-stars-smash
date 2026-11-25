import type { StagePattern } from '../types/stage';

/**
 * Worker-safe asynchronous image loader that fetches full-HD stage backdrops
 * and painted platform material textures into cached ImageBitmaps for zero-jank rendering.
 */
export class StageBackdropLoader {
  private readonly cache = new Map<string, ImageBitmap>();
  private readonly pending = new Set<string>();

  public request(url: string): void {
    if (!url || this.cache.has(url) || this.pending.has(url)) return;
    if (typeof fetch !== 'function' || typeof createImageBitmap !== 'function') return;

    this.pending.add(url);
    void fetch(url)
      .then((res) => (res.ok ? res.blob() : null))
      .then((blob) => (blob ? createImageBitmap(blob) : null))
      .then((bitmap) => {
        this.pending.delete(url);
        if (bitmap) {
          this.cache.set(url, bitmap);
        }
      })
      .catch(() => {
        // chemx-allow: best-effort fallback to procedural surface when artwork is unavailable
        this.pending.delete(url);
      });
  }

  public get(url: string): ImageBitmap | null {
    const cached = this.cache.get(url);
    if (cached) return cached;
    this.request(url);
    return null;
  }

  public preloadAllTextures(): void {
    for (const url of Object.values(STAGE_TEXTURES)) {
      this.request(url);
    }
  }

  public getTexture(pattern: StagePattern): ImageBitmap | null {
    return this.get(STAGE_TEXTURES[pattern]);
  }
}

export const STAGE_TEXTURES: Record<StagePattern, string> = {
  'grass-stone': '/assets/stages/textures/grass-stone.jpg',
  'obsidian-gold': '/assets/stages/textures/obsidian-gold.jpg',
  'brick-fortress': '/assets/stages/textures/brick-fortress.jpg',
  'wood-bridge': '/assets/stages/textures/wood-bridge.jpg',
  'cloud-deck': '/assets/stages/textures/cloud-deck.jpg',
  'crystal-pillar': '/assets/stages/textures/crystal-pillar.jpg',
};

export const STAGE_BACKDROPS = {
  kingdom: '/assets/stages/stage_bg_kingdom_1795503442812.jpg',
  volcano: '/assets/stages/stage_bg_volcano_1795503441800.jpg',
  cosmos: '/assets/stages/stage_bg_cosmos_1795503442616.jpg',
  cyber: '/assets/stages/stage_bg_cyber_1795503442218.jpg',
  gothic: '/assets/stages/stage_bg_gothic_1795503442716.jpg',
  frost: '/assets/stages/stage_bg_frost_1795503442468.jpg',
  jungle: '/assets/stages/stage_bg_jungle.jpg',
  meadow: '/assets/stages/stage_bg_meadow.jpg',
  dreamland: '/assets/stages/stage_bg_dreamland.jpg',
  temple: '/assets/stages/stage_bg_temple.jpg',
  starship: '/assets/stages/stage_bg_starship.jpg',
  boxing: '/assets/stages/stage_bg_boxing.jpg',
  dojo: '/assets/stages/stage_bg_dojo.jpg',
  skyworld: '/assets/stages/stage_bg_skyworld.jpg',
  ocean: '/assets/stages/stage_bg_ocean.jpg',
  clockwork: '/assets/stages/stage_bg_clockwork.jpg',
  airship: '/assets/stages/stage_bg_airship.jpg',
  desert: '/assets/stages/stage_bg_desert.jpg',
} as const;
