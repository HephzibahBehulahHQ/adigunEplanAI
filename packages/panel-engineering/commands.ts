import { validateProject, type Project } from "../electrical-model/project.ts";
import { volumeBounds, type Vector3 } from "./geometry.ts";
import { heatBalance, ductOccupancy } from "./estimates.ts";

export type Enclosure = Project["enclosures"][number];
export type Structure = Project["panelStructures"][number];
export type Placement = Project["equipment3d"][number];

export function sourceDimensions(
  project: Project,
  deviceId: string,
): { source: "catalog" | "custom"; sizeMm: Vector3 } | null {
  const device = project.devices.find((item) => item.id === deviceId);
  const part = project.manufacturerParts.find(
    (item) => item.id === device?.partId,
  );
  const dimensions =
    part?.catalogSnapshot?.dimensionsMm ?? part?.custom?.dimensionsMm;
  if (!dimensions) return null;
  return {
    source: part?.catalogSnapshot?.dimensionsMm ? "catalog" : "custom",
    sizeMm: { x: dimensions.width, y: dimensions.height, z: dimensions.depth },
  };
}

export function saveEnclosure(
  project: Project,
  input: Omit<Enclosure, "id">,
  id?: string,
): Project {
  if (id && !project.enclosures.some((item) => item.id === id))
    throw new Error("Unknown enclosure");
  if (input.thermal)
    heatBalance(
      project.equipment3d
        .filter((item) => item.enclosureId === id)
        .map((item) => item.lossPowerW),
      input.thermal,
    );
  const record = { ...structuredClone(input), id: id ?? crypto.randomUUID() };
  const next = structuredClone(project);
  if (id)
    next.enclosures[next.enclosures.findIndex((item) => item.id === id)] =
      record;
  else next.enclosures.push(record);
  return validateProject(next);
}

export function removeEnclosure(project: Project, id: string): Project {
  if (!project.enclosures.some((item) => item.id === id))
    throw new Error("Unknown enclosure");
  if (
    project.equipment3d.some((item) => item.enclosureId === id) ||
    project.panelStructures.some((item) => item.enclosureId === id) ||
    project.enclosures.find((item) => item.id === id)?.features?.length
  )
    throw new Error("Remove enclosure placements and structures first");
  const next = structuredClone(project);
  next.enclosures = next.enclosures.filter((item) => item.id !== id);
  return validateProject(next);
}

export function savePanelStructure(
  project: Project,
  input: Omit<Structure, "id">,
  id?: string,
): Project {
  const old = project.panelStructures.find((item) => item.id === id);
  if (id && !old) throw new Error("Unknown panel structure");
  if (old && old.enclosureId !== input.enclosureId)
    throw new Error("A structure cannot change enclosure");
  const record = { ...structuredClone(input), id: id ?? crypto.randomUUID() };
  volumeBounds(record);
  if (record.kind === "duct")
    ductOccupancy(
      record.cableDiametersMm ?? [],
      record.usableCrossSectionMm2,
      record.maximumFillPercent,
    );
  const next = structuredClone(project);
  if (id) {
    next.panelStructures[
      next.panelStructures.findIndex((item) => item.id === id)
    ] = record;
    if (old)
      for (const item of next.equipment3d.filter(
        (item) => item.mountingStructureId === id,
      )) {
        item.positionMm = {
          x: item.positionMm.x + record.positionMm.x - old.positionMm.x,
          y: item.positionMm.y + record.positionMm.y - old.positionMm.y,
          z: item.positionMm.z + record.positionMm.z - old.positionMm.z,
        };
      }
  } else next.panelStructures.push(record);
  return validateProject(next);
}

export function removePanelStructure(project: Project, id: string): Project {
  if (!project.panelStructures.some((item) => item.id === id))
    throw new Error("Unknown panel structure");
  if (project.equipment3d.some((item) => item.mountingStructureId === id))
    throw new Error("Unassign equipment from this mounting structure first");
  const next = structuredClone(project);
  next.panelStructures = next.panelStructures.filter((item) => item.id !== id);
  return validateProject(next);
}

export function savePanelPlacement(
  project: Project,
  input: Omit<Placement, "id">,
  id?: string,
): Project {
  const old = project.equipment3d.find((item) => item.id === id);
  if (id && !old) throw new Error("Unknown panel placement");
  if (
    old &&
    (old.enclosureId !== input.enclosureId || old.deviceId !== input.deviceId)
  )
    throw new Error("Placement device and enclosure identity cannot change");
  const record = { ...structuredClone(input), id: id ?? crypto.randomUUID() };
  volumeBounds(record);
  if (
    project.equipment3d.some(
      (item) => item.id !== id && item.deviceId === input.deviceId,
    )
  )
    throw new Error("Device already has a cabinet placement");
  if (input.dimensionSource && input.dimensionSource !== "manual") {
    const source = sourceDimensions(project, input.deviceId);
    if (
      !source ||
      source.source !== input.dimensionSource ||
      ["x", "y", "z"].some(
        (axis) =>
          source.sizeMm[axis as keyof Vector3] !==
          input.sizeMm[axis as keyof Vector3],
      )
    )
      throw new Error("Dimensions must match the assigned component source");
  }
  const next = structuredClone(project);
  if (id)
    next.equipment3d[next.equipment3d.findIndex((item) => item.id === id)] =
      record;
  else next.equipment3d.push(record);
  return validateProject(next);
}

export function removePanelPlacement(project: Project, id: string): Project {
  if (!project.equipment3d.some((item) => item.id === id))
    throw new Error("Unknown panel placement");
  const next = structuredClone(project);
  next.equipment3d = next.equipment3d.filter((item) => item.id !== id);
  return validateProject(next);
}

/** Creates a native cabinet-only device; no schematic terminals are fabricated. */
export function createPanelDevice(
  project: Project,
  input: Omit<Placement, "id" | "deviceId" | "dimensionSource"> & {
    reference: string;
  },
): Project {
  const next = structuredClone(project);
  const deviceId = crypto.randomUUID();
  const { reference, ...placement } = input;
  next.devices.push({
    id: deviceId,
    name: input.name,
    reference: reference.trim(),
  });
  return savePanelPlacement(next, {
    ...placement,
    deviceId,
    dimensionSource: "manual",
  });
}
