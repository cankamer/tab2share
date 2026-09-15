import type { Beat, Project } from "../model/types";
import { isStandardTuning } from "../model/tunings";
import type { LineLayoutLine } from "./lineLayout";
import { drawCapoLabel, drawChordLabel, drawFlagRuns, drawNote, drawRhythmStem, resolveHammerDirection } from "./drawTab";
import {
  BOTTOM_MARGIN,
  EFFECT_ROW_GAP,
  EFFECT_ROW_HEIGHT,
  LIGHT_PALETTE,
  LINE_GAP,
  STEM_GAP_BELOW_TAB,
  STEM_LENGTH,
  STRING_COUNT,
  STRING_SPACING,
  TAB_TOP_MARGIN,
  TUNING_LABEL_FONT,
  WATERMARK_FONT,
  WATERMARK_MARGIN,
  WATERMARK_OPACITY,
  WATERMARK_TEXT,
} from "./constants";

// Section 10.2's render theme is independent of the app's own (section 10.1) theme — this
// module is only ever the export/preview canvas, so it always uses the light palette.
const PALETTE = LIGHT_PALETTE;

export function singleLineHeight(): number {
  const tabBottomY = TAB_TOP_MARGIN + (STRING_COUNT - 1) * STRING_SPACING;
  const stemBaselineY = tabBottomY + STEM_GAP_BELOW_TAB;
  const palmMuteRowY = stemBaselineY + STEM_LENGTH + EFFECT_ROW_GAP;
  const letRingRowY = palmMuteRowY + EFFECT_ROW_HEIGHT;
  return letRingRowY + EFFECT_ROW_HEIGHT + BOTTOM_MARGIN;
}

export function computePreviewSize(lines: LineLayoutLine[], topOffset = 0): { width: number; height: number } {
  const width = lines.reduce((max, line) => Math.max(max, line.width), 0);
  const lineHeight = singleLineHeight();
  const contentHeight =
    lines.length === 0 ? lineHeight : lines.length * lineHeight + (lines.length - 1) * LINE_GAP;
  return { width, height: topOffset + contentHeight };
}

export interface DrawLinePreviewOptions {
  /** Live editor preview wants an opaque page behind the tab; export wants alpha (section 14). */
  opaqueBackground?: boolean;
  /** Reserved blank space above the first line — where a future title block would go, so
   * `availableLines` (fewer lines when it's on) has somewhere to point. */
  topOffset?: number;
}

/**
 * Read-only multi-line render for the export preview (section 14): each LineLayoutLine gets
 * its own string lines, barlines, tuning labels, and effect rows, stacked with LINE_GAP
 * between them. Reuses drawTab.ts's per-note/beat primitives — cursor/selection don't apply
 * to a read-only preview, so this is simpler than the live editor canvas.
 */
export function drawLinePreview(
  ctx: CanvasRenderingContext2D,
  project: Project,
  lines: LineLayoutLine[],
  options: DrawLinePreviewOptions = {},
): void {
  const topOffset = options.topOffset ?? 0;
  const { width, height } = computePreviewSize(lines, topOffset);

  if (options.opaqueBackground ?? true) {
    ctx.fillStyle = PALETTE.background;
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.clearRect(0, 0, width, height);
  }

  const nonStandardTuning = !isStandardTuning(project.track.tuning);
  const lineHeight = singleLineHeight();
  // Hammer direction must see past a line's own boundary, into the track's true musical order.
  const globalFlatBeats: { beat: Beat }[] = project.track.measures.flatMap((measure) =>
    measure.beats.map((beat) => ({ beat })),
  );

  lines.forEach((line, lineIndex) => {
    drawSingleLine(
      ctx,
      project,
      line,
      topOffset + lineIndex * (lineHeight + LINE_GAP),
      nonStandardTuning,
      globalFlatBeats,
    );
  });

  drawCapoLabel(ctx, project.track.capo, PALETTE);
}

function drawSingleLine(
  ctx: CanvasRenderingContext2D,
  project: Project,
  line: LineLayoutLine,
  offsetY: number,
  nonStandardTuning: boolean,
  globalFlatBeats: { beat: Beat }[],
) {
  const stringY = Array.from({ length: STRING_COUNT }, (_, row) => offsetY + TAB_TOP_MARGIN + row * STRING_SPACING);
  const tabTopY = stringY[0];
  const tabBottomY = stringY[STRING_COUNT - 1];
  const stemBaselineY = tabBottomY + STEM_GAP_BELOW_TAB;
  const palmMuteRowY = stemBaselineY + STEM_LENGTH + EFFECT_ROW_GAP;
  const letRingRowY = palmMuteRowY + EFFECT_ROW_HEIGHT;

  const lineEndX = line.measures.length > 0 ? line.measures[line.measures.length - 1].endX : 0;

  ctx.strokeStyle = PALETTE.stringLine;
  ctx.lineWidth = 1;
  stringY.forEach((y) => {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(lineEndX, y);
    ctx.stroke();
  });

  ctx.font = TUNING_LABEL_FONT;
  ctx.fillStyle = PALETTE.tuningLabel;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  stringY.forEach((y, row) => ctx.fillText(project.track.tuning[5 - row], 2, y));

  ctx.strokeStyle = PALETTE.barline;
  ctx.lineWidth = 1;
  const drawBarline = (x: number) => {
    ctx.beginPath();
    ctx.moveTo(x, tabTopY);
    ctx.lineTo(x, tabBottomY);
    ctx.stroke();
  };
  line.measures.forEach((measure) => drawBarline(measure.startX));
  if (line.measures.length > 0) drawBarline(lineEndX);

  const flatBeats = line.measures.flatMap((measure) => measure.beats);

  for (const measure of line.measures) {
    for (const { beat, x, flatIndex } of measure.beats) {
      drawRhythmStem(ctx, x, stemBaselineY, beat, PALETTE);
      if (beat.chordRef) drawChordLabel(ctx, x, tabTopY, beat.chordRef, nonStandardTuning, PALETTE);

      if (beat.isRest) continue;
      for (const note of beat.notes) {
        const y = stringY[note.string - 1];
        const hammerDirection = note.hammer
          ? resolveHammerDirection(globalFlatBeats, flatIndex, note.string, note.fret)
          : null;
        drawNote(ctx, x, y, note, hammerDirection, PALETTE);
      }
    }
  }

  drawFlagRuns(ctx, flatBeats, palmMuteRowY, "PM", (beat) => Boolean(beat.palmMute), PALETTE);
  drawFlagRuns(ctx, flatBeats, letRingRowY, "let ring", (beat) => Boolean(beat.letRing), PALETTE);
}

/** Section 14: small, low-opacity mark in a corner of the exported image, default on. */
export function drawWatermark(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
  ctx.save();
  ctx.globalAlpha = WATERMARK_OPACITY;
  ctx.font = WATERMARK_FONT;
  ctx.fillStyle = PALETTE.tuningLabel;
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillText(WATERMARK_TEXT, canvasWidth - WATERMARK_MARGIN, canvasHeight - WATERMARK_MARGIN);
  ctx.restore();
}
