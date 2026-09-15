import { useTranslation } from "react-i18next";

interface WelcomeScreenProps {
  onNewProject: () => void;
  onOpenProject: () => void;
  onOpenExample: () => void;
}

/**
 * Section 16: the app never opens straight into an empty editor — an empty editor is a screen
 * where the user doesn't know what to do. "Örnek projeyi aç" is the important one ("kullanıcı
 * hiçbir şey yazmadan, uygulamanın ne ürettiğini görür"), so it's the visually prominent card
 * — wider, accent-bordered — rather than one of three equal buttons.
 */
export function WelcomeScreen({ onNewProject, onOpenProject, onOpenExample }: WelcomeScreenProps) {
  const { t } = useTranslation();

  return (
    <main
      className="flex h-screen w-screen flex-col items-center justify-center gap-8 p-6"
      style={{ background: "var(--body)" }}
    >
      <div className="text-center">
        <h1 className="text-2xl font-bold" style={{ color: "var(--control-text)" }}>
          {t("welcome.title")}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--label)" }}>
          {t("welcome.subtitle")}
        </p>
      </div>

      <div className="flex w-full max-w-3xl flex-col gap-4 sm:flex-row">
        <button
          type="button"
          onClick={onOpenExample}
          className="raised flex-[1.3] rounded-xl p-5 text-left transition-transform"
          style={{ border: "1.5px solid var(--accent)" }}
        >
          <div className="text-sm font-bold" style={{ color: "var(--accent)" }}>
            {t("welcome.openExample.title")}
          </div>
          <p className="mt-1 text-xs" style={{ color: "var(--label)" }}>
            {t("welcome.openExample.description")}
          </p>
        </button>

        <button
          type="button"
          onClick={onNewProject}
          className="raised flex-1 rounded-xl p-5 text-left"
          style={{ border: "1px solid transparent" }}
        >
          <div className="text-sm font-bold" style={{ color: "var(--control-text)" }}>
            {t("welcome.newProject.title")}
          </div>
          <p className="mt-1 text-xs" style={{ color: "var(--label)" }}>
            {t("welcome.newProject.description")}
          </p>
        </button>

        <button
          type="button"
          onClick={onOpenProject}
          className="raised flex-1 rounded-xl p-5 text-left"
          style={{ border: "1px solid transparent" }}
        >
          <div className="text-sm font-bold" style={{ color: "var(--control-text)" }}>
            {t("welcome.openProject.title")}
          </div>
          <p className="mt-1 text-xs" style={{ color: "var(--label)" }}>
            {t("welcome.openProject.description")}
          </p>
        </button>
      </div>
    </main>
  );
}
