# Backlog

Ideas and scope items captured outside the active roadmap. Anything here is *not* in v1 — it has either been deferred by explicit decision, surfaced during UAT, or earmarked for a later milestone. Items graduate to a `ROADMAP.md` phase when picked up (`/gsd-review-backlog` to promote, `/gsd-phase add` to materialize).

Last updated: 2026-09-02 (create backlog template)
Last assigned ID: **B-000** — next new item must be **B-001**

---

## How to use this file

- **Adding an item:** increment the "Last assigned ID" counter at the top, then drop a new `### B-NNN` block with Status / Earliest sensible slot / What / Why / Open questions / Implementation notes. IDs are monotonic and never reused — even if the previous entry was promoted or removed.
- **Promoting an item:** `/gsd-review-backlog` (interactive) — moves a chosen item into the active milestone roadmap. Or manually run `/gsd-phase add` and reference the backlog ID in the phase description.
- **Removing an item:** delete the block or move it under a `## Rejected` heading with a one-line rationale (decisions cost; keep the rationale).
- **Memory ↔ backlog:** memory captures "this idea exists and here's the context"; this file is the project-level decision queue. Memory is the source for cross-session continuity; this file is the source for milestone planning. Update both when an item lands.

## Related

- `ROADMAP.md` — active milestone phases (not yet created)
- `PROJECT.md` — core project constraints (not yet created)
- `config.json` — GSD configuration

---

## Adding your first item

When you have a concrete idea to capture, add a block like this after the `---` below, and bump "Last assigned ID" to **B-001** at the top:

```markdown
### B-001 · <short title>

**Status:** open
**Earliest sensible slot:** v1.0 — <any prerequisites?>

**What:** One paragraph describing the feature or change clearly enough that someone picking it up cold understands the scope.

**Why:** The motivation — user pain, product gap, technical debt reason, or stakeholder ask. Be specific so future-you can judge whether it still matters.

**Open questions:** (delete if none)
- Question that must be answered before implementation starts.

**Implementation notes:** (delete if none)
- Concrete hints, file paths, APIs, or constraints relevant at implementation time.
```

Once you have two or more items, just keep stacking `### B-NNN` blocks in the same format.

---
