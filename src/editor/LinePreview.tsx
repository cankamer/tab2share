import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Project } from "../model/types";
import { computeLineBreaks, type LineBreakMode } from "../render/lineLayout";
import { computePreviewSize, drawLinePreview } from "../render/drawLinePreview";
import { SkeuButton } from "./ui/SkeuButton";
import { SkeuInput } from "./ui/SkeuInput";

const MIN_MEASURES_PER_LINE = 1;
const MAX_MEASURES_PER_LINE = 8;
const MIN_LINE_WIDTH = 200;
const MAX_LINE_WIDTH = 4000;
const DEFAULT_LINE_WIDTH = 900;

/**
 * Section 14's line-breaking engine, as a live preview: "Canlı önizleme paneli, export
 * öncesi sonucu gösterir." Breaks always fall on a measure boundary. Auto mode sizes each
 * measure by content and fills a line up to the width budget (justified); fixed mode uses a
 * constant 1-8 measures/line instead. The width input stands in for step 10's real export
 * size options, which don't exist yet.
 */
export function LinePreview({ project }: { project: Project }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<LineBreakMode>({ kind: "auto" });
  const [lineWidth, setLineWidth] = useState(DEFAULT_LINE_WIDTH);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const measuresPerLine = mode.kind === "fixed" ? mode.measuresPerLine : 4;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    // The live preview never paginates — it just shows every line, scrolling if long.
    const pages = computeLineBreaks(project, mode, lineWidth, Number.POSITIVE_INFINITY);
    const lines = pages.flatMap((page) => page.lines);
    const { width, height } = computePreviewSize(lines);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, width) * dpr;
    canvas.height = Math.max(1, height) * dpr;
    canvas.style.width = `${Math.max(1, width)}px`;
    canvas.style.height = `${Math.max(1, height)}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    drawLinePreview(ctx, project, lines);
  }, [project, mode, lineWidth]);

  return (
    <div className="raised flex flex-col gap-3 rounded-2xl p-4 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <span style={{ color: "var(--label)" }}>{t("linePreview.lineBreaking")}</span>
        <SkeuButton onClick={() => setMode({ kind: "auto" })} active={mode.kind === "auto"}>
          {t("linePreview.auto")}
        </SkeuButton>
        <SkeuButton onClick={() => setMode({ kind: "fixed", measuresPerLine })} active={mode.kind === "fixed"}>
          {t("linePreview.fixed")}
        </SkeuButton>
        {mode.kind === "fixed" ? (
          <SkeuInput
            key={mode.measuresPerLine}
            type="number"
            min={MIN_MEASURES_PER_LINE}
            max={MAX_MEASURES_PER_LINE}
            defaultValue={mode.measuresPerLine}
            onBlur={(event) => {
              const raw = Number(event.target.value);
              const value = Number.isFinite(raw)
                ? Math.max(MIN_MEASURES_PER_LINE, Math.min(MAX_MEASURES_PER_LINE, raw))
                : MIN_MEASURES_PER_LINE;
              setMode({ kind: "fixed", measuresPerLine: value });
            }}
            className="w-14 text-center font-mono"
          />
        ) : null}

        <span className="mx-1" style={{ color: "var(--body-edge)" }}>
          |
        </span>

        <label className="flex items-center gap-1" style={{ color: "var(--label)" }}>
          {t("linePreview.lineWidth")}
          <SkeuInput
            key={lineWidth}
            type="number"
            min={MIN_LINE_WIDTH}
            max={MAX_LINE_WIDTH}
            defaultValue={lineWidth}
            onBlur={(event) => {
              const raw = Number(event.target.value);
              const value = Number.isFinite(raw)
                ? Math.max(MIN_LINE_WIDTH, Math.min(MAX_LINE_WIDTH, raw))
                : DEFAULT_LINE_WIDTH;
              setLineWidth(value);
            }}
            className="w-20 text-center font-mono"
          />
        </label>
      </div>

      <div className="inset overflow-auto rounded-xl p-2 max-h-[350px]">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
