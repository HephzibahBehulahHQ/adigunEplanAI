import { test } from "node:test";
import assert from "node:assert/strict";
import { nativeProject } from "../fixtures/native-project.mjs";
import {
  createPlcModule,
  plcKinds,
  savePlcModule,
  savePlcAddress,
  removePlcAddress,
  removePlcModule,
  saveAutomationNote,
  removeAutomationNote,
  plcWiringSchedule,
} from "../../packages/automation/plc.ts";
import {
  parseProject,
  serializeProject,
  validateProject,
} from "../../packages/electrical-model/project.ts";
import { connect } from "../../packages/schematic-editor/commands.ts";
import { analyze } from "../../packages/connectivity-engine/analyze.ts";

function fixture(kind = "digital-input") {
  return createPlcModule(nativeProject(), {
    kind,
    pageId: "page",
    reference: "PLC1",
    name: "Input module",
  });
}
function mapping(p, options = {}) {
  const module = p.plcModules[0];
  const terminal = p.terminals.find(
    (item) => item.deviceId === module.deviceId && item.kind === "signal",
  );
  return {
    id: "io-1",
    name: "Limit switch",
    moduleId: module.id,
    channel: 0,
    address: "%IX0.0",
    dataType: "BOOL",
    terminalIds: [terminal.id],
    signalDeviceId: "device-a",
    ...options,
  };
}
test("six generic PLC interfaces create real native devices, terminals and modules atomically", () => {
  const original = nativeProject();
  const before = JSON.stringify(original);
  for (const kind of plcKinds) {
    const p = createPlcModule(original, {
      kind,
      pageId: "page",
      reference: "PLC1",
      name: kind,
    });
    assert.equal(p.devices.length, original.devices.length + 1);
    assert.equal(p.plcModules[0].moduleKind, kind);
    assert.ok(
      p.terminals.some(
        (terminal) => terminal.deviceId === p.plcModules[0].deviceId,
      ),
    );
    assert.deepEqual(p.wires, original.wires);
    assert.equal(
      parseProject(serializeProject(p)).project.plcModules[0].deviceId,
      p.devices.at(-1).id,
    );
  }
  assert.equal(JSON.stringify(original), before);
  assert.throws(
    () =>
      createPlcModule(original, {
        kind: "digital-input",
        pageId: "page",
        reference: "Xa",
        name: "Duplicate",
      }),
    /Duplicate device/,
  );
  assert.equal(JSON.stringify(original), before);
});
test("expanded PLC symbols match 16-channel input and 8-channel output modules", () => {
  for (const [kind, channelCount, pinPrefix] of [
    ["digital-input", 16, "IN"],
    ["digital-output", 8, "OUT"],
  ]) {
    const p = createPlcModule(nativeProject(), {
      kind,
      channelCount,
      pageId: "page",
      reference: "IO1",
      name: `WAGO ${channelCount}-channel ${kind}`,
    });
    const module = p.plcModules[0];
    const instance = p.symbolInstances.find(
      (item) => item.deviceId === module.deviceId,
    );
    const channelPins = p.pins.filter(
      (pin) =>
        pin.symbolInstanceId === instance.id &&
        pin.definitionPinId.startsWith(pinPrefix),
    );
    assert.equal(module.channelCount, channelCount);
    assert.equal(channelPins.length, channelCount);
    assert.equal(
      parseProject(serializeProject(p)).project.plcModules[0].channelCount,
      channelCount,
    );
  }
  assert.throws(
    () =>
      createPlcModule(nativeProject(), {
        kind: "digital-input",
        channelCount: 12,
        pageId: "page",
        reference: "IO1",
        name: "Unsupported PLC module",
      }),
    /supported PLC kind/,
  );
});
test("unused PLC digital channels are spare interfaces; mapped open channels remain findings", () => {
  const p = createPlcModule(nativeProject(), {
    kind: "digital-input",
    channelCount: 16,
    pageId: "page",
    reference: "DI1",
    name: "WAGO 16-channel input",
  });
  const module = p.plcModules[0];
  const spare = p.terminals.find(
    (terminal) =>
      terminal.deviceId === module.deviceId && terminal.designation === "IN15",
  );
  assert.ok(spare);
  assert.ok(
    !analyze(p).findings.some(
      (finding) =>
        finding.code === "OPEN_TERMINAL" &&
        finding.entityIds.includes(spare.id),
    ),
  );
  const mapped = savePlcAddress(p, {
    id: "mapped-input",
    name: "Remote status input",
    moduleId: module.id,
    channel: 15,
    address: "%IX1.15",
    dataType: "BOOL",
    terminalIds: [spare.id],
  });
  assert.ok(
    analyze(mapped).findings.some(
      (finding) =>
        finding.code === "OPEN_TERMINAL" &&
        finding.entityIds.includes(spare.id),
    ),
  );
});
test("PLC I/O rejects duplicate addresses/channels, wrong terminal ownership and incompatible data types", () => {
  const p = fixture();
  const a = mapping(p);
  const saved = savePlcAddress(p, a);
  assert.throws(
    () =>
      savePlcAddress(saved, {
        ...a,
        id: "other",
        channel: 1,
        address: "%ix0.0",
      }),
    /unique|duplicate/i,
  );
  assert.throws(
    () => savePlcAddress(saved, { ...a, id: "other", address: "%IX0.1" }),
    /duplicate/i,
  );
  assert.throws(
    () => savePlcAddress(p, { ...a, terminalIds: ["terminal-a"] }),
    /belong/,
  );
  assert.throws(() => savePlcAddress(p, { ...a, dataType: "REAL" }), /BOOL/);
  assert.throws(() => savePlcAddress(p, { ...a, channel: 4 }), /Invalid/);
  assert.throws(
    () =>
      savePlcModule(saved, {
        ...p.plcModules[0],
        channelCount: 1,
        moduleKind: "analog-input",
      }),
    /INT|REAL/,
  );
  assert.throws(
    () => removePlcModule(saved, p.plcModules[0].id),
    /Remove I\/O/,
  );
  assert.equal(
    removePlcModule(removePlcAddress(saved, a.id), p.plcModules[0].id)
      .plcModules.length,
    0,
  );
});
test("PLC terminal schedules derive actual wires separately from signal associations and survive native reload", () => {
  let p = fixture();
  const address = mapping(p);
  p = savePlcAddress(p, address);
  let row = plcWiringSchedule(p)[0];
  assert.equal(row.signal, "Xa");
  assert.deepEqual(row.wireIds, []);
  const pin = p.pins.find((item) => item.terminalId === address.terminalIds[0]);
  connect(p, pin.id, "pin-a");
  p = parseProject(serializeProject(p)).project;
  row = plcWiringSchedule(p)[0];
  assert.equal(row.wireIds.length, 1);
  assert.equal(row.address, "%IX0.0");
  assert.ok(row.terminals.length > 0);
});
test("protected PLC layers and referenced devices retain controls and safety documentation", () => {
  let p = fixture();
  const note = {
    id: "note",
    name: "Emergency-stop intent",
    kind: "emergency-stop",
    deviceIds: [p.plcModules[0].deviceId],
    description:
      "Documentation only; safety architecture requires independent design review.",
  };
  p = saveAutomationNote(p, note);
  assert.equal(p.automationNotes.length, 1);
  const bad = structuredClone(p);
  bad.devices = bad.devices.filter((device) => device.id !== note.deviceIds[0]);
  assert.throws(() => validateProject(bad));
  p.layers[0].locked = true;
  assert.throws(() => savePlcAddress(p, mapping(p)), /protected/);
  assert.throws(() => removeAutomationNote(p, note.id), /protected/);
  p.layers[0].locked = false;
  assert.equal(removeAutomationNote(p, note.id).automationNotes.length, 0);
});
