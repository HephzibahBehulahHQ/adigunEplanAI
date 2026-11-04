import { identity, type Affine } from "./svg-transform.ts";
export const mmPerCssPixel = 25.4 / 96;
const numeric = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;
export function svgLengthPx(value: string | null): number {
  const match =
    /^\s*([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)\s*(px|mm|cm|in|pt|pc|q)?\s*$/i.exec(
      value ?? "",
    );
  if (!match)
    throw new Error(
      "SVG viewport requires absolute width and height (px, mm, cm, in, pt, pc or Q)",
    );
  const unit = (match[2] ?? "px").toLowerCase();
  const factors: Record<string, number> = {
    px: 1,
    mm: 96 / 25.4,
    cm: 96 / 2.54,
    in: 96,
    pt: 96 / 72,
    pc: 16,
    q: 96 / 101.6,
  };
  const result = Number(match[1]) * factors[unit];
  if (!Number.isFinite(result) || result <= 0 || result > 1e9)
    throw new Error("Invalid SVG viewport dimensions");
  return result;
}
/** Maps viewBox coordinates into viewport CSS pixels; physical conversion follows. */
export function svgViewportMatrix(
  width: string | null,
  height: string | null,
  viewBox: string | null,
  aspect: string | null,
): Affine {
  const w = svgLengthPx(width),
    h = svgLengthPx(height);
  if (viewBox === null) return identity;
  const parts = viewBox.trim().split(/[\s,]+/);
  if (
    parts.length !== 4 ||
    parts.some((p) => !numeric.test(p)) ||
    /^,|,$|,\s*,/.test(viewBox.trim())
  )
    throw new Error("Invalid SVG viewBox");
  const [x, y, vw, vh] = parts.map(Number);
  if (![x, y, vw, vh].every(Number.isFinite) || vw <= 0 || vh <= 0)
    throw new Error("Invalid SVG viewBox");
  const mode = (aspect ?? "xMidYMid meet").trim();
  let sx = w / vw,
    sy = h / vh,
    dx = 0,
    dy = 0;
  if (mode !== "none") {
    const match = /^x(Min|Mid|Max)Y(Min|Mid|Max)(?:\s+(meet|slice))?$/.exec(
      mode,
    );
    if (!match) throw new Error("Unsupported SVG preserveAspectRatio");
    const scale = match[3] === "slice" ? Math.max(sx, sy) : Math.min(sx, sy);
    sx = sy = scale;
    const align: Record<string, number> = { Min: 0, Mid: 0.5, Max: 1 };
    dx = (w - vw * sx) * align[match[1]];
    dy = (h - vh * sy) * align[match[2]];
  }
  const result: Affine = [sx, 0, 0, sy, dx - x * sx, dy - y * sy];
  if (result.some((v) => !Number.isFinite(v)))
    throw new Error("SVG viewport transform exceeds numeric bounds");
  return result;
}
