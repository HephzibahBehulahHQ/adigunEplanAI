import { validateProject, type Project } from "../electrical-model/project.ts";
import type { Point } from "../engineering-core/geometry.ts";
export function addPlanLayer(
  project: Project,
  floorId: string,
  name: string,
  kind: "architectural" | "electrical",
): Project {
  const next = structuredClone(project);
  next.architecturalLayers.push({
    id: crypto.randomUUID(),
    floorId,
    name,
    kind,
    visible: true,
    locked: false,
  });
  return validateProject(next);
}
export function setPlanLayer(
  project: Project,
  layerId: string,
  change: { visible?: boolean; locked?: boolean },
): Project {
  const next = structuredClone(project);
  const layer = next.architecturalLayers.find((l) => l.id === layerId);
  if (!layer) throw new Error("Unknown plan layer");
  if (change.visible !== undefined) layer.visible = change.visible;
  if (change.locked !== undefined) layer.locked = change.locked;
  return validateProject(next);
}
function editableLayer(project: Project, layerId: string) {
  const layer = project.architecturalLayers.find((l) => l.id === layerId);
  if (
    !layer ||
    layer.kind !== "architectural" ||
    !layer.visible ||
    layer.locked
  )
    throw new Error("Wall layer must be visible and unlocked");
  return layer;
}
export function addWall(
  project: Project,
  layerId: string,
  name: string,
  start: Point,
  end: Point,
  thicknessMm: number,
  heightMm: number,
): Project {
  const layer = editableLayer(project, layerId);
  const next = structuredClone(project);
  next.walls.push({
    id: crypto.randomUUID(),
    floorId: layer.floorId,
    layerId,
    name,
    start: { ...start },
    end: { ...end },
    thicknessMm,
    heightMm,
  });
  return validateProject(next);
}
export function removeWall(project: Project, wallId: string): Project {
  const wall = project.walls.find((w) => w.id === wallId);
  if (!wall) throw new Error("Unknown wall");
  editableLayer(project, wall.layerId);
  const next = structuredClone(project);
  next.walls = next.walls.filter((w) => w.id !== wallId);
  return validateProject(next);
}
export function wallFootprint(wall: Project["walls"][number]): Point[] {
  const dx = wall.end.x - wall.start.x,
    dy = wall.end.y - wall.start.y,
    length = Math.hypot(dx, dy);
  if (
    !Number.isFinite(length) ||
    length <= 0 ||
    !Number.isFinite(wall.thicknessMm) ||
    wall.thicknessMm <= 0
  )
    throw new Error("Invalid wall geometry");
  const ox = ((-dy / length) * wall.thicknessMm) / 2,
    oy = ((dx / length) * wall.thicknessMm) / 2;
  return [
    { x: wall.start.x + ox, y: wall.start.y + oy },
    { x: wall.end.x + ox, y: wall.end.y + oy },
    { x: wall.end.x - ox, y: wall.end.y - oy },
    { x: wall.start.x - ox, y: wall.start.y - oy },
  ];
}
