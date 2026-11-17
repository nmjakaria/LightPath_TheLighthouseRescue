# Progress

## Current step

STEP 3 — Config, stores and settings core — PASS (2026-11-17). Waiting for "next" before STEP 4.

## Step log (date · step · status · commit)

| Date | Step | Status | Commit |
| --- | --- | --- | --- |
| 2026-11-17 | 1 — Scaffold and tooling | PASS | 928f6e1 (scaffold, external) |
| 2026-11-17 | 2 — Math foundation | PASS | 6e58f38 (feature) |
| 2026-11-17 | 3 — Config, stores and settings core | PASS | 7337454 (feature) |
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
- Table 3.4 constants live in `src/lib/math/constants.ts` as Step 2 requires; `src/config/gameConfig.ts` in Step 3 will import/re-export them rather than duplicate literals.
- `mat3.invert` returns `null` for singular matrices and non-finite determinants; callers must handle the null explicitly. `vec2.normalize` maps the zero vector to (0, 0) to avoid NaN.
- Added an extra `src/lib/math/angles.ts` for degree/radian conversion and mirror-angle wrapping; it is needed by the optics core and keeps conversions out of the vector and matrix modules.
- `GameSettings` includes `showFps` from AGENTS §5.3 even though the PRD §19 snippet omits it; the AGENTS schema is the fuller specification.
- Assumed v0 settings used `volume` (0..100), `step`, `muted`, `reducedMotion`; assumed v0 progress stored `bestScore`/`bestTimeSec`/`bestMoves` directly on each level. Both shapes are documented in `docs/SETTINGS.md` and covered by migration tests.
- `LevelRecord.best` is `ScoreRecord | null` (and best time/moves are `number | null`) because an uncompleted level has no best result; this is a minimal extension of the PRD §19 sketch.
- Effective-environment detection uses the `useSyncExternalStore` server/client snapshot split instead of `setState` in an effect: SSR/hydration see safe defaults, then the client snapshot applies on first client render and satisfies the React lint rules.

## PRD deviations (with justification)

- None yet.

## Known issues (severity 1/2/3)

- Severity 3: `npm audit` reports 7 advisories (2 critical) in development-only tooling pulled in by Vitest 3; `npm audit --omit=dev` reports 0. Revisit before release (NFR-022) — a fix would require upgrading `@types/node` to 22+ and Vitest to 5, which is out of scope for Step 1.

## Measurements (hardware, browser, date, value)

- 2026-11-17, Node v22.22.3 / npm 11.15.0: `npm run lint`, `npm run typecheck`, `npm run test` (2 passed, 1 file), `npm run build` all pass sequentially.
- 2026-11-17, production server on `http://localhost:3100/`: HTTP 200, HTML contains the LightPath placeholder, `Content-Security-Policy-Report-Only` and `X-Content-Type-Options: nosniff` headers present.
- No FPS, frame-time or bundle-size figures were measured in this step.
- 2026-11-17, Node v22.22.3: `npm run test` → 20 tests passed (18 new), 5 files; `npm run lint`, `npm run typecheck`, `npm run build` pass.
- 2026-11-17, `npm run test:coverage`: `src/lib/math` = 100% statements / branches / functions / lines (all five math files); a per-glob 90% threshold is now enforced in `vitest.config.ts`.

## Step 3 measurements

- 2026-11-17, Node v22.22.3: full gate passes sequentially — lint ✔, typecheck ✔, 46 tests in 8 files ✔, `next build` ✔ (2 static routes).
- 2026-11-17, `npm run test:coverage`: all files 97.35% statements / 93.33% branches / 97.77% functions / 97.35% lines; `src/lib/math` 100%, `src/lib/settings` 100% statements, `src/lib/store` 92.45% statements. No FPS, frame-time or bundle figures measured.

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
AC-22: Step 2 enforces ≥90% coverage on `src/lib/math`; optics, scoring and validator coverage are not yet available.
FR-053–057: settings schema, validation, debounced/blocked-storage persistence, migrations and effective settings implemented and unit-tested in Step 3; TC-E10 and TC-F09 logic covered.
