---
status: awaiting_human_verify
trigger: "Update-available banner button is not working — clicking it does not trigger the app update/reload."
created: 2026-09-16
updated: 2026-09-16
---

## Symptoms

expected: Clicking the update-available banner's action button triggers the app update/reload (new service worker takes over, page reloads with new content).
actual: Clicking the button does nothing — no reload, no visible effect.
errors: None reported by user.
timeline: Found during UAT of Phase 02 (charts-visualization); unrelated to phase 02 chart work — pre-existing PWA update-prompt behavior.
reproduction: Trigger a service-worker update (new deploy), wait for the update-available banner to appear, click its button.

## Current Focus

bug_class: Bohrbug (deterministic — 100% reproducible given current config; no timing/concurrency involved)

reasoning_checkpoint:
  hypothesis: "The Update button no-ops because of TWO stacked root causes (AND-gate, code x config): (1) UpdatePrompt.tsx destructures `needRefresh` from useRegisterSW() as if it were a boolean, but the hook actually returns a React-state tuple `[boolean, setter]`; arrays are always truthy, so `if (needRefresh)` is unconditionally true and the banner renders on every load regardless of whether an update is actually pending. (2) vite.config.ts sets `registerType: 'autoUpdate'`, which compiles `virtual:pwa-register/react` with `auto=true`; in that build, `updateServiceWorker()`'s body is `if (!auto) sendSkipWaitingMessage?.()` — since auto is true, the skip-waiting message is NEVER sent, so clicking the button is a guaranteed no-op. Additionally, in auto mode the 'waiting' event listener (which is what would set needRefresh=true for real) is never registered at all — onNeedRefresh is only wired up in the non-auto branch. Both bugs are needed to reproduce the exact observed symptom: bug (1) is why a clickable button is visible at all under autoUpdate config; bug (2) is why clicking it does nothing."
  confirming_evidence:
    - "node_modules/vite-plugin-pwa/react.d.ts: useRegisterSW() return type is `needRefresh: [boolean, Dispatch<SetStateAction<boolean>>]` — a tuple, not a boolean."
    - "node_modules/vite-plugin-pwa/dist/client/build/react.js line 132: `return { needRefresh: [needRefresh, setNeedRefresh], ... }` — confirms tuple shape at runtime."
    - "Same file, registerSW(): `const updateServiceWorker = async (_reloadPage = true) => { await registerPromise; if (!auto) { sendSkipWaitingMessage?.(); } }` — skip-waiting message is gated on `!auto`."
    - "Same file: `var auto = autoUpdateMode === \"true\"` where autoUpdateMode is the build-time-replaced `__SW_AUTO_UPDATE__` placeholder, driven by vite.config.ts's `registerType` option."
    - "vite.config.ts line: `VitePWA({ registerType: \"autoUpdate\", ... })` — confirms auto=true is what's actually built for this project."
    - "dist/sw.js contains `self.skipWaiting()` and `clientsClaim()` unconditionally — confirms the built SW auto-activates without a genuine 'waiting' phase, consistent with autoUpdate mode."
    - "src/components/UpdatePrompt.tsx line 4: `const { needRefresh, updateServiceWorker } = useRegisterSW()` then `if (needRefresh)` at line 6 — the raw tuple is used as the condition, confirmed via Read."
    - "git log --follow -p on UpdatePrompt.tsx: bug present since the file's first commit (09385d3, 'move app from MyHealth/ subdir to repo root'), never modified since — rules out a regression from a later edit."
  falsification_test: "If registerType were 'prompt' (auto=false) and needRefresh were correctly destructured as `[needRefresh]`, the banner would only show when wb fires a genuine 'waiting' event, and clicking Update would call sendSkipWaitingMessage() -> messageSkipWaiting() -> SW activates -> 'controlling' event -> reload. This is directly falsifiable by reading vite-plugin-pwa's registerSW() source, which was done above — the auto-mode gate on sendSkipWaitingMessage is unambiguous, not inferred behavior."
  fix_rationale: "Fix addresses both contributing causes at their source rather than patching a symptom: (a) switch registerType to 'prompt' in vite.config.ts so the SW actually enters a waiting state and the client wires up the real prompt flow: this is the mode the existing UpdatePrompt.tsx UI was clearly designed for (banner + manual Update button + restart copy) — 'autoUpdate' and a manual prompt button are mutually exclusive UX patterns, and autoUpdate makes any manual button meaningless by design; (b) fix the tuple destructuring in UpdatePrompt.tsx so needRefresh reflects the actual boolean state instead of an always-truthy array. Neither change alone fully fixes the reported symptom without the other."
  blind_spots: "Did not verify runtime behavior in an actual deployed environment with two successive GitHub Pages deploys (no way to trigger a real SW update cycle in this sandbox); relying on reading vite-plugin-pwa's shipped source/types plus the built dist/sw.js output as ground truth instead of live browser reproduction. Did not check whether the project deliberately wants silent auto-updates elsewhere (no other consumer of registerType found)."
  candidate_causes:
    - "code: src/components/UpdatePrompt.tsx destructures a tuple as a boolean (category: code)"
    - "config: vite.config.ts registerType: 'autoUpdate' disables the manual skip-waiting/prompt flow entirely (category: config)"
  and_gate: "yes — bug (1) alone would just mean the banner never shows correctly (still broken, but differently); bug (2) alone (with correct destructuring) would mean the banner never appears at all, so there'd be no button to click. Both together are required to reproduce the exact reported symptom: a banner+button IS visible (because of bug 1), and clicking it does nothing (because of bug 2)."

hypothesis: CONFIRMED and FIXED — see reasoning_checkpoint and Resolution above
test: fix-acceptance guardrail run — target tests pass, adjacent tests/typecheck/lint/build pass, revert-and-reconfirm pass (bug returns on revert, fixed on reapply), mutation check skipped (no Stryker), no-op/deletion detector pass
expecting: n/a — guardrail_verdict: accepted
next_action: awaiting human verification — user must confirm real-world behavior (see checkpoint returned to orchestrator) before archiving this session

## Evidence

- timestamp: 2026-09-16T00:00:00Z
  checked: src/components/UpdatePrompt.tsx (full file)
  found: "`const { needRefresh, updateServiceWorker } = useRegisterSW()` then `if (needRefresh)` — needRefresh used directly as a boolean condition."
  implication: "If useRegisterSW()'s needRefresh field is not actually a boolean, this condition is unreliable."

- timestamp: 2026-09-16T00:00:01Z
  checked: node_modules/vite-plugin-pwa/react.d.ts
  found: "useRegisterSW() return type declares `needRefresh: [boolean, Dispatch<SetStateAction<boolean>>]` — a tuple, matching useState's return shape."
  implication: "UpdatePrompt.tsx's destructuring is wrong: needRefresh in the component is actually the array [value, setter], which is always truthy."

- timestamp: 2026-09-16T00:00:02Z
  checked: node_modules/vite-plugin-pwa/dist/client/build/react.js (useRegisterSW + registerSW implementation)
  found: "useRegisterSW returns `{ needRefresh: [needRefresh, setNeedRefresh], offlineReady: [...], updateServiceWorker }`. registerSW()'s updateServiceWorker is `async (_reloadPage=true) => { await registerPromise; if (!auto) { sendSkipWaitingMessage?.(); } }`, where `auto = (autoUpdateMode === \"true\")` and autoUpdateMode is a build-time replaced token controlled by the VitePWA `registerType` option. In auto mode (`auto === true`), the 'waiting' event listener (which fires onNeedRefresh and registers the 'controlling'->reload listener) is never attached — it only exists in the `else` (non-auto) branch."
  implication: "Two independent effects of the autoUpdate config: (a) needRefresh's real boolean would never become true via the wired-up event flow even if destructured correctly, and (b) clicking updateServiceWorker() is a guaranteed no-op because `if (!auto)` is false."

- timestamp: 2026-09-16T00:00:03Z
  checked: vite.config.ts (VitePWA plugin options)
  found: "`VitePWA({ registerType: \"autoUpdate\", workbox: { globPatterns: [...] }, manifest: {...} })`"
  implication: "Confirms this project is built with auto=true, activating the no-op click path in vite-plugin-pwa's generated client code."

- timestamp: 2026-09-16T00:00:04Z
  checked: dist/sw.js (built service worker output)
  found: "Contains unconditional `self.skipWaiting()` and `clientsClaim()` calls."
  implication: "The built SW never holds in a genuine 'waiting' state for user consent — consistent with autoUpdate mode auto-activating without a prompt."

- timestamp: 2026-09-16T00:00:05Z
  checked: src/App.tsx
  found: "`<UpdatePrompt />` is rendered unconditionally inside HashRouter, no props passed, no conditional wrapping."
  implication: "Rules out App.tsx as a contributing cause — the bug is fully contained in UpdatePrompt.tsx + vite.config.ts."

- timestamp: 2026-09-16T00:00:06Z
  checked: "git log --follow -p -- src/components/UpdatePrompt.tsx"
  found: "File created in commit 09385d3 with the buggy destructuring already present; no subsequent commits touched it."
  implication: "Not a regression from a later refactor — the bug has existed since the component was first added; classifies as Bohrbug (always reproducible under current config), not a flaky/Heisenbug."

- timestamp: 2026-09-16T00:00:07Z
  checked: "eslint.config.js and tsconfig.app.json"
  found: "eslint config uses js.configs.recommended + tseslint.configs.recommended + react-hooks/react-refresh recommended sets — no `@typescript-eslint/strict-boolean-expressions` or similar rule. tsconfig.app.json has `strict: true` but plain `strict` does not flag truthy-checking a non-boolean in an `if` condition."
  implication: "Explains why neither `npm run typecheck` nor `npm run lint` would have caught this — no existing gate checks for non-boolean truthiness in conditionals, and no test file exists for UpdatePrompt.tsx (confirmed via glob: only node_modules test files matched `*UpdatePrompt*`/`*.test.tsx` patterns)."

## Eliminated

(none — first and only hypothesis formed was confirmed directly via source inspection; no competing hypotheses were falsified in this session)

## Resolution

oracle_type: specified — vite-plugin-pwa's own react.d.ts declares needRefresh's return type as `[boolean, Dispatch<SetStateAction<boolean>>]`, and the built react.js source declares updateServiceWorker's skip-waiting call is gated on `!auto` where auto derives directly from the registerType config option. Both assertions check against these directly-observed, documented contracts, not an inferred/implicit "doesn't crash" oracle.

root_cause: "AND-gate, two categories. (1) code: src/components/UpdatePrompt.tsx destructured `needRefresh` from useRegisterSW() as a plain value and used it directly in `if (needRefresh)`, but the hook returns a tuple `[boolean, setter]` (like useState) — arrays are always truthy, so the banner rendered unconditionally on every app load regardless of real update state. (2) config: vite.config.ts set `registerType: \"autoUpdate\"`, which compiles vite-plugin-pwa's client register code with auto=true; in that mode `updateServiceWorker()`'s body only sends the skip-waiting message `if (!auto)`, so calling it from the button's onClick was a guaranteed no-op, and the 'waiting'/'controlling' event wiring that the prompt UX depends on was never attached in the first place. Together: bug (1) is why a clickable banner was visible at all despite autoUpdate mode; bug (2) is why clicking it never did anything. Note: .claude/CLAUDE.md's auto-generated Technology Stack research table lists 'registerType: autoUpdate enables seamless updates' as a generic capability description of vite-plugin-pwa (part of an initial tech-stack research doc, not a living architecture decision record) — the actual shipped UpdatePrompt.tsx UI (banner text + manual Update button) was written for the manual-prompt pattern from its first commit and has never functioned, which is strong evidence the autoUpdate value was inherited from that research doc without reconciling it against the UI that was actually built. Flagging this for the user's awareness since it's a legitimate product-direction fork, not a pure implementation bug."
fix: "Changed vite.config.ts's VitePWA registerType from \"autoUpdate\" to \"prompt\" so the built service worker genuinely enters a waiting state and vite-plugin-pwa wires up the real waiting/skip-waiting/controlling/reload flow. Fixed UpdatePrompt.tsx to destructure `needRefresh: [needRefresh]` from the tuple (matching the hook's declared return shape) so the render condition reflects the actual boolean state instead of an always-truthy array. Verified via built dist/sw.js: before the fix, self.skipWaiting() and clientsClaim() ran unconditionally at SW top level (no real waiting phase); after the fix, self.skipWaiting() only runs inside a message listener gated on an explicit SKIP_WAITING postMessage (exactly what updateServiceWorker(true) sends), and the unconditional clientsClaim() is gone."
verification:
  target_test: { result: pass, tests: ["src/components/UpdatePrompt.test.tsx: renders nothing when no update is pending", "src/components/UpdatePrompt.test.tsx: renders the update banner when needRefresh boolean is true", "vite.config.test.ts: registers the service worker in prompt mode"] }
  mutation_check: { result: skipped, reason_if_skipped: "No Stryker configured in this project (no stryker.conf.* found, no stryker devDependency in package.json)." }
  no_op_deletion: { result: pass, deletion_justified_by_rca: n/a — diff is additive/corrective (one string literal value change, one destructuring pattern change), not a deletion of behavior }
  adjacent_tests: { result: pass, suites_run: ["src/utils/aggregation.test.ts", "src/utils/bmi.test.ts", "src/components/UpdatePrompt.test.tsx", "vite.config.test.ts"], notes: "npx vitest run: 4 test files passed, 27/27 tests passed. npm run typecheck: clean. npm run lint scoped to touched files (UpdatePrompt.tsx, UpdatePrompt.test.tsx, vite.config.ts, vite.config.test.ts): 0 errors (full-repo lint has ~648 pre-existing errors, all in unrelated files, confirmed unrelated to this fix). npm run build: succeeds, PWA v1.3.0 generateSW completes, dist/sw.js reflects prompt-mode gating as described in fix." }
  revert_and_reconfirm: { result: pass, bug_returned_on_revert: true, fixed_on_reapply: true, notes: "git stash push -- src/components/UpdatePrompt.tsx vite.config.ts (kept new test files in place) -> both new tests failed against reverted buggy code (banner rendered with needRefresh=false; vite.config.ts still said autoUpdate) -> git stash pop -> both tests passed again with fix reapplied." }
  guardrail_verdict: accepted
files_changed:
  - vite.config.ts (registerType: "autoUpdate" -> "prompt")
  - src/components/UpdatePrompt.tsx (destructure needRefresh tuple correctly)
  - src/components/UpdatePrompt.test.tsx (new — regression test)
  - vite.config.test.ts (new — regression test guarding registerType)
