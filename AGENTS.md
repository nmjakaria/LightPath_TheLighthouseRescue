# LightPath — The Lighthouse Rescue · Agent Build Prompt

> Save this file in the **project root** as `AGENTS.md` (OpenCode loads it as project rules). If your setup does not auto-load it, start every session with: *"Read AGENTS.md and PROGRESS.md, then continue."*
>
> **PRD location:** `docs/LightPath_PRD.md` ← change this line if your PRD file has another name or path.
---

<!-- ## 0. Kickoff message (paste this once into OpenCode)

```
Read AGENTS.md completely, then read the PRD it points to. Do NOT write code yet.
Create PROGRESS.md from the template in AGENTS.md section 9, summarise the plan in
10 lines, and then execute STEP 1 only. Stop after the step gate passes and report
using the format in AGENTS.md section 8. Wait for me to say "next" before STEP 2.
``` -->

After that, drive the build with short messages: **"next"**, **"redo step N"**, **"fix: <problem>"**, **"status"**.

---

## 1. Mission and source of truth

You are a senior full-stack + computer-graphics engineer building **LightPath — The Lighthouse Rescue**, a 2D optical puzzle game for a university Computer Graphics course, using **Next.js + React + TypeScript + native HTML5 Canvas 2D**.

- The **PRD is the single source of truth** for requirements, math, levels, UI, data models, tests and acceptance criteria. When this file and the PRD disagree on *what* to build, the PRD wins. When they disagree on *how you work*, this file wins.
- Never edit the PRD. If you find an error in it (for example a level coordinate that is not solvable), apply the **smallest fix in code/level data**, prove it with a test, and log it under *Decisions* in `PROGRESS.md`.
- Build **only what the current step asks**. No bonus features, no early optimisation, no refactors of finished steps unless a step gate fails.
- The team has web experience but no game-dev experience: write **clear, commented, readable** code. Each algorithm file starts with a 3–6 line comment explaining the math (as in PRD §12).

---

## 2. Operating rules (how you work)

1. **One step at a time.** Do the steps in section 7 in order. Never start step N+1 before step N's gate passes and the user says "next".
2. **Plan, then act.** At the start of each step write a short plan (files to create/change, tests to add). Then implement.
3. **Small, reviewable changes.** One branch per step (`step/03-settings`), commits in Conventional Commits style (`feat(optics): add ray-segment intersection`). At least one commit per step.
4. **Gate before reporting.** Every step ends only when this passes with zero errors:
   `npm run lint && npm run typecheck && npm run test && npm run build`
   Plus the step-specific checks listed in the step. If something fails, fix it; do not report success.
5. **Tests are part of the work.** Use the PRD oracles (e.g. reflected heading = `2θ − φ`, test IDs `TC-*`). Do not write tests that merely repeat the implementation.
6. **Ask only when blocked.** If the PRD is ambiguous, pick the PRD default, continue, and record the assumption in `PROGRESS.md`. Ask a question only if two valid options would cost the user real rework.
7. **No silent scope changes.** If a requirement cannot be met, say so in the report with the reason and a proposal.
8. **Keep the repo runnable.** `main`/current branch must always build and show something playable or at least a working screen.
9. **Never invent results.** Do not claim a test passed, a FPS number, or a bundle size without having run the command and seen the output.
10. **Security hygiene.** No secrets, no `dangerouslySetInnerHTML`, validate everything read from LocalStorage.

---

## 3. Hard technical constraints

### 3.1 Stack (fixed)
Next.js (App Router) · React · TypeScript **strict** · Tailwind CSS + CSS variables (design tokens from PRD §14.1) · `CanvasRenderingContext2D` · Web Audio API · LocalStorage · Vitest · ESLint + Prettier · GitHub Actions · Vercel.

### 3.2 Dependency allowlist
Allowed: `next`, `react`, `react-dom`, `typescript`, `tailwindcss` (+ its required PostCSS plugins), `eslint`, `eslint-config-next`, `prettier`, `vitest`, `@vitest/coverage-v8`, `@types/*`, optional `lucide-react` (**named imports only**), optional `@playwright/test` (dev only, Should-Have).
**Forbidden:** Phaser, PixiJS, Three.js, p5, Matter, Zustand/Redux/MobX/Jotai, Framer Motion, UI kits (MUI, Chakra, shadcn bundles, Radix), lodash, Howler, Axios, any state or game library. Need something else? Write it yourself (it is small) or ask.

### 3.3 Conventions that must never drift
- **World space:** 1280 × 720 world units (wu). Origin top-left, **x right, y down**.
- **Angles:** degrees in data, radians internally. 0° = east, **positive = clockwise on screen**. Heading φ → (cos φ, sin φ). Mirror angle θ is periodic with 180°.
- **Mirror normal:** `n = (−sin θ, cos θ)`. **Reflection:** `r = d − 2(d·n)n`. Test oracle: `φ' = 2θ − φ (mod 360°)`.
- **Light color:** RGB triple, each 0..1. **Prism:** mixed ray (≥2 channels ≥ 0.2) splits at exit point into R/G/B children with deviations `−Δ, 0, +Δ` (Δ = 12° default); single-channel rays pass straight. Label it a *simplified model* everywhere user-facing.
- **Layering:** `lib/math` and `engine/optics` import **nothing** from React, DOM, `engine/render`, `components` or `app`. Components talk to the engine **only through hooks**. Levels are **data only**.
- **No magic numbers:** every tolerance, cap, size, duration and color lives in `src/config/*` or `src/lib/math/constants.ts`.

### 3.4 Key constants (copy exactly into config; do not re-derive)

| Name | Value | Name | Value |
|---|---|---|---|
| EPS_PARALLEL | 1e-9 | MAX_BOUNCES | 24 |
| EPS_U | 1e-6 | MAX_SEGMENTS | 160 |
| T_MIN | 1e-3 wu | MIN_INTENSITY | 0.05 |
| OFFSET | 0.01 wu | MIRROR_REFLECTANCE | 0.95 |
| MIRROR_LENGTH | 96 wu | PRISM_TRANSMITTANCE | 0.9 |
| TARGET_RADIUS / SWITCH_RADIUS | 28 / 24 wu | MIXED_THRESHOLD | 0.2 |
| TARGET_ACTIVATION_SEC | 0.35 | TARGET_MIN_INTENSITY | 0.30 |
| COMPLETION_HOLD_SEC | 0.6 | GATE_SLIDE_SEC | 0.5 |
| ROTATION_STEP / FINE_STEP | 15° / 5° | UNDO_LIMIT | 50 |
| DT_CLAMP | 0.05 s | Boundary rect | (40,40)–(1240,680) |

Palette: Abyss `#040813`, Midnight `#0A1530`, Deep Navy `#11224A`, Navy Line `#26417A`, Cyan Beam `#22D3EE`, Ocean Teal `#14B8A6`, Beam Core `#E6FBFF`, Soft White `#F1F7FF`, Mist `#9FB3D1`, Light Red `#FF4D6D`, Light Green `#4DFF9F`, Light Blue `#4D9BFF`, Star Gold `#FFD166`, Success `#34D399`, Warning `#FBBF24`, Danger `#F87171`.

---

## 4. Lightweight, reusable component rules

**Budget:** file ≤ 250 lines · function ≤ 60 lines · React component ≤ 120 lines · `/play` first-load JS ≤ 300 KB gzip · assets ≤ 2 MB.

### 4.1 UI primitives (`src/components/ui/`) — build once, reuse everywhere
`Button` (variant: primary | secondary | ghost | danger; size: sm | md | lg; `iconLeft`, `loading`) · `IconButton` · `Card` · `Panel` · `Modal` (focus trap, Esc, `aria-modal`, return focus) · `Slider` (styled native range) · `Toggle` (`role="switch"`) · `Select` (styled native select) · `StarRating` · `ProgressRing` (SVG) · `Toast` + `useToast` · `Kbd` · `Tooltip` (CSS-only) · `Stack` / `Section` layout helpers · `cn()` class-merge helper (own 10-line implementation).

Rules for every primitive:
- Props are typed, small and consistent: `className?`, `disabled?`, `aria-*` pass-through, `ref` forwarding.
- Styling only through Tailwind classes that reference **CSS-variable tokens** (`styles/tokens.css`); no hard-coded hex in components.
- Accessibility built in: visible focus ring, keyboard operable, correct roles/labels, contrast ≥ 4.5:1, honors reduced motion.
- No internal global state, no side effects on import, no heavy dependencies.
- Each primitive appears on a dev-only page `/dev/ui` (guarded by a feature flag, excluded from production) so it can be eyeballed.
- Game screens/HUD are built **only** by composing these primitives. If you need a new visual element twice, promote it to a primitive.

### 4.2 Reusable engine utilities
`createStore` (tiny observable) · `createPersistentStore` · `Pool<T>` (generic object pool with free list; used by particles) · `Emitter<T>` (typed events) · `UndoStack<T>` (generic, bounded) · `ViewTransform` · `Layer` interface (`draw(ctx, frame)`; each render layer implements it) · `easing`/`lerp` · glow-sprite cache keyed by color+radius.

---

## 5. Settings and configuration architecture (maintain the whole app from one place)

The goal: **adding or changing a setting is a one-file change**, the Settings screen builds itself from a schema, and nothing else in the app reads LocalStorage directly.

### 5.1 Three clearly separated kinds of configuration

| Kind | Location | Who changes it | Examples |
|---|---|---|---|
| **Static tunables** (build-time) | `src/config/gameConfig.ts` | Developers | world size, optics limits, scoring numbers, quality presets, constants table in 3.4 |
| **Feature flags** | `src/config/features.ts` (reads `NEXT_PUBLIC_*` env, safe defaults) | Developers | `devUiPage`, `inspectorEnabled`, `demoUnlockAvailable`, `fpsOverlay` |
| **User settings** (runtime, persisted) | `src/config/settingsSchema.ts` → `settingsStore` | Player | volumes, mute, quality, rotation step, reduced motion, colorblind aid, demo-unlock |

### 5.2 Folder layout

```
src/config/        gameConfig.ts · features.ts · settingsSchema.ts
src/lib/store/     createStore.ts · createPersistentStore.ts
src/lib/settings/  resolveSettings.ts        (saved → effective)
src/stores/        settingsStore.ts · progressStore.ts
src/hooks/         useStore.ts · useSettings.ts · useProgress.ts
src/components/settings/  SettingsForm.tsx · SettingRow.tsx   (schema-driven)
docs/SETTINGS.md   how to add a setting, how migrations work
```

### 5.3 Schema-driven settings (single source of truth)

`settingsSchema.ts` exports an ordered list of definitions. Each entry has: `key`, `type` (`slider` | `toggle` | `select`), `label`, `description`, `group`, `default`, and type-specific fields (`min/max/step`, or `options`). Groups, in this order:

| Group | Settings |
|---|---|
| Audio | `masterVolume`, `sfxVolume`, `ambientVolume`, `muted` |
| Graphics | `quality` (auto/low/medium/high), `showFps` |
| Gameplay | `rotationStepDeg` (5 or 15) |
| Accessibility | `reducedMotion` (system/on/off), `colorblindAid` |
| Developer / Demo | `demoUnlockAll` (visible only if feature flag allows) |
| Data | actions: *Reset settings*, *Reset progress* (confirm dialog), optional *Export / Import settings JSON* |

Rules:
- The TypeScript type `GameSettings` is **derived from the schema** (or checked with `satisfies`) so a key cannot exist in one place and not the other.
- `SettingsForm` renders any schema with the UI primitives; it contains **no per-setting code**.
- `createPersistentStore({ key, schemaVersion, defaults, validate, migrate })` handles: JSON parse in `try/catch`, validation + clamping of every field, version migration, fallback to defaults and **in-memory mode** when storage is blocked or corrupt (PRD FR-055, TC-E10), debounced writes, and cross-tab sync via the `storage` event. Keys: `lightpath.v1.settings`, `lightpath.v1.progress`.
- `resolveSettings(saved, env)` produces **effective settings**: `quality:auto` → measured preset, `reducedMotion:system` → `prefers-reduced-motion`, quality preset → particle cap, mote cap, glow passes, water layers (low 80/15/1/2, medium 200/40/2/3, high 400/80/3/4).
- The engine **never reads LocalStorage and never imports the store**. React passes the effective settings in through `engine.setSettings(effective)`; the engine and renderer react to changes live (no reload).
- Unlock status is **derived** from progress records (level n+1 unlocked when level n is completed, or `demoUnlockAll`). Never store it separately.

### 5.4 Settings definition of done
A new setting is finished when: schema entry added · default + validation covered by a unit test · it appears in the Settings screen automatically · the consumer reads it from effective settings · `docs/SETTINGS.md` example still true.

---

## 6. Repository layout (from PRD §18 — create exactly this)

```
src/app/ (layout, page, levels, how-to-play, settings, about, play/[levelId], dev/ui)
src/components/ui/  src/components/game/  src/components/settings/
src/engine/core/ (Engine, GameLoop, GameState, InputController, ViewTransform, UndoStack)
src/engine/optics/ (transform, intersect, reflect, prism, tracer)
src/engine/render/ (SceneRenderer, glowSprites, layers/)   src/engine/particles/   src/engine/audio/
src/game/ (scoring, hints, completion, targets, switches, levelValidator)
src/levels/ (level-01 … level-05, index)   src/hooks/   src/stores/   src/config/
src/lib/ (math/, store/, settings/, storage/)   src/types/   src/styles/tokens.css
tests/unit/{optics,game,levels,lib}   docs/ (PRD.md, SETTINGS.md, level-authoring.md, demo-script.md)
```

---

## 7. Build steps

Each step lists **Goal · Do · Done when**. "PRD" references point to sections/IDs in the PRD. Every step also requires the standard gate (rule 2.4).

### STEP 1 — Scaffold and tooling
- **Goal:** empty but professional project that builds, lints, tests and deploys.
- **Do:** Next.js App Router + TypeScript strict + Tailwind; ESLint, Prettier, Vitest (+ coverage); path alias `@/`; scripts `dev build start lint typecheck test test:coverage`; create the folder layout (section 6) with a one-line `README` comment per folder; `styles/tokens.css` with the palette as CSS variables and Tailwind mapped to them; `next/font` (Space Grotesk, Inter, JetBrains Mono, Latin subset); `.github/workflows/ci.yml` (lint, typecheck, test, build); `next.config.mjs` with security headers (CSP in **report-only** mode first); `.env.example`.
- **Done when:** gate passes; `/` shows a styled placeholder; CI file is valid; `PROGRESS.md` created.

### STEP 2 — Math foundation
- **Goal:** tested vector/matrix/constants layer (PRD §12.1, §20.3).
- **Do:** `lib/math/vec2` (add, sub, scale, dot, cross, length, normalize, rotate), `mat3` (translate, rotate, scale, multiply, apply, invert), `constants.ts` (table 3.4), `easing.ts`; shared `types/`.
- **Done when:** unit tests cover rotation-about-pivot, matrix inverse, normalization of zero vector (no NaN); coverage ≥ 90% for `lib/math`.

### STEP 3 — Config, stores and settings core
- **Goal:** the settings/persistence backbone (section 5), PRD FR-053–057.
- **Do:** `gameConfig.ts`, `features.ts`, `settingsSchema.ts`, `createStore`, `createPersistentStore`, `resolveSettings`, `settingsStore`, `progressStore` (records per PRD §19, derived unlock), hooks `useSettings`, `useProgress`; `docs/SETTINGS.md`.
- **Done when:** unit tests prove: defaults valid; out-of-range values clamped; corrupt JSON → defaults; blocked storage → in-memory works (TC-E10); migration from a fake v0 object; worse replay never overwrites bests; unlock derivation (TC-F09 logic).

### STEP 4 — UI primitives
- **Goal:** the reusable UI kit (section 4.1).
- **Do:** all primitives + `cn()`; `/dev/ui` showcase (flag-guarded); keyboard and focus behavior; reduced-motion handling.
- **Done when:** every primitive visible on `/dev/ui` in all variants/states; tab order and focus ring verified; no primitive over budget; contrast of text/background pairs checked against 4.5:1.

### STEP 5 — Screens and navigation (no game yet)
- **Goal:** all non-gameplay screens (PRD §14.2, FR-001–010).
- **Do:** Main Menu (Play/Continue label from progress), Level Selection (5 cards, stars, best time, lock shake + toast), How to Play, **Settings (rendered by `SettingsForm` only)**, About/Credits, 250 ms route fade, redirect from locked/invalid level URL, error boundary in `layout`.
- **Done when:** whole menu flow works by mouse and keyboard; settings persist across reload; locked levels cannot be opened by URL (unless demo-unlock); `reset progress` asks for confirmation.

### STEP 6 — Canvas foundation
- **Goal:** reliable canvas, loop and layers (PRD §12.1, §12.8, FR-061, M1).
- **Do:** `ViewTransform` (uniform scale, letterbox, DPR capped at 2, `toWorld/toScreen`), `GameLoop` (rAF, clamped dt, visibility pause), `GameCanvas` component (mount/unmount safe in React Strict Mode, cleans listeners), `Layer` interface, `BackgroundLayer` (cached offscreen), placeholder drawing of a Level-1-like scene, FPS/frame-time readout (dev).
- **Done when:** resizes and zooms correctly; pointer→world mapping unit-tested (TC-G12 logic); no listener/frame leaks after 20 mount/unmount cycles; idle 60 FPS.

### STEP 7 — Optics core (the academic heart)
- **Goal:** pure, fully tested light engine for mirrors and boundary (PRD §12.2–12.4, §14.1 of workflow §20).
- **Do:** `optics/transform` (world endpoints, prism vertices), `intersect` (ray–segment, ray–circle, ray–polygon, point-in-polygon), `reflect`, `tracer` (work queue, nearest hit, `skipId`, offset, limits, repeat-state detection, deterministic tie priority, preallocated buffers, `OpticsResult` with events and stats). Add one-paragraph math comment at the top of each file.
- **Done when:** tests pass for TC-F03 (20 angle pairs), TC-G01–G04, TC-E01–E03, TC-E05, TC-X01–X04, TC-X07, TC-X08; solve ≤ 2 ms typical on a 4-mirror scene (measure and report); coverage ≥ 90% for `engine/optics`.

### STEP 8 — Level 1 playable (milestone M2: "light bends")
- **Goal:** first vertical slice (FR-018–020, FR-024, FR-028, FR-031, FR-040).
- **Do:** level types + `level-01` data (PRD §13) + `GameState`, `UndoStack`, `InputController` (Pointer Events → command queue: select, rotateTo, rotateStep, undo, reset), mirror rotation with snapping, dirty-flag solve, `ComponentsLayer` + basic `BeamLayer` (three-pass glow, additive), simple target charging and completion.
- **Done when:** Level 1 can be solved by mouse and keyboard; beam turns 2× mirror rotation; undo/reset restore state exactly (TC-F15 logic); no solve on idle frames (counter).

### STEP 9 — Remaining mechanics
- **Goal:** obstacles, targets by color, switch + gate, prism, multi-source, movable obstacle (FR-022, 023, 033–039; PRD §12.9).
- **Do:** obstacle polygons, closed-gate geometry with animated open fraction, `game/targets` + `game/switches` (charge/decay, color rules), `optics/prism` (rule model, honest comments), multiple sources, rotatable lamp, movable obstacle dragging with grid snap and range clamp, locked-component feedback.
- **Done when:** tests TC-F04–F07, TC-F14, TC-G05–G07, TC-E04, TC-E06, TC-X05–X06; each mechanic has a small test scene in `tests`.

### STEP 10 — Game rules, five levels, progression
- **Goal:** complete game logic and content (FR-009–017, 042–048, 052–053; PRD §10.8, §13).
- **Do:** `scoring` (formula + stars), `hints` (3 tiers from `solution` data), `completion`, `levelValidator`, levels 1–5 data exactly per PRD §13, solution-replay test, HUD (DOM, composed from primitives), pause menu, completion modal, tutorial toasts (show once), HUD snapshot to React at ≤ 10 Hz via `useSyncExternalStore`, progression and best-score saving.
- **Done when:** TC-F08–F13, F15–F16, TC-E08 pass; **solution replay 5/5**; no level starts solved; any unsolvable coordinate is fixed minimally and logged in Decisions.

### STEP 11 — Visual polish: environment, particles, effects
- **Goal:** the atmospheric look (PRD §12.5–12.7, FR-058–063).
- **Do:** water layers, twinkling stars, decorative lighthouse sweep (alpha ≤ 0.12), mist, `ParticlePool` (generic `Pool<T>`) with ambient motes, sparks, ripples, activation burst + shock ring, gate dust; glow sprites; Level 4 darkness mask; quality presets and reduced motion wired to **effective settings**; all animation time-based.
- **Done when:** particle caps respected under stress (TC-G11); animation speed unchanged under CPU throttle (TC-G10); quality switch applies live; reduced motion visibly calms the scene.

### STEP 12 — Audio
- **Goal:** synthesized SFX and ambience (FR-050–051).
- **Do:** `AudioManager` (Web Audio, unlock on first gesture, voice limit 8, master/SFX/ambient gains, mute) with cues: rotate tick, charge hum, activation chime, gate, UI click, level complete, ocean ambience; wire to settings.
- **Done when:** game fully playable muted; mute is instant; no overlapping spam; no audio files required.

### STEP 13 — Optics Inspector and presentation toggles
- **Goal:** the demo and teaching tools (FR-041, FR-064).
- **Do:** `InspectorLayer` + `InspectorPanel`: normals, hit points, bounce numbers, incidence/reflection arcs, panel with `d, n, d·n, r`, segment/particle counts, frame-time graph; keys D, G, P, N, U; all toggles live.
- **Done when:** printed values equal solver values (TC-G13); each row of PRD §12.10 can be demonstrated in ≤ 30 s.

### STEP 14 — Accessibility, performance, hardening
- **Goal:** meet NFRs (PRD §11) and acceptance criteria.
- **Do:** keyboard-only playthrough support (Tab cycles components, arrows rotate), `aria-live` announcements, shape cues on colored targets (▲ red, ● green, ■ blue), orientation notice on small portrait screens; profile with the Inspector; fix hotspots; verify bundle budget; add error boundary recovery; run the full test tables of PRD §22.
- **Done when:** AC-01…AC-24 of PRD §29 checked honestly in `PROGRESS.md` (mark anything not verifiable as *not verified*, with reason); coverage ≥ 90% on geometry, optics, scoring, validator.

### STEP 15 — Documentation, deployment, demo readiness
- **Do:** `README.md` (setup, scripts, architecture summary), `docs/level-authoring.md`, final `docs/SETTINGS.md`, `docs/demo-script.md` following PRD §27.2, static-export fallback verified, Vercel instructions, tighten CSP from report-only to enforced if nothing breaks, tag `v1.0-submission` instructions.
- **Done when:** a fresh clone can run everything from the README; static export runs offline; demo script lists exact keys and clicks.

---

## 8. Report format (after every step — keep it short)

```
STEP N — <name> — STATUS: PASS | PARTIAL | BLOCKED
Changed: <key files / folders>
Gate: lint ✔/✘ · typecheck ✔/✘ · tests X passed (Y new) · build ✔/✘
PRD coverage: <FR / TC / AC IDs satisfied>
Measured: <only numbers you actually measured>
Decisions / assumptions: <bullets, also copied to PROGRESS.md>
Risks / follow-ups: <bullets>
Next: STEP N+1 — waiting for "next"
```

## 9. `PROGRESS.md` template (create in Step 0/1, update every step)

```
# Progress
## Current step
## Step log (date · step · status · commit)
## Decisions and assumptions
## PRD deviations (with justification)
## Known issues (severity 1/2/3)
## Measurements (hardware, browser, date, value)
## Acceptance checklist (AC-01 … AC-28: ☐ / ✔ verified / ✘ not verified)
```

---

## 10. Self-check before ending any step

- [ ] Gate command passes; new code has tests where logic exists.
- [ ] No file or component over budget; no duplicated number that belongs in config.
- [ ] `optics`/`math` still free of React/DOM imports; components use hooks, not the engine directly.
- [ ] Settings changes go through the schema; nothing reads LocalStorage outside `createPersistentStore`.
- [ ] New UI built from primitives; accessible by keyboard; contrast respected.
- [ ] Only allowed dependencies added.
- [ ] `PROGRESS.md` and the report are truthful.

## 11. If something goes wrong

- **Failing gate you cannot fix in reasonable time:** revert to the last green commit on the step branch, report `PARTIAL` with the exact error, propose two options.
- **PRD ambiguity:** choose the PRD default, log it, continue.
- **Performance miss:** do not guess — measure with the Inspector/DevTools, fix the measured hotspot, re-measure.
- **Scope pressure:** apply the PRD §23.3 cut list in order; never cut reflection correctness, tests, the Inspector, five levels, persistence.
