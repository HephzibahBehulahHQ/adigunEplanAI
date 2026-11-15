import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const context = vm.createContext({});
for (const file of ["eplan-symbols.js", "cad-engine.js"])
  vm.runInContext(fs.readFileSync(`apps/web/public/${file}`, "utf8"), context);
const engine = context.AdigunCADEngine;
const plain = (value) => JSON.parse(JSON.stringify(value));

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
  assert.equal(removed.detached.length, 1);
  assert.equal(
    removed.objects.find((o) => o.id === bound.id).attachments.start,
    undefined,
  );
  assert.deepEqual(
    plain(removed.objects.find((o) => o.id === bound.id).detachedEnds),
    ["start"],
  );
  copy.objects = removed.objects;
  assert.equal(engine.parseProject(engine.serializeProject(copy)).valid, true);
  const fresh = engine.createExample("eng0601");
  assert.equal(
    fresh.objects.find((o) => o.ref === "X1:1").componentId,
    "phoenix-contact-3004362",
  );
  assert.ok(fresh.objects.every((o) => !o.locked));
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
  assert.ok(pe.pins.every((pin) => ["M1", "XPE:1"].includes(pin.ref)));
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
  assert.equal(project.sheets.length, 9);
  assert.deepEqual(
    plain(project.sheets.map((s) => s.number)),
    Array.from(
      { length: 9 },
      (_, i) => (i < 6 ? "A1/" : "A2/") + String(i).padStart(3, "0"),
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
  assert.equal(project.crossSheetConnections.length, 6);
  assert.equal(engine.analyzeProject(project).valid, true);
  const powerReport = engine.analyzeProject(project);
  assert.equal(powerReport.globalNetCount, 13);
  for (let n = 1; n <= 3; n++) {
    const net = powerReport.globalNets.find((net) =>
      net.pins.some((pin) => pin.ref === "K1" && pin.pinId === "power-t" + n),
    );
    assert.deepEqual(
      plain(net.pins.map((pin) => pin.ref + ":" + pin.pinId).sort()),
      ["F2:line-l" + n, "K1:power-t" + n],
    );
  }
  assert.equal(project.objects.filter((o) => o.kind === "wire").length, 25);
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
