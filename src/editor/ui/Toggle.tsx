interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

/**
 * Section 10.1's "Toggle": a pressed-in groove (`.inset`) with a raised disc (`.raised`)
 * sliding inside it — the pill and thumb read as one carved-and-popped shape, not a painted
 * switch. ON/OFF text carries the state too, so it isn't shadow-contrast alone.
 */
export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <label className="flex items-center gap-2 text-xs">
      <span className="inset relative inline-flex h-5 w-9 shrink-0 items-center rounded-full">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        <span
          className="raised pointer-events-none absolute h-4 w-4 rounded-full transition-transform"
          style={{
            transform: checked ? "translateX(18px)" : "translateX(2px)",
            border: checked ? "1px solid var(--accent)" : "1px solid transparent",
          }}
        />
      </span>
      <span style={{ color: checked ? "var(--accent)" : "var(--label)" }}>{checked ? "ON" : "OFF"}</span>
      {label ? <span style={{ color: "var(--label)" }}>{label}</span> : null}
    </label>
  );
}
