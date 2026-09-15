import type { Project } from "../model/types";
import { writeRecoveryFile } from "./io";

const DEFAULT_INTERVAL_MS = 5000;

export interface AutosaveOptions {
  getProject: () => Project;
  isDirty: () => boolean;
  /** Autosave only runs once a save location exists (section 8: after the user picks one). */
  getProjectPath: () => string | null;
  onSaved?: () => void;
  onError?: (error: unknown) => void;
  intervalMs?: number;
}

export interface AutosaveController {
  start: () => void;
  stop: () => void;
}

/**
 * Interval-based autosave that writes to the `.recovery` sibling file (section 17),
 * never the project file itself. Pure controller with no editor dependency — the
 * editor (step 5) supplies getProject/isDirty/getProjectPath once it exists.
 */
export function createAutosave(options: AutosaveOptions): AutosaveController {
  const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS;
  let timer: ReturnType<typeof setInterval> | null = null;

  async function tick() {
    const projectPath = options.getProjectPath();
    if (!projectPath || !options.isDirty()) return;

    try {
      await writeRecoveryFile(options.getProject(), projectPath);
      options.onSaved?.();
    } catch (error) {
      options.onError?.(error);
    }
  }

  return {
    start() {
      if (timer !== null) return;
      timer = setInterval(tick, intervalMs);
    },
    stop() {
      if (timer === null) return;
      clearInterval(timer);
      timer = null;
    },
  };
}
