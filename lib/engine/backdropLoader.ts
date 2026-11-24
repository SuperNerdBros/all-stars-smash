/**
 * Worker-safe asynchronous image loader that fetches rendered stage PNG/JPG
 * artworks into cached ImageBitmaps for zero-jank parallax background drawing.
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
        // chemx-allow: best-effort fallback to procedural retro sky when backdrop image is unavailable
        this.pending.delete(url);
      });
  }

  public get(url: string): ImageBitmap | null {
    const cached = this.cache.get(url);
    if (cached) return cached;
    this.request(url);
    return null;
  }
}

export const STAGE_BACKDROPS = {
  kingdom: '/assets/stages/stage_bg_kingdom_1795503442812.jpg',
  volcano: '/assets/stages/stage_bg_volcano_1795503441800.jpg',
  cosmos: '/assets/stages/stage_bg_cosmos_1795503442616.jpg',
  cyber: '/assets/stages/stage_bg_cyber_1795503442218.jpg',
  gothic: '/assets/stages/stage_bg_gothic_1795503442716.jpg',
  frost: '/assets/stages/stage_bg_frost_1795503442468.jpg',
} as const;
