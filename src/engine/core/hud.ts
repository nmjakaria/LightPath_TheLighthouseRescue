/*
 * Pure HUD snapshot builder. GameState supplies engine values; this module derives display flags
 * (tutorial relevance, hint prompt) so GameState stays small and React only sees immutable data.
 */
import { gameConfig } from "@/config/gameConfig";
import type { CompletionSummary } from "@/game/completion";
import type { HintDisplay } from "@/game/hints";
import { gateBlocks } from "@/game/gates";
import type { InputCommand, InteractionFeedback } from "@/types/input";
import type { GateRuntime, LevelConfig, LevelTutorial, SwitchRuntime, TargetRuntime } from "@/types/level";

export interface HudSnapshot {
  levelId: string;
  moves: number;
  timeSec: number;
  selectedId: string | null;
  hoveredId: string | null;
  status: "playing" | "complete";
  paused: boolean;
  started: boolean;
  litTargets: number;
  requiredTargets: number;
  litSwitches: number;
  openGates: number;
  feedback: InteractionFeedback | null;
  canUndo: boolean;
  hintsUsed: number;
  hintsRemaining: number;
  hint: HintDisplay | null;
  tutorials: readonly LevelTutorial[];
  needHint: boolean;
  celebrationReady: boolean;
  completion: CompletionSummary | null;
}

export interface HudContext {
  level: LevelConfig;
  moves: number;
  elapsedSec: number;
  selectedId: string | null;
  hoveredId: string | null;
  status: "playing" | "complete";
  paused: boolean;
  started: boolean;
  targets: readonly TargetRuntime[];
  switches: readonly SwitchRuntime[];
  gates: readonly GateRuntime[];
  canUndo: boolean;
  feedback: InteractionFeedback | null;
  hintsUsed: number;
  hintsRemaining: number;
  hint: HintDisplay | null;
  completion: CompletionSummary | null;
  celebrationReady: boolean;
  progressAtSec: number;
  progressLit: number;
  prismHit: boolean;
}

function activeTutorials(context: HudContext): readonly LevelTutorial[] {
  return context.level.tutorials.filter((tutorial) => {
    switch (tutorial.trigger) {
      case "start": return true;
      case "firstRotate": return context.moves > 0;
      case "firstPrismHit": return context.prismHit;
      case "gateSeen": return context.gates.length > 0;
    }
  });
}

function needsHint(context: HudContext, litTargets: number): boolean {
  return (
    context.started && !context.paused && context.status === "playing" &&
    context.elapsedSec - context.progressAtSec >= gameConfig.completion.hintPromptSec &&
    litTargets <= context.progressLit
  );
}

export function buildHudSnapshot(context: HudContext): HudSnapshot {
  const litTargets = context.targets.filter((target) => target.active).length;
  return {
    levelId: context.level.id,
    moves: context.moves,
    timeSec: context.elapsedSec,
    selectedId: context.selectedId,
    hoveredId: context.hoveredId,
    status: context.status,
    paused: context.paused,
    started: context.started,
    litTargets,
    requiredTargets: context.targets.filter((target) => target.required).length,
    litSwitches: context.switches.filter((input) => input.active).length,
    openGates: context.gates.filter((gate) => !gateBlocks(gate.openFraction)).length,
    feedback: context.feedback,
    canUndo: context.canUndo,
    hintsUsed: context.hintsUsed,
    hintsRemaining: context.hintsRemaining,
    hint: context.hint ? { ...context.hint } : null,
    tutorials: activeTutorials(context),
    needHint: needsHint(context, litTargets),
    celebrationReady: context.celebrationReady,
    completion: context.completion,
  };
}

/** Only hover is accepted after completion; pause and hint are engine commands, not logic input. */
export function isPlayCommand(command: InputCommand): boolean {
  return command.type !== "hover" && command.type !== "pause" && command.type !== "pauseToggle";
}
