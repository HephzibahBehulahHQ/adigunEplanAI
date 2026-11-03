import { test } from "node:test";
import assert from "node:assert/strict";
import { nativeProject } from "../fixtures/native-project.mjs";
import { analyze } from "../../packages/connectivity-engine/analyze.ts";
import { installSymbol } from "../../packages/component-library/symbols.ts";
import {
  createCustomSymbol,
  updateCustomSymbol,
} from "../../packages/component-library/custom-symbols.ts";
import {
  assignCustomComponent,
  createComponentRevision,
  exportCustomComponent,
  importCustomComponent,
} from "../../packages/component-library/custom-components.ts";
import {
  createProject,
  parseProject,
  serializeProject,
  validateProject,
} from "../../packages/electrical-model/project.ts";
import {
  place,
  paste,
  move,
  remove,
} from "../../packages/schematic-editor/commands.ts";
const definitionId = "library-cable-gland-mechanical";
const placeGland = (p) =>
  place(p, "page", "layer", "custom", { x: 200, y: 140 }, 5, definitionId);

test("mechanical cable gland places without electrical terminals, pins or net changes", () => {
  const original = nativeProject();
  const p = installSymbol(original, "cable-gland-mechanical");
  const id = placeGland(p);
  const instance = p.symbolInstances.find((s) => s.id === id);
  assert.equal(
    p.devices.find((d) => d.id === instance.deviceId).reference,
    "ME1",
  );
  assert.deepEqual(p.terminals, original.terminals);
  assert.deepEqual(p.pins, original.pins);
  assert.deepEqual(p.wires, original.wires);
  assert.deepEqual(analyze(p).nets, analyze(original).nets);
  assert.deepEqual(
    installSymbol(p, "cable-gland-mechanical"),
    validateProject(p),
  );
  const roundTrip = parseProject(serializeProject(p)).project;
  assert.equal(
    roundTrip.symbolDefinitions.find((d) => d.id === definitionId)
      .connectionClass,
    "mechanical",
  );
  assert.deepEqual(roundTrip.pins, p.pins);
});

test("mechanical objects move, copy and delete without creating electrical identities", () => {
  const p = installSymbol(nativeProject(), "cable-gland-mechanical");
  const id = placeGland(p);
  const clipboard = structuredClone(p);
  move(p, [id], { x: 80, y: 0 }, 5);
  const copied = paste(p, clipboard, [id], "page", "layer", 5);
  assert.equal(copied.length, 1);
  assert.equal(p.devices.filter((d) => /^ME/.test(d.reference)).length, 2);
  assert.equal(p.pins.length, 2);
  assert.equal(p.terminals.length, 2);
  assert.equal(p.wires.length, 1);
  remove(p, [id, ...copied]);
  assert.equal(p.devices.filter((d) => /^ME/.test(d.reference)).length, 0);
  assert.equal(p.wires.length, 1);
  validateProject(p);
});

test("mechanical declarations reject electrical pins and cannot change class after placement", () => {
  const p = installSymbol(nativeProject(), "cable-gland-mechanical");
  const definition = p.symbolDefinitions.find((d) => d.id === definitionId);
  assert.throws(
    () =>
      createCustomSymbol(p, {
        ...definition,
        id: "invalid-mechanical",
        pins: [{ id: "fake-pin", position: { x: 0, y: 0 } }],
      }),
    /Mechanical/,
  );
  const { connectionClass: ignored, ...unclassified } = definition;
  assert.equal(ignored, "mechanical");
  assert.throws(
    () => createCustomSymbol(p, { ...unclassified, id: "unclassified" }),
    /empty pin set/,
  );
  placeGland(p);
  assert.throws(
    () =>
      updateCustomSymbol(p, {
        ...unclassified,
        pins: [{ id: "A", position: { x: 0, y: 0 } }],
      }),
    /connection class/,
  );
});

test("user mechanical component revisions assign and export with zero electrical nodes", () => {
  let p = installSymbol(nativeProject(), "cable-gland-mechanical");
  const id = placeGland(p);
  const device = p.symbolInstances.find((s) => s.id === id).deviceId;
  p = createComponentRevision(p, {
    name: "User gland fixture",
    manufacturer: "User test laboratory",
    partNumber: "USER-GLAND",
    symbolDefinitionId: definitionId,
    ratings: {},
    details: {
      category: "connections",
      description: "User mechanical fixture",
      licensing: "user-owned",
      dimensionsMm: { width: 20, height: 20, depth: 30 },
    },
  });
  const part = p.manufacturerParts.at(-1);
  const assigned = assignCustomComponent(p, device, part.id);
  assert.equal(assigned.devices.find((d) => d.id === device).partId, part.id);
  assert.equal(assigned.terminals.length, 2);
  const imported = importCustomComponent(
    createProject("Mechanical import"),
    exportCustomComponent(assigned, part.id),
  );
  assert.equal(imported.symbolDefinitions[0].connectionClass, "mechanical");
  assert.deepEqual(imported.symbolDefinitions[0].pins, []);
  assert.equal(imported.manufacturerParts[0].custom.verification, "unverified");
});

test("schema seven migration preserves electrical and undeclared empty definitions without guessing mechanical class", () => {
  const p = nativeProject();
  p.symbolDefinitions.push({
    id: "legacy-empty",
    name: "Legacy empty drawing",
    category: "custom",
    glyph: "box",
    widthMm: 20,
    heightMm: 20,
    pins: [],
  });
  const migrated = parseProject(JSON.stringify({ ...p, schemaVersion: 7 }));
  assert.equal(migrated.migratedFrom, 7);
  assert.equal(migrated.project.schemaVersion, 12);
  assert.deepEqual(migrated.project.pins, p.pins);
  assert.equal(
    migrated.project.symbolDefinitions.find((d) => d.id === "legacy-empty")
      .connectionClass,
    undefined,
  );
});
