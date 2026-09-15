import { writeImage } from "@tauri-apps/plugin-clipboard-manager";
import { Image } from "@tauri-apps/api/image";
import type { Project } from "../model/types";
import { canvasToPngBytes, renderExportCanvases, type ExportOptions } from "./exportPng";

/**
 * Ctrl+Shift+C (section 14): copies the current export settings' image straight to the
 * clipboard, no file write. Only the first page is copied when a tab needed more than one —
 * a clipboard holds one image, not a numbered series like the file export does.
 */
export async function copyExportToClipboard(project: Project, options: ExportOptions): Promise<void> {
  const canvases = renderExportCanvases(project, options);
  const first = canvases[0];
  if (!first) return;

  const pngBytes = await canvasToPngBytes(first);
  const image = await Image.fromBytes(pngBytes);
  await writeImage(image);
}
