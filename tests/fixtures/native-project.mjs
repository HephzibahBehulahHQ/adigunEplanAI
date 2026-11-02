import { createProject } from "../../packages/electrical-model/project.ts";
export function nativeProject() {
  const p = createProject(
    "Native model reference",
    "project-1",
    "2026-11-02T00:00:00.000Z",
  );
  p.documents.push({
    id: "doc",
    name: "Schematic",
    kind: "schematic",
    outputLanguage: "de",
  });
  p.layers.push({
    id: "layer",
    name: "Electrical",
    pageId: "page",
    visible: true,
    locked: false,
  });
  p.pages.push({
    id: "page",
    name: "Sheet 1",
    documentId: "doc",
    widthMm: 420,
    heightMm: 297,
    order: 0,
    gridMm: 5,
    snapping: true,
  });
  p.symbolDefinitions.push({
    id: "def",
    name: "Terminal",
    category: "terminal",
    glyph: "terminal",
    widthMm: 8,
    heightMm: 8,
    pins: [{ id: "1", position: { x: 0, y: 0 } }],
  });
  for (const [suffix, x] of [
    ["a", 10],
    ["b", 50],
  ]) {
    p.devices.push({
      id: `device-${suffix}`,
      name: `Device ${suffix}`,
      reference: `X${suffix}`,
    });
    p.terminals.push({
      id: `terminal-${suffix}`,
      name: "Terminal",
      deviceId: `device-${suffix}`,
      designation: "1",
      kind: "control",
    });
    p.symbolInstances.push({
      id: `symbol-${suffix}`,
      name: "Terminal",
      definitionId: "def",
      layerId: "layer",
      mirrored: false,
      deviceId: `device-${suffix}`,
      pageId: "page",
      position: { x, y: 20 },
      rotation: 0,
    });
    p.pins.push({
      id: `pin-${suffix}`,
      name: "1",
      terminalId: `terminal-${suffix}`,
      symbolInstanceId: `symbol-${suffix}`,
      definitionPinId: "1",
    });
  }
  p.wires.push({
    id: "wire",
    name: "W1",
    fromPinId: "pin-a",
    toPinId: "pin-b",
  });
  p.wirePaths.push({
    id: "path",
    wireId: "wire",
    layerId: "layer",
    pageId: "page",
    points: [
      { x: 10, y: 20 },
      { x: 50, y: 20 },
    ],
  });
  p.nets.push({ id: "net", name: "N1", wireIds: ["wire"] });
  return p;
}
