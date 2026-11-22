import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const context = vm.createContext({});
for (const file of ["eplan-symbols.js", "cad-engine.js"])
  vm.runInContext(fs.readFileSync(`apps/web/public/${file}`, "utf8"), context);
const engine = context.AdigunCADEngine;
const terminalBatch = JSON.parse(
  fs.readFileSync(
    new URL(
      "../../packages/component-library/wago-terminal-batch.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
engine.registerWagoTerminalBatch(terminalBatch);
const plain = (value) => JSON.parse(JSON.stringify(value));

test("TOPJOB catalog batches reject invalid rows and duplicate IDs atomically", () => {
  const candidate = { ...terminalBatch[0], orderCode: "2002-9999" };
  assert.throws(
    () =>
      engine.registerWagoTerminalBatch([
        candidate,
        { ...candidate, orderCode: "2002-9998", positions: [5] },
      ]),
    /Invalid WAGO terminal catalog row/,
  );
  assert.throws(
    () => engine.registerWagoTerminalBatch([candidate, terminalBatch[0]]),
    /Duplicate WAGO terminal catalog ID/,
  );
  assert.throws(
    () => engine.registerWagoTerminalBatch([candidate, candidate]),
    /Duplicate WAGO terminal catalog ID/,
  );
  assert.equal(engine.component("wago-2002-9999"), null);
});

test("TOPJOB through terminals keep every clamping point and isolate the two decks", () => {
  const singleDeckSeries = [
    [2000, 3.5, 1, 13.5, "Operating tool", [48.5, 58.2, 67.9]],
    [2001, 4.2, 1.5, 17.5, undefined],
    [2004, 6.2, 4, 32, "Operating tool", [52.3, 65.5, 78.7]],
    [2201, 4.2, 1.5, 17.5, "Push-button"],
    [2202, 5.2, 2.5, 24, "Push-button"],
    [2204, 6.2, 4, 32, "Push-button", [52.3, 65.5, 78.7]],
  ].flatMap(([series, width, crossSection, current, actuation, heights]) =>
    [2, 3, 4].flatMap((clamps) =>
      ["Gray", "Orange", "Red", "Blue", "Black", "Yellow"].map(
        (finish, index) => [
          series + "-1" + clamps + "0" + (index + 1),
          [clamps],
          800,
          32.9,
          finish,
          width,
          crossSection,
          current,
          actuation,
          heights?.[clamps - 2],
        ],
      ),
    ),
  );
  const higherCurrentSeries = [
    [
      2006,
      7.5,
      6,
      41,
      32.9,
      [
        [57.4, "12345"],
        [73.3, "123456"],
        [89.3, "12345"],
      ],
    ],
    [
      2010,
      10,
      10,
      57,
      36.9,
      [
        [67.8, "123456"],
        [89, "123456"],
      ],
    ],
    [
      2016,
      12,
      16,
      76,
      36.9,
      [
        [69.8, "12345"],
        [91.8, "12456"],
      ],
    ],
    [
      2206,
      7.5,
      6,
      41,
      32.9,
      [
        [57.3, "1345"],
        [73.3, "1345"],
        [89.3, "12345"],
      ],
      "Push-button",
    ],
  ].flatMap(
    ([
      series,
      width,
      crossSection,
      current,
      depth,
      profiles,
      actuation = "Operating tool",
    ]) =>
      profiles.flatMap(([height, variants], index) =>
        Array.from(variants, (suffix) => [
          series + "-1" + (index + 2) + "0" + suffix,
          [index + 2],
          800,
          depth,
          ["Gray", "Orange", "Red", "Blue", "Black", "Yellow"][
            Number(suffix) - 1
          ],
          width,
          crossSection,
          current,
          actuation,
          height,
        ]),
      ),
  );
  const verifiedDoubleDecks = terminalBatch.filter(
    (part) => part.connectionDiagramSha256,
  );
  assert.ok(verifiedDoubleDecks.length >= 50);
  for (const part of verifiedDoubleDecks) {
    const definition = engine.component("wago-" + part.orderCode);
    assert.equal(
      definition.sources[0].connectionDiagramSha256,
      part.connectionDiagramSha256,
    );
    assert.equal(
      definition.specifications.potentialMarking?.value,
      part.potentialMarking,
    );
  }
  const classicWago = terminalBatch.filter((part) => part.connectionTechnology);
  assert.ok(classicWago.length >= 114);
  for (const part of classicWago) {
    const definition = engine.component("wago-" + part.orderCode);
    assert.equal(definition.family, "wago-rail-terminal");
    assert.ok(
      definition.symbol.pins.every(
        (pin) => pin.connectionType === part.connectionTechnology,
      ),
    );
    assert.equal(
      definition.specifications.mounting.value,
      part.orderCode.startsWith("285-")
        ? "DIN rail 35 × 15 mm only"
        : "DIN rail 35 × 7.5 or 35 × 15 mm",
    );
  }
  for (const [
    orderCode,
    counts,
    voltage,
    depth,
    finish,
    width = 5.2,
    crossSection = 2.5,
    current = 24,
    actuation,
    height,
  ] of [
    ...singleDeckSeries,
    ...higherCurrentSeries,
    ...classicWago.map((part) => [
      part.orderCode,
      part.positions,
      part.nominalVoltage,
      part.depthMm,
      part.finish,
      part.widthMm,
      part.nominalCrossSectionMm2,
      part.ratedCurrent,
      part.actuationMethod,
      part.heightMm,
    ]),
    ...verifiedDoubleDecks.map((part) => [
      part.orderCode,
      part.orderCode.startsWith("2002-24") ? [4, 4] : [2, 2],
      part.nominalVoltage,
      part.depthMm,
      part.finish,
      part.widthMm,
      part.nominalCrossSectionMm2,
      part.ratedCurrent,
      part.actuationMethod,
      part.heightMm,
    ]),
    ["2002-1301", [3], 800, 32.9],
    ["2002-1304", [3], 800, 32.9],
    ["2002-1401", [4], 800, 32.9],
    ["2002-1403", [4], 800, 32.9],
    ["2002-1202", [2], 800, 32.9, "Orange"],
    ["2002-1203", [2], 800, 32.9, "Red"],
    ["2002-1204", [2], 800, 32.9, "Blue"],
    ["2002-1205", [2], 800, 32.9, "Black"],
    ["2002-1206", [2], 800, 32.9, "Yellow"],
    ["2002-1302", [3], 800, 32.9, "Orange"],
    ["2002-1303", [3], 800, 32.9, "Red"],
    ["2002-1305", [3], 800, 32.9, "Black"],
    ["2002-1306", [3], 800, 32.9, "Yellow"],
    ["2002-1402", [4], 800, 32.9, "Orange"],
    ["2002-1404", [4], 800, 32.9, "Blue"],
    ["2002-1405", [4], 800, 32.9, "Black"],
    ["2002-1406", [4], 800, 32.9, "Yellow"],
    ["2002-2201", [2, 2], 500, 51.7],
    ["2002-2231", [2, 2], 500, 61.8],
    ["2002-2234", [2, 2], 500, 61.8, "Blue"],
    ["2002-2401", [4, 4], 800, 52.1],
    ["2002-2404", [4, 4], 800, 52.1, "Blue"],
  ]) {
    const id = `wago-${orderCode}`;
    const device = engine.createInstance(id, 300, 220, "X1");
    device.sheetId = "terminals";
    assert.equal(engine.validateInstance(device).valid, true);
    const definition = engine.component(id);
    assert.equal(definition.specifications.nominalVoltage.value, voltage);
    assert.equal(definition.panelFootprint.depthMm, depth);
    assert.equal(definition.panelFootprint.widthMm, width);
    assert.equal(
      definition.specifications.nominalCrossSection.value,
      crossSection,
    );
    assert.equal(definition.specifications.ratedCurrent.value, current);
    assert.equal(definition.specifications.actuationMethod?.value, actuation);
    if (height !== undefined) {
      assert.equal(definition.panelFootprint.heightMm, height);
      assert.match(definition.sources[0].sha256, /^[a-f0-9]{64}$/);
    }
    if (finish) assert.equal(definition.specifications.finish.value, finish);
    const pins = engine.worldPins(device);
    const wires = definition.symbol.internalConnections.map((group, index) => {
      const pin = pins.find((item) => item.id === group.at(-1));
      return engine.attachWire(
        {
          id: `terminal-wire-${index}`,
          kind: "wire",
          sheetId: device.sheetId,
          x1: pin.x,
          y1: pin.y,
          x2: pin.x + 100,
          y2: pin.y,
        },
        { attachment: { instanceId: device.id, pinId: pin.id } },
        {},
      );
    });
    const nets = engine.analyze([device, ...wires]).nets;
    assert.deepEqual(plain(nets.map((net) => net.pins.length)), counts);
    assert.equal(
      engine.billOfMaterials([device]).rows[0].partNumber,
      orderCode,
    );
    const project = {
      project: "Terminal verification",
      sheets: [{ id: "terminals", name: "Terminals", number: "A2/000" }],
      objects: [device, ...wires],
    };
    const register = engine.terminalRegisterCsv(project);
    for (const group of definition.symbol.internalConnections) {
      const row = group
        .map((id) => pins.find((pin) => pin.id === id).number)
        .join(" / ");
      assert.ok(register.includes(`,"${row}"\r\n`));
    }
    assert.equal(
      engine.parseProject(engine.serializeProject(project)).valid,
      true,
    );
  }
});

test("panel envelopes require positive overlap on all three axes", () => {
  const componentId = "siemens-3rt2027-2kb40";
  const a = engine.createInstance(componentId, 0, 0, "K1");
  const b = engine.createInstance(componentId, 0, 0, "K2");
  const sheetId = "panel";
  const placement = {
    kind: "panel-placement",
    sheetId,
    footprintComponentId: componentId,
    x: 100,
    y: 100,
    scale: 0.5,
    rotation: 0,
  };
  const first = { ...placement, id: "first", deviceId: a.id };
  const other = { ...placement, id: "other", deviceId: b.id };
  const scene = (changes) =>
    engine.panelBodyScene(
      { objects: [a, b, first, { ...other, ...changes }] },
      sheetId,
    );
  assert.deepEqual(plain(scene({ x: 110, mountingDepthMm: 100 }).collisions), [
    {
      ids: ["first", "other"],
      refs: ["K1", "K2"],
      overlapMm: { x: 25, y: 102, z: 7 },
    },
  ]);
  assert.equal(scene({ mountingDepthMm: 107 }).collisions.length, 0);
  assert.equal(scene({ x: 122.5 }).collisions.length, 0);
});

test("panel clearances rotate with the device and use an explicitly chosen condition", () => {
  const componentId = "siemens-3rt2027-2kb40";
  const device = engine.createInstance(componentId, 0, 0, "K1");
  const sheetId = "panel";
  const placement = {
    id: "body",
    kind: "panel-placement",
    sheetId,
    deviceId: device.id,
    footprintComponentId: componentId,
    x: 100,
    y: 100,
    scale: 0.5,
    rotation: 90,
  };
  const sheets = [
    {
      id: sheetId,
      cabinetBounds: { x: 0, y: 0, width: 260, height: 400, depth: 200 },
    },
  ];
  const run = (changes) =>
    engine.panelBodyScene(
      { sheets, objects: [device, { ...placement, ...changes }] },
      sheetId,
    );
  assert.equal(run({}).clearanceConflicts.length, 0);
  assert.match(
    run({}).issues[0].message,
    /Choose a documented clearance condition/,
  );
  assert.deepEqual(
    plain(
      run({ clearanceCondition: "sideBySide" }).clearanceConflicts.map(
        ({ face, requiredMm, availableMm }) => ({
          face,
          requiredMm,
          availableMm,
        }),
      ),
    ),
    [{ face: "right", requiredMm: 10, availableMm: 9 }],
  );
});

test("floor zone polygons measure concave geometry and reject crossings", () => {
  const points = (pairs) => pairs.map(([x, y]) => ({ x, y }));
  assert.equal(
    engine.floorZonePolygonArea(
      points([
        [0, 0],
        [4, 0],
        [4, 2],
        [2, 2],
        [2, 4],
        [0, 4],
      ]),
    ),
    12,
  );
  assert.equal(
    engine.floorZonePolygonArea(
      points([
        [0, 0],
        [4, 4],
        [0, 3],
        [3, 0],
      ]),
    ),
    null,
  );
  assert.equal(
    engine.floorZonePolygonArea(
      points([
        [0, 0],
        [4, 0],
        [4, 4],
        [0, 0],
      ]),
    ),
    null,
  );
});

test("building riser diagrams isolate buildings and show every authored riser", () => {
  const sheets = [
    ["ground", "A2/000", "Workshop & Stores", "Ground", 0],
    ["first", "A2/001", "Workshop & Stores", "First", 3200],
    ["roof", "A2/002", "Workshop & Stores", "Roof", 6200],
    ["annex", "A2/003", "Annex", "Ground", 0],
    ["annexRoof", "A2/004", "Annex", "Roof", 2000],
  ].map(([id, number, building, level, elevationMm]) => ({
    id,
    number,
    floorPlan: { building, level, elevationMm },
  }));
  const objects = [
    ["ground", "first", "cable", "W-1"],
    ["roof", "first", "tray", "T-1"],
    ["annex", "annexRoof", "cable", "ANNEX-ONLY"],
  ].map(([sheetId, riserTargetSheetId, floorRouteKind, floorRouteTag]) => ({
    sheetId,
    riserTargetSheetId,
    floorRouteKind,
    floorRouteTag,
  }));
  const svg = engine.buildingRiserDiagramSvg({ sheets, objects }, "first");
  assert.match(svg, /Workshop &amp; Stores · Building riser diagram/);
  assert.match(svg, /R1 · W-1/);
  assert.match(svg, /3200 mm vertical/);
  assert.match(svg, /R2 · T-1/);
  assert.match(svg, /A2\/002 → A2\/001 · tray/);
  assert.match(svg, /3000 mm vertical/);
  assert.doesNotMatch(svg, /ANNEX-ONLY/);
});

test("specialty floor devices expose the authored independent pin identities", () => {
  const symbols = {
    "building-emergency-luminaire": ["L", "N", "PE"],
    "building-fire-alarm-loop-interface": ["LOOP+", "LOOP-"],
    "building-data-outlet-8p8c-shielded": [
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "SHIELD",
    ],
    "building-wall-switch": ["LINE", "LOAD"],
  };
  for (const [id, pins] of Object.entries(symbols)) {
    const definition = engine.component(id);
    assert.deepEqual(plain(definition.symbol.pins.map((pin) => pin.id)), pins);
    assert.deepEqual(plain(definition.symbol.internalConnections), []);
    assert.equal(
      engine.validateInstance(engine.createInstance(id, 0, 0, "X1")).valid,
      true,
    );
  }
});

test("floor protective earth schedule uses actual attachments and identifies unattached terminals", () => {
  const sheetId = "floor";
  const point = {
    ...engine.createInstance("building-earthing-bond-point", 0, 0, "PE1"),
    sheetId,
  };
  const socket = {
    ...engine.createInstance("building-socket", 500, 0, "SO1"),
    sheetId,
  };
  const wire = (id, start, end) => ({
    id,
    sheetId,
    kind: "wire",
    x1: 0,
    y1: 0,
    x2: 500,
    y2: 0,
    attachments: { start, end },
  });
  const report = engine.floorProtectiveEarthCsv({
    sheets: [{ id: sheetId, number: "A2/000", floorPlan: {} }],
    objects: [
      point,
      socket,
      wire(
        "bond",
        { instanceId: point.id, pinId: "PE1" },
        { instanceId: socket.id, pinId: "PE" },
      ),
      wire(
        "mixed",
        { instanceId: point.id, pinId: "PE1" },
        { instanceId: socket.id, pinId: "L" },
      ),
      wire("loose", { instanceId: socket.id, pinId: "PE" }, undefined),
    ],
  });
  assert.match(
    report,
    /"bond","PE1:PE1","SO1:PE","PE terminals at both ends","500"/,
  );
  assert.match(report, /"mixed","PE1:PE1","SO1:L","Other terminal type"/);
  assert.match(report, /"loose","SO1:PE","","End without terminal attachment"/);
  assert.match(report, /"PE1:PE2","","PE terminal without attached wire"/);
});

test("floor riser length requires distinct elevations in the same building", () => {
  const source = {
    id: "ground",
    floorPlan: { building: "Workshop", level: "Ground", elevationMm: 0 },
  };
  const target = {
    id: "upper",
    floorPlan: { building: "Workshop", level: "Upper", elevationMm: 3200 },
  };
  assert.equal(engine.floorRiserLength(source, target), 3200);
  assert.equal(engine.floorRiserLength(target, source), 3200);
  assert.equal(engine.floorRiserLength(source, source), null);
  assert.equal(
    engine.floorRiserLength(source, {
      ...target,
      floorPlan: { ...target.floorPlan, building: "Annex" },
    }),
    null,
  );
  assert.equal(
    engine.floorRiserLength(source, {
      ...target,
      floorPlan: { ...target.floorPlan, elevationMm: 0 },
    }),
    null,
  );
});

test("floor circuits reject cross-floor assignments and clear references when a board is removed", () => {
  const floorPlan = { building: "Workshop", level: "Ground floor" };
  const board = {
    ...engine.createInstance("building-distribution-board", 100, 100, "DB1"),
    sheetId: "ground",
    floorCircuits: [{ id: "circuit", name: "Sockets" }],
  };
  const socket = {
    ...engine.createInstance("building-socket", 300, 100, "SO1"),
    sheetId: "ground",
    floorCircuit: { boardId: board.id, circuitId: "circuit" },
  };
  const project = {
    sheets: [
      { id: "ground", floorPlan },
      { id: "upper", floorPlan },
    ],
    objects: [board, socket],
  };
  assert.ok(engine.parseProject(engine.serializeProject(project)).valid);
  assert.throws(
    () =>
      engine.serializeProject({
        ...project,
        objects: [board, { ...socket, sheetId: "upper" }],
      }),
    /Invalid floor circuit assignment/,
  );
  assert.equal(
    engine.removeDrawingObjects(project.objects, [board.id]).objects[0]
      .floorCircuit,
    undefined,
  );
});

test("floor equipment cannot reference a room on another sheet and deletion clears membership", () => {
  const floorPlan = { building: "Workshop", level: "Ground floor" };
  const device = {
    ...engine.createInstance("building-socket", 100, 100, "SO1"),
    sheetId: "ground",
    roomId: "room",
  };
  const room = {
    id: "room",
    kind: "rect",
    roomName: "Workshop",
    sheetId: "ground",
    x: 0,
    y: 0,
    x2: 200,
    y2: 200,
  };
  const project = {
    sheets: [
      { id: "ground", floorPlan },
      { id: "upper", floorPlan },
    ],
    objects: [device, room],
  };
  assert.ok(engine.parseProject(engine.serializeProject(project)).valid);
  assert.throws(
    () =>
      engine.serializeProject({
        ...project,
        objects: [device, { ...room, sheetId: "upper" }],
      }),
    /Invalid room assignment/,
  );
  assert.equal(
    engine.removeDrawingObjects(project.objects, [room.id]).objects[0].roomId,
    undefined,
  );
});

test("incoming PE bonds explicit mounting feet without doubling conductor clamps", () => {
  const project = engine.createExample("eng0601");
  const bonding = project.objects
    .filter((o) => o.sheetId === "eng0601-a3-bonding")
    .map((o) => o.text)
    .join("\n");
  assert.match(
    bonding,
    /XPE:1:2 → XPEF:1:1 \(W2 PE\); XPEF:1:2 → M1:PE \(W3 PE\)/,
  );
  assert.match(bonding, /XPE:2:2 → PS1:PE/);
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
          p.ref === "XPEF:1" ||
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
        ["M1", "XPE:0", "XPE:1", "XPE:2", "XPEF:1"].includes(pin.ref) ||
        (pin.ref === "PS1" && pin.pinId === "line-pe"),
    ),
  );
  assert.equal(
    project.objects.find((o) => o.id === "eng0601-wire-motor-pe")
      .conductorColor,
    "green/yellow",
  );
  const fieldTerminal = project.objects.find((o) => o.ref === "XPEF:1");
  const fieldEarth = project.objects.find(
    (o) => o.id === "eng0601-wire-isolator-pe",
  );
  const motorEarth = project.objects.find(
    (o) => o.id === "eng0601-wire-motor-pe",
  );
  assert.deepEqual(plain(fieldEarth.cable), { tag: "W2", core: "PE" });
  assert.deepEqual(plain(motorEarth.cable), { tag: "W3", core: "PE" });
  assert.deepEqual(plain(fieldEarth.attachments.end), {
    instanceId: fieldTerminal.id,
    pinId: "connection-1",
  });
  assert.deepEqual(plain(motorEarth.attachments.start), {
    instanceId: fieldTerminal.id,
    pinId: "connection-2",
  });
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
  assert.equal(project.sheets.length, 41);
  assert.deepEqual(
    plain(project.sheets.map((s) => s.number)),
    Array.from(
      { length: 41 },
      (_, i) =>
        (i < 6 ? "A1/" : i < 19 ? "A2/" : i < 29 ? "A3/" : "A4/") +
        String(i).padStart(3, "0"),
    ),
  );
  for (const sheet of project.sheets.filter((s) => s.sectionId === "A1")) {
    const content = project.objects.filter((o) => o.sheetId === sheet.id);
    assert.ok(content.length >= 12);
    assert.ok(
      content.every(
        (o) =>
          (o.kind === "text" ||
            (sheet.id === "eng0601-a1-0" &&
              ["rect", "arrow"].includes(o.kind))) &&
          o.y < 574 &&
          !o.locked,
      ),
    );
  }
  const overview = project.objects.filter((o) => o.sheetId === "eng0601-a1-0");
  assert.equal(overview.filter((o) => o.kind === "rect").length, 12);
  assert.equal(overview.filter((o) => o.kind === "arrow").length, 10);
  for (const [index, sheet] of project.sheets.entries()) {
    const row = project.objects.find(
      (o) => o.id === "eng0601-register-" + index,
    );
    assert.ok(
      row.text.startsWith(
        sheet.number + " · " + sheet.metadata.revision + " · " + sheet.name,
      ),
    );
  }
  assert.match(
    project.objects.find((o) => o.id === "eng0601-register-8").text,
    /↔ 007, 016, 017$/,
  );
  assert.match(
    project.objects.map((o) => o.text).join("\n"),
    /All listed sheets exist/,
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
  assert.equal(project.objects.filter((o) => o.kind === "wire").length, 93);
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
  assert.equal(engine.projectExamples().length, 8);
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
    ["hardware-plc-io", 8, 10, 19, 7],
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
  const isolator = project.objects.find((o) => o.ref === "Q2");
  assert.equal(auxiliary.assemblyFor, isolator.id);
  assert.ok(
    engine
      .component(auxiliary.componentId)
      .supportedComponentIds.includes(isolator.componentId),
  );
  auxiliary.x += 30;
  auxiliary.rotation = 90;
  auxiliary.stroke = "#ff6600";
  engine.synchronizeWireAttachments(project.objects);
  const reopened = engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid, true);
  check(reopened.project);
  assert.equal(
    reopened.project.objects.find((o) => o.id === auxiliary.id).assemblyFor,
    isolator.id,
  );
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
  const initial = engine.analyzeProject(project);
  assert.equal(initial.valid, true);
  assert.equal(initial.globalNetCount, 27);
  for (const phase of [1, 2, 3]) {
    for (const [prefix, tag] of [
      ["field-out-", "W2"],
      ["field-in-", "W2"],
      ["q2-m1-", "W3"],
    ]) {
      const wire = project.objects.find(
        (object) => object.id === "eng0601-wire-" + prefix + phase,
      );
      assert.deepEqual(plain(wire.cable), { tag, core: String(phase) });
    }
  }
  const phase1 = project.crossSheetConnections[0];
  project.objects = engine.assignWireCable(
    project,
    phase1.endpoints[0].wireId,
    { tag: "W-TEST", core: "1" },
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
    tag: "W-TEST",
    core: "1",
  });
  assert.equal(engine.analyzeProject(project).valid, false);
  assert.match(
    engine.analyzeProject(project).cableIssues.join(" "),
    /disconnected electrical nets/,
  );
  project.objects = engine.assignWireCable(project, other.endpoints[0].wireId, {
    tag: "W-TEST",
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

test("LAPP motor and field-control articles retain the exact core and bend data", () => {
  for (const [part, count, section, diameter, radius] of [
    ["1120360", 4, 4, 13.8, 55.2],
    ["1120307", 3, 1.5, 10.1, 40.4],
  ]) {
    const definition = engine.component("lapp-" + part);
    const instance = engine.createInstance(definition.id, 300, 300, "W1");
    assert.equal(engine.validateInstance(instance).valid, true);
    assert.equal(definition.symbol.pins.length, count * 2);
    assert.equal(definition.symbol.internalConnections.length, count);
    assert.equal(definition.specifications.crossSection.value, section);
    assert.equal(definition.specifications.outerDiameter.value, diameter);
    assert.equal(definition.specifications.fixedBendRadius.value, radius);
    assert.equal(definition.specifications.ratedVoltage.value, "600/1000");
    assert.equal(definition.specifications.nominalCurrent, undefined);
    for (const [a, b] of definition.symbol.internalConnections) {
      assert.equal(a.slice(2), b.slice(2));
    }
  }
});

test("graphical component resizing preserves manufacturer data and terminal identity", () => {
  const componentId = "lapp-1120307";
  const cable = engine.createInstance(componentId, 680, 300, "W4");
  const wire = {
    id: "control-lead",
    kind: "wire",
    x1: 500,
    y1: 276,
    x2: 590,
    y2: 276,
    attachments: { end: { instanceId: cable.id, pinId: "a-1" } },
  };
  const original = JSON.stringify(engine.component(componentId));
  assert.equal(
    engine.resizeGraphicObject(cable, "se", { x: 860, y: 430 }),
    true,
  );
  assert.equal(cable.displayScale, 1.5);
  engine.synchronizeWireAttachments([cable, wire]);
  assert.equal(wire.x2, 590);
  assert.equal(wire.y2, 296.5);
  engine.rotateInstance(cable, 90);
  engine.synchronizeWireAttachments([cable, wire]);
  assert.equal(wire.x2, 761);
  assert.equal(wire.y2, 197.5);
  assert.equal(wire.attachments.end.pinId, "a-1");
  assert.equal(JSON.stringify(engine.component(componentId)), original);
  assert.equal(
    engine.validateInstance({ ...cable, displayScale: 0 }).valid,
    false,
  );
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
  const external = new Set(["M1", "Q2", "Q2:AUX", "B1", "ENC2", "XPEF:1"]);
  const internal = project.objects.filter(
    (o) =>
      o.kind === "component-instance" &&
      o.sheetId !== sheet.id &&
      o.sheetId !== "eng0601-a3-accessories" &&
      o.sheetId !== "eng0601-a3-rail-mounting" &&
      !external.has(o.ref),
  );
  assert.equal(rows.length, internal.length);
  for (const device of internal)
    assert.ok(rows.some((row) => row.text.startsWith(device.ref + " · ")));
  for (const ref of external)
    assert.ok(!rows.some((row) => row.text.startsWith(ref + " · ")));
  const fieldEnclosure = project.objects.find((o) => o.ref === "ENC2");
  assert.equal(fieldEnclosure.componentId, "rittal-1033000");
  assert.equal(fieldEnclosure.sheetId, "eng0601-a3-field-isolator");
  const fieldViews = project.objects.filter(
    (o) => o.kind === "panel-placement" && o.sheetId === fieldEnclosure.sheetId,
  );
  assert.equal(fieldViews.length, 2);
  assert.equal(engine.resolvePanelDevice(project, fieldViews[0]).ref, "Q2");
  assert.equal(engine.resolvePanelDevice(project, fieldViews[1]).ref, "XPEF:1");
  const centre = project.objects.find(
    (o) => o.id === "eng0601-q2-cutout-centre",
  );
  assert.equal(centre.x2 - centre.x, 5);
  const holes = project.objects.filter(
    (o) =>
      o.kind === "circle" &&
      o.id.startsWith("eng0601-q2-cutout-") &&
      o !== centre,
  );
  assert.equal(holes.length, 4);
  assert.equal(new Set(holes.map((o) => `${o.x},${o.y}`)).size, 4);
  for (const hole of holes) {
    assert.equal(hole.sheetId, fieldEnclosure.sheetId);
    assert.equal(hole.x2 - hole.x, 2.5);
    assert.equal(Math.abs(hole.x - centre.x), 24);
    assert.equal(Math.abs(hole.y - centre.y), 24);
  }
  assert.equal(
    engine.panelPlacementGeometry(project, fieldViews[0]).width,
    33.5,
  );
  assert.ok(rows.every((row) => row.y < 520));
  const withoutLayout = {
    ...project,
    sheets: engine.numberProjectSheets(
      project.sheets.filter((s) => s.id !== sheet.id),
      project.sections,
    ),
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

test("overload mounting accessory links to one canonical relay and roundtrips independently", () => {
  const project = engine.createExample("eng0601");
  const relay = project.objects.find((o) => o.ref === "F2");
  const accessory = project.objects.find((o) => o.ref === "ACC-F2");
  assert.equal(accessory.sheetId, "eng0601-a3-rail-mounting");
  assert.equal(accessory.assemblyFor, relay.id);
  project.objects = engine.linkAssemblyAccessory(
    project,
    accessory.id,
    relay.id,
  );
  const linked = project.objects.find((o) => o.id === accessory.id);
  assert.equal(linked.assemblyFor, relay.id);
  const bom = engine.billOfMaterials(project.objects);
  assert.equal(bom.valid, true);
  assert.equal(
    bom.rows.find((r) => r.componentId === accessory.componentId).quantity,
    1,
  );
  assert.equal(
    bom.rows.find((r) => r.componentId === relay.componentId).quantity,
    1,
  );
  assert.equal(engine.worldPins(linked).length, 0);
  assert.match(
    engine.component(linked.componentId).symbol.numberingNote,
    /not modelled/,
  );
  const restored = engine.parseProject(
    engine.serializeProject(project),
  ).project;
  assert.equal(
    restored.objects.find((o) => o.id === accessory.id).assemblyFor,
    relay.id,
  );
  assert.equal(
    restored.objects.filter((o) => o.componentId === relay.componentId).length,
    1,
  );
  assert.deepEqual(
    plain(restored.crossSheetConnections),
    plain(project.crossSheetConnections),
  );
  assert.throws(
    () =>
      engine.linkAssemblyAccessory(
        project,
        accessory.id,
        project.objects.find((o) => o.ref === "K1").id,
      ),
    /compatibility/,
  );
  assert.throws(
    () => engine.linkAssemblyAccessory(project, accessory.id, accessory.id),
    /distinct/,
  );
  assert.equal(
    engine.validateInstance({ ...linked, assemblyFor: "" }).valid,
    false,
  );
  assert.ok(
    Object.isFrozen(engine.component(linked.componentId).specifications),
  );
});

test("support electrical view keeps the three manufacturer-labelled inputs isolated", () => {
  const support = engine.createInstance(
    "siemens-3ru2926-3aa01-electrical",
    200,
    200,
    "ACC1",
  );
  const def = engine.component(support.componentId);
  assert.deepEqual(
    plain(
      def.symbol.pins
        .filter((p) => p.id.startsWith("line-"))
        .map((p) => p.localNumber),
    ),
    ["1/L1", "3/L2", "5/L3"],
  );
  assert.match(def.symbol.numberingNote, /model-local/);
  const wires = engine
    .worldPins(support)
    .filter((p) => p.id.startsWith("line-"))
    .map((p, i) => ({
      kind: "wire",
      id: "lead-" + i,
      x1: p.x - 30,
      y1: p.y,
      x2: p.x,
      y2: p.y,
      attachments: { end: { instanceId: support.id, pinId: p.id } },
    }));
  const report = engine.analyze([support, ...wires]);
  assert.equal(report.nets.length, 3);
  for (const net of report.nets) {
    const ids = net.pins.map((p) => p.pinId).sort();
    assert.equal(ids.length, 2);
    const phase = ids[0].slice(-2);
    assert.deepEqual(plain(ids), ["line-" + phase, "mate-" + phase]);
  }
  for (const phase of ["l1", "l2", "l3"]) {
    assert.ok(
      def.symbol.internalConnections.some(
        (pair) => pair[0] === "line-" + phase && pair[1] === "mate-" + phase,
      ),
    );
  }
  assert.equal(engine.component("siemens-3ru2926-3aa01").symbol.pins.length, 0);
});

test("support-to-overload terminal bindings survive rotations, moves and project reopen", () => {
  const project = engine.createExample("eng0601");
  const sheetId = project.sheets.find((s) => s.sectionId === "A2").id;
  const support = engine.createInstance(
    "siemens-3ru2926-3aa01-electrical",
    250,
    220,
    "ACC1",
  );
  const relay = engine.createInstance("siemens-3ru2126-4bb0", 600, 400, "F2");
  support.sheetId = relay.sheetId = sheetId;
  const wires = ["l1", "l2", "l3"].map((phase) => {
    const a = engine.worldPins(support).find((p) => p.id === "mate-" + phase);
    const b = engine.worldPins(relay).find((p) => p.id === "line-" + phase);
    return {
      id: "assembly-" + phase,
      kind: "wire",
      sheetId,
      x1: a.x,
      y1: a.y,
      x2: b.x,
      y2: b.y,
      attachments: {
        start: { instanceId: support.id, pinId: a.id },
        end: { instanceId: relay.id, pinId: b.id },
      },
    };
  });
  project.objects = [support, relay, ...wires];
  project.crossSheetConnections = [];
  project.objects = engine.linkAssemblyAccessory(project, support.id, relay.id);
  const check = (objects) => {
    assert.deepEqual(plain(engine.synchronizeWireAttachments(objects)), []);
    const report = engine.analyze(objects);
    assert.equal(report.nets.length, 3);
    for (const phase of ["l1", "l2", "l3"]) {
      const net = report.nets.find((n) =>
        n.pins.some((p) => p.ref === "ACC1" && p.pinId === "line-" + phase),
      );
      assert.ok(
        net.pins.some((p) => p.ref === "F2" && p.pinId === "line-" + phase),
      );
      assert.ok(
        net.pins.some((p) => p.ref === "ACC1" && p.pinId === "mate-" + phase),
      );
      assert.equal(net.pins.filter((p) => p.ref === "ACC1").length, 2);
    }
  };
  for (let turn = 0; turn < 4; turn++) {
    engine.rotateInstance(project.objects[0], 90);
    engine.moveInstance(relay, relay.x + 20, relay.y - 10);
    check(project.objects);
  }
  const restored = engine.parseProject(
    engine.serializeProject(project),
  ).project;
  check(restored.objects);
  assert.equal(restored.objects[0].assemblyFor, relay.id);
  assert.deepEqual(
    plain(
      restored.objects
        .filter((o) => o.kind === "wire")
        .map((w) => w.attachments),
    ),
    plain(wires.map((w) => w.attachments)),
  );
});

test("wire lanes share routing, branch geometry, length and native persistence", () => {
  const wire = {
    id: "routed",
    kind: "wire",
    x1: 0,
    y1: 0,
    x2: 100,
    y2: 10,
    route: { axis: "y", coordinate: 40 },
  };
  assert.deepEqual(plain(engine.wireRoute(wire)), [
    { x: 0, y: 0 },
    { x: 0, y: 40 },
    { x: 100, y: 40 },
    { x: 100, y: 10 },
  ]);
  assert.equal(engine.wireRouteLength(wire), 170);
  assert.equal(engine.wireList([wire]).rows[0].lengthMm, 170);
  const branch = { id: "branch", kind: "wire", x1: 50, y1: 40, x2: 50, y2: 70 };
  assert.equal(engine.analyze([wire, branch]).nets.length, 1);
  const oldElbowBranch = { ...branch, y1: 0, y2: -20 };
  assert.equal(engine.analyze([wire, oldElbowBranch]).nets.length, 2);
  const restored = engine.parseProject(
    engine.serializeProject({ project: "Routes", sheets: [], objects: [wire] }),
  ).project;
  assert.deepEqual(plain(restored.objects[0].route), wire.route);
  assert.equal(engine.wireRouteLength(restored.objects[0]), 170);
  const vertical = { ...wire, route: { axis: "x", coordinate: 150 } };
  assert.equal(engine.wireRouteLength(vertical), 210);
  assert.throws(
    () =>
      engine.serializeProject({
        project: "Bad route",
        sheets: [],
        objects: [{ ...wire, route: { axis: "z", coordinate: 40 } }],
      }),
    /route/,
  );
  assert.throws(
    () => engine.wireRoute({ ...wire, route: { axis: "y", coordinate: NaN } }),
    /finite/,
  );
});

test("manual wire bends retain diagonal route geometry and length on reopen", () => {
  const wire = {
    id: "manual",
    kind: "wire",
    x1: 0,
    y1: 0,
    x2: 10,
    y2: 4,
    waypoints: [
      { x: 3, y: 4 },
      { x: 7, y: 4 },
    ],
  };
  const project = { project: "Manual route", sheets: [], objects: [wire] };
  const restored = engine.parseProject(
    engine.serializeProject(project),
  ).project;
  assert.deepEqual(plain(restored.objects[0]), wire);
  assert.equal(engine.wireRouteLength(restored.objects[0]), 12);
  assert.equal(engine.wireList(restored.objects).rows[0].lengthMm, 12);
  assert.throws(
    () => engine.wireRoute({ ...wire, waypoints: [{ x: Infinity, y: 4 }] }),
    /finite bend/,
  );
});

test("project cable export follows the current core assignments and continuation identities", () => {
  const project = engine.createExample("eng0601");
  const rows = engine.cableCoreRegister(project);
  const pe = rows.filter((row) => row.tag === "W2" && row.core === "PE");
  assert.equal(pe.length, 1);
  assert.ok(
    [pe[0].start, pe[0].end].some((name) => name.startsWith("XPEF:1:")),
  );
  const phase = rows.filter((row) => row.tag === "W2" && row.core === "1");
  assert.equal(phase.length, 2);
  assert.deepEqual(phase[0].links, phase[1].links);
  assert.ok(phase[0].links.length);
  project.objects = engine.assignWireCable(project, phase[0].wireId, {
    tag: "W2-REVISED",
    core: "1",
  });
  const revised = engine.cableCoreRegister(project);
  assert.equal(revised.filter((row) => row.tag === "W2-REVISED").length, 2);
  assert.match(engine.cableCoreRegisterCsv(project), /"W2-REVISED","1","A2\//);
});

test("A4 native registers match canonical devices and remain editable after reopen", () => {
  const project = engine.createExample("eng0601");
  const sheets = project.sheets.filter((s) => s.sectionId === "A4");
  assert.equal(sheets.length, 12);
  assert.equal(sheets[0].number, "A4/029");
  assert.equal(sheets.at(-2).name, "Future installation evidence");
  assert.equal(sheets.at(-1).number, "A4/040");
  assert.equal(sheets.at(-1).name, "Cable routes and identification schedule");
  const reportObjects = project.objects.filter((o) =>
    sheets.some((s) => s.id === o.sheetId),
  );
  const evidenceReferences = reportObjects.filter((o) =>
    o.id.startsWith("eng0601-release-evidence-sheets-"),
  );
  assert.equal(evidenceReferences.length, 8);
  for (const row of evidenceReferences) {
    const references = row.text.match(/A[1-4]\/\d{3}/g);
    assert.ok(references?.length);
    assert.ok(
      references.every((number) =>
        project.sheets.some((sheet) => sheet.number === number),
      ),
    );
  }
  const bondingSheet = project.sheets.find(
    (sheet) => sheet.id === "eng0601-a3-bonding",
  );
  assert.ok(evidenceReferences[3].text.includes(bondingSheet.number));
  const w1 = reportObjects.find((o) => o.id === "eng0601-feeder-cable-W1");
  assert.match(w1.text, /Q1:1L1.*Q1:3L2.*Q1:5L3.*Q1:N.*XPE:0:1 \(PE\)/);
  const w2 = reportObjects.find(
    (o) => o.id === "eng0601-cable-schedule-cores-W2",
  );
  assert.match(w2.text, /PE XPE:1:2 → XPEF:1:1/);
  assert.match(w2.text, /LAPP 1120360 candidate, 4G4 unshielded/);
  const dropSheet = sheets.find(
    (sheet) => sheet.name === "Motor feeder voltage-drop study",
  );
  const dropRows = reportObjects
    .filter((o) => o.sheetId === dropSheet.id)
    .map((o) => o.text)
    .join("\n");
  assert.match(dropRows, /starting current 118\.56 A/);
  assert.match(dropRows, /260 A .*45\.6% of nominal pickup/);
  assert.match(dropRows, /20 m scenario: run 2\.46 V .*start 8\.82 V/);
  assert.match(dropRows, /40 m scenario: run 4\.92 V .*start 17\.64 V/);
  assert.match(dropRows, /60 m scenario: run 7\.38 V .*start 26\.46 V/);
  assert.ok(reportObjects.every((o) => o.kind === "text" && !o.locked));
  for (const row of engine.billOfMaterials(project.objects).rows) {
    const text = reportObjects.find(
      (o) => o.id === "eng0601-bom-" + row.componentId,
    );
    assert.ok(
      text.text.includes(
        row.quantity + " × " + row.manufacturer + " · " + row.partNumber,
      ),
    );
    for (const ref of row.references) assert.ok(text.text.includes(ref));
  }
  for (const device of project.objects.filter(
    (o) => o.kind === "component-instance" && /^X/.test(o.ref),
  )) {
    const text = reportObjects.find(
      (o) => o.id === "eng0601-terminal-register-" + device.id,
    );
    assert.ok(text.text.includes(device.ref));
    for (const pin of engine.component(device.componentId).symbol.pins)
      assert.ok(text.text.includes(pin.localNumber + ":"));
  }
  assert.ok(reportObjects.some((o) => o.text.includes("NOT PERFORMED")));
  const commissioning = sheets.find(
    (s) => s.name === "Inspection and commissioning plan",
  );
  const commissioningRows = reportObjects
    .filter((o) => o.sheetId === commissioning.id)
    .map((o) => o.text)
    .join("\n");
  assert.match(commissioningRows, /With S1 released/);
  assert.match(commissioningRows, /INSTALLATION HOLD: held or welded S1/);
  const evidenceRecords = reportObjects.filter((o) =>
    o.id.startsWith("eng0601-release-evidence-record-"),
  );
  assert.equal(evidenceRecords.length, 8);
  assert.ok(
    evidenceRecords.every((o) => o.text.startsWith("Future site record")),
  );
  evidenceRecords[0].text = "OPEN | Review record attached, acceptance pending";
  assert.ok(reportObjects.every((o) => o.y <= 545));
  reportObjects.find((o) => o.text.includes("NOT PERFORMED")).text =
    "Owner review note; testing remains unperformed.";
  const restored = engine.parseProject(
    engine.serializeProject(project),
  ).project;
  assert.deepEqual(plain(restored.objects), plain(project.objects));
  assert.deepEqual(
    plain(restored.crossSheetConnections),
    plain(project.crossSheetConnections),
  );
  const fresh = engine.createExample("eng0601");
  assert.ok(
    fresh.objects.some((o) => o.text && o.text.includes("NOT PERFORMED")),
  );
});

test("ENG-0601 opens with linked protection and supply body envelopes inside the A3 plate", () => {
  const project = engine.createExample("eng0601");
  const placements = project.objects.filter(
    (o) => o.kind === "panel-placement" && o.sheetId === "eng0601-a3-0",
  );
  assert.equal(placements.length, 5);
  const geometries = placements.map((placement) => {
    assert.equal(placement.sheetId, "eng0601-a3-0");
    assert.equal(placement.scale, 0.5);
    const geometry = engine.panelPlacementGeometry(project, placement);
    const resolved = engine.resolvePanelDevice(project, placement);
    assert.ok(["F1", "K1", "PS1", "F3", "F4"].includes(resolved.ref));
    assert.equal(
      geometry.width,
      resolved.definition.panelFootprint.widthMm * 0.5,
    );
    assert.equal(
      geometry.height,
      resolved.definition.panelFootprint.heightMm * 0.5,
    );
    assert.ok(placement.x - geometry.width / 2 > 300 - 545 * 0.25);
    assert.ok(placement.x + geometry.width / 2 < 300 + 545 * 0.25);
    assert.ok(placement.y - geometry.height / 2 > 350 - 775 * 0.25);
    assert.ok(placement.y + geometry.height / 2 < 350 + 775 * 0.25);
    return { ...geometry, x: placement.x, y: placement.y };
  });
  assert.ok(
    Math.abs(geometries[0].x - geometries[1].x) >
      (geometries[0].width + geometries[1].width) / 2,
  );
  const withoutViews = project.objects.filter(
    (o) => o.kind !== "panel-placement",
  );
  assert.deepEqual(
    plain(engine.billOfMaterials(project.objects)),
    plain(engine.billOfMaterials(withoutViews)),
  );
  const first = engine.resolvePanelDevice(project, placements[0]).instance;
  first.ref = "F1-reviewed";
  assert.equal(
    engine.resolvePanelDevice(project, placements[0]).ref,
    "F1-reviewed",
  );
  const restored = engine.parseProject(
    engine.serializeProject(project),
  ).project;
  assert.deepEqual(
    plain(
      restored.objects.filter(
        (o) => o.kind === "panel-placement" && o.sheetId === "eng0601-a3-0",
      ),
    ),
    plain(placements),
  );
});

test("PS1 panel view keeps body dimensions separate from convection clearance", () => {
  const project = engine.createExample("eng0601");
  const ps1 = project.objects.find((o) => o.ref === "PS1");
  const definition = engine.component(ps1.componentId);
  const footprint = definition.panelFootprint;
  assert.deepEqual(
    [footprint.widthMm, footprint.heightMm, footprint.depthMm],
    [45, 80, 100],
  );
  assert.deepEqual(plain(footprint.clearancesMm), {
    top: 50,
    bottom: 50,
    left: 0,
    right: 0,
  });
  assert.equal(footprint.mountingEnvelope.heightMm, 180);
  assert.ok(Object.isFrozen(footprint));
  const placement = project.objects.find(
    (o) =>
      o.kind === "panel-placement" &&
      o.sheetId === "eng0601-a3-0" &&
      o.deviceId === ps1.id,
  );
  const geometry = engine.panelPlacementGeometry(project, placement);
  assert.equal(geometry.height, 40);
  const top =
    placement.y -
    geometry.height / 2 -
    footprint.clearancesMm.top * placement.scale;
  const bottom =
    placement.y +
    geometry.height / 2 +
    footprint.clearancesMm.bottom * placement.scale;
  assert.ok(top >= 350 - 775 * 0.25 && bottom <= 350 + 775 * 0.25);
  for (const other of project.objects.filter(
    (o) =>
      o.kind === "panel-placement" &&
      o.sheetId === "eng0601-a3-0" &&
      o.id !== placement.id,
  )) {
    const box = engine.panelPlacementGeometry(project, other);
    assert.ok(
      Math.abs(other.x - placement.x) > (box.width + geometry.width) / 2,
    );
  }
  assert.equal(
    engine
      .billOfMaterials(project.objects)
      .rows.find((r) => r.componentId === ps1.componentId).quantity,
    1,
  );
  assert.equal(engine.analyzeProject(project).globalNetCount, 27);
});

test("control protection panel views use sourced axes without overlapping other devices", () => {
  const project = engine.createExample("eng0601");
  for (const [ref, dimensions] of [
    ["F3", [18, 90, 76]],
    ["F4", [6.2, 105.8, 55.6]],
  ]) {
    const device = project.objects.find((o) => o.ref === ref);
    const footprint = engine.component(device.componentId).panelFootprint;
    assert.deepEqual(
      [footprint.widthMm, footprint.heightMm, footprint.depthMm],
      dimensions,
    );
    assert.ok(footprint.source.startsWith("https://"));
    assert.equal(
      engine
        .billOfMaterials(project.objects)
        .rows.find((r) => r.componentId === device.componentId).quantity,
      1,
    );
  }
  const boxes = project.objects
    .filter((o) => o.kind === "panel-placement" && o.sheetId === "eng0601-a3-0")
    .map((o) => ({
      ...engine.panelPlacementGeometry(project, o),
      x: o.x,
      y: o.y,
    }));
  boxes.forEach((a, i) =>
    boxes
      .slice(i + 1)
      .forEach((b) =>
        assert.ok(
          Math.abs(a.x - b.x) >= (a.width + b.width) / 2 ||
            Math.abs(a.y - b.y) >= (a.height + b.height) / 2,
        ),
      ),
  );
  const dimensions = engine.component("phoenix-contact-2908262").specifications
    .dimensions;
  assert.equal(dimensions.height.value, 105.8);
  assert.equal(dimensions.depthIncludingRail.value, 55.6);
  assert.equal(engine.analyzeProject(project).globalNetCount, 27);
});

test("terminal panel views preserve canonical connections and survive local reopen", () => {
  const project = engine.createExample("eng0601");
  const originalNets = engine.analyzeProject(project).globalNetCount;
  const originalBom = JSON.stringify(engine.billOfMaterials(project.objects));
  for (const [ref, width, height, depth] of [
    ["X1:1", 6.2, 42.5, 47],
    ["X5:1", 5.2, 47.7, 47.5],
    ["XPE:1", 12.2, 75.4, 52.6],
  ]) {
    const device = project.objects.find((o) => o.ref === ref);
    const definition = engine.component(device.componentId);
    assert.ok(Object.isFrozen(definition.panelFootprint));
    assert.deepEqual(
      [
        definition.panelFootprint.widthMm,
        definition.panelFootprint.heightMm,
        definition.panelFootprint.depthMm,
      ],
      [width, height, depth],
    );
    assert.match(definition.panelFootprint.note, /NS 35\/7.5/);
    const placement = engine.createPanelPlacement(
      project,
      device.id,
      "eng0601-a3-0",
      200,
      500,
      0.5,
    );
    project.objects.push(placement);
    const geometry = engine.panelPlacementGeometry(project, placement);
    assert.equal(geometry.width, width * 0.5);
    assert.equal(geometry.height, height * 0.5);
    device.ref = ref + "-renamed";
    assert.equal(engine.resolvePanelDevice(project, placement).ref, device.ref);
    device.ref = ref;
  }
  const reopened = engine.parseProject(
    engine.serializeProject(project),
  ).project;
  assert.equal(engine.analyzeProject(reopened).globalNetCount, originalNets);
  assert.equal(
    JSON.stringify(engine.billOfMaterials(reopened.objects)),
    originalBom,
  );
  for (const placement of reopened.objects.filter(
    (o) => o.kind === "panel-placement",
  )) {
    assert.ok(engine.resolvePanelDevice(reopened, placement));
    assert.ok(engine.panelPlacementGeometry(reopened, placement));
  }
});

test("A3 terminal detail sheets cover each canonical terminal once without overlapping bodies", () => {
  const project = engine.createExample("eng0601");
  const terminals = project.objects.filter(
    (o) =>
      o.kind === "component-instance" && /^X/.test(o.ref) && o.ref !== "XPEF:1",
  );
  const views = project.objects.filter(
    (o) =>
      o.kind === "panel-placement" &&
      ["eng0601-a3-1", "eng0601-a3-2"].includes(o.sheetId),
  );
  assert.equal(terminals.length, 17);
  const accessories = project.objects.filter(
    (o) =>
      o.kind === "component-instance" && o.sheetId === "eng0601-a3-accessories",
  );
  assert.equal(accessories.length, 18);
  assert.equal(views.length, terminals.length + accessories.length);
  assert.deepEqual(
    Array.from(views, (o) => o.deviceId).sort(),
    [...terminals, ...accessories].map((o) => o.id).sort(),
  );
  assert.equal(
    accessories.filter((o) => o.componentId === "phoenix-contact-3022276")
      .length,
    12,
  );
  for (const [part, strip] of [
    ["3003020", "X1"],
    ["3003020", "X2"],
    ["3003020", "X3"],
    ["3003020", "X4"],
    ["3047028", "X5"],
    ["3212060", "XPE"],
  ]) {
    const cover = accessories.find(
      (o) =>
        o.componentId === "phoenix-contact-" + part &&
        o.ref === "ACC-" + strip + "-C",
    );
    const finalTerminal = terminals
      .filter((o) => o.ref.startsWith(strip + ":"))
      .sort((a, b) => a.ref.localeCompare(b.ref, undefined, { numeric: true }))
      .at(-1);
    assert.equal(cover.assemblyFor, finalTerminal.id);
  }
  const rails = project.objects.filter(
    (o) => o.kind === "rect" && o.id.startsWith("eng0601-terminal-rail-"),
  );
  assert.equal(rails.length, 6);
  for (const rail of rails) {
    assert.equal((rail.y2 - rail.y) / 5, 35);
    const strip = rail.id.replace("eng0601-terminal-rail-", "");
    const bodyWidth = [...terminals, ...accessories]
      .filter(
        (device) =>
          device.ref.split(":")[0] === strip ||
          device.properties.location === "Terminal strip " + strip,
      )
      .reduce(
        (sum, device) =>
          sum + engine.component(device.componentId).panelFootprint.widthMm,
        0,
      );
    const railLength = (rail.x2 - rail.x) / 5;
    assert.equal(railLength, strip === "XPE" ? 83 : 58);
    const spare = project.objects.find(
      (o) => o.id === "eng0601-rail-spare-" + strip,
    );
    const spareWidth = (spare.x2 - spare.x) / 5;
    assert.ok(
      Math.abs(
        spareWidth - (strip === "XPE" ? 12.2 : strip === "X5" ? 5.2 : 6.2),
      ) < 1e-9,
    );
    assert.ok(spare.x >= rail.x && spare.x2 <= rail.x2);
    assert.ok(railLength - bodyWidth - spareWidth >= 8);
    const slots = project.objects.filter((o) =>
      o.id.startsWith("eng0601-rail-slot-" + strip + "-"),
    );
    assert.equal(slots.length, strip === "XPE" ? 3 : 2);
    for (const [index, slot] of slots.entries()) {
      if (index) assert.equal((slot.x - slots[index - 1].x) / 0.5, 25);
      assert.equal((slot.x2 - slot.x) / 0.5, 15);
      assert.ok(Math.abs((slot.y2 - slot.y) / 0.5 - 6.2) < 1e-9);
    }
  }
  const plate = project.objects.find((o) => o.id === "eng0601-rail-plate");
  const door = project.objects.find((o) => o.id === "eng0601-door-envelope");
  const doorHoles = project.objects.filter((o) =>
    o.id.startsWith("eng0601-door-cutout-"),
  );
  assert.deepEqual(
    Array.from(doorHoles, (o) => o.id.replace("eng0601-door-cutout-", "")),
    ["H1", "H2", "S0", "S1", "Q1"],
  );
  for (const hole of doorHoles) {
    assert.equal(hole.kind, "circle");
    assert.equal((hole.x2 - hole.x) * 4, 22.5);
    assert.ok(hole.x - 6 > door.x && hole.x + 6 < door.x2);
    assert.ok(hole.y - 6 > door.y && hole.y + 6 < door.y2);
  }
  const entry = project.objects.find((o) => o.id === "eng0601-entry-envelope");
  const entryZones = project.objects.filter((o) =>
    o.id.startsWith("eng0601-entry-zone-"),
  );
  assert.equal((entry.x2 - entry.x) / 0.75, 436);
  assert.equal((entry.y2 - entry.y) / 0.75, 221);
  assert.deepEqual(
    Array.from(entryZones, (o) => o.id.replace("eng0601-entry-zone-", "")),
    ["W1", "W2", "W4", "W5"],
  );
  for (const zone of entryZones) {
    assert.ok(zone.x > entry.x && zone.x2 < entry.x2);
    assert.ok(zone.y > entry.y && zone.y2 < entry.y2);
  }
  assert.ok(
    Math.max(...entryZones.slice(0, 2).map((o) => o.x2)) <
      Math.min(...entryZones.slice(2).map((o) => o.x)),
  );
  const zones = project.objects.filter((o) =>
    o.id.startsWith("eng0601-rail-access-"),
  );
  assert.equal(zones.length, 6);
  const ps1Zone = project.objects.find((o) => o.id === "eng0601-rail-ps1-zone");
  assert.equal((ps1Zone.y2 - ps1Zone.y) / 0.5, 180);
  zones.push(ps1Zone);
  const ducts = project.objects.filter(
    (o) => o.id.startsWith("eng0601-duct-") && o.kind === "rect",
  );
  assert.equal(ducts.length, 2);
  const gapNote = project.objects.find((o) => o.id === "eng0601-rail-duct-gap");
  for (const side of ["power", "control"]) {
    const duct = ducts.find((o) => o.id === "eng0601-duct-" + side);
    const clearances = zones
      .slice(0, 6)
      .filter((zone) => duct.y < zone.y2 && duct.y2 > zone.y)
      .map(
        (zone) =>
          (side === "power" ? zone.x - duct.x2 : duct.x - zone.x2) / 0.5,
      );
    const minimum = Math.min(...clearances);
    assert.ok(Number.isFinite(minimum) && minimum > 0);
    assert.ok(gapNote.text.includes(side + " " + minimum + " mm"));
  }
  for (const duct of ducts) {
    assert.equal((duct.x2 - duct.x) / 0.5, 20);
    assert.equal((duct.y2 - duct.y) / 0.5, 700);
  }
  zones.push(...ducts);
  const support = project.objects.find((o) => o.ref === "ACC-F2");
  const dimensions = engine.component(support.componentId).specifications
    .dimensions;
  const halfWidth = dimensions.width.value / 4;
  const halfHeight = dimensions.height.value / 4;
  for (const zone of zones) {
    assert.ok(
      support.x + halfWidth <= zone.x ||
        support.x - halfWidth >= zone.x2 ||
        support.y + halfHeight <= zone.y ||
        support.y - halfHeight >= zone.y2,
    );
  }
  const cabinet = project.objects.find((o) => o.ref === "ENC1");
  const bodies = project.objects.filter(
    (o) => o.kind === "panel-placement" && o.sheetId === cabinet.sheetId,
  );
  assert.equal(bodies.length, 5);
  const railBodies = project.objects.filter(
    (o) => o.kind === "panel-placement" && o.sheetId === plate.sheetId,
  );
  assert.equal(railBodies.length, bodies.length);
  for (const body of bodies) {
    const geometry = engine.panelPlacementGeometry(project, body);
    const x = (plate.x + plate.x2) / 2 + geometry.x - cabinet.x;
    const y = (plate.y + plate.y2) / 2 + geometry.y - cabinet.y;
    const railBody = railBodies.find((o) => o.deviceId === body.deviceId);
    assert.equal(railBody.x, x);
    assert.equal(railBody.y, y);
    assert.equal(railBody.scale, body.scale);
    for (const zone of zones.filter((o) => o !== ps1Zone)) {
      assert.ok(
        x + geometry.width / 2 <= zone.x ||
          x - geometry.width / 2 >= zone.x2 ||
          y + geometry.height / 2 <= zone.y ||
          y - geometry.height / 2 >= zone.y2,
      );
    }
  }
  for (const [index, zone] of zones.entries()) {
    assert.ok(
      zone.x >= plate.x &&
        zone.y >= plate.y &&
        zone.x2 <= plate.x2 &&
        zone.y2 <= plate.y2,
    );
    for (const next of zones.slice(index + 1)) {
      assert.ok(
        zone.x2 <= next.x ||
          next.x2 <= zone.x ||
          zone.y2 <= next.y ||
          next.y2 <= zone.y,
      );
    }
  }
  for (const view of views) {
    const box = engine.panelPlacementGeometry(project, view);
    assert.equal(view.scale, 5);
    assert.ok(view.x - box.width / 2 >= 60 && view.x + box.width / 2 <= 1174);
    assert.ok(view.y - box.height / 2 >= 150 && view.y + box.height / 2 < 550);
    for (const other of views.filter(
      (o) => o.sheetId === view.sheetId && o.id !== view.id,
    )) {
      const next = engine.panelPlacementGeometry(project, other);
      assert.ok(
        Math.abs(view.x - other.x) + 1e-8 >= (box.width + next.width) / 2,
      );
    }
  }
  assert.equal(engine.analyzeProject(project).globalNetCount, 27);
  const restored = engine.parseProject(
    engine.serializeProject(project),
  ).project;
  assert.deepEqual(plain(restored.objects), plain(project.objects));
  assert.deepEqual(
    plain(restored.crossSheetConnections),
    plain(project.crossSheetConnections),
  );
});

test("terminal accessories retain sourced dimensions without fabricated electrical pins", () => {
  const project = engine.createExample("eng0601");
  const baseline = engine.billOfMaterials(project.objects).rows;
  const before = engine.analyzeProject(project).globalNetCount;
  for (const [part, dimensions] of [
    ["3003020", [1.8, 42.5, 35.9]],
    ["3047028", [2.2, 47, 39.8]],
    ["3212060", [2.2, 75.4, 45.6]],
    ["3022276", [5.2, 48.6, 35.3]],
  ]) {
    const definition = engine.component("phoenix-contact-" + part);
    assert.equal(definition.family, "terminal-accessory");
    assert.equal(definition.symbol.pins.length, 0);
    assert.equal(definition.symbol.internalConnections.length, 0);
    assert.deepEqual(
      [
        definition.panelFootprint.widthMm,
        definition.panelFootprint.heightMm,
        definition.panelFootprint.depthMm,
      ],
      dimensions,
    );
    assert.ok(Object.isFrozen(definition.specifications));
    const accessory = engine.createInstance(
      definition.id,
      100,
      100,
      "ACC-" + part,
    );
    accessory.sheetId = "eng0601-a3-1";
    project.objects.push(accessory);
  }
  const cover = project.objects.find((o) => o.ref === "ACC-3047028");
  const terminal = project.objects.find((o) => o.ref === "X5:1");
  project.objects = engine.linkAssemblyAccessory(
    project,
    cover.id,
    terminal.id,
  );
  assert.throws(() =>
    engine.linkAssemblyAccessory(
      project,
      cover.id,
      project.objects.find((o) => o.ref === "X1:1").id,
    ),
  );
  const reopened = engine.parseProject(
    engine.serializeProject(project),
  ).project;
  assert.equal(
    reopened.objects.find((o) => o.id === cover.id).assemblyFor,
    terminal.id,
  );
  assert.equal(engine.analyzeProject(reopened).globalNetCount, before);
  for (const part of ["3003020", "3047028", "3212060", "3022276"]) {
    assert.equal(
      engine
        .billOfMaterials(reopened.objects)
        .rows.find((r) => r.componentId === "phoenix-contact-" + part).quantity,
      1 +
        (baseline.find((r) => r.componentId === "phoenix-contact-" + part)
          ?.quantity ?? 0),
    );
  }
});
