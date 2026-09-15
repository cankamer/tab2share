import { useTranslation } from "react-i18next";
import { Modal } from "../editor/ui/Modal";
import { SkeuButton } from "../editor/ui/SkeuButton";

interface InfoModalProps {
  title: string;
  body: string;
  onClose: () => void;
}

/** Help > Getting started / Tab notation guide (section 8): plain static reference text. */
export function InfoModal({ title, body, onClose }: InfoModalProps) {
  const { t } = useTranslation();

  return (
    <Modal title={title} onClose={onClose} width={420}>
      <p className="leading-relaxed" style={{ color: "var(--control-text)" }}>
        {body}
      </p>
      <SkeuButton onClick={onClose} className="self-end">
        {t("about.close")}
      </SkeuButton>
    </Modal>
  );
}
