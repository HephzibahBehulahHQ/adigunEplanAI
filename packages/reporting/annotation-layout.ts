/** Approximate sans-serif wrapping in native millimetres. Keeps every grapheme
 * and explicit paragraph; this is presentation, never a project-data edit. */
const graphemes = new Intl.Segmenter(undefined, { granularity: "grapheme" });
export function annotationLayout(
  text: string,
  x: number,
  y: number,
  pageWidthMm: number,
  pageHeightMm: number,
  fontSizeMm = 3.5,
) {
  if (
    ![x, y, pageWidthMm, pageHeightMm, fontSizeMm].every(Number.isFinite) ||
    pageWidthMm <= 0 ||
    pageHeightMm <= 0 ||
    fontSizeMm <= 0
  )
    throw new Error("Invalid annotation dimensions");
  const widthMm = Math.max(fontSizeMm * 0.6, pageWidthMm - 8 - x);
  const capacity = Math.max(1, Math.floor(widthMm / (fontSizeMm * 0.6)));
  const lines: string[] = [];
  for (const paragraph of text.replace(/\r\n/g, "\n").split("\n")) {
    const remaining = Array.from(
      graphemes.segment(paragraph),
      (item) => item.segment,
    );
    while (remaining.length > capacity) {
      let cut = capacity;
      for (let i = capacity; i > capacity * 0.6; i--) {
        if (/\s/u.test(remaining[i - 1])) {
          cut = i;
          break;
        }
      }
      lines.push(remaining.splice(0, cut).join(""));
    }
    lines.push(remaining.join(""));
  }
  const lineHeightMm = fontSizeMm * 1.35;
  const overflow =
    x < 8 ||
    x >= pageWidthMm - 8 ||
    y < 8 ||
    y + (lines.length - 1) * lineHeightMm > pageHeightMm - 24;
  return { lines, lineHeightMm, fontSizeMm, overflow };
}
