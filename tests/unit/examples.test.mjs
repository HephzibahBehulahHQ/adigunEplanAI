import { test } from "node:test";
import assert from "node:assert/strict";
import {
  examples,
  buildExample,
} from "../../packages/example-projects/index.ts";
import {
  serializeProject,
  parseProject,
} from "../../packages/electrical-model/project.ts";
import { analyze } from "../../packages/connectivity-engine/analyze.ts";
import { schematicSvg } from "../../packages/reporting/drawings.ts";
import { schematicDxf } from "../../packages/reporting/dxf.ts";
import {
  panelReport,
  panelLayoutSvg,
  panelGeometryObj,
} from "../../packages/panel-engineering/report.ts";
import { circuitSchedule } from "../../packages/building-design/circuits.ts";
import { plcWiringSchedule } from "../../packages/automation/plc.ts";

for (const example of examples) {
  test(`original ${example.id} example: native round trip, connectivity, drawings and cabinet evidence`, () => {
    const p = buildExample(example.id);
    assert.deepEqual(parseProject(serializeProject(p)).project, p);
    assert.equal(
      new Set(p.devices.map((d) => d.reference)).size,
      p.devices.length,
    );
    const result = analyze(p);
    assert.ok(
      result.findings.every((finding) => finding.code === "OPEN_TERMINAL"),
    );
    for (const page of p.pages) {
      const svg = schematicSvg(p, page.id);
      assert.ok(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'));
      for (const instance of p.symbolInstances.filter(
        (s) => s.pageId === page.id,
      )) {
        assert.ok(svg.includes(`data-device-id="${instance.deviceId}"`));
      }
      assert.ok(schematicDxf(p, page.id).includes("EOF"));
    }
    for (const enclosure of p.enclosures) {
      assert.deepEqual(panelReport(p, enclosure.id).diagnostics, []);
      assert.ok(
        panelLayoutSvg(
          p,
          enclosure.id,
          "Manually dimensioned generic educational envelopes",
        ).includes("<svg"),
      );
      assert.ok(panelGeometryObj(p, enclosure.id).includes("\nv "));
    }
    assert.ok(p.equipment3d.every((item) => item.dimensionSource === "manual"));
    assert.equal(p.manufacturerParts.length, 0);
    const second = buildExample(example.id);
    assert.notEqual(second.id, p.id);
    assert.ok(
      second.devices.every(
        (device) => !p.devices.some((old) => old.id === device.id),
      ),
    );
  });
}

test("substation documents separate transformer winding nets and secondary trip interface", () => {
  const p = buildExample("substation");
  assert.equal(p.pages.length, 2);
  assert.equal(p.devices.length, 15);
  assert.equal(p.wires.length, 15);
  const transformer = p.devices.find((d) => d.reference === "T1");
  const instance = p.symbolInstances.find((s) => s.deviceId === transformer.id);
  const pins = p.pins.filter((pin) => pin.symbolInstanceId === instance.id);
  const nets = analyze(p).nets;
  const windingNets = pins.map(
    (pin) => nets.find((net) => net.pinIds.includes(pin.id))?.id,
  );
  assert.equal(new Set(windingNets).size, 4);
  assert.ok(windingNets.every(Boolean));
});

test("motor example preserves separate phases and explicit PE conductor", () => {
  const p = buildExample("motor");
  assert.equal(p.wires.length, 11);
  const motor = p.devices.find((d) => d.reference === "M1");
  const instance = p.symbolInstances.find((s) => s.deviceId === motor.id);
  const pins = p.pins.filter((pin) => pin.symbolInstanceId === instance.id);
  const nets = analyze(p).nets;
  assert.equal(
    new Set(
      pins.map((pin) => nets.find((net) => net.pinIds.includes(pin.id))?.id),
    ).size,
    4,
  );
  assert.ok(
    p.annotations.some((a) => a.text.includes("without a seal-in circuit")),
  );
});

test("residential example derives its 24 W lighting and 600 W socket schedules from explicit inputs", () => {
  const p = buildExample("building");
  assert.equal(p.rooms.length, 2);
  const schedule = circuitSchedule(p, p.floors[0].id);
  assert.deepEqual(
    schedule.map((c) => c.totalConnectedLoadW),
    [24, 600],
  );
  assert.ok(schedule.every((c) => c.unknownLoadCount === 0));
  assert.equal(p.wires.length, 0); // Room/circuit assignment is not physical wiring.
});

test("PLC example maps two addresses to genuine wired channels and mounted devices", () => {
  const p = buildExample("plc");
  assert.equal(p.plcModules.length, 3);
  assert.deepEqual(
    p.plcAddresses.map((a) => a.address),
    ["%IX0.0", "%QX0.0"],
  );
  assert.equal(p.wires.length, 10);
  assert.equal(plcWiringSchedule(p).length, 2);
  assert.equal(p.equipment3d.length, 7);
});
