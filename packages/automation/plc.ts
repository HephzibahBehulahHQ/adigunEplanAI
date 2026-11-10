import { validateProject, type Project } from "../electrical-model/project.ts";
import { installSymbol } from "../component-library/symbols.ts";
import { place } from "../schematic-editor/commands.ts";

export const plcKinds = [
  "cpu",
  "digital-input",
  "digital-output",
  "analog-input",
  "analog-output",
  "communication",
] as const;
export type PlcKind = (typeof plcKinds)[number];
export const plcSymbol: Record<PlcKind, { symbol: string; channels: number }> =
  {
    cpu: { symbol: "plc-cpu-serial", channels: 2 },
    "digital-input": { symbol: "digital-input-four", channels: 4 },
    "digital-output": { symbol: "digital-output-four", channels: 4 },
    "analog-input": { symbol: "analog-input-two", channels: 2 },
    "analog-output": { symbol: "analog-output-two", channels: 2 },
    communication: { symbol: "communication-dual-serial", channels: 2 },
  };

function editable(project: Project, deviceId: string) {
  if (!project.devices.some((device) => device.id === deviceId))
    throw new Error("Unknown PLC device");
  for (const instance of project.symbolInstances.filter(
    (item) => item.deviceId === deviceId,
  )) {
    const layer = project.layers.find((item) => item.id === instance.layerId)!;
    if (!layer.visible || layer.locked)
      throw new Error("PLC device layer is protected");
  }
}

export function createPlcModule(
  project: Project,
  input: {
    kind: PlcKind;
    pageId: string;
    reference: string;
    name: string;
    channelCount?: number;
    symbolId?: string;
  },
): Project {
  const page = project.pages.find((item) => item.id === input.pageId);
  const defaultSpec = plcSymbol[input.kind];
  const channelCount = input.channelCount ?? defaultSpec?.channels;
  const expandedSymbols: Partial<Record<PlcKind, Record<number, string>>> = {
    "digital-input": { 16: "digital-input-sixteen" },
    "digital-output": { 8: "digital-output-eight" },
  };
  const expandedSymbol = expandedSymbols[input.kind]?.[channelCount ?? 0];
  const spec = input.symbolId
    ? { symbol: input.symbolId, channels: channelCount! }
    : defaultSpec && channelCount === defaultSpec.channels
      ? defaultSpec
      : expandedSymbol
        ? { symbol: expandedSymbol, channels: channelCount! }
        : undefined;
  if (
    !page ||
    !spec ||
    !project.documents.some(
      (d) => d.id === page.documentId && d.kind === "schematic",
    )
  )
    throw new Error("A schematic page and supported PLC kind are required");
  const layer = project.layers.find(
    (item) => item.pageId === page.id && item.visible && !item.locked,
  );
  if (!layer && project.layers.some((item) => item.pageId === page.id))
    throw new Error("Choose a visible unlocked schematic layer");
  if (page.widthMm < 80 || page.heightMm < 80)
    throw new Error(
      "PLC interface requires a drawing page at least 80 mm wide and high",
    );
  let next = installSymbol(project, spec.symbol);
  const layerId = layer?.id ?? crypto.randomUUID();
  if (!layer)
    next.layers.push({
      id: layerId,
      name: input.name,
      pageId: page.id,
      visible: true,
      locked: false,
    });
  const number = project.symbolInstances.filter(
    (s) => s.pageId === page.id,
  ).length;
  const columns = Math.max(1, Math.floor((page.widthMm - 80) / 90));
  const symbolId = place(
    next,
    page.id,
    layerId,
    "custom",
    {
      x: Math.min(page.widthMm - 40, 45 + (number % columns) * 90),
      y: Math.min(page.heightMm - 40, 45 + Math.floor(number / columns) * 90),
    },
    page.gridMm,
    `library-${spec.symbol}`,
  );
  const symbol = next.symbolInstances.find((item) => item.id === symbolId)!;
  const device = next.devices.find((item) => item.id === symbol.deviceId)!;
  device.reference = input.reference.trim();
  device.name = input.name.trim();
  symbol.name = device.reference;
  next = validateProject(next);
  return savePlcModule(next, {
    id: crypto.randomUUID(),
    name: input.name,
    deviceId: device.id,
    channelCount: spec.channels,
    moduleKind: input.kind,
  });
}

export function savePlcModule(
  project: Project,
  module: Project["plcModules"][number],
): Project {
  editable(project, module.deviceId);
  const old = project.plcModules.find((item) => item.id === module.id);
  if (old && old.deviceId !== module.deviceId)
    throw new Error("Module device identity cannot change");
  if (
    project.plcModules.some(
      (item) => item.id !== module.id && item.deviceId === module.deviceId,
    )
  )
    throw new Error("Device already has a PLC module definition");
  const next = structuredClone(project);
  next.plcModules = [
    ...next.plcModules.filter((item) => item.id !== module.id),
    structuredClone(module),
  ];
  return validatePlcProject(next);
}

export function removePlcModule(project: Project, id: string): Project {
  const module = project.plcModules.find((item) => item.id === id);
  if (!module) throw new Error("Unknown PLC module");
  editable(project, module.deviceId);
  if (project.plcAddresses.some((item) => item.moduleId === id))
    throw new Error("Remove I/O addresses before removing the module");
  const next = structuredClone(project);
  next.plcModules = next.plcModules.filter((item) => item.id !== id);
  return validateProject(next);
}

function validatePlcProject(project: Project) {
  const addresses = new Set<string>();
  for (const address of project.plcAddresses) {
    const normalized = address.address.trim().toUpperCase();
    if (addresses.has(normalized))
      throw new Error("PLC addresses must be unique regardless of case");
    addresses.add(normalized);
    const module = project.plcModules.find(
      (item) => item.id === address.moduleId,
    )!;
    if (
      ["digital-input", "digital-output"].includes(module.moduleKind ?? "") &&
      address.dataType !== "BOOL"
    )
      throw new Error("Digital I/O requires BOOL");
    if (
      ["analog-input", "analog-output"].includes(module.moduleKind ?? "") &&
      !["INT", "REAL"].includes(address.dataType)
    )
      throw new Error("Analog I/O requires INT or REAL");
    for (const terminalId of address.terminalIds ?? []) {
      if (
        project.terminals.find((terminal) => terminal.id === terminalId)
          ?.deviceId !== module.deviceId
      )
        throw new Error("Mapped terminal must belong to the module");
    }
  }
  return validateProject(project);
}

export function savePlcAddress(
  project: Project,
  address: Project["plcAddresses"][number],
): Project {
  const module = project.plcModules.find(
    (item) => item.id === address.moduleId,
  );
  if (!module) throw new Error("Unknown PLC module");
  editable(project, module.deviceId);
  const old = project.plcAddresses.find((item) => item.id === address.id);
  if (old && old.moduleId !== address.moduleId)
    throw new Error("I/O mapping cannot move between modules");
  const next = structuredClone(project);
  next.plcAddresses = [
    ...next.plcAddresses.filter((item) => item.id !== address.id),
    structuredClone(address),
  ];
  return validatePlcProject(next);
}

export function removePlcAddress(project: Project, id: string): Project {
  const address = project.plcAddresses.find((item) => item.id === id);
  if (!address) throw new Error("Unknown PLC address");
  editable(
    project,
    project.plcModules.find((item) => item.id === address.moduleId)!.deviceId,
  );
  const next = structuredClone(project);
  next.plcAddresses = next.plcAddresses.filter((item) => item.id !== id);
  return validateProject(next);
}

export function saveAutomationNote(
  project: Project,
  note: Project["automationNotes"][number],
): Project {
  for (const id of note.deviceIds) editable(project, id);
  const old = project.automationNotes.find((item) => item.id === note.id);
  for (const id of old?.deviceIds ?? []) editable(project, id);
  const next = structuredClone(project);
  next.automationNotes = [
    ...next.automationNotes.filter((item) => item.id !== note.id),
    structuredClone(note),
  ];
  return validateProject(next);
}
export function removeAutomationNote(project: Project, id: string): Project {
  const note = project.automationNotes.find((item) => item.id === id);
  if (!note) throw new Error("Unknown automation note");
  for (const deviceId of note.deviceIds) editable(project, deviceId);
  const next = structuredClone(project);
  next.automationNotes = next.automationNotes.filter((item) => item.id !== id);
  return validateProject(next);
}

export function plcWiringSchedule(project: Project) {
  return project.plcAddresses.map((address) => {
    const module = project.plcModules.find(
      (item) => item.id === address.moduleId,
    )!;
    const pinIds = new Set(
      project.pins
        .filter((pin) => address.terminalIds?.includes(pin.terminalId))
        .map((pin) => pin.id),
    );
    return {
      ...address,
      module: module.name,
      reference: project.devices.find((item) => item.id === module.deviceId)!
        .reference,
      terminals: (address.terminalIds ?? []).map(
        (id) => project.terminals.find((item) => item.id === id)!.designation,
      ),
      signal:
        project.devices.find((item) => item.id === address.signalDeviceId)
          ?.reference ?? null,
      wireIds: project.wires
        .filter(
          (wire) => pinIds.has(wire.fromPinId) || pinIds.has(wire.toPinId),
        )
        .map((wire) => wire.id),
    };
  });
}
