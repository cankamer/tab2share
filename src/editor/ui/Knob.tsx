import { useRef, useEffect } from "react";

interface KnobProps {
  value: number;
  min: number;
  max: number;
  size?: number;
  onChange?: (value: number) => void;
}

const START_ANGLE = -135;
const SWEEP_DEGREES = 270;

export function Knob({ value, min, max, size = 36, onChange }: KnobProps) {
  const fraction = max > min ? Math.max(0, Math.min(1, (value - min) / (max - min))) : 0;
  const angle = START_ANGLE + fraction * SWEEP_DEGREES;

  const startDragRef = useRef<{ startY: number; startVal: number } | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!startDragRef.current || !onChange) return;
      const { startY, startVal } = startDragRef.current;
      const deltaY = startY - e.clientY;
      // Adjust multiplier if it's too fast/slow. 1px = 1 unit is usually fine for tempo.
      let newVal = Math.round(startVal + deltaY);
      newVal = Math.max(min, Math.min(max, newVal));
      onChange(newVal);
    };

    const handleMouseUp = () => {
      startDragRef.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [min, max, onChange]);

  return (
    <div className="flex flex-col items-center" style={{ width: size + 16 }}>
      <div 
        className="raised relative rounded-full" 
        style={{ width: size, height: size, cursor: onChange ? "ns-resize" : "default" }}
        onMouseDown={(e) => {
          if (!onChange) return;
          startDragRef.current = { startY: e.clientY, startVal: value };
          e.preventDefault(); // prevent text selection while dragging
        }}
      >
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            width: 2,
            height: size * 0.38,
            background: "var(--accent)",
            transformOrigin: "bottom center",
            transform: `translate(-50%, -100%) rotate(${angle}deg)`,
          }}
        />
      </div>
      <div className="mt-1 flex w-full justify-between text-[9px]" style={{ color: "var(--label)" }}>
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
