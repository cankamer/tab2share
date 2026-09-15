import type { Note } from "./types";

export type ChordCategory = "major" | "minor" | "seventh" | "sus" | "power";

export interface ChordDefinition {
  name: string;
  category: ChordCategory;
  /**
   * Fret positions written 6th string (low E) to 1st string (high e), matching
   * how guitarists read a chord diagram. "x" means the string is not played.
   * Note.string uses the opposite convention (1 = high e), so never read this
   * array directly against Note.string — always go through chordToNotes.
   */
  frets: (number | "x")[];
}

function parseFrets(pattern: string): (number | "x")[] {
  return pattern.split("").map((char) => (char === "x" ? "x" : Number(char)));
}

/**
 * Converts a chord's 6th-to-1st fret pattern into Notes using the
 * Note.string convention (1 = high e, 6 = low E). This is the single place
 * that performs the string-order reversal — do it by hand nowhere else.
 */
export function chordToNotes(chord: ChordDefinition): Note[] {
  const notes: Note[] = [];
  chord.frets.forEach((fret, index) => {
    if (fret === "x") return;
    notes.push({ string: (6 - index) as Note["string"], fret });
  });
  return notes;
}

export const CHORDS: ChordDefinition[] = [
  { name: "C", category: "major", frets: parseFrets("x32010") },
  { name: "A", category: "major", frets: parseFrets("x02220") },
  { name: "G", category: "major", frets: parseFrets("320003") },
  { name: "E", category: "major", frets: parseFrets("022100") },
  { name: "D", category: "major", frets: parseFrets("xx0232") },
  { name: "F", category: "major", frets: parseFrets("133211") },
  { name: "B", category: "major", frets: parseFrets("x24442") },
  { name: "Am", category: "minor", frets: parseFrets("x02210") },
  { name: "Em", category: "minor", frets: parseFrets("022000") },
  { name: "Dm", category: "minor", frets: parseFrets("xx0231") },
  { name: "Bm", category: "minor", frets: parseFrets("x24432") },
  { name: "Cm", category: "minor", frets: parseFrets("x35543") },
  { name: "Gm", category: "minor", frets: parseFrets("355333") },
  { name: "A7", category: "seventh", frets: parseFrets("x02020") },
  { name: "B7", category: "seventh", frets: parseFrets("x21202") },
  { name: "D7", category: "seventh", frets: parseFrets("xx0212") },
  { name: "E7", category: "seventh", frets: parseFrets("020100") },
  { name: "G7", category: "seventh", frets: parseFrets("320001") },
  { name: "Am7", category: "seventh", frets: parseFrets("x02010") },
  { name: "Dm7", category: "seventh", frets: parseFrets("xx0211") },
  { name: "Em7", category: "seventh", frets: parseFrets("022030") },
  { name: "Cmaj7", category: "seventh", frets: parseFrets("x32000") },
  { name: "Gmaj7", category: "seventh", frets: parseFrets("320002") },
  { name: "Asus2", category: "sus", frets: parseFrets("x02200") },
  { name: "Asus4", category: "sus", frets: parseFrets("x02230") },
  { name: "Dsus2", category: "sus", frets: parseFrets("xx0230") },
  { name: "Dsus4", category: "sus", frets: parseFrets("xx0233") },
  { name: "Esus4", category: "sus", frets: parseFrets("022200") },
  { name: "E5", category: "power", frets: parseFrets("022xxx") },
  { name: "A5", category: "power", frets: parseFrets("x022xx") },
];
