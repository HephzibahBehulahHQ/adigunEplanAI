import type { Point } from "../engineering-core/geometry.ts";
export type Affine = readonly [number, number, number, number, number, number];
export const identity: Affine = [1, 0, 0, 1, 0, 0];
function checked(matrix: Affine): Affine {
  const determinant = matrix[0] * matrix[3] - matrix[1] * matrix[2];
  if (
    matrix.some((v) => !Number.isFinite(v)) ||
    !Number.isFinite(determinant) ||
    determinant === 0
  )
    throw new Error("Nonfinite or singular SVG transform");
  return matrix;
}
// Column-vector convention: parent × child applies child first.
export function multiplyAffine(a: Affine, b: Affine): Affine {
  return checked([
    a[0] * b[0] + a[2] * b[1],
    a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3],
    a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4],
    a[1] * b[4] + a[3] * b[5] + a[5],
  ]);
}
export function transformPoint(matrix: Affine, p: Point): Point {
  return {
    x: matrix[0] * p.x + matrix[2] * p.y + matrix[4],
    y: matrix[1] * p.x + matrix[3] * p.y + matrix[5],
  };
}
export function parseSvgTransform(value: string | null): Affine {
  if (value !== null && value.length > 16384)
    throw new Error("SVG transform exceeds 16 KiB");
  if (!value?.trim()) return identity;
  let rest = value.trim(),
    result: Affine = identity,
    count = 0;
  const number = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;
  while (rest) {
    if (++count > 256) throw new Error("SVG transform exceeds 256 operations");
    const match = /^([A-Za-z]+)\s*\(([^()]*)\)/.exec(rest);
    if (!match) throw new Error("Invalid SVG transform syntax");
    const raw = match[2].trim().split(/[\s,]+/);
    if (raw.some((v) => !number.test(v)) || /^,|,$|,\s*,/.test(match[2].trim()))
      throw new Error("Invalid SVG transform parameters");
    const v = raw.map(Number);
    if (v.some((n) => !Number.isFinite(n)))
      throw new Error("Nonfinite SVG transform parameter");
    let next: Affine;
    switch (match[1]) {
      case "matrix":
        if (v.length !== 6) throw new Error("matrix requires six parameters");
        next = checked(v as unknown as Affine);
        break;
      case "translate":
        if (v.length < 1 || v.length > 2)
          throw new Error("translate requires one or two parameters");
        next = [1, 0, 0, 1, v[0], v[1] ?? 0];
        break;
      case "scale":
        if (v.length < 1 || v.length > 2)
          throw new Error("scale requires one or two parameters");
        next = checked([v[0], 0, 0, v[1] ?? v[0], 0, 0]);
        break;
      case "rotate": {
        if (v.length !== 1 && v.length !== 3)
          throw new Error("rotate requires one or three parameters");
        const angle = ((v[0] % 360) * Math.PI) / 180,
          c = Math.cos(angle),
          s = Math.sin(angle),
          cx = v[1] ?? 0,
          cy = v[2] ?? 0;
        next = [c, s, -s, c, cx - c * cx + s * cy, cy - s * cx - c * cy];
        break;
      }
      case "skewX":
      case "skewY": {
        if (v.length !== 1 || Math.abs(v[0] % 180) === 90)
          throw new Error("Invalid SVG skew angle");
        const tangent = Math.tan(((v[0] % 180) * Math.PI) / 180);
        next =
          match[1] === "skewX"
            ? [1, 0, tangent, 1, 0, 0]
            : [1, tangent, 0, 1, 0, 0];
        break;
      }
      default:
        throw new Error(`Unsupported SVG transform ${match[1]}`);
    }
    result = multiplyAffine(result, next);
    rest = rest.slice(match[0].length).trimStart();
    if (rest.startsWith(",")) {
      rest = rest.slice(1).trimStart();
      if (!rest) throw new Error("Trailing SVG transform separator");
    }
  }
  return result;
}
