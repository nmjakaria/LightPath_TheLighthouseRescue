/*
 * Owns the four live presentation toggles from FR-064. Commands are handled even while paused so a
 * demo can change the overlay without restarting a level; demo-unlock is a persisted user setting
 * and is handled by the React controls instead of this engine-owned state.
 */
import { inspectorConfig } from "@/config/inspectorConfig";
import type { InputCommand } from "@/types/input";
import type { PresentationState } from "@/types/inspector";

export class PresentationController {
  readonly state: PresentationState = { ...inspectorConfig.defaults };

  /** Returns true when the command was one of the four presentation toggles. */
  apply(command: InputCommand): boolean {
    switch (command.type) {
      case "toggleInspector":
        this.state.inspector = !this.state.inspector;
        return true;
      case "toggleGlow":
        this.state.glow = !this.state.glow;
        return true;
      case "toggleParticles":
        this.state.particles = !this.state.particles;
        return true;
      case "toggleNormals":
        this.state.normalsOnly = !this.state.normalsOnly;
        return true;
      default:
        return false;
    }
  }
}
