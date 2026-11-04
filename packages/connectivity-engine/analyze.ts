import {
  collections,
  validateProject,
  type Project,
} from "../electrical-model/project.ts";
import { pathNeedsReroute } from "../schematic-editor/geometry.ts";
export type RuleCode =
  | "MODEL_INVALID"
  | "DUPLICATE_DEVICE_REFERENCE"
  | "DUPLICATE_WIRE_NUMBER"
  | "DUPLICATE_CONNECTION"
  | "OPEN_TERMINAL"
  | "TERMINAL_CAPACITY"
  | "MULTIPLE_NET_LABELS"
  | "CORE_ON_MULTIPLE_NETS"
  | "SHIELD_NOT_BONDED"
  | "SHIELD_CONFIGURATION"
  | "ROUTE_GEOMETRY";
export type ConnectivityFinding = {
  code: RuleCode;
  severity: "error" | "warning" | "info";
  entityIds: string[];
};
export type ComputedNet = {
  id: string;
  name: string;
  terminalIds: string[];
  pinIds: string[];
  wireIds: string[];
  labels: string[];
};
export type ConnectionRecord = {
  wireId: string;
  wireNumber: string;
  netId: string;
  from: {
    deviceId: string;
    reference: string;
    terminalId: string;
    designation: string;
    pageIds: string[];
  };
  to: {
    deviceId: string;
    reference: string;
    terminalId: string;
    designation: string;
    pageIds: string[];
  };
  drawingLengthMm: number | null;
  physicalLengthM: number | null;
  color: string | null;
  crossSectionMm2: number | null;
  conductorId: string | null;
  cableIds: string[];
};
export type ConnectivityAnalysis = {
  nets: ComputedNet[];
  connections: ConnectionRecord[];
  findings: ConnectivityFinding[];
};
function hash(value: string): string {
  let a = 2166136261,
    b = 5381;
  for (let i = 0; i < value.length; i++) {
    a = Math.imul(a ^ value.charCodeAt(i), 16777619) >>> 0;
    b = (Math.imul(b, 33) ^ value.charCodeAt(i)) >>> 0;
  }
  return a.toString(16).padStart(8, "0") + b.toString(16).padStart(8, "0");
}
function duplicates(items: { id: string; value: string }[]): string[][] {
  const groups = new Map<string, string[]>();
  for (const item of items) {
    const key = item.value.trim().normalize("NFC");
    groups.set(key, [...(groups.get(key) ?? []), item.id]);
  }
  return [...groups.values()].filter((ids) => ids.length > 1);
}
export function analyze(
  input: Project,
  priorNets: Project["nets"] = input.nets,
  reservedIds: string[] = [],
): ConnectivityAnalysis {
  const findings: ConnectivityFinding[] = [];
  const add = (
    code: RuleCode,
    severity: ConnectivityFinding["severity"],
    ids: string[],
  ) => findings.push({ code, severity, entityIds: [...new Set(ids)].sort() });
  for (const ids of duplicates(
    input.devices.map((device) => ({ id: device.id, value: device.reference })),
  ))
    add("DUPLICATE_DEVICE_REFERENCE", "error", ids);
  for (const ids of duplicates(
    input.wires.map((wire) => ({ id: wire.id, value: wire.name })),
  ))
    add("DUPLICATE_WIRE_NUMBER", "error", ids);
  let project: Project;
  try {
    project = validateProject(input);
  } catch {
    add("MODEL_INVALID", "error", [input.id]);
    return { nets: [], connections: [], findings };
  }
  const parent = new Map(
    project.terminals.map((terminal) => [terminal.id, terminal.id]),
  );
  const find = (id: string): string => {
    let root = id;
    while (parent.get(root) !== root) root = parent.get(root)!;
    while (id !== root) {
      const next = parent.get(id)!;
      parent.set(id, root);
      id = next;
    }
    return root;
  };
  const join = (a: string, b: string) => {
    const x = find(a),
      y = find(b);
    if (x !== y) parent.set(x < y ? y : x, x < y ? x : y);
  };
  const pins = new Map(project.pins.map((pin) => [pin.id, pin]));
  const terminals = new Map(
    project.terminals.map((terminal) => [terminal.id, terminal]),
  );
  const devices = new Map(project.devices.map((device) => [device.id, device]));
  const wireByTerminal = new Map<string, Set<string>>();
  for (const wire of project.wires) {
    const a = pins.get(wire.fromPinId)!.terminalId,
      b = pins.get(wire.toPinId)!.terminalId;
    join(a, b);
    for (const terminal of [a, b]) {
      if (!wireByTerminal.has(terminal))
        wireByTerminal.set(terminal, new Set());
      wireByTerminal.get(terminal)!.add(wire.id);
    }
  }
  for (const point of project.connectionPoints)
    for (const terminal of point.terminalIds.slice(1))
      join(point.terminalIds[0], terminal);
  for (const cable of project.cables) {
    const bonds = cable.shieldBondTerminalIds ?? [];
    if (cable.shielded) {
      if (!bonds.length) add("SHIELD_NOT_BONDED", "warning", [cable.id]);
      for (const id of bonds.slice(1)) join(bonds[0], id);
    } else if (bonds.length) add("SHIELD_CONFIGURATION", "error", [cable.id]);
  }
  const aliases = new Map<string, string>();
  for (const annotation of project.annotations) {
    if (!annotation.pinId) continue;
    const terminal = pins.get(annotation.pinId)!.terminalId;
    const label = annotation.text.trim().normalize("NFC");
    if (!label) continue;
    const previous = aliases.get(label);
    if (previous) join(previous, terminal);
    else aliases.set(label, terminal);
  }
  const groups = new Map<string, string[]>();
  for (const id of parent.keys()) {
    const root = find(id);
    groups.set(root, [...(groups.get(root) ?? []), id]);
  }
  const used = new Set<string>([project.id, ...reservedIds]);
  for (const key of collections)
    if (key !== "nets" && key !== "findings")
      for (const entity of project[key]) used.add(entity.id);
  const allocate = (prefix: string, key: string) => {
    const base = `${prefix}-${hash(key)}`;
    let id = base,
      index = 1;
    while (used.has(id)) id = `${base}-${index++}`;
    used.add(id);
    return id;
  };
  const pinsByTerminal = new Map<string, string[]>();
  for (const pin of project.pins)
    pinsByTerminal.set(pin.terminalId, [
      ...(pinsByTerminal.get(pin.terminalId) ?? []),
      pin.id,
    ]);
  const labelsByRoot = new Map<string, string[]>();
  for (const [label, terminal] of aliases) {
    const root = find(terminal);
    labelsByRoot.set(root, [...(labelsByRoot.get(root) ?? []), label]);
  }
  const allLabels = new Set([
    ...aliases.keys(),
    ...priorNets.map((net) => net.name),
  ]);
  let number = 1;
  const nets: ComputedNet[] = [];
  for (const members of [...groups.values()]
    .map((ids) => ids.sort())
    .sort((a, b) => compare(a.join("|"), b.join("|")))) {
    const memberSet = new Set(members);
    const pinIds = members.flatMap((id) => pinsByTerminal.get(id) ?? []).sort();
    const wireIds = [
      ...new Set(members.flatMap((id) => [...(wireByTerminal.get(id) ?? [])])),
    ].sort();
    const labels = (labelsByRoot.get(find(members[0])) ?? []).sort();
    const matching = priorNets
      .filter((net) => !used.has(net.id))
      .map((net) => ({
        net,
        score:
          (net.terminalIds ?? []).filter((id) => memberSet.has(id)).length * 2 +
          net.wireIds.filter((id) => wireIds.includes(id)).length * 4,
      }))
      .filter((value) => value.score > 0)
      .sort((a, b) => b.score - a.score || compare(a.net.id, b.net.id))[0]?.net;
    let name = labels[0] ?? matching?.name;
    if (!name) {
      do {
        name = `N${String(number++).padStart(3, "0")}`;
      } while (allLabels.has(name));
      allLabels.add(name);
    }
    const id = matching?.id ?? allocate("net", members.join("|"));
    used.add(id);
    const net = { id, name, terminalIds: members, pinIds, wireIds, labels };
    nets.push(net);
    if (labels.length > 1) add("MULTIPLE_NET_LABELS", "warning", pinIds);
  }
  const netByTerminal = new Map(
    nets.flatMap((net) => net.terminalIds.map((id) => [id, net.id] as const)),
  );
  for (const terminal of project.terminals) {
    const count = wireByTerminal.get(terminal.id)?.size ?? 0;
    const net = nets.find((net) => net.id === netByTerminal.get(terminal.id))!;
    if (
      !count &&
      net.terminalIds.length === 1 &&
      (pinsByTerminal.has(terminal.id) || terminal.required)
    )
      add("OPEN_TERMINAL", terminal.required ? "error" : "warning", [
        terminal.id,
      ]);
    if (terminal.capacity !== undefined && count > terminal.capacity)
      add("TERMINAL_CAPACITY", "error", [terminal.id]);
  }
  const endpoints = new Map<string, string[]>();
  for (const wire of project.wires) {
    const key =
      [wire.fromPinId, wire.toPinId].sort().join("|") +
      `|${wire.conductorId ?? ""}`;
    endpoints.set(key, [...(endpoints.get(key) ?? []), wire.id]);
  }
  for (const ids of endpoints.values())
    if (ids.length > 1) add("DUPLICATE_CONNECTION", "warning", ids);
  for (const conductor of project.conductors) {
    const wires = project.wires.filter(
      (wire) => wire.conductorId === conductor.id,
    );
    const roots = new Set(
      wires.map((wire) =>
        netByTerminal.get(pins.get(wire.fromPinId)!.terminalId),
      ),
    );
    if (roots.size > 1)
      add("CORE_ON_MULTIPLE_NETS", "error", [
        conductor.id,
        ...wires.map((wire) => wire.id),
      ]);
  }
  const endpoint = (pinId: string) => {
    const pin = pins.get(pinId)!,
      terminal = terminals.get(pin.terminalId)!,
      device = devices.get(terminal.deviceId)!;
    const pageIds = [
      ...new Set(
        project.pins
          .filter((p) => p.terminalId === terminal.id)
          .map(
            (p) =>
              project.symbolInstances.find((s) => s.id === p.symbolInstanceId)!
                .pageId,
          ),
      ),
    ].sort();
    return {
      deviceId: device.id,
      reference: device.reference,
      terminalId: terminal.id,
      designation: terminal.designation,
      pageIds,
    };
  };
  const connections = project.wires.map((wire) => {
    const path = project.wirePaths.find((path) => path.wireId === wire.id);
    let drawingLengthMm: number | null = null;
    if (path) {
      const total = path.points
        .slice(1)
        .reduce(
          (sum, point, index) =>
            sum +
            Math.hypot(
              point.x - path.points[index].x,
              point.y - path.points[index].y,
            ),
          0,
        );
      if (Number.isFinite(total)) drawingLengthMm = total;
      if (pathNeedsReroute(project, path))
        add("ROUTE_GEOMETRY", "warning", [wire.id, path.id]);
    }
    const conductor = project.conductors.find((c) => c.id === wire.conductorId);
    return {
      wireId: wire.id,
      wireNumber: wire.name,
      netId: netByTerminal.get(pins.get(wire.fromPinId)!.terminalId)!,
      from: endpoint(wire.fromPinId),
      to: endpoint(wire.toPinId),
      drawingLengthMm,
      physicalLengthM: wire.physicalLengthM ?? null,
      color: wire.color ?? conductor?.color ?? null,
      crossSectionMm2: conductor?.crossSectionMm2 ?? null,
      conductorId: wire.conductorId ?? null,
      cableIds: project.cables
        .filter((c) => conductor && c.conductorIds.includes(conductor.id))
        .map((c) => c.id),
    };
  });
  return {
    nets,
    connections,
    findings: findings.sort(
      (a, b) =>
        compare(a.code, b.code) ||
        compare(a.entityIds.join("|"), b.entityIds.join("|")),
    ),
  };
}
export const ruleMessages: Record<RuleCode, string> = {
  MODEL_INVALID: "The native document has invalid references or values.",
  DUPLICATE_DEVICE_REFERENCE: "Device references are duplicated.",
  DUPLICATE_WIRE_NUMBER: "Wire numbers are duplicated.",
  DUPLICATE_CONNECTION:
    "Equivalent unqualified wire connections are duplicated.",
  OPEN_TERMINAL:
    "A represented or required terminal has no declared connection.",
  TERMINAL_CAPACITY: "The declared terminal wire capacity is exceeded.",
  MULTIPLE_NET_LABELS:
    "A connected net has multiple explicit labels; review the aliases.",
  CORE_ON_MULTIPLE_NETS: "One conductor core is assigned to disconnected nets.",
  SHIELD_NOT_BONDED:
    "A shielded cable has no declared shield bond; review the design.",
  SHIELD_CONFIGURATION:
    "Shield bonds are declared without a shielded cable configuration.",
  ROUTE_GEOMETRY:
    "A wire route is obstructed, diagonal or detached from its native endpoints.",
};
function compare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
export function synchronizeConnectivity(project: Project): Project {
  const priorNets = project.nets;
  const preserved = project.findings.filter(
    (finding) => !finding.code.startsWith("CONNECT_"),
  );
  const result = analyze(
    { ...project, nets: [], findings: [] },
    priorNets,
    preserved.map((f) => f.id),
  );
  if (result.findings.some((finding) => finding.code === "MODEL_INVALID"))
    throw new Error("Invalid native model");
  project.nets = result.nets;
  project.findings = [];
  const used = new Set<string>([project.id]);
  for (const key of collections)
    for (const entity of project[key]) used.add(entity.id);
  for (const finding of preserved) {
    const ids = finding.entityIds.map((id) => {
      if (used.has(id)) return id;
      const old = priorNets.find((net) => net.id === id);
      if (!old) return id;
      return (
        result.nets.find(
          (net) =>
            net.wireIds.some((wire) => old.wireIds.includes(wire)) ||
            net.terminalIds.some((terminal) =>
              old.terminalIds?.includes(terminal),
            ),
        )?.id ?? id
      );
    });
    if (ids.every((id) => used.has(id))) {
      project.findings.push({ ...finding, entityIds: [...new Set(ids)] });
      used.add(finding.id);
    }
  }
  for (const finding of result.findings) {
    const base = `finding-${hash(finding.code + finding.entityIds.join("|"))}`;
    let id = base,
      index = 1;
    while (used.has(id)) id = `${base}-${index++}`;
    used.add(id);
    project.findings.push({
      id,
      name: finding.code,
      code: `CONNECT_${finding.code}`,
      severity: finding.severity,
      entityIds: finding.entityIds,
      message: ruleMessages[finding.code],
    });
  }
  return validateProject(project);
}
