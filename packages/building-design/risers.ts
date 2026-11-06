import { validateProject, type Project } from "../electrical-model/project.ts";
import { snap } from "../engineering-core/geometry.ts";

export type PlanRiserInput = Omit<Project["planRisers"][number], "id">;

function editable(project: Project, riser: PlanRiserInput) {
  for (const endpoint of [riser.start, riser.end]) {
    const layer = project.architecturalLayers.find(
      (l) => l.id === endpoint.layerId,
    );
    if (
      !layer ||
      layer.floorId !== endpoint.floorId ||
      layer.kind !== "electrical" ||
      !layer.visible ||
      layer.locked
    )
      throw new Error(
        "Both riser endpoint layers must be electrical, visible and unlocked",
      );
  }
}

export function savePlanRiser(
  project: Project,
  input: PlanRiserInput,
  gridMm: number,
  id?: string,
): Project {
  if (!Number.isFinite(gridMm) || gridMm < 0)
    throw new Error("Riser grid must be finite and nonnegative");
  editable(project, input);
  const old = project.planRisers.find((r) => r.id === id);
  if (id && !old) throw new Error("Unknown plan riser");
  if (old) editable(project, old);
  const record = {
    ...structuredClone(input),
    id: id ?? crypto.randomUUID(),
    position: {
      x: gridMm === 0 ? input.position.x : snap(input.position.x, gridMm),
      y: gridMm === 0 ? input.position.y : snap(input.position.y, gridMm),
    },
  };
  const next = structuredClone(project);
  if (old)
    next.planRisers[next.planRisers.findIndex((r) => r.id === id)] = record;
  else next.planRisers.push(record);
  return validateProject(next);
}

export function removePlanRiser(project: Project, id: string): Project {
  const old = project.planRisers.find((r) => r.id === id);
  if (!old) throw new Error("Unknown plan riser");
  editable(project, old);
  const next = structuredClone(project);
  next.planRisers = next.planRisers.filter((r) => r.id !== id);
  return validateProject(next);
}

/** Explicit vertical geometry only. Does not assign cables, circuits, slack or connectivity. */
export function riserSchedule(project: Project, buildingId?: string) {
  return project.planRisers.flatMap((riser) => {
    const start = project.floors.find((f) => f.id === riser.start.floorId)!;
    const end = project.floors.find((f) => f.id === riser.end.floorId)!;
    if (buildingId && start.buildingId !== buildingId) return [];
    const startElevationMm = start.elevationMm + riser.start.heightMm;
    const endElevationMm = end.elevationMm + riser.end.heightMm;
    return [
      {
        id: riser.id,
        name: riser.name,
        kind: riser.kind,
        buildingId: start.buildingId,
        startFloor: start.name,
        endFloor: end.name,
        startElevationMm,
        endElevationMm,
        verticalLengthM: Math.abs(endElevationMm - startElevationMm) / 1000,
      },
    ];
  });
}
