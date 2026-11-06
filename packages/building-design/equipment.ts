import { validateProject, type Project } from "../electrical-model/project.ts";
import { snap, transform } from "../engineering-core/geometry.ts";

export type PlanEquipmentInput = Omit<Project["planEquipment"][number], "id">;
function editable(project: Project, layerId: string) {
  const layer = project.architecturalLayers.find((l) => l.id === layerId);
  if (!layer || layer.kind !== "electrical" || !layer.visible || layer.locked)
    throw new Error("Equipment layer must be electrical, visible and unlocked");
}
export function savePlanEquipment(
  project: Project,
  input: PlanEquipmentInput,
  gridMm: number,
  id?: string,
): Project {
  editable(project, input.layerId);
  if (!Number.isFinite(gridMm) || gridMm < 0)
    throw new Error("Invalid equipment grid");
  const next = structuredClone(project);
  const old = next.planEquipment.find((e) => e.id === id);
  if (id && !old) throw new Error("Unknown plan equipment");
  if (old) {
    editable(project, old.layerId);
    if (
      old.floorId !== input.floorId ||
      old.symbolInstanceId !== input.symbolInstanceId
    )
      throw new Error(
        "Placement floor and native symbol identity cannot change",
      );
  }
  const record = {
    ...input,
    id: id ?? crypto.randomUUID(),
    position: {
      x: gridMm === 0 ? input.position.x : snap(input.position.x, gridMm),
      y: gridMm === 0 ? input.position.y : snap(input.position.y, gridMm),
    },
  };
  if (old) next.planEquipment[next.planEquipment.indexOf(old)] = record;
  else next.planEquipment.push(record);
  return validateProject(next);
}
export function removePlanEquipment(project: Project, id: string): Project {
  const old = project.planEquipment.find((e) => e.id === id);
  if (!old) throw new Error("Unknown plan equipment");
  editable(project, old.layerId);
  const next = structuredClone(project);
  next.planEquipment = next.planEquipment.filter((e) => e.id !== id);
  return validateProject(next);
}
export function equipmentCorners(
  project: Project,
  equipment: Project["planEquipment"][number],
) {
  const symbol = project.symbolInstances.find(
    (s) => s.id === equipment.symbolInstanceId,
  )!;
  const definition = project.symbolDefinitions.find(
    (d) => d.id === symbol.definitionId,
  )!;
  const w = (definition.widthMm * equipment.symbolScale) / 2,
    h = (definition.heightMm * equipment.symbolScale) / 2;
  return [
    { x: -w, y: -h },
    { x: w, y: -h },
    { x: w, y: h },
    { x: -w, y: h },
  ].map((p) => transform(p, equipment.position, equipment.rotation));
}
export function roomEquipmentSchedule(project: Project, floorId: string) {
  return project.planEquipment
    .filter((e) => e.floorId === floorId)
    .map((e) => {
      const symbol = project.symbolInstances.find(
        (s) => s.id === e.symbolInstanceId,
      )!;
      const device = project.devices.find((d) => d.id === symbol.deviceId)!;
      const part = project.manufacturerParts.find(
        (p) => p.id === device.partId,
      );
      return {
        id: e.id,
        reference: device.reference,
        name: device.name,
        room: project.rooms.find((r) => r.id === e.roomId)?.name ?? null,
        mountingHeightMm: e.mountingHeightMm ?? null,
        partNumber: part?.partNumber ?? null,
      };
    });
}
