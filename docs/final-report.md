# LightPath — Final Academic Report

**Submission:** v1.0 candidate · **Date:** 2026-11-18 · **Status:** implementation and documentation complete; browser/Vercel/playtest evidence not performed.

## Abstract

LightPath is a browser-based 2D optical puzzle built to make Computer Graphics mathematics visible. The player rotates mirrors, moves a constrained obstacle, and uses targets, switches, gates and one fixed prism to guide light from sources to a lighthouse lamp. The system uses Next.js App Router and React for screens, native Canvas 2D for rendering, and a pure deterministic TypeScript optics core that has no React, DOM or renderer imports. Five data-driven levels were implemented, and their authored solutions are replayed by automated tests. The academic core—vector/matrix transforms, reflection, ray–segment and ray–circle intersection, nearest-hit tracing, bounded multi-bounce recursion, additive compositing, particles and a delta-time loop—is covered by unit tests and can be inspected live with the Optics Inspector. The final local gate passed on 2026-11-18: lint, typecheck, 326 tests in 58 files, and the production build. Coverage thresholds pass, the production dependency audit is clean, and the offline static export serves all routes from local files. The main limitation is evidentiary: no browser automation, reference-laptop profiling, Vercel deployment, five-person playtest or timed rehearsal was performed, so those success criteria are reported as not verified rather than assumed. The prism is also an explicitly simplified teaching model, not physical dispersion.

## 1. Introduction

Computer Graphics concepts are often learned as isolated formulae. LightPath places them in one small game where a change to a mirror immediately changes a ray, a target, a score and a rendered beam. This report follows the structure requested in PRD §28.1: problem, objectives, concepts, methodology, design, mathematics, implementation, testing, limitations, conclusion and references. Screenshots, task-board captures and profiler images were not captured in this repository; their absence is stated rather than replaced with invented evidence.

## 2. Problem statement

Students can memorise `r = d − 2(d·n)n` without seeing what a normal does, or implement a ray–segment test without connecting it to nearest-hit rendering. Educational optics tools tend to be physically heavy or visually plain, while casual puzzle games hide the mathematics. The team had strong web skills, no game-development background and a fixed deadline, so the solution had to stay inside familiar technology: Next.js, React, TypeScript, Canvas 2D, Web Audio and LocalStorage, with no game or state library. The resulting requirement was a small, polished, mathematically honest puzzle with five levels, testable rules and a repeatable live demonstration.

## 3. Objectives

| Category | Objectives | Status in this build |
| --- | --- | --- |
| Academic (AO-1–AO-3) | Implement and explain transforms, reflection, intersection, tracing, particles, compositing and a delta-time loop; provide live demos; report honestly. | Implemented; live demo script written; browser/rehearsal evidence not performed. |
| Educational (EO-1–EO-2) | Discover reflection by experiment; introduce additive colour and a labelled simplified prism. | Implemented in levels and How-to-Play copy. |
| Gameplay (GO-1–GO-3) | Five gentle levels, no failure state, rewarding feedback. | Implemented; live feel not playtested with outside users. |
| Technical (TO-1–TO-3) | Deterministic tested optics, smooth rendering, data-driven levels. | Determinism and data-driven levels verified; smoothness not measured in a browser. |

## 4. Literature and conceptual background

The conceptual basis is the standard graphics toolkit named in the PRD: vectors and matrices for affine transforms; parametric ray–primitive intersection; reflection about a surface normal; nearest-hit traversal with tolerances; compositing for glow; particle pools for sparks and motes; and requestAnimationFrame loops with clamped delta time. Related puzzle games were not formally surveyed in the available build log, so no commercial title is claimed as evidence. Textbooks, API documentation and lecture-note citations must be added by the team from copies it actually consulted; none have been invented here.

## 5. Methodology

Work followed the 15 gated steps in `AGENTS.md`: scaffold/tooling, math, settings and stores, UI primitives, screens, Canvas foundation, optics, Level 1, remaining mechanics, rules and five levels, visual polish, audio, Inspector, hardening, then documentation/deployment. Each step used a short-lived branch and Conventional Commit messages. The mandatory gate was `npm run lint`, `npm run typecheck`, `npm run test` and `npm run build`; PowerShell 5.1 required sequential commands. The PRD remained untouched. Requirements were traced through `PROGRESS.md`, and every browser-only or external item was left explicitly unverified.

## 6. System design

```text
Routes / React shell  ── hooks ──> Game engine ──> pure optics result
      │                       │                       │
      │                       ├─ GameState / input / undo / scoring
      │                       └─ render layers / particles / audio events
      └─ schema-driven settings and persisted progress (no engine LocalStorage)
```

- `src/engine/optics` and `src/lib/math` are pure: no React, DOM, renderer or app imports.
- `src/levels` contains data only; `src/game` validates levels, scores, hints, completion and switch/target rules.
- `GameSnapshot` is published to React at ≤10 Hz through a tiny external store; per-frame work stays outside React.
- `LevelConfig` holds sources, mirrors, prisms, obstacles, movable obstacles, switches, gates, targets, tutorials, hints and solution steps. `OpticsResult` holds segments, events and statistics. `LevelRecord` stores bests and tutorials seen; unlock state is derived, never stored.
- Screens are composed from reusable UI primitives; `SettingsForm` renders the schema with no per-setting code.

## 7. Mathematical foundations

World space is 1280 × 720 wu, x right and y down. Data angles are degrees, internal angles radians; 0° points east and positive rotation is clockwise. A heading φ maps to `(cos φ, sin φ)`. A mirror at θ has normal `n = (−sin θ, cos θ)` and reflects by `r = d − 2(d·n)n`, giving the oracle `φ' = 2θ − φ (mod 360°)`. A ray–segment solve uses `p = a + t r` with the segment `q + u s`; `t = cross(q−a, s) / cross(r, s)` and `u = cross(q−a, r) / cross(r, s)`, valid for `t ≥ T_MIN` and `0 ≤ u ≤ 1`. Rotation about a pivot `c` is `T(c) R(θ) T(−c)`. Uniform view scaling fits the 1280 × 720 world into the viewport with letterboxing and DPR capped at 2; `ViewTransform.invert` maps pointer positions back to world space.

**Worked reflection example.** For φ = 0° and θ = 45°, `d = (1, 0)` and `n = (−0.7071, 0.7071)`. Then `d·n = −0.7071` and `r = (1, 0) − 2(−0.7071)n = (0, 1)`, so `φ' = 90°`, matching `2·45° − 0°`. A 15° mirror rotation therefore turns the beam 30°.

The prism uses the PRD's simplified rule: a ray with at least two channels ≥0.2 exits as R/G/B at `φ−Δ, φ, φ+Δ` (Δ = 12° by default); single-channel rays pass through. It does not model Snell's law, dispersion by wavelength or Fresnel effects.

## 8. Implementation

**Optics queue.** Initialise one ray per source; while the queue is non-empty and limits allow, find the nearest valid primitive hit; emit a segment; skip the hit id; offset the next origin by `OFFSET`; reflect on mirrors, split at prisms, stop at targets/obstacles/boundary; record events and termination reasons. Repeat-state detection, `T_MIN`, `EPS_U`, `MIRROR_REFLECTANCE`, `PRISM_TRANSMITTANCE`, `MAX_BOUNCES` and `MAX_SEGMENTS` prevent loops and numerical leaks. All distances, radii, tolerances and durations come from config/constants.

**Game loop.** Commands queue from pointer/keyboard handlers and are drained once per frame. Geometry changes flip a dirty flag so idle frames do not re-solve. `dt` is clamped to 0.05 s; tab suspension resets the clock so animation speed is time-based rather than frame-count-based.

**Rendering.** Ordered layers draw background, environment, components, beams, particles, darkness and Inspector overlays. Beam glow uses multiple additive passes; sprites and the static background are cached; quality presets control particle/mote caps, glow passes and water layers. Reduced motion and all D/G/P/N toggles mutate shared visual settings so changes apply on the next frame without remounting the canvas.

**Audio.** A synthesized `AudioManager` unlocks on the first gesture, routes master/SFX/ambient gains, enforces an eight-voice cap, and degrades silently when Web Audio is unavailable. No audio files are bundled.

## 9. Testing and results

Environment: HP EliteBook 840 G6, Windows NT 10.0.26300.0, Node v22.22.3, npm 11.15.0, 2026-11-18. No browser or browser version was used for the checks below.

| Check | Actual result |
| --- | --- |
| Required gate | lint clean; typecheck clean; 326 tests passed in 58 files; `next build` succeeded. |
| Coverage | `npm run test:coverage` passed: all files 95.82% statements, 93.59% branches, 97.97% functions, 95.82% lines; per-glob thresholds (math, optics, geometry, scoring, validator) ≥90% enforced. |
| Solution replay | 5/5 levels validate with zero errors, do not start solved, and complete after authored commands are replayed. |
| Reflection oracle | 20 angle pairs pass at 1e-6 tolerance; four-bounce chain covered. |
| Solver performance | Last explicitly measured in Step 14 on this machine: 500 four-mirror solves averaged 0.0776 ms (p95 0.1377 ms, max 1.3160 ms). Not re-measured after renderer-only Step 15 changes. |
| Bundle upper bound | 16 static JS chunks: 744,518 raw bytes, 231,522 gzip bytes (226.1 KiB). This is all-chunks, not a measured `/play` first-load network size. |
| Dependencies | `npm audit --omit=dev`: 0 vulnerabilities. Full audit: 22 development-only advisories (5 moderate, 15 high, 2 critical). No `dangerouslySetInnerHTML` in `src`. |
| Static export | `npm run build:static` prerendered all five play routes. HTTP smoke returned 200 for `/`, `/levels/`, `/how-to-play/`, `/settings/`, `/about/`, `/play/level-01/`, `/play/level-05/` and `/play/level-01`. |
| Browser-only checks | Not performed: FPS/frame time, 30-minute heap, visual effects, audible cues, keyboard/mouse play, cross-browser smoke and Vercel console. |

The 300 KB gzip budget is met by the conservative all-chunks upper bound. Reference-laptop frame targets, 1 s level loads and memory growth remain unverified.

## 10. Limitations

- The prism is a fixed simplified splitter, not wavelength-based refraction.
- No backend, accounts or cross-device save; progress is LocalStorage only.
- Only five levels and one prism type are included by design.
- No browser automation was available, so AC-01/AC-02/AC-03/AC-05/AC-15–AC-18/AC-20/AC-21/AC-28 remain unverified or only logic-tested.
- Vercel deployment, backup video, three timed rehearsals and five-person playtest were not performed; the demo script contains blank real-result fields.
- CSP remains report-only because an enforced policy was not proven safe against Next inline scripts in a browser.
- Full `npm audit` has dev-only high/critical advisories; fixing them needs a toolchain upgrade that was out of scope.
- Prettier is not gate-clean on a few deliberately compact source files; lint/typecheck/test/build are clean.

## 11. Future improvements

First add the real browser/Vercel evidence and three rehearsals, then complete AC-01 to AC-14 before polish. Recommended next features from PRD §30.1: automatic quality detection, touch/tablet layout, sound variety, refined reduced motion and polished presentation toggles. Later work may add coloured filters, a rotatable prism with face-dependent deviation, a light-activated platform, finale cinematics, previews and hint polish. Explicitly out of scope: online leaderboards, accounts, advanced optics such as Snell refraction or polarisation, and additional chapters.

## 12. Conclusion against success criteria

| ID | Criterion | Status |
| --- | --- | --- |
| SC-01 | All five levels solvable | PASS — automated replay 5/5 |
| SC-02 | Reflection correctness | PASS — 20 pairs at 1e-6 |
| SC-03 | Reference-laptop frame time | NOT VERIFIED — no browser profiling |
| SC-04 | Five outside testers | NOT PERFORMED — documented, no numbers claimed |
| SC-05 | 30-minute stability | NOT VERIFIED |
| SC-06 | Every concept demo ≤30 s | PARTIAL — Inspector and cue sheet ready; no timed rehearsal |
| SC-07 | Vercel + offline static export | PARTIAL — static export verified locally; Vercel not deployed |

The implemented system satisfies the deterministic academic core and local build evidence. The remaining risk is presentation evidence, not missing core functionality.

## 13. References

Sources actually used for this report: `docs/LightPath_PRD.md` (requirements, equations, acceptance criteria and report structure), `AGENTS.md` (build process), and this repository's source, tests and measured command output. No textbook, web article or commercial-game reference was added without a verified citation from the team.

## 14. Integrity and AI disclosure

All numeric results above were obtained from commands run on 2026-11-18 and recorded in `PROGRESS.md`. No FPS, playtest, audio, deployment or rehearsal result is claimed. The beam turning and prism model are described as implemented rules, not physical truth. Development used an AI coding assistant for code, tests and documentation; disclose this according to the course policy. Fonts are loaded via `next/font` under the SIL Open Font License; icons, glow sprites and audio are generated in-repo with no third-party image or sound assets.

## Appendix: acceptance criteria status

| ID | Status | ID | Status | ID | Status | ID | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AC-01 | ✘ | AC-08 | ✔ | AC-15 | ✘ | AC-22 | ✘ |
| AC-02 | ✘ | AC-09 | ✔ | AC-16 | ✘ | AC-23 | ✘ |
| AC-03 | ✘ | AC-10 | ✔ | AC-17 | ✘ | AC-24 | ✔ |
| AC-04 | ✔ | AC-11 | ✔ | AC-18 | ✘ | AC-25 | ✔ |
| AC-05 | ✘ | AC-12 | ✔ | AC-19 | ✔ | AC-26 | ✘ |
| AC-06 | ✔ | AC-13 | ✔ | AC-20 | ✘ | AC-27 | ✘ |
| AC-07 | ✔ | AC-14 | ✔ | AC-21 | ✘ | AC-28 | ✘ |

✔ = verified locally by test or measurement; ✘ = not verified, not performed, or full criterion not met. Reasons are detailed in `PROGRESS.md` and sections 9–10 above.
