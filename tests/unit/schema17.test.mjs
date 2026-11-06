import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseProject,
  serializeProject,
  validateProject,
} from "../../packages/electrical-model/project.ts";
import { nativeProject } from "../fixtures/native-project.mjs";

function plcProject() {
  const project = nativeProject();
  project.plcModules.push({
    id: "plc-a",
    name: "Input module",
    deviceId: "device-a",
    channelCount: 2,
    moduleKind: "digital-input",
  });
  project.plcAddresses.push({
    id: "address-a",
    name: "Input 0",
    moduleId: "plc-a",
    channel: 0,
    address: "I0.0",
    dataType: "BOOL",
    terminalIds: ["terminal-a"],
    signalDeviceId: "device-b",
  });
  project.automationNotes.push({
    id: "note-a",
    name: "Sequence",
    kind: "sequence",
    deviceIds: ["device-a", "device-b"],
    description: "User-authored sequence documentation.",
  });
  return project;
}

test("schema16 migration preserves legacy engineering data and adds empty records", () => {
  const old = nativeProject();
  old.schemaVersion = 16;
  delete old.planRisers;
  delete old.automationNotes;
  delete old.panelStructures;
  const result = parseProject(JSON.stringify(old));
  assert.equal(result.migratedFrom, 16);
  assert.deepEqual(result.project, {
    ...old,
    schemaVersion: 17,
    planRisers: [],
    automationNotes: [],
    panelStructures: [],
  });
});

test("schema17 round-trips explicit PLC mappings and documentation", () => {
  const project = plcProject();
  assert.deepEqual(parseProject(serializeProject(project)).project, project);
});

for (const [label, change, error] of [
  [
    "case-insensitive addresses",
    (p) =>
      p.plcAddresses.push({
        ...p.plcAddresses[0],
        id: "address-b",
        channel: 1,
        address: "i0.0",
      }),
    /duplicate PLC address/,
  ],
  [
    "duplicate module devices",
    (p) => p.plcModules.push({ ...p.plcModules[0], id: "plc-b" }),
    /one PLC module/,
  ],
  [
    "another device's terminals",
    (p) => (p.plcAddresses[0].terminalIds = ["terminal-b"]),
    /module device/,
  ],
  [
    "duplicate mapped terminals",
    (p) => p.plcAddresses[0].terminalIds.push("terminal-a"),
    /Duplicate references/,
  ],
  [
    "missing signal device",
    (p) => (p.plcAddresses[0].signalDeviceId = "missing"),
    /reference/,
  ],
  [
    "digital REAL address",
    (p) => (p.plcAddresses[0].dataType = "REAL"),
    /data type/,
  ],
  [
    "analog BOOL address",
    (p) => (p.plcModules[0].moduleKind = "analog-input"),
    /data type/,
  ],
  [
    "duplicate note devices",
    (p) => p.automationNotes[0].deviceIds.push("device-a"),
    /Duplicate references/,
  ],
  [
    "missing note device",
    (p) => p.automationNotes[0].deviceIds.push("missing"),
    /reference/,
  ],
])
  test(`schema17 rejects ${label} at import`, () => {
    const project = plcProject();
    change(project);
    assert.throws(() => parseProject(JSON.stringify(project)), error);
  });

test("legacy unspecified PLC module kinds and analog numeric mappings remain supported", () => {
  const project = plcProject();
  delete project.plcModules[0].moduleKind;
  project.plcAddresses[0].dataType = "TIME";
  validateProject(project);
  project.plcModules[0].moduleKind = "analog-output";
  for (const dataType of ["INT", "REAL"]) {
    project.plcAddresses[0].dataType = dataType;
    validateProject(project);
  }
});
