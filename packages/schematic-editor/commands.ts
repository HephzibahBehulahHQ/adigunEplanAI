import { validateProject, type Project } from "../electrical-model/project.ts";
import {
  bounds,
  routeWire,
  pathNeedsReroute,
  snap,
  transform,
  type Point,
} from "./geometry.ts";
function quantize(value: number, grid: number): number {
  if (grid === 0) {
    if (!Number.isFinite(value)) throw new Error("Invalid coordinate");
    return value;
  }
  return snap(value, grid);
}
export const primitives = {
  terminal: {
    glyph: "terminal",
    prefix: "X",
    w: 8,
    h: 8,
    pins: [{ id: "1", position: { x: 0, y: 0 } }],
  },
  junction: {
    glyph: "junction",
    prefix: "J",
    w: 4,
    h: 4,
    pins: [{ id: "1", position: { x: 0, y: 0 } }],
  },
  resistor: {
    glyph: "resistor",
    prefix: "R",
    w: 20,
    h: 8,
    pins: [
      { id: "1", position: { x: -10, y: 0 } },
      { id: "2", position: { x: 10, y: 0 } },
    ],
  },
  fuse: {
    glyph: "fuse",
    prefix: "F",
    w: 20,
    h: 8,
    pins: [
      { id: "1", position: { x: -10, y: 0 } },
      { id: "2", position: { x: 10, y: 0 } },
    ],
  },
  contact: {
    glyph: "contact",
    prefix: "S",
    w: 20,
    h: 10,
    pins: [
      { id: "1", position: { x: -10, y: 0 } },
      { id: "2", position: { x: 10, y: 0 } },
    ],
  },
  coil: {
    glyph: "coil",
    prefix: "K",
    w: 18,
    h: 12,
    pins: [
      { id: "A1", position: { x: -9, y: 0 } },
      { id: "A2", position: { x: 9, y: 0 } },
    ],
  },
  lamp: {
    glyph: "lamp",
    prefix: "H",
    w: 12,
    h: 12,
    pins: [
      { id: "1", position: { x: -6, y: 0 } },
      { id: "2", position: { x: 6, y: 0 } },
    ],
  },
  motor: {
    glyph: "motor",
    prefix: "M",
    w: 18,
    h: 18,
    pins: [
      { id: "positive", position: { x: -9, y: 0 } },
      { id: "negative", position: { x: 9, y: 0 } },
    ],
  },
  ground: {
    glyph: "ground",
    prefix: "PE",
    w: 12,
    h: 12,
    pins: [{ id: "PE", position: { x: 0, y: -6 } }],
  },
} as const;
export type Primitive = keyof typeof primitives;
function uid() {
  return crypto.randomUUID();
}
function editable(project: Project, ids: string[]) {
  for (const id of ids) {
    const s = project.symbolInstances.find((s) => s.id === id);
    const layer = project.layers.find((l) => l.id === s?.layerId);
    if (!s || !layer || layer.locked || !layer.visible)
      throw new Error("Object is not editable");
  }
}
function checkBounds(project: Project, ids: string[]) {
  for (const id of ids) {
    const s = project.symbolInstances.find((s) => s.id === id)!;
    const page = project.pages.find((p) => p.id === s.pageId)!;
    const b = bounds(project, s);
    if (
      b.left < 8 ||
      b.top < 8 ||
      b.right > page.widthMm - 8 ||
      b.bottom + 6 > page.heightMm - 24
    )
      throw new Error("Object outside page");
  }
}
function visualBounds(
  project: Project,
  instance: Project["symbolInstances"][number],
) {
  const body = bounds(project, instance);
  const definition = project.symbolDefinitions.find(
    (d) => d.id === instance.definitionId,
  )!;
  const width = Math.max(body.right - body.left, definition.widthMm, 12);
  return {
    ...body,
    left: instance.position.x - width / 2,
    right: instance.position.x + width / 2,
    bottom: body.bottom + 6,
  };
}
function collision(
  project: Project,
  id: string,
  ignore: string[] = [],
): boolean {
  const instance = project.symbolInstances.find((s) => s.id === id)!;
  const a = visualBounds(project, instance);
  return project.symbolInstances.some((other) => {
    if (
      other.id === id ||
      ignore.includes(other.id) ||
      other.pageId !== instance.pageId
    )
      return false;
    const b = visualBounds(project, other);
    return (
      a.left < b.right + 2 &&
      a.right > b.left - 2 &&
      a.top < b.bottom + 2 &&
      a.bottom > b.top - 2
    );
  });
}
function checkCollisions(project: Project, ids: string[]) {
  for (const id of ids)
    if (collision(project, id)) throw new Error("Symbols would overlap");
}
function center(project: Project, ids: string[]): Point {
  const boxes = ids.map((id) =>
    bounds(
      project,
      project.symbolInstances.find((s) => s.id === id)!,
    ),
  );
  return {
    x:
      (Math.min(...boxes.map((b) => b.left)) +
        Math.max(...boxes.map((b) => b.right))) /
      2,
    y:
      (Math.min(...boxes.map((b) => b.top)) +
        Math.max(...boxes.map((b) => b.bottom))) /
      2,
  };
}
function reroute(project: Project, ids: string[]) {
  const pages = new Set(
    project.symbolInstances
      .filter((s) => ids.includes(s.id))
      .map((s) => s.pageId),
  );
  for (const path of project.wirePaths) {
    const w = project.wires.find((w) => w.id === path.wireId)!;
    if (pages.has(path.pageId) && pathNeedsReroute(project, path)) {
      const layer = project.layers.find((item) => item.id === path.layerId)!;
      if (layer.locked || !layer.visible)
        throw new Error("A protected wire route would change");
      path.points = routeWire(project, w.fromPinId, w.toPinId);
    }
  }
}
export function ensureLayer(
  project: Project,
  pageId: string,
  name = "Electrical",
): string {
  const old = project.layers.find(
    (l) => l.pageId === pageId && !l.locked && l.visible,
  );
  if (old) return old.id;
  const id = uid();
  project.layers.push({ id, name, pageId, visible: true, locked: false });
  return id;
}
export function place(
  project: Project,
  pageId: string,
  layerId: string,
  kind: Primitive,
  position: Point,
  grid: number,
): string {
  const layer = project.layers.find((l) => l.id === layerId);
  if (!layer || layer.pageId !== pageId || layer.locked || !layer.visible)
    throw new Error("Invalid placement layer");
  const primitive = primitives[kind];
  const definitionId =
    project.symbolDefinitions.find(
      (d) =>
        d.category === "generic" &&
        d.name === kind &&
        d.glyph === primitive.glyph &&
        d.widthMm === primitive.w &&
        d.heightMm === primitive.h &&
        JSON.stringify(d.pins) === JSON.stringify(primitive.pins),
    )?.id ?? uid();
  if (!project.symbolDefinitions.some((d) => d.id === definitionId))
    project.symbolDefinitions.push({
      id: definitionId,
      name: kind,
      category: "generic",
      glyph: primitive.glyph,
      widthMm: primitive.w,
      heightMm: primitive.h,
      pins: primitive.pins.map((p) => ({
        id: p.id,
        position: { ...p.position },
      })),
    });
  const deviceId = uid();
  let index = 1;
  while (
    project.devices.some((d) => d.reference === `${primitive.prefix}${index}`)
  )
    index++;
  const reference = `${primitive.prefix}${index}`;
  project.devices.push({ id: deviceId, name: kind, reference });
  const instanceId = uid();
  project.symbolInstances.push({
    id: instanceId,
    name: reference,
    definitionId,
    deviceId,
    pageId,
    layerId,
    mirrored: false,
    rotation: 0,
    position: { x: quantize(position.x, grid), y: quantize(position.y, grid) },
  });
  for (const pin of primitive.pins) {
    const terminalId = uid();
    project.terminals.push({
      id: terminalId,
      name: pin.id,
      deviceId,
      designation:
        kind === "motor" ? (pin.id === "positive" ? "+" : "-") : pin.id,
      kind:
        kind === "ground"
          ? "pe"
          : kind === "motor" || kind === "fuse"
            ? "power"
            : "control",
    });
    project.pins.push({
      id: uid(),
      name: pin.id,
      terminalId,
      symbolInstanceId: instanceId,
      definitionPinId: pin.id,
    });
  }
  const instance = project.symbolInstances.find((s) => s.id === instanceId)!;
  const original = { ...instance.position };
  const placementStep = grid > 0 ? grid : 1;
  let found = false;
  for (let radius = 0; radius <= 30 && !found; radius++)
    for (let x = -radius; x <= radius && !found; x++)
      for (let y = -radius; y <= radius && !found; y++) {
        if (radius && Math.abs(x) !== radius && Math.abs(y) !== radius)
          continue;
        instance.position = {
          x: original.x + x * placementStep,
          y: original.y + y * placementStep,
        };
        try {
          checkBounds(project, [instanceId]);
          if (!collision(project, instanceId)) found = true;
        } catch {
          /* Search another bounded grid point. */
        }
      }
  if (!found) throw new Error("No free placement position");
  checkBounds(project, [instanceId]);
  reroute(project, [instanceId]);
  validateProject(project);
  return instanceId;
}
export function move(
  project: Project,
  ids: string[],
  delta: Point,
  grid: number,
) {
  editable(project, ids);
  const first = project.symbolInstances.find((s) => s.id === ids[0]);
  if (!first) return project;
  const shift = {
    x: quantize(first.position.x + delta.x, grid) - first.position.x,
    y: quantize(first.position.y + delta.y, grid) - first.position.y,
  };
  for (const s of project.symbolInstances)
    if (ids.includes(s.id))
      s.position = { x: s.position.x + shift.x, y: s.position.y + shift.y };
  checkBounds(project, ids);
  checkCollisions(project, ids);
  reroute(project, ids);
  return project;
}
export function rotate(project: Project, ids: string[]) {
  editable(project, ids);
  if (!ids.length) return project;
  const pivot = center(project, ids);
  for (const instance of project.symbolInstances)
    if (ids.includes(instance.id)) {
      instance.position = transform(
        { x: instance.position.x - pivot.x, y: instance.position.y - pivot.y },
        pivot,
        90,
      );
      instance.rotation = ((instance.rotation + 90) %
        360) as typeof instance.rotation;
    }
  checkBounds(project, ids);
  checkCollisions(project, ids);
  reroute(project, ids);
  return project;
}
export function mirror(project: Project, ids: string[]) {
  editable(project, ids);
  if (!ids.length) return project;
  const pivot = center(project, ids);
  for (const instance of project.symbolInstances)
    if (ids.includes(instance.id)) {
      instance.position.x = 2 * pivot.x - instance.position.x;
      instance.rotation = ((360 - instance.rotation) %
        360) as typeof instance.rotation;
      instance.mirrored = !instance.mirrored;
    }
  checkBounds(project, ids);
  checkCollisions(project, ids);
  reroute(project, ids);
  return project;
}
export function connect(
  project: Project,
  fromPinId: string,
  toPinId: string,
): Project {
  if (fromPinId === toPinId) throw new Error("Choose a different pin");
  const a = project.pins.find((p) => p.id === fromPinId);
  const b = project.pins.find((p) => p.id === toPinId);
  const sa = project.symbolInstances.find((s) => s.id === a?.symbolInstanceId);
  const sb = project.symbolInstances.find((s) => s.id === b?.symbolInstanceId);
  if (!sa || !sb || sa.pageId !== sb.pageId)
    throw new Error("Pins must be on the same page");
  editable(project, [sa.id, sb.id]);
  if (
    project.wires.some(
      (w) =>
        (w.fromPinId === fromPinId && w.toPinId === toPinId) ||
        (w.fromPinId === toPinId && w.toPinId === fromPinId),
    )
  )
    throw new Error("Connection already exists");
  const id = uid();
  project.wires.push({
    id,
    name: `W${project.wires.length + 1}`,
    fromPinId,
    toPinId,
  });
  project.wirePaths.push({
    id: uid(),
    wireId: id,
    pageId: sa.pageId,
    layerId: sa.layerId,
    points: routeWire(project, fromPinId, toPinId),
  });
  return project;
}
export function remove(project: Project, ids: string[]) {
  editable(project, ids);
  const removedPins = new Set(
    project.pins
      .filter((p) => ids.includes(p.symbolInstanceId))
      .map((p) => p.id),
  );
  const removedWires = new Set(
    project.wires
      .filter((w) => removedPins.has(w.fromPinId) || removedPins.has(w.toPinId))
      .map((w) => w.id),
  );
  const devices = new Set(
    project.symbolInstances
      .filter((s) => ids.includes(s.id))
      .map((s) => s.deviceId),
  );
  project.symbolInstances = project.symbolInstances.filter(
    (s) => !ids.includes(s.id),
  );
  project.pins = project.pins.filter((p) => !removedPins.has(p.id));
  project.wires = project.wires.filter((w) => !removedWires.has(w.id));
  project.wirePaths = project.wirePaths.filter(
    (w) => !removedWires.has(w.wireId),
  );
  project.nets = project.nets
    .map((n) => ({
      ...n,
      wireIds: n.wireIds.filter((id) => !removedWires.has(id)),
    }))
    .filter((n) => n.wireIds.length > 0);
  project.annotations = project.annotations.filter(
    (a) => !a.pinId || !removedPins.has(a.pinId),
  );
  project.groups = project.groups
    .map((g) => ({
      ...g,
      symbolIds: g.symbolIds.filter((id) => !ids.includes(id)),
    }))
    .filter((g) => g.symbolIds.length >= 2);
  for (const id of devices)
    if (
      !project.symbolInstances.some((s) => s.deviceId === id) &&
      !project.plcModules.some((m) => m.deviceId === id) &&
      !project.equipment3d.some((e) => e.deviceId === id) &&
      !project.distributionBoards.some((b) => b.deviceId === id) &&
      !project.circuits.some((c) => c.deviceIds.includes(id))
    ) {
      const terminalIds = new Set(
        project.terminals.filter((t) => t.deviceId === id).map((t) => t.id),
      );
      if (
        !project.pins.some((p) => terminalIds.has(p.terminalId)) &&
        !project.terminalStrips.some((t) =>
          t.terminalIds.some((id) => terminalIds.has(id)),
        ) &&
        !project.connectionPoints.some((t) =>
          t.terminalIds.some((id) => terminalIds.has(id)),
        )
      ) {
        project.devices = project.devices.filter((d) => d.id !== id);
        project.terminals = project.terminals.filter((t) => t.deviceId !== id);
      }
    }
  project.findings = project.findings.filter(
    (f) =>
      !f.entityIds.some(
        (id) => ids.includes(id) || removedPins.has(id) || removedWires.has(id),
      ),
  );
  return project;
}
export function align(project: Project, ids: string[], axis: "x" | "y") {
  editable(project, ids);
  const first = project.symbolInstances.find((s) => s.id === ids[0]);
  if (!first) return project;
  for (const s of project.symbolInstances)
    if (ids.includes(s.id))
      s.position = { ...s.position, [axis]: first.position[axis] };
  checkBounds(project, ids);
  checkCollisions(project, ids);
  reroute(project, ids);
  return project;
}

export function removeWire(project: Project, wireId: string): Project {
  const path = project.wirePaths.find((p) => p.wireId === wireId);
  const layer = project.layers.find((l) => l.id === path?.layerId);
  if (!path || !layer || layer.locked || !layer.visible)
    throw new Error("Wire is not editable");
  project.wires = project.wires.filter((w) => w.id !== wireId);
  project.wirePaths = project.wirePaths.filter((p) => p.wireId !== wireId);
  project.nets = project.nets
    .map((n) => ({ ...n, wireIds: n.wireIds.filter((id) => id !== wireId) }))
    .filter((n) => n.wireIds.length > 0);
  project.findings = project.findings.filter(
    (f) => !f.entityIds.includes(wireId) && !f.entityIds.includes(path.id),
  );
  return project;
}

export function paste(
  project: Project,
  source: Project,
  ids: string[],
  pageId: string,
  layerId: string,
  grid: number,
): string[] {
  const layer = project.layers.find((l) => l.id === layerId);
  if (!layer || layer.locked || !layer.visible || layer.pageId !== pageId)
    throw new Error("Invalid target layer");
  const first = source.symbolInstances.find((s) => s.id === ids[0]);
  if (!first) return [];
  const offset = {
    x: quantize(first.position.x + 20, grid) - first.position.x,
    y: quantize(first.position.y + 20, grid) - first.position.y,
  };
  const result: string[] = [];
  const mapping = new Map<string, string>();
  const devices = new Map<string, string>();
  const terms = new Map<string, string>();
  const instances = new Map<string, string>();
  for (const id of ids) {
    const original = source.symbolInstances.find((s) => s.id === id);
    if (!original) throw new Error("Clipboard source missing");
    const definition = source.symbolDefinitions.find(
      (d) => d.id === original.definitionId,
    )!;
    const device = source.devices.find((d) => d.id === original.deviceId)!;
    if (source.plcModules.some((m) => m.deviceId === device.id))
      throw new Error("PLC duplication requires explicit address mapping");
    let definitionId = definition.id;
    const oldDefinition = project.symbolDefinitions.find(
      (d) => d.id === definitionId,
    );
    if (
      oldDefinition &&
      JSON.stringify(oldDefinition) !== JSON.stringify(definition)
    )
      definitionId = uid();
    if (!project.symbolDefinitions.some((d) => d.id === definitionId))
      project.symbolDefinitions.push({
        ...structuredClone(definition),
        id: definitionId,
      });
    let deviceId = devices.get(device.id);
    if (!deviceId) {
      deviceId = uid();
      devices.set(device.id, deviceId);
      const prefix = device.reference.match(/^[A-Za-z]+/)?.[0] ?? "D";
      let index = 1;
      while (project.devices.some((d) => d.reference === `${prefix}${index}`))
        index++;
      let partId = device.partId;
      if (partId) {
        const part = source.manufacturerParts.find((p) => p.id === partId)!;
        if (
          project.manufacturerParts.some(
            (p) =>
              p.id === partId && JSON.stringify(p) !== JSON.stringify(part),
          )
        )
          partId = uid();
        if (!project.manufacturerParts.some((p) => p.id === partId))
          project.manufacturerParts.push({
            ...structuredClone(part),
            id: partId,
          });
      }
      project.devices.push({
        ...structuredClone(device),
        id: deviceId,
        reference: `${prefix}${index}`,
        ...(partId ? { partId } : {}),
      });
      for (const terminal of source.terminals.filter(
        (t) => t.deviceId === device.id,
      )) {
        const terminalId = uid();
        terms.set(terminal.id, terminalId);
        project.terminals.push({ ...terminal, id: terminalId, deviceId });
      }
    }
    const newId = uid();
    instances.set(id, newId);
    project.symbolInstances.push({
      ...structuredClone(original),
      id: newId,
      name: project.devices.find((d) => d.id === deviceId)!.reference,
      deviceId,
      definitionId,
      pageId,
      layerId,
      position: {
        x: original.position.x + offset.x,
        y: original.position.y + offset.y,
      },
    });
    result.push(newId);
    for (const pin of source.pins.filter((p) => p.symbolInstanceId === id)) {
      const pinId = uid();
      mapping.set(pin.id, pinId);
      project.pins.push({
        ...pin,
        id: pinId,
        terminalId: terms.get(pin.terminalId)!,
        symbolInstanceId: newId,
      });
    }
  }
  for (const wire of source.wires)
    if (mapping.has(wire.fromPinId) && mapping.has(wire.toPinId)) {
      connect(
        project,
        mapping.get(wire.fromPinId)!,
        mapping.get(wire.toPinId)!,
      );
      const copy = project.wires[project.wires.length - 1];
      if (wire.conductorId) {
        const conductor = source.conductors.find(
          (c) => c.id === wire.conductorId,
        )!;
        const conductorId = uid();
        project.conductors.push({ ...conductor, id: conductorId });
        copy.conductorId = conductorId;
      }
    }
  for (const group of source.groups)
    if (group.symbolIds.every((id) => instances.has(id)))
      project.groups.push({
        ...group,
        id: uid(),
        pageId,
        symbolIds: group.symbolIds.map((id) => instances.get(id)!),
      });
  checkBounds(project, result);
  checkCollisions(project, result);
  return result;
}

export function insertJunction(
  project: Project,
  wireId: string,
  position: Point,
  grid: number,
  kind: "junction" | "terminal" = "junction",
): string {
  const wire = project.wires.find((w) => w.id === wireId);
  const path = project.wirePaths.find((p) => p.wireId === wireId);
  if (!wire || !path) throw new Error("Unknown wire");
  const oldTarget = wire.toPinId;
  const instance = place(
    project,
    path.pageId,
    path.layerId,
    kind,
    position,
    grid,
  );
  const pin = project.pins.find((p) => p.symbolInstanceId === instance)!.id;
  wire.toPinId = pin;
  path.points = routeWire(project, wire.fromPinId, pin);
  connect(project, pin, oldTarget);
  const second = project.wires[project.wires.length - 1];
  if (wire.conductorId) second.conductorId = wire.conductorId;
  for (const net of project.nets)
    if (net.wireIds.includes(wire.id)) net.wireIds.push(second.id);
  return instance;
}
