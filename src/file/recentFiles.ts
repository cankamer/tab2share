import { appConfigDir, join } from "@tauri-apps/api/path";
import { exists, mkdir, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";

/** File menu > Recent files shows the last 10 (section 8). */
export const RECENT_FILES_LIMIT = 10;

const RECENT_FILES_FILENAME = "recent-files.json";

async function recentFilesPath(): Promise<string> {
  return join(await appConfigDir(), RECENT_FILES_FILENAME);
}

export async function getRecentFiles(): Promise<string[]> {
  const path = await recentFilesPath();
  if (!(await exists(path))) return [];

  try {
    const parsed: unknown = JSON.parse(await readTextFile(path));
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === "string") : [];
  } catch {
    return [];
  }
}

/** Moves projectPath to the front, dedupes, and truncates to RECENT_FILES_LIMIT. */
export async function addRecentFile(projectPath: string): Promise<void> {
  const current = await getRecentFiles();
  const updated = [projectPath, ...current.filter((entry) => entry !== projectPath)].slice(
    0,
    RECENT_FILES_LIMIT,
  );

  const configDir = await appConfigDir();
  if (!(await exists(configDir))) {
    await mkdir(configDir, { recursive: true });
  }

  await writeTextFile(await recentFilesPath(), JSON.stringify(updated, null, 2));
}
