import type { Project } from "../types";
import { STANDARD_TUNING } from "../tunings";

/** File > New project (section 8): one empty rest measure, standard tuning, no capo. */
export function createBlankProject(): Project {
  return {
    version: "1",
    title: "",
    defaultTempo: 120,
    defaultTimeSignature: { num: 4, den: 4 },
    track: {
      tuning: [...STANDARD_TUNING],
      capo: 0,
      measures: [{ beats: [{ duration: 4, dotted: false, isRest: true, notes: [] }] }],
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
}
