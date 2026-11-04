import { z } from "zod";
import {
  schemas,
  validateProject,
  type Project,
} from "../electrical-model/project.ts";

type Part = Project["manufacturerParts"][number];
type Details = NonNullable<Part["custom"]>;
export type CustomComponentInput = Pick<
  Part,
  "name" | "manufacturer" | "partNumber" | "sourceUrl" | "ratings"
> & {
  symbolDefinitionId: string;
  details: Omit<
    Details,
    | "componentId"
    | "revision"
    | "provenance"
    | "verification"
    | "symbolDefinition"
  >;
};
export const maxComponentBytes = 1024 * 1024;
const componentFile = z
  .object({
    format: z.literal("adiguneplanai.component"),
    formatVersion: z.literal(1),
    part: schemas.manufacturerParts,
  })
  .strict();

export function createComponentRevision(
  project: Project,
  input: CustomComponentInput,
  previousId?: string,
): Project {
  const definition = project.symbolDefinitions.find(
    (d) => d.id === input.symbolDefinitionId,
  );
  if (!definition) throw new Error("Unknown component symbol");
  const previous = previousId
    ? project.manufacturerParts.find((p) => p.id === previousId)
    : undefined;
  if (previousId && !previous?.custom)
    throw new Error("Unknown custom component revision");
  if (
    previous?.custom &&
    project.manufacturerParts.some(
      (p) =>
        p.custom?.componentId === previous.custom!.componentId &&
        p.custom.revision > previous.custom!.revision,
    )
  )
    throw new Error("Stale custom component revision");
  const next = structuredClone(project);
  next.manufacturerParts.push(
    schemas.manufacturerParts.parse({
      id: crypto.randomUUID(),
      name: input.name,
      manufacturer: input.manufacturer,
      partNumber: input.partNumber,
      ...(input.sourceUrl !== undefined ? { sourceUrl: input.sourceUrl } : {}),
      ratings: input.ratings,
      custom: {
        ...input.details,
        componentId: previous?.custom?.componentId ?? crypto.randomUUID(),
        revision: (previous?.custom?.revision ?? 0) + 1,
        provenance: "user-supplied",
        verification: "unverified",
        symbolDefinition: structuredClone(definition),
      },
    }),
  );
  return validateProject(next);
}

export function compatibleCustomComponent(
  project: Project,
  deviceId: string,
  partId: string,
): boolean {
  const part = project.manufacturerParts.find((p) => p.id === partId);
  if (!part?.custom) return false;
  const definition = part.custom.symbolDefinition;
  const instances = project.symbolInstances.filter(
    (s) => s.deviceId === deviceId,
  );
  const nodes = new Set(
    definition.pins.map((pin) =>
      pin.terminalGroup ? `group:${pin.terminalGroup}` : `pin:${pin.id}`,
    ),
  ).size;
  return (
    !!instances.length &&
    project.terminals.filter((t) => t.deviceId === deviceId).length === nodes &&
    instances.every((s) => {
      const layer = project.layers.find((l) => l.id === s.layerId);
      return (
        !!layer?.visible &&
        !layer.locked &&
        JSON.stringify(
          project.symbolDefinitions.find((d) => d.id === s.definitionId),
        ) === JSON.stringify(definition)
      );
    })
  );
}

export function assignCustomComponent(
  project: Project,
  deviceId: string,
  partId: string,
): Project {
  if (!compatibleCustomComponent(project, deviceId, partId))
    throw new Error("Custom component requires a compatible editable symbol");
  const next = structuredClone(project);
  const device = next.devices.find((d) => d.id === deviceId);
  if (!device) throw new Error("Unknown device");
  device.partId = partId;
  return validateProject(next);
}

export function exportCustomComponent(
  project: Project,
  partId: string,
): string {
  const valid = validateProject(project);
  const part = valid.manufacturerParts.find((p) => p.id === partId);
  if (!part?.custom) throw new Error("Unknown custom component");
  const text = JSON.stringify(
    { format: "adiguneplanai.component", formatVersion: 1, part },
    null,
    2,
  );
  if (new TextEncoder().encode(text).length > maxComponentBytes)
    throw new Error("Component exceeds 1 MiB limit");
  return text;
}

export function importCustomComponent(project: Project, text: string): Project {
  if (new TextEncoder().encode(text).length > maxComponentBytes)
    throw new Error("Component exceeds 1 MiB limit");
  const { part } = componentFile.parse(JSON.parse(text));
  if (!part.custom) throw new Error("Custom component metadata required");
  const next = structuredClone(project);
  const previous = next.manufacturerParts.find((p) => p.id === part.id);
  if (previous) {
    if (JSON.stringify(previous) !== JSON.stringify(part))
      throw new Error("Component import conflicts with existing record");
    return validateProject(next);
  }
  const snapshot = part.custom.symbolDefinition;
  const definition = next.symbolDefinitions.find((d) => d.id === snapshot.id);
  if (definition && JSON.stringify(definition) !== JSON.stringify(snapshot))
    throw new Error("Component symbol conflicts with local edits");
  if (!definition) next.symbolDefinitions.push(structuredClone(snapshot));
  next.manufacturerParts.push(part);
  return validateProject(next);
}
