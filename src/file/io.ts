import { exists, readTextFile, remove, writeTextFile } from "@tauri-apps/plugin-fs";
import { open, save } from "@tauri-apps/plugin-dialog";
import type { Project } from "../model/types";
import { parseProject, serializeProject } from "./project";
import { PROJECT_FILE_EXTENSION, recoveryPathFor } from "./paths";

const DIALOG_FILTERS = [{ name: "Tab2Share Project", extensions: [PROJECT_FILE_EXTENSION] }];

/** Opens the native "Save As" dialog; null if the user cancels. */
export async function pickSaveLocation(defaultFileName: string): Promise<string | null> {
  return save({ defaultPath: defaultFileName, filters: DIALOG_FILTERS });
}

/** Opens the native "Open" dialog; null if the user cancels. */
export async function pickOpenLocation(): Promise<string | null> {
  const path = await open({ multiple: false, filters: DIALOG_FILTERS });
  return typeof path === "string" ? path : null;
}

export async function saveProjectToPath(project: Project, path: string): Promise<void> {
  await writeTextFile(path, serializeProject(project));
}

export async function loadProjectFromPath(path: string): Promise<Project> {
  const contents = await readTextFile(path);
  return parseProject(contents);
}

async function deleteFileIfExists(path: string): Promise<void> {
  if (await exists(path)) {
    await remove(path);
  }
}

/**
 * Crash recovery (section 17): autosave never overwrites the main project file —
 * it writes to a sibling `{path}.recovery` file instead. A clean explicit Save or a
 * clean app exit deletes it; finding one at startup means the app didn't close cleanly.
 */
export async function writeRecoveryFile(project: Project, projectPath: string): Promise<void> {
  await writeTextFile(recoveryPathFor(projectPath), serializeProject(project));
}

export async function readRecoveryFile(projectPath: string): Promise<Project | null> {
  const recoveryPath = recoveryPathFor(projectPath);
  if (!(await exists(recoveryPath))) return null;
  const contents = await readTextFile(recoveryPath);
  return parseProject(contents);
}

export async function deleteRecoveryFile(projectPath: string): Promise<void> {
  await deleteFileIfExists(recoveryPathFor(projectPath));
}

export async function recoveryFileExists(projectPath: string): Promise<boolean> {
  return exists(recoveryPathFor(projectPath));
}
