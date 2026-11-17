# LightPath — The Lighthouse Rescue

A 2D optical puzzle game for a Computer Graphics course. The application shell is Next.js (App
Router) + React + strict TypeScript; the game is drawn with native Canvas 2D; the optics core is a
pure, deterministic TypeScript module. The single source of truth for requirements is
`docs/LightPath_PRD.md`.

## Quick start

Requires Node.js 20.9+ and npm (development used Node v22.22.3 / npm 11.15.0 on Windows).

```bash
npm ci
npm run dev
```

Open <http://localhost:3000>. Start at **Play** for Level 1, or use **Unlock all levels** in
Settings when the demo-unlock flag is enabled.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Vercel/default production build |
| `npm run start` | Serve the default production build |
| `npm run build:static` | Offline Plan B export (output: `.next-static`) |
| `npm run serve:static` | Serve the export at <http://localhost:3200> |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |
| `npm run test` | Vitest unit tests |
| `npm run test:coverage` | Vitest with V8 coverage and enforced thresholds |
| `npm run format` / `npm run format:check` | Prettier |

The required gate is `npm run lint && npm run typecheck && npm run test && npm run build`. On
PowerShell 5.1, run the four commands sequentially because `&&` is not supported; CI uses bash.

## Controls

| Input | Action |
| --- | --- |
| Pointer drag | Rotate mirrors/rotatable lamps; slide movable rocks along their rail |
| Tab / Shift+Tab | Cycle selectable components while the canvas has focus |
| ← / → or Q / E | Rotate selected component one step (hold Shift for the 5° fine step) |
| ↑ / ↓ | Nudge a selected movable rock by one authored grid step |
| Z | Undo · R reset · H hint · Esc or Space pause |
| D / G / P / N | Inspector / glow / particles / normals presentation toggles |
| U | Toggle demo-unlock when `NEXT_PUBLIC_DEMO_UNLOCK_AVAILABLE=true` |

## Routes

`/` menu · `/levels` selection · `/how-to-play` · `/settings` · `/about` · `/play/level-01` …
`/play/level-05` · `/dev/ui` (inert in production or when the flag is off).

## Architecture

- `src/app` routes; `src/components/ui` reusable primitives; `src/components/game` HUD/canvas shell.
- `src/engine/core` loop, state, input, view transform; `src/engine/optics` pure light mathematics.
- `src/engine/render`, `src/engine/particles`, `src/engine/audio` presentation only.
- `src/game` rules and validators; `src/levels` data only; `src/lib/math` vectors, matrices, constants.
- `src/config`, `src/lib/store`, `src/stores`, `src/hooks` settings and persistence.
- World space is 1280 × 720 wu, origin top-left, x right / y down. Angles are degrees in data and
  radians internally; 0° points east and positive rotation is clockwise on screen.
- `src/lib/math` and `src/engine/optics` never import React, the DOM, the renderer or app code.
  React reaches the engine only through hooks; the HUD receives a ≤10 Hz immutable snapshot.

See `docs/SETTINGS.md` for configuration and persistence, and `docs/level-authoring.md` for levels.

## Deployment

**Plan A (Vercel/default):** connect the repository, use the default Next.js build with no required
environment variables, and verify `/`, `/levels` and a direct reload of `/play/level-01`. Tag the
submitted commit `v1.0-submission`. The server build sets `X-Content-Type-Options`, `X-Frame-Options`,
`Referrer-Policy`, `Permissions-Policy` and a **report-only** CSP. The CSP stays report-only because
browser execution was not available to prove that an enforced policy would not break Next inline
scripts; the exact policy is in `docs/final-report.md`.

**Plan B (offline static export):** run `npm run build:static` then `npm run serve:static`. The
export lives in `.next-static` so it does not disturb a running dev server's `.next`; any static
server can host it. Server response headers are unavailable from a plain static host. The build
prerenders all five `/play/level-0N` routes via `generateStaticParams`.

**Plan C:** record a full run as a backup video (not included in this repository).

## Quality evidence

Measured 2026-11-18: full gate passes; 326 tests in 58 files; overall coverage 95.82% statements /
93.59% branches / 97.97% functions / 95.82% lines; math/optics/geometry/scoring/validator thresholds
pass. All static JS chunks total 231,522 gzip bytes (226.1 KiB). The static export prerenders all
five play routes and served eight checked routes over HTTP 200. `npm audit --omit=dev` reports 0
vulnerabilities. Browser FPS, CPU-throttle, playtest, Vercel and cross-browser checks were **not
performed**; see `docs/final-report.md` and `PROGRESS.md` for the honest status.

## Documentation

- `PROGRESS.md` — step log, decisions, measurements and AC checklist
- `docs/SETTINGS.md` — settings, migrations and persistence
- `docs/level-authoring.md` — adding and validating levels
- `docs/demo-script.md` — five-minute presentation plan and rehearsal log
- `docs/final-report.md` — academic report structure and honest results

## Credits

Fonts are loaded through `next/font` (Space Grotesk, Inter, JetBrains Mono; SIL Open Font License).
All icons are inline SVG, glow sprites and audio are generated at runtime, and no third-party images
or sound files are bundled. Development used an AI coding assistant; disclose this according to the
course policy.
