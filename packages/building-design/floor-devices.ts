import { installSymbol } from "../component-library/symbols.ts";
import { createCustomSymbol } from "../component-library/custom-symbols.ts";
import { validateProject, type Project } from "../electrical-model/project.ts";
import { place } from "../schematic-editor/commands.ts";
import { savePlanEquipment, type PlanEquipmentInput } from "./equipment.ts";

export const floorDeviceKinds = [
  "luminaire-l-n-pe",
  "socket-l-n-pe",
  "wall-switch-single-pole",
  "distribution-board-l-n-pe",
  "emergency-luminaire-battery",
  "fire-alarm-loop-interface",
  "data-outlet-8p8c-shielded",
  "earthing-bond-point",
] as const;
export type FloorDeviceKind = (typeof floorDeviceKinds)[number];
export type FloorDeviceInput = Omit<
  PlanEquipmentInput,
  "symbolInstanceId" | "name"
> & {
  kind: FloorDeviceKind;
  pageId: string;
  reference: string;
  description: string;
};

// Original generic enclosure/supply-interface artwork. These terminals are
// independent; neither this symbol nor its board record implies internal wiring.
const boardDefinition: Project["symbolDefinitions"][number] = {
  id: "building-distribution-board-l-n-pe",
  name: "Generic distribution board (L/N/PE interface)",
  category: "custom",
  glyph: "box",
  widthMm: 28,
  heightMm: 28,
  pins: [
    { id: "L", position: { x: -14, y: -8 }, kind: "power" },
    { id: "N", position: { x: -14, y: 0 }, kind: "neutral" },
    { id: "PE", position: { x: -14, y: 8 }, kind: "pe" },
  ],
  artwork: [
    { kind: "line", from: { x: -8, y: -14 }, to: { x: 14, y: -14 } },
    { kind: "line", from: { x: 14, y: -14 }, to: { x: 14, y: 14 } },
    { kind: "line", from: { x: 14, y: 14 }, to: { x: -8, y: 14 } },
    { kind: "line", from: { x: -8, y: 14 }, to: { x: -8, y: -14 } },
    ...[-8, 0, 8].flatMap((y) => [
      { kind: "line" as const, from: { x: -14, y }, to: { x: 0, y } },
      { kind: "circle" as const, center: { x: 1, y }, radiusMm: 1 },
    ]),
  ],
};

// Original interfaces, without manufacturer ratings, protocol, cable pairing or
// certification claims. Signal contacts remain separate. The earthing point is
// explicitly one bonded PE terminal with two graphical connection points.
const fireDefinition: Project["symbolDefinitions"][number] = {
  id: "building-fire-alarm-loop-interface",
  name: "Fire alarm device (two-wire loop interface)",
  category: "custom",
  glyph: "box",
  widthMm: 32,
  heightMm: 28,
  pins: [
    { id: "LOOP_positive", position: { x: -16, y: -6 }, kind: "signal" },
    { id: "LOOP_negative", position: { x: -16, y: 6 }, kind: "signal" },
  ],
  artwork: [
    { kind: "circle", center: { x: 2, y: 0 }, radiusMm: 10 },
    { kind: "line", from: { x: -16, y: -6 }, to: { x: -6, y: -6 } },
    { kind: "line", from: { x: -16, y: 6 }, to: { x: -6, y: 6 } },
    { kind: "line", from: { x: 2, y: -6 }, to: { x: 2, y: 3 } },
    { kind: "circle", center: { x: 2, y: 6 }, radiusMm: 1 },
  ],
};
const dataDefinition: Project["symbolDefinitions"][number] = {
  id: "building-data-outlet-8p8c-shielded",
  name: "Data outlet (8P8C with independent shield contact)",
  category: "custom",
  glyph: "box",
  widthMm: 40,
  heightMm: 40,
  pins: [
    ...Array.from({ length: 8 }, (_, i) => ({
      id: `P${i + 1}`,
      position: { x: i < 4 ? -20 : 20, y: (i % 4) * 8 - 12 },
      kind: "signal" as const,
    })),
    { id: "SHIELD", position: { x: 0, y: 20 }, kind: "signal" },
  ],
  artwork: [
    { kind: "line", from: { x: -12, y: -16 }, to: { x: 12, y: -16 } },
    { kind: "line", from: { x: 12, y: -16 }, to: { x: 12, y: 16 } },
    { kind: "line", from: { x: 12, y: 16 }, to: { x: -12, y: 16 } },
    { kind: "line", from: { x: -12, y: 16 }, to: { x: -12, y: -16 } },
    ...Array.from({ length: 8 }, (_, i) => ({
      kind: "line" as const,
      from: { x: i < 4 ? -20 : 20, y: (i % 4) * 8 - 12 },
      to: { x: i < 4 ? -8 : 8, y: (i % 4) * 8 - 12 },
    })),
    { kind: "line", from: { x: 0, y: 20 }, to: { x: 0, y: 16 } },
  ],
};
const earthDefinition: Project["symbolDefinitions"][number] = {
  id: "building-earthing-bond-point",
  name: "Earthing point (common bonded PE terminal)",
  category: "custom",
  glyph: "box",
  widthMm: 28,
  heightMm: 28,
  pins: [
    {
      id: "PE_1",
      position: { x: -14, y: -6 },
      kind: "pe",
      terminalGroup: "PE",
    },
    { id: "PE_2", position: { x: 14, y: -6 }, kind: "pe", terminalGroup: "PE" },
  ],
  artwork: [
    { kind: "line", from: { x: -14, y: -6 }, to: { x: 14, y: -6 } },
    { kind: "circle", center: { x: 0, y: -6 }, radiusMm: 2 },
    { kind: "line", from: { x: 0, y: -6 }, to: { x: 0, y: 4 } },
    { kind: "line", from: { x: -10, y: 4 }, to: { x: 10, y: 4 } },
    { kind: "line", from: { x: -6, y: 8 }, to: { x: 6, y: 8 } },
    { kind: "line", from: { x: -2, y: 12 }, to: { x: 2, y: 12 } },
  ],
};
const buildingDefinitions: Partial<
  Record<FloorDeviceKind, Project["symbolDefinitions"][number]>
> = {
  "distribution-board-l-n-pe": boardDefinition,
  "fire-alarm-loop-interface": fireDefinition,
  "data-outlet-8p8c-shielded": dataDefinition,
  "earthing-bond-point": earthDefinition,
};

export function createFloorDevice(
  project: Project,
  input: FloorDeviceInput,
  gridMm: number,
): Project {
  if (!floorDeviceKinds.includes(input.kind))
    throw new Error("Unknown floor equipment type");
  const page = project.pages.find((p) => p.id === input.pageId);
  if (
    !page ||
    !project.documents.some(
      (d) => d.id === page.documentId && d.kind === "schematic",
    )
  )
    throw new Error("Floor equipment requires a schematic drawing page");
  const planLayer = project.architecturalLayers.find(
    (l) => l.id === input.layerId,
  );
  if (
    !planLayer ||
    planLayer.floorId !== input.floorId ||
    planLayer.kind !== "electrical" ||
    !planLayer.visible ||
    planLayer.locked
  )
    throw new Error("Floor equipment requires an editable electrical layer");
  const pageLayers = project.layers.filter((l) => l.pageId === page.id);
  const existingLayer = pageLayers.find((l) => l.visible && !l.locked);
  if (pageLayers.length && !existingLayer)
    throw new Error("Schematic drawing layers are protected");

  let next: Project;
  let definitionId: string;
  const buildingDefinition = buildingDefinitions[input.kind];
  if (buildingDefinition) {
    definitionId = buildingDefinition.id;
    const existing = project.symbolDefinitions.find(
      (d) => d.id === definitionId,
    );
    if (
      existing &&
      JSON.stringify(existing) !== JSON.stringify(buildingDefinition)
    )
      throw new Error(
        "Keep the locally edited building definition under its own ID",
      );
    next = existing
      ? structuredClone(project)
      : createCustomSymbol(project, structuredClone(buildingDefinition));
  } else {
    next = installSymbol(project, input.kind);
    definitionId = `library-${input.kind}`;
  }
  const layerId = existingLayer?.id ?? crypto.randomUUID();
  if (!existingLayer)
    next.layers.push({
      id: layerId,
      pageId: page.id,
      name: planLayer.name,
      visible: true,
      locked: false,
    });
  const symbolInstanceId = place(
    next,
    page.id,
    layerId,
    "custom",
    { x: page.widthMm / 2, y: page.heightMm / 2 },
    page.gridMm,
    definitionId,
  );
  const symbol = next.symbolInstances.find((s) => s.id === symbolInstanceId)!;
  const device = next.devices.find((d) => d.id === symbol.deviceId)!;
  device.reference = input.reference.trim();
  device.name = input.description.trim();
  symbol.name = device.reference;
  next = validateProject(next);
  return savePlanEquipment(
    next,
    {
      floorId: input.floorId,
      layerId: input.layerId,
      roomId: input.roomId,
      position: input.position,
      rotation: input.rotation,
      symbolScale: input.symbolScale,
      mountingHeightMm: input.mountingHeightMm,
      name: device.reference,
      symbolInstanceId,
    },
    gridMm,
  );
}
