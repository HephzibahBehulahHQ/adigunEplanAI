import { validateProject, type Project } from "../electrical-model/project.ts";

function checkLayers(project: Project, layerIds: string[]) {
  if (
    layerIds.some((id) => {
      const layer = project.layers.find((l) => l.id === id);
      return !layer || layer.locked || !layer.visible;
    })
  )
    throw new Error("Protected electrical entity");
}
export function updateCore(
  project: Project,
  core: Project["conductors"][number],
): Project {
  const next = structuredClone(project);
  const index = next.conductors.findIndex((c) => c.id === core.id);
  if (index < 0) throw new Error("Unknown core");
  const wires = new Set(
    next.wires.filter((w) => w.conductorId === core.id).map((w) => w.id),
  );
  checkLayers(
    next,
    next.wirePaths.filter((p) => wires.has(p.wireId)).map((p) => p.layerId),
  );
  next.conductors[index] = structuredClone(core);
  return validateProject(next);
}
export function updateTerminal(
  project: Project,
  terminalId: string,
  values: { designation: string; capacity?: number; required: boolean },
): Project {
  const next = structuredClone(project);
  const terminal = next.terminals.find((t) => t.id === terminalId);
  if (!terminal) throw new Error("Unknown terminal");
  const instances = new Set(
    next.pins
      .filter((p) => p.terminalId === terminalId)
      .map((p) => p.symbolInstanceId),
  );
  checkLayers(
    next,
    next.symbolInstances
      .filter((s) => instances.has(s.id))
      .map((s) => s.layerId),
  );
  Object.assign(terminal, values);
  if (values.capacity === undefined) delete terminal.capacity;
  return validateProject(next);
}
export function saveTerminalStrip(
  project: Project,
  strip: Project["terminalStrips"][number],
): Project {
  const next = structuredClone(project);
  if (new Set(strip.terminalIds).size !== strip.terminalIds.length)
    throw new Error("Duplicate strip member");
  if (
    next.terminalStrips.some(
      (s) =>
        s.id !== strip.id &&
        s.terminalIds.some((id) => strip.terminalIds.includes(id)),
    )
  )
    throw new Error("Terminal already belongs to another strip");
  const index = next.terminalStrips.findIndex((s) => s.id === strip.id);
  if (index < 0) next.terminalStrips.push(structuredClone(strip));
  else next.terminalStrips[index] = structuredClone(strip);
  return validateProject(next);
}
