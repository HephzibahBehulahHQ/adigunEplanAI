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
    if (example.id === "target-substation") {
      for (const reference of ["DI1", "DO1"]) {
        const device = p.devices.find((item) => item.reference === reference);
        const placement = p.equipment3d.find(
          (item) => item.deviceId === device.id,
        );
        assert.equal(placement.dimensionSource, "catalog");
        assert.deepEqual(placement.sizeMm, { x: 12, y: 64, z: 100 });
      }
    } else {
      assert.ok(
        p.equipment3d.every((item) => item.dimensionSource === "manual"),
      );
    }
    if (example.id !== "target-substation")
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

test("target substation opens with sourced BOM parts, PLC interface, and saved apparent-power current estimate", () => {
  const p = buildExample("target-substation");
  assert.equal(p.name, "EES_Industry_Sample_Energy_Substation_V01");
  assert.equal(p.pages.length, 2);
  assert.equal(p.devices.length, 34);
  assert.equal(p.wires.length, 45);
  const overviewReferences = new Set(
    p.symbolInstances
      .filter((instance) => instance.pageId === p.pages[0].id)
      .map(
        (instance) =>
          p.devices.find((device) => device.id === instance.deviceId).reference,
      ),
  );
  for (const reference of [
    "T01",
    "Q1",
    "P1",
    "X30",
    "X31",
    "X32",
    "X33",
    "X34",
    "X35",
    "CT1",
    "CT2",
    "CT3",
  ])
    assert.ok(
      overviewReferences.has(reference),
      `${reference} is on the overview sheet`,
    );
  assert.equal(p.pages[1].name, "02 · Control and communications");
  for (const [index, phase] of ["A", "B", "C"].entries()) {
    const currentTransformer = p.devices.find(
      (device) => device.reference === `CT${index + 1}`,
    );
    const instance = p.symbolInstances.find(
      (symbol) => symbol.deviceId === currentTransformer.id,
    );
    const symbolDefinition = p.symbolDefinitions.find(
      (definition) => definition.id === instance.definitionId,
    );
    assert.match(
      currentTransformer.name,
      /ratio, class, burden and polarity remain design inputs/,
    );
    assert.deepEqual(
      symbolDefinition.pins.map((pin) => pin.id),
      ["P1", "P2", "S1", "S2"],
    );
    const currentTransformerPins = p.pins.filter(
      (pin) => pin.symbolInstanceId === instance.id,
    );
    assert.equal(currentTransformerPins.length, 4);
    assert.ok(
      currentTransformerPins.every((pin) =>
        p.wires.some(
          (wire) => wire.fromPinId === pin.id || wire.toPinId === pin.id,
        ),
      ),
      `${currentTransformer.reference} primary and secondary pins are wired`,
    );
    const relay = p.devices.find((device) => device.reference === "P1");
    const relayInstance = p.symbolInstances.find(
      (symbol) => symbol.deviceId === relay.id,
    );
    const measurementPins = p.pins.filter(
      (pin) =>
        pin.symbolInstanceId === relayInstance.id &&
        pin.definitionPinId.startsWith(`I_${phase}_`),
    );
    assert.equal(measurementPins.length, 2);
    assert.ok(
      measurementPins.every((pin) =>
        p.wires.some(
          (wire) => wire.fromPinId === pin.id || wire.toPinId === pin.id,
        ),
      ),
      `${phase}-phase current measurement inputs are wired`,
    );
  }
  const relayInstance = p.symbolInstances.find(
    (symbol) =>
      symbol.deviceId ===
      p.devices.find((device) => device.reference === "P1").id,
  );
  const fourthCurrentInput = p.pins.filter(
    (pin) =>
      pin.symbolInstanceId === relayInstance.id &&
      pin.definitionPinId.startsWith("I_4_"),
  );
  assert.equal(fourthCurrentInput.length, 2);
  assert.ok(
    fourthCurrentInput.every(
      (pin) =>
        !p.wires.some(
          (wire) => wire.fromPinId === pin.id || wire.toPinId === pin.id,
        ),
    ),
    "the fourth relay current input remains explicitly unused",
  );
  const relay = p.devices.find((device) => device.reference === "P1");
  const relayPart = p.manufacturerParts.find(
    (part) => part.id === relay.partId,
  );
  assert.deepEqual(relayPart.ratings, {
    binaryInputs: 11,
    binaryOutputs: 9,
    currentInputs: 4,
    voltageInputs: 4,
    auxiliarySupplyMinV: 24,
    auxiliarySupplyMaxV: 48,
    auxiliarySupplyType: "DC",
  });
  assert.deepEqual(relayPart.catalogSnapshot.dimensionsMm, {
    width: 150,
    height: 266,
    depth: 163,
  });
  assert.deepEqual(relayPart.catalogSnapshot.frontPanel, {
    statusIndicators: 16,
    display: "large",
  });
  assert.match(relayPart.catalogSnapshot.dimensionsSourceUrl, /^https:\/\//);
  const relayEquipment = p.equipment3d.find(
    (item) => item.deviceId === relay.id,
  );
  assert.equal(relayEquipment.dimensionSource, "catalog");
  assert.deepEqual(relayEquipment.sizeMm, { x: 150, y: 266, z: 163 });
  const controller = p.devices.find((device) => device.reference === "PLC1");
  const controllerPart = p.manufacturerParts.find(
    (part) => part.id === controller.partId,
  );
  assert.equal(controllerPart.partNumber, "750-8217/625-000");
  assert.equal(
    controllerPart.catalogSnapshot.catalogId,
    "wago-750-8217-625-000",
  );
  const controllerEquipment = p.equipment3d.find(
    (item) => item.deviceId === controller.id,
  );
  assert.equal(controllerEquipment.dimensionSource, "catalog");
  assert.deepEqual(controllerEquipment.sizeMm, {
    x: 102.5,
    y: 100,
    z: 64.7,
  });
  const relaySupport = p.panelStructures.find(
    (item) => item.id === relayEquipment.mountingStructureId,
  );
  assert.equal(relaySupport.kind, "door");
  const terminalPlacements = [];
  for (const reference of [
    "X5",
    "X6",
    "X30",
    "X31",
    "X32",
    "X33",
    "X34",
    "X35",
  ]) {
    const terminal = p.devices.find((device) => device.reference === reference);
    const part = p.manufacturerParts.find(
      (record) => record.id === terminal.partId,
    );
    assert.equal(part.catalogSnapshot.catalogId, "phoenix-3044076");
    const placement = p.equipment3d.find(
      (item) => item.deviceId === terminal.id,
    );
    assert.equal(placement.dimensionSource, "catalog");
    assert.deepEqual(placement.sizeMm, { x: 5.2, y: 47.7, z: 46.9 });
    terminalPlacements.push(placement);
  }
  assert.equal(
    new Set(terminalPlacements.map((item) => item.mountingStructureId)).size,
    1,
  );
  assert.equal(
    new Set(terminalPlacements.map((item) => item.positionMm.y)).size,
    1,
  );
  assert.ok(
    terminalPlacements.every(
      (item, index, all) =>
        index === 0 || item.positionMm.x > all[index - 1].positionMm.x,
    ),
  );
  assert.ok(
    panelReport(p, relayEquipment.enclosureId).diagnostics.every(
      (diagnostic) =>
        !diagnostic.objectIds.includes(relayEquipment.id) ||
        !["mounting-support", "mounting-position"].includes(diagnostic.code),
    ),
  );
  const incomingIsolator = p.devices.find(
    (device) => device.reference === "Q0",
  );
  assert.ok(incomingIsolator);
  const incomingIsolatorInstance = p.symbolInstances.find(
    (instance) => instance.deviceId === incomingIsolator.id,
  );
  const incomingIsolatorPins = p.pins.filter(
    (pin) => pin.symbolInstanceId === incomingIsolatorInstance.id,
  );
  assert.equal(incomingIsolatorPins.length, 6);
  assert.ok(
    incomingIsolatorPins.every((pin) =>
      p.wires.some(
        (wire) => wire.fromPinId === pin.id || wire.toPinId === pin.id,
      ),
    ),
    "each incoming isolator pole has a connected line-side and load-side pin",
  );
  assert.deepEqual(
    p.plcModules
      .map(({ moduleKind, channelCount }) => ({ moduleKind, channelCount }))
      .sort((a, b) => a.moduleKind.localeCompare(b.moduleKind)),
    [
      { moduleKind: "cpu", channelCount: 2 },
      { moduleKind: "digital-input", channelCount: 16 },
      { moduleKind: "digital-output", channelCount: 8 },
    ],
  );
  const cpu = p.devices.find((item) => item.reference === "PLC1");
  const cpuInstance = p.symbolInstances.find(
    (item) => item.deviceId === cpu.id,
  );
  const cpuPins = p.pins.filter(
    (item) => item.symbolInstanceId === cpuInstance.id,
  );
  assert.deepEqual(
    cpuPins.map((item) => item.definitionPinId).sort(),
    ["common", "supply"],
    "modular controller symbol does not invent integrated I/O or bus pinouts",
  );
  assert.ok(
    cpuPins.every((pin) =>
      p.wires.some(
        (wire) => wire.fromPinId === pin.id || wire.toPinId === pin.id,
      ),
    ),
    "controller power interfaces are connected",
  );
  assert.ok(
    analyze(p)
      .findings.filter((finding) => finding.code === "OPEN_TERMINAL")
      .every((finding) => {
        const terminal = p.terminals.find(
          (item) => item.id === finding.entityIds[0],
        );
        return (
          p.devices.find((device) => device.id === terminal.deviceId)
            .reference === "P1"
        );
      }),
    "only the unused relay contact remains explicitly open; controller and I/O bus pins are connected",
  );
  assert.deepEqual(
    p.manufacturerParts
      .map(({ manufacturer, partNumber }) => ({ manufacturer, partNumber }))
      .sort((a, b) => a.partNumber.localeCompare(b.partNumber)),
    [
      { manufacturer: "Phoenix Contact", partNumber: "3044076" },
      { manufacturer: "WAGO", partNumber: "750-1405" },
      { manufacturer: "WAGO", partNumber: "750-530" },
      { manufacturer: "WAGO", partNumber: "750-8217/625-000" },
      { manufacturer: "Siemens", partNumber: "P1J122728" },
    ],
  );
  assert.ok(
    p.manufacturerParts.every((part) => part.sourceUrl?.startsWith("https://")),
  );
  assert.equal(p.calculations.length, 1);
  assert.equal(p.calculations[0].kind, "apparent-load-current");
  assert.equal(p.calculations[0].inputs.phases, 3);
  assert.equal(p.calculations[0].inputs.voltage, 20);
  assert.equal(p.calculations[0].inputs.apparentPower, 630);
  assert.deepEqual(parseProject(serializeProject(p)).project, p);
});

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

test("photovoltaic example preserves distinct DC, AC and protective-earth interfaces", () => {
  const p = buildExample("photovoltaic");
  assert.equal(p.pages.length, 2);
  assert.equal(p.devices.length, 9);
  assert.equal(p.wires.length, 8);
  const pin = (reference, designation) => {
    const device = p.devices.find((item) => item.reference === reference);
    const symbol = p.symbolInstances.find(
      (item) => item.deviceId === device.id,
    );
    return p.pins.find(
      (item) =>
        item.symbolInstanceId === symbol.id &&
        item.definitionPinId === designation,
    ).id;
  };
  const netId = (pinId) =>
    analyze(p).nets.find((net) => net.pinIds.includes(pinId))?.id;
  assert.equal(netId(pin("X1", "1")), netId(pin("F1", "1")));
  assert.equal(netId(pin("F1", "2")), netId(pin("S1", "1")));
  assert.equal(netId(pin("S1", "2")), netId(pin("INV1", "DC_positive")));
  assert.equal(netId(pin("X2", "1")), netId(pin("INV1", "DC_negative")));
  assert.notEqual(
    netId(pin("INV1", "DC_positive")),
    netId(pin("INV1", "DC_negative")),
  );
  assert.equal(netId(pin("INV1", "L_out")), netId(pin("Q1", "1")));
  assert.equal(netId(pin("Q1", "2")), netId(pin("X3", "1")));
  assert.equal(netId(pin("INV1", "N_out")), netId(pin("X4", "1")));
  assert.equal(netId(pin("INV1", "PE")), netId(pin("X5", "1")));
  assert.equal(p.manufacturerParts.length, 0);
  assert.ok(p.annotations.some((item) => item.text.includes("anti-islanding")));
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
