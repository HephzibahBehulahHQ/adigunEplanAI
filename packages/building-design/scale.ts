import { validateProject, type Project } from "../electrical-model/project.ts";

export function scaledPlanSize(viewBox: string, scale: number) {
  const values = viewBox
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  if (!Number.isFinite(scale) || scale < 1 || scale > 10000)
    throw new Error("Drawing scale must be between 1:1 and 1:10000");
  if (
    values.length !== 4 ||
    values.some((n) => !Number.isFinite(n)) ||
    values[2] <= 0 ||
    values[3] <= 0
  )
    throw new Error("Invalid plan view box");
  return { widthMm: values[2] / scale, heightMm: values[3] / scale };
}

export function setFloorDrawingScale(
  project: Project,
  floorId: string,
  scale: number,
): Project {
  const next = structuredClone(project);
  const floor = next.floors.find((f) => f.id === floorId);
  if (!floor) throw new Error("Unknown floor");
  floor.drawingScale = scale;
  return validateProject(next);
}
