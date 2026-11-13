import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { engineeringSymbols } from "../packages/component-library/symbols.ts";
import { primitives } from "../packages/schematic-editor/commands.ts";

// Primitive artwork copied from the preserved Glyph renderer; no new pinouts.
const primitiveArtwork = {
  terminal: [{ kind: "rect", x: -2, y: -2, width: 4, height: 4 }],
  junction: [
    { kind: "circle", center: { x: 0, y: 0 }, radiusMm: 1.2, solid: true },
  ],
  resistor: [
    { kind: "path", d: "M-10 0H-6 M6 0H10" },
    { kind: "rect", x: -6, y: -2.5, width: 12, height: 5 },
  ],
  fuse: [
    { kind: "path", d: "M-10 0H10" },
    { kind: "rect", x: -6, y: -2.5, width: 12, height: 5 },
  ],
  contact: [{ kind: "path", d: "M-10 0H-5 M5 0H10 M-5 0L4 -4" }],
  coil: [
    { kind: "path", d: "M-9 0H-5 M5 0H9" },
    { kind: "rect", x: -5, y: -4, width: 10, height: 8 },
  ],
  lamp: [
    { kind: "circle", center: { x: 0, y: 0 }, radiusMm: 5 },
    {
      kind: "path",
      d: "M-3.5 -3.5L3.5 3.5 M-3.5 3.5L3.5 -3.5 M-6 0H-5 M5 0H6",
    },
  ],
  motor: [
    { kind: "circle", center: { x: 0, y: 0 }, radiusMm: 8 },
    { kind: "path", d: "M-9 0H-8 M8 0H9" },
    { kind: "text", text: "M", x: 0, y: 1.5, size: 5 },
  ],
  ground: [{ kind: "path", d: "M0 -6V0 M-5 0H5 M-3 2H3 M-1 4H1" }],
};
const names = {
  terminal: "Terminal",
  junction: "Junction",
  resistor: "Resistor",
  fuse: "Fuse",
  contact: "Normally open contact",
  coil: "Coil",
  lamp: "Lamp",
  motor: "DC motor",
  ground: "Protective earth",
};
const originals = [
  ...engineeringSymbols.map((s) => ({
    ...s,
    prefix: s.connectionClass === "mechanical" ? "ME" : "U",
    source: "packages/component-library/symbols.ts",
  })),
  ...Object.entries(primitives).map(([id, s]) => ({
    id,
    name: names[id],
    category: "core electrical",
    width: s.w,
    height: s.h,
    pins: s.pins,
    artwork: primitiveArtwork[id],
    prefix: s.prefix,
    source: "packages/schematic-editor/commands.ts",
  })),
];
export const eplanDefinitions = originals.map((s) => ({
  schemaVersion: 1,
  id: `eplan-${s.id}`,
  name: s.name,
  model: s.name,
  generic: true,
  manufacturer: "Not assigned",
  manufacturerPartNumber: "Not assigned",
  family: "eplan-original",
  referencePrefix: s.prefix,
  category: `Eplan · ${s.category}`,
  connectionClass: s.connectionClass || "electrical",
  originalSymbolId: s.id,
  originalSource: s.source,
  symbol: {
    id: `library-${s.id}`,
    view: "schematic",
    unit: "mm",
    width: s.width,
    height: s.height,
    artwork: s.artwork,
    pins: s.pins.map((p) => ({
      id: p.id,
      localNumber: p.id,
      name: p.id,
      x: p.position.x,
      y: p.position.y,
      electricalType: p.kind || "power",
      connectionType: "schematic",
      ...(p.terminalGroup ? { terminalGroup: p.terminalGroup } : {}),
    })),
    internalConnections: [],
    numberingNote:
      "Original Eplan schematic pin identities; no manufacturer terminal assignment or internal conductive path is inferred.",
  },
  specifications: {},
  instanceProperties: {
    comment: { type: "string", default: "", maximumLength: 160 },
  },
  sources: [],
}));
export function exportEplanSymbols() {
  const root = fileURLToPath(new URL("../", import.meta.url));
  fs.writeFileSync(
    `${root}apps/web/public/eplan-symbols.js`,
    `/* Generated from preserved AdigunEplanAI symbol definitions. */\nglobalThis.AdigunEplanSymbols = ${JSON.stringify(eplanDefinitions)};\n`,
  );
}
exportEplanSymbols();
