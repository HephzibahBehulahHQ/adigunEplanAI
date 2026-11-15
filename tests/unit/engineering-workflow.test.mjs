import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const context = vm.createContext({});
for (const file of ["eplan-symbols.js", "cad-engine.js"])
  vm.runInContext(fs.readFileSync(`apps/web/public/${file}`, "utf8"), context);
const engine = context.AdigunCADEngine;
const plain = (value) => JSON.parse(JSON.stringify(value));

test("incoming PE bonds explicit mounting feet without doubling conductor clamps", () => {
  const project = engine.createExample("eng0601");
  const terminals = project.objects.filter((o) =>
    ["XPE:0", "XPE:1", "XPE:2"].includes(o.ref),
  );
  assert.equal(terminals.length, 3);
  for (const terminal of terminals) {
    assert.equal(terminal.componentId, "phoenix-contact-3212147-rail-view");
    for (const pinId of ["connection-1", "connection-2"]) {
      const ends = project.objects
        .filter((o) => o.kind === "wire")
        .flatMap((o) => Object.values(o.attachments || {}));
      assert.ok(
        ends.filter(
          (end) => end.instanceId === terminal.id && end.pinId === pinId,
        ).length <= 1,
      );
    }
  }
  const check = (copy) => {
    const report = engine.analyzeProject(copy);
    const net = report.globalNets.find((n) =>
      n.pins.some((p) => p.ref === "XPE:0"),
    );
    for (const ref of ["XPE:0", "XPE:1", "XPE:2"])
      assert.ok(net.pins.some((p) => p.ref === ref && p.pinId === "rail-foot"));
    assert.ok(
      net.pins.some((p) => p.ref === "M1" && p.pinId === "protective-earth"),
    );
    assert.ok(net.pins.some((p) => p.ref === "PS1" && p.pinId === "line-pe"));
    assert.ok(
      net.pins.every(
        (p) =>
          p.ref.startsWith("XPE:") ||
          (p.ref === "M1" && p.pinId === "protective-earth") ||
          (p.ref === "PS1" && p.pinId === "line-pe"),
      ),
    );
  };
  check(project);
  terminals[0].rotation = 90;
  terminals[0].x += 30;
  engine.synchronizeWireAttachments(project.objects);
  check(engine.parseProject(engine.serializeProject(project)).project);
});

test("explicit PE rail view distinguishes grounding foot from two conductor clamps", () => {
  const original = engine.component("phoenix-contact-3212147");
  const view = engine.component("phoenix-contact-3212147-rail-view");
  assert.equal(original.symbol.pins.length, 2);
  assert.equal(view.manufacturerPartNumber, original.manufacturerPartNumber);
  assert.equal(view.specifications.connectionCount.value, 2);
  assert.equal(view.symbol.pins.length, 3);
  assert.equal(
    view.symbol.pins.find((p) => p.id === "rail-foot").connectionType,
    "grounding-foot",
  );
  assert.deepEqual(plain(view.symbol.internalConnections), [
    ["connection-1", "connection-2"],
    ["connection-1", "rail-foot"],
  ]);
  assert.ok(Object.isFrozen(view.symbol));
  const instance = engine.createInstance(view.id, 300, 300, "XPE:0");
  instance.sheetId = "bonding";
  instance.rotation = 90;
  const project = {
    project: "Bonding view",
    sheets: [{ id: "bonding", name: "Bonding", number: "A2/017" }],
    objects: [instance],
    crossSheetConnections: [],
  };
  const restored = engine.parseProject(engine.serializeProject(project));
  assert.equal(restored.valid, true);
  assert.equal(restored.project.objects[0].componentId, view.id);
  assert.equal(engine.worldPins(restored.project.objects[0]).length, 3);
});

test("field terminal report is editable native text derived from connected device terminals", () => {
  const project = engine.createExample("eng0601");
  const sheet = project.sheets.find((s) => s.number === "A2/015");
  const rows = project.objects.filter((o) => o.sheetId === sheet.id);
  assert.ok(rows.every((o) => o.kind === "text" && !o.locked));
  const content = rows.map((o) => o.text).join("\n");
  for (const target of ["F2 / 2/T1", "Q2 / 1L1", "M1 / PE", "PS1 / PE"])
    assert.ok(content.includes(target));
  assert.match(content, /not cable cores or terminal order/);
  rows[0].text = "My field connections";
  const reopened = engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid, true);
  assert.equal(
    reopened.project.objects.find((o) => o.id === rows[0].id).text,
    "My field connections",
  );
  assert.notEqual(
    engine.createExample("eng0601").objects.find((o) => o.id === rows[0].id)
      .text,
    rows[0].text,
  );
});

test("common isolation keeps neutral separate from phase, PE and DC return after editing", () => {
  const project = engine.createExample("eng0601");
  const q1 = project.objects.find((o) => o.ref === "Q1");
  const inspect = (copy) => {
    const report = engine.analyzeProject(copy);
    assert.equal(report.valid, true);
    const neutral = report.globalNets.find((n) =>
      n.pins.some((p) => p.ref === "Q1" && p.pinId === "load-n"),
    );
    assert.deepEqual(
      plain(neutral.pins.map((p) => p.ref + ":" + p.pinId).sort()),
      ["PS1:line-n", "Q1:load-n", "X4:N:connection-1", "X4:N:connection-2"],
    );
    for (const net of report.globalNets) {
      if (net.pins.some((p) => p.ref === "Q1" && p.pinId.startsWith("line-")))
        assert.equal(net.pins.length, 1);
    }
  };
  inspect(project);
  q1.x += 100;
  q1.rotation = 90;
  engine.synchronizeWireAttachments(project.objects);
  inspect(engine.parseProject(engine.serializeProject(project)).project);
  assert.equal(
    engine.createExample("eng0601").objects.find((o) => o.ref === "Q1")
      .rotation,
    0,
  );
});

test("four-pole main isolator retains distinct neutral identities without internal shorts", () => {
  const definition = engine.component("siemens-3ld2244-1tl51");
  assert.equal(definition.symbol.pins.length, 8);
  assert.equal(new Set(definition.symbol.pins.map((p) => p.id)).size, 8);
  assert.deepEqual(
    plain(
      definition.symbol.pins
        .filter((p) => p.localNumber === "N")
        .map((p) => p.id),
    ),
    ["line-n", "load-n"],
  );
  assert.equal(
    definition.symbol.pins.some((p) => p.localNumber === "PE"),
    false,
  );
  assert.deepEqual(plain(definition.symbol.internalConnections), []);
  assert.equal(Object.isFrozen(definition.specifications), true);
  const source = JSON.stringify(definition);
  const instance = engine.createInstance(definition.id, 400, 250, "Q1");
  instance.sheetId = "isolation";
  instance.rotation = 90;
  instance.properties.comment = "Editable independent instance";
  assert.equal(engine.validateInstance(instance).valid, true);
  const result = engine.parseProject(
    engine.serializeProject({
      project: "Main isolation",
      sheets: [{ id: "isolation", name: "Main isolation", number: "A2/014" }],
      objects: [instance],
      crossSheetConnections: [],
    }),
  );
  assert.equal(result.valid, true);
  assert.equal(result.project.objects[0].rotation, 90);
  assert.equal(
    result.project.objects[0].properties.comment,
    "Editable independent instance",
  );
  assert.equal(JSON.stringify(definition), source);
  assert.equal(engine.component("siemens-3ld2203-0tk51").symbol.pins.length, 6);
});

test("32 A feeder contactor replacement preserves bound terminals and manufacturer data", () => {
  const original = engine.createExample("eng0601");
  const k1 = original.objects.find((o) => o.ref === "K1");
  k1.componentId = "siemens-3rt2026-2kb40"; // Legacy saved-project replacement fixture.
  const originalDefinition = JSON.stringify(engine.component(k1.componentId));
  const id = "siemens-3rt2027-2kb40";
  const changed = engine.replaceComponent(original.objects, k1.id, id);
  const replacement = changed.objects.find((o) => o.id === k1.id);
  assert.equal(replacement.componentId, id);
  assert.deepEqual(
    plain(changed.objects.filter((o) => o.kind === "wire")),
    plain(original.objects.filter((o) => o.kind === "wire")),
  );
  const reopened = engine.parseProject(
    engine.serializeProject({ ...original, objects: changed.objects }),
  );
  assert.equal(reopened.valid, true);
  assert.equal(
    reopened.project.objects.find((o) => o.id === k1.id).componentId,
    id,
  );
  assert.equal(engine.component(id).specifications.ac3RatedCurrent.value, 32);
  assert.equal(engine.component(id).specifications.coilHoldingPower.value, 4.5);
  assert.equal(
    JSON.stringify(engine.component(k1.componentId)),
    originalDefinition,
  );
  assert.equal(
    original.objects.find((o) => o.id === k1.id).componentId,
    "siemens-3rt2026-2kb40",
  );
});

test("magnetic starter breaker never inherits thermal overload settings or internal shorts", () => {
  const definition = engine.component("siemens-3rv2321-4bc10");
  assert.equal(
    definition.specifications.thermalOverloadProtection.value,
    false,
  );
  assert.equal(definition.instanceProperties.overloadSettingA, undefined);
  assert.equal(definition.specifications.overloadTripClass, undefined);
  assert.equal(
    definition.specifications.instantaneousShortCircuitRelease.value,
    260,
  );
  assert.equal(definition.symbol.pins.length, 6);
  assert.deepEqual(plain(definition.symbol.internalConnections), []);
  const device = engine.createInstance(definition.id, 300, 250, "Q1");
  assert.equal(engine.validateInstance(device).valid, true);
  assert.equal(device.properties.overloadSettingA, undefined);
  const project = {
    project: "Magnetic feeder",
    sheets: [{ id: "feeder", name: "Feeder", number: "A2/000" }],
    objects: [{ ...device, sheetId: "feeder" }],
    crossSheetConnections: [],
  };
  const restored = engine.parseProject(engine.serializeProject(project));
  assert.equal(restored.valid, true);
  assert.equal(restored.project.objects[0].componentId, definition.id);
  assert.equal(
    restored.project.objects[0].properties.overloadSettingA,
    undefined,
  );
});

test("14–20 A feeder overload keeps independent settings and native terminal identities", () => {
  const id = "siemens-3ru2126-4bb0";
  const definition = JSON.stringify(engine.component(id));
  const device = engine.createInstance(id, 300, 250, "F2");
  assert.equal(device.properties.overloadSettingA, null);
  for (const value of [14, 15.2, 20]) {
    device.properties.overloadSettingA = value;
    assert.equal(engine.validateInstance(device).valid, true);
  }
  for (const value of [13.9, 20.1]) {
    device.properties.overloadSettingA = value;
    assert.equal(engine.validateInstance(device).valid, false);
  }
  device.properties.overloadSettingA = 15.2;
  const project = {
    project: "Feeder relay settings",
    sheets: [{ id: "feeder", name: "Feeder", number: "A2/000" }],
    objects: [{ ...device, sheetId: "feeder" }],
    crossSheetConnections: [],
  };
  const restored = engine.parseProject(engine.serializeProject(project));
  assert.equal(restored.valid, true);
  assert.equal(restored.project.objects[0].properties.overloadSettingA, 15.2);
  assert.equal(restored.project.objects[0].componentId, id);
  assert.deepEqual(
    plain(engine.component(id).symbol.pins),
    plain(engine.component("siemens-3ru2126-4ab0").symbol.pins),
  );
  assert.equal(
    engine.component("siemens-3ru2126-4ab0").specifications
      .adjustableOverloadRelease.maximum,
    16,
  );
  assert.equal(JSON.stringify(engine.component(id)), definition);
});

test("pressure design settings retain manufacturer ranges and reject inverted thresholds", () => {
  const id = "telemecanique-xmlb004a2s11",
    definition = JSON.stringify(engine.component(id));
  const device = engine.createInstance(id, 300, 250, "B1");
  assert.equal(device.properties.risingPressureBar, null);
  device.properties.risingPressureBar = 2;
  device.properties.fallingPressureBar = 1;
  assert.equal(engine.validateInstance(device).valid, true);
  const project = {
    project: "Pressure settings review",
    sheets: [{ id: "pressure", name: "Pressure interface", number: "A2/010" }],
    objects: [{ ...device, sheetId: "pressure" }],
    crossSheetConnections: [],
  };
  const reopened = engine.parseProject(
    engine.serializeProject(project),
  ).project;
  assert.deepEqual(
    plain(reopened.objects[0].properties),
    plain(device.properties),
  );
  for (const [high, low] of [
    [2, 2],
    [1, 2],
    [4.1, 1],
    [2, 0.01],
  ]) {
    device.properties.risingPressureBar = high;
    device.properties.fallingPressureBar = low;
    assert.equal(engine.validateInstance(device).valid, false);
  }
  delete device.properties.risingPressureBar;
  delete device.properties.fallingPressureBar;
  assert.equal(
    engine.validateInstance(device).valid,
    true,
    "legacy native instances remain readable",
  );
  assert.equal(JSON.stringify(engine.component(id)), definition);
  assert.equal(
    engine.component(id).symbol.internalConnections.length,
    0,
    "settings do not invent pressure-dependent electrical continuity",
  );
});

test("editable copies replace and remove components without changing templates or manufacturer records", () => {
  const original = engine.createExample("eng0601"),
    copy = engine.parseProject(engine.serializeProject(original)).project;
  const terminal = copy.objects.find((o) => o.ref === "X1:1"),
    originalDefinition = JSON.stringify(engine.component(terminal.componentId));
  const changed = engine.replaceComponent(
    copy.objects,
    terminal.id,
    "phoenix-contact-3044076",
  );
  const replacement = changed.objects.find((o) => o.id === terminal.id);
  assert.equal(replacement.ref, "X1:1");
  assert.equal(replacement.componentId, "phoenix-contact-3044076");
  assert.equal(
    copy.objects.find((o) => o.id === terminal.id).componentId,
    "phoenix-contact-3004362",
  );
  assert.equal(
    JSON.stringify(engine.component(terminal.componentId)),
    originalDefinition,
  );
  const bound = changed.objects.find(
    (o) =>
      o.kind === "wire" && o.attachments?.start?.instanceId === terminal.id,
  );
  assert.equal(bound.attachments.start.pinId, "connection-2");
  assert.throws(
    () =>
      engine.replaceComponent(
        changed.objects,
        terminal.id,
        "telemecanique-xmlb004a2s11",
      ),
    /cannot preserve connected terminal/,
  );
  const removed = engine.removeDrawingObjects(changed.objects, [terminal.id]);
  assert.equal(removed.detached.length, 2);
  assert.equal(
    removed.objects.find((o) => o.id === bound.id).attachments.start,
    undefined,
  );
  assert.deepEqual(
    plain(removed.objects.find((o) => o.id === bound.id).detachedEnds),
    ["start"],
  );
  copy.objects = removed.objects;
  assert.throws(
    () => engine.serializeProject(copy),
    /off-page connector target/,
  );
  // Object-only removal leaves project-level reference cleanup to its caller.
  for (const link of copy.crossSheetConnections)
    for (const endpoint of link.endpoints)
      if (endpoint.connector?.targetInstanceId === terminal.id)
        delete endpoint.connector;
  copy.connectionIssues = [
    {
      id: "removed-input-terminal",
      code: "deleted-object-connections",
      message: "X1:1 removed; review explicitly detached feeder input.",
      endpoints: [],
      detached: removed.detached,
    },
  ];
  assert.equal(engine.parseProject(engine.serializeProject(copy)).valid, true);
  const fresh = engine.createExample("eng0601");
  assert.equal(
    fresh.objects.find((o) => o.ref === "X1:1").componentId,
    "phoenix-contact-3004362",
  );
  assert.ok(fresh.objects.every((o) => !o.locked));
});
test("feeder separates input phases and preserves paired protection links through editing", () => {
  const project = engine.createExample("eng0601");
  const f1 = project.objects.find((o) => o.ref === "F1");
  const f2 = project.objects.find((o) => o.ref === "F2");
  assert.equal(f1.componentId, "siemens-3rv2321-4bc10");
  assert.equal(f2.componentId, "siemens-3ru2126-4bb0");
  assert.equal(f2.properties.overloadSettingA, 15.2);
  const inspect = (drawing) => {
    const report = engine.analyzeProject(drawing);
    assert.equal(report.valid, true);
    for (let n = 1; n <= 3; n++) {
      const upstream = report.globalNets.find((net) =>
        net.pins.some((p) => p.ref === "F1" && p.pinId === "line-l" + n),
      );
      const downstream = report.globalNets.find((net) =>
        net.pins.some((p) => p.ref === "F1" && p.pinId === "load-t" + n),
      );
      assert.notEqual(upstream, downstream);
      assert.deepEqual(
        plain(upstream.pins.map((p) => p.ref + ":" + p.pinId).sort()),
        [
          "F1:line-l" + n,
          "Q1:load-t" + n,
          "X1:" + n + ":connection-1",
          "X1:" + n + ":connection-2",
          ...(n === 1
            ? ["F3:terminal-top", "X4:L:connection-1", "X4:L:connection-2"]
            : []),
        ].sort(),
      );
      assert.deepEqual(
        plain(downstream.pins.map((p) => p.ref + ":" + p.pinId).sort()),
        ["F1:load-t" + n, "K1:power-l" + n],
      );
    }
  };
  inspect(project);
  f1.x += 25;
  f1.rotation = 90;
  engine.synchronizeWireAttachments(project.objects);
  inspect(engine.parseProject(engine.serializeProject(project)).project);
});

test("field motor delta bridges and unswitched PE stay distinct", () => {
  const project = engine.createExample("eng0601"),
    report = engine.analyzeProject(project);
  assert.equal(report.valid, true);
  for (const [phase, start, end] of [
    [1, "winding-u1", "winding-w2"],
    [2, "winding-v1", "winding-u2"],
    [3, "winding-w1", "winding-v2"],
  ]) {
    const net = report.globalNets.find((net) =>
      net.pins.some(
        (pin) => pin.ref === "Q2" && pin.pinId === "load-t" + phase,
      ),
    );
    assert.deepEqual(
      plain(
        net.pins
          .filter((pin) => pin.ref === "M1")
          .map((pin) => pin.pinId)
          .sort(),
      ),
      [start, end].sort(),
    );
    assert.ok(!net.pins.some((pin) => pin.pinId === "protective-earth"));
  }
  const pe = report.globalNets.find((net) =>
    net.pins.some(
      (pin) => pin.ref === "M1" && pin.pinId === "protective-earth",
    ),
  );
  assert.ok(
    pe.pins.every(
      (pin) =>
        ["M1", "XPE:0", "XPE:1", "XPE:2"].includes(pin.ref) ||
        (pin.ref === "PS1" && pin.pinId === "line-pe"),
    ),
  );
  assert.equal(
    project.objects.find((o) => o.id === "eng0601-wire-motor-pe")
      .conductorColor,
    "green/yellow",
  );
});

test("XMLB004A2S11 retains four manufacturer terminals without inventing switching continuity", () => {
  const id = "telemecanique-xmlb004a2s11";
  const def = engine.component(id);
  assert.deepEqual(plain(def.symbol.pins.map((p) => p.localNumber)), [
    "13",
    "14",
    "11",
    "12",
  ]);
  assert.equal(def.specifications.ratedDC13At250V.value, 0.1);
  assert.equal(def.specifications.dimensions.width.value, 35);
  assert.equal(def.specifications.dimensions.height.value, 158);
  assert.equal(def.specifications.dimensions.depth.value, 77.5);
  assert.deepEqual(plain(def.symbol.internalConnections), []);
  const device = engine.createInstance(id, 400, 300, "B1");
  device.sheetId = "pressure";
  device.properties.processPoint = "Pump discharge";
  const pin = engine.worldPins(device).find((p) => p.id === "terminal-13");
  const start = { x: pin.x, y: 100 };
  const wire = engine.attachWire(
    {
      id: "pressure-wire",
      kind: "wire",
      sheetId: "pressure",
      x: start.x,
      y: start.y,
      x1: start.x,
      y1: start.y,
      x2: pin.x,
      y2: pin.y,
    },
    start,
    { ...pin, attachment: { instanceId: device.id, pinId: pin.id } },
  );
  device.rotation = 90;
  engine.synchronizeWireAttachments([device, wire]);
  const rotated = engine.worldPins(device).find((p) => p.id === "terminal-13");
  assert.equal(wire.x2, rotated.x);
  assert.equal(wire.y2, rotated.y);
  const project = {
    project: "Pressure interface",
    activeSheet: "pressure",
    sheets: [{ id: "pressure", name: "Pressure", number: "A2/000" }],
    objects: [device, wire],
    crossSheetConnections: [],
  };
  const restored = engine.parseProject(engine.serializeProject(project));
  assert.equal(restored.valid, true);
  assert.equal(
    restored.project.objects[1].attachments.end.pinId,
    "terminal-13",
  );
  assert.equal(
    restored.project.objects[0].properties.processPoint,
    "Pump discharge",
  );
});

test("ENG-0601 has authored A1 documents without fabricated circuits or blank future sheets", () => {
  const project = engine.createExample("eng0601");
  assert.equal(engine.validateProject(project).valid, true);
  assert.deepEqual(plain(project.sections.map((s) => s.id)), [
    "A1",
    "A2",
    "A3",
    "A4",
  ]);
  assert.equal(project.activeSheet, null);
  assert.equal(project.sheets.length, 20);
  assert.deepEqual(
    plain(project.sheets.map((s) => s.number)),
    Array.from(
      { length: 20 },
      (_, i) =>
        (i < 6 ? "A1/" : i < 19 ? "A2/" : "A3/") + String(i).padStart(3, "0"),
    ),
  );
  for (const sheet of project.sheets.filter((s) => s.sectionId === "A1")) {
    const content = project.objects.filter((o) => o.sheetId === sheet.id);
    assert.ok(content.length >= 12);
    assert.ok(
      content.every((o) => o.kind === "text" && o.y < 574 && !o.locked),
    );
  }
  assert.match(
    project.objects.map((o) => o.text).join("\n"),
    /planned \/ not yet created/,
  );
  assert.match(project.objects.map((o) => o.text).join("\n"), /not approved/);
  assert.equal(project.crossSheetConnections.length, 37);
  assert.equal(engine.analyzeProject(project).valid, true);
  const powerReport = engine.analyzeProject(project);
  assert.equal(powerReport.globalNetCount, 27);
  for (let n = 1; n <= 3; n++) {
    const net = powerReport.globalNets.find((net) =>
      net.pins.some((pin) => pin.ref === "K1" && pin.pinId === "power-t" + n),
    );
    assert.deepEqual(
      plain(net.pins.map((pin) => pin.ref + ":" + pin.pinId).sort()),
      ["F2:line-l" + n, "K1:power-t" + n],
    );
  }
  assert.equal(project.objects.filter((o) => o.kind === "wire").length, 92);
  for (const link of project.crossSheetConnections) {
    assert.equal(link.endpoints.length, 2);
    assert.equal(
      link.endpoints[0].connector.targetSheetId,
      link.endpoints[1].sheetId,
    );
    assert.equal(
      link.endpoints[1].connector.targetSheetId,
      link.endpoints[0].sheetId,
    );
  }
  project.objects[1].text = "Engineer edited this note";
  const restored = engine.parseProject(engine.serializeProject(project));
  assert.deepEqual(plain(restored.project), plain(project));
  assert.notEqual(
    engine.createExample("eng0601").objects[1].text,
    project.objects[1].text,
  );
});

test("sheet deletion retains unresolved continuation evidence through saving", () => {
  const links = [
    {
      id: "potential-24v",
      name: "+24V",
      endpoints: [
        { sheetId: "supply", wireId: "w1", point: { x: 100, y: 100 } },
        { sheetId: "control", wireId: "w2", point: { x: 200, y: 100 } },
      ],
    },
  ];
  const issues = engine.sheetDeletionDiagnostics(links, {
    id: "supply",
    number: "A2/006",
    name: "Supply",
  });
  assert.equal(issues.length, 1);
  assert.equal(issues[0].deletedSheetId, "supply");
  assert.equal(issues[0].connectionName, "+24V");
  assert.deepEqual(plain(issues[0].endpoints), links[0].endpoints);
  assert.deepEqual(plain(engine.removeSheetConnections(links, "supply")), []);
  const payload = {
    project: "Deletion audit",
    objects: [],
    sheets: [{ id: "control", name: "Control", number: "A2/006" }],
    activeSheet: "control",
    crossSheetConnections: [],
    connectionIssues: issues,
  };
  const parsed = engine.parseProject(engine.serializeProject(payload));
  assert.equal(parsed.valid, true);
  const report = engine.analyzeProject(parsed.project);
  assert.equal(report.valid, false);
  assert.match(report.errors[0], /lost sheet A2\/006 Supply/);
  assert.equal(report.unresolvedContinuations[0].deletedSheetId, "supply");
  assert.equal(report.crossSheetConnectionCount, 0);
  assert.throws(() =>
    engine.serializeProject({ ...payload, connectionIssues: [null] }),
  );
});

test("title block shared metadata and sheet overrides survive native roundtrip with fixed identities", () => {
  const sections = engine.defaultProjectSections();
  const sheets = engine.numberProjectSheets(
    [
      {
        id: "overview",
        name: "Overview",
        sectionId: "A1",
        customName: true,
        metadata: { revision: "02", checkedBy: "" },
      },
      {
        id: "power",
        name: "Power",
        sectionId: "A2",
        customName: true,
        metadata: { drawingNumber: "D-006" },
      },
    ],
    sections,
  );
  const project = {
    project: "Pump starter",
    sections,
    sheets,
    activeSheet: null,
    objects: [],
    metadata: {
      manager: "Project manager",
      checkedBy: "Pending review",
      corporateIdentity: "Override attempt",
      softwareIdentity: "Override attempt",
    },
  };
  const restored = engine.parseProject(engine.serializeProject(project));
  assert.equal(restored.valid, true);
  const first = engine.titleBlockValues(
    restored.project,
    restored.project.sheets[0],
  );
  const second = engine.titleBlockValues(
    restored.project,
    restored.project.sheets[1],
  );
  assert.equal(first.corporateIdentity, "Hephzibah Behulah");
  assert.equal(first.softwareIdentity, "AdigunEplanAI");
  assert.equal(first.manager, second.manager);
  assert.equal(first.checkedBy, "");
  assert.equal(second.checkedBy, "Pending review");
  assert.equal(first.revision, "02");
  assert.equal(second.revision, "");
  assert.equal(first.sheetReference, "A1/Overview");
  assert.equal(second.drawingNumber, "D-006");
  for (const [width, height] of [
    [1200, 760],
    [760, 1200],
    [600, 400],
  ]) {
    const b = engine.titleBlockBounds(width, height, 26);
    assert.equal(b.x + b.width, width - 26);
    assert.equal(b.y + b.height, height - 26);
    assert.ok(b.x >= 26 && b.y >= 26);
  }
  assert.throws(() => engine.titleBlockBounds(100, 100));
});

test("CPU 1212C transistor outputs use the DC/DC/DC connector table and preserve physical attachments", () => {
  const id = "siemens-6es7212-1ae40-0xb0";
  const part = engine.component(id);
  assert.deepEqual(
    plain(
      part.symbol.pins
        .filter((p) => p.id.startsWith("x12-"))
        .map((p) => [p.id, p.name]),
    ),
    [
      ["x12-1", "3L+"],
      ["x12-2", "3M"],
      ["x12-3", "DQ a.0"],
      ["x12-4", "DQ a.1"],
      ["x12-5", "DQ a.2"],
      ["x12-6", "DQ a.3"],
      ["x12-7", "DQ a.4"],
      ["x12-8", "DQ a.5"],
    ],
  );
  assert.match(part.sources[0].url, /docs\.tia\.siemens\.cloud/);
  assert.match(part.symbol.numberingNote, /review earlier output wiring/i);
  const cpu = engine.createInstance(id, 500, 300, "A1");
  const terminal = engine.createInstance(
    "phoenix-contact-3044076",
    900,
    324,
    "X1",
  );
  const wire = {
    id: "existing-output-wire",
    kind: "wire",
    x1: 630,
    y1: 324,
    x2: 865,
    y2: 324,
    attachments: {
      start: { instanceId: cpu.id, pinId: "x12-3" },
      end: { instanceId: terminal.id, pinId: "connection-1" },
    },
  };
  const objects = [cpu, terminal, wire];
  engine.synchronizeWireAttachments(objects);
  assert.equal(wire.attachments.start.pinId, "x12-3");
  assert.equal(
    engine.endpointPin(objects, wire.attachments.start).name,
    "DQ a.0",
  );
  assert.equal(engine.wireAttachmentIssues(objects).length, 0);
});

test("project import rejects malformed attachment data and duplicate identities", () => {
  const project = engine.createExample("indicator");
  const wire = project.objects.find((o) => o.kind === "wire");
  wire.attachments.start = { instanceId: "", pinId: 42 };
  assert.equal(engine.validateProject(project).valid, false);
  delete wire.attachments;
  project.objects[1].id = project.objects[0].id;
  assert.equal(engine.validateProject(project).valid, false);
});

test("examples are independent editable projects with complete terminal attachments", () => {
  assert.equal(engine.projectExamples().length, 7);
  for (const example of engine
    .projectExamples()
    .filter((item) => ["indicator", "relay"].includes(item.id))) {
    const project = engine.createExample(example.id, "Workshop project");
    assert.equal(project.project, "Workshop project");
    assert.equal(engine.validateProject(project).valid, true);
    const report = engine.analyzeProject(project);
    assert.equal(report.valid, true);
    const sheet = engine.analyze(project.objects);
    assert.equal(sheet.wireCount, 4);
    assert.equal(sheet.openEndpointCount, 0);
    assert.equal(sheet.unconnectedPinCount, 0);
    assert.equal(sheet.geometryErrorCount, 0);
    assert.equal(
      sheet.netCount,
      4,
      "generic devices do not invent internal continuity",
    );
    assert.ok(
      project.objects
        .filter((o) => o.kind === "wire")
        .every((w) => w.attachments.start && w.attachments.end),
    );
    const restored = engine.parseProject(engine.serializeProject(project));
    assert.deepEqual(plain(restored.project), plain(project));
    assert.notEqual(
      engine.createExample(example.id).objects[0].id,
      project.objects[0].id,
    );
  }
});

test("manufacturer examples preserve separate circuits and editable source-backed parts", () => {
  for (const [id, components, wires, spare, nets = wires] of [
    ["hardware-plc-input", 5, 6, 21, 4],
    ["hardware-relay", 7, 6, 5],
    ["hardware-sensor", 4, 3, 3],
    ["hardware-sitop", 3, 2, 5],
  ]) {
    const project = engine.createExample(id);
    const report = engine.analyze(project.objects);
    assert.equal(report.componentCount, components);
    assert.equal(report.wireCount, wires);
    assert.equal(
      report.netCount,
      nets,
      "separate circuits must not short together",
    );
    assert.equal(report.openEndpointCount, 0);
    assert.equal(report.geometryErrorCount, 0);
    assert.equal(
      report.unconnectedPinCount,
      spare,
      "external boundaries and spare pins remain explicit",
    );
    assert.equal(engine.billOfMaterials(project.objects).valid, true);
    for (const item of project.objects.filter(
      (o) => o.kind === "component-instance",
    )) {
      const definition = engine.component(item.componentId);
      assert.ok(definition.manufacturerPartNumber);
      assert.ok(
        definition.sources.every((source) => source.url.startsWith("https://")),
      );
    }
    for (const wire of project.objects.filter((o) => o.kind === "wire")) {
      const net = report.nets.find((n) => n.wireIds.includes(wire.id));
      for (const end of [wire.attachments.start, wire.attachments.end]) {
        assert.ok(
          net.pins.some(
            (pin) =>
              pin.instanceId === end.instanceId && pin.pinId === end.pinId,
          ),
        );
      }
    }
    const device = project.objects.find((o) => o.kind === "component-instance");
    engine.moveInstance(device, device.x + 40, device.y + 80);
    engine.rotateInstance(device, 90);
    engine.synchronizeWireAttachments(project.objects);
    assert.equal(engine.wireAttachmentIssues(project.objects).length, 0);
    const restored = engine.parseProject(engine.serializeProject(project));
    assert.equal(restored.valid, true);
    assert.deepEqual(plain(restored.project), plain(project));
  }
});

test("PLC input example keeps positive, return, functional earth and switched input separate", () => {
  const project = engine.createExample("hardware-plc-input");
  const nets = plain(engine.analyze(project.objects).nets)
    .map((net) => net.pins.map((pin) => pin.ref + ":" + pin.pinId).sort())
    .sort((a, b) => a.join().localeCompare(b.join()));
  const expected = [
    ["A1:x10-1", "S1:contact-13", "X1:connection-1", "X1:connection-2"],
    ["A1:x10-2", "A1:x10-6", "X2:connection-1", "X2:connection-2"],
    ["A1:x10-3", "X3:connection-1", "X3:connection-2"],
    ["A1:x10-7", "S1:contact-14"],
  ]
    .map((net) => net.sort())
    .sort((a, b) => a.join().localeCompare(b.join()));
  assert.deepEqual(nets, expected);
});

test("screw terminal definitions retain manufacturer ratings and local connection identities", () => {
  for (const [id, voltage, current, section] of [
    ["phoenix-contact-3004362", 800, 32, 4],
    ["phoenix-contact-3044076", 1000, 24, 2.5],
  ]) {
    const part = engine.component(id);
    assert.equal(part.specifications.nominalVoltage.value, voltage);
    assert.equal(part.specifications.nominalCurrent.value, current);
    assert.equal(part.specifications.ratedCrossSection.value, section);
    assert.deepEqual(plain(part.symbol.pins.map((pin) => pin.id)), [
      "connection-1",
      "connection-2",
    ]);
    assert.match(part.sources[0].revisionNote, /model-local/);
    assert.ok(part.symbol.pins.every((pin) => pin.connectionType === "screw"));
  }
});

test("terminal identities survive movement, rotation and restore without stealing a coincident pin", () => {
  const project = engine.createExample("indicator"),
    component = project.objects[1];
  const wire = project.objects.find(
    (o) => o.kind === "wire" && o.attachments.end.instanceId === component.id,
  );
  const coincident = engine.createInstance(
    component.componentId,
    component.x,
    component.y,
    "F2",
  );
  coincident.sheetId = component.sheetId;
  project.objects.push(coincident);
  const before = { x: wire.x2, y: wire.y2 };
  engine.moveInstance(coincident, 10, 10);
  engine.synchronizeWireAttachments(project.objects);
  assert.deepEqual({ x: wire.x2, y: wire.y2 }, before);
  engine.moveInstance(component, 360, 500);
  engine.rotateInstance(component, 90);
  assert.ok(
    engine
      .wireAttachmentIssues(project.objects)
      .some((i) => i.code === "detached-terminal"),
  );
  engine.synchronizeWireAttachments(project.objects);
  const pin = engine.endpointPin(
    project.objects,
    wire.attachments.end,
    wire.sheetId,
  );
  assert.equal(wire.x2, pin.x);
  assert.equal(wire.y2, pin.y);
  assert.equal(engine.wireAttachmentIssues(project.objects).length, 0);
  const restored = engine.parseProject(engine.serializeProject(project));
  assert.equal(restored.valid, true);
  assert.equal(engine.wireAttachmentIssues(restored.project.objects).length, 0);
});

test("missing terminals and sheet mismatches are diagnosed, not silently reconnected", () => {
  const project = engine.createExample("relay"),
    removed = project.objects.shift();
  let report = engine.analyze(project.objects);
  assert.ok(report.errors.some((i) => i.code === "missing-terminal"));
  assert.equal(
    report.wireCount,
    3,
    "invalid bound wire is excluded from valid connectivity",
  );
  project.objects.unshift(removed);
  removed.sheetId = "another-sheet";
  assert.ok(
    engine
      .wireAttachmentIssues(project.objects)
      .some((i) => i.code === "missing-terminal"),
  );
  removed.sheetId = project.activeSheet;
  assert.equal(engine.wireAttachmentIssues(project.objects).length, 0);
  const refs = [
    { kind: "component-instance", ref: "U1" },
    { kind: "component-instance", ref: "U3" },
  ];
  assert.equal(engine.nextReference(refs, "U"), "U2");
});

test("bound example nets remain identical through component rotation and movement", () => {
  const signature = (objects) =>
    [...new Set(objects.map((object) => object.sheetId))]
      .flatMap((sheetId) =>
        engine
          .analyze(objects.filter((object) => object.sheetId === sheetId))
          .nets.map((net) =>
            net.pins
              .map((pin) => pin.instanceId + ":" + pin.pinId)
              .sort()
              .join("|"),
          ),
      )
      .sort();
  for (const example of engine.projectExamples()) {
    const project = engine.createExample(example.id);
    const expected = signature(project.objects);
    for (const device of project.objects.filter(
      (object) => object.kind === "component-instance",
    )) {
      const original = { x: device.x, y: device.y };
      for (let turn = 0; turn < 4; turn++) {
        engine.rotateInstance(device, 90);
        engine.synchronizeWireAttachments(project.objects);
        assert.deepEqual(
          signature(project.objects),
          expected,
          example.id + " rotation " + device.ref,
        );
      }
      engine.moveInstance(device, original.x + 170, original.y + 110);
      engine.synchronizeWireAttachments(project.objects);
      assert.deepEqual(
        signature(project.objects),
        expected,
        example.id + " movement " + device.ref,
      );
      engine.moveInstance(device, original.x, original.y);
      engine.synchronizeWireAttachments(project.objects);
    }
  }
});

test("default sections contain no pages and numbering follows section order without resetting", () => {
  const sections = engine.defaultProjectSections();
  assert.deepEqual(
    plain(sections).map((section) => section.id),
    ["A1", "A2", "A3", "A4"],
  );
  const project = {
    project: "New Project",
    sections,
    activeSection: "A1",
    activeSheet: null,
    sheets: [],
    objects: [],
    crossSheetConnections: [],
  };
  assert.deepEqual(
    plain(
      engine.parseProject(engine.serializeProject(project)).project.sections,
    ),
    plain(sections),
  );
  const sheets = engine.numberProjectSheets(
    [
      { id: "circuit", name: "Circuit", sectionId: "A2" },
      { id: "handover", name: "Handover", sectionId: "A4" },
      { id: "overview", name: "Overview", sectionId: "A1" },
      { id: "panel", name: "Panel", sectionId: "A3" },
    ],
    sections,
  );
  assert.deepEqual(
    plain(sheets).map((sheet) => sheet.number),
    ["A1/000", "A2/001", "A3/002", "A4/003"],
  );
  const extra = engine.numberProjectSheets(
    sheets.concat({ id: "terms", name: "Terms", sectionId: "A1" }),
    sections,
  );
  assert.equal(extra.find((sheet) => sheet.id === "circuit").number, "A2/002");
  const links = {
    sheets: extra,
    crossSheetConnections: [
      {
        id: "L",
        name: "L",
        endpoints: [
          {
            sheetId: "overview",
            point: { x: 1, y: 1 },
            connector: {
              targetSheetId: "circuit",
              targetRef: "X1",
              direction: "out",
            },
          },
        ],
      },
    ],
  };
  assert.equal(
    engine.crossSheetConnectors(links, "overview")[0].targetSheetNumber,
    "A2/002",
  );
  assert.throws(
    () =>
      engine.numberProjectSheets([{ id: "bad", sectionId: "A5" }], sections),
    /section/,
  );
  const bad = Object.assign({}, project, { sheets: plain(sheets) });
  bad.sheets[1].number = "A2/000";
  assert.throws(() => engine.serializeProject(bad), /continuous/);
});

test("sidebar ordering keeps document identities, custom names and electrical links across sections", () => {
  const sections = engine.defaultProjectSections().concat([
    { id: "A5", name: "Extra", collapsed: true },
    { id: "A6", name: "Extra 2" },
  ]);
  const sheets = engine.numberProjectSheets(
    Array.from({ length: 250 }, (_, index) => ({
      id: "sheet-" + index,
      name: index === 0 ? "Power" : "Sheet",
      customName: index === 0,
      sectionId: index < 6 ? "A1" : "A5",
    })),
    sections,
  );
  let moved = engine.moveProjectSheet(
    sheets,
    sections,
    "sheet-0",
    "sheet-4",
    "after",
  );
  assert.deepEqual(
    plain(moved)
      .slice(0, 6)
      .map((sheet) => sheet.id),
    ["sheet-1", "sheet-2", "sheet-3", "sheet-4", "sheet-0", "sheet-5"],
  );
  assert.equal(moved[4].name, "Power");
  moved = engine.moveProjectSheet(
    moved,
    sections,
    "sheet-0",
    null,
    "after",
    "A6",
  );
  assert.equal(moved[249].id, "sheet-0");
  assert.equal(moved[249].number, "A6/249");
  const objects = [
    {
      id: "wa",
      kind: "wire",
      sheetId: "sheet-0",
      x1: 0,
      y1: 0,
      x2: 100,
      y2: 0,
    },
    {
      id: "wb",
      kind: "wire",
      sheetId: "sheet-1",
      x1: 0,
      y1: 0,
      x2: 100,
      y2: 0,
    },
  ];
  const links = [
    {
      id: "potential",
      name: "TEST",
      endpoints: [
        { sheetId: "sheet-0", wireId: "wa", point: { x: 100, y: 0 } },
        { sheetId: "sheet-1", wireId: "wb", point: { x: 0, y: 0 } },
      ],
    },
  ];
  const project = {
    project: "Sidebar regression",
    sections,
    sheets: moved,
    objects,
    crossSheetConnections: links,
    activeSection: "A6",
    activeSheet: null,
    openSheetIds: [],
  };
  const restored = engine.parseProject(engine.serializeProject(project));
  assert.equal(restored.valid, true);
  assert.deepEqual(plain(restored.project.sheets), plain(moved));
  assert.deepEqual(plain(restored.project.crossSheetConnections), links);
  assert.equal(engine.analyzeProject(restored.project).valid, true);
  assert.equal(restored.project.objects.length, 2);
  assert.throws(
    () => engine.serializeProject({ ...project, openSheetIds: ["missing"] }),
    /Open sheet views/,
  );
});

test("deleting a sheet preserves the remaining branches of shared cross-page potentials", () => {
  const links = [
    {
      id: "shared",
      name: "+24V",
      endpoints: [
        { sheetId: "a", wireId: "wa", point: { x: 0, y: 0 } },
        {
          sheetId: "b",
          wireId: "wb",
          point: { x: 0, y: 0 },
          connector: { targetSheetId: "a", targetRef: "X1", direction: "left" },
        },
        {
          sheetId: "c",
          wireId: "wc",
          point: { x: 0, y: 0 },
          connector: { targetSheetId: "b", targetRef: "X2", direction: "left" },
        },
      ],
    },
  ];
  const kept = engine.removeSheetConnections(links, "a");
  assert.equal(kept.length, 1);
  assert.equal(kept[0].id, "shared");
  assert.deepEqual(
    plain(kept[0].endpoints).map((endpoint) => endpoint.sheetId),
    ["b", "c"],
  );
  assert.equal(kept[0].endpoints[0].connector, undefined);
  assert.equal(kept[0].endpoints[1].connector.targetSheetId, "b");
  assert.equal(links[0].endpoints.length, 3);
  assert.equal(engine.removeSheetConnections(kept, "b").length, 0);
});

test("control permissives and seal-in retain distinct terminal-bound nets through editing", () => {
  const project = engine.createExample("eng0601");
  const expected = [
    ["S0:contact-22", "X5:1:connection-1", "X5:1:connection-2", "Q2:AUX:no-23"],
    ["Q2:AUX:no-24", "X5:2:connection-1", "X5:2:connection-2", "F2:aux-95"],
    ["F2:aux-96", "X5:3:connection-1", "X5:3:connection-2", "B1:terminal-11"],
    [
      "B1:terminal-12",
      "X5:4:connection-1",
      "X5:4:connection-2",
      "S1:contact-13",
      "K1:aux-13",
    ],
    ["S1:contact-14", "K1:aux-14", "K1:coil-a1"],
    ["X3:2:connection-2", "K1:coil-a2"],
  ];
  const check = (drawing) => {
    const report = engine.analyzeProject(drawing);
    assert.equal(report.valid, true);
    const found = expected.map((pins) => {
      const net = report.globalNets.find((n) =>
        n.pins.some((p) => p.ref + ":" + p.pinId === pins[0]),
      );
      assert.ok(net, pins[0]);
      for (const pin of pins)
        assert.ok(
          net.pins.some((p) => p.ref + ":" + p.pinId === pin),
          pin,
        );
      assert.ok(!net.pins.some((p) => p.ref === "M1" || p.ref === "XPE:1"));
      return net;
    });
    assert.equal(
      new Set(found).size,
      expected.length,
      "switch contacts must not become permanent shorts",
    );
    for (const ref of ["K1", "F2", "B1", "Q2:AUX"])
      assert.equal(drawing.objects.filter((o) => o.ref === ref).length, 1);
  };
  check(project);
  const auxiliary = project.objects.find((o) => o.ref === "Q2:AUX");
  auxiliary.x += 30;
  auxiliary.rotation = 90;
  auxiliary.stroke = "#ff6600";
  engine.synchronizeWireAttachments(project.objects);
  const reopened = engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid, true);
  check(reopened.project);
  assert.deepEqual(
    plain(reopened.project.crossSheetConnections),
    plain(project.crossSheetConnections),
  );
  assert.equal(
    reopened.project.objects.find((o) => o.id === auxiliary.id).stroke,
    "#ff6600",
  );
  assert.deepEqual(
    plain(engine.component(auxiliary.componentId).symbol.internalConnections),
    [],
  );
});

test("isolator auxiliary uses the manufacturer-marked NO 23/24 and NC 11/12", () => {
  const part = engine.component("siemens-3ld9200-5b");
  assert.deepEqual(
    plain(part.symbol.pins.map((pin) => [pin.id, pin.localNumber])),
    [
      ["no-23", "23"],
      ["no-24", "24"],
      ["nc-11", "11"],
      ["nc-12", "12"],
    ],
  );
  assert.equal(part.specifications.ratedDC13At24V.value, 4);
  assert.deepEqual(plain(part.symbol.internalConnections), []);
});

test("contactor coil feed does not visually pass through its return terminal", () => {
  const project = engine.createExample("eng0601");
  const k1 = project.objects.find((o) => o.ref === "K1");
  const pins = engine.worldPins(k1);
  for (const [wireId, opposite] of [
    ["coil-command-to", "coil-a2"],
    ["coil-return-to", "coil-a1"],
  ]) {
    const wire = project.objects.find((o) => o.id === "eng0601-wire-" + wireId);
    const pin = pins.find((p) => p.id === opposite);
    const horizontal =
      pin.y === wire.y1 &&
      pin.x >= Math.min(wire.x1, wire.x2) &&
      pin.x <= Math.max(wire.x1, wire.x2);
    const vertical =
      pin.x === wire.x2 &&
      pin.y >= Math.min(wire.y1, wire.y2) &&
      pin.y <= Math.max(wire.y1, wire.y2);
    assert.equal(
      horizontal || vertical,
      false,
      wireId + " must not cross " + opposite,
    );
  }
});

test("PTCB preserves manufacturer settings and physically separate input/output bridge shafts", () => {
  const id = "phoenix-contact-2908262",
    definition = JSON.stringify(engine.component(id));
  const instance = engine.createInstance(id, 500, 300, "F4");
  assert.equal(instance.properties.channelCurrentA, 4);
  for (const value of [1, 4, 8]) {
    instance.properties.channelCurrentA = value;
    assert.equal(engine.validateInstance(instance).valid, true);
  }
  for (const value of [0, 1.5, 9]) {
    instance.properties.channelCurrentA = value;
    assert.equal(engine.validateInstance(instance).valid, false);
  }
  assert.equal(JSON.stringify(engine.component(id)), definition);
  assert.deepEqual(plain(engine.component(id).symbol.internalConnections), [
    ["input-1.1", "bridge-1.2"],
    ["output-2.1", "bridge-2.2"],
    ["negative-3.1", "negative-3.2"],
  ]);
});

test("auxiliary supply preserves AC/DC/PE separation and bypasses PTCB for load return", () => {
  const project = engine.createExample("eng0601");
  const check = (p) => {
    const report = engine.analyzeProject(p);
    assert.equal(report.valid, true);
    const net = (ref, pinId) =>
      report.globalNets.find((n) =>
        n.pins.some((pin) => pin.ref === ref && pin.pinId === pinId),
      );
    const positive = net("PS1", "output-positive"),
      negative = net("PS1", "output-negative"),
      protectedOutput = net("F4", "output-2.1");
    assert.equal(
      new Set([
        positive,
        negative,
        protectedOutput,
        net("PS1", "line-l"),
        net("PS1", "line-n"),
        net("PS1", "line-pe"),
      ]).size,
      6,
    );
    assert.ok(
      protectedOutput.pins.some(
        (p) => p.ref === "S0" && p.pinId === "contact-21",
      ),
    );
    assert.ok(
      negative.pins.some((p) => p.ref === "K1" && p.pinId === "coil-a2"),
    );
    const loadLink = p.crossSheetConnections.find(
      (c) => c.id === "eng0601-control-aux-control-return",
    );
    const loadWire = p.objects.find(
      (o) => o.id === loadLink.endpoints[0].wireId,
    );
    const supply = p.objects.find((o) => o.ref === "PS1");
    assert.equal(
      loadWire.attachments.start.instanceId,
      supply.id,
      "load return must terminate at PSU, not F4 self-supply input",
    );
    assert.equal(loadWire.attachments.start.pinId, "output-negative");
    assert.equal(
      p.objects.find((o) => o.ref === "F4").properties.channelCurrentA,
      1,
    );
  };
  check(project);
  const psu = project.objects.find((o) => o.ref === "PS1");
  psu.x += 30;
  psu.rotation = 90;
  engine.synchronizeWireAttachments(project.objects);
  check(engine.parseProject(engine.serializeProject(project)).project);
});
test("pilot-light instances preserve coil and trip nets through editing and local roundtrip", () => {
  const p = engine.createExample("eng0601");
  const definition = JSON.stringify(
    engine.component("schneider-electric-xb5avb3"),
  );
  const check = (project) => {
    const report = engine.analyzeProject(project);
    assert.equal(report.valid, true);
    const net = (ref, pinId) =>
      report.globalNets.find((n) =>
        n.pins.some((pin) => pin.ref === ref && pin.pinId === pinId),
      );
    assert.equal(net("H1", "terminal-x1"), net("K1", "coil-a1"));
    assert.equal(net("H2", "terminal-x1"), net("F2", "aux-98"));
    assert.equal(net("F2", "aux-97"), net("F4", "output-2.1"));
    assert.equal(net("H1", "terminal-x2"), net("PS1", "output-negative"));
    assert.equal(net("H2", "terminal-x2"), net("PS1", "output-negative"));
    assert.equal(
      new Set([
        net("H1", "terminal-x1"),
        net("H2", "terminal-x1"),
        net("H1", "terminal-x2"),
        net("F2", "aux-97"),
      ]).size,
      4,
    );
  };
  check(p);
  const h1 = p.objects.find((o) => o.ref === "H1");
  h1.properties.legend = "CONTROL VOLTAGE";
  h1.stroke = "#9944aa";
  h1.x += 40;
  h1.rotation = 90;
  engine.synchronizeWireAttachments(p.objects);
  p.project = "My editable pump project";
  const reopened = engine.parseProject(engine.serializeProject(p)).project;
  check(reopened);
  assert.deepEqual(plain(reopened.objects), plain(p.objects));
  assert.deepEqual(
    plain(reopened.crossSheetConnections),
    plain(p.crossSheetConnections),
  );
  const replacement = engine.replaceComponent(
    reopened.objects,
    h1.id,
    "schneider-electric-xb5avb4",
  );
  reopened.objects = replacement.objects;
  check(reopened);
  assert.equal(
    engine.component(reopened.objects.find((o) => o.id === h1.id).componentId)
      .specifications.lensColour.value,
    "Red",
  );
  assert.equal(
    JSON.stringify(engine.component("schneider-electric-xb5avb3")),
    definition,
  );
  const fresh = engine
    .createExample("eng0601")
    .objects.find((o) => o.ref === "H1");
  assert.equal(fresh.componentId, "schneider-electric-xb5avb3");
  assert.equal(fresh.properties.legend, "K1 COIL VOLTAGE");
});

test("continuation register covers every real pair and remains editable on reopen", () => {
  const project = engine.createExample("eng0601");
  const sheet = project.sheets.find((s) => s.id === "eng0601-a2-12");
  assert.equal(sheet.number, "A2/018");
  const rows = project.objects.filter((o) =>
    o.id.startsWith("eng0601-continuation-row-"),
  );
  assert.equal(rows.length, project.crossSheetConnections.length);
  project.crossSheetConnections.forEach((link, index) => {
    for (const endpoint of link.endpoints) {
      const wire = project.objects.find((o) => o.id === endpoint.wireId);
      const attachment = Object.values(wire.attachments)[0];
      const device = project.objects.find(
        (o) => o.id === attachment.instanceId,
      );
      const pin = engine
        .worldPins(device)
        .find((p) => p.id === attachment.pinId);
      const page = project.sheets.find((s) => s.id === endpoint.sheetId);
      assert.ok(
        rows[index].text.includes(`${page.number} ${device.ref}:${pin.number}`),
      );
    }
    assert.equal(rows[index].kind, "text");
    assert.ok(!rows[index].text.includes("undefined"));
    assert.ok(rows[index].y < 540);
  });
  rows[0].text += " | reviewed locally";
  rows[0].stroke = "#aa2244";
  const restored = engine.parseProject(
    engine.serializeProject(project),
  ).project;
  assert.deepEqual(plain(restored.objects), plain(project.objects));
  assert.deepEqual(
    plain(restored.crossSheetConnections),
    plain(project.crossSheetConnections),
  );
  assert.ok(
    !engine
      .createExample("eng0601")
      .objects.find((o) => o.id === rows[0].id)
      .text.includes("reviewed locally"),
  );
});

test("cable core assignments follow paired segments without changing electrical topology", () => {
  const project = engine.createExample("eng0601");
  const original = engine.serializeProject(project);
  const pair = project.crossSheetConnections[0];
  const wireId = pair.endpoints[0].wireId;
  project.objects = engine.assignWireCable(project, wireId, {
    tag: " W2 ",
    core: " 1 ",
  });
  for (const endpoint of pair.endpoints) {
    assert.deepEqual(
      plain(project.objects.find((o) => o.id === endpoint.wireId).cable),
      { tag: "W2", core: "1" },
    );
  }
  const restored = engine.parseProject(
    engine.serializeProject(project),
  ).project;
  assert.deepEqual(plain(restored.objects), plain(project.objects));
  assert.deepEqual(
    plain(engine.analyzeProject(restored).globalNets),
    plain(
      engine.analyzeProject(engine.parseProject(original).project).globalNets,
    ),
  );
  restored.objects = engine.assignWireCable(
    restored,
    pair.endpoints[1].wireId,
    null,
  );
  assert.equal(engine.serializeProject(restored), original);
  assert.throws(
    () => engine.assignWireCable(project, wireId, { tag: "W2", core: "" }),
    /1–64/,
  );
  assert.throws(
    () => engine.assignWireCable(project, "missing", { tag: "W2", core: "1" }),
    /Select a wire/,
  );
  project.objects.find((o) => o.id === wireId).cable = {
    tag: "W2",
    core: "1",
    manufacturerRating: "invented",
  };
  assert.throws(() => engine.serializeProject(project), /cable assignment/);
  assert.ok(
    !engine.createExample("eng0601").objects.find((o) => o.id === wireId).cable,
  );
});

test("electrical checks reject disconnected reuse and inconsistent continuation core assignments", () => {
  const project = engine.createExample("eng0601");
  const phase1 = project.crossSheetConnections[0];
  project.objects = engine.assignWireCable(
    project,
    phase1.endpoints[0].wireId,
    { tag: "W2", core: "1" },
  );
  const report = engine.analyzeProject(project);
  assert.equal(report.valid, true);
  const assignedNet = report.globalNets.find((n) =>
    n.wireIds.includes(
      phase1.endpoints[0].sheetId + ":" + phase1.endpoints[0].wireId,
    ),
  );
  const other = project.crossSheetConnections.find(
    (link) =>
      !assignedNet.wireIds.includes(
        link.endpoints[0].sheetId + ":" + link.endpoints[0].wireId,
      ),
  );
  project.objects = engine.assignWireCable(project, other.endpoints[0].wireId, {
    tag: "W2",
    core: "1",
  });
  assert.equal(engine.analyzeProject(project).valid, false);
  assert.match(
    engine.analyzeProject(project).cableIssues.join(" "),
    /disconnected electrical nets/,
  );
  project.objects = engine.assignWireCable(project, other.endpoints[0].wireId, {
    tag: "W2",
    core: "2",
  });
  assert.equal(engine.analyzeProject(project).valid, true);
  delete project.objects.find((o) => o.id === other.endpoints[1].wireId).cable;
  const reopened = engine.parseProject(
    engine.serializeProject(project),
  ).project;
  assert.match(
    engine.analyzeProject(reopened).cableIssues.join(" "),
    /inconsistent cable\/core/,
  );
});

test("LAPP cable exposes four isolated editable core paths without invented ratings", () => {
  const definition = engine.component("lapp-1119504");
  assert.equal(definition.manufacturerPartNumber, "1119504");
  assert.equal(definition.specifications.crossSection.value, 4);
  assert.equal(definition.symbol.pins.length, 8);
  assert.equal(definition.symbol.internalConnections.length, 4);
  assert.equal(definition.specifications.nominalCurrent, undefined);
  const original = JSON.stringify(definition);
  const instance = engine.createInstance("lapp-1119504", 300, 300, "W2");
  assert.equal(engine.validateInstance(instance).valid, true);
  const leads = engine
    .worldPins(instance)
    .filter((p) => p.id.startsWith("a-"))
    .map((p, i) => ({
      id: "lead-" + i,
      kind: "wire",
      x1: p.x - 20,
      y1: p.y,
      x2: p.x,
      y2: p.y,
    }));
  const report = engine.analyze([instance, ...leads]);
  assert.equal(report.nets.length, 4);
  for (const net of report.nets) {
    assert.equal(net.pins.length, 2);
    const cores = new Set(net.pins.map((p) => p.pinId.slice(2)));
    assert.equal(cores.size, 1);
  }
  instance.properties.route = "Panel to field isolator";
  instance.properties.lengthAssumption =
    "Educational route assumption: 20 m; not measured";
  instance.rotation = 90;
  const project = { project: "Cable edit", sheets: [], objects: [instance] };
  const reopened = engine.parseProject(
    engine.serializeProject(project),
  ).project;
  assert.deepEqual(plain(reopened.objects), plain(project.objects));
  assert.equal(JSON.stringify(definition), original);
  assert.equal(engine.worldPins(reopened.objects[0]).length, 8);
});

test("enclosure is a native mechanical component without invented electrical terminals", () => {
  const definition = engine.component("rittal-1059000");
  assert.equal(definition.specifications.dimensions.width.value, 600);
  assert.equal(definition.specifications.dimensions.height.value, 800);
  assert.equal(definition.specifications.mountingPlate.width.value, 545);
  const original = JSON.stringify(definition);
  const instance = engine.createInstance("rittal-1059000", 400, 350, "ENC1");
  assert.deepEqual(plain(engine.worldPins(instance)), []);
  assert.equal(engine.validateInstance(instance).valid, true);
  instance.properties.location = "Starter panel, indoors";
  engine.moveInstance(instance, 450, 350);
  engine.rotateInstance(instance, 90);
  const project = {
    project: "Panel assembly",
    sheets: [],
    objects: [instance],
  };
  const reopened = engine.parseProject(
    engine.serializeProject(project),
  ).project;
  assert.deepEqual(plain(reopened.objects), plain(project.objects));
  assert.equal(JSON.stringify(definition), original);
  assert.equal(engine.analyze([instance]).componentPinCount, 0);
});

test("A3 enclosure basis preserves A2 devices and separates field equipment", () => {
  const project = engine.createExample("eng0601");
  const sheet = project.sheets.find((s) => s.id === "eng0601-a3-0");
  assert.equal(sheet.number, "A3/019");
  const contents = project.objects.filter((o) => o.sheetId === sheet.id);
  const equipment = contents.filter((o) => o.kind === "component-instance");
  assert.equal(equipment.length, 1);
  assert.equal(equipment[0].componentId, "rittal-1059000");
  assert.equal(equipment[0].ref, "ENC1");
  const rows = contents.filter((o) =>
    /^eng0601-panel-inventory-\d+$/.test(o.id),
  );
  const external = new Set(["M1", "Q2", "Q2:AUX", "B1"]);
  const internal = project.objects.filter(
    (o) =>
      o.kind === "component-instance" &&
      o.sheetId !== sheet.id &&
      !external.has(o.ref),
  );
  assert.equal(rows.length, internal.length);
  for (const device of internal)
    assert.ok(rows.some((row) => row.text.startsWith(device.ref + " · ")));
  for (const ref of external)
    assert.ok(!rows.some((row) => row.text.startsWith(ref + " · ")));
  assert.ok(rows.every((row) => row.y < 520));
  const withoutLayout = {
    ...project,
    sheets: project.sheets.filter((s) => s.id !== sheet.id),
    objects: project.objects.filter((o) => o.sheetId !== sheet.id),
  };
  assert.deepEqual(
    plain(engine.analyzeProject(project).globalNets),
    plain(engine.analyzeProject(withoutLayout).globalNets),
  );
  const refs = project.objects
    .filter((o) => o.kind === "component-instance")
    .map((o) => o.ref);
  assert.equal(new Set(refs).size, refs.length);
  equipment[0].properties.location = "My workshop cabinet";
  const reopened = engine.parseProject(
    engine.serializeProject(project),
  ).project;
  assert.deepEqual(plain(reopened.objects), plain(project.objects));
});

test("panel device links follow canonical edits without duplicating devices", () => {
  const project = engine.createExample("eng0601");
  const device = project.objects.find((o) => o.ref === "K1");
  const placement = { deviceId: device.id };
  const before = plain(engine.billOfMaterials(project.objects));
  const resolved = engine.resolvePanelDevice(project, placement);
  assert.equal(resolved.instance, device);
  assert.equal(resolved.definition, engine.component(device.componentId));
  assert.deepEqual(plain(engine.billOfMaterials(project.objects)), before);
  device.ref = "K101";
  assert.equal(engine.resolvePanelDevice(project, placement).ref, "K101");
  device.ref = "K1"; // Cross-sheet display labels are managed by the editor rename operation.
  const reopened = engine.parseProject(
    engine.serializeProject(project),
  ).project;
  assert.equal(engine.resolvePanelDevice(reopened, placement).ref, "K1");
  const restored = reopened.objects.find((o) => o.id === device.id);
  restored.componentId = "rittal-1059000";
  assert.equal(
    engine.resolvePanelDevice(reopened, placement).definition,
    engine.component("rittal-1059000"),
  );
  reopened.objects = reopened.objects.filter((o) => o.id !== device.id);
  assert.throws(
    () => engine.resolvePanelDevice(reopened, placement),
    /missing/,
  );
  assert.throws(
    () => engine.resolvePanelDevice(project, {}),
    /stable device ID/,
  );
  project.objects.push({ ...device });
  assert.throws(
    () => engine.resolvePanelDevice(project, placement),
    /ambiguous/,
  );
});

test("panel footprint geometry uses manufacturer dimensions and stable device links", () => {
  const project = engine.createExample("eng0601");
  const device = project.objects.find((o) => o.ref === "F1");
  const placement = engine.createPanelPlacement(
    project,
    device.id,
    "eng0601-a3-0",
    200,
    240,
    0.5,
  );
  const before = plain(engine.billOfMaterials(project.objects));
  project.objects.push(placement);
  let geometry = engine.panelPlacementGeometry(project, placement);
  assert.equal(geometry.width, 22.5);
  assert.equal(geometry.height, 48.5);
  assert.equal(geometry.footprint.depthMm, 97);
  assert.ok(Object.isFrozen(geometry.footprint));
  placement.x += 40;
  placement.rotation = 90;
  const reopened = engine.parseProject(
    engine.serializeProject(project),
  ).project;
  const saved = reopened.objects.find((o) => o.id === placement.id);
  geometry = engine.panelPlacementGeometry(reopened, saved);
  assert.equal(geometry.x, 240);
  assert.equal(geometry.rotation, 90);
  assert.deepEqual(plain(engine.billOfMaterials(reopened.objects)), before);
  reopened.objects.find((o) => o.id === device.id).componentId =
    "rittal-1059000";
  assert.throws(
    () => engine.panelPlacementGeometry(reopened, saved),
    /replacement/,
  );
  assert.throws(
    () => engine.createPanelPlacement(project, device.id, "missing", 0, 0, 1),
    /sheet/,
  );
  assert.throws(
    () =>
      engine.createPanelPlacement(project, device.id, "eng0601-a3-0", 0, 0, 0),
    /scale/,
  );
});

test("panel placement imports reject malformed geometry but retain reviewable missing devices", () => {
  const project = engine.createExample("eng0601");
  const device = project.objects.find((o) => o.ref === "F1");
  const placement = engine.createPanelPlacement(
    project,
    device.id,
    "eng0601-a3-0",
    200,
    240,
    0.5,
  );
  project.objects.push(placement);
  for (const change of [
    { scale: 0 },
    { x: NaN },
    { rotation: 45 },
    { deviceId: "" },
  ]) {
    const candidate = { ...placement, ...change };
    const copy = {
      ...project,
      objects: project.objects.map((o) =>
        o.id === placement.id ? candidate : o,
      ),
    };
    assert.throws(() => engine.serializeProject(copy), /Panel placement/);
  }
  placement.deviceId = "deleted-device";
  const reopened = engine.parseProject(
    engine.serializeProject(project),
  ).project;
  assert.equal(
    reopened.objects.find((o) => o.id === placement.id).deviceId,
    "deleted-device",
  );
  assert.throws(
    () => engine.panelPlacementGeometry(reopened, placement),
    /missing/,
  );
});

test("contactor panel footprint retains the archived manufacturer edition and clearance categories", () => {
  const project = engine.createExample("eng0601");
  const device = project.objects.find((o) => o.ref === "K1");
  const placement = engine.createPanelPlacement(
    project,
    device.id,
    "eng0601-a3-0",
    300,
    230,
    0.5,
  );
  const geometry = engine.panelPlacementGeometry(project, placement);
  assert.equal(geometry.width, 22.5);
  assert.equal(geometry.height, 51);
  assert.equal(geometry.footprint.depthMm, 107);
  assert.equal(geometry.footprint.edition, "2021-01-21");
  assert.equal(geometry.footprint.page, 5);
  assert.equal(geometry.footprint.clearancesMm.sideBySide.side, 0);
  assert.equal(geometry.footprint.clearancesMm.groundedParts.side, 6);
  assert.equal(geometry.footprint.clearancesMm.liveParts.front, 10);
  assert.ok(Object.isFrozen(geometry.footprint.clearancesMm.groundedParts));
  assert.match(geometry.footprint.note, /archived/);
});
