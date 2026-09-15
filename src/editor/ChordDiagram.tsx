import type { ChordDefinition } from "../model/chords";

const WIDTH = 72;
const MARGIN_X = 8;
const NUT_Y = 20;
const ROW_HEIGHT = 12;
const FRET_ROWS = 5;
const HEIGHT = NUT_Y + FRET_ROWS * ROW_HEIGHT + 8;

function colX(stringIndex: number): number {
  return MARGIN_X + stringIndex * ((WIDTH - 2 * MARGIN_X) / 5);
}

/** Small chord chart (section 9.1): "üzerine gelince küçük bir akor diyagramı önizlemesi çıkar." */
export function ChordDiagram({ chord }: { chord: ChordDefinition }) {
  return (
    <svg width={WIDTH} height={HEIGHT} className="overflow-visible">
      {Array.from({ length: FRET_ROWS + 1 }, (_, row) => (
        <line
          key={row}
          x1={colX(0)}
          y1={NUT_Y + row * ROW_HEIGHT}
          x2={colX(5)}
          y2={NUT_Y + row * ROW_HEIGHT}
          stroke="var(--control-text)"
          strokeOpacity={row === 0 ? 0.9 : 0.4}
          strokeWidth={row === 0 ? 2.5 : 1}
        />
      ))}
      {Array.from({ length: 6 }, (_, string) => (
        <line
          key={string}
          x1={colX(string)}
          y1={NUT_Y}
          x2={colX(string)}
          y2={NUT_Y + FRET_ROWS * ROW_HEIGHT}
          stroke="var(--control-text)"
          strokeOpacity={0.4}
          strokeWidth={1}
        />
      ))}
      {chord.frets.map((fret, stringIndex) => {
        const x = colX(stringIndex);
        if (fret === "x") {
          return (
            <text
              key={stringIndex}
              x={x}
              y={NUT_Y - 6}
              textAnchor="middle"
              fontSize={10}
              fontWeight="bold"
              fill="var(--control-text)"
              fillOpacity={0.7}
            >
              ×
            </text>
          );
        }
        if (fret === 0) {
          return (
            <circle
              key={stringIndex}
              cx={x}
              cy={NUT_Y - 7}
              r={3}
              fill="none"
              stroke="var(--control-text)"
              strokeOpacity={0.7}
              strokeWidth={1.2}
            />
          );
        }
        if (fret > FRET_ROWS) return null;
        return (
          <circle
            key={stringIndex}
            cx={x}
            cy={NUT_Y + (fret - 0.5) * ROW_HEIGHT}
            r={4}
            fill="var(--accent)"
          />
        );
      })}
    </svg>
  );
}
