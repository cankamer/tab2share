import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import type { Project } from "../model/types";
import { computeLineBreaks, type LineBreakMode, type LineLayoutPage } from "../render/lineLayout";
import { computePreviewSize, drawLinePreview, drawWatermark, singleLineHeight } from "../render/drawLinePreview";
import { LINE_GAP } from "../render/constants";

/** Section 14's two size modes. Reel is a fixed 1080x1920 canvas; strip has no fixed size —
 * it's exactly as wide/tall as its single line of content. */
export type ExportSizeMode =
  | { kind: "strip" }
  | { kind: "reel"; lineBreakMode: LineBreakMode; titleBlockEnabled: boolean };

export type ResolutionScale = 1 | 2 | 3;

export interface ExportOptions {
  sizeMode: ExportSizeMode;
  resolutionScale: ResolutionScale;
  watermark: boolean;
}

const REEL_WIDTH = 1080;
const REEL_HEIGHT = 1920;
const REEL_LINES_WITH_TITLE = 3;
const REEL_LINES_WITHOUT_TITLE = 4;

/** No title-block UI exists yet (that's later) — this is just the space it will reserve,
 * matching the "4 lines drops to 3" rule so the two stay consistent once it's built. */
function titleBlockReservedHeight(): number {
  return singleLineHeight() + LINE_GAP;
}

export function computeExportPages(project: Project, options: ExportOptions): LineLayoutPage[] {
  if (options.sizeMode.kind === "strip") {
    return computeLineBreaks(project, { kind: "natural" }, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
  }
  const availableLines = options.sizeMode.titleBlockEnabled ? REEL_LINES_WITH_TITLE : REEL_LINES_WITHOUT_TITLE;
  return computeLineBreaks(project, options.sizeMode.lineBreakMode, REEL_WIDTH, availableLines);
}

function topOffsetFor(options: ExportOptions): number {
  return options.sizeMode.kind === "reel" && options.sizeMode.titleBlockEnabled ? titleBlockReservedHeight() : 0;
}

function renderPageToCanvas(
  project: Project,
  page: LineLayoutPage,
  options: ExportOptions,
): HTMLCanvasElement {
  const topOffset = topOffsetFor(options);
  const natural = computePreviewSize(page.lines, topOffset);
  const width = options.sizeMode.kind === "reel" ? REEL_WIDTH : natural.width;
  const height = options.sizeMode.kind === "reel" ? REEL_HEIGHT : natural.height;

  const canvas = document.createElement("canvas");
  const scale = options.resolutionScale;
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  // Alpha-channel PNG (section 14): never fill an opaque page background for export.
  drawLinePreview(ctx, project, page.lines, { opaqueBackground: false, topOffset });
  if (options.watermark) drawWatermark(ctx, width, height);

  return canvas;
}

/** Section 14: one canvas per export page — a reel-square page is one PNG; strip is always one page. */
export function renderExportCanvases(project: Project, options: ExportOptions): HTMLCanvasElement[] {
  return computeExportPages(project, options).map((page) => renderPageToCanvas(project, page, options));
}

export function canvasToPngBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to encode canvas as PNG"));
        return;
      }
      blob
        .arrayBuffer()
        .then((buffer) => resolve(new Uint8Array(buffer)))
        .catch(reject);
    }, "image/png");
  });
}

export function sanitizeFilename(name: string): string {
  const cleaned = name.replace(/[\\/:*?"<>|]/g, "_").trim();
  return cleaned.length > 0 ? cleaned : "tab2share-project";
}

/** {proje}_part1.png, {proje}_part2.png, ... (section 14) — only when there's more than one page. */
function partPath(basePath: string, partIndex: number, totalParts: number): string {
  if (totalParts <= 1) return basePath;
  const dotIndex = basePath.lastIndexOf(".");
  const stem = dotIndex >= 0 ? basePath.slice(0, dotIndex) : basePath;
  const ext = dotIndex >= 0 ? basePath.slice(dotIndex) : ".png";
  return `${stem}_part${partIndex + 1}${ext}`;
}

export interface ExportResult {
  paths: string[];
}

/** Opens the native save dialog, then writes one PNG per export page (multi-part naming
 * when the tab needed more pages than fit — section 14's "otomatik küçültme yapılmaz" rule). */
export async function exportProjectToPng(project: Project, options: ExportOptions): Promise<ExportResult | null> {
  const defaultName = `${sanitizeFilename(project.title)}.png`;
  const basePath = await save({
    defaultPath: defaultName,
    filters: [{ name: "PNG Image", extensions: ["png"] }],
  });
  if (!basePath) return null;

  const canvases = renderExportCanvases(project, options);
  const paths: string[] = [];
  for (let i = 0; i < canvases.length; i++) {
    const bytes = await canvasToPngBytes(canvases[i]);
    const path = partPath(basePath, i, canvases.length);
    await writeFile(path, bytes);
    paths.push(path);
  }
  return { paths };
}
