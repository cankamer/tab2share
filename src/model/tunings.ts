/** Standard tuning, low-to-high (Track.tuning's own order, section 5). */
export const STANDARD_TUNING = ["E", "A", "D", "G", "B", "E"];

export interface TuningPreset {
  name: string;
  tuning: string[];
}

/** Hazır setler (section 9.2). */
export const TUNING_PRESETS: TuningPreset[] = [
  { name: "Standard", tuning: STANDARD_TUNING },
  { name: "DADGAD", tuning: ["D", "A", "D", "G", "A", "D"] },
  { name: "Half Step Down", tuning: ["Eb", "Ab", "Db", "Gb", "Bb", "Eb"] },
];

export function isStandardTuning(tuning: string[]): boolean {
  return tuning.length === STANDARD_TUNING.length && tuning.every((note, i) => note === STANDARD_TUNING[i]);
}
