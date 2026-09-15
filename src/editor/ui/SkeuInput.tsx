import { forwardRef, type InputHTMLAttributes } from "react";

/**
 * Section 10.1: numeric/text entry that isn't knob-shaped gets a recessed `.inset` groove
 * (the value sits sunk into the body, like a real digit well) rather than a plain gray box,
 * so it reads as part of the same physical control language.
 */
export const SkeuInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function SkeuInput({ className, style, ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={`inset rounded-lg px-2 py-1.5 text-sm font-medium ${className ?? ""}`}
        style={{ border: "1px solid transparent", color: "var(--control-text)", ...style }}
        {...rest}
      />
    );
  },
);
