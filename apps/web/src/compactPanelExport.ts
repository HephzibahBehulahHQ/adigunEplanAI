import {
  boxEdges,
  boxFaces,
  boxVertices,
  type Bounds3,
  type Vector3,
} from "../../../packages/panel-engineering/geometry.ts";

type Box = { id: string; bounds: Bounds3; wireframe: boolean };
type Outline = { id: string; points: Vector3[] };

export function compactPanelObj(boxes: Box[], outlines: Outline[]): string {
  const lines = [
    "# AdigunEplanAI panel geometry in millimetres; X right, Y down, Z back to front",
    "# Equipment and structures use envelopes; openings are reference outlines",
  ];
  let offset = 0;
  const addObject = (id: string, points: Vector3[]) => {
    lines.push(`o ${id.replace(/[^A-Za-z0-9_-]/g, "_")}`);
    for (const { x, y, z } of points) lines.push(`v ${x} ${y} ${z}`);
    const start = offset + 1;
    offset += points.length;
    return start;
  };
  for (const { id, bounds, wireframe } of boxes) {
    const start = addObject(id, boxVertices(bounds));
    const elements = wireframe
      ? boxEdges
      : boxFaces.map(({ indices }) => [...indices].reverse());
    for (const indices of elements)
      lines.push(
        `${wireframe ? "l" : "f"} ${indices.map((i) => i + start).join(" ")}`,
      );
  }
  for (const { id, points } of outlines) {
    const start = addObject(id, points);
    lines.push(`l ${points.map((_, index) => start + index).join(" ")}`);
  }
  return `${lines.join("\n")}\n`;
}
