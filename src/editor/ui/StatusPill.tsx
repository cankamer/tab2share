import type { ReactNode } from "react";

/** Section 10.1's "Durum hapı": dark-backed small label, e.g. "4/4", "120 BPM". */
export function StatusPill({ children }: { children: ReactNode }) {
  return <span className="status-pill">{children}</span>;
}
