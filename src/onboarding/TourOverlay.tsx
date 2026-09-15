import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "../editor/ui/Modal";
import { SkeuButton } from "../editor/ui/SkeuButton";

const STEP_KEYS = ["addNote", "applyEffect", "export"] as const;

/**
 * Section 16: "İlk kez editöre girildiğinde üç adımlık kısa bir ipucu dizisi gösterilir...
 * Atlanabilir ve bir daha gösterilmez." Shown once, ever — App.tsx gates it with
 * tourStorage.hasSeenTour()/markTourSeen() and never mounts it again after this closes.
 */
export function TourOverlay({ onFinish }: { onFinish: () => void }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const stepKey = STEP_KEYS[step];
  const isLast = step === STEP_KEYS.length - 1;

  return (
    <Modal title={t(`tour.${stepKey}.title`)} onClose={onFinish} width={380}>
      <p style={{ color: "var(--control-text)" }}>{t(`tour.${stepKey}.body`)}</p>

      <div className="flex items-center justify-between">
        <span style={{ color: "var(--label)" }}>{t("tour.stepCount", { current: step + 1, total: STEP_KEYS.length })}</span>
        <div className="flex gap-2">
          <SkeuButton onClick={onFinish}>{t("tour.skip")}</SkeuButton>
          <SkeuButton onClick={() => (isLast ? onFinish() : setStep((value) => value + 1))}>
            {isLast ? t("tour.done") : t("tour.next")}
          </SkeuButton>
        </div>
      </div>
    </Modal>
  );
}
