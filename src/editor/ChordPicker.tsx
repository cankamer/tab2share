import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CHORDS, type ChordCategory, type ChordDefinition } from "../model/chords";
import { ChordDiagram } from "./ChordDiagram";
import { SkeuButton } from "./ui/SkeuButton";
import { SkeuInput } from "./ui/SkeuInput";

const CATEGORIES: ChordCategory[] = ["major", "minor", "seventh", "sus", "power"];

const WHEEL_RADIUS = 68;
const BUTTON_SIZE = 36;
const WHEEL_SIZE = (WHEEL_RADIUS + BUTTON_SIZE / 2) * 2;
const HUB_SIZE = 64;

interface ChordPickerProps {
  currentLabel: string | undefined;
  onSelectChord: (chord: ChordDefinition) => void;
  onRenameLabel: (label: string) => void;
}

function getPopoverPositionClass(x: number, y: number, wheelSize: number) {
  const centerX = wheelSize / 2;
  const centerY = wheelSize / 2;
  const dx = x - centerX;
  const dy = y - centerY;

  if (Math.abs(dy) >= Math.abs(dx)) {
    if (dy > 0) {
      return "bottom-full left-1/2 -translate-x-1/2 mb-1.5";
    }
    return "top-full left-1/2 -translate-x-1/2 mt-1.5";
  }
  if (dx > 0) {
    return "right-full top-1/2 -translate-y-1/2 mr-1.5";
  }
  return "left-full top-1/2 -translate-y-1/2 ml-1.5";
}

/** Fixed 30-chord library (section 9.1): the active category's chords sit as spokes on a
 * wheel around a center label hub, rather than a plain button grid. Hover a spoke for a
 * chord-diagram preview, same as before. */
export function ChordPicker({ currentLabel, onSelectChord, onRenameLabel }: ChordPickerProps) {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<ChordCategory>("major");
  const chords = CHORDS.filter((chord) => chord.category === activeCategory);

  return (
    <div className="raised flex flex-col items-center justify-between gap-2 rounded-2xl p-3 text-xs h-full min-w-[260px]">
      <div key={currentLabel ?? ""} className="flex items-center justify-start gap-1.5 w-full text-[11px] pl-1">
        <span style={{ color: "var(--label)" }}>{t("chordPicker.labelField")}</span>
        <SkeuInput
          defaultValue={currentLabel ?? ""}
          placeholder={t("chordPicker.labelPlaceholder")}
          onBlur={(event) => onRenameLabel(event.target.value)}
          className="w-20 text-center text-xs py-0.5"
        />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1.5 w-full">
        {CATEGORIES.map((category) => (
          <SkeuButton
            key={category}
            onClick={() => setActiveCategory(category)}
            active={activeCategory === category}
            className="text-[10px] px-2 py-0.5"
          >
            {t(`chordPicker.categories.${category}`)}
          </SkeuButton>
        ))}
      </div>

      <div className="relative mx-auto my-auto" style={{ width: WHEEL_SIZE, height: WHEEL_SIZE }}>
        <div
          className="raised absolute flex flex-col items-center justify-center rounded-full text-center"
          style={{
            width: HUB_SIZE,
            height: HUB_SIZE,
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <span style={{ color: "var(--label)" }}>{t("chordPicker.hubLabel")}</span>
          <span className="font-bold" style={{ color: "var(--control-text)" }}>
            {currentLabel || t("chordPicker.hubEmpty")}
          </span>
        </div>

        {chords.map((chord, index) => {
          const angle = (index / chords.length) * 2 * Math.PI - Math.PI / 2;
          const x = WHEEL_SIZE / 2 + WHEEL_RADIUS * Math.cos(angle);
          const y = WHEEL_SIZE / 2 + WHEEL_RADIUS * Math.sin(angle);
          const active = chord.name === currentLabel;
          const popoverPosClass = getPopoverPositionClass(x, y, WHEEL_SIZE);

          return (
            <div
              key={chord.name}
              className="group absolute hover:z-50"
              style={{ left: x, top: y, transform: "translate(-50%, -50%)" }}
            >
              <button
                type="button"
                onClick={() => onSelectChord(chord)}
                className={`${active ? "inset" : "raised"} flex items-center justify-center rounded-full text-xs transition-transform hover:scale-105`}
                style={{
                  width: BUTTON_SIZE,
                  height: BUTTON_SIZE,
                  border: active ? "1.5px solid var(--accent)" : "1px solid transparent",
                  color: active ? "var(--accent)" : "var(--control-text)",
                }}
              >
                {chord.name}
              </button>
              <div
                className={`raised absolute z-50 hidden rounded-xl p-2 shadow-2xl pointer-events-none group-hover:flex items-center justify-center ${popoverPosClass}`}
                style={{
                  background: "var(--body)",
                  border: "1px solid var(--body-edge)",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.35)",
                }}
              >
                <ChordDiagram chord={chord} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
