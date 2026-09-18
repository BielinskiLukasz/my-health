---
schema_version: 1
open_count: 1
waived_count: 0
fixed_count: 0
total_count: 1
last_updated: 2026-09-18T08:54:24.336Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | quick | lint-warning | repo-wide (npm run lint) |  | npm run lint reports 650 pre-existing problems across the repo (config files, unrelated components) — confirmed identical count on unmodified baseline via git stash; not introduced by quick task 260918-ep1 | open |  | 2026-09-18T08:54:24.336Z |  |

````json
[
  {
    "id": 1,
    "kind": "lint-warning",
    "phase": "quick",
    "file": "repo-wide (npm run lint)",
    "line": null,
    "description": "npm run lint reports 650 pre-existing problems across the repo (config files, unrelated components) — confirmed identical count on unmodified baseline via git stash; not introduced by quick task 260918-ep1",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-18T08:54:24.336Z",
    "resolved_at": null
  }
]
````
