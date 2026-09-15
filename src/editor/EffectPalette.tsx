import { useTranslation } from "react-i18next";
import type { Beat, BendPreset, Note, SlideType } from "../model/types";
import { SkeuButton } from "./ui/SkeuButton";

const BEND_PRESETS: BendPreset[] = ["half", "full", "oneAndHalf", "bendRelease", "preBend"];
const SLIDE_TYPES: SlideType[] = ["legato", "shift", "inFromBelow", "inFromAbove", "outUp", "outDown"];

interface EffectPaletteProps {
  note: Note | undefined;
  beat: Beat | undefined;
  onApplyBend: (preset: BendPreset) => void;
  onApplySlide: (type: SlideType) => void;
  onApplyVibrato: (intensity: "normal" | "wide") => void;
  onToggleHammer: () => void;
  onToggleDead: () => void;
  onToggleGhost: () => void;
  onTogglePalmMute: () => void;
  onToggleLetRing: () => void;
  onClearEffects: () => void;
}

/** Effect palette (section 7 & section 10.1): single horizontal bar placed above the fretboard card. */
export function EffectPalette({
  note,
  beat,
  onApplyBend,
  onApplySlide,
  onApplyVibrato,
  onToggleHammer,
  onToggleDead,
  onToggleGhost,
  onTogglePalmMute,
  onToggleLetRing,
  onClearEffects,
}: EffectPaletteProps) {
  const { t } = useTranslation();

  return (
    <div className="raised flex flex-wrap items-center gap-3 rounded-2xl p-4 text-xs w-full">
      {/* Bend Group */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] font-semibold uppercase text-[var(--label)]/80 mr-1">
          {t("effectPalette.bendTitle", "Bend")}
        </span>
        {BEND_PRESETS.map((preset) => (
          <SkeuButton key={preset} onClick={() => onApplyBend(preset)} active={note?.bend === preset} className="text-xs px-2 py-1">
            {t(`effectPalette.bendPresets.${preset}`)}
          </SkeuButton>
        ))}
      </div>

      <span className="text-[var(--body-edge)]">|</span>

      {/* Vibrato Group */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] font-semibold uppercase text-[var(--label)]/80 mr-1">
          {t("effectPalette.vibratoTitle", "Vibrato")}
        </span>
        <SkeuButton onClick={() => onApplyVibrato("normal")} active={note?.vibrato === "normal"} className="text-xs px-2 py-1">
          {t("effectPalette.vibratoNormal")}
        </SkeuButton>
        <SkeuButton onClick={() => onApplyVibrato("wide")} active={note?.vibrato === "wide"} className="text-xs px-2 py-1">
          {t("effectPalette.vibratoWide")}
        </SkeuButton>
      </div>

      <span className="text-[var(--body-edge)]">|</span>

      {/* Slide Group */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] font-semibold uppercase text-[var(--label)]/80 mr-1">
          {t("effectPalette.slideTitle", "Slide")}
        </span>
        {SLIDE_TYPES.map((type) => (
          <SkeuButton key={type} onClick={() => onApplySlide(type)} active={note?.slide?.type === type} className="text-xs px-2 py-1">
            {t(`effectPalette.slideTypes.${type}`)}
          </SkeuButton>
        ))}
      </div>

      <span className="text-[var(--body-edge)]">|</span>

      {/* Articulations */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <SkeuButton title="H" onClick={onToggleHammer} active={Boolean(note?.hammer)} className="text-xs px-2 py-1">
          {t("effectPalette.hammer")}
        </SkeuButton>
        <SkeuButton title="X" onClick={onToggleDead} active={Boolean(note?.dead)} className="text-xs px-2 py-1">
          {t("effectPalette.dead")}
        </SkeuButton>
        <SkeuButton title="O" onClick={onToggleGhost} active={Boolean(note?.ghost)} className="text-xs px-2 py-1">
          {t("effectPalette.ghost")}
        </SkeuButton>
        <SkeuButton title="[" onClick={onTogglePalmMute} active={Boolean(beat?.palmMute)} className="text-xs px-2 py-1">
          {t("effectPalette.palmMute")}
        </SkeuButton>
        <SkeuButton title="I" onClick={onToggleLetRing} active={Boolean(beat?.letRing)} className="text-xs px-2 py-1">
          {t("effectPalette.letRing")}
        </SkeuButton>
      </div>

      <span className="text-[var(--body-edge)]">|</span>

      {/* Clear */}
      <SkeuButton title="Ctrl+Shift+X" onClick={onClearEffects} className="text-xs px-2.5 py-1">
        {t("effectPalette.clearEffects")}
      </SkeuButton>
    </div>
  );
}
