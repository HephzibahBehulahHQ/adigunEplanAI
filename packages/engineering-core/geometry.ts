export type Point = { x: number; y: number };
export function snap(value: number, grid: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(grid) || grid <= 0)
    throw new Error("Invalid grid coordinate");
  return Math.round(value / grid) * grid;
}
export function transform(
  local: Point,
  position: Point,
  rotation: number,
  mirrored = false,
): Point {
  const x = mirrored ? -local.x : local.x;
  const y = local.y;
  switch (rotation) {
    case 0:
      return { x: position.x + x, y: position.y + y };
    case 90:
      return { x: position.x - y, y: position.y + x };
    case 180:
      return { x: position.x - x, y: position.y - y };
    case 270:
      return { x: position.x + y, y: position.y - x };
    default:
      throw new Error("Rotation must be orthogonal");
  }
}
