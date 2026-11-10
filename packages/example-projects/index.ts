import {
  createProject,
  validateProject,
  type Project,
} from "../electrical-model/project.ts";
import { synchronizeConnectivity } from "../connectivity-engine/analyze.ts";
import { installSymbol } from "../component-library/symbols.ts";
import {
  place,
  connect,
  ensureLayer,
  type Primitive,
} from "../schematic-editor/commands.ts";
import {
  addBuilding,
  addFloor,
  addRectangularRoom,
} from "../building-design/structure.ts";
import { addPlanLayer, addWall } from "../building-design/walls.ts";
import {
  createFloorDevice,
  type FloorDeviceKind,
} from "../building-design/floor-devices.ts";
import {
  saveDistributionBoard,
  savePlanCircuit,
} from "../building-design/circuits.ts";
import { createPlcModule, savePlcAddress } from "../automation/plc.ts";
import { exampleCatalog } from "./catalog.ts";
import type { ExampleId } from "./catalog.ts";

export const examples = exampleCatalog;
export type { ExampleId } from "./catalog.ts";
const names: Record<ExampleId, string> = {
  substation: "EES_Original_Energy_Substation_V01",
  photovoltaic: "Photovoltaic_string_and_inverter_interfaces",
  motor: "Maintained_run_motor_starter",
  building: "Residential_lighting_and_sockets",
  plc: "PLC_sensor_control_cabinet",
};

/** Original educational fixtures, built using the same commands as user projects.
 * Deliberate open interfaces remain visible in electrical checks. No ratings,
 * manufacturer identity, operational simulation or certified design is asserted.
 */
export function buildExample(id: ExampleId): Project {
  if (!examples.some((example) => example.id === id))
    throw new Error("Unknown example");
  let p = createProject(names[id]);
  const documentId = crypto.randomUUID();
  p.documents.push({
    id: documentId,
    name: "Electrical documentation",
    kind: "schematic",
    outputLanguage: "en",
  });
  function page(name: string) {
    const pageId = crypto.randomUUID();
    p.pages.push({
      id: pageId,
      name,
      documentId,
      widthMm: 420,
      heightMm: 297,
      order: p.pages.length,
      gridMm: 5,
      snapping: true,
    });
    ensureLayer(p, pageId, "Electrical");
    return pageId;
  }
  let pageId = page("01 · Electrical overview");
  function symbol(
    kind: Primitive | string,
    reference: string,
    x: number,
    y: number,
    rotation: 0 | 90 | 180 | 270 = 0,
    description = reference,
  ) {
    const generic = [
      "terminal",
      "junction",
      "fuse",
      "contact",
      "coil",
      "lamp",
      "motor",
      "ground",
      "resistor",
    ].includes(kind);
    if (!generic) p = installSymbol(p, kind);
    const instanceId = place(
      p,
      pageId,
      p.layers.find((layer) => layer.pageId === pageId)!.id,
      generic ? (kind as Primitive) : "custom",
      { x, y },
      0,
      generic ? undefined : `library-${kind}`,
    );
    const instance = p.symbolInstances.find((item) => item.id === instanceId)!;
    instance.rotation = rotation;
    const device = p.devices.find((item) => item.id === instance.deviceId)!;
    device.reference = reference;
    device.name = description;
    return device.id;
  }
  function pin(reference: string, designation: string) {
    const device = p.devices.find((item) => item.reference === reference);
    const instance = p.symbolInstances.find(
      (item) => item.deviceId === device?.id && item.pageId === pageId,
    );
    const result = p.pins.find(
      (item) =>
        item.symbolInstanceId === instance?.id &&
        item.definitionPinId === designation,
    );
    if (!result)
      throw new Error(`Missing example pin ${reference}:${designation}`);
    return result.id;
  }
  function wire(
    from: string,
    a: string,
    to: string,
    b: string,
    color = "#d02030",
  ) {
    connect(p, pin(from, a), pin(to, b));
    p.wires.at(-1)!.color = color;
  }
  function note(text: string, x: number, y: number) {
    p.annotations.push({
      id: crypto.randomUUID(),
      name: "Engineering note",
      pageId,
      layerId: p.layers.find((layer) => layer.pageId === pageId)!.id,
      position: { x, y },
      text,
    });
  }
  function cabinet(
    deviceReferences: string[],
    name = "Generic educational control cabinet",
  ) {
    const enclosureId = crypto.randomUUID();
    p.enclosures.push({
      id: enclosureId,
      name,
      widthMm: 600,
      heightMm: 800,
      depthMm: 250,
    });
    const plate = crypto.randomUUID();
    p.panelStructures.push({
      id: plate,
      name: "Mounting plate",
      enclosureId,
      kind: "plate",
      positionMm: { x: 15, y: 15, z: 0 },
      sizeMm: { x: 570, y: 770, z: 2 },
    });
    for (let row = 0; row < 3; row++) {
      const railId = crypto.randomUUID();
      p.panelStructures.push({
        id: railId,
        name: `DIN rail ${row + 1}`,
        enclosureId,
        kind: "din-rail",
        positionMm: { x: 35, y: 110 + row * 205, z: 2 },
        sizeMm: { x: 530, y: 35, z: 8 },
      });
      const ductId = crypto.randomUUID();
      p.panelStructures.push({
        id: ductId,
        name: `Cable duct ${row + 1}`,
        enclosureId,
        kind: "duct",
        positionMm: { x: 35, y: 225 + row * 205, z: 2 },
        sizeMm: { x: 530, y: 40, z: 40 },
      });
      for (const [column, reference] of deviceReferences
        .slice(row * 4, row * 4 + 4)
        .entries()) {
        const device = p.devices.find((item) => item.reference === reference)!;
        p.equipment3d.push({
          id: crypto.randomUUID(),
          name: `${reference} · manually dimensioned generic envelope`,
          deviceId: device.id,
          enclosureId,
          dimensionSource: "manual",
          positionMm: { x: 50 + column * 125, y: 85 + row * 205, z: 10 },
          sizeMm: { x: 80, y: 90, z: 65 },
          mountingStructureId: railId,
          clearanceMm: 5,
        });
      }
    }
  }
  if (id === "substation") {
    note(
      "ORIGINAL TRANSFORMER STATION · single-phase equivalent documentation",
      20,
      22,
    );
    note("Primary interfaces", 30, 42);
    note("Transformer", 165, 42);
    note("Secondary interfaces", 300, 42);
    symbol("terminal", "X1", 35, 85, 0, "Incoming primary interface P1");
    symbol("terminal", "X2", 35, 125, 0, "Incoming primary interface P2");
    symbol(
      "fuse",
      "F1",
      95,
      85,
      0,
      "Primary protection interface; rating unspecified",
    );
    symbol(
      "fuse",
      "F2",
      95,
      125,
      0,
      "Primary protection interface; rating unspecified",
    );
    symbol(
      "transformer-two-winding",
      "T1",
      190,
      105,
      0,
      "Two-winding transformer; single-phase equivalent",
    );
    symbol("contact", "Q1", 285, 85, 0, "Secondary isolation interface");
    symbol("terminal", "X3", 365, 85, 0, "Outgoing secondary S1");
    symbol("terminal", "X4", 365, 125, 0, "Outgoing secondary S2");
    wire("X1", "1", "F1", "1");
    wire("F1", "2", "T1", "P1");
    wire("X2", "1", "F2", "1", "#2563eb");
    wire("F2", "2", "T1", "P2", "#2563eb");
    wire("T1", "S1", "Q1", "1");
    wire("Q1", "2", "X3", "1");
    wire("T1", "S2", "X4", "1", "#2563eb");
    note(
      "No transformer ratio, fault current, protection setting or medium-voltage rating is specified.",
      20,
      175,
    );
    note(
      "Separate winding terminals do not imply galvanic continuity or a solved network.",
      20,
      185,
    );
    pageId = page("02 · Secondary protection documentation");
    note(
      "PROTECTION AND METERING · interfaces for engineering completion",
      20,
      22,
    );
    symbol("terminal", "X5", 35, 75, 0, "Auxiliary supply positive");
    symbol("fuse", "F3", 95, 75);
    symbol("protection-relay-trip", "P1", 190, 105);
    symbol(
      "coil",
      "Y1",
      310,
      119,
      0,
      "Trip actuator interface; no certified safety function",
    );
    symbol("terminal", "X6", 365, 155, 0, "Auxiliary supply common");
    symbol("terminal", "X7", 80, 145, 0, "Measurement I+ interface");
    symbol("terminal", "X8", 80, 190, 0, "Measurement I- interface");
    wire("X5", "1", "F3", "1");
    wire("F3", "2", "P1", "supply");
    wire("X5", "1", "P1", "trip_common");
    wire("P1", "trip_NO", "Y1", "A1");
    wire("Y1", "A2", "X6", "1", "#2563eb");
    wire("P1", "common", "X6", "1", "#2563eb");
    wire("X7", "1", "P1", "I_plus");
    wire("X8", "1", "P1", "I_minus");
    note(
      "External measurement, auxiliary supply and trip actuator selection remain design inputs.",
      20,
      230,
    );
    cabinet(["P1", "F3", "Y1", "X5", "X6", "X7", "X8"]);
  } else if (id === "photovoltaic") {
    note(
      "ORIGINAL EDUCATIONAL PV SYSTEM · single-phase conversion topology only",
      20,
      22,
    );
    note("DC string interface", 35, 48);
    note("Conversion interface", 190, 48);
    note("AC output interface", 310, 48);
    symbol("terminal", "X1", 35, 85, 0, "PV string positive interface");
    symbol("terminal", "X2", 35, 135, 0, "PV string negative interface");
    symbol(
      "fuse",
      "F1",
      95,
      85,
      0,
      "DC overcurrent protection interface; rating unspecified",
    );
    symbol("contact", "S1", 155, 85, 0, "DC isolator interface");
    symbol(
      "dc-ac-inverter",
      "INV1",
      235,
      110,
      0,
      "Single-phase inverter interface; operating limits unspecified",
    );
    symbol("contact", "Q1", 315, 85, 0, "AC output isolator interface");
    symbol("terminal", "X3", 375, 85, 0, "AC line output interface");
    symbol("terminal", "X4", 375, 125, 0, "AC neutral output interface");
    symbol("terminal", "X5", 235, 180, 0, "Protective earth interface");
    wire("X1", "1", "F1", "1");
    wire("F1", "2", "S1", "1");
    wire("S1", "2", "INV1", "DC_positive");
    wire("X2", "1", "INV1", "DC_negative", "#2563eb");
    wire("INV1", "L_out", "Q1", "1");
    wire("Q1", "2", "X3", "1");
    wire("INV1", "N_out", "X4", "1", "#2563eb");
    wire("INV1", "PE", "X5", "1", "#16803d");
    note(
      "Module count, Voc, Isc, temperature range and series limits are not specified.",
      20,
      220,
    );
    note(
      "Grid protection, anti-islanding, earthing and local-code requirements remain design inputs.",
      20,
      232,
    );
    pageId = page("02 · External connection inputs");
    note("PV STRING AND GRID CONNECTION INPUTS", 20, 22);
    note(
      "Confirm the selected module and inverter documentation before sizing or protection coordination.",
      20,
      44,
    );
    note(
      "This topology contains no equipment ratings, manufacturer claims or compliance assessment.",
      20,
      56,
    );
    cabinet(
      ["INV1", "F1", "S1", "Q1", "X1", "X2", "X3", "X4", "X5"],
      "Generic educational PV conversion enclosure",
    );
  } else if (id === "motor") {
    note(
      "THREE-PHASE MOTOR · maintained run control, without a seal-in circuit",
      20,
      22,
    );
    symbol("isolator-three-pole-pe", "Q1", 70, 95);
    symbol("contactor-three-pole", "K1", 190, 95);
    symbol("three-phase-motor", "M1", 325, 95);
    for (const [phase, winding] of [
      [1, "U"],
      [2, "V"],
      [3, "W"],
    ] as const) {
      wire("Q1", `L${phase}_out`, "K1", `L${phase}_in`);
      wire("K1", `L${phase}_out`, "M1", winding);
    }
    wire("Q1", "PE_out", "M1", "PE", "#16803d");
    symbol("terminal", "X1", 35, 200, 0, "Control supply interface");
    symbol("nc-contact", "S0", 100, 200, 0, "Normally closed stop contact");
    symbol("contact", "S1", 185, 200, 0, "Maintained run switch");
    symbol("terminal", "X2", 365, 200, 0, "Control return interface");
    wire("X1", "1", "S0", "11");
    wire("S0", "12", "S1", "1");
    wire("S1", "2", "K1", "A1");
    wire("K1", "A2", "X2", "1", "#2563eb");
    note(
      "Overload/short-circuit protection selection and operational verification remain required.",
      20,
      245,
    );
    cabinet(["Q1", "K1", "S0", "S1", "X1", "X2"]);
  } else if (id === "building") {
    p = addBuilding(p, "Educational dwelling", "Original floor plan");
    p = addFloor(p, p.buildings[0].id, "Ground floor", 0, 2800);
    const floorId = p.floors[0].id;
    p = addRectangularRoom(p, floorId, "Living room", 0, 0, 5000, 4000);
    p = addRectangularRoom(p, floorId, "Study", 5000, 0, 3500, 4000);
    p = addPlanLayer(p, floorId, "Architecture", "architectural");
    const architecture = p.architecturalLayers.at(-1)!.id;
    for (const [a, b] of [
      [
        { x: 0, y: 0 },
        { x: 8500, y: 0 },
      ],
      [
        { x: 8500, y: 0 },
        { x: 8500, y: 4000 },
      ],
      [
        { x: 8500, y: 4000 },
        { x: 0, y: 4000 },
      ],
      [
        { x: 0, y: 4000 },
        { x: 0, y: 0 },
      ],
      [
        { x: 5000, y: 0 },
        { x: 5000, y: 4000 },
      ],
    ] as const)
      p = addWall(p, architecture, "Wall", a, b, 150, 2800);
    p = addPlanLayer(p, floorId, "Electrical installation", "electrical");
    const layerId = p.architecturalLayers.at(-1)!.id;
    function floorDevice(
      kind: FloorDeviceKind,
      reference: string,
      x: number,
      y: number,
      room = 0,
    ) {
      p = createFloorDevice(
        p,
        {
          kind,
          reference,
          description: reference,
          pageId,
          floorId,
          layerId,
          roomId: p.rooms[room].id,
          position: { x, y },
          rotation: 0,
          symbolScale: 20,
          mountingHeightMm: kind === "luminaire-l-n-pe" ? 2500 : 400,
        },
        50,
      );
      return p.devices.at(-1)!.id;
    }
    const board = floorDevice("distribution-board-l-n-pe", "DB1", 500, 3500);
    const light1 = floorDevice("luminaire-l-n-pe", "EL1", 2500, 1800);
    const light2 = floorDevice("luminaire-l-n-pe", "EL2", 6700, 1800, 1);
    const socket1 = floorDevice("socket-l-n-pe", "SO1", 500, 600);
    const socket2 = floorDevice("socket-l-n-pe", "SO2", 8000, 600, 1);
    floorDevice("wall-switch-single-pole", "SW1", 4300, 3500);
    p = saveDistributionBoard(p, {
      name: "Ground floor board",
      floorId,
      deviceId: board,
    });
    for (const [name, deviceIds, watts] of [
      ["C1 · Lighting", [light1, light2], 12],
      ["C2 · Socket allowances", [socket1, socket2], 300],
    ] as const) {
      p = savePlanCircuit(p, {
        name,
        floorId,
        layerId,
        boardId: p.distributionBoards[0].id,
        deviceIds: [...deviceIds],
        voltageV: 230,
        phases: 1,
        loads: deviceIds.map((deviceId) => ({ deviceId, activePowerW: watts })),
      });
    }
    note(
      "Room circuits and loads are educational assumptions: 2 x 12 W lighting; 2 x 300 W socket allowances.",
      20,
      235,
    );
    note(
      "Circuit assignment does not create physical L/N/PE wiring. Select protection and cables separately.",
      20,
      245,
    );
  } else {
    note(
      "PLC CONTROL CABINET · explicit native I/O documentation, no executable PLC program",
      20,
      22,
    );
    for (const [kind, reference] of [
      ["cpu", "PLC1"],
      ["digital-input", "DI1"],
      ["digital-output", "DO1"],
    ] as const)
      p = createPlcModule(p, {
        kind,
        pageId,
        reference,
        name: `${reference} · generic ${kind}`,
      });
    const sensor = symbol("contact", "S1", 70, 200, 0, "Field limit switch");
    symbol("lamp", "H1", 285, 200, 0, "Field status indicator");
    const input = p.plcModules.find(
      (module) => module.moduleKind === "digital-input",
    )!;
    const inputTerminal = p.terminals.find(
      (item) => item.deviceId === input.deviceId && item.kind === "signal",
    )!;
    p = savePlcAddress(p, {
      id: crypto.randomUUID(),
      name: "Limit switch input",
      moduleId: input.id,
      channel: 0,
      address: "%IX0.0",
      dataType: "BOOL",
      terminalIds: [inputTerminal.id],
      signalDeviceId: sensor,
    });
    const output = p.plcModules.find(
      (module) => module.moduleKind === "digital-output",
    )!;
    const outputTerminal = p.terminals.find(
      (item) => item.deviceId === output.deviceId && item.kind === "signal",
    )!;
    p = savePlcAddress(p, {
      id: crypto.randomUUID(),
      name: "Status indication",
      moduleId: output.id,
      channel: 0,
      address: "%QX0.0",
      dataType: "BOOL",
      terminalIds: [outputTerminal.id],
      signalDeviceId: p.devices.find((device) => device.reference === "H1")!.id,
    });
    symbol(
      "terminal",
      "X24",
      35,
      140,
      0,
      "External control supply interface; voltage unspecified",
    );
    symbol("terminal", "X0", 365, 140, 0, "External control common interface");
    for (const reference of ["PLC1", "DI1", "DO1"]) {
      wire("X24", "1", reference, "supply");
      wire("X0", "1", reference, "common", "#2563eb");
    }
    wire("X24", "1", "S1", "1");
    wire("S1", "2", "DI1", "IN0");
    wire("DO1", "OUT0", "H1", "1");
    wire("H1", "2", "X0", "1", "#2563eb");
    note(
      "Channel 0 supply/signal/return wiring is explicit. Unused channels stay open; no PLC program is executed.",
      20,
      245,
    );
    cabinet(["PLC1", "DI1", "DO1", "S1", "H1", "X24", "X0"]);
  }
  return synchronizeConnectivity(validateProject(p));
}
