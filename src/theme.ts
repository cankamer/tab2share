import { useEffect, useState } from "react";

export type ThemeChoice = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "tab2share-theme";
const CHANGE_EVENT = "tab2share-theme-change";

export function readStoredChoice(): ThemeChoice {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

/** Applies an explicit theme choice (or clears it, for "system") and notifies subscribers. */
export function applyThemeChoice(choice: ThemeChoice): void {
  if (choice === "system") {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = choice;
  }
  try {
    localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    // Per-viewer convenience only; fine if it doesn't persist.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * The theme every canvas-drawn (non-CSS) surface must match: explicit override first,
 * `prefers-color-scheme` otherwise. CSS-styled elements never need this — they read the
 * `--*` custom properties directly and update for free.
 */
export function getResolvedTheme(): ResolvedTheme {
  const explicit = document.documentElement.dataset.theme;
  if (explicit === "light" || explicit === "dark") return explicit;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function subscribeResolvedTheme(callback: () => void): () => void {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    media.removeEventListener("change", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

/** For canvas/JS-driven rendering that can't just read a CSS variable. */
export function useResolvedTheme(): ResolvedTheme {
  const [theme, setTheme] = useState<ResolvedTheme>(getResolvedTheme);
  useEffect(() => {
    // React fires child effects before parent effects, so ThemeToggle's own mount-time
    // applyThemeChoice (a child, since it renders before this hook's caller settles) can run
    // before this subscription exists — re-sync directly on mount rather than relying only on
    // catching that dispatched event.
    setTheme(getResolvedTheme());
    return subscribeResolvedTheme(() => setTheme(getResolvedTheme()));
  }, []);
  return theme;
}
