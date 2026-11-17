# Five-minute demo script

This script follows PRD §27.2 exactly. Presenter names are placeholders: replace “Member 1–4” with
the actual speaker before submission. **No timed rehearsal has been performed in this repository**;
the log at the end must be filled with real timings during preparation.

## Preparation

- Browser at 100% zoom, full screen, notifications off, laptop on power, sound checked, projector
  resolution tested.
- Use a clean save state, then press **U** to unlock all levels. `U` and the Settings toggle exist
  only when `NEXT_PUBLIC_DEMO_UNLOCK_AVAILABLE=true`; set that in `.env.local` before `npm run build`
  or `npm run dev`.
- Rehearse **D** (Inspector), **G** (glow), **P** (particles) and **N** (normals) before starting.
- Keep this one-page formula cheat-sheet ready: reflection `r = d − 2(d·n)n` and `φ' = 2θ − φ`;
  ray–segment `p = a + t r`; rotation about pivot `T(c)R(θ)T(−c)`; additive blend
  `C = min(1, Cᵢ + αCₛ)`.
- Have the real Vitest output and solution-replay result open; do not quote numbers from memory.
- Plan A is Vercel/live, Plan B is `npm run build:static` + `npm run serve:static`, Plan C is a
  recorded full run. Test all three on the presentation machine.

## Key map for the presenter

| Key | Meaning |
| --- | --- |
| Tab / Shift+Tab | Cycle components on the focused canvas |
| ←/→ or Q/E | Rotate selected component (Shift = 5° fine step) |
| ↑/↓ | Nudge selected rock |
| Z / R / H | Undo / reset / hint |
| Esc or Space | Pause or resume |
| D / G / P / N | Inspector / glow / particles / normals |
| U | Toggle demo unlock (feature-flagged) |

## Presentation table

| Time | Presenter | Show and say | Concepts | Fallback sentence |
| --- | --- | --- | --- | --- |
| 0:00–0:30 | Member 1 | Main menu → one architecture slide. “Optics is a pure module; rendering only reads its results.” | Overview | “The diagram is also in the README.” |
| 0:30–1:15 | Member 3 | Level 1, press **D**, rotate a mirror, resize/zoom the window and click a handle again. | Translation, rotation, scaling, world↔screen inversion | “The `ViewTransform` unit tests cover the same round trip.” |
| 1:15–2:00 | Member 2 | Rotate one 15° step: beam moves 30°. Inspector panel shows `d`, `n`, `d·n`, `r`; slide a rock into the beam. | Reflection equation, ray–segment/circle, nearest hit | “Panel values come from solver events, not a second formula.” |
| 2:00–2:45 | Members 2 & 4 | Level 2 four-bounce path; facing mirrors terminate at 24 bounces; Level 3 RGB fan with headings. | Multi-bounce, numeric safety, simplified prism | “The limits are asserted in TC-X01–X08.” |
| 2:45–3:30 | Member 3 | Toggle **G** and **P** before/after; show CPU-throttled motion speed; Level 4 darkness mask. | dt-based animation, particles, additive/alpha blending, gradients | “Time equivalence is unit-tested at 30 vs 144 FPS.” |
| 3:30–4:15 | Member 4 | Level 4 switch and gate; show passing tests and the 5/5 solution replay. | State logic, collision with gate, testing | “The replay test uses the same commands a player can issue.” |
| 4:15–4:45 | Members 1 & 4 | Complete Level 5; lamp ignition, burst and finale. | Everything combined | “If live play slips, load the authored solution state.” |
| 4:45–5:00 | Member 1 | State the simplified prism limitation, roadmap and thanks. | Academic honesty | “Physical dispersion needs wavelength-dependent refraction; ours is a teaching rule.” |

## Concept cue sheet

Each PRD §12.10 row has a short live action. Keep each under 30 seconds:

- **Translation / collision hit testing:** drag Level 5 rock; hover each component type.
- **Rotation / reflection:** rotate a mirror with Inspector endpoints; one 15° step moves the beam 30°.
- **Scaling / coordinate systems:** resize or zoom the canvas, then click a small handle.
- **Ray–segment / ray–circle / nearest hit:** aim at a rock corner, graze a target edge, slide the rock into the beam.
- **Multi-bounce / numeric safety:** Level 2 solution path; facing mirrors terminate safely.
- **Prism / additive blending:** Level 3 fan; toggle G and overlap R+G+B.
- **Alpha / gradients / glow:** translucent mist and panels; inspect a target halo.
- **Animation / particles / game loop:** water and sweep, toggle P, show the Inspector frame graph.
- **Offscreen cache / state machine:** static background layer; pause and resume.

## Rehearsal log

Three timed rehearsals are required (target 4:30–5:00). Fill this table with real results.

| Rehearsal | Date | Duration | Problems found | Fixed |
| --- | --- | --- | --- | --- |
| 1 | — | — | — | — |
| 2 | — | — | — | — |
| 3 | — | — | — | — |
