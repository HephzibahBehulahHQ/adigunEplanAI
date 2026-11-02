import {
  schemas,
  validateProject,
  type Project,
} from "../electrical-model/project.ts";
import { refreshDefinitionInstances } from "../schematic-editor/commands.ts";

function validateDefinition(definition: Project["symbolDefinitions"][number]) {
  const parsed = schemas.symbolDefinitions.parse(definition);
  if (parsed.category !== "custom" || parsed.glyph !== "box")
    throw new Error("Custom definitions require an explicit box body");
  if (
    parsed.widthMm < 4 ||
    parsed.widthMm > 500 ||
    parsed.heightMm < 4 ||
    parsed.heightMm > 500 ||
    !parsed.pins.length
  )
    throw new Error("Invalid custom dimensions or empty pin set");
  if (
    parsed.pins.some(
      (pin) =>
        Math.abs(pin.position.x) > parsed.widthMm / 2 ||
        Math.abs(pin.position.y) > parsed.heightMm / 2,
    )
  )
    throw new Error("Pin outside custom body bounds");
  if (
    new Set(parsed.pins.map((pin) => `${pin.position.x},${pin.position.y}`))
      .size !== parsed.pins.length
  )
    throw new Error("Overlapping custom pins");
  return parsed;
}

export function createCustomSymbol(
  project: Project,
  definition: Project["symbolDefinitions"][number],
): Project {
  const next = structuredClone(project);
  next.symbolDefinitions.push(validateDefinition(definition));
  return validateProject(next);
}

export function updateCustomSymbol(
  project: Project,
  definition: Project["symbolDefinitions"][number],
): Project {
  const current = project.symbolDefinitions.find(
    (d) => d.id === definition.id && d.category === "custom",
  );
  if (!current) throw new Error("Unknown custom symbol");
  const parsed = validateDefinition(definition);
  const next = structuredClone(project);
  const instances = next.symbolInstances.filter(
    (s) => s.definitionId === definition.id,
  );
  for (const instance of instances) {
    const pins = next.pins.filter((p) => p.symbolInstanceId === instance.id);
    if (
      pins.some((pin) => !parsed.pins.some((p) => p.id === pin.definitionPinId))
    )
      throw new Error("Cannot remove instantiated pin identities");
    for (const pin of parsed.pins)
      if (!pins.some((p) => p.definitionPinId === pin.id)) {
        const terminalId = crypto.randomUUID();
        next.terminals.push({
          id: terminalId,
          name: pin.id,
          designation: pin.id,
          deviceId: instance.deviceId,
          kind: "control",
        });
        next.pins.push({
          id: crypto.randomUUID(),
          name: pin.id,
          terminalId,
          symbolInstanceId: instance.id,
          definitionPinId: pin.id,
        });
      }
  }
  next.symbolDefinitions[
    next.symbolDefinitions.findIndex((d) => d.id === parsed.id)
  ] = parsed;
  return refreshDefinitionInstances(next, parsed.id);
}
