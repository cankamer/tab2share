import type { Project } from "../model/types";

/**
 * tempo/timeSignature are only written on a Measure when they change (section 5), so the
 * "current" value at any measure is whatever was last set at or before it, falling back to
 * the project defaults.
 */
export function resolveEffectiveSettings(project: Project, measureIndex: number) {
  let tempo = project.defaultTempo;
  let timeSignature = project.defaultTimeSignature;

  for (let i = 0; i <= measureIndex && i < project.track.measures.length; i++) {
    const measure = project.track.measures[i];
    if (measure.tempo !== undefined) tempo = measure.tempo;
    if (measure.timeSignature !== undefined) timeSignature = measure.timeSignature;
  }

  return { tempo, timeSignature };
}
