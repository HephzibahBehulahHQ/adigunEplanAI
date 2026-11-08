import test from "node:test";
import assert from "node:assert/strict";
import { mountCabinetDevice } from "../../packages/electrical-model/cabinet.ts";
import { nativeProject } from "../fixtures/native-project.mjs";

test("cabinet mount preserves native device identity and rejects duplicate, colliding and out-of-bounds placement", () => {
  const project = nativeProject();
  project.enclosures.push({
    id: "cabinet",
    name: "Cabinet",
    widthMm: 200,
    heightMm: 300,
    depthMm: 80,
  });
  const first = {
    id: "mount-a",
    name: "Device A",
    enclosureId: "cabinet",
    deviceId: project.devices[0].id,
    positionMm: { x: 0, y: 0, z: 0 },
    sizeMm: { x: 100, y: 50, z: 30 },
  };
  const mounted = mountCabinetDevice(project, first);
  assert.equal(project.equipment3d.length, 0);
  assert.deepEqual(mounted.equipment3d, [first]);
  assert.deepEqual(mounted.wires, project.wires);
  const moved = mountCabinetDevice(mounted, {
    ...first,
    positionMm: { x: 25, y: 0, z: 0 },
  });
  assert.equal(moved.equipment3d.length, 1);
  assert.equal(moved.equipment3d[0].positionMm.x, 25);
  assert.equal(mounted.equipment3d[0].positionMm.x, 0);
  assert.throws(
    () =>
      mountCabinetDevice(mounted, {
        ...first,
        deviceId: project.devices[1].id,
      }),
    /cannot change/,
  );
  assert.throws(
    () => mountCabinetDevice(mounted, { ...first, id: "duplicate" }),
    /already mounted/,
  );
  const second = { ...first, id: "mount-b", deviceId: project.devices[1].id };
  assert.throws(() => mountCabinetDevice(mounted, second), /overlaps/);
  assert.throws(
    () =>
      mountCabinetDevice(mounted, {
        ...second,
        positionMm: { x: 101, y: 0, z: 0 },
      }),
    /fit inside/,
  );
  assert.equal(
    mountCabinetDevice(mounted, {
      ...second,
      positionMm: { x: 100, y: 0, z: 0 },
    }).equipment3d.length,
    2,
  );
});
