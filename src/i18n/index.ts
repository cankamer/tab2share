import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";
import tr from "./tr.json";

export type AppLanguage = "en" | "tr";

const STORAGE_KEY = "tab2share-language";

/** Section 11: first launch guesses from the Windows system locale, then the user picks explicitly. */
function detectLanguage(): AppLanguage {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "tr") return stored;
  } catch {
    // Per-viewer convenience only; fall through to system detection.
  }
  return navigator.language.toLowerCase().startsWith("tr") ? "tr" : "en";
}

export function setLanguage(language: AppLanguage): void {
  i18next.changeLanguage(language);
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Per-viewer convenience only; fine if it doesn't persist.
  }
}

void i18next.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    tr: { translation: tr },
  },
  lng: detectLanguage(),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18next;
