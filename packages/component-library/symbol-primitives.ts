import type { Project } from "../electrical-model/project.ts";
type Shape = NonNullable<
  Project["symbolDefinitions"][number]["artwork"]
>[number];
export const line = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): Shape => ({
  kind: "line",
  from: { x: x1, y: y1 },
  to: { x: x2, y: y2 },
});
export const circle = (x: number, y: number, r: number): Shape => ({
  kind: "circle",
  center: { x, y },
  radiusMm: r,
});
export const pin = (
  id: string,
  x: number,
  y: number,
  kind: Project["terminals"][number]["kind"] = "power",
  terminalGroup?: string,
) => ({
  id,
  position: { x, y },
  kind,
  ...(terminalGroup ? { terminalGroup } : {}),
});
export const rect = (
  left: number,
  top: number,
  right: number,
  bottom: number,
): Shape[] => [
  line(left, top, right, top),
  line(right, top, right, bottom),
  line(right, bottom, left, bottom),
  line(left, bottom, left, top),
];
export const openPole = (y: number, edge: number): Shape[] => [
  line(-edge, y, -5, y),
  circle(-5, y, 0.6),
  line(-5, y, 5, y - 5),
  circle(7, y, 0.6),
  line(7, y, edge, y),
];
