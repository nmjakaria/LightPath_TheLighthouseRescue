/* Event listeners enqueue commands; the game loop drains them once per frame. Keeping the queue
 * outside React means pointer spam cannot trigger state changes during a render or a resolve. */
import type { InputCommand } from "@/types/input";

export class InputController {
  private readonly queue: InputCommand[] = [];

  enqueue(command: InputCommand): void {
    this.queue.push(command);
  }

  drain(): InputCommand[] {
    return this.queue.splice(0, this.queue.length);
  }

  get pending(): number {
    return this.queue.length;
  }
}

/** Maps a keydown to one command; null means the key is not a game shortcut. */
export function commandForKey(key: string, shiftKey: boolean): InputCommand | null {
  switch (key) {
    case "ArrowRight":
    case "e":
    case "E":
      return { type: "rotateStep", direction: 1, fine: shiftKey };
    case "ArrowLeft":
    case "q":
    case "Q":
      return { type: "rotateStep", direction: -1, fine: shiftKey };
    case "z":
    case "Z":
      return { type: "undo" };
    case "r":
    case "R":
      return { type: "reset" };
    case "h":
    case "H":
      return { type: "hint" };
    case "d":
    case "D":
      return { type: "toggleInspector" };
    case "g":
    case "G":
      return { type: "toggleGlow" };
    case "p":
    case "P":
      return { type: "toggleParticles" };
    case "n":
    case "N":
      return { type: "toggleNormals" };
    case "Escape":
    case " ":
      return { type: "pauseToggle" };
    default:
      return null;
  }
}
