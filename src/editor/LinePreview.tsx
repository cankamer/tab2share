import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Project } from "../model/types";
import { computeExportPages, renderExportPage, type ExportOptions } from "../export/exportPng";
import { SkeuButton } from "./ui/SkeuButton";

interface ExportPreviewProps {
  project: Project;
  options: ExportOptions;
}

/**
 * WYSIWYG export preview (section 14 revision): renders through the exact same
 * computeExportPages()/renderExportPage() pipeline the real export uses, at 1x — what's shown
 * here is pixel-for-pixel what gets written to disk, Tab Sheet's A4 page shape included,
 * instead of a disconnected free-width approximation.
 */
export function ExportPreview({ project, options }: ExportPreviewProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const isSheet = options.sizeMode.kind === "reel";

  const pages = computeExportPages(project, options);
  const pageCount = pages.length;
  const clampedIndex = Math.min(pageIndex, Math.max(0, pageCount - 1));

  useEffect(() => {
    setPageIndex(0);
  }, [project, options.sizeMode, options.outputTheme]);

  // Tab Sheet has no horizontal scroll of its own (one page fills the column) — a horizontal
  // wheel device (e.g. the MX Master 3S's side thumb-wheel) turns pages instead. Accumulate
  // ticks and step one page per "notch" rather than per wheel event, so a single flick doesn't
  // skip several pages at once.
  useEffect(() => {
    if (!isSheet || pageCount <= 1) return;
    const wrapper = scrollWrapperRef.current;
    if (!wrapper) return;

    let accumulated = 0;
    let cooling = false;

    const onWheel = (event: WheelEvent) => {
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (delta === 0) return;
      event.preventDefault();
      if (cooling) return;

      accumulated += delta;
      const threshold = 40;
      if (accumulated >= threshold) {
        accumulated = 0;
        setPageIndex((i) => Math.min(pageCount - 1, i + 1));
      } else if (accumulated <= -threshold) {
        accumulated = 0;
        setPageIndex((i) => Math.max(0, i - 1));
      } else {
        return;
      }

      cooling = true;
      window.setTimeout(() => {
        cooling = false;
      }, 220);
    };

    wrapper.addEventListener("wheel", onWheel, { passive: false });
    return () => wrapper.removeEventListener("wheel", onWheel);
  }, [isSheet, pageCount]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const page = pages[clampedIndex];
    if (!page) {
      container.replaceChildren();
      return;
    }

    const canvas = renderExportPage(project, page, options);
    canvas.style.display = "block";
    if (isSheet) {
      // A4 page: fit it to the preview column, aspect ratio comes free from the canvas's own
      // intrinsic pixel size.
      canvas.style.width = "100%";
      canvas.style.height = "auto";
      canvas.style.maxWidth = "420px";
      canvas.style.margin = "0 auto";
    } else {
      // For Video strip: fixed line height, natural width — scrolls horizontally instead of
      // shrinking illegibly.
      canvas.style.width = "auto";
      canvas.style.height = "auto";
    }

    container.replaceChildren(canvas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, options, clampedIndex, isSheet]);

  return (
    <div className="raised flex flex-col gap-3 rounded-2xl p-4 text-xs">
      {isSheet && pageCount > 1 ? (
        <div className="flex items-center justify-center gap-2">
          <SkeuButton
            onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
            disabled={clampedIndex === 0}
            title={t("exportPreview.prevPage")}
          >
            ‹
          </SkeuButton>
          <span style={{ color: "var(--label)" }}>
            {t("exportPreview.page", { current: clampedIndex + 1, total: pageCount })}
          </span>
          <SkeuButton
            onClick={() => setPageIndex((i) => Math.min(pageCount - 1, i + 1))}
            disabled={clampedIndex === pageCount - 1}
            title={t("exportPreview.nextPage")}
          >
            ›
          </SkeuButton>
        </div>
      ) : null}

      <div
        ref={scrollWrapperRef}
        className="inset overflow-auto rounded-xl p-2"
        style={{
          maxHeight: isSheet ? 560 : 350,
          backgroundImage:
            "linear-gradient(45deg, #808080 25%, transparent 25%), linear-gradient(-45deg, #808080 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #808080 75%), linear-gradient(-45deg, transparent 75%, #808080 75%)",
          backgroundSize: "16px 16px",
          backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
          backgroundColor: "#c0c0c0",
        }}
      >
        <div ref={containerRef} />
      </div>
    </div>
  );
}
