# Progress

## Current step

STEP 1 — Scaffold and tooling — PASS (2026-11-17). Waiting for "next" before STEP 2.

## Step log (date · step · status · commit)

| Date | Step | Status | Commit |
| --- | --- | --- | --- |
| 2026-11-17 | 1 — Scaffold and tooling | PASS | 928f6e1 (scaffold, external) |
| — | 2 — Math foundation | NOT STARTED | — |
| — | 3 — Config, stores and settings core | NOT STARTED | — |
| — | 4 — UI primitives | NOT STARTED | — |
| — | 5 — Screens and navigation | NOT STARTED | — |
| — | 6 — Canvas foundation | NOT STARTED | — |
| — | 7 — Optics core | NOT STARTED | — |
| — | 8 — Level 1 playable | NOT STARTED | — |
| — | 9 — Remaining mechanics | NOT STARTED | — |
| — | 10 — Game rules, five levels, progression | NOT STARTED | — |
| — | 11 — Visual polish | NOT STARTED | — |
| — | 12 — Audio | NOT STARTED | — |
| — | 13 — Optics Inspector | NOT STARTED | — |
| — | 14 — Accessibility, performance, hardening | NOT STARTED | — |
| — | 15 — Documentation, deployment, demo readiness | NOT STARTED | — |

## Decisions and assumptions

- The pre-existing working tree already contained a modified `AGENTS.md` and untracked `docs/LightPath_PRD.md`; these are treated as user work and are left untouched (the PRD is never edited).
- During Step 1 an external git operation committed the whole scaffold as `928f6e1 Start Project installation` (including the user-owned `AGENTS.md` and `docs/`), renamed `step/01-scaffold` to `main`, and pushed to `origin/main`. That pushed commit was not rewritten; this step's gate results are recorded in a separate conventional commit.
- `next.config.ts` from the starter is migrated to `next.config.mjs` as required by PRD §26.2 / AGENTS §7 Step 1; existing Next 16 options are preserved and security headers are added with CSP in report-only mode.
- Tailwind v4 is kept with the existing `@tailwindcss/turbopack` loader; design tokens are declared in `src/styles/tokens.css` and mapped into Tailwind's theme in `globals.css`.
- Node v22.22.3 / npm 11.15.0 are the local toolchain used for the gate; no hardware-dependent performance claims are made in this step.
- Vitest 5 was rejected because it requires `@types/node@22+` while this repo uses `@types/node@20`; pinned Vitest 3.2.7 with matching `@vitest/coverage-v8`.
- The local shell is Windows PowerShell 5.1, which cannot parse `&&`; the gate was run as four sequential npm scripts with failure short-circuit. CI uses `ubuntu-latest` (bash), where `&&`-style chaining would work.

## PRD deviations (with justification)

- None yet.

## Known issues (severity 1/2/3)

- Severity 3: `npm audit` reports 7 advisories (2 critical) in development-only tooling pulled in by Vitest 3; `npm audit --omit=dev` reports 0. Revisit before release (NFR-022) — a fix would require upgrading `@types/node` to 22+ and Vitest to 5, which is out of scope for Step 1.

## Measurements (hardware, browser, date, value)

- 2026-11-17, Node v22.22.3 / npm 11.15.0: `npm run lint`, `npm run typecheck`, `npm run test` (2 passed, 1 file), `npm run build` all pass sequentially.
- 2026-11-17, production server on `http://localhost:3100/`: HTTP 200, HTML contains the LightPath placeholder, `Content-Security-Policy-Report-Only` and `X-Content-Type-Options: nosniff` headers present.
- No FPS, frame-time or bundle-size figures were measured in this step.

## Acceptance checklist (AC-01 … AC-28: ☐ / ✔ verified / ✘ not verified)

| ID | Status | ID | Status |
| --- | --- | --- | --- |
| AC-01 | ☐ | AC-15 | ☐ |
| AC-02 | ☐ | AC-16 | ☐ |
| AC-03 | ☐ | AC-17 | ☐ |
| AC-04 | ☐ | AC-18 | ☐ |
| AC-05 | ☐ | AC-19 | ☐ |
| AC-06 | ☐ | AC-20 | ☐ |
| AC-07 | ☐ | AC-21 | ☐ |
| AC-08 | ☐ | AC-22 | ☐ |
| AC-09 | ☐ | AC-23 | ☐ |
| AC-10 | ☐ | AC-24 | ☐ |
| AC-11 | ☐ | AC-25 | ☐ |
| AC-12 | ☐ | AC-26 | ☐ |
| AC-13 | ☐ | AC-27 | ☐ |
| AC-14 | ☐ | AC-28 | ☐ |

AC-01: local build and `next start` verified in Step 1; Vercel deployment remains unverified.
