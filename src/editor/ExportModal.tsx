import { useRef } from "react";
import { useTranslation } from "react-i18next";
import type { Project } from "../model/types";
import type { LineBreakMode } from "../render/lineLayout";
import { Modal } from "./ui/Modal";
import { LinePreview } from "./LinePreview";
import { ExportPanel, type ExportPanelHandle } from "./ExportPanel";

interface ExportModalProps {
  project: Project;
  lineBreakMode: LineBreakMode;
  onLineBreakModeChange: (mode: LineBreakMode) => void;
  onClose: () => void;
}

/**
 * Export Modal Popup Screen (Section 14 & UI Polish):
 * Opens as a dedicated pop-up dialog showing the live PNG preview with line breaking
 * options, resolution scale, title block toggle, and download / copy actions.
 */
export function ExportModal({
  project,
  lineBreakMode,
  onLineBreakModeChange,
  onClose,
}: ExportModalProps) {
  const { t } = useTranslation();
  const exportPanelRef = useRef<ExportPanelHandle>(null);

  return (
    <Modal title={t("exportPanel.title", "Export PNG")} onClose={onClose} width={880}>
      <div className="flex flex-col gap-4">
        {/* Live Line Preview */}
        <LinePreview project={project} />

        {/* Export Controls & Action Buttons */}
        <ExportPanel
          ref={exportPanelRef}
          project={project}
          lineBreakMode={lineBreakMode}
          onLineBreakModeChange={onLineBreakModeChange}
        />
      </div>
    </Modal>
  );
}
