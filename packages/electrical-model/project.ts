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
              glyph: z.enum(["terminal", "contact"]),
              electricalNodes: z.number().int().min(1).max(256),
              connections: z.number().int().min(1).max(1000),
            })
            .strict(),
          dimensionsMm: z
            .object({
              width: positive.max(100000),
              height: positive.max(100000),
              depth: positive.max(100000),
            })
            .strict()
            .optional(),
          mountedDepthsMm: z
            .array(
              z.object({ rail: name, depth: positive.max(100000) }).strict(),
            )
            .min(1)
            .max(32)
            .optional(),
          terminalMarkings: z.array(name).min(1).max(256).optional(),
          mounting: z.string().trim().min(1).max(2000).optional(),
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
  }),
  plcAddresses: entity.extend({
    moduleId: id,
    channel: z.number().int().nonnegative(),
    address: name,
    dataType: z.enum(["BOOL", "INT", "REAL", "TIME"]),
  }),
  enclosures: entity.extend({
    widthMm: positive,
    heightMm: positive,
    depthMm: positive,
  }),
  equipment3d: entity.extend({
    deviceId: id,
    enclosureId: id,
    positionMm: z.object({ x: finite, y: finite, z: finite }).strict(),
    sizeMm: z.object({ x: positive, y: positive, z: positive }).strict(),
  }),
  buildings: entity.extend({ address: z.string().max(500) }),
  floors: entity.extend({
    buildingId: id,
    elevationMm: finite,
    heightMm: positive,
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
  rooms: entity.extend({
    floorId: id,
    boundary: z.array(point).min(3).max(10000),
  }),
  circuits: entity.extend({
    boardId: id,
    deviceIds: z.array(id).max(10000),
    voltageV: positive,
    phases: z.union([z.literal(1), z.literal(3)]),
  }),
  distributionBoards: entity.extend({ deviceId: id, roomId: id.optional() }),
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
    schemaVersion: z.literal(10),
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
  schemaVersion: 10;
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
    schemaVersion: 10,
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
  plcAddresses: { moduleId: "plcModules" },
  equipment3d: { deviceId: "devices", enclosureId: "enclosures" },
  floors: { buildingId: "buildings" },
  architecturalLayers: { floorId: "floors" },
  walls: { floorId: "floors", layerId: "architecturalLayers" },
  rooms: { floorId: "floors" },
  circuits: { boardId: "distributionBoards", deviceIds: "devices" },
  distributionBoards: { deviceId: "devices", roomId: "rooms" },
  reports: { documentId: "documents", revisionId: "revisions" },
};
function validateReferences(project: Project): void {
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
  for (const address of project.plcAddresses) {
    const module = project.plcModules.find(
      (item) => item.id === address.moduleId,
    )!;
    const channel = `${module.id}:${address.channel}`;
    if (
      address.channel >= module.channelCount ||
      addresses.has(address.address) ||
      channels.has(channel)
    )
      throw new Error(`Invalid or duplicate PLC address: ${address.id}`);
    addresses.add(address.address);
    channels.add(channel);
  }
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
  migratedFrom: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
} {
  if (new TextEncoder().encode(text).length > maxProjectBytes)
    throw new Error("Project exceeds 5 MiB limit");
  const raw: unknown = JSON.parse(text);
  if (!raw || typeof raw !== "object")
    throw new Error("Project document must be an object");
  const version = (raw as { schemaVersion?: unknown }).schemaVersion;
  if (version === 10)
    return { project: validateProject(raw), migratedFrom: 10 };
  if (
    version === 2 ||
    version === 3 ||
    version === 4 ||
    version === 5 ||
    version === 6 ||
    version === 7 ||
    version === 8 ||
    version === 9
  )
    return {
      project: validateProject({
        architecturalLayers: [],
        walls: [],
        ...raw,
        schemaVersion: 10,
      }),
      migratedFrom: version,
    };
  if (version === 0 || version === 1) {
    const old = raw as Record<string, unknown>;
    const migrated: Record<string, unknown> = {
      ...Object.fromEntries(collections.map((key) => [key, []])),
      ...old,
      schemaVersion: 10,
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
