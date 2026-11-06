import { test } from "node:test";
import assert from "node:assert/strict";
import { nativeProject } from "../fixtures/native-project.mjs";
import {
  parseProject,
  serializeProject,
  validateProject,
} from "../../packages/electrical-model/project.ts";
import { ProjectHistory } from "../../packages/electrical-model/history.ts";
import { electricalTransaction } from "../../packages/connectivity-engine/transaction.ts";
import { remove } from "../../packages/schematic-editor/commands.ts";

for (const reference of ["automation note", "PLC signal"]) {
  test(`deleting the last symbol retains a device referenced by its ${reference}`, () => {
    const project = nativeProject();
    if (reference === "automation note")
      project.automationNotes.push({
        id: "note",
        name: "Interlock",
        kind: "interlock",
        deviceIds: ["device-a"],
        description: "Documented device association",
      });
    else {
      project.plcModules.push({
        id: "plc",
        name: "Input module",
        deviceId: "device-b",
        channelCount: 1,
        moduleKind: "digital-input",
      });
      project.plcAddresses.push({
        id: "address",
        name: "Associated signal",
        moduleId: "plc",
        channel: 0,
        address: "I0.0",
        dataType: "BOOL",
        signalDeviceId: "device-a",
      });
    }
    const history = new ProjectHistory(validateProject(project));
    const removed = history.execute((draft) =>
      electricalTransaction(draft, (next) => remove(next, ["symbol-a"])),
    );
    assert.ok(!removed.symbolInstances.some((item) => item.id === "symbol-a"));
    assert.ok(
      !removed.pins.some((item) => item.symbolInstanceId === "symbol-a"),
    );
    assert.ok(removed.devices.some((item) => item.id === "device-a"));
    assert.ok(removed.terminals.some((item) => item.id === "terminal-a"));
    assert.deepEqual(removed.automationNotes, project.automationNotes);
    assert.deepEqual(removed.plcAddresses, project.plcAddresses);
    assert.deepEqual(
      parseProject(serializeProject(removed)).project.devices,
      removed.devices,
    );
    const restored = history.undo();
    assert.ok(restored.symbolInstances.some((item) => item.id === "symbol-a"));
    assert.equal(restored.wires.length, project.wires.length);
  });
}

test("unreferenced devices still disappear when their final symbol is removed", () => {
  const removed = electricalTransaction(nativeProject(), (project) =>
    remove(project, ["symbol-a"]),
  );
  assert.ok(!removed.devices.some((item) => item.id === "device-a"));
  assert.ok(!removed.terminals.some((item) => item.deviceId === "device-a"));
});
