import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createProject,
  validateProject,
  serializeProject,
  parseProject,
  collections,
  maxProjectBytes,
} from "../../packages/electrical-model/project.ts";
import { ProjectHistory } from "../../packages/electrical-model/history.ts";
import {
  loadLibrary,
  saveLibrary,
  projectStorageKey,
} from "../../packages/project-storage/repository.ts";
import { nativeProject } from "../fixtures/native-project.mjs";

test("native document retains engineering meaning separately from wire geometry", () => {
  const p = nativeProject();
  assert.equal(collections.length, 42);
  assert.deepEqual(parseProject(serializeProject(p)).project, p);
  const moved = structuredClone(p);
  moved.wirePaths[0].points.splice(1, 0, { x: 100, y: 20 });
  assert.deepEqual(validateProject(moved).wires, p.wires);
});
for (const [name, change] of [
  ["dangling terminal", (p) => (p.pins[0].terminalId = "missing")],
  ["wrong definition pin", (p) => (p.pins[0].definitionPinId = "missing")],
  ["wrong device mapping", (p) => (p.pins[0].terminalId = "terminal-b")],
  ["self wire", (p) => (p.wires[0].toPinId = "pin-a")],
  ["duplicate global IDs", (p) => (p.pages[0].id = "doc")],
  [
    "duplicate device reference",
    (p) => (p.devices[1].reference = p.devices[0].reference),
  ],
  ["duplicate net references", (p) => p.nets[0].wireIds.push("wire")],
  ["nonfinite coordinate", (p) => (p.symbolInstances[0].position.x = Infinity)],
  ["negative sheet size", (p) => (p.pages[0].widthMm = -1)],
  ["unexpected imported fields", (p) => (p.execute = "arbitrary code")],
  [
    "invalid timestamp order",
    (p) => (p.updatedAt = "2000-01-01T00:00:00.000Z"),
  ],
])
  test(`native validation rejects ${name}`, () => {
    const p = nativeProject();
    change(p);
    assert.throws(() => validateProject(p));
  });
test("wire path must refer to endpoints on its drawing page", () => {
  const p = nativeProject();
  p.pages.push({ ...p.pages[0], id: "other-page", order: 1 });
  p.wirePaths[0].pageId = "other-page";
  assert.throws(() => validateProject(p), /page mismatch/);
});

test("native pin mappings must be complete, unique and consistent with declared kinds", () => {
  const p = nativeProject();
  const pin = p.pins[0];
  const instance = p.symbolInstances.find((s) => s.id === pin.symbolInstanceId);
  const definition = p.symbolDefinitions.find(
    (d) => d.id === instance.definitionId,
  );
  const declaration = definition.pins.find((d) => d.id === pin.definitionPinId);
  const terminal = p.terminals.find((t) => t.id === pin.terminalId);
  declaration.kind = terminal.kind;
  validateProject(p);
  const mismatch = structuredClone(p);
  mismatch.terminals.find((t) => t.id === terminal.id).kind =
    terminal.kind === "pe" ? "power" : "pe";
  assert.throws(() => validateProject(mismatch), /kind mismatch/);
  const duplicate = structuredClone(p);
  duplicate.pins.push({ ...pin, id: "duplicate-pin" });
  assert.throws(
    () => validateProject(duplicate),
    /Duplicate symbol pin mapping/,
  );
  const incomplete = structuredClone(p);
  incomplete.symbolDefinitions
    .find((d) => d.id === definition.id)
    .pins.push({ id: "unmapped", position: { x: 0, y: 0 } });
  assert.throws(() => validateProject(incomplete), /Incomplete/);
  const history = new ProjectHistory(p);
  assert.throws(() => history.execute(() => mismatch));
  assert.equal(history.canUndo, false);
  assert.deepEqual(history.current, p);
});
test("PLC addresses are bounded by real module channels", () => {
  const p = nativeProject();
  p.plcModules.push({
    id: "plc",
    name: "I/O",
    deviceId: "device-a",
    channelCount: 2,
  });
  p.plcAddresses.push({
    id: "address",
    name: "Input",
    moduleId: "plc",
    channel: 2,
    address: "I0.2",
    dataType: "BOOL",
  });
  assert.throws(() => validateProject(p), /PLC address/);
  p.plcAddresses[0].channel = 1;
  validateProject(p);
});
test("version zero migration fills only missing collections and rejects future versions", () => {
  const legacy = {
    schemaVersion: 0,
    id: "legacy",
    name: "Legacy",
    createdAt: "2026-11-02T00:00:00.000Z",
    updatedAt: "2026-11-02T00:00:00.000Z",
  };
  const migrated = parseProject(JSON.stringify(legacy));
  assert.equal(migrated.migratedFrom, 0);
  assert.equal(migrated.project.schemaVersion, 18);
  assert.deepEqual(migrated.project.documents, []);
  assert.throws(
    () => parseProject(JSON.stringify({ ...legacy, schemaVersion: 99 })),
    /Unsupported/,
  );
  assert.throws(() => parseProject(" ".repeat(maxProjectBytes + 1)), /limit/);
});
test("history validates atomically, isolates snapshots and invalidates redo branches", () => {
  const h = new ProjectHistory(nativeProject());
  const external = h.current;
  external.name = "Outside";
  assert.notEqual(h.current.name, "Outside");
  assert.throws(() => h.execute((p) => ({ ...p, pages: [] })));
  assert.equal(h.canUndo, false);
  h.execute((p) => ({ ...p, name: "Changed" }));
  assert.equal(h.canUndo, true);
  h.undo();
  assert.equal(h.current.name, "Native model reference");
  h.redo();
  assert.equal(h.current.name, "Changed");
  h.undo();
  h.execute((p) => ({ ...p, name: "Branch" }));
  assert.equal(h.canRedo, false);
});
test("history no-ops do not add entries and history is bounded", () => {
  const h = new ProjectHistory(createProject("Start"));
  h.execute((p) => p);
  assert.equal(h.canUndo, false);
  for (let i = 0; i < 60; i++) h.execute((p) => ({ ...p, name: `Edit ${i}` }));
  let count = 0;
  while (h.canUndo) {
    h.undo();
    count++;
  }
  assert.equal(count, 50);
});
test("local library round trip and quota failure preserve the last saved document", () => {
  const data = new Map();
  const storage = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
  };
  const p = nativeProject();
  saveLibrary(storage, { projects: [p], activeProjectId: p.id });
  const before = data.get(projectStorageKey);
  assert.deepEqual(loadLibrary(storage), {
    projects: [p],
    activeProjectId: p.id,
  });
  assert.throws(
    () =>
      saveLibrary(
        {
          ...storage,
          setItem: () => {
            throw new Error("Quota exceeded");
          },
        },
        { projects: [{ ...p, name: "Unsaved" }], activeProjectId: p.id },
      ),
    /Quota/,
  );
  assert.equal(data.get(projectStorageKey), before);
  assert.throws(
    () => saveLibrary(storage, { projects: [p], activeProjectId: "missing" }),
    /active/,
  );
  assert.equal(data.get(projectStorageKey), before);
});
test("corrupt or future stored projects are reported without overwriting storage", () => {
  for (const text of [
    "{",
    JSON.stringify({ version: 99, projects: [], activeProjectId: null }),
    JSON.stringify({
      version: 1,
      projects: [{ schemaVersion: 99 }],
      activeProjectId: null,
    }),
  ]) {
    let writes = 0;
    const storage = { getItem: () => text, setItem: () => writes++ };
    assert.throws(() => loadLibrary(storage));
    assert.equal(writes, 0);
  }
});

test("unknown library fields are rejected rather than silently discarded", () => {
  const text = JSON.stringify({
    version: 1,
    projects: [],
    activeProjectId: null,
    futureData: { important: true },
  });
  assert.throws(
    () =>
      loadLibrary({
        getItem: () => text,
        setItem: () => {
          throw new Error("Unexpected write");
        },
      }),
    /Unknown/,
  );
});

test("document ordering and graphical pin mapping stay unambiguous", () => {
  const p = nativeProject();
  p.pages.push({ ...p.pages[0], id: "duplicate-order" });
  assert.throws(() => validateProject(p), /page order/);
  const q = nativeProject();
  q.pins.push({ ...q.pins[0], id: "duplicate-pin" });
  assert.throws(() => validateProject(q), /pin mapping/);
  const n = nativeProject();
  n.nets.push({ ...n.nets[0], id: "second-net" });
  assert.throws(() => validateProject(n), /multiple nets/);
});
