// Shared data shapes used by levels, optics, game rules and UI.
export type { Vec2 } from "./vec2";
export type { RGB } from "./color";
export type { PlayerProgress, ScoreRecord, LevelRecord, Stars } from "./progress";
export type { InputCommand, InteractionFeedback } from "./input";
export type {
  LevelConfig,
  LevelDifficulty,
  LevelGateConfig,
  LevelMirrorConfig,
  LevelObstacleConfig,
  LevelPrismConfig,
  LevelSolutionStep,
  LevelSourceConfig,
  LevelSwitchConfig,
  LevelTargetConfig,
  LevelTutorial,
  MovableObstacleRuntime,
  SourceRuntime,
  SwitchRuntime,
  TargetColor,
  TargetRuntime,
  TutorialTrigger,
} from "./level";
export type { GateRuntime } from "./level";
export type {
  CircleConfig,
  GateConfig,
  HitEvent,
  HitType,
  LightSourceConfig,
  MirrorConfig,
  ObstacleConfig,
  OpticsResult,
  PrismConfig,
  OpticsScene,
  OpticsStats,
  Ray,
  Segment,
} from "./optics";
