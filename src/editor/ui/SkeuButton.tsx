import type { ButtonHTMLAttributes } from "react";

interface SkeuButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

/**
 * Section 10.1's "Buton bloğu": a flat, body-colored surface that pops out via the matched
 * light/dark shadow pair (`.raised`), sinking in (`.inset`) on press or when selected — the
 * native `:active` pseudo-class gives the press-feedback for free. Active/selected state is
 * also marked with the red accent border + text, not the sunken shading alone (the section's
 * own accessibility note).
 */
export function SkeuButton({ active, className, style, children, ...rest }: SkeuButtonProps) {
  return (
    <button
      type="button"
      className={`${active ? "inset" : "raised"} rounded-lg px-3 py-1.5 text-sm font-medium transition-shadow ${className ?? ""}`}
      style={{
        border: active ? "1.5px solid var(--accent)" : "1px solid transparent",
        color: active ? "var(--accent)" : "var(--control-text)",
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
