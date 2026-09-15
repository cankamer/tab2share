import { useRef } from "react";
import { useTranslation } from "react-i18next";
import type { Project } from "../model/types";
import { Modal } from "../editor/ui/Modal";
import { SkeuButton } from "../editor/ui/SkeuButton";
import { SkeuInput } from "../editor/ui/SkeuInput";

interface ProjectSettingsModalProps {
  project: Project;
  onClose: () => void;
  onSetTitle: (title: string) => void;
  onSetArtist: (artist: string) => void;
  onSetDefaultTempo: (tempo: number) => void;
  onSetDefaultTimeSignature: (num: number, den: number) => void;
  onSetTuningString: (arrayIndex: number, note: string) => void;
  onSetCapo: (capo: number) => void;
}

const STRING_NUMBERS: (1 | 2 | 3 | 4 | 5 | 6)[] = [1, 2, 3, 4, 5, 6];

/** File > Project settings... (section 8): title, artist, tempo, time signature, tuning, capo. */
export function ProjectSettingsModal({
  project,
  onClose,
  onSetTitle,
  onSetArtist,
  onSetDefaultTempo,
  onSetDefaultTimeSignature,
  onSetTuningString,
  onSetCapo,
}: ProjectSettingsModalProps) {
  const { t } = useTranslation();
  const tempoRef = useRef<HTMLInputElement>(null);
  const numRef = useRef<HTMLInputElement>(null);
  const denRef = useRef<HTMLInputElement>(null);
  const capoRef = useRef<HTMLInputElement>(null);

  return (
    <Modal title={t("projectSettings.title")} onClose={onClose} width={380}>
      <div className="flex flex-col gap-2 text-xs">
        <label className="flex flex-col gap-1">
          <span style={{ color: "var(--label)" }}>{t("projectSettings.titleField")}</span>
          <SkeuInput defaultValue={project.title} onBlur={(event) => onSetTitle(event.target.value)} />
        </label>

        <label className="flex flex-col gap-1">
          <span style={{ color: "var(--label)" }}>{t("projectSettings.artistField")}</span>
          <SkeuInput defaultValue={project.artist ?? ""} onBlur={(event) => onSetArtist(event.target.value)} />
        </label>

        <div className="flex items-end gap-2">
          <label className="flex flex-1 flex-col gap-1">
            <span style={{ color: "var(--label)" }}>{t("projectSettings.tempoField")}</span>
            <SkeuInput
              ref={tempoRef}
              type="number"
              min={1}
              max={999}
              defaultValue={project.defaultTempo}
              onBlur={(event) => {
                const value = Number(event.target.value);
                if (Number.isFinite(value) && value > 0) onSetDefaultTempo(value);
              }}
            />
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span style={{ color: "var(--label)" }}>{t("projectSettings.timeSigField")}</span>
          <div className="flex items-center gap-1">
            <SkeuInput
              ref={numRef}
              type="number"
              min={1}
              max={32}
              defaultValue={project.defaultTimeSignature.num}
              className="w-14"
              onBlur={() => {
                const num = Number(numRef.current?.value);
                const den = Number(denRef.current?.value);
                if (Number.isFinite(num) && num > 0 && Number.isFinite(den) && den > 0) {
                  onSetDefaultTimeSignature(num, den);
                }
              }}
            />
            /
            <SkeuInput
              ref={denRef}
              type="number"
              min={1}
              max={32}
              defaultValue={project.defaultTimeSignature.den}
              className="w-14"
              onBlur={() => {
                const num = Number(numRef.current?.value);
                const den = Number(denRef.current?.value);
                if (Number.isFinite(num) && num > 0 && Number.isFinite(den) && den > 0) {
                  onSetDefaultTimeSignature(num, den);
                }
              }}
            />
          </div>
        </label>

        <div className="flex flex-col gap-1">
          <span style={{ color: "var(--label)" }}>{t("projectSettings.tuningField")}</span>
          <div className="flex flex-wrap gap-2">
            {STRING_NUMBERS.map((string) => {
              const arrayIndex = 6 - string;
              return (
                <label key={string} className="flex items-center gap-1">
                  {t(`tuningCapo.strings.${string}`)}
                  <SkeuInput
                    defaultValue={project.track.tuning[arrayIndex]}
                    onBlur={(event) => onSetTuningString(arrayIndex, event.target.value)}
                    className="w-10"
                  />
                </label>
              );
            })}
          </div>
        </div>

        <label className="flex flex-col gap-1">
          <span style={{ color: "var(--label)" }}>{t("projectSettings.capoField")}</span>
          <SkeuInput
            ref={capoRef}
            type="number"
            min={0}
            max={24}
            defaultValue={project.track.capo}
            className="w-16"
            onBlur={(event) => {
              const value = Number(event.target.value);
              if (Number.isFinite(value) && value >= 0) onSetCapo(value);
            }}
          />
        </label>

        <SkeuButton onClick={onClose} className="self-end">
          {t("projectSettings.close")}
        </SkeuButton>
      </div>
    </Modal>
  );
}
