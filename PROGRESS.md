# Progress

## Current step

STEP 5 — Screens and navigation — PARTIAL (2026-11-17). Implementation + gate PASS; real-browser interaction checks pending. Waiting for "next" before STEP 6.

## Step log (date · step · status · commit)

| Date | Step | Status | Commit |
| --- | --- | --- | --- |
| 2026-11-17 | 1 — Scaffold and tooling | PASS | 928f6e1 (scaffold, external) |
| 2026-11-17 | 2 — Math foundation | PASS | 6e58f38 (feature) |
| 2026-11-17 | 3 — Config, stores and settings core | PASS | 7337454 (feature) |
| 2026-11-17 | 4 — UI primitives | PASS | e7c5154 (feature) |
| 2026-11-17 | 5 — Screens and navigation | PARTIAL | 3e41f30 (feature) |
| — | 6 — Canvas foundation | NOT STARTED | — |
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
- UI icons are small inline SVGs; the optional `lucide-react` dependency is not installed. All icons carry `aria-hidden` and their controls carry text or `aria-label`.
- `/dev/ui` is "excluded from production" by rendering an inert fallback when `NODE_ENV === "production"` (or the flag is off); the route is still prerendered but exposes no showcase content.
- Toast duration/cap, ring geometry and star count live in `src/config/uiConfig.ts`; Tailwind utilities reference only the CSS-variable palette in `tokens.css`.
- A pre-existing user-owned `next dev` server on port 3000 shares `.next`, so a second dev server could not be started for browser verification. The showcase and primitive markup are instead verified with `react-dom/server` tests; real browser tab traversal and focus movement remain unverified.
- Step 5 keeps only level names/objectives/preview kinds in `src/config/levelCatalog.ts`; full coordinates and solutions remain for STEP 10 so menus never import unfinished level data.
- Route gating waits for `useClientReady` before reading persisted unlocks: LocalStorage is unavailable during SSR, so checking immediately would falsely redirect saved unlocked levels on the first client commit.
- Next.js 16 partial prerendering requires `usePathname()` inside Suspense. The root layout keeps ToastProvider outside the boundary and renders the page as the Suspense fallback, so static HTML still contains screen content; `/play/[levelId]` adds its own Suspense boundary around the awaited `params`.
- The animated night scene is CSS-only (no Canvas yet) and uses token colours; actual Canvas rendering and performance work begin in STEP 6.
- Real browser checks for menu clicks, Back behaviour, locked-URL redirects, confirmation dialogs and persisted settings after reload were not performed. SSR markup tests, production HTTP checks and Step 3 persistence tests cover everything except live interaction.

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

## Step 4 measurements

- 2026-11-17, Node v22.22.3: full gate passes sequentially — lint ✔, typecheck ✔, 94 tests in 13 files ✔, `next build` ✔ (3 static routes including the inert production `/dev/ui`).
- 2026-11-17, contrast ratios computed from `src/styles/tokens.css` by unit test: Soft White/Midnight 16.76:1, Abyss/Cyan Beam 11.07:1, Mist/Midnight 8.46:1, Soft White/Deep Navy 14.42:1, Mist/Deep Navy 7.28:1, Abyss/Danger 7.24:1, Abyss/Star Gold 13.88:1 — all ≥4.5:1.
- 2026-11-17: largest UI source file is `Toast.tsx` at 139 lines (budget 250); largest React component is `UiShowcase` at 101 lines (budget 120).

## Step 5 measurements

- 2026-11-17, Node v22.22.3: full gate passes sequentially — lint ✔, typecheck ✔, 118 tests in 16 files ✔ (24 new), `next build` ✔. Build output: 7 static routes plus `/play/[levelId]` as partial prerender.
- 2026-11-17, production server on ports 3105/3106: `/`, `/levels`, `/how-to-play`, `/settings`, `/about` and `/play/level-01` all returned HTTP 200; expected screen text was present. React inserts HTML comments between interpolated text nodes, so the version appears as `v<!-- -->0.1.0` in raw HTML.
- 2026-11-17: largest Step 5 React component is `LevelSelection.tsx` at 87 lines (budget 120); `SettingRow.tsx` is 86 lines. No FPS, frame-time or bundle-size figures measured.

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
NFR-016: token text/background contrast pairs measured in Step 4 and all exceed 4.5:1; shape cues are a Step 10/14 concern.
AC-15 / AC-21: focus ring is defined globally (`:focus-visible` cyan outline) and every interactive primitive exposes native keyboard semantics in SSR tests; actual browser Tab/Escape traversal not verified (no browser automation available).
AC-02: Step 5 adds all menu routes, Back buttons, schema-driven settings, lock-toast redirects and error boundaries; SSR markup tests and production HTTP 200 checks pass, but live mouse/keyboard navigation, reload persistence and confirmation-dialog interaction remain not verified in a browser.
FR-001–010: implemented across Step 5 screens and gating; real-browser acceptance is still pending, so the step status is PARTIAL rather than PASS.
