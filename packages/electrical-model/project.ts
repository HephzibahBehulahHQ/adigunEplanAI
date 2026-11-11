import { validateMeshGeometry } from "../panel-engineering/mesh.ts";
import { pointInPolygon } from "../engineering-core/polygon.ts";
import { transform, type Point } from "../engineering-core/geometry.ts";
import { z } from "zod";

const id = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9_.:-]+$/);
const name = z.string().trim().min(1).max(160);
const finite = z.number().finite();
const positive = finite.positive();
const point = z.object({ x: finite, y: finite }).strict();
const terminalKind = z.enum(["power", "control", "signal", "pe", "neutral"]);
const artworkShape = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("line"), from: point, to: point }).strict(),
  z
    .object({ kind: z.literal("circle"), center: point, radiusMm: positive })
    .strict(),
]);
const entity = z.object({ id, name }).strict();
export const symbolDefinitionSchema = entity.extend({
  connectionClass: z.literal("mechanical").optional(),
  category: name,
  glyph: z.enum([
    "box",
    "terminal",
    "resistor",
    "fuse",
    "contact",
    "coil",
    "lamp",
    "motor",
    "ground",
    "junction",
  ]),
  widthMm: positive,
  heightMm: positive,
  pins: z
    .array(
      z
        .object({
          id,
          position: point,
          kind: terminalKind.optional(),
          terminalGroup: id.optional(),
        })
        .strict(),
    )
    .max(256),
  artwork: z.array(artworkShape).min(1).max(256).optional(),
});
const sourceUrl = z
  .url()
  .max(2048)
  .refine(
    (value) => /^https?:\/\//.test(value),
    "Source URL must use HTTP or HTTPS",
  );
export const schemas = {
  layers: entity.extend({
    pageId: id,
    visible: z.boolean(),
    locked: z.boolean(),
  }),
  groups: entity.extend({
    pageId: id,
    symbolIds: z.array(id).min(2).max(1000),
  }),
  annotations: entity.extend({
    pageId: id,
    layerId: id,
    position: point,
    text: z.string().min(1).max(2000),
    pinId: id.optional(),
  }),
  documents: entity.extend({
    kind: z.enum(["schematic", "building", "panel", "report"]),
    outputLanguage: z.enum(["en", "de", "yo", "pcm"]),
  }),
  pages: entity.extend({
    documentId: id,
    widthMm: positive.min(32).max(2000),
    heightMm: positive.min(32).max(2000),
    order: z.number().int().nonnegative(),
    gridMm: positive.max(100).default(5),
    snapping: z.boolean().default(true),
  }),
  symbolDefinitions: symbolDefinitionSchema,
  symbolInstances: entity.extend({
    definitionId: id,
    layerId: id,
    mirrored: z.boolean(),
    deviceId: id,
    pageId: id,
    position: point,
    rotation: z.union([
      z.literal(0),
      z.literal(90),
      z.literal(180),
      z.literal(270),
    ]),
  }),
  devices: entity.extend({ reference: name, partId: id.optional() }),
  manufacturerParts: entity
    .extend({
      manufacturer: name,
      partNumber: name,
      sourceUrl: sourceUrl.optional(),
      ratings: z
        .record(
          z.string().min(1).max(80),
          z.union([z.string().max(2000), finite]),
        )
        .refine((value) => Object.keys(value).length <= 128),
      catalogSnapshot: z
        .object({
          catalogId: id,
          reviewedOn: z.iso.date(),
          category: name,
          description: z.string().trim().min(1).max(2000),
          mapping: z
            .object({
              glyph: z.enum(["terminal", "contact", "component"]),
              electricalNodes: z.number().int().min(1).max(256),
              connections: z.number().int().min(1).max(1000),
              symbolId: name.optional(),
            })
            .strict()
            .superRefine((mapping, ctx) => {
              if ((mapping.glyph === "component") !== Boolean(mapping.symbolId))
                ctx.addIssue({
                  code: "custom",
                  message: "Component mapping requires an exact symbol ID",
                  path: ["symbolId"],
                });
            }),
          dimensionsMm: z
            .object({
              width: positive.max(100000),
              height: positive.max(100000),
              depth: positive.max(100000),
            })
            .strict()
            .optional(),
          dimensionsSourceUrl: sourceUrl.optional(),
          mountedDepthsMm: z
            .array(
              z.object({ rail: name, depth: positive.max(100000) }).strict(),
            )
            .min(1)
            .max(32)
            .optional(),
          terminalMarkings: z.array(name).min(1).max(256).optional(),
          mounting: z.string().trim().min(1).max(2000).optional(),
          frontPanel: z
            .object({
              statusIndicators: z.number().int().min(0).max(256).optional(),
              display: z.enum(["large", "standard"]).optional(),
            })
            .strict()
            .optional(),
          sourceRevision: name.optional(),
        })
        .strict()
        .optional(),
      custom: z
        .object({
          componentId: id,
          revision: z.number().int().positive().max(1000000),
          provenance: z.literal("user-supplied"),
          verification: z.literal("unverified"),
          licensing: z.enum(["user-owned", "authorized", "unknown"]),
          category: name,
          description: z.string().trim().min(1).max(2000),
          sourceRevision: z.string().trim().min(1).max(160).optional(),
          mounting: z.string().trim().min(1).max(2000).optional(),
          terminalInformation: z.string().trim().min(1).max(2000).optional(),
          dimensionsMm: z
            .object({
              width: positive.max(100000),
              height: positive.max(100000),
              depth: positive.max(100000),
            })
            .strict()
            .optional(),
          symbolDefinition: symbolDefinitionSchema,
        })
        .strict()
        .optional(),
    })
    .superRefine((part, ctx) => {
      if (part.custom && part.catalogSnapshot)
        ctx.addIssue({
          code: "custom",
          message: "Custom data cannot carry a catalog snapshot",
        });
      if (part.custom)
        for (const field of [
          "nominalVoltageV",
          "nominalCurrentA",
          "ratedCrossSectionMm2",
        ]) {
          const value = part.ratings[field];
          if (
            value !== undefined &&
            (typeof value !== "number" ||
              value < 0 ||
              (field === "ratedCrossSectionMm2" && value === 0))
          )
            ctx.addIssue({
              code: "custom",
              message:
                "Custom rating requires a valid numeric value in the declared unit",
              path: ["ratings", field],
            });
        }
      if (!part.custom && !part.sourceUrl)
        ctx.addIssue({
          code: "custom",
          message: "Manufacturer source URL required",
        });
    }),
  terminals: entity.extend({
    deviceId: id,
    designation: name,
    capacity: z.number().int().min(1).max(1000).optional(),
    required: z.boolean().optional(),
    kind: terminalKind,
  }),
  pins: entity.extend({
    terminalId: id,
    symbolInstanceId: id,
    definitionPinId: id,
  }),
  wires: entity.extend({
    color: z
      .string()
      .regex(/^#[0-9a-f]{6}$/i)
      .optional(),
    physicalLengthM: positive.optional(),
    fromPinId: id,
    toPinId: id,
    conductorId: id.optional(),
  }),
  wirePaths: z
    .object({
      routingMode: z.enum(["auto", "manual"]).optional(),
      layerId: id,
      id,
      wireId: id,
      pageId: id,
      points: z.array(point).min(2).max(10000),
    })
    .strict(),
  nets: entity.extend({
    wireIds: z.array(id).max(10000),
    pinIds: z.array(id).max(20000).optional(),
    terminalIds: z.array(id).max(20000).optional(),
    labels: z.array(z.string().max(2000)).max(1000).optional(),
  }),
  cables: entity.extend({
    conductorIds: z.array(id).min(1).max(256),
    shielded: z.boolean().optional(),
    shieldBondTerminalIds: z.array(id).max(256).optional(),
    lengthM: positive.optional(),
  }),
  conductors: entity.extend({
    crossSectionMm2: positive,
    material: z.enum(["copper", "aluminium"]),
    color: name,
  }),
  connectionPoints: entity.extend({ terminalIds: z.array(id).min(1).max(256) }),
  terminalStrips: entity.extend({ terminalIds: z.array(id).min(1).max(2048) }),
  plcModules: entity.extend({
    deviceId: id,
    channelCount: z.number().int().min(1).max(4096),
    moduleKind: z
      .enum([
        "cpu",
        "digital-input",
        "digital-output",
        "analog-input",
        "analog-output",
        "communication",
      ])
      .optional(),
  }),
  plcAddresses: entity.extend({
    moduleId: id,
    channel: z.number().int().nonnegative(),
    address: name,
    dataType: z.enum(["BOOL", "INT", "REAL", "TIME"]),
    terminalIds: z.array(id).max(32).optional(),
    signalDeviceId: id.optional(),
  }),
  automationNotes: entity.extend({
    kind: z.enum([
      "interlock",
      "emergency-stop",
      "motor-control",
      "sequence",
      "safety",
    ]),
    deviceIds: z.array(id).min(1).max(1000),
    description: z.string().trim().min(1).max(4000),
  }),
  enclosures: entity.extend({
    widthMm: positive.max(1e6),
    heightMm: positive.max(1e6),
    depthMm: positive.max(1e6),
    features: z
      .array(
        entity.extend({
          kind: z.enum(["mounting-hole", "cable-entry"]),
          face: z.enum(["back", "front", "left", "right", "top", "bottom"]),
          shape: z.enum(["circle", "rectangle"]),
          positionMm: z
            .object({ x: finite.min(0).max(1e6), y: finite.min(0).max(1e6) })
            .strict(),
          widthMm: positive.max(1e6),
          heightMm: positive.max(1e6),
        }),
      )
      .max(10000)
      .optional(),
    thermal: z
      .object({
        ambientC: finite.min(-273.15).max(1000),
        heatTransferCoefficientWm2K: positive.min(1e-9).max(1e6),
        exposedAreaM2: positive.min(1e-9).max(1e12),
        additionalLossW: finite.min(0).max(1e12),
        coolingW: finite.min(0).max(1e12),
      })
      .strict()
      .optional(),
  }),
  panelMeshes: entity.extend({
    vertices: z
      .array(
        z.tuple([
          finite.min(0).max(1e6),
          finite.min(0).max(1e6),
          finite.min(0).max(1e6),
        ]),
      )
      .min(4)
      .max(60000),
    triangles: z
      .array(
        z.tuple([
          z.number().int().min(0).max(59999),
          z.number().int().min(0).max(59999),
          z.number().int().min(0).max(59999),
        ]),
      )
      .min(1)
      .max(20000),
    source: z
      .object({
        filename: z.string().min(1).max(255),
        reference: z.string().min(1).max(2000),
        license: z.string().min(1).max(1000),
        sha256: z.string().regex(/^[a-f0-9]{64}$/),
        encoding: z.enum(["ascii-stl", "binary-stl"]),
        units: z.enum(["mm", "cm", "m", "in"]),
        axes: z.enum(["panel", "z-up"]),
        attributesIgnored: z.boolean(),
      })
      .strict(),
  }),
  equipment3d: entity.extend({
    deviceId: id,
    enclosureId: id,
    positionMm: z
      .object({
        x: finite.min(-1e6).max(1e6),
        y: finite.min(-1e6).max(1e6),
        z: finite.min(-1e6).max(1e6),
      })
      .strict(),
    sizeMm: z
      .object({
        x: positive.max(1e6),
        y: positive.max(1e6),
        z: positive.max(1e6),
      })
      .strict(),
    rotationDeg: z
      .union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)])
      .optional(),
    clearanceMm: finite.min(0).max(1e6).optional(),
    dimensionSource: z.enum(["manual", "catalog", "custom", "mesh"]).optional(),
    meshId: id.optional(),
    lossPowerW: finite.min(0).max(1e12).optional(),
    mountingStructureId: id.optional(),
    requiredMountingProfile: name.optional(),
    accessDirection: z
      .enum(["front", "back", "left", "right", "top", "bottom"])
      .optional(),
    accessClearanceMm: positive.max(1e6).optional(),
  }),
  panelStructures: entity.extend({
    enclosureId: id,
    kind: z.enum(["plate", "din-rail", "duct", "door", "compartment"]),
    mountingProfile: name.optional(),
    positionMm: z
      .object({
        x: finite.min(-1e6).max(1e6),
        y: finite.min(-1e6).max(1e6),
        z: finite.min(-1e6).max(1e6),
      })
      .strict(),
    sizeMm: z
      .object({
        x: positive.max(1e6),
        y: positive.max(1e6),
        z: positive.max(1e6),
      })
      .strict(),
    cableDiametersMm: z.array(positive.max(1e6)).max(10000).optional(),
    usableCrossSectionMm2: positive.min(1e-9).max(1e12).optional(),
    maximumFillPercent: positive.max(100).optional(),
    rotationDeg: z
      .union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)])
      .optional(),
  }),
  buildings: entity.extend({ address: z.string().max(500) }),
  floors: entity.extend({
    buildingId: id,
    elevationMm: finite,
    heightMm: positive,
    drawingScale: finite.min(1).max(10000),
  }),
  architecturalLayers: entity.extend({
    floorId: id,
    kind: z.enum(["architectural", "electrical"]),
    visible: z.boolean(),
    locked: z.boolean(),
  }),
  walls: entity
    .extend({
      floorId: id,
      layerId: id,
      start: point,
      end: point,
      thicknessMm: positive.max(10000),
      heightMm: positive.max(100000),
    })
    .superRefine((wall, ctx) => {
      if (wall.start.x === wall.end.x && wall.start.y === wall.end.y)
        ctx.addIssue({
          code: "custom",
          message: "Wall must have nonzero length",
        });
      if (
        [wall.start.x, wall.start.y, wall.end.x, wall.end.y].some(
          (v) => Math.abs(v) > 1000000,
        )
      )
        ctx.addIssue({
          code: "custom",
          message: "Wall coordinate exceeds plan bounds",
        });
    }),
  planGeometry: entity
    .extend({
      floorId: id,
      layerId: id,
      points: z.array(point).min(2).max(10000),
      closed: z.boolean(),
      sourceFile: z.string().min(1).max(160),
      sourceElement: z.string().max(160),
      mmPerUnit: positive,
    })
    .superRefine((shape, ctx) => {
      if (
        shape.points.some(
          (p) => Math.abs(p.x) > 1000000 || Math.abs(p.y) > 1000000,
        )
      )
        ctx.addIssue({
          code: "custom",
          message: "Plan geometry exceeds bounds",
        });
      if (shape.closed && shape.points.length < 3)
        ctx.addIssue({
          code: "custom",
          message: "Closed geometry needs three points",
        });
    }),
  wallOpenings: entity.extend({
    wallId: id,
    kind: z.enum(["door", "window"]),
    offsetMm: finite.nonnegative(),
    widthMm: positive,
    heightMm: positive,
    sillMm: finite.nonnegative(),
    hinge: z.enum(["start", "end"]),
    swing: z.enum(["left", "right"]),
  }),
  planEquipment: entity.extend({
    floorId: id,
    layerId: id,
    roomId: id.optional(),
    symbolInstanceId: id,
    position: z
      .object({
        x: finite.min(-1000000).max(1000000),
        y: finite.min(-1000000).max(1000000),
      })
      .strict(),
    rotation: z.union([
      z.literal(0),
      z.literal(90),
      z.literal(180),
      z.literal(270),
    ]),
    symbolScale: finite.min(0.1).max(1000),
    mountingHeightMm: finite.min(0).max(1000000).optional(),
  }),
  planRoutes: entity
    .extend({
      floorId: id,
      layerId: id,
      kind: z.enum(["cable", "conduit", "tray"]),
      points: z.array(point).min(2).max(10000),
      circuitId: id.optional(),
    })
    .superRefine((route, ctx) => {
      if (
        route.points.some(
          (p) => Math.abs(p.x) > 1000000 || Math.abs(p.y) > 1000000,
        )
      )
        ctx.addIssue({ code: "custom", message: "Plan route exceeds bounds" });
      if (
        route.points.some(
          (p, i) =>
            i > 0 &&
            p.x === route.points[i - 1].x &&
            p.y === route.points[i - 1].y,
        )
      )
        ctx.addIssue({
          code: "custom",
          message: "Plan route segments must have nonzero length",
        });
    }),
  planZones: entity.extend({
    floorId: id,
    kind: z.enum(["electrical", "distribution"]),
    roomIds: z.array(id).min(1).max(10000),
    boardId: id.optional(),
  }),
  planRisers: entity.extend({
    kind: z.enum(["cable", "conduit", "tray"]),
    position: z
      .object({
        x: finite.min(-1000000).max(1000000),
        y: finite.min(-1000000).max(1000000),
      })
      .strict(),
    start: z
      .object({
        floorId: id,
        layerId: id,
        heightMm: finite.min(0).max(1000000),
      })
      .strict(),
    end: z
      .object({
        floorId: id,
        layerId: id,
        heightMm: finite.min(0).max(1000000),
      })
      .strict(),
  }),
  rooms: entity.extend({
    floorId: id,
    boundary: z.array(point).min(3).max(10000),
  }),
  circuits: entity.extend({
    boardId: id,
    deviceIds: z.array(id).max(10000),
    voltageV: positive,
    phases: z.union([z.literal(1), z.literal(3)]),
    floorId: id.optional(),
    layerId: id.optional(),
    loads: z
      .array(
        z
          .object({ deviceId: id, activePowerW: finite.min(0).max(1e12) })
          .strict(),
      )
      .max(10000)
      .optional(),
  }),
  distributionBoards: entity.extend({
    deviceId: id,
    roomId: id.optional(),
    floorId: id.optional(),
  }),
  calculations: entity.extend({
    kind: name,
    inputs: z.record(z.string(), finite),
    units: z.record(z.string(), z.string().max(40)),
    assumptions: z.array(z.string().max(1000)).max(100),
    methodReference: z.string().min(1).max(1000),
  }),
  reports: entity.extend({
    kind: name,
    documentId: id,
    revisionId: id.optional(),
  }),
  revisions: entity.extend({
    createdAt: z.iso.datetime(),
    description: z.string().max(2000),
  }),
  findings: entity.extend({
    severity: z.enum(["error", "warning", "info"]),
    code: name,
    entityIds: z.array(id).max(1000),
    message: z.string().min(1).max(2000),
  }),
};
export const projectSchema = z
  .object({
    schemaVersion: z.literal(18),
    id,
    name,
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    ...Object.fromEntries(
      Object.entries(schemas).map(([key, schema]) => [
        key,
        z.array(schema).max(20000),
      ]),
    ),
  })
  .strict();
export type ProjectHeader = {
  schemaVersion: 18;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};
export type Project = ProjectHeader & {
  [K in keyof typeof schemas]: z.infer<(typeof schemas)[K]>[];
};
export const collections = Object.keys(schemas) as (keyof typeof schemas)[];
export function createProject(
  projectName: string,
  projectId: string = crypto.randomUUID(),
  now = new Date().toISOString(),
): Project {
  const data = {
    schemaVersion: 18,
    id: projectId,
    name: projectName,
    createdAt: now,
    updatedAt: now,
    ...Object.fromEntries(collections.map((key) => [key, []])),
  };
  return validateProject(data);
}
export function validateProject(input: unknown): Project {
  const parsed = projectSchema.parse(input) as Project;
  const ids = new Set<string>([parsed.id]);
  for (const collection of collections)
    for (const item of parsed[collection]) {
      if (ids.has(item.id)) throw new Error(`Duplicate entity ID: ${item.id}`);
      ids.add(item.id);
    }
  validateReferences(parsed);
  if (Date.parse(parsed.updatedAt) < Date.parse(parsed.createdAt))
    throw new Error("Project update precedes creation");
  return parsed;
}
const references: Partial<
  Record<keyof typeof schemas, Record<string, keyof typeof schemas>>
> = {
  layers: { pageId: "pages" },
  groups: { pageId: "pages", symbolIds: "symbolInstances" },
  annotations: { pageId: "pages", layerId: "layers", pinId: "pins" },
  pages: { documentId: "documents" },
  symbolInstances: {
    layerId: "layers",
    definitionId: "symbolDefinitions",
    deviceId: "devices",
    pageId: "pages",
  },
  devices: { partId: "manufacturerParts" },
  terminals: { deviceId: "devices" },
  pins: { terminalId: "terminals", symbolInstanceId: "symbolInstances" },
  wires: { fromPinId: "pins", toPinId: "pins", conductorId: "conductors" },
  wirePaths: { wireId: "wires", pageId: "pages", layerId: "layers" },
  nets: { wireIds: "wires", pinIds: "pins", terminalIds: "terminals" },
  cables: { conductorIds: "conductors", shieldBondTerminalIds: "terminals" },
  connectionPoints: { terminalIds: "terminals" },
  terminalStrips: { terminalIds: "terminals" },
  plcModules: { deviceId: "devices" },
  plcAddresses: {
    moduleId: "plcModules",
    terminalIds: "terminals",
    signalDeviceId: "devices",
  },
  automationNotes: { deviceIds: "devices" },
  equipment3d: {
    deviceId: "devices",
    enclosureId: "enclosures",
    mountingStructureId: "panelStructures",
    meshId: "panelMeshes",
  },
  panelStructures: { enclosureId: "enclosures" },
  floors: { buildingId: "buildings" },
  architecturalLayers: { floorId: "floors" },
  walls: { floorId: "floors", layerId: "architecturalLayers" },
  wallOpenings: { wallId: "walls" },
  planGeometry: { floorId: "floors", layerId: "architecturalLayers" },
  rooms: { floorId: "floors" },
  planEquipment: {
    floorId: "floors",
    layerId: "architecturalLayers",
    roomId: "rooms",
    symbolInstanceId: "symbolInstances",
  },
  planRoutes: {
    floorId: "floors",
    layerId: "architecturalLayers",
    circuitId: "circuits",
  },
  planZones: {
    floorId: "floors",
    roomIds: "rooms",
    boardId: "distributionBoards",
  },
  circuits: {
    boardId: "distributionBoards",
    deviceIds: "devices",
    floorId: "floors",
    layerId: "architecturalLayers",
  },
  distributionBoards: {
    deviceId: "devices",
    roomId: "rooms",
    floorId: "floors",
  },
  reports: { documentId: "documents", revisionId: "revisions" },
};
function validateReferences(project: Project): void {
  const featureIds = new Set<string>();
  for (const enclosure of project.enclosures)
    for (const feature of enclosure.features ?? []) {
      if (featureIds.has(feature.id))
        throw new Error("Duplicate panel feature ID");
      featureIds.add(feature.id);
      const width = ["left", "right"].includes(feature.face)
        ? enclosure.depthMm
        : enclosure.widthMm;
      const height = ["top", "bottom"].includes(feature.face)
        ? enclosure.depthMm
        : enclosure.heightMm;
      const epsilon = 16 * Number.EPSILON * Math.max(width, height);
      if (
        (feature.shape === "circle" && feature.widthMm !== feature.heightMm) ||
        feature.positionMm.x - feature.widthMm / 2 < -epsilon ||
        feature.positionMm.y - feature.heightMm / 2 < -epsilon ||
        feature.positionMm.x + feature.widthMm / 2 > width + epsilon ||
        feature.positionMm.y + feature.heightMm / 2 > height + epsilon
      )
        throw new Error(
          "Panel feature must fit its enclosure face; circles require equal dimensions",
        );
    }
  for (const structure of project.panelStructures)
    if (
      structure.kind !== "duct" &&
      (structure.cableDiametersMm !== undefined ||
        structure.usableCrossSectionMm2 !== undefined ||
        structure.maximumFillPercent !== undefined)
    )
      throw new Error("Only cable ducts can contain occupancy assumptions");
  for (const structure of project.panelStructures)
    if (
      structure.mountingProfile &&
      !["plate", "din-rail"].includes(structure.kind)
    )
      throw new Error(
        "Only mounting plates and rails can declare a support profile",
      );
  const meshSizes = new Map(
    project.panelMeshes.map((mesh) => [mesh.id, validateMeshGeometry(mesh)]),
  );
  if (
    project.panelMeshes.reduce((sum, mesh) => sum + mesh.triangles.length, 0) >
    100000
  )
    throw new Error("Project exceeds mesh triangle budget");
  const meshTriangles = new Map(
    project.panelMeshes.map((mesh) => [mesh.id, mesh.triangles.length]),
  );
  if (
    project.equipment3d.reduce(
      (sum, item) =>
        sum + (item.meshId ? (meshTriangles.get(item.meshId) ?? 0) : 0),
      0,
    ) > 100000
  )
    throw new Error("Project exceeds placed mesh triangle budget");
  const mountedDevices = new Set<string>();
  for (const item of project.equipment3d) {
    if (Boolean(item.meshId) !== (item.dimensionSource === "mesh"))
      throw new Error("Mesh geometry requires mesh dimensions");
    if (item.meshId) {
      const size = meshSizes.get(item.meshId);
      if (
        !size ||
        size.x !== item.sizeMm.x ||
        size.y !== item.sizeMm.y ||
        size.z !== item.sizeMm.z
      )
        throw new Error("Placement dimensions do not match its mesh");
    }
    if (Boolean(item.accessDirection) !== Boolean(item.accessClearanceMm))
      throw new Error(
        "Service access requires both a direction and positive clearance",
      );
    if (mountedDevices.has(item.deviceId))
      throw new Error("Device has multiple 3D placements");
    mountedDevices.add(item.deviceId);
    if (item.mountingStructureId) {
      const structure = project.panelStructures.find(
        (record) => record.id === item.mountingStructureId,
      );
      if (
        !structure ||
        structure.enclosureId !== item.enclosureId ||
        !["plate", "din-rail", "door"].includes(structure.kind)
      )
        throw new Error(
          "3D mounting structure must be a plate, rail, or door in the same enclosure",
        );
    }
    if (
      item.dimensionSource === "catalog" ||
      item.dimensionSource === "custom"
    ) {
      const device = project.devices.find(
        (record) => record.id === item.deviceId,
      );
      const part = project.manufacturerParts.find(
        (record) => record.id === device?.partId,
      );
      const dimensions =
        item.dimensionSource === "catalog"
          ? part?.catalogSnapshot?.dimensionsMm
          : part?.custom?.dimensionsMm;
      if (
        !dimensions ||
        dimensions.width !== item.sizeMm.x ||
        dimensions.height !== item.sizeMm.y ||
        dimensions.depth !== item.sizeMm.z
      )
        throw new Error(
          "3D dimensions do not match their assigned part source",
        );
    }
  }
  const placementByDevice = new Map(
    project.planEquipment.map((equipment) => [
      project.symbolInstances.find((s) => s.id === equipment.symbolInstanceId)
        ?.deviceId,
      equipment,
    ]),
  );
  const floorBoardDevices = new Set<string>();
  for (const board of project.distributionBoards) {
    if (!board.floorId) continue;
    const placement = placementByDevice.get(board.deviceId);
    if (!placement || placement.floorId !== board.floorId)
      throw new Error("Floor board requires a device placement on its floor");
    if (
      floorBoardDevices.has(board.deviceId) ||
      project.distributionBoards.some(
        (other) => other.id !== board.id && other.deviceId === board.deviceId,
      )
    )
      throw new Error(
        "A native device can represent only one distribution board",
      );
    floorBoardDevices.add(board.deviceId);
    if (board.roomId && board.roomId !== placement.roomId)
      throw new Error("Floor board room must match its equipment placement");
  }
  const assignedDevices = new Set<string>();
  const circuitLabels = new Set<string>();
  for (const circuit of project.circuits) {
    const loadDevices = circuit.loads?.map((load) => load.deviceId) ?? [];
    if (
      new Set(loadDevices).size !== loadDevices.length ||
      loadDevices.some((deviceId) => !circuit.deviceIds.includes(deviceId))
    )
      throw new Error("Circuit loads must uniquely reference member devices");
    if (Boolean(circuit.floorId) !== Boolean(circuit.layerId))
      throw new Error(
        "Floor circuit requires both a floor and electrical layer",
      );
    if (!circuit.floorId) continue;
    const layer = project.architecturalLayers.find(
      (l) => l.id === circuit.layerId,
    );
    if (
      !layer ||
      layer.floorId !== circuit.floorId ||
      layer.kind !== "electrical"
    )
      throw new Error(
        "Floor circuit requires an electrical layer on its floor",
      );
    const board = project.distributionBoards.find(
      (b) => b.id === circuit.boardId,
    );
    if (!board || board.floorId !== circuit.floorId)
      throw new Error("Circuit board must belong to the same floor");
    const label = JSON.stringify([circuit.boardId, circuit.name]);
    if (circuitLabels.has(label))
      throw new Error("Circuit labels must be unique within a board");
    circuitLabels.add(label);
    for (const deviceId of circuit.deviceIds) {
      const placement = placementByDevice.get(deviceId);
      if (!placement || placement.floorId !== circuit.floorId)
        throw new Error("Circuit devices must be placed on the same floor");
      if (deviceId === board.deviceId)
        throw new Error(
          "A circuit cannot contain its supplying board as a load",
        );
      if (assignedDevices.has(deviceId))
        throw new Error("A floor device can belong to only one floor circuit");
      assignedDevices.add(deviceId);
    }
  }
  for (const route of project.planRoutes) {
    const layer = project.architecturalLayers.find(
      (l) => l.id === route.layerId,
    );
    if (
      !layer ||
      layer.floorId !== route.floorId ||
      layer.kind !== "electrical"
    )
      throw new Error("Plan route requires an electrical layer on its floor");
    if (
      route.circuitId &&
      !project.circuits.some(
        (c) => c.id === route.circuitId && c.floorId === route.floorId,
      )
    )
      throw new Error("Plan route circuit must belong to the same floor");
  }
  const riserNames = new Set<string>();
  for (const riser of project.planRisers) {
    const startFloor = project.floors.find((f) => f.id === riser.start.floorId);
    const endFloor = project.floors.find((f) => f.id === riser.end.floorId);
    if (
      !startFloor ||
      !endFloor ||
      startFloor.id === endFloor.id ||
      startFloor.buildingId !== endFloor.buildingId
    )
      throw new Error(
        "Riser endpoints require different floors of the same building",
      );
    for (const endpoint of [riser.start, riser.end]) {
      const floor = project.floors.find((f) => f.id === endpoint.floorId)!;
      const layer = project.architecturalLayers.find(
        (l) => l.id === endpoint.layerId,
      );
      if (!layer || layer.floorId !== floor.id || layer.kind !== "electrical")
        throw new Error(
          "Riser endpoint requires an electrical layer on its floor",
        );
      if (endpoint.heightMm > floor.heightMm)
        throw new Error("Riser endpoint height exceeds its floor height");
    }
    const startZ = startFloor.elevationMm + riser.start.heightMm;
    const endZ = endFloor.elevationMm + riser.end.heightMm;
    if (
      !Number.isFinite(startZ) ||
      !Number.isFinite(endZ) ||
      !Number.isFinite(endZ - startZ) ||
      startZ === endZ
    )
      throw new Error("Riser must have finite nonzero vertical length");
    const label = JSON.stringify([
      startFloor.buildingId,
      riser.name.toLowerCase(),
    ]);
    if (riserNames.has(label))
      throw new Error("Riser names must be unique within a building");
    riserNames.add(label);
  }
  const placedDevices = new Set<string>();
  for (const equipment of project.planEquipment) {
    const layer = project.architecturalLayers.find(
      (l) => l.id === equipment.layerId,
    );
    const symbol = project.symbolInstances.find(
      (s) => s.id === equipment.symbolInstanceId,
    );
    if (
      !layer ||
      layer.floorId !== equipment.floorId ||
      layer.kind !== "electrical"
    )
      throw new Error("Equipment requires an electrical layer on its floor");
    if (!symbol || placedDevices.has(symbol.deviceId))
      throw new Error("Each native device can have only one floor placement");
    placedDevices.add(symbol.deviceId);
    if (equipment.roomId) {
      const room = project.rooms.find((r) => r.id === equipment.roomId);
      if (
        !room ||
        room.floorId !== equipment.floorId ||
        !pointInPolygon(equipment.position, room.boundary)
      )
        throw new Error(
          "Equipment anchor must lie in its assigned room on the same floor",
        );
    }
  }
  for (const zone of project.planZones) {
    if (new Set(zone.roomIds).size !== zone.roomIds.length)
      throw new Error("Zone room membership must be unique");
    if (
      zone.roomIds.some(
        (id) =>
          !project.rooms.some((r) => r.id === id && r.floorId === zone.floorId),
      )
    )
      throw new Error("Zone rooms must belong to its floor");
    if (zone.boardId) {
      const board = project.distributionBoards.find(
        (b) => b.id === zone.boardId,
      );
      if (zone.kind !== "distribution" || !board)
        throw new Error("Only distribution zones can reference a board");
      if (board.floorId && board.floorId !== zone.floorId)
        throw new Error("Zone board must be on the same floor");
      if (
        board.roomId &&
        !project.rooms.some(
          (r) => r.id === board.roomId && r.floorId === zone.floorId,
        )
      )
        throw new Error("Zone board must be on the same floor when located");
    }
  }
  for (const shape of project.planGeometry) {
    const layer = project.architecturalLayers.find(
      (l) => l.id === shape.layerId,
    );
    if (
      !layer ||
      layer.floorId !== shape.floorId ||
      layer.kind !== "architectural"
    )
      throw new Error("Plan geometry requires architectural floor layer");
  }
  const openingsByWall = new Map<string, Project["wallOpenings"]>();
  for (const opening of project.wallOpenings) {
    const wall = project.walls.find((w) => w.id === opening.wallId);
    if (
      !wall ||
      opening.offsetMm + opening.widthMm >
        Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y) +
          1e-7 ||
      opening.sillMm + opening.heightMm > wall.heightMm ||
      (opening.kind === "door" && opening.sillMm !== 0)
    )
      throw new Error("Opening exceeds wall bounds");
    const existing = openingsByWall.get(wall.id) ?? [];
    if (existing.length >= 256) throw new Error("Too many openings on wall");
    if (
      existing.some(
        (other) =>
          opening.offsetMm < other.offsetMm + other.widthMm &&
          opening.offsetMm + opening.widthMm > other.offsetMm &&
          opening.sillMm < other.sillMm + other.heightMm &&
          opening.sillMm + opening.heightMm > other.sillMm,
      )
    )
      throw new Error("Wall openings overlap");
    existing.push(opening);
    openingsByWall.set(wall.id, existing);
  }
  for (const wall of project.walls) {
    const layer = project.architecturalLayers.find(
      (l) => l.id === wall.layerId,
    );
    if (
      !layer ||
      layer.floorId !== wall.floorId ||
      layer.kind !== "architectural"
    )
      throw new Error("Wall requires an architectural layer on its floor");
  }
  const pageOrders = new Set<string>();
  for (const page of project.pages) {
    const key = `${page.documentId}:${page.order}`;
    if (pageOrders.has(key)) throw new Error("Duplicate page order");
    pageOrders.add(key);
  }
  const pinMappings = new Set<string>();
  for (const pin of project.pins) {
    const key = `${pin.symbolInstanceId}:${pin.definitionPinId}`;
    if (pinMappings.has(key)) throw new Error("Duplicate symbol pin mapping");
    pinMappings.add(key);
  }
  const conductorOwners = new Set<string>();
  for (const cable of project.cables)
    for (const conductor of cable.conductorIds) {
      if (conductorOwners.has(conductor))
        throw new Error("Conductor belongs to multiple cables");
      conductorOwners.add(conductor);
    }
  const netMembership = new Set<string>();
  for (const net of project.nets)
    for (const wire of net.wireIds) {
      if (netMembership.has(wire))
        throw new Error("Wire belongs to multiple nets");
      netMembership.add(wire);
    }

  const maps = Object.fromEntries(
    collections.map((key) => [
      key,
      new Map(project[key].map((item) => [item.id, item])),
    ]),
  ) as unknown as Record<keyof typeof schemas, Map<string, { id: string }>>;
  for (const [collection, fields] of Object.entries(references))
    for (const item of project[collection as keyof typeof schemas]) {
      const record = item as unknown as Record<string, unknown>;
      for (const [field, target] of Object.entries(fields)) {
        const value = record[field];
        if (value === undefined) continue;
        const values = Array.isArray(value) ? value : [value];
        if (new Set(values).size !== values.length)
          throw new Error(`Duplicate references: ${collection}.${field}`);
        for (const reference of values)
          if (typeof reference !== "string" || !maps[target].has(reference))
            throw new Error(
              `Missing reference: ${collection}.${field} -> ${String(reference)}`,
            );
      }
    }
  const memberships = new Set<string>();
  for (const group of project.groups)
    for (const id of group.symbolIds) {
      const instance = project.symbolInstances.find((s) => s.id === id)!;
      if (instance.pageId !== group.pageId || memberships.has(id))
        throw new Error("Invalid graphical group membership");
      memberships.add(id);
    }
  for (const instance of project.symbolInstances)
    if (
      project.layers.find((l) => l.id === instance.layerId)!.pageId !==
      instance.pageId
    )
      throw new Error("Symbol layer page mismatch");
  for (const path of project.wirePaths)
    if (
      project.layers.find((l) => l.id === path.layerId)!.pageId !== path.pageId
    )
      throw new Error("Wire layer page mismatch");
  for (const annotation of project.annotations)
    if (
      project.layers.find((l) => l.id === annotation.layerId)!.pageId !==
      annotation.pageId
    )
      throw new Error("Annotation layer page mismatch");
  for (const finding of project.findings)
    for (const target of finding.entityIds)
      if (
        !collections.some((key) => maps[key].has(target)) &&
        target !== project.id
      )
        throw new Error(`Unknown finding entity: ${target}`);
  const componentRevisions = new Set<string>();
  for (const part of project.manufacturerParts)
    if (part.custom) {
      const revisionKey = `${part.custom.componentId}:${part.custom.revision}`;
      if (componentRevisions.has(revisionKey))
        throw new Error("Duplicate custom component revision");
      componentRevisions.add(revisionKey);
      const definition = project.symbolDefinitions.find(
        (d) => d.id === part.custom!.symbolDefinition.id,
      );
      if (
        !definition ||
        JSON.stringify(definition) !==
          JSON.stringify(part.custom.symbolDefinition)
      )
        throw new Error("Custom component symbol revision mismatch");
      if (
        !definition.pins.length &&
        definition.connectionClass !== "mechanical"
      )
        throw new Error(
          "Custom electrical component requires connection points",
        );
      if (
        definition.widthMm > 500 ||
        definition.heightMm > 500 ||
        definition.pins.some(
          (pin) =>
            Math.abs(pin.position.x) > definition.widthMm / 2 ||
            Math.abs(pin.position.y) > definition.heightMm / 2,
        ) ||
        new Set(
          definition.pins.map((pin) => `${pin.position.x},${pin.position.y}`),
        ).size !== definition.pins.length
      )
        throw new Error("Invalid custom component connection geometry");
    }
  for (const definition of project.symbolDefinitions) {
    if (
      definition.connectionClass === "mechanical" &&
      (definition.category !== "custom" ||
        definition.glyph !== "box" ||
        definition.pins.length)
    )
      throw new Error("Mechanical symbols cannot declare electrical pins");
    const inside = (p: Point) =>
      Math.abs(p.x) <= definition.widthMm / 2 &&
      Math.abs(p.y) <= definition.heightMm / 2;
    if (
      definition.artwork &&
      (definition.category !== "custom" ||
        definition.artwork.some((shape) =>
          shape.kind === "line"
            ? !inside(shape.from) || !inside(shape.to)
            : !inside({
                x: shape.center.x - shape.radiusMm,
                y: shape.center.y - shape.radiusMm,
              }) ||
              !inside({
                x: shape.center.x + shape.radiusMm,
                y: shape.center.y + shape.radiusMm,
              }),
        ))
    )
      throw new Error("Artwork outside custom symbol bounds");
    const groupKinds = new Map<string, string>();
    for (const pin of definition.pins)
      if (pin.terminalGroup && pin.kind) {
        if (
          groupKinds.has(pin.terminalGroup) &&
          groupKinds.get(pin.terminalGroup) !== pin.kind
        )
          throw new Error("Conflicting terminal group kinds");
        groupKinds.set(pin.terminalGroup, pin.kind);
      }
  }
  for (const definition of project.symbolDefinitions)
    if (
      new Set(definition.pins.map((p) => p.id)).size !== definition.pins.length
    )
      throw new Error(`Duplicate definition pin: ${definition.id}`);
  for (const pin of project.pins) {
    const instance = project.symbolInstances.find(
      (item) => item.id === pin.symbolInstanceId,
    )!;
    const terminal = project.terminals.find(
      (item) => item.id === pin.terminalId,
    )!;
    const definition = project.symbolDefinitions.find(
      (item) => item.id === instance.definitionId,
    )!;
    if (
      instance.deviceId !== terminal.deviceId ||
      !definition.pins.some((item) => item.id === pin.definitionPinId)
    )
      throw new Error(`Pin mapping mismatch: ${pin.id}`);
    const declaredKind = definition.pins.find(
      (item) => item.id === pin.definitionPinId,
    )?.kind;
    if (declaredKind && declaredKind !== terminal.kind)
      throw new Error(`Declared pin kind mismatch: ${pin.id}`);
  }
  for (const instance of project.symbolInstances) {
    const definition = project.symbolDefinitions.find(
      (item) => item.id === instance.definitionId,
    )!;
    const actual = project.pins
      .filter((pin) => pin.symbolInstanceId === instance.id)
      .map((pin) => pin.definitionPinId);
    const expected = definition.pins.map((pin) => pin.id);
    const groups = new Map<string, string>();
    const groupTerminals = new Map<string, string>();
    for (const pin of project.pins.filter(
      (p) => p.symbolInstanceId === instance.id,
    )) {
      const group = definition.pins.find(
        (p) => p.id === pin.definitionPinId,
      )?.terminalGroup;
      if (!group) continue;
      if (
        (groups.has(group) && groups.get(group) !== pin.terminalId) ||
        (groupTerminals.has(pin.terminalId) &&
          groupTerminals.get(pin.terminalId) !== group)
      )
        throw new Error("Terminal group mapping mismatch");
      groups.set(group, pin.terminalId);
      groupTerminals.set(pin.terminalId, group);
    }
    if (
      actual.length !== expected.length ||
      expected.some((id) => !actual.includes(id))
    )
      throw new Error(`Incomplete symbol pin mapping: ${instance.id}`);
  }
  const deviceReferences = project.devices.map((item) => item.reference);
  if (new Set(deviceReferences).size !== deviceReferences.length)
    throw new Error("Duplicate device reference");
  for (const wire of project.wires)
    if (wire.fromPinId === wire.toPinId)
      throw new Error(`Wire connects a pin to itself: ${wire.id}`);
  for (const path of project.wirePaths) {
    const wire = project.wires.find((item) => item.id === path.wireId)!;
    const expectedStart = pinAnchor(project, wire.fromPinId),
      expectedEnd = pinAnchor(project, wire.toPinId);
    const first = path.points[0],
      last = path.points[path.points.length - 1];
    if (
      Math.abs(first.x - expectedStart.x) > 1e-6 ||
      Math.abs(first.y - expectedStart.y) > 1e-6 ||
      Math.abs(last.x - expectedEnd.x) > 1e-6 ||
      Math.abs(last.y - expectedEnd.y) > 1e-6
    )
      throw new Error("Wire route endpoint does not match its native pin");

    for (const pinId of [wire.fromPinId, wire.toPinId]) {
      const pin = project.pins.find((item) => item.id === pinId)!;
      const instance = project.symbolInstances.find(
        (item) => item.id === pin.symbolInstanceId,
      )!;
      if (instance.pageId !== path.pageId)
        throw new Error(`Wire path page mismatch: ${path.id}`);
    }
  }
  const addresses = new Set<string>();
  const channels = new Set<string>();
  const moduleDevices = new Set<string>();
  for (const module of project.plcModules) {
    if (moduleDevices.has(module.deviceId))
      throw new Error("A native device can represent only one PLC module");
    moduleDevices.add(module.deviceId);
  }
  for (const address of project.plcAddresses) {
    const module = project.plcModules.find(
      (item) => item.id === address.moduleId,
    )!;
    const channel = `${module.id}:${address.channel}`;
    if (
      address.channel >= module.channelCount ||
      addresses.has(address.address.toLowerCase()) ||
      channels.has(channel)
    )
      throw new Error(`Invalid or duplicate PLC address: ${address.id}`);
    const terminalIds = address.terminalIds ?? [];
    if (
      new Set(terminalIds).size !== terminalIds.length ||
      terminalIds.some(
        (terminalId) =>
          !project.terminals.some(
            (terminal) =>
              terminal.id === terminalId &&
              terminal.deviceId === module.deviceId,
          ),
      )
    )
      throw new Error(
        "PLC channel terminals must uniquely belong to its module device",
      );
    if (
      (module.moduleKind?.startsWith("digital-") &&
        address.dataType !== "BOOL") ||
      (module.moduleKind?.startsWith("analog-") &&
        !["INT", "REAL"].includes(address.dataType))
    )
      throw new Error("PLC channel data type does not match its module kind");
    addresses.add(address.address.toLowerCase());
    channels.add(channel);
  }
  for (const note of project.automationNotes)
    if (new Set(note.deviceIds).size !== note.deviceIds.length)
      throw new Error("Automation note devices must be distinct");
}
export function pinAnchor(project: Project, pinId: string): Point {
  const pin = project.pins.find((p) => p.id === pinId),
    instance = project.symbolInstances.find(
      (s) => s.id === pin?.symbolInstanceId,
    ),
    definition = project.symbolDefinitions.find(
      (d) => d.id === instance?.definitionId,
    ),
    local = definition?.pins.find((p) => p.id === pin?.definitionPinId);
  if (!instance || !local) throw new Error("Invalid pin anchor reference");
  return transform(
    local.position,
    instance.position,
    instance.rotation,
    instance.mirrored,
  );
}
export const maxProjectBytes = 5 * 1024 * 1024;
export function serializeProject(project: Project): string {
  const text = JSON.stringify(validateProject(project));
  if (new TextEncoder().encode(text).length > maxProjectBytes)
    throw new Error("Project exceeds 5 MiB limit");
  return text;
}
export function parseProject(text: string): {
  project: Project;
  migratedFrom:
    | 0
    | 1
    | 2
    | 3
    | 4
    | 5
    | 6
    | 7
    | 8
    | 9
    | 10
    | 11
    | 12
    | 13
    | 14
    | 15
    | 16
    | 17
    | 18;
} {
  if (new TextEncoder().encode(text).length > maxProjectBytes)
    throw new Error("Project exceeds 5 MiB limit");
  const raw: unknown = JSON.parse(text);
  if (!raw || typeof raw !== "object")
    throw new Error("Project document must be an object");
  const version = (raw as { schemaVersion?: unknown }).schemaVersion;
  if (version === 18)
    return { project: validateProject(raw), migratedFrom: 18 };
  const oldFloors = (raw as { floors?: unknown }).floors;
  const floors = Array.isArray(oldFloors)
    ? oldFloors.map((floor) => ({ drawingScale: 100, ...floor }))
    : (oldFloors ?? []);
  if (
    version === 2 ||
    version === 3 ||
    version === 4 ||
    version === 5 ||
    version === 6 ||
    version === 7 ||
    version === 8 ||
    version === 9 ||
    version === 10 ||
    version === 11 ||
    version === 12 ||
    version === 13 ||
    version === 14 ||
    version === 15 ||
    version === 16 ||
    version === 17
  )
    return {
      project: validateProject({
        panelMeshes: [],
        panelStructures: [],
        automationNotes: [],
        planRisers: [],
        planRoutes: [],
        planEquipment: [],
        planZones: [],
        architecturalLayers: [],
        walls: [],
        wallOpenings: [],
        planGeometry: [],
        ...raw,
        floors,
        schemaVersion: 18,
      }),
      migratedFrom: version,
    };
  if (version === 0 || version === 1) {
    const old = raw as Record<string, unknown>;
    const migrated: Record<string, unknown> = {
      ...Object.fromEntries(collections.map((key) => [key, []])),
      ...old,
      floors,
      schemaVersion: 18,
    };
    const pages = (migrated.pages ?? []) as { id: string }[];
    const used = new Set<string>([String(old.id)]);
    for (const value of Object.values(old))
      if (Array.isArray(value))
        for (const item of value)
          if (item && typeof item.id === "string") used.add(item.id);
    let number = 0;
    const ids = new Map<string, string>();
    migrated.layers = pages.map((page) => {
      let id: string;
      do {
        id = `migration-layer-${number++}`;
      } while (used.has(id));
      used.add(id);
      ids.set(page.id, id);
      return {
        id,
        name: "Default",
        pageId: page.id,
        visible: true,
        locked: false,
      };
    });
    migrated.symbolDefinitions = (
      (migrated.symbolDefinitions ?? []) as object[]
    ).map((item) => ({ ...item, glyph: "box", widthMm: 20, heightMm: 20 }));
    migrated.symbolInstances = (
      (migrated.symbolInstances ?? []) as { pageId: string }[]
    ).map((item) => ({
      ...item,
      layerId: ids.get(item.pageId),
      mirrored: false,
    }));
    migrated.wirePaths = (
      (migrated.wirePaths ?? []) as { pageId: string }[]
    ).map((item) => ({ ...item, layerId: ids.get(item.pageId) }));
    const candidate = projectSchema.parse(migrated) as Project;
    for (const path of candidate.wirePaths) {
      const wire = candidate.wires.find((w) => w.id === path.wireId);
      if (!wire) throw new Error("Missing migrated wire");
      path.points[0] = pinAnchor(candidate, wire.fromPinId);
      path.points[path.points.length - 1] = pinAnchor(candidate, wire.toPinId);
    }
    return { project: validateProject(candidate), migratedFrom: version };
  }
  throw new Error(`Unsupported project schema version: ${String(version)}`);
}
