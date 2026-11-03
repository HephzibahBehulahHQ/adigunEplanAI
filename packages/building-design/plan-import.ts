import { validateProject, type Project } from "../electrical-model/project.ts";
import type { Point } from "../engineering-core/geometry.ts";
export type PlanImport = {
  sourceFile: string;
  mmPerUnit: number;
  shapes: { name: string; layer: string; points: Point[]; closed: boolean }[];
  issues: string[];
};
export function importPlanGeometry(
  project: Project,
  floorId: string,
  draft: PlanImport,
): Project {
  if (!project.floors.some((f) => f.id === floorId))
    throw new Error("Unknown floor");
  if (!draft.shapes.length || draft.shapes.length > 2000)
    throw new Error("Import requires 1–2000 shapes");
  const next = structuredClone(project);
  const layers = new Map<string, string>();
  for (const shape of draft.shapes) {
    let layerId = layers.get(shape.layer);
    if (!layerId) {
      layerId = crypto.randomUUID();
      layers.set(shape.layer, layerId);
      next.architecturalLayers.push({
        id: layerId,
        name: shape.layer,
        floorId,
        kind: "architectural",
        visible: true,
        locked: false,
      });
    }
    next.planGeometry.push({
      id: crypto.randomUUID(),
      name: shape.name || draft.sourceFile,
      floorId,
      layerId,
      points: shape.points,
      closed: shape.closed,
      sourceFile: draft.sourceFile,
      sourceElement: shape.name,
      mmPerUnit: draft.mmPerUnit,
    });
  }
  return validateProject(next);
}
export function removePlanGeometry(project: Project, id: string): Project {
  const shape = project.planGeometry.find((s) => s.id === id);
  if (!shape) throw new Error("Unknown plan geometry");
  const layer = project.architecturalLayers.find((l) => l.id === shape.layerId);
  if (!layer?.visible || layer.locked)
    throw new Error("Layer must be visible and unlocked");
  const next = structuredClone(project);
  next.planGeometry = next.planGeometry.filter((s) => s.id !== id);
  return validateProject(next);
}
