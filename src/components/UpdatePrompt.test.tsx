import { describe, it, expect, vi } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"

// useRegisterSW() (from virtual:pwa-register/react) returns needRefresh as a
// React-state tuple [boolean, setter] — same shape useState returns — not a
// plain boolean. See node_modules/vite-plugin-pwa/react.d.ts. UpdatePrompt
// must unwrap the tuple before using it as a condition; if it uses the raw
// tuple, `if (needRefresh)` is always true because arrays are always truthy,
// regardless of the actual boolean inside it. Oracle: specified (the hook's
// own declared return type documents the expected [value, setter] contract).
let needRefreshValue = false
const setNeedRefresh = vi.fn()
const updateServiceWorker = vi.fn()

vi.mock("virtual:pwa-register/react", () => ({
  useRegisterSW: () => ({
    needRefresh: [needRefreshValue, setNeedRefresh],
    offlineReady: [false, vi.fn()],
    updateServiceWorker,
  }),
}))

const { default: UpdatePrompt } = await import("./UpdatePrompt")

describe("UpdatePrompt", () => {
  it("renders nothing when no update is pending (needRefresh boolean is false)", () => {
    needRefreshValue = false
    const html = renderToStaticMarkup(<UpdatePrompt />)
    expect(html).toBe("")
  })

  it("renders the update banner when needRefresh boolean is true", () => {
    needRefreshValue = true
    const html = renderToStaticMarkup(<UpdatePrompt />)
    expect(html).toContain("Update available")
  })
})
