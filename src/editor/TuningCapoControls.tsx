import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { TUNING_PRESETS } from "../model/tunings";
import { SkeuButton } from "./ui/SkeuButton";
import { SkeuInput } from "./ui/SkeuInput";
import { StatusPill } from "./ui/StatusPill";

interface TuningCapoControlsProps {
  tuning: string[];
  capo: number;
  onSetTuning: (tuning: string[]) => void;
  onSetTuningString: (arrayIndex: number, note: string) => void;
  onSetCapo: (capo: number) => void;
}

const STRING_NUMBERS: (1 | 2 | 3 | 4 | 5 | 6)[] = [1, 2, 3, 4, 5, 6];

/**
 * Section 9.2's tuning/capo control panel with section 10.1 neumorphic card layout,
 * dropdown menu for custom single-string tuning, and auto-applying capo.
 */
export function TuningCapoControls({
  tuning,
  capo,
  onSetTuning,
  onSetTuningString,
  onSetCapo,
}: TuningCapoControlsProps) {
  const { t } = useTranslation();
  const [showCustomTuning, setShowCustomTuning] = useState(false);
  const [localCapo, setLocalCapo] = useState(capo.toString());
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalCapo(capo.toString());
  }, [capo]);

  // Close dropdown on click outside
  useEffect(() => {
    if (!showCustomTuning) return;
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCustomTuning(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCustomTuning]);

  const handleCapoChange = (valStr: string) => {
    setLocalCapo(valStr);
    const val = parseInt(valStr, 10);
    if (!isNaN(val) && val >= 0 && val <= 24) {
      onSetCapo(val);
    }
  };

  return (
    <div
      key={tuning.join(",")}
      className="raised flex flex-wrap items-center gap-3.5 sm:gap-4 rounded-2xl p-3 text-xs"
    >
      {/* Tuning Group */}
      <div className="flex flex-col gap-1 shrink-0">
        <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--label)]/70">
          {t("tuningCapo.tuningGroup", "Tuning")}
        </span>
        <div className="flex flex-wrap items-center gap-1.5 h-7">
          {TUNING_PRESETS.map((preset) => (
            <SkeuButton
              key={preset.name}
              onClick={() => onSetTuning(preset.tuning)}
              className="h-7 px-2.5 text-xs font-medium !py-0 flex items-center justify-center"
            >
              {preset.name}
            </SkeuButton>
          ))}

          {/* Single String Tuning Dropdown */}
          <div ref={dropdownRef} className="relative">
            <SkeuButton
              onClick={() => setShowCustomTuning((prev) => !prev)}
              active={showCustomTuning}
              className="h-7 px-2.5 text-xs font-medium !py-0 flex items-center justify-center"
            >
              {t("tuningCapo.customTuning", "Tek Tek Ayarla")}
            </SkeuButton>

            {showCustomTuning ? (
              <div
                className="raised absolute top-full left-0 z-40 mt-2 flex flex-col gap-3 rounded-2xl p-4 shadow-2xl min-w-[240px]"
                style={{ border: "1px solid var(--body-edge)" }}
              >
                <div className="flex items-center justify-between border-b border-[var(--shadow-dark)]/10 pb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--label)]">
                    {t("tuningCapo.customTuningTitle", "Tel Akortları")}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {STRING_NUMBERS.map((string) => {
                    const arrayIndex = 6 - string;
                    return (
                      <label key={string} className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="text-[var(--label)] font-semibold">
                          {t(`tuningCapo.strings.${string}`)}
                        </span>
                        <SkeuInput
                          defaultValue={tuning[arrayIndex]}
                          onBlur={(event) => onSetTuningString(arrayIndex, event.target.value)}
                          onChange={(event) => onSetTuningString(arrayIndex, event.target.value)}
                          className="h-7 w-12 text-center font-mono text-xs !py-0"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="hidden sm:block h-6 w-px bg-[var(--shadow-dark)]/15 self-end mb-0.5 shrink-0" />

      {/* Capo Group */}
      <div className="flex flex-col gap-1 shrink-0">
        <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--label)]/70">
          {t("tuningCapo.capoGroup", "Capo")}
        </span>
        <div className="flex items-center gap-1.5 h-7">
          <SkeuInput
            type="number"
            min={0}
            max={24}
            value={localCapo}
            onChange={(e) => handleCapoChange(e.target.value)}
            onBlur={() => setLocalCapo(capo.toString())}
            className="h-7 w-12 text-center font-mono text-xs !py-0"
          />
          {capo > 0 ? (
            <div className="h-7 flex items-center">
              <StatusPill>{t("tuningCapo.capoValue", { n: capo })}</StatusPill>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
