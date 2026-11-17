# LightPath — The Lighthouse Rescue

A complete 2D optical puzzle game for a Computer Graphics course. Guide light through mirrors,
obstacles, colour targets, switches, gates and one simplified prism to relight a lighthouse. The
shell is **Next.js App Router + React + strict TypeScript**; the game uses **native Canvas 2D**; the
optics core is pure deterministic TypeScript with no React, DOM, renderer or game-library dependency.

Requirements source of truth: [`docs/LightPath_PRD.md`](docs/LightPath_PRD.md). This README is the
practical project guide.

## 1. What the game is

Each level presents a dark coastal scene, a source and a set of components. Rotate mirrors or a lamp,
slide a constrained rock and watch the beam respond in real time. A target charges only when it
receives the required colour at sufficient intensity; a switch powers a gate; the prism splits mixed
light into R/G/B children under a deliberately simplified rule. When every required target stays lit,
the level completes with score, stars, time and move count.

The teaching goal is to make graphics theory visible. The Optics Inspector shows solver values
(`d`, `n`, `d·n`, `r`) and hit points, so the reflection equation on a slide is the same value that
moves the beam on screen.

Features: five data-driven levels; mirrors, rotatable lamps, obstacles, movable rocks, colour-aware
targets, switches and gates; simplified prism; pointer and keyboard input; snapping, undo, reset,
hints and pause; star scoring; LocalStorage progress with derived unlocks; animated water, stars,
lighthouse sweep, mist, darkness mask, glow and particles; synthesized Web Audio; presentation
toggles; schema-driven settings; offline static export.

## 2. Quick start

Requires Node.js 20.9+ and npm. Development used Node v22.22.3 / npm 11.15.0 on Windows.

```bash
npm ci
npm run dev
```

Open <http://localhost:3000>. Start with **Play** for Level 1. For demo unlock, copy `.env.example`
to `.env.local`, set `NEXT_PUBLIC_DEMO_UNLOCK_AVAILABLE=true`, restart, then use the **Unlock all
levels** setting or press **U** during play. No environment variable is required for the MVP.

## 3. Commands and gate

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Default production build used by Vercel |
| `npm run start` | Serve the default production build |
| `npm run build:static` | Offline export into `.next-static` |
| `npm run serve:static` | Serve the export at <http://localhost:3200> |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript `--noEmit` |
| `npm run test` | Vitest unit tests |
| `npm run test:coverage` | Vitest with V8 coverage thresholds |
| `npm run format` / `format:check` | Prettier |

Mandatory gate: `npm run lint && npm run typecheck && npm run test && npm run build`. PowerShell 5.1
lacks `&&`, so run the four commands sequentially. CI uses Ubuntu and runs them on every PR.
Prettier is configured but intentionally not gate-clean on a few compact files kept under 250 lines.

## 4. Controls

| Input | Action |
| --- | --- |
| Pointer drag | Rotate mirrors/lamps; slide rocks along their rail |
| Tab / Shift+Tab | Cycle selectable components on the focused canvas |
| ← / → or Q / E | Rotate selected component; Shift = 5° fine step |
| ↑ / ↓ | Nudge selected rock by one authored grid step |
| Z / R / H | Undo / reset / next hint |
| Esc or Space | Pause / resume |
| D / G / P / N | Inspector / glow / particles / normals |
| U | Demo unlock when `NEXT_PUBLIC_DEMO_UNLOCK_AVAILABLE=true` |

Every action also has a HUD button. Target, hint and completion messages use an `aria-live` region.

## 5. Routes and levels

Routes: `/` menu · `/levels` cards · `/how-to-play` · `/settings` · `/about` · `/play/level-01` …
`/play/level-05` · `/dev/ui` showcase (inert in production or when its flag is off). Invalid or
locked play URLs redirect.

| # | Level | Difficulty | Par | Main idea |
| --- | --- | --- | --- | --- |
| 1 | First Light | Tutorial | 45 s / 3 moves | Two mirrors; learn snapping and the 2× beam turn. |
| 2 | The Broken Path | Easy | 90 s / 5 moves | Route around a wall using one locked mirror. |
| 3 | Color of Hope | Medium | 120 s / 7 moves | Split mixed light and feed R/G/B targets. |
| 4 | The Dark Passage | Medium | 150 s / 9 moves | Two sources, switch and gate in darkness. |
| 5 | Lighthouse Rescue | Hard | 210 s / 10 moves | Prism, gate, movable rock and all target colours. |

Each level is data only in `src/levels/`. `validateLevel()` checks it before the canvas mounts, and
the solution-replay test proves it starts unsolved and completes with authored commands.

## 6. Technology and architecture

Next.js App Router, React, strict TypeScript and Tailwind CSS with CSS-variable tokens. Canvas 2D
and Web Audio are the only rendering/audio APIs. No game engine, physics engine, state library or UI
kit is used. Vitest, ESLint and TypeScript enforce quality.

```text
routes / React shell ── hooks ──> engine ──> pure optics result
      │                      ├─ state, input, undo, scoring
      │                      └─ render layers, particles, audio events
      └─ schema settings + LocalStorage progress (engine never reads storage)
```

| Folder | Responsibility |
| --- | --- |
| `src/app`, `src/components` | Routes, UI primitives, HUD, screens and Inspector panel |
| `src/engine/core` | `GameState`, `GameLoop`, `InputController`, `ViewTransform`, `UndoStack` |
| `src/engine/optics` | Pure transform, intersect, reflect, prism and tracer modules |
| `src/engine/render`, `particles`, `audio` | Presentation only |
| `src/game`, `src/levels` | Rules/validation and level data only |
| `src/config`, `src/lib`, `src/stores`, `src/hooks` | Tunables, math, persistence and React bindings |

`src/lib/math` and `src/engine/optics` never import React, the DOM, the renderer, components or app
code. React reaches the engine only through hooks and receives an immutable HUD snapshot at ≤10 Hz,
so per-frame work never re-renders the React tree.

## 7. Mathematical model

World space is **1280 × 720 wu**, origin top-left, x right / y down. Angles are degrees in data and
radians internally; 0° points east, positive rotation is clockwise on screen.

- Heading φ → `(cos φ, sin φ)`. Mirror angle θ is periodic every 180° with normal
  `n = (−sin θ, cos θ)`.
- Reflection: `r = d − 2(d·n)n`; oracle `φ' = 2θ − φ (mod 360°)`. A 15° mirror rotation turns the
  beam 30°.
- Ray–segment intersection solves `p = a + t r` against `q + u s` with cross products; `T_MIN`,
  `EPS_U`, `EPS_PARALLEL` and `OFFSET` prevent self-hits and numerical leaks.
- Rotation about a pivot is `T(c) R(θ) T(−c)`. `ViewTransform` adds uniform scale, letterboxing and
  inverse pointer mapping with DPR capped at 2.
- The tracer uses a bounded queue, nearest-hit selection, `skipId`, repeat-state detection and
  `MAX_BOUNCES` / `MAX_SEGMENTS` caps, so facing mirrors terminate safely.
- Prism rule: mixed light (≥2 channels ≥0.2) splits into R/G/B at `−Δ, 0, +Δ` (Δ = 12°);
  single-channel light passes straight with transmittance loss. This is **not** wavelength refraction.

Tolerances, caps, radii, durations and colours live in `src/lib/math/constants.ts` or `src/config/*`.

## 8. Settings and progress

Settings are defined once in `src/config/settingsSchema.ts`; `SettingsForm` renders any schema entry
automatically. `resolveSettings()` expands `quality: auto` from `hardwareConcurrency` /
`deviceMemory`, resolves `reducedMotion: system` from `prefers-reduced-motion`, and applies quality
caps. The engine receives effective settings through React and never reads LocalStorage.

Persistence keys are `lightpath.v1.settings` and `lightpath.v1.progress`. Reads are validated and
clamped, corrupt JSON falls back to defaults, writes are debounced, cross-tab events sync state, and
blocked storage switches the stores to in-memory mode. Unlock state is derived from completed
levels, never stored. Reset settings and reset progress require confirmation. Details:
[`docs/SETTINGS.md`](docs/SETTINGS.md).

## 9. Verified quality evidence

Measured 2026-11-18 on an HP EliteBook 840 G6, Windows NT 10.0.26300.0, Node v22.22.3 / npm 11.15.0.
No browser or browser version was used for these numbers.

| Check | Result |
| --- | --- |
| Required gate | lint ✔ · typecheck ✔ · 326 tests in 58 files ✔ · production build ✔ |
| Coverage | 95.82% statements · 93.59% branches · 97.97% functions · 95.82% lines |
| Per-glob thresholds | math, optics, geometry, scoring and validator all ≥90% and enforced |
| Solution replay | 5/5 levels start unsolved and complete with authored commands |
| Reflection | 20 angle pairs pass at 1e-6 tolerance |
| Solver | 500 four-mirror solves averaged 0.0776 ms in Step 14; not re-measured after renderer-only changes |
| Bundle upper bound | 16 JS chunks, 744,518 raw / 231,522 gzip bytes (226.1 KiB) |
| Static export | All five play routes prerendered; 8 checked routes returned HTTP 200 |
| Dependencies | `npm audit --omit=dev`: 0; full audit: 22 dev-only advisories |
| Security | Headers configured; CSP report-only; no `dangerouslySetInnerHTML` in `src` |

The bundle figure is an **all-chunks** upper bound, not measured `/play` first-load payload. Browser
FPS/frame time, 30-minute heap, visible effects, audible cues, live mouse/keyboard play,
cross-browser smoke, Vercel deployment, five-person playtest, backup video and three timed rehearsals
were **not performed**. See [`docs/final-report.md`](docs/final-report.md) and
[`PROGRESS.md`](PROGRESS.md).

## 10. Deployment and presentation

**Plan A — Vercel/default:** connect the GitHub repo, build with `npm run build`, verify `/`,
`/levels` and direct reloads of all play routes. No env vars are needed. The server sends
`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` and
`Content-Security-Policy-Report-Only`. CSP stays report-only until a browser proves enforcement is
safe. Tag the exact submitted commit `v1.0-submission`.

**Plan B — offline:** run `npm run build:static` then `npm run serve:static`. Output is `.next-static`
so a running dev server's `.next` is untouched. `generateStaticParams()` prerenders all five levels;
any static server can host the files, but plain static hosting will not provide Next headers.

**Plan C — backup:** record a full run as a screen capture before the presentation (not in repo).
The five-minute script, key map, concept cue sheet, fallbacks and blank rehearsal log are in
[`docs/demo-script.md`](docs/demo-script.md).

## 11. Documentation and limitations

- [`PROGRESS.md`](PROGRESS.md) — step log, decisions, measurements and AC-01…AC-28 checklist.
- [`docs/final-report.md`](docs/final-report.md) — academic report, SC-01…SC-07 status, integrity.
- [`docs/SETTINGS.md`](docs/SETTINGS.md) — schema, migrations, flags and data actions.
- [`docs/level-authoring.md`](docs/level-authoring.md) — level data, validation and replay checklist.
- [`docs/demo-script.md`](docs/demo-script.md) — timed presentation plan and rehearsal log.
- [`AGENTS.md`](AGENTS.md) — engineering workflow used across the 15 build steps.

Limitations: simplified prism; no backend or cross-device save; five levels by design; dev-only audit
advisories; browser/Vercel/playtest/rehearsal evidence not performed. Textbook, API and lecture
references must be added from sources actually consulted. PRD §30 lists future work: automatic
quality, touch/tablet polish, refined reduced motion, then optional filters, rotatable prism and
finale cinematics.

## 12. Credits

Fonts load through `next/font` — Space Grotesk, Inter and JetBrains Mono, SIL Open Font License. Icons
are inline SVGs; glow sprites, effects and audio are generated at runtime. No third-party images,
sounds, engines or UI kits are bundled.

Development used an AI coding assistant for implementation, tests and documentation; disclose this
according to university policy. Only experiments actually executed are reported as results.
