import { useEffect, useRef } from "react";
import type { Project } from "../model/types";
import { computeLayout, hitTest } from "./layout";
import { drawTab, type EditorVisual } from "./drawTab";
import { LIGHT_PALETTE, SCREEN_PALETTE } from "./constants";
import { useResolvedTheme } from "../theme";

interface TabCanvasProps {
  project: Project;
  visual?: EditorVisual;
  onCellClick?: (flatIndex: number, string: 1 | 2 | 3 | 4 | 5 | 6) => void;
  /** Section 9.2's chord-name warning: fires with the hovered beat's flatIndex, or null off it. */
  onCellHover?: (flatIndex: number | null) => void;
  onDeleteMeasure?: (measureIndex: number) => void;
}

/** Canvas render of a Project's tab. Painting is read-only; `onCellClick`/`onCellHover` are the only interaction. */
export function TabCanvas({ project, visual, onCellClick, onCellHover, onDeleteMeasure }: TabCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const theme = useResolvedTheme();
  const layout = computeLayout(project);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = layout.width * dpr;
    canvas.height = layout.height * dpr;
    canvas.style.width = `${layout.width}px`;
    canvas.style.height = `${layout.height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    drawTab(ctx, project, layout, theme === "light" ? LIGHT_PALETTE : SCREEN_PALETTE, visual);
  }, [project, visual, theme, layout]);

  function handleClick(event: React.MouseEvent<HTMLCanvasElement>) {
    if (!onCellClick) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const hit = hitTest(layout, event.clientX - rect.left, event.clientY - rect.top);
    if (hit) onCellClick(hit.flatIndex, hit.string);
  }

  function handleMouseMove(event: React.MouseEvent<HTMLCanvasElement>) {
    if (!onCellHover) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const hit = hitTest(layout, event.clientX - rect.left, event.clientY - rect.top);
    onCellHover(hit ? hit.flatIndex : null);
  }

  return (
    <div className="relative inline-block group/canvas">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => onCellHover?.(null)}
        className={`rounded-l-none rounded-r-lg ${onCellClick ? "cursor-pointer" : ""}`}
      />
      {onDeleteMeasure && project.track.measures.length > 1 ? (
        <div className="absolute inset-0 pointer-events-none">
          {layout.measures.map((measure, index) => {
            const centerX = (measure.startX + measure.endX) / 2;
            return (
              <button
                key={index}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteMeasure(index);
                }}
                title={`Ölçü ${index + 1} Sil`}
                className="raised absolute pointer-events-auto flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full text-xs font-bold text-red-500 opacity-0 transition-all duration-200 group-hover/canvas:opacity-100 hover:scale-115 hover:bg-red-50 hover:text-red-700 active:scale-95 shadow-md"
                style={{ left: centerX, bottom: 30 }}
              >
                ✕
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
