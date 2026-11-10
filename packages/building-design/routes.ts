import { validateProject, type Project } from "../electrical-model/project.ts";
import { snap } from "../engineering-core/geometry.ts";

export type PlanRouteInput = Omit<Project["planRoutes"][number], "id">;

function editable(project: Project, layerId: string) {
  const layer = project.architecturalLayers.find((l) => l.id === layerId);
  if (!layer || layer.kind !== "electrical" || !layer.visible || layer.locked)
    throw new Error("Route layer must be electrical, visible and unlocked");
}

function editableCircuit(project: Project, circuitId?: string) {
  if (!circuitId) return;
  const circuit = project.circuits.find((c) => c.id === circuitId);
  if (!circuit?.layerId) throw new Error("Unknown floor circuit");
  editable(project, circuit.layerId);
}

export function savePlanRoute(
  project: Project,
  input: PlanRouteInput,
  gridMm: number,
  id?: string,
): Project {
  editable(project, input.layerId);
  editableCircuit(project, input.circuitId);
  const old = project.planRoutes.find((r) => r.id === id);
  if (id && !old) throw new Error("Unknown plan route");
  if (old) {
    editable(project, old.layerId);
    editableCircuit(project, old.circuitId);
    if (old.floorId !== input.floorId)
      throw new Error("A plan route cannot move to another floor");
  }
  const record = {
    ...input,
    id: id ?? crypto.randomUUID(),
    points: input.points.map((p) => ({
      x: gridMm === 0 ? p.x : snap(p.x, gridMm),
      y: gridMm === 0 ? p.y : snap(p.y, gridMm),
    })),
  };
  const next = structuredClone(project);
  if (old)
    next.planRoutes[next.planRoutes.findIndex((r) => r.id === id)] = record;
  else next.planRoutes.push(record);
  return validateProject(next);
}

export function removePlanRoute(project: Project, id: string): Project {
  const old = project.planRoutes.find((r) => r.id === id);
  if (!old) throw new Error("Unknown plan route");
  editable(project, old.layerId);
  editableCircuit(project, old.circuitId);
  const next = structuredClone(project);
  next.planRoutes = next.planRoutes.filter((r) => r.id !== id);
  return validateProject(next);
}

/** Horizontal plan geometry only; excludes rises, drops, slack and allowances. */
export function planRouteLengthM(
  route: Pick<PlanRouteInput, "points">,
): number {
  return route.points.reduce(
    (length, p, i) =>
      length +
      (i === 0
        ? 0
        : Math.hypot(p.x - route.points[i - 1].x, p.y - route.points[i - 1].y) /
          1000),
    0,
  );
}
