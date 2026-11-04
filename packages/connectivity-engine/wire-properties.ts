import { validateProject, type Project } from "../electrical-model/project.ts";

export type WireProperties = {
  name: string;
  color?: string;
  physicalLengthM?: number;
  conductorId?: string;
};
export function setWireProperties(
  project: Project,
  wireId: string,
  values: WireProperties,
): Project {
  const next = structuredClone(project);
  const wire = next.wires.find((w) => w.id === wireId);
  const paths = next.wirePaths.filter((p) => p.wireId === wireId);
  if (
    !wire ||
    !paths.length ||
    paths.some((path) => {
      const layer = next.layers.find((l) => l.id === path.layerId);
      return !layer || layer.locked || !layer.visible;
    })
  )
    throw new Error("Wire is not editable");
  Object.assign(wire, values);
  for (const key of ["color", "physicalLengthM", "conductorId"] as const)
    if (values[key] === undefined) delete wire[key];
  return validateProject(next);
}

export function addCableCore(
  project: Project,
  wireId: string,
  core: Project["conductors"][number],
  cableId?: string,
): Project {
  const next = structuredClone(project);
  next.conductors.push(core);
  if (cableId) {
    const cable = next.cables.find((c) => c.id === cableId);
    if (!cable) throw new Error("Unknown cable");
    cable.conductorIds.push(core.id);
  }
  const wire = next.wires.find((w) => w.id === wireId);
  if (!wire) throw new Error("Unknown wire");
  return setWireProperties(next, wireId, {
    name: wire.name,
    color: wire.color,
    physicalLengthM: wire.physicalLengthM,
    conductorId: core.id,
  });
}

export function saveCable(
  project: Project,
  cable: Project["cables"][number],
): Project {
  const next = structuredClone(project);
  if (
    new Set(cable.conductorIds).size !== cable.conductorIds.length ||
    new Set(cable.shieldBondTerminalIds ?? []).size !==
      (cable.shieldBondTerminalIds ?? []).length
  )
    throw new Error("Duplicate cable membership");
  if (!cable.shielded && cable.shieldBondTerminalIds?.length)
    throw new Error("Shield bonds require a shielded cable");
  if (
    next.cables.some(
      (other) =>
        other.id !== cable.id &&
        other.conductorIds.some((id) => cable.conductorIds.includes(id)),
    )
  )
    throw new Error("A core already belongs to another cable");
  const index = next.cables.findIndex((item) => item.id === cable.id);
  if (index < 0) next.cables.push(structuredClone(cable));
  else next.cables[index] = structuredClone(cable);
  return validateProject(next);
}
