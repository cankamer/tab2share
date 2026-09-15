import type { Project } from "../model/types";

/** Current on-disk Project.version this app writes and reads without migration. */
export const CURRENT_PROJECT_VERSION = "1";

export class ProjectParseError extends Error {
  cause?: unknown;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "ProjectParseError";
    this.cause = options?.cause;
  }
}

/** Human-readable, git-diffable: matches section 8's requirement for the .t2s format. */
export function serializeProject(project: Project): string {
  return JSON.stringify(project, null, 2);
}

export function parseProject(json: string): Project {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch (cause) {
    throw new ProjectParseError("File is not valid JSON.", { cause });
  }

  if (!isProjectShape(data)) {
    throw new ProjectParseError("File does not look like a Tab2Share project.");
  }

  return data;
}

export type ProjectVersionCompatibility = "compatible" | "newer" | "older";

/**
 * Compares a loaded project's version against CURRENT_PROJECT_VERSION (section 17):
 * "newer" should open read-only, "older" should go through migration before the
 * next save. No migration exists yet since version "1" is the only version so far.
 */
export function compareProjectVersion(fileVersion: string): ProjectVersionCompatibility {
  const file = Number(fileVersion);
  const current = Number(CURRENT_PROJECT_VERSION);
  if (Number.isNaN(file)) return "newer";
  if (file === current) return "compatible";
  return file > current ? "newer" : "older";
}

function isTimeSignature(value: unknown): value is { num: number; den: number } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Record<string, unknown>).num === "number" &&
    typeof (value as Record<string, unknown>).den === "number"
  );
}

function isTrack(value: unknown): value is Project["track"] {
  if (typeof value !== "object" || value === null) return false;
  const track = value as Record<string, unknown>;
  return (
    Array.isArray(track.tuning) &&
    typeof track.capo === "number" &&
    Array.isArray(track.measures)
  );
}

function isProjectShape(value: unknown): value is Project {
  if (typeof value !== "object" || value === null) return false;
  const project = value as Record<string, unknown>;
  return (
    typeof project.version === "string" &&
    typeof project.title === "string" &&
    typeof project.defaultTempo === "number" &&
    isTimeSignature(project.defaultTimeSignature) &&
    isTrack(project.track) &&
    typeof project.renderTheme === "object" &&
    project.renderTheme !== null
  );
}
