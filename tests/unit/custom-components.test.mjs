import { test } from "node:test";
import {
  assignCatalogPart,
  catalog,
} from "../../packages/component-library/catalog.ts";
import assert from "node:assert/strict";
import { nativeProject } from "../fixtures/native-project.mjs";
import {
  createProject,
  parseProject,
  serializeProject,
  validateProject,
} from "../../packages/electrical-model/project.ts";
import {
  createComponentRevision,
  assignCustomComponent,
  compatibleCustomComponent,
  exportCustomComponent,
  importCustomComponent,
  maxComponentBytes,
} from "../../packages/component-library/custom-components.ts";
const input = () => ({
  name: "User test terminal",
  manufacturer: "User test organization",
  partNumber: "USER-TEST-1",
  symbolDefinitionId: "def",
  ratings: { nominalVoltageV: 24 },
  details: {
    category: "connections",
    description: "User-authored terminal fixture",
    licensing: "user-owned",
    terminalInformation: "One common node",
    mounting: "User-defined mounting",
    dimensionsMm: { width: 10, height: 20, depth: 30 },
  },
});
const latest = (p) => p.manufacturerParts.at(-1);

test("custom component revisions preserve assigned records and reject stale editing", () => {
  const original = nativeProject();
  const first = createComponentRevision(original, input());
  const part = latest(first);
  assert.equal(original.manufacturerParts.length, 0);
  assert.equal(part.custom.revision, 1);
  assert.equal(part.custom.verification, "unverified");
  assert.equal(part.custom.provenance, "user-supplied");
  assert.equal(part.sourceUrl, undefined);
  const assigned = assignCustomComponent(first, "device-a", part.id);
  const second = createComponentRevision(
    assigned,
    { ...input(), ratings: { nominalVoltageV: 48 } },
    part.id,
  );
  assert.equal(latest(second).custom.revision, 2);
  assert.equal(latest(second).custom.componentId, part.custom.componentId);
  assert.equal(second.devices.find((d) => d.id === "device-a").partId, part.id);
  assert.equal(second.manufacturerParts[0].ratings.nominalVoltageV, 24);
  assert.deepEqual(second.pins, original.pins);
  assert.deepEqual(second.wires, original.wires);
  assert.throws(
    () => createComponentRevision(second, input(), part.id),
    /Stale/,
  );
  const replaced = assignCustomComponent(second, "device-a", latest(second).id);
  assert.equal(
    replaced.devices.find((d) => d.id === "device-a").partId,
    latest(second).id,
  );
  assert.deepEqual(replaced.terminals, original.terminals);
  assert.deepEqual(parseProject(serializeProject(replaced)).project, replaced);
});

test("custom component assignment respects exact symbol mapping and layer protection", () => {
  const p = createComponentRevision(nativeProject(), input());
  const id = latest(p).id;
  assert.equal(compatibleCustomComponent(p, "device-a", id), true);
  p.layers[0].locked = true;
  assert.equal(compatibleCustomComponent(p, "device-a", id), false);
  assert.throws(() => assignCustomComponent(p, "device-a", id), /compatible/);
  p.layers[0].locked = false;
  p.layers[0].visible = false;
  assert.throws(() => assignCustomComponent(p, "device-a", id), /compatible/);
  p.layers[0].visible = true;
  assert.throws(() => assignCustomComponent(p, "missing", id), /compatible/);
  p.symbolDefinitions[0].name = "Changed definition";
  assert.throws(() => validateProject(p), /symbol revision/);
});

test("component export imports atomically into another project and preserves native symbol IDs", () => {
  const p = createComponentRevision(nativeProject(), input());
  const text = exportCustomComponent(p, latest(p).id);
  const target = createProject("Target");
  const imported = importCustomComponent(target, text);
  assert.equal(target.manufacturerParts.length, 0);
  assert.deepEqual(imported.manufacturerParts, p.manufacturerParts);
  assert.deepEqual(imported.symbolDefinitions, p.symbolDefinitions);
  assert.deepEqual(importCustomComponent(imported, text), imported);
  assert.deepEqual(parseProject(serializeProject(imported)).project, imported);
  const conflict = structuredClone(imported);
  conflict.manufacturerParts[0].name = "Local revision name";
  const before = serializeProject(conflict);
  assert.throws(() => importCustomComponent(conflict, text), /conflicts/);
  assert.equal(serializeProject(conflict), before);
  const symbolConflict = nativeProject();
  symbolConflict.symbolDefinitions[0].name = "Local symbol edit";
  assert.throws(
    () => importCustomComponent(symbolConflict, text),
    /local edits/,
  );
});

test("component files reject unsupported versions, unsafe claims, geometry and oversized input", () => {
  const p = createComponentRevision(nativeProject(), input());
  const file = JSON.parse(exportCustomComponent(p, latest(p).id));
  const cases = [];
  for (const mutate of [
    (f) => (f.formatVersion = 2),
    (f) => (f.part.custom.verification = "verified"),
    (f) => (f.part.sourceUrl = "javascript:alert(1)"),
    (f) => (f.part.custom.dimensionsMm.width = -1),
    (f) => (f.part.custom.symbolDefinition.pins[0].position.x = 10000),
    (f) => (f.part.custom.symbolDefinition.pins = []),
    (f) =>
      (f.part.custom.symbolDefinition.artwork = [
        { kind: "svg", text: "<script/>" },
      ]),
  ]) {
    const next = structuredClone(file);
    mutate(next);
    cases.push(JSON.stringify(next));
  }
  cases.push("{", " ".repeat(maxComponentBytes + 1));
  const before = serializeProject(p);
  for (const text of cases) {
    assert.throws(() => importCustomComponent(p, text));
    assert.equal(serializeProject(p), before);
  }
});

test("custom revision identity conflicts cannot silently overwrite a different record", () => {
  const p = createComponentRevision(nativeProject(), input());
  const file = JSON.parse(exportCustomComponent(p, latest(p).id));
  file.part.id = "different-record";
  assert.throws(
    () => importCustomComponent(p, JSON.stringify(file)),
    /Duplicate custom component revision/,
  );
});

test("schema six migrates to the current schema without inventing component verification or changing electrical IDs", () => {
  const p = nativeProject();
  const legacy = { ...p, schemaVersion: 6 };
  const result = parseProject(JSON.stringify(legacy));
  assert.equal(result.migratedFrom, 6);
  assert.equal(result.project.schemaVersion, 13);
  assert.deepEqual(result.project.pins, p.pins);
  assert.deepEqual(result.project.terminals, p.terminals);
  assert.deepEqual(result.project.manufacturerParts, []);
});

test("custom rating units stay numeric and catalog assignment cannot reuse an unverified custom record", () => {
  for (const ratings of [
    { nominalVoltageV: "24 V" },
    { nominalCurrentA: -1 },
    { ratedCrossSectionMm2: 0 },
  ])
    assert.throws(() =>
      createComponentRevision(nativeProject(), { ...input(), ratings }),
    );
  const source = catalog[0];
  const p = createComponentRevision(nativeProject(), {
    ...input(),
    name: source.name,
    manufacturer: source.manufacturer,
    partNumber: source.partNumber,
    sourceUrl: source.sourceUrl,
    ratings: source.ratings,
  });
  const customId = latest(p).id;
  const assigned = assignCatalogPart(p, "device-a", source.id);
  assert.equal(assigned.manufacturerParts.length, 2);
  assert.notEqual(
    assigned.devices.find((d) => d.id === "device-a").partId,
    customId,
  );
  assert.equal(
    assigned.manufacturerParts.find((part) => part.id === customId).custom
      .verification,
    "unverified",
  );
});
