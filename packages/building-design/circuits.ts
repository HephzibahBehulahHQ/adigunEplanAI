import { validateProject, type Project } from "../electrical-model/project.ts";
import { planRouteLengthM } from "./routes.ts";

export type DistributionBoardInput = {
  floorId: string;
  name: string;
  deviceId: string;
};
export type PlanCircuitInput = Omit<
  Project["circuits"][number],
  "id" | "floorId" | "layerId" | "loads"
> & {
  floorId: string;
  layerId: string;
  loads: NonNullable<Project["circuits"][number]["loads"]>;
};

function editableLayer(project: Project, layerId: string) {
  const layer = project.architecturalLayers.find((l) => l.id === layerId);
  if (!layer || layer.kind !== "electrical" || !layer.visible || layer.locked)
    throw new Error("Circuit layer must be electrical, visible and unlocked");
}

function editableDevice(project: Project, deviceId: string, floorId: string) {
  const equipment = project.planEquipment.find(
    (e) =>
      project.symbolInstances.find((s) => s.id === e.symbolInstanceId)
        ?.deviceId === deviceId,
  );
  if (!equipment || equipment.floorId !== floorId)
    throw new Error("Circuit device must have a placement on its floor");
  editableLayer(project, equipment.layerId);
}

function editableCircuit(project: Project, circuit: PlanCircuitInput) {
  editableLayer(project, circuit.layerId);
  const board = project.distributionBoards.find(
    (b) => b.id === circuit.boardId,
  );
  if (!board) throw new Error("Unknown distribution board");
  editableDevice(project, board.deviceId, circuit.floorId);
  for (const deviceId of circuit.deviceIds)
    editableDevice(project, deviceId, circuit.floorId);
}

export function saveDistributionBoard(
  project: Project,
  input: DistributionBoardInput,
  id?: string,
): Project {
  editableDevice(project, input.deviceId, input.floorId);
  const old = project.distributionBoards.find((b) => b.id === id);
  if (id && !old) throw new Error("Unknown distribution board");
  if (
    old &&
    (old.deviceId !== input.deviceId ||
      (old.floorId && old.floorId !== input.floorId))
  )
    throw new Error("Board floor and native device identity cannot change");
  const next = structuredClone(project);
  const record = { ...old, ...input, id: id ?? crypto.randomUUID() };
  if (old)
    next.distributionBoards[
      next.distributionBoards.findIndex((b) => b.id === id)
    ] = record;
  else next.distributionBoards.push(record);
  return validateProject(next);
}

export function removeDistributionBoard(project: Project, id: string): Project {
  const old = project.distributionBoards.find((b) => b.id === id);
  if (!old?.floorId) throw new Error("Unknown floor distribution board");
  editableDevice(project, old.deviceId, old.floorId);
  if (
    project.circuits.some((c) => c.boardId === id) ||
    project.planZones.some((z) => z.boardId === id)
  )
    throw new Error("Remove board circuit and zone assignments first");
  const next = structuredClone(project);
  next.distributionBoards = next.distributionBoards.filter((b) => b.id !== id);
  return validateProject(next);
}

export function savePlanCircuit(
  project: Project,
  input: PlanCircuitInput,
  id?: string,
): Project {
  editableCircuit(project, input);
  const old = project.circuits.find((c) => c.id === id);
  if (id && !old) throw new Error("Unknown circuit");
  if (old) {
    if (!old.floorId || !old.layerId || old.floorId !== input.floorId)
      throw new Error("A floor circuit cannot move to another floor");
    editableCircuit(project, {
      ...old,
      floorId: old.floorId,
      layerId: old.layerId,
      loads: old.loads ?? [],
    });
  }
  const next = structuredClone(project);
  const record = { ...structuredClone(input), id: id ?? crypto.randomUUID() };
  if (old) next.circuits[next.circuits.findIndex((c) => c.id === id)] = record;
  else next.circuits.push(record);
  return validateProject(next);
}

export function removePlanCircuit(project: Project, id: string): Project {
  const old = project.circuits.find((c) => c.id === id);
  if (!old?.floorId || !old.layerId) throw new Error("Unknown floor circuit");
  editableCircuit(project, {
    ...old,
    floorId: old.floorId,
    layerId: old.layerId,
    loads: old.loads ?? [],
  });
  if (project.planRoutes.some((r) => r.circuitId === id))
    throw new Error("Remove or unassign circuit routes first");
  const next = structuredClone(project);
  next.circuits = next.circuits.filter((c) => c.id !== id);
  return validateProject(next);
}

/** Values come only from explicitly entered active-power loads, in watts. */
export function circuitSchedule(project: Project, floorId: string) {
  return project.circuits
    .filter((c) => c.floorId === floorId)
    .map((c) => {
      const loads = c.loads ?? [];
      const knownConnectedLoadW = loads.reduce(
        (sum, load) => sum + load.activePowerW,
        0,
      );
      const unknownLoadCount = c.deviceIds.length - loads.length;
      return {
        id: c.id,
        name: c.name,
        board: project.distributionBoards.find((b) => b.id === c.boardId)!.name,
        deviceCount: c.deviceIds.length,
        knownConnectedLoadW,
        totalConnectedLoadW:
          unknownLoadCount === 0 ? knownConnectedLoadW : null,
        unknownLoadCount,
        voltageV: c.voltageV,
        phases: c.phases,
        planLengthM: project.planRoutes
          .filter((r) => r.circuitId === c.id)
          .reduce((sum, route) => sum + planRouteLengthM(route), 0),
      };
    });
}
