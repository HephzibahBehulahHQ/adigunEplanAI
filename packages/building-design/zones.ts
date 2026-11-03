import { validateProject, type Project } from "../electrical-model/project.ts";

export type ZoneInput = Omit<Project["planZones"][number], "id">;

export function savePlanZone(
  project: Project,
  input: ZoneInput,
  zoneId?: string,
): Project {
  const next = structuredClone(project);
  if (zoneId) {
    const index = next.planZones.findIndex((z) => z.id === zoneId);
    if (index < 0) throw new Error("Unknown plan zone");
    if (next.planZones[index].floorId !== input.floorId)
      throw new Error("A zone cannot move to another floor");
    next.planZones[index] = { ...input, id: zoneId };
  } else next.planZones.push({ ...input, id: crypto.randomUUID() });
  return validateProject(next);
}

export function removePlanZone(project: Project, zoneId: string): Project {
  if (!project.planZones.some((z) => z.id === zoneId))
    throw new Error("Unknown plan zone");
  const next = structuredClone(project);
  next.planZones = next.planZones.filter((z) => z.id !== zoneId);
  return validateProject(next);
}
