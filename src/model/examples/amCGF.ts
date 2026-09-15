import { CHORDS, chordToNotes } from "../chords";
import type { Beat, Measure, Project } from "../types";

const AM = CHORDS.find((c) => c.name === "Am")!;
const C = CHORDS.find((c) => c.name === "C")!;
const G = CHORDS.find((c) => c.name === "G")!;
const F = CHORDS.find((c) => c.name === "F")!;

function chordStrum(chordRef: string, notes: Beat["notes"]): Beat {
  return { duration: 4, dotted: false, isRest: false, notes, chordRef };
}

function rest(): Beat {
  return { duration: 4, dotted: false, isRest: false, notes: [] };
}

function measure(fillBeat: Beat, chordRef: string, chordNotes: Beat["notes"]): Measure {
  return {
    beats: [chordStrum(chordRef, chordNotes), fillBeat, rest(), rest()],
  };
}

/**
 * Sample project shown on the welcome screen (section 16): a simple
 * Am-C-G-F progression with a couple of bends and vibrato so a new user
 * immediately sees how effects render.
 */
export const AM_C_G_F_EXAMPLE: Project = {
  version: "1",
  title: "Am - C - G - F",
  defaultTempo: 92,
  defaultTimeSignature: { num: 4, den: 4 },
  track: {
    tuning: ["E", "A", "D", "G", "B", "E"],
    capo: 0,
    measures: [
      measure(
        { duration: 4, dotted: false, isRest: false, notes: [{ string: 2, fret: 1, bend: "half" }] },
        "Am",
        chordToNotes(AM),
      ),
      measure(
        { duration: 4, dotted: false, isRest: false, notes: [{ string: 2, fret: 1, vibrato: "normal" }] },
        "C",
        chordToNotes(C),
      ),
      measure(
        { duration: 4, dotted: false, isRest: false, notes: [{ string: 1, fret: 3, vibrato: "wide" }] },
        "G",
        chordToNotes(G),
      ),
      measure(
        { duration: 4, dotted: false, isRest: false, notes: [{ string: 2, fret: 1, bend: "full" }] },
        "F",
        chordToNotes(F),
      ),
    ],
  },
  renderTheme: {
    chordLabelColor: "#F2F2F2",
    bendArrowColor: "#F2F2F2",
    articulationColor: "#F2F2F2",
    fretNumberColor: "#F2F2F2",
    stringLineColor: "#F2F2F2",
    rhythmStemColor: "#F2F2F2",
    edgeFade: { enabled: false, ratio: 0 },
  },
};
