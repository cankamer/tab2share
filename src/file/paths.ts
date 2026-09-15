export const PROJECT_FILE_EXTENSION = "t2s";

/** Crash recovery file lives next to the project (section 17): `{project}.t2s.recovery`. */
export function recoveryPathFor(projectPath: string): string {
  return `${projectPath}.recovery`;
}
