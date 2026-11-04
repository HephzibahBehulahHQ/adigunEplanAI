import type { Point } from "./geometry.ts";

/** Includes the boundary; tests an annotation anchor, not an equipment footprint. */
export function pointInPolygon(p: Point, boundary: readonly Point[]): boolean {
  if (boundary.length < 3 || !Number.isFinite(p.x) || !Number.isFinite(p.y))
    return false;
  let inside = false;
  for (let i = 0, j = boundary.length - 1; i < boundary.length; j = i++) {
    const a = boundary[j],
      b = boundary[i];
    const cross = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
    const tolerance =
      1e-8 * Math.max(1, Math.abs(b.x - a.x), Math.abs(b.y - a.y));
    if (
      Math.abs(cross) <= tolerance &&
      p.x >= Math.min(a.x, b.x) - 1e-8 &&
      p.x <= Math.max(a.x, b.x) + 1e-8 &&
      p.y >= Math.min(a.y, b.y) - 1e-8 &&
      p.y <= Math.max(a.y, b.y) + 1e-8
    )
      return true;
    if (
      a.y > p.y !== b.y > p.y &&
      p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x
    )
      inside = !inside;
  }
  return inside;
}
