# Progress

## Current step

STEP 13 — Optics Inspector — PARTIAL (2026-11-18). Implementation and full gate pass (296 tests); real-browser D/G/P/N/U demonstrations and the ≤30 s concept-mapping rehearsal remain unverified. Waiting for "next" before STEP 14.

## Step log (date · step · status · commit)

| Date | Step | Status | Commit |
| --- | --- | --- | --- |
| 2026-11-17 | 1 — Scaffold and tooling | PASS | 928f6e1 (scaffold, external) |
| 2026-11-17 | 2 — Math foundation | PASS | 6e58f38 (feature) |
| 2026-11-17 | 3 — Config, stores and settings core | PASS | 7337454 (feature) |
| 2026-11-17 | 4 — UI primitives | PASS | e7c5154 (feature) |
| 2026-11-17 | 5 — Screens and navigation | PARTIAL | 3e41f30 (feature) |
| 2026-11-17 | 6 — Canvas foundation | PARTIAL | 1ce8167 (feature) |
| 2026-11-17 | 7 — Optics core | PASS | 8811c38 (feature) |
| 2026-11-17 | 8 — Level 1 playable | PARTIAL | e519bd4 (feature) |
| 2026-11-17 | 9 — Remaining mechanics | PARTIAL | 9e70f23 (feature) |
| 2026-11-17 | 10 — Game rules, five levels, progression | PARTIAL | 7dec7aa (feature) |
| 2026-11-17 | 11 — Visual polish | PARTIAL | 8f07acf (feature) |
| 2026-11-18 | 12 — Audio | PARTIAL | 7db66fe (feature) |
| 2026-11-18 | 13 — Optics Inspector | PARTIAL | pending |
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
- Step 6 renders only a Level-1-like **placeholder** scene (fixed mirrors and a static beam). Real state, optics and interaction arrive in STEP 8; the canvas is deliberately not yet a playable puzzle.
- Canvas rendering needs concrete colours: `readPalette()` resolves CSS variables from `styles/tokens.css` once at mount and passes plain colour strings to the renderer. No hex value is duplicated in renderer code.
- `useCanvasRuntime` keeps all listeners, `ResizeObserver`, the loop and layer disposal behind a hook; `GameCanvas.tsx` stays a thin JSX shell under the 120-line component budget. Next 16's `react-hooks/refs` rule rejects refs nested in a returned object, so refs are destructured at the call site.
- `GameLoop` seeds its smoothed frame time from the first real interval; without that fix the first FPS reading was inflated by the smoothing factor. `dt` is clamped to `DT_CLAMP` and suspended frames reset `lastTime` so a tab return never spikes.
- The dev FPS overlay uses `effective.showFps` or the `NEXT_PUBLIC_FPS_OVERLAY` flag; the sample interval lives in `uiConfig.fpsRefreshMs`, and DPR cap, FPS smoothing, star count and hit radius live in `gameConfig.render`.
- The play route serves SSR markup with the "Lighting the lamp…" gate; `GameCanvas` mounts only after `useClientReady`, so no canvas element appears in the initial HTML. Real-browser idle FPS, visual resize behaviour and actual DOM-listener teardown were not measured (no browser automation available); frame-request teardown is covered by a 20-cycle unit test.
- Step 7 keeps prism splitting for STEP 9 as the AGENTS step plan requires. `getPrismVertices` exists as a pure transform helper and `HitType` includes `"prism"`, but no prism geometry is added to `OpticsScene` yet.
- `src/types/optics.ts` holds the PRD §19 solver shapes; `OpticsScene` is the minimal geometry slice so optics never imports a level module. A gate is active while `openFraction < gameConfig.optics.gateOpenFraction` (0.5).
- Repeat-state keys, lamp housing radius and the gate threshold are build-time tunables in `gameConfig.optics`, keeping the solver free of magic numbers.
- Primitive building and nearest-hit tie priority live in `src/engine/optics/primitives.ts`; `tracer.ts` stayed under the 250-line file budget after extraction.
- `solveOptics` takes an injectable clock so tests can measure or freeze `stats.solveMs`; production uses `performance.now()`. Arrays are allocated once at `MAX_SEGMENTS` capacity and trimmed at the end, avoiding repeated growth during a solve.
- A non-finite mirror is skipped (with a dev-only warning) rather than aborting the whole solve; a non-finite source is skipped and counted under `terminated.invalid`.
- Step 8 corrects the default lamp housing radius from 18 to 16 wu to match PRD §13's common rules; the stale Step 7 transform expectation was updated. Level 1 sources rely on this config default rather than duplicating the number in level data.
- `src/types/level.ts` carries the full PRD §19 level schema and `src/levels/level-01.ts` is data only. `src/levels/index.ts` currently registers Level 1 alone; Levels 2–5 arrive in STEP 10.
- The engine state machine lives in `src/engine/core/GameState.ts`; pointer/keyboard listeners only enqueue `InputCommand`s, which the loop drains once per frame. Undo stores angle snapshots bounded by `UNDO_LIMIT` and never refunds moves.
- Mirror angles snap to 15° (or the 5° fine step) modulo the 180° mirror period; a drag commits one move on pointer-up and unchanged drags commit nothing.
- Target charge uses the PRD 0.35 s activation time and 0.6 s completion hold; the solver runs only when a command changes geometry, and a `solveCount` counter is exposed for the idle-frame test.
- The HUD snapshot is published through a tiny `createStore` at ≤10 Hz via `useSyncExternalStore`; the canvas hook keeps level, settings and loop refs so changing settings never remounts the engine mid-attempt.
- `useGameRuntime` tracks a pending drag id separately from `GameState.dragId` so a pointer-down/up pair that happens between frames is still committed exactly once.
- Beam pass widths/alphas, component line widths, lamp radii and label size moved into `gameConfig.render`; light-channel colours come from CSS-variable tokens resolved once by `readPalette()`.
- Real-browser drag/rotate interaction, focus traversal and FPS were still not measured; automated tests cover command flow, snapping, undo/reset, 2× reflection, idle solves and completion, and `/play/level-01` was checked over HTTP only.
- Step 9 implements the prism exactly as PRD §12.9's **simplified rule model**: mixed light splits into R/G/B children at `φ−Δ, φ, φ+Δ`; single-channel light passes straight with transmittance loss. This is not Snell's law and must stay labelled as simplified in user-facing copy.
- `GameInteraction.ts` owns mutable interaction/undo/drag state; `GameState.ts` owns systems, the dirty-flag solve, gate animation, target charge and completion. This split keeps both files under the 250-line budget while preserving the exact undo semantics from Step 8.
- A gate's solver geometry changes only when `openFraction` crosses `gameConfig.optics.gateOpenFraction` (0.5); the bar itself animates linearly over `GATE_SLIDE_SEC` (0.5 s). A 10 Hz switch toggle therefore does not thrash the solver.
- Locked mirrors and lamps are still picked by the pointer so the engine can emit `"locked"` feedback instead of silently ignoring the input. Movable obstacles use `"outsideRange"` feedback when a drag leaves the rail.
- `rayVsPolygonHits()` collapses duplicate edge hits within `EPS_U`, so an exact polygon-corner hit becomes one surface hit and does not leak a second segment. A prism ray that only touches a vertex without a distinct exit produces no fan.
- The prism unit test uses `orientationDeg: 30` so the ray enters and exits through two distinct faces; a right-facing triangle at `0°` grazes a vertex and is not a valid dispersion scene.
- Real-browser dragging of movable obstacles, lamps and switch/gate feedback was not measured; TC-F06/F07/F14, TC-G05–G07, TC-E04/E06 and TC-X05/X06 are covered by deterministic unit scenes only.
- Step 10 scoring uses the PRD §10.8 formula verbatim (base 1000 − 2/s over par − 15/move over par − 100/hint, each effort penalty capped at 300, floor 100; 3★ ≥ 800, 2★ ≥ 500). Penalties are calculated once at completion and frozen into the saved `ScoreRecord`; the four star-boundary cases are tested explicitly.
- The `solution` array on each level is the single source of truth for both hint tiers and TC-F13 replay. Replay uses real `InputCommand`s, so a solution can only pass if it is actually reachable by a player (including snapping and drag commit).
- Mirror solution angles compare modulo 180° in `hints.ts`; lamps compare modulo 360°. A fourth hint press is ignored, and reset intentionally keeps `hintsUsed` so a player cannot erase the score penalty by restarting.
- The timer starts on the first play command (a hint counts), stops while paused and after completion, and restarts on reset. Pause/hint/pauseToggle are engine commands rather than player actions, so they never start the clock by themselves.
- Level 3 and Level 5 prisms use `circumradius: 56`, `orientationDeg: 30`, `spreadDeg: 12` so an eastward beam enters and exits two distinct faces (the same geometry already proven by `prism.test.ts`). This is a layout choice, not a PRD coordinate deviation.
- Level 5's movable rock solution is `{ x: 680, y: 540 }`; the authored `start` is `{ x: 720, y: 540 }` with a 560–1000 rail and 20 wu snap. All five PRD reference layouts validate and replay without coordinate changes, so PRD deviations remain empty.
- Completion now always builds a `CompletionSummary` (result + record); Level 5 adds a 2 s celebration via `celebrationSec` from `gameConfig.completion.finaleSec` before the result modal appears. Progress is saved exactly once from `GameCanvas` using a ref guard.
- Validation errors block level loading and render `LevelError`; spacing overlaps remain warnings because PRD A-10 permits playtest nudges. `levelValidator.ts` was split into `validationTypes.ts`, `levelValidatorFields.ts` and `levelValidatorSpacing.ts` to meet the 250-line budget.
- HUD derivation moved to `engine/core/hud.ts` and solver-scene assembly to `game/opticsScene.ts` so `GameState.ts` stays at exactly 250 lines; `GameCanvas.tsx` contains two small components (each under 120 lines), not one oversized one.
- Real-browser HUD readability, pause/result focus behaviour, tutorial toasts, level unlock after completion and celebration timing were not verified without browser automation. Unit tests cover score records, unlock derivation, timer/pause, hint tiers, validation and all five solution replays.
- Step 11 keeps every atmosphere/particle number in `src/config/visualConfig.ts`; quality caps continue to come from `gameConfig.quality`, so adding a preset does not require editing a renderer.
- `Pool<T>` uses preallocated numeric handles and a LIFO free list; `ParticlePool` drops ambient motes before effect particles when a cap is hit, and all emitters scan with indices so steady frames allocate nothing.
- Emitters receive the resolved `palette` and a `colorFor` callback (`beamColor`) instead of hex literals; no renderer or emitter duplicates a CSS token value.
- Quality and reduced-motion changes apply live through one mutable `VisualSettings` object shared by reference with the layers plus `setSettings()`, so changing a setting never rebuilds layers or remounts the canvas.
- The Level 4 darkness mask uses a pre-rendered radial sprite with `destination-out` holes at ≤120 sampled beam points (PRD §12.7), rather than creating a gradient per sample per frame.
- `BeamLayer` now honours `quality.glowPasses` by drawing the brightest N passes and adds the PRD §12.5 moving dash highlight; the highlight is disabled under reduced motion.
- Drag intent/types moved to `src/engine/core/drag.ts` so `useGameRuntime.ts` stays at 241 lines after wiring quality and particles.
- Real-browser visual checks for TC-G10 (CPU-throttled motion speed), FR-058/063 (twinkle/sweep/mist/reduced motion), FR-059/060 (glow and additive overlap) and the darkness atmosphere were not performed; pure-function time-equivalence and cap tests cover the logic only.
- STEP 12 audio is fully synthesized (oscillators plus generated noise); no audio files, samples or new assets are required.
- `AudioContext` is injected into `AudioManager` so Node tests can use a fake graph; the browser factory still supports `webkitAudioContext` and degrades to silence when unavailable.
- One app-wide `audioManager` singleton survives route changes. `AudioBridge` at the app root installs the first-gesture unlock and mirrors persisted settings into it; components use `useAudio()` rather than importing the engine.
- `AudioEvents` detects state transitions and emits cue names; `AudioManager` owns throttling, gain routing and the voice cap, so event detection needs no Web Audio types.
- A jingle counts as one voice even though it schedules several oscillators; the 8-voice PRD cap applies to concurrent cue events, which is the practical definition of "no overlap spam".
- All audio tunables (frequencies, durations, throttles, ambience levels, voice cap) live in `src/config/audioConfig.ts`; manager defaults are read from `settingsSchema.DEFAULT_SETTINGS` rather than duplicated numbers.
- A delegated document-level click listener plays the UI cue, so existing UI primitives needed no audio imports; the same first pointer/key gesture unlocks Web Audio for every screen.
- Real-browser autoplay unlock, audible cue quality, instant mute while sound is playing and persistence after reload were not verified without browser automation; Node tests cover the graph, gains and transitions only.
- STEP 13 Inspector data comes from the tracer's `HitEvent` array via a pure bridge; no second reflection formula is implemented for display, so TC-G13 compares the panel with solver output directly.
- D/G/P/N toggles are engine-owned presentation state so they work while paused and do not restart a level. The renderer receives the same flags through the mutable `VisualSettings` object; G falls back to one core pass and P skips both particle update and draw while keeping the pool allocated.
- P is mapped to particles per FR-064; pause remains Esc per FR-025 (Space is an added alias). How-to-Play now lists every presentation key.
- U is handled in the React presentation controls rather than the engine because `demoUnlockAll` is a persisted user setting; the key listener only exists when the demo-unlock feature flag allows it.
- Inspector values reach the DOM through the existing ≤10 Hz HUD snapshot. The frame-time graph uses a tiny external store fed by the same poll, so React never re-renders per animation frame.
- All overlay sizes, defaults, graph bounds and precision live in `src/config/inspectorConfig.ts`; overlay colours come from the renderer palette tokens, with no new hardcoded hex values.
- Real-browser toggling, selected-hit readability, frame-graph appearance and the ≤30 s demonstrations of PRD §12.10 were not performed; unit tests cover the data bridge, key mapping, canvas draw calls and renderer toggles only.

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

## Step 6 measurements

- 2026-11-17, Node v22.22.3: full gate passes sequentially — lint ✔, typecheck ✔, 135 tests in 19 files ✔ (17 new), `next build` ✔ (7 static routes plus `/play/[levelId]` partial prerender).
- 2026-11-17: `ViewTransform` unit tests cover 50%/100%/200% scaling, a 1000×1000 letterboxed viewport, DPR cap at 2, zero-size safety and pointer→world round trips at DPR 3 (TC-G12 logic).
- 2026-11-17: `GameLoop` unit tests cover dt clamp at 0.05 s, suspend/resume, stop/cancel, paused render, smoothed fps, non-finite timestamps and 20 start/stop cycles with zero orphan frame requests.
- 2026-11-17: largest Step 6 source file is `PlaceholderSceneLayer.ts` at 160 lines (budget 250); largest React component is `GameCanvas.tsx` at 48 lines (budget 120).
- 2026-11-17, user-owned dev server on `http://localhost:3000/play/level-01`: HTTP 200 with the SSR gate placeholder present. No FPS, frame-time or bundle-size figures measured.

## Step 7 measurements

- 2026-11-17, Node v22.22.3: full gate passes sequentially — lint ✔, typecheck ✔, 169 tests in 25 files ✔ (34 new), `next build` ✔ (7 static routes plus `/play/[levelId]` partial prerender).
- 2026-11-17, `npm run test:coverage`: `src/engine/optics` = 95.56% statements / 92.92% branches / 100% functions / 95.56% lines; 90% per-glob threshold now enforced in `vitest.config.ts`.
- 2026-11-17, 500 four-mirror solves (node environment, no coverage instrumentation): average 0.0799 ms, p95 0.1242 ms, max 1.5372 ms; the assertion requires average < 2 ms.
- 2026-11-17: largest optics source file is `tracer.ts` at 181 lines (budget 250); `primitives.ts` 124, `transform.ts` 69, `intersect.ts` 68, `reflect.ts` 23.
- TC-F03 covered with 20 (φ, θ) pairs; TC-G01–G04, TC-E01–E03, TC-E05, TC-X01–X04, TC-X07 and TC-X08 all have dedicated unit tests. No browser measurement in this step.

## Step 8 measurements

- 2026-11-17, Node v22.22.3: full gate passes sequentially — lint ✔, typecheck ✔, 198 tests in 32 files ✔ (29 new), `next build` ✔ (7 static routes plus `/play/[levelId]` partial prerender).
- 2026-11-17, user-owned dev server on `http://localhost:3000/play/level-01`: HTTP 200 (16,697 bytes SSR markup). No browser interaction or FPS measurement.
- 2026-11-17: largest new engine file is `GameState.ts` at 248 lines, `useGameRuntime.ts` 238, `ComponentsLayer.ts` 112, `GameCanvas.tsx` 98; all under the AGENTS budgets (250/250/120).
- TC-F01/F02/F08/F15 logic is covered by 12 `GameState` tests; the reflection oracle asserts a 90° heading change for a 45° mirror rotation (2× rule); the idle-frame test asserts `solveCount` stays at 1 across two unchanged ticks.
- Level 1 solution replay (`M1=135°`, `M2=135°`) completes after charge + hold; the initial state does not complete after 2 s of idle ticks.

## Step 9 measurements

- 2026-11-17, Node v22.22.3: full gate passes sequentially — lint ✔, typecheck ✔, 216 tests in 37 files ✔ (18 new), `next build` ✔ (7 static routes plus `/play/[levelId]` partial prerender).
- 2026-11-17, `npm run test:coverage`: all files 95.82% statements / 91.42% branches / 99% functions / 95.82% lines; `src/engine/optics` 93.66% statements / 91.21% branches / 100% functions / 93.66% lines; `src/game` 97.67% statements / 87.96% branches / 100% functions / 97.67% lines. The 90% per-glob threshold still passes.
- 2026-11-17, 500 four-mirror solves without coverage instrumentation: average 0.0790 ms, p95 0.1550 ms, max 1.4723 ms.
- 2026-11-17, user-owned dev server on `http://localhost:3000/play/level-01`: HTTP 200 (16,697 bytes SSR markup). No browser interaction or FPS measurement.
- 2026-11-17: largest Step 9 source file is `useGameRuntime.ts` at 244 lines, then `tracer.ts` 243, `GameInteraction.ts` 232, `GameState.ts` 210, `ComponentsLayer.ts` 126, `componentShapes.ts` 115 and `GameCanvas.tsx` 103; all under the AGENTS budgets (250/250/120).
- TC-F04/F05/G07/X05 are covered by `prism.test.ts`; TC-F06/F14/X06 by `mechanics.test.ts` + `gates.test.ts`; TC-F07/G05/E04 by `mechanics.test.ts` (optics); TC-G06 by `tracerLimits.test.ts`; TC-E06 by `tracer.test.ts`; movable-obstacle, rotatable-lamp and locked-feedback scenes live in `interaction.test.ts`.

## Step 10 measurements

- 2026-11-17, Node v22.22.3: full gate passes sequentially — lint ✔, typecheck ✔, 249 tests in 42 files ✔ (33 new), `next build` ✔ (7 static routes plus `/play/[levelId]` partial prerender).
- 2026-11-17, `npm run test:coverage`: all files 94.13% statements / 86.74% branches / 97.94% functions / 94.13% lines; `engine/optics` 93.66% statements / 91.21% branches; `game` 92.91% statements / 80.96% branches; `scoring.ts` 100% statements / 90% branches; `levelValidator.ts` 98.66% statements / 82.35% branches; `completion.ts`, `geometry.ts`, `opticsScene.ts`, `targets.ts` 100%.
- 2026-11-17, solution replay (`tests/unit/levels/solutions.test.ts`): 5/5 levels validate with zero errors, 5/5 do not start solved after 3 s idle, 5/5 complete after their authored solution is replayed (15/15 checks).
- 2026-11-17, 500 four-mirror solves without coverage instrumentation in the gate run: average 0.0754 ms, p95 0.1103 ms, max 2.2639 ms. Under coverage instrumentation: average 0.2319 ms, p95 0.3354 ms, max 10.2845 ms. The assertion requires average < 2 ms.
- 2026-11-17: largest source file is `GameState.ts` at exactly 250 lines (budget 250), then `useGameRuntime.ts` 246, `tracer.ts` 243, `GameInteraction.ts` 232, `levelValidatorFields.ts` 230; largest React shell is `GameCanvas.tsx` at 133 lines containing two components of ~40 and ~82 lines (budget 120 per component).
- 2026-11-17: TC-F08–F13, TC-F15/F16 and TC-E08 are covered by `rules.test.ts`, `scoring.test.ts`, `hints.test.ts`, `levelValidator.test.ts` and `solutions.test.ts`. No browser interaction, FPS, frame-time or bundle-size figures were measured in this step.

## Step 11 measurements

- 2026-11-17, Node v22.22.3: full gate passes sequentially — lint ✔, typecheck ✔, 270 tests in 47 files ✔ (21 new), `next build` ✔ (7 static routes plus `/play/[levelId]` partial prerender).
- 2026-11-17, new unit tests: `Pool<T>` free-list reuse and defensive handles (4), particle caps/TC-G11 with a 200-frame simulated scene (5), time-based animation/TC-G10 equivalence at 30 vs 144 FPS (4), glow-sprite cache keying/eviction (4), darkness sample cap/buffer safety (4).
- 2026-11-17, 500 four-mirror solves in the passing gate run (no coverage instrumentation): average 0.1503 ms, p95 0.2195 ms, max 5.2574 ms.
- 2026-11-17: largest Step 11 source file is `ParticlePool.ts` at 249 lines (budget 250), then `useGameRuntime.ts` 241, `GameCanvas.tsx` 136, `emitters.ts` 161, `EnvironmentLayer.ts` 110, `BeamLayer.ts` 92; all React components remain under the 120-line budget. No hardcoded hex colours in the new renderer/particle files.
- No FPS, frame-time, bundle-size or CPU-throttle figures were measured in this step; no browser automation was available.

## Step 12 measurements

- 2026-11-18, Node v22.22.3 / npm 11.15.0: full gate passes sequentially — lint ✔ (0 warnings), typecheck ✔, 286 tests in 49 files ✔ (16 new), `next build` ✔ (7 static routes plus `/play/[levelId]` partial prerender).
- 2026-11-18, new audio tests: `AudioManager` 10 tests (locked/no-op play, unlock/resume, gains/mute, looping ambience, pitch by angle step, jingles/noise, throttle, 8-voice cap, expiry, dispose, unsupported browser) and `AudioEvents` 6 tests (initial state, rotation step, charge/activation transitions, gate changes, one-shot completion, rotatable source).
- 2026-11-18: largest Step 12 source file is `AudioManager.ts` at 226 lines, then `useGameRuntime.ts` at 247; `AudioBridge.tsx` is 9 lines and `useAudio.ts` 46 — all under AGENTS budgets (250 source / 120 component).
- 2026-11-18, 500 four-mirror solves in the passing gate run (no coverage instrumentation): average 0.1046 ms, p95 0.1706 ms, max 4.7163 ms.
- No browser audio, FPS, frame-time or bundle-size figures were measured in this step; no browser automation was available.

## Step 13 measurements

- 2026-11-18, Node v22.22.3 / npm 11.15.0: full gate passes sequentially — lint ✔ (0 warnings), typecheck ✔, 296 tests in 52 files ✔ (10 new), `next build` ✔ (7 static routes plus `/play/[levelId]` partial prerender).
- 2026-11-18, new tests: Inspector data bridge 4 (TC-G13 vectors/dot/angles, formatting, hit selection, live toggles), input mapping 1, InspectorLayer canvas stub 3, renderer G/P toggles 2.
- 2026-11-18: largest new source file is `InspectorLayer.ts` at 164 lines, then `InspectorPanel.tsx` 78 and `PresentationControls.tsx` 60; `GameState.ts` 249 and `useGameRuntime.ts` 248 remain within the 250-line budget, and all React components remain under 120 lines.
- 2026-11-18, 500 four-mirror solves in the passing gate run (no coverage instrumentation): average 0.0984 ms, p95 0.1436 ms, max 4.6914 ms.
- No browser D/G/P/N/U interaction, frame-graph, concept-demo timing, FPS, frame-time or bundle-size figures were measured in this step; no browser automation was available.

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
AC-22: Step 2 enforces ≥90% coverage on `src/lib/math`; Step 10 coverage also reports optics 93.66% and scoring 100% statements, with validator 98.66% statements (branch coverage of the large field-validator helper remains 61.64%, below the Step 14 ≥90% branch goal).
FR-053–057: settings schema, validation, debounced/blocked-storage persistence, migrations and effective settings implemented and unit-tested in Step 3; TC-E10 and TC-F09 logic covered.
NFR-016: token text/background contrast pairs measured in Step 4 and all exceed 4.5:1; coloured-target shape cues (▲/●/■) are deferred to Step 14 accessibility work.
AC-15 / AC-21: focus ring is defined globally (`:focus-visible` cyan outline) and every interactive primitive exposes native keyboard semantics in SSR tests; actual browser Tab/Escape traversal not verified (no browser automation available).
AC-02: Step 5 adds all menu routes, Back buttons, schema-driven settings, lock-toast redirects and error boundaries; SSR markup tests and production HTTP 200 checks pass, but live mouse/keyboard navigation, reload persistence and confirmation-dialog interaction remain not verified in a browser.
FR-001–010: implemented across Step 5 screens and gating; real-browser acceptance is still pending, so the step status is PARTIAL rather than PASS.
FR-061 / TC-G12: responsive 16:9 view transform, DPR cap and pointer inversion implemented and unit-tested in Step 6; zoom/letterbox rendering and idle 60 FPS still need a real browser.
FR-062 / FR-063: quality and reduced-motion now apply live in Step 11 through a shared mutable `VisualSettings` object (particle caps, glow passes, water layers, sweep/particle damping); unit tests cover the caps and time-equivalence, but visible live switching needs a real browser (unverified). FR-058–061: pooled particles, cached glow sprites, additive beam overlap, stars/water/mist/sweep and the Level 4 darkness mask are implemented; TC-G10/G11 logic is unit-tested, visual and CPU-throttle demos remain unverified.
TC-F03 / AC-06: 20 reflection pairs pass the independent 2θ−φ oracle in Step 7; the 4-bounce chain coordinates assertion is a test-scene check, not a Level 2 reference (levels arrive in STEP 10).
AC-14: TC-X01–X08 now all pass (X05/X06 were added in Step 9). AC-22 still has ≥90% optics coverage after prism/gate additions; scoring and validator statement coverage were measured in STEP 10, with branch coverage still to be raised in STEP 14.
FR-050 / FR-051: all seven cue families, first-gesture unlock, master/SFX/ambient gains, instant mute, 8-voice cap and per-cue throttling are implemented and unit-tested in STEP 12. Real-browser audibility, autoplay behaviour and saved-setting restoration remain unverified, so the step status is PARTIAL.
FR-041 / FR-064 / TC-G13 / AC-18: normals, hit numbers, incidence/reflection arcs and the d/n/r panel are implemented from solver events; D/G/P/N/U toggles work live in engine/renderer/React unit tests. Real-browser demonstration and the ≤30 s Concept Mapping Table rehearsal are not verified, so STEP 13 is PARTIAL.
