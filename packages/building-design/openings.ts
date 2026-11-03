import { validateProject, type Project } from "../electrical-model/project.ts";
import { editableLayer, wallFootprint } from "./walls.ts";
type Wall = Project["walls"][number];
type Opening = Project["wallOpenings"][number];
export function addWallOpening(
  project: Project,
  wallId: string,
  input: Omit<Opening, "id" | "wallId">,
): Project {
  const wall = project.walls.find((w) => w.id === wallId);
  if (!wall) throw new Error("Unknown wall");
  editableLayer(project, wall.layerId);
  const next = structuredClone(project);
  next.wallOpenings.push({ ...input, id: crypto.randomUUID(), wallId });
  return validateProject(next);
}
export function removeWallOpening(project: Project, id: string): Project {
  const opening = project.wallOpenings.find((o) => o.id === id);
  if (!opening) throw new Error("Unknown opening");
  const wall = project.walls.find((w) => w.id === opening.wallId)!;
  editableLayer(project, wall.layerId);
  const next = structuredClone(project);
  next.wallOpenings = next.wallOpenings.filter((o) => o.id !== id);
  return validateProject(next);
}
export function wallPoint(wall: Wall, offset: number) {
  const length = Math.hypot(
    wall.end.x - wall.start.x,
    wall.end.y - wall.start.y,
  );
  return {
    x: wall.start.x + ((wall.end.x - wall.start.x) * offset) / length,
    y: wall.start.y + ((wall.end.y - wall.start.y) * offset) / length,
  };
}
export function openingGeometry(wall: Wall, opening: Opening) {
  const start = wallPoint(wall, opening.offsetMm),
    end = wallPoint(wall, opening.offsetMm + opening.widthMm);
  const hinge = opening.hinge === "start" ? start : end,
    closed = opening.hinge === "start" ? end : start;
  const length = Math.hypot(
      wall.end.x - wall.start.x,
      wall.end.y - wall.start.y,
    ),
    sign = opening.swing === "left" ? 1 : -1;
  const leaf = {
    x:
      hinge.x - ((wall.end.y - wall.start.y) / length) * opening.widthMm * sign,
    y:
      hinge.y + ((wall.end.x - wall.start.x) / length) * opening.widthMm * sign,
  };
  const sweep =
    (closed.x - hinge.x) * (leaf.y - hinge.y) -
      (closed.y - hinge.y) * (leaf.x - hinge.x) >
    0
      ? 1
      : 0;
  return {
    start,
    end,
    hinge,
    leaf,
    arc: `M ${closed.x} ${closed.y} A ${opening.widthMm} ${opening.widthMm} 0 0 ${sweep} ${leaf.x} ${leaf.y}`,
    frame: wallFootprint({ ...wall, start, end }),
  };
}
export function wallSegments(wall: Wall, openings: Opening[]) {
  const intervals = openings
    .filter((o) => o.wallId === wall.id)
    .map((o) => [o.offsetMm, o.offsetMm + o.widthMm])
    .sort((a, b) => a[0] - b[0]);
  let cursor = 0;
  const result: Wall[] = [];
  for (const [start, end] of intervals) {
    if (start > cursor)
      result.push({
        ...wall,
        start: wallPoint(wall, cursor),
        end: wallPoint(wall, start),
      });
    cursor = Math.max(cursor, end);
  }
  const length = Math.hypot(
    wall.end.x - wall.start.x,
    wall.end.y - wall.start.y,
  );
  if (cursor < length) result.push({ ...wall, start: wallPoint(wall, cursor) });
  return result;
}
