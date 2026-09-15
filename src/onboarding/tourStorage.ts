const STORAGE_KEY = "tab2share-onboarding-seen";

/** Section 16: the 3-step hint tour is shown once, ever, the first time the editor is entered. */
export function hasSeenTour(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markTourSeen(): void {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // Per-viewer convenience only; fine if it doesn't persist — worst case the tour reappears.
  }
}
