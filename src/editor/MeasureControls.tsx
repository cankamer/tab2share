import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SkeuButton } from "./ui/SkeuButton";
import { SkeuInput } from "./ui/SkeuInput";
import { StatusPill } from "./ui/StatusPill";
import { Knob } from "./ui/Knob";

interface MeasureControlsProps {
  measureIndex: number;
  tempo: number;
  timeSignature: { num: number; den: number };
  onInsertMeasure: () => void;
  onDuplicateMeasure: () => void;
  onDeleteMeasure: () => void;
  onTransposeUp: () => void;
  onTransposeDown: () => void;
  onSetTempo: (tempo: number) => void;
  onSetTimeSignature: (num: number, den: number) => void;
}

const MIN_TEMPO = 0;
const MAX_TEMPO = 240;

/**
 * Temporary control surface for section 9.4's measure operations and transpose — section 9's
 * layout diagram keeps this as the permanent top bar; step 12's Edit menu adds a second,
 * discoverable entry point to the same actions rather than replacing this one.
 */
export function MeasureControls({
  measureIndex,
  tempo,
  timeSignature,
  onInsertMeasure,
  onDuplicateMeasure,
  onDeleteMeasure,
  onTransposeUp,
  onTransposeDown,
  onSetTempo,
  onSetTimeSignature,
}: MeasureControlsProps) {
  const { t } = useTranslation();

  const [localTempo, setLocalTempo] = useState(tempo.toString());
  const [localNum, setLocalNum] = useState(timeSignature.num.toString());
  const [localDen, setLocalDen] = useState(timeSignature.den.toString());

  useEffect(() => {
    setLocalTempo(tempo.toString());
  }, [tempo]);

  useEffect(() => {
    setLocalNum(timeSignature.num.toString());
    setLocalDen(timeSignature.den.toString());
  }, [timeSignature.num, timeSignature.den]);

  const handleTimeSigChange = (newNumStr: string, newDenStr: string) => {
    setLocalNum(newNumStr);
    setLocalDen(newDenStr);
    const n = parseInt(newNumStr, 10);
    const d = parseInt(newDenStr, 10);
    if (!isNaN(n) && n >= 1 && n <= 32 && !isNaN(d) && d >= 1 && d <= 32) {
      onSetTimeSignature(n, d);
    }
  };

  return (
    <div
      key={measureIndex}
      className="raised flex flex-col gap-5 rounded-2xl p-5"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-[var(--shadow-dark)]/10 pb-3">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-[var(--label)]">
          {t("measureControls.measureTitle", "Measure")} {measureIndex + 1}
        </h2>
        <div className="flex gap-2">
          <StatusPill>
            {timeSignature.num}/{timeSignature.den}
          </StatusPill>
          <StatusPill>{tempo} BPM</StatusPill>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-6">
        {/* Actions Group */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--label)]/80">
            {t("measureControls.actions", "Actions")}
          </span>
          <div className="flex gap-2">
            <SkeuButton title="Ctrl+M" onClick={onInsertMeasure}>
              {t("measureControls.insertMeasure")}
            </SkeuButton>
            <SkeuButton title="Ctrl+D" onClick={onDuplicateMeasure}>
              {t("measureControls.duplicateMeasure")}
            </SkeuButton>
            <SkeuButton
              title="Ctrl+Shift+M"
              onClick={onDeleteMeasure}
              className="text-xs px-2"
            >
              {t("measureControls.deleteMeasure")}
            </SkeuButton>
          </div>
        </div>

        {/* Transpose Group */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--label)]/80">
            {t("measureControls.transposeGroup", "Transpose")}
          </span>
          <div className="flex gap-2">
            <SkeuButton title="Ctrl+Up" onClick={onTransposeUp} className="text-xs px-2.5">
              + {t("measureControls.transposeUp")}
            </SkeuButton>
            <SkeuButton title="Ctrl+Down" onClick={onTransposeDown} className="text-xs px-2.5">
              - {t("measureControls.transposeDown")}
            </SkeuButton>
          </div>
        </div>

        {/* Tempo Group */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--label)]/80">
            {t("measureControls.tempoGroup", "Tempo")}
          </span>
          <div className="flex items-center gap-2">
            <Knob value={tempo} min={MIN_TEMPO} max={MAX_TEMPO} onChange={onSetTempo} />
            <SkeuInput
              type="number"
              min={1}
              max={999}
              value={localTempo}
              onChange={(e) => {
                setLocalTempo(e.target.value);
                const value = parseInt(e.target.value, 10);
                if (!isNaN(value) && value >= MIN_TEMPO && value <= MAX_TEMPO) {
                  onSetTempo(value);
                }
              }}
              onBlur={() => {
                setLocalTempo(tempo.toString());
              }}
              className="w-16 text-center font-mono"
            />
          </div>
        </div>

        {/* Time Signature Group */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--label)]/80">
            {t("measureControls.timeSigGroup", "Time Sig")}
          </span>
          <div className="flex items-center gap-2 text-[var(--label)] font-bold">
            <SkeuInput
              type="number"
              min={1}
              max={32}
              value={localNum}
              onChange={(e) => handleTimeSigChange(e.target.value, localDen)}
              onBlur={() => {
                setLocalNum(timeSignature.num.toString());
              }}
              className="w-12 text-center font-mono"
            />
            <span>/</span>
            <SkeuInput
              type="number"
              min={1}
              max={32}
              value={localDen}
              onChange={(e) => handleTimeSigChange(localNum, e.target.value)}
              onBlur={() => {
                setLocalDen(timeSignature.den.toString());
              }}
              className="w-12 text-center font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
