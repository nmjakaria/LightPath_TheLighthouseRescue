# LightPath — The Lighthouse Rescue

A 2D optical puzzle game built for a Computer Graphics course. Next.js App Router + React +
strict TypeScript for the shell, native HTML5 Canvas 2D for the game, and a pure TypeScript
optics core. The single source of truth for requirements is `docs/LightPath_PRD.md`.

## Setup

Requires Node.js 20.9+ (Node 22 recommended) and npm.

```bash
npm ci
npm run dev
```

Open <http://localhost:3000>. The current screen is the Step 1 scaffold placeholder.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript (no emit) |
| `npm run test` | Vitest unit tests |
| `npm run test:coverage` | Vitest with V8 coverage |
| `npm run format` / `npm run format:check` | Prettier |

The same four gate commands (lint, typecheck, test, build) run in `.github/workflows/ci.yml`.

## Layout and conventions

- `src/app` — routes; `src/components/ui` — reusable primitives; `src/components/game` — HUD/canvas.
- `src/engine/core` — loop, state, input, view; `src/engine/optics` — pure light mathematics.
- `src/engine/render`, `src/engine/particles`, `src/engine/audio` — presentation only.
- `src/game` — rules; `src/levels` — data only; `src/lib/math` — vectors, matrices, constants.
- `src/config`, `src/lib/store`, `src/stores`, `src/hooks` — settings and persistence (from Step 3).
- `src/styles/tokens.css` — design tokens from PRD §14.1, mapped into Tailwind in `src/app/globals.css`.
- World space is 1280 × 720 wu, x right / y down; angles are degrees in data, radians internally.
- `src/lib/math` and `src/engine/optics` never import React, the DOM, the renderer or app code.

Build progress and decisions are recorded in `PROGRESS.md`.
