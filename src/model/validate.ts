import type { Beat, Measure } from "./types";

const EPSILON = 1e-6;

export type MeasureFillStatus = "exact" | "underfilled" | "overfilled";

export interface MeasureValidationResult {
  /** Expected measure length, in whole-note units (e.g. 4/4 = 1). */
  expectedWholeNotes: number;
  /** Sum of the measure's beat durations, in whole-note units. */
  actualWholeNotes: number;
  status: MeasureFillStatus;
  /** actualWholeNotes - expectedWholeNotes; positive means overfilled. */
  differenceWholeNotes: number;
}

/** A beat's length in whole-note units, accounting for dotted notes and tuplets. */
export function beatLengthInWholeNotes(beat: Beat): number {
  let length = 1 / beat.duration;
  if (beat.dotted) length *= 1.5;
  if (beat.tuplet) length *= beat.tuplet.over / beat.tuplet.count;
  return length;
}

/** A time signature's length in whole-note units (e.g. 3/4 = 0.75). */
export function timeSignatureWholeNotes(timeSignature: {
  num: number;
  den: number;
}): number {
  return timeSignature.num / timeSignature.den;
}

/**
 * Checks whether a measure's beats add up to its time signature.
 *
 * `Measure.timeSignature` is only set when it changes (section 5), so the
 * effective time signature for a measure must be resolved by the caller
 * (carrying forward the last-seen one) and passed in here explicitly.
 *
 * This only reports the mismatch — per the spec's critical rule, the editor
 * must warn visually but never block writing to an under/overfilled measure.
 */
export function validateMeasure(
  measure: Measure,
  effectiveTimeSignature: { num: number; den: number },
): MeasureValidationResult {
  const expectedWholeNotes = timeSignatureWholeNotes(effectiveTimeSignature);
  const actualWholeNotes = measure.beats.reduce(
    (sum, beat) => sum + beatLengthInWholeNotes(beat),
    0,
  );
  const differenceWholeNotes = actualWholeNotes - expectedWholeNotes;

  let status: MeasureFillStatus;
  if (Math.abs(differenceWholeNotes) <= EPSILON) {
    status = "exact";
  } else if (differenceWholeNotes < 0) {
    status = "underfilled";
  } else {
    status = "overfilled";
  }

  return { expectedWholeNotes, actualWholeNotes, status, differenceWholeNotes };
}
