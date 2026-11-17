# Settings, persistence and progress

LightPath keeps **static tunables**, **feature flags** and **user settings** separate so that
changing a user setting is a one-file change and nothing outside the persistence layer reads
LocalStorage.

## The three kinds of configuration

| Kind | File | Changed by | Examples |
| --- | --- | --- | --- |
| Static tunables | `src/config/gameConfig.ts` | Developers | world size, optics limits, scoring, quality presets |
| Feature flags | `src/config/features.ts` | Developers via `NEXT_PUBLIC_*` env vars | `devUiPage`, `inspectorEnabled`, `demoUnlockAvailable`, `fpsOverlay` |
| User settings | `src/config/settingsSchema.ts` | Player | volumes, quality, rotation step, reduced motion |

Numeric/tolerance literals remain defined exactly once in `src/lib/math/constants.ts`;
`gameConfig.ts` imports them so there is no duplicated magic number.

## Adding a new setting

1. Add a `SettingDefinition` member to the union in `src/config/settingsSchema.ts`.
2. Add one entry to `SETTINGS_SCHEMA` with `key`, `type`, `group`, `label`, `description`,
   `default`, plus `min/max/step` for sliders or `options` for selects.
3. Add a default-value assertion to `tests/unit/lib/settings.test.ts` (defaults must satisfy the
   schema and out-of-range values must clamp/repair).

That is all. `GameSettings` is derived from the union with a mapped type, `DEFAULT_SETTINGS` is
built from the schema, and `parseSettings` validates every field from the same definitions.
`SettingsForm` (STEP 4) renders any schema entry without per-setting code.

The setting is only *finished* once a consumer reads it from **effective settings**:
`src/lib/settings/resolveSettings.ts` expands `quality: "auto"` into a measured preset, resolves
`reducedMotion: "system"` against `prefers-reduced-motion`, and attaches the preset's renderer
caps. React passes the resulting `EffectiveSettings` to the engine; the engine never reads
LocalStorage or imports a store.

## Storage and migrations

`createPersistentStore` (`src/lib/store/createPersistentStore.ts`) owns every LocalStorage access:

- **Keys:** `lightpath.v1.settings` and `lightpath.v1.progress`.
- **Validation:** each read is passed through `parseSettings` / `parseProgress`, which repair or
  discard bad fields. Out-of-range numbers are clamped, invalid enums and booleans fall back to
  defaults, and unparseable level records are dropped.
- **Corrupt JSON / future version:** `JSON.parse` is wrapped in `try/catch`; a future
  `schemaVersion` also falls back to defaults rather than crashing.
- **Blocked storage (TC-E10):** if LocalStorage is unavailable, throws on read, or throws on
  write, the store switches permanently to **in-memory mode** (`isPersistent()` returns `false`)
  and keeps working for the current session.
- **Writes:** debounced by `gameConfig.storage.writeDebounceMs`; `flush()` forces a synchronous
  write. `reset()` clears the key and restores defaults.
- **Cross-tab sync:** a `storage` event from another tab is decoded and applied without echoing
  the value back.

Version 0 is the pre-release format. `migrateSettingsV0` assumes v0 used `volume` (0–100), `step`,
`muted`, `reducedMotion` and similar keys; `migrateProgressV0` assumes v0 kept `bestScore`,
`bestTimeSec` and `bestMoves` directly on each level. A v0 object is mapped into the v1 shape and
then passed through the same validator, so a partially broken legacy save still yields a fully
valid v1 object.

## Progress and derived unlock

`src/stores/progressStore.ts` stores one `LevelRecord` per level id plus `tutorialsSeen` flags.
Unlock state is **not stored**: `isLevelUnlocked(progress, index, demoUnlockAll)` opens level 1
always, level *n+1* when level *n* is completed, and everything when `demoUnlockAll` is on. The
demo flag itself is only visible in the settings UI when `features.demoUnlockAvailable` is true.

Only strictly better results replace a stored best (`recordCompletion`). `bestTimeSec` and
`bestMoves` are tracked independently because the highest-scoring attempt is not necessarily the
fastest or the tidiest. `recordAttempt` increments the attempt counter; `markTutorialSeen` records
one-time tutorial toasts.

## Current setting inventory

| Group | Keys | Consumer |
| --- | --- | --- |
| Audio | `masterVolume`, `sfxVolume`, `ambientVolume`, `muted` | `AudioBridge` mirrors effective values into `AudioManager`. |
| Graphics | `quality`, `showFps` | `resolveSettings` expands quality; `GameCanvas` shows the FPS badge. |
| Gameplay | `rotationStepDeg` | `useGameRuntime` sends the step to `InputController`. |
| Accessibility | `reducedMotion`, `colorblindAid` | Renderer visual settings; colour target shape cues are drawn only when the aid is enabled. |
| Developer / Demo | `demoUnlockAll` | `useProgress` derives unlock state; key **U** is wired only when the feature flag allows it. |

`quality: "auto"` uses `hardwareConcurrency` and `deviceMemory` from `detectEnvironment()` to pick
low/medium/high before expanding to renderer caps: low 80/15/1/2, medium 200/40/2/3, high
400/80/3/4 for particle cap / mote cap / glow passes / water layers. `reducedMotion: "system"` reads
`prefers-reduced-motion`; SSR uses a safe default until hydration.

The renderer never reads a store. `GameCanvas` passes effective values through `useGameRuntime`,
which mutates one shared `VisualSettings` object. `setSettings()` applies quality, reduced motion,
glow, particles and `colorblindAid` live without remounting the canvas.

## Data actions

`SettingsDataActions` offers **Reset settings** and **Reset progress**, each behind a confirmation
modal. Optional JSON export/import was not implemented; progress can be reset from the UI, and no
save data is sent anywhere. Both stores revalidate defaults after reset.

## Feature flags

Flags are developer/build-time values in `src/config/features.ts`, not persisted user settings.
Copy `.env.example` to `.env.local` and set any of the following before `npm run dev` or
`npm run build`:

| Variable | Default | Effect |
| --- | --- | --- |
| `NEXT_PUBLIC_DEV_UI_PAGE` | `false` | Enables the `/dev/ui` showcase in development. |
| `NEXT_PUBLIC_INSPECTOR_ENABLED` | `true` | Allows the Optics Inspector. |
| `NEXT_PUBLIC_DEMO_UNLOCK_AVAILABLE` | `false` | Shows the demo-unlock toggle and enables the **U** key. |
| `NEXT_PUBLIC_FPS_OVERLAY` | `false` | Forces the FPS badge even when the user setting is off. |

Static export uses the same flags baked in at build time. No environment variable is required for
the MVP; the demo-unlock flag is only needed for rapid presentation access to every level.

## Definition of done for a new setting

A setting is finished only when the schema entry, default, validation/clamping, automatic Settings
row, effective-settings consumer and a unit test all exist. See `tests/unit/lib/settings.test.ts`
and `tests/unit/render/targetShapes.test.ts` for the current examples.
