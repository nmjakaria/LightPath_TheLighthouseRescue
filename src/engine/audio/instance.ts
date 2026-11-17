/* One manager for the whole app so audio survives route changes between the menu and levels. */
import { AudioManager } from "./AudioManager";

export const audioManager = new AudioManager();
