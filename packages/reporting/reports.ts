import type { Project } from "../electrical-model/project.ts";
import { xmlText } from "../building-design/documentation.ts";
import { calculateRecord } from "../engineering-core/calculations.ts";
export const reportKinds = [
  "devices",
  "bom",
  "cables",
  "terminals",
  "connections",
  "plc",
  "drawings",
  "revisions",
  "calculations",
] as const;
export type ReportKind = (typeof reportKinds)[number];
export type ReportTable = {
  columns: string[];
  rows: (string | number | null)[][];
};
/** Every row derives from persisted native entities; unknown values stay blank. */
export function projectReport(
  project: Project,
  kind: ReportKind,
  label: (key: string) => string = (key) => key,
): ReportTable {
  const device = (id: string) => project.devices.find((d) => d.id === id)!;
  const terminal = (pinId: string) => {
    const pin = project.pins.find((p) => p.id === pinId)!;
    const t = project.terminals.find((item) => item.id === pin.terminalId)!;
    return `${device(t.deviceId).reference}:${t.designation}`;
  };
  switch (kind) {
    case "devices":
      return {
        columns: ["reference", "device", "manufacturer", "partNumber"],
        rows: project.devices.map((d) => {
          const part = project.manufacturerParts.find((p) => p.id === d.partId);
          return [
            d.reference,
            d.name,
            part?.manufacturer ?? null,
            part?.partNumber ?? null,
          ];
        }),
      };
    case "bom": {
      const used = new Map<
        string,
        { manufacturer: string | null; part: string | null; refs: string[] }
      >();
      for (const d of project.devices) {
        const part = project.manufacturerParts.find((p) => p.id === d.partId);
        const key = part?.id ?? `unassigned:${d.id}`;
        const row = used.get(key) ?? {
          manufacturer: part?.manufacturer ?? null,
          part: part?.partNumber ?? null,
          refs: [],
        };
        row.refs.push(d.reference);
        used.set(key, row);
      }
      return {
        columns: ["manufacturer", "partNumber", "quantity", "reference"],
        rows: [...used.values()].map((row) => [
          row.manufacturer,
          row.part,
          row.refs.length,
          row.refs.join("; "),
        ]),
      };
    }
    case "cables":
      return {
        columns: ["cable", "physicalLength", "cableCore", "crossSection"],
        rows: project.cables.flatMap((cable) =>
          cable.conductorIds.map((id) => {
            const core = project.conductors.find((c) => c.id === id)!;
            return [
              cable.name,
              cable.lengthM ?? null,
              core.name,
              core.crossSectionMm2,
            ];
          }),
        ),
      };
    case "terminals":
      return {
        columns: ["reference", "terminal", "terminalKind", "documentedWires"],
        rows: project.terminals.map((t) => {
          const pins = new Set(
            project.pins.filter((p) => p.terminalId === t.id).map((p) => p.id),
          );
          return [
            device(t.deviceId).reference,
            t.designation,
            t.kind,
            project.wires
              .filter((w) => pins.has(w.fromPinId) || pins.has(w.toPinId))
              .map((w) => w.name)
              .join("; "),
          ];
        }),
      };
    case "connections":
      return {
        columns: [
          "documentedWires",
          "reportFrom",
          "reportTo",
          "physicalLength",
        ],
        rows: project.wires.map((w) => [
          w.name,
          terminal(w.fromPinId),
          terminal(w.toPinId),
          w.physicalLengthM ?? null,
        ]),
      };
    case "plc":
      return {
        columns: [
          "reference",
          "device",
          "reportChannel",
          "reportAddress",
          "reportDataType",
        ],
        rows: project.plcAddresses.map((a) => {
          const module = project.plcModules.find((m) => m.id === a.moduleId)!;
          return [
            device(module.deviceId).reference,
            module.name,
            a.channel,
            a.address,
            a.dataType,
          ];
        }),
      };
    case "drawings":
      return {
        columns: [
          "document",
          "pageName",
          "reportOrder",
          "reportWidth",
          "reportHeight",
        ],
        rows: [...project.pages]
          .sort((a, b) => a.order - b.order)
          .map((p) => [
            project.documents.find((d) => d.id === p.documentId)!.name,
            p.name,
            p.order,
            p.widthMm,
            p.heightMm,
          ]),
      };
    case "revisions":
      return {
        columns: ["reportRevision", "reportDate", "reportDescription"],
        rows: project.revisions.map((r) => [
          r.name,
          r.createdAt,
          r.description,
        ]),
      };
    case "calculations":
      return {
        columns: [
          "reportCalculation",
          "reportMethod",
          "reportInputs",
          "reportAssumptions",
          "reportResults",
          "reportChecks",
          "reportSources",
        ],
        rows: project.calculations.map((c) => {
          const inputs = Object.entries(c.inputs)
            .map(([key, value]) => `${key}: ${value} ${c.units[key] ?? ""}`)
            .join("; ");
          try {
            const result = calculateRecord(c);
            return [
              c.name,
              `${c.methodReference} · ${result.formula}`,
              inputs,
              [
                ...result.assumptionKeys.map(label),
                ...result.warningKeys.map(label),
                ...result.evidence,
              ].join("; "),
              result.values
                .map(
                  (value) =>
                    `${label(value.labelKey)}: ${value.value} ${value.unit}`,
                )
                .join("; "),
              result.checks
                .map(
                  (check) =>
                    `${label(check.labelKey)}: ${label(check.passed ? "reportCheckMet" : "reportCheckNotMet")}`,
                )
                .join("; "),
              result.sources
                .map((source) => `${source.title}: ${source.url}`)
                .join("; "),
            ];
          } catch {
            return [
              c.name,
              c.methodReference,
              inputs,
              c.assumptions.join("; "),
              label("reportCalculationUnavailable"),
              "",
              "",
            ];
          }
        }),
      };
  }
}
export function reportHtml(
  title: string,
  table: ReportTable,
  label: (key: string) => string,
) {
  return `<h1>${xmlText(title)}</h1><table><thead><tr>${table.columns.map((column) => `<th>${xmlText(label(column))}</th>`).join("")}</tr></thead><tbody>${table.rows.map((row) => `<tr>${row.map((value) => `<td>${xmlText(value === null ? "" : String(value))}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}
