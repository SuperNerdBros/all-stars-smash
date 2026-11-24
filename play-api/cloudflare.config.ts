import { bindings, defineConfig, defineWorker, exports } from "cf/config";

import * as entrypoint from "./src/index.ts" with { type: "cf-worker" };

// The play API (spec: docs/specs/2026-11-07-live-multiplayer-design.md, "Deploy and rollback").
// TURN_KEY_ID and TURN_KEY_API_TOKEN are secrets: without them rooms get STUN only.
export const playApi = defineWorker({
  name: "all-stars-play-api",
  entrypoint,
  compatibilityDate: "2026-11-01",
  // One-level subdomain so Cloudflare Universal SSL covers it (api.skb.forthexp.com would not be).
  domains: ["skb-api.forthexp.com"],
  observability: { enabled: true, logs: { enabled: true } },
  env: {
    LOBBY: bindings.durableObject({ worker: "all-stars-play-api", exportName: "Lobby" }),
    ROOM: bindings.durableObject({ worker: "all-stars-play-api", exportName: "Room" }),
    ALLOWED_ORIGINS: bindings.text("https://skb.forthexp.com,http://localhost:3000"),
    TURN_ENABLED: bindings.text("1"),
    TURN_KEY_ID: bindings.secret(),
    TURN_KEY_API_TOKEN: bindings.secret(),
  },
  exports: {
    Lobby: exports.durableObject({ storage: "sqlite" }),
    Room: exports.durableObject({ storage: "sqlite" }),
  },
});

export default defineConfig({ worker: playApi });
