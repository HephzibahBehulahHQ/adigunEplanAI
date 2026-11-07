import type { Project } from "../electrical-model/project.ts";
import {
  analyze,
  type ConnectivityFinding,
} from "../connectivity-engine/analyze.ts";
export type LocalTool = "summary" | "connections" | "bom" | "selection";
/** Bounded, deterministic command routing. Document text cannot register tools or perform writes. */
export function localIntent(query: string): LocalTool | null {
  if (query.length > 1000) return null;
  const text = query.normalize("NFKC").toLowerCase().trim();
  if (/\b(bom|materials?|parts|stückliste)\b|ohun èlò/.test(text)) return "bom";
  if (/connect|validat|check|prüf|fehler|ìsopọ̀|ṣàyẹ̀wò/.test(text))
    return "connections";
  if (
    /select|device|what does|what is this|ausgewählt|gerät|tí a yàn/.test(text)
  )
    return "selection";
  if (/project|summary|inspect|projekt|iṣẹ́|dátà/.test(text)) return "summary";
  return null;
}
export function inspectProject(
  project: Project,
  tool: LocalTool,
  selectedDeviceId: string | null,
) {
  const result = analyze(project);
  const device =
    project.devices.find((item) => item.id === selectedDeviceId) ?? null;
  const terminalIds = new Set(
    project.terminals
      .filter((item) => item.deviceId === device?.id)
      .map((item) => item.id),
  );
  const pinIds = new Set(
    project.pins
      .filter((item) => terminalIds.has(item.terminalId))
      .map((item) => item.id),
  );
  return {
    tool,
    projectId: project.id,
    revision: project.updatedAt,
    name: project.name,
    counts: {
      pages: project.pages.length,
      devices: project.devices.length,
      wires: project.wires.length,
      nets: result.nets.length,
      errors: result.findings.filter((item) => item.severity === "error")
        .length,
      warnings: result.findings.filter((item) => item.severity === "warning")
        .length,
    },
    findings: tool === "connections" ? result.findings : [],
    devices:
      tool === "bom"
        ? project.devices.map((item) => ({
            reference: item.reference,
            name: item.name,
            partNumber:
              project.manufacturerParts.find((part) => part.id === item.partId)
                ?.partNumber ?? null,
          }))
        : [],
    selected:
      tool === "selection" && device
        ? {
            reference: device.reference,
            name: device.name,
            terminals: terminalIds.size,
            wires: project.wires.filter(
              (wire) => pinIds.has(wire.fromPinId) || pinIds.has(wire.toPinId),
            ).length,
            mounted: project.equipment3d.some(
              (item) => item.deviceId === device.id,
            ),
          }
        : null,
  };
}
export type Inspection = ReturnType<typeof inspectProject>;
export const findingKey = (finding: ConnectivityFinding) =>
  `${finding.code}:${[...finding.entityIds].sort().join(",")}`;
export function nextSuggestion(
  findings: ConnectivityFinding[],
  now: number,
  lastAt: number,
  editing: boolean,
  dismissed: ReadonlySet<string>,
) {
  if (
    editing ||
    !Number.isFinite(now) ||
    !Number.isFinite(lastAt) ||
    now - lastAt < 25000
  )
    return null;
  return (
    findings.find((finding) => !dismissed.has(findingKey(finding))) ?? null
  );
}
