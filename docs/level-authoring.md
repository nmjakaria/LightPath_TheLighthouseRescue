# Level authoring

Levels are **data only**. Put each level in `src/levels/level-0N.ts`, export a `LevelConfig`, and add
it to the ordered `LEVELS` array in `src/levels/index.ts`. Never import React, the DOM, an engine
class or a renderer from a level file. Do not edit the PRD; if a reference coordinate is not
solvable, make the smallest code/data fix and record it under *Decisions* in `PROGRESS.md`.

## Coordinate and angle rules

- World space: 1280 × 720 wu, origin top-left, x right, y down.
- Heading φ → `(cos φ, sin φ)`; 0° is east and positive angles rotate clockwise on screen.
- Mirror angle θ is periodic every 180°; its normal is `n = (−sin θ, cos θ)` and reflection is
  `r = d − 2(d·n)n`. The solver oracle is `φ' = 2θ − φ (mod 360°)`.
- RGB channels are 0..1. A mixed ray has at least two channels ≥ 0.2; a prism splits it into
  R/G/B children at `−Δ, 0, +Δ`. This is a simplified educational model, not Snell's law.
- Use constants and config (`src/lib/math/constants.ts`, `src/config/gameConfig.ts`) instead of
  repeating lengths, radii, tolerances or durations.

## Required fields

`LevelConfig` (see `src/types/level.ts`) requires:

- `id`, sequential `index`, `name`, `story`, `difficulty`, `par: { timeSec, moves }`.
- Arrays for `sources`, `mirrors`, `prisms`, `obstacles`, `movableObstacles`, `switches`, `gates`,
  `targets`, `tutorials`, `hints`, `solution`. Empty arrays are valid.
- Optional `rotationStepDeg`, `darkness`, `celebrationSec`.

Every component needs a unique string `id`. A source has `position`, `headingDeg`, `color`,
`intensity`, `rotatable` and an optional `housingRadius`. A mirror has `center`, `angleDeg`,
`length`, `rotatable`. A target has `center`, `radius`, `requires` (`any|red|green|blue`) and
`required`. Switches reference an existing `gateId`; movable obstacles define `localVertices`,
`start`, `axis`, `range [min,max]` and `snap`.

## Solution and hints

`solution` is the single source of truth for automated replay and hint tiers. Each step is either
`{ componentId, angleDeg }` for a rotatable mirror/lamp or `{ componentId, position }` for a movable
obstacle. The replay uses real `InputCommand`s, so solutions must respect snapping and drag-commit
rules. Mirror angles compare modulo 180°, lamps modulo 360°. Provide three escalating `hints`
entries; a fourth press is ignored.

Tutorial entries use triggers `start`, `firstRotate`, `firstPrismHit` or `gateSeen`, and are shown
once per progress record.

## Validation

`validateLevel()` returns blocking `errors` and non-blocking `warnings`. It checks header fields,
component arrays, RGB bounds, rail ordering, switch/gate links, unique ids, at least one required
target, and solution references. Malformed arrays are reported, not thrown. Spacing warnings flag
overlaps or a mirror's full rotation sweep touching another solid; they are warnings because PRD
reference coordinates may need playtest nudges.

```ts
import { validateLevel } from "@/game/levelValidator";
const result = validateLevel(myLevel);
if (!result.valid) console.error(result.errors);
```

The play route validates before mounting `GameCanvas` and renders `LevelError` instead of crashing.

## Checklist

1. Add the level file and register it in `src/levels/index.ts`.
2. Run `npm run typecheck` — the level must satisfy `LevelConfig`.
3. Run `npm run lint` and `npm run test`. `tests/unit/levels/solutions.test.ts` iterates `LEVELS`
   and asserts for every level: zero validation errors, not solved initially, and solved after the
   authored solution is replayed.
4. Run `npm run test:coverage`; validator and geometry thresholds must stay ≥90%.
5. Play the level manually with mouse and keyboard before a release; record browser-only results in
   `PROGRESS.md` rather than assuming them from unit tests.
