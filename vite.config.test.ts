import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import path from "node:path"
import { describe, it, expect } from "vitest"

// vite-plugin-pwa's generated updateServiceWorker() only sends the
// skip-waiting message when registerType !== "autoUpdate" (see
// node_modules/vite-plugin-pwa/dist/client/build/react.js — the call is
// gated behind `if (!auto)`). UpdatePrompt.tsx implements a manual
// "click to update" banner, which is a no-op by construction under
// registerType: "autoUpdate". Guard the config so a future edit can't
// silently reintroduce that no-op.
describe("vite.config.ts PWA registration mode", () => {
  it("registers the service worker in prompt mode so the update banner button can trigger a real reload", () => {
    const configPath = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "vite.config.ts"
    )
    const source = readFileSync(configPath, "utf-8")
    expect(source).toMatch(/registerType:\s*["']prompt["']/)
  })
})
