import { useEffect, type ReactNode } from "react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: number;
}

/**
 * Shared neumorphic dialog shell for step 12's Project Settings / Preferences / About /
 * Keyboard Shortcuts panels. Escape and a click on the backdrop both close it.
 */
export function Modal({ title, onClose, children, width = 420 }: ModalProps) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="raised flex max-h-[80vh] flex-col gap-3 overflow-auto rounded-lg p-4 text-xs"
        style={{ background: "var(--body)", width, maxWidth: "90vw" }}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-sm font-bold" style={{ color: "var(--control-text)" }}>
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
