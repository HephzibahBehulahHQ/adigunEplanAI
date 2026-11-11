import {
  createProject,
  validateProject,
  type Project,
} from "../electrical-model/project.ts";
import { synchronizeConnectivity } from "../connectivity-engine/analyze.ts";
import { installSymbol } from "../component-library/symbols.ts";
import { createCustomSymbol } from "../component-library/custom-symbols.ts";
import { assignCatalogPart } from "../component-library/catalog.ts";
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
import {
  calculate,
  calculationToRecord,
} from "../engineering-core/calculations.ts";
import { exampleCatalog } from "./catalog.ts";
import type { ExampleId } from "./catalog.ts";

export const examples = exampleCatalog;
export type { ExampleId } from "./catalog.ts";
const names: Record<ExampleId, string> = {
  "target-substation": "EES_Industry_Sample_Energy_Substation_V01",
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
    const flushMounted = deviceReferences.filter((reference) => {
      const device = p.devices.find((item) => item.reference === reference)!;
      return p.manufacturerParts
        .find((part) => part.id === device.partId)
        ?.catalogSnapshot?.mounting?.toLowerCase()
        .includes("flush");
    });
    const railMounted = deviceReferences.filter(
      (reference) => !flushMounted.includes(reference),
    );
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
      for (const [column, reference] of railMounted
        .slice(row * 4, row * 4 + 4)
        .entries()) {
        const device = p.devices.find((item) => item.reference === reference)!;
        const dimensions = p.manufacturerParts.find(
          (part) => part.id === device.partId,
        )?.catalogSnapshot?.dimensionsMm;
        p.equipment3d.push({
          id: crypto.randomUUID(),
          name: dimensions
            ? `${reference} · manufacturer catalogue dimensions`
            : `${reference} · manually dimensioned generic envelope`,
          deviceId: device.id,
          enclosureId,
          dimensionSource: dimensions ? "catalog" : "manual",
          positionMm: { x: 50 + column * 125, y: 85 + row * 205, z: 10 },
          sizeMm: dimensions
            ? {
                x: dimensions.width,
                y: dimensions.height,
                z: dimensions.depth,
              }
            : { x: 80, y: 90, z: 65 },
          mountingStructureId: railId,
          clearanceMm: 5,
        });
      }
    }
    if (flushMounted.length) {
      const doorId = crypto.randomUUID();
      p.panelStructures.push({
        id: doorId,
        name: "Enclosure door · flush-mounted devices",
        enclosureId,
        kind: "door",
        positionMm: { x: 0, y: 0, z: 248 },
        sizeMm: { x: 600, y: 800, z: 2 },
      });
      for (const [column, reference] of flushMounted.entries()) {
        const device = p.devices.find((item) => item.reference === reference)!;
        const dimensions = p.manufacturerParts.find(
          (part) => part.id === device.partId,
        )?.catalogSnapshot?.dimensionsMm;
        if (!dimensions)
          throw new Error(
            `Flush-mounted device ${reference} has no sourced dimensions`,
          );
        p.equipment3d.push({
          id: crypto.randomUUID(),
          name: `${reference} · catalogue-dimensioned flush mounting`,
          deviceId: device.id,
          enclosureId,
          dimensionSource: "catalog",
          positionMm: {
            x: 50 + column * (dimensions.width + 25),
            y: 100,
            z: 248 - dimensions.depth,
          },
          sizeMm: {
            x: dimensions.width,
            y: dimensions.height,
            z: dimensions.depth,
          },
          mountingStructureId: doorId,
          clearanceMm: 5,
        });
      }
    }
  }
  if (id === "substation" || id === "target-substation") {
    if (id === "substation") {
      note(
        "ORIGINAL TRANSFORMER STATION · single-phase equivalent documentation",
        20,
        22,
      );
      note("Primary interfaces", 30, 51);
      note("Transformer", 165, 51);
      note("Secondary interfaces", 300, 51);
      note("P1 · Incoming", 23, 78);
      note("P2 · Incoming", 23, 168);
      note("S1 · Outgoing", 352, 78);
      note("S2 · Outgoing", 352, 168);
      symbol("terminal", "X1", 35, 95, 0, "Incoming primary interface P1");
      symbol("terminal", "X2", 35, 185, 0, "Incoming primary interface P2");
      symbol(
        "fuse",
        "F1",
        95,
        95,
        0,
        "Primary protection interface; rating unspecified",
      );
      symbol(
        "fuse",
        "F2",
        95,
        185,
        0,
        "Primary protection interface; rating unspecified",
      );
      symbol(
        "transformer-two-winding",
        "T1",
        190,
        140,
        0,
        "Two-winding transformer; single-phase equivalent",
      );
      symbol("contact", "Q1", 285, 95, 0, "Secondary isolation interface");
      symbol("terminal", "X3", 365, 95, 0, "Outgoing secondary S1");
      symbol("terminal", "X4", 365, 185, 0, "Outgoing secondary S2");
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
        225,
      );
      note(
        "Separate winding terminals do not imply galvanic continuity or a solved network.",
        20,
        237,
      );
      pageId = page("02 · Secondary protection documentation");
    } else {
      note(
        "INDUSTRY ENERGY SUBSTATION · three-phase interface drawing",
        20,
        22,
      );
      note("20 kV incoming supply", 22, 48);
      note("Q0 · incoming isolation", 60, 48);
      note("Primary protection interfaces", 120, 48);
      note("T01 · 630 kVA · 20 / 0.4 kV design basis", 188, 48);
      note("Secondary switching", 270, 48);
      note("0.4 kV outgoing interfaces", 337, 48);
      const phases = [
        {
          input: "L1",
          fuse: "F1",
          primary: "H1",
          secondary: "X1",
          breakerIn: "L1_in",
          breakerOut: "L1_out",
          output: "X11",
          y: 100,
          color: "#d02030",
        },
        {
          input: "L2",
          fuse: "F2",
          primary: "H2",
          secondary: "X2",
          breakerIn: "L2_in",
          breakerOut: "L2_out",
          output: "X12",
          y: 145,
          color: "#d4a017",
        },
        {
          input: "L3",
          fuse: "F3",
          primary: "H3",
          secondary: "X3",
          breakerIn: "L3_in",
          breakerOut: "L3_out",
          output: "X13",
          y: 190,
          color: "#2563eb",
        },
      ] as const;
      for (const phase of phases) {
        note(phase.input, 22, phase.y - 10);
        symbol(
          "terminal",
          `X${phase.input.slice(-1)}`,
          35,
          phase.y,
          0,
          `Incoming ${phase.input} phase`,
        );
      }
      const incomingIsolatorDefinitionId = crypto.randomUUID();
      p = createCustomSymbol(p, {
        id: incomingIsolatorDefinitionId,
        name: "Three-phase incoming isolation interface",
        category: "custom",
        glyph: "box",
        widthMm: 32,
        heightMm: 108,
        pins: phases.flatMap((phase) => {
          const offset = phase.y - 145;
          return [
            { id: `${phase.input}_in`, position: { x: -16, y: offset } },
            { id: `${phase.input}_out`, position: { x: 16, y: offset } },
          ];
        }),
        artwork: phases.flatMap((phase) => {
          const offset = phase.y - 145;
          return [
            {
              kind: "line" as const,
              from: { x: -16, y: offset },
              to: { x: -6, y: offset },
            },
            {
              kind: "circle" as const,
              center: { x: -6, y: offset },
              radiusMm: 1,
            },
            {
              kind: "line" as const,
              from: { x: -6, y: offset },
              to: { x: 5, y: offset - 6 },
            },
            {
              kind: "circle" as const,
              center: { x: 7, y: offset },
              radiusMm: 1,
            },
            {
              kind: "line" as const,
              from: { x: 7, y: offset },
              to: { x: 16, y: offset },
            },
          ];
        }),
      });
      const incomingIsolatorInstanceId = place(
        p,
        pageId,
        p.layers.find((layer) => layer.pageId === pageId)!.id,
        "custom",
        { x: 80, y: 145 },
        0,
        incomingIsolatorDefinitionId,
      );
      const incomingIsolatorInstance = p.symbolInstances.find(
        (item) => item.id === incomingIsolatorInstanceId,
      )!;
      const incomingIsolator = p.devices.find(
        (item) => item.id === incomingIsolatorInstance.deviceId,
      )!;
      incomingIsolator.reference = "Q0";
      incomingIsolator.name =
        "Three-phase incoming isolation interface; rating unspecified";
      incomingIsolatorInstance.name = "Q0";
      for (const phase of phases) {
        symbol(
          "fuse",
          phase.fuse,
          145,
          phase.y,
          0,
          `${phase.input} phase protection interface; rating unspecified`,
        );
      }
      const transformerDefinitionId = crypto.randomUUID();
      p = createCustomSymbol(p, {
        id: transformerDefinitionId,
        name: "Three-phase transformer interface",
        category: "custom",
        glyph: "box",
        widthMm: 64,
        heightMm: 76,
        pins: [
          { id: "H1", position: { x: -32, y: -24 }, kind: "power" },
          { id: "H2", position: { x: -32, y: 0 }, kind: "power" },
          { id: "H3", position: { x: -32, y: 24 }, kind: "power" },
          { id: "X1", position: { x: 32, y: -24 }, kind: "power" },
          { id: "X2", position: { x: 32, y: 0 }, kind: "power" },
          { id: "X3", position: { x: 32, y: 24 }, kind: "power" },
        ],
        artwork: [
          ...phases.flatMap((_, index) => {
            const offset = (index - 1) * 24;
            return [
              {
                kind: "line" as const,
                from: { x: -32, y: offset },
                to: { x: -17, y: offset },
              },
              {
                kind: "circle" as const,
                center: { x: -9, y: offset },
                radiusMm: 7.5,
              },
              {
                kind: "circle" as const,
                center: { x: 9, y: offset },
                radiusMm: 7.5,
              },
              {
                kind: "line" as const,
                from: { x: 17, y: offset },
                to: { x: 32, y: offset },
              },
            ];
          }),
          {
            kind: "line",
            from: { x: -1.5, y: -34 },
            to: { x: -1.5, y: 34 },
          },
          {
            kind: "line",
            from: { x: 1.5, y: -34 },
            to: { x: 1.5, y: 34 },
          },
        ],
      });
      const transformerInstanceId = place(
        p,
        pageId,
        p.layers.find((layer) => layer.pageId === pageId)!.id,
        "custom",
        { x: 190, y: 145 },
        0,
        transformerDefinitionId,
      );
      const transformerInstance = p.symbolInstances.find(
        (item) => item.id === transformerInstanceId,
      )!;
      const transformerDevice = p.devices.find(
        (item) => item.id === transformerInstance.deviceId,
      )!;
      transformerDevice.reference = "T01";
      transformerDevice.name =
        "Three-phase transformer · scenario design basis 630 kVA, 20 / 0.4 kV";
      transformerInstance.name = "T01";
      symbol(
        "isolator-three-pole-pe",
        "Q1",
        300,
        145,
        0,
        "Three-pole secondary isolation interface; device rating unspecified",
      );
      for (const phase of phases) {
        symbol(
          "terminal",
          phase.output,
          380,
          phase.y,
          0,
          `Outgoing ${phase.input} phase interface`,
        );
        const phaseIndex = phase.input.slice(-1);
        wire(`X${phaseIndex}`, "1", "Q0", `L${phaseIndex}_in`, phase.color);
        wire("Q0", `L${phaseIndex}_out`, phase.fuse, "1", phase.color);
        wire(phase.fuse, "2", "T01", phase.primary, phase.color);
        wire("T01", phase.secondary, "Q1", phase.breakerIn, phase.color);
        wire("Q1", phase.breakerOut, phase.output, "1", phase.color);
      }
      symbol(
        "ground",
        "PE1",
        300,
        220,
        0,
        "Protective earth system interface; earthing arrangement unspecified",
      );
      wire("Q1", "PE_out", "PE1", "PE", "#16803d");
      note(
        "The 20 / 0.4 kV ratio and 630 kVA rating are scenario design inputs. Transformer vector group, earthing, protection settings, fault level and cable sizing are not specified.",
        20,
        235,
      );
      note(
        "Q0 is an incoming isolation interface only; switchgear selection, ratings and operating sequence remain design inputs.",
        20,
        247,
      );
      pageId = page("02 · Secondary protection documentation");
    }
    note(
      "PROTECTION AND METERING · interfaces for engineering completion",
      20,
      22,
    );
    note("Auxiliary supply", 23, 54);
    note("Protection relay", 165, 54);
    note("Trip actuator", 292, 96);
    note("Measurement interfaces", 23, 123);
    note("I+", 66, 143);
    note("I−", 66, 188);
    note("Auxiliary common", 340, 175);
    symbol("terminal", "X5", 35, 75, 0, "Auxiliary supply positive");
    const auxiliaryFuseReference = id === "target-substation" ? "F4" : "F3";
    symbol("fuse", auxiliaryFuseReference, 95, 75);
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
    wire("X5", "1", auxiliaryFuseReference, "1");
    wire(auxiliaryFuseReference, "2", "P1", "supply");
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
    if (id === "substation")
      cabinet(["P1", "F3", "Y1", "X5", "X6", "X7", "X8"]);
    if (id === "target-substation") {
      const relay = p.devices.find((device) => device.reference === "P1")!;
      const relayPartId = crypto.randomUUID();
      p.manufacturerParts.push({
        id: relayPartId,
        name: "SIPROTEC 5 7SJ82 standard variant",
        manufacturer: "Siemens",
        partNumber: "P1J122728",
        sourceUrl:
          "https://mall.industry.siemens.com/mall/en/de/Catalog/Product/P1J122728",
        ratings: {
          binaryInputs: 11,
          binaryOutputs: 9,
          currentInputs: 4,
          voltageInputs: 4,
          auxiliarySupplyMinV: 24,
          auxiliarySupplyMaxV: 48,
          auxiliarySupplyType: "DC",
        },
        catalogSnapshot: {
          catalogId: "siemens-p1j122728",
          reviewedOn: "2026-11-10",
          category: "protection",
          description:
            "SIPROTEC 7SJ82 overcurrent protection; standard variant",
          mapping: {
            glyph: "component",
            symbolId: "library-protection-relay-trip",
            electricalNodes: 7,
            connections: 7,
          },
          dimensionsMm: { width: 150, height: 266, depth: 163 },
          dimensionsSourceUrl:
            "https://cache.industry.siemens.com/dl/files/321/109742321/att_1163588/v1/SIP5_Operating_V09.70_Manual_C003-M_enUS.pdf",
          sourceRevision:
            "SIPROTEC 5 Operation Manual C53000-G5040-C003-M, Edition 12.2023, Fig 3-13",
          mounting: "Flush mounting; 1/3 × 19 in housing width",
        },
      });
      relay.partId = relayPartId;

      pageId = page("03 · Control and communications");
      note(
        "CONTROL SYSTEM · the internal modular I/O bus is not drawn; field-terminal pinout and PLC execution are not represented",
        20,
        22,
      );
      note(
        "Three-phase design basis: 20 kV line-to-line, 630 kVA transformer, 0.95 power factor",
        20,
        42,
      );
      note(
        "The 18.19 A primary current is calculated from the stated three-phase design basis. This example is not a protection-coordination or compliance assessment.",
        20,
        54,
      );
      const cpuModule = createPlcModule(p, {
        kind: "cpu",
        symbolId: "modular-controller-interface",
        pageId,
        reference: "PLC1",
        name: "WAGO PFC200 controller · generic modular bus interface",
      });
      p = cpuModule;
      const cpu = p.devices.find((device) => device.reference === "PLC1")!;
      const cpuPartId = crypto.randomUUID();
      p.manufacturerParts.push({
        id: cpuPartId,
        name: "PFC200 Controller, 2 ETH RS, 4G",
        manufacturer: "WAGO",
        partNumber: "750-8217",
        sourceUrl:
          "https://www.wago.com/us/controllers-bus-couplers-i-o/controller-pfc200/p/750-8217",
        ratings: {},
      });
      cpu.partId = cpuPartId;
      const inputModule = createPlcModule(p, {
        kind: "digital-input",
        channelCount: 16,
        pageId,
        reference: "DI1",
        name: "WAGO 750-1405 · 16-channel digital input",
      });
      p = inputModule;
      const inputDevice = p.devices.find(
        (device) => device.reference === "DI1",
      )!;
      p = assignCatalogPart(p, inputDevice.id, "wago-750-1405");
      const outputModule = createPlcModule(p, {
        kind: "digital-output",
        channelCount: 8,
        pageId,
        reference: "DO1",
        name: "WAGO 750-530 · 8-channel digital output",
      });
      p = outputModule;
      const outputDevice = p.devices.find(
        (device) => device.reference === "DO1",
      )!;
      p = assignCatalogPart(p, outputDevice.id, "wago-750-530");
      const plcInstances = new Map(
        ["DI1", "PLC1", "DO1"].map((reference) => [
          reference,
          p.symbolInstances.find(
            (item) =>
              item.deviceId ===
              p.devices.find((device) => device.reference === reference)!.id,
          )!,
        ]),
      );
      plcInstances.get("DI1")!.position = { x: 100, y: 142 };
      plcInstances.get("PLC1")!.position = { x: 220, y: 142 };
      plcInstances.get("DO1")!.position = { x: 340, y: 142 };
      const cpuInstance = p.symbolInstances.find(
        (symbol) => symbol.deviceId === cpu.id,
      )!;
      cpuInstance.position = plcInstances.get("PLC1")!.position;
      symbol(
        "terminal",
        "X24",
        35,
        70,
        0,
        "External 24 VDC control supply input; field supply design input",
      );
      symbol("terminal", "X0", 35, 230, 0, "External control return input");
      for (const reference of ["DI1", "PLC1", "DO1"]) {
        wire("X24", "1", reference, "supply");
        wire("X0", "1", reference, "common", "#2563eb");
      }
      symbol(
        "terminal",
        "X101",
        35,
        120,
        0,
        "External 24 VDC digital input channel 0",
      );
      symbol(
        "terminal",
        "X201",
        385,
        120,
        0,
        "External digital output channel 0; load not specified",
      );
      wire("X101", "1", "DI1", "IN0", "#2563eb");
      wire("DO1", "OUT0", "X201", "1", "#d02030");
      const diModule = p.plcModules.find(
        (module) => module.deviceId === inputDevice.id,
      )!;
      const diChannel = p.terminals.find(
        (item) =>
          item.deviceId === inputDevice.id && item.designation === "IN0",
      )!;
      p = savePlcAddress(p, {
        id: crypto.randomUUID(),
        name: "External status input",
        moduleId: diModule.id,
        channel: 0,
        address: "%IX0.0",
        dataType: "BOOL",
        terminalIds: [diChannel.id],
        signalDeviceId: p.devices.find((device) => device.reference === "X101")!
          .id,
      });
      const doModule = p.plcModules.find(
        (module) => module.deviceId === outputDevice.id,
      )!;
      const doChannel = p.terminals.find(
        (item) =>
          item.deviceId === outputDevice.id && item.designation === "OUT0",
      )!;
      p = savePlcAddress(p, {
        id: crypto.randomUUID(),
        name: "External status output",
        moduleId: doModule.id,
        channel: 0,
        address: "%QX0.0",
        dataType: "BOOL",
        terminalIds: [doChannel.id],
        signalDeviceId: p.devices.find((device) => device.reference === "X201")!
          .id,
      });

      const loadResult = calculate(
        "apparent-load-current",
        { phases: 3, voltage: 20, apparentPower: 630 },
        { phases: "1", voltage: "kV", apparentPower: "kVA" },
        [
          "Scenario basis from the supplied target interface: balanced three-phase, 20 kV line-to-line, 630 kVA. cosφ 0.95 is documented project context but is not used in this apparent-power current equation. This estimate is not a protection setting.",
        ],
      );
      p.calculations.push(
        calculationToRecord(
          loadResult,
          "target-substation-load",
          "20 kV transformer primary current estimate",
        ),
      );
      cabinet(
        ["P1", "F4", "Y1", "X5", "X6", "X7", "X8", "DI1", "PLC1", "DO1"],
        "UTST_Cabinet_01 · manually dimensioned placement envelopes",
      );
    }
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
