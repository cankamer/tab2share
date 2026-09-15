import type { Beat, Project } from "../model/types";

export interface BeatPosition {
  measureIndex: number;
  beatIndex: number;
}

export interface FlatBeatRef extends BeatPosition {
  beat: Beat;
}

/** Flattens every beat in the track into a single ordered list, ignoring measure boundaries. */
export function flattenBeats(project: Project): FlatBeatRef[] {
  const flat: FlatBeatRef[] = [];
  project.track.measures.forEach((measure, measureIndex) => {
    measure.beats.forEach((beat, beatIndex) => {
      flat.push({ measureIndex, beatIndex, beat });
    });
  });
  return flat;
}

export function getBeatAt(project: Project, position: BeatPosition): Beat {
  return project.track.measures[position.measureIndex].beats[position.beatIndex];
}

/** [first, last] flat index of the measure that owns flatIndex — used for Home/End. */
export function measureFlatBounds(flat: FlatBeatRef[], flatIndex: number): [number, number] {
  const measureIndex = flat[flatIndex].measureIndex;
  let first = flatIndex;
  while (first > 0 && flat[first - 1].measureIndex === measureIndex) first -= 1;
  let last = flatIndex;
  while (last < flat.length - 1 && flat[last + 1].measureIndex === measureIndex) last += 1;
  return [first, last];
}

export function clampFlatIndex(flatIndex: number, length: number): number {
  if (length === 0) return 0;
  return Math.max(0, Math.min(length - 1, flatIndex));
}
