import { useRef, useState } from "react";
import { CableEditor } from "./CableEditor";
import { ElectricalMetadata } from "./ElectricalMetadata";
import {
  type analyze,
  type RuleCode,
} from "../../../packages/connectivity-engine/analyze.ts";
import {
  applyNumbering,
  previewNumbering,
  type NumberChange,
  type NumberingScope,
} from "../../../packages/connectivity-engine/numbering.ts";
import type { MessageKey } from "../../../packages/localization";
import type { NativeProjects } from "./useNativeProjects";

const findingFilters = [
  ["all", "all"],
  ["error", "errors"],
  ["warning", "warnings"],
  ["info", "diagnosticInfo"],
] as const satisfies ReadonlyArray<readonly [string, MessageKey]>;

export function ConnectivityPanel({
  native,
  t,
  result,
}: {
  native: NativeProjects;
  t: (key: MessageKey) => string;
  result: ReturnType<typeof analyze> | null;
}) {
  const project = native.project;
  const dialog = useRef<HTMLDialogElement>(null);
  const [scope, setScope] = useState<NumberingScope>("wires");
  const [preview, setPreview] = useState<NumberChange[]>([]);
  const [error, setError] = useState(false);
  const [filter, setFilter] =
    useState<(typeof findingFilters)[number][0]>("all");
  if (!project || !result) return <p>{t("noDiagnostics")}</p>;
  const bySeverity = {
    all: result.findings,
    error: result.findings.filter(({ severity }) => severity === "error"),
    warning: result.findings.filter(({ severity }) => severity === "warning"),
    info: result.findings.filter(({ severity }) => severity === "info"),
  };
  const jump = (ids: string[]) => {
    const pin = project.pins.find(
      (p) => ids.includes(p.id) || ids.includes(p.terminalId),
    );
    const instance = project.symbolInstances.find(
      (s) =>
        ids.includes(s.id) ||
        ids.includes(s.deviceId) ||
        s.id === pin?.symbolInstanceId,
    );
    const path = project.wirePaths.find((p) => ids.includes(p.wireId));
    const pageId = instance?.pageId ?? path?.pageId;
    if (pageId) native.selectPage(pageId);
  };
  return (
    <section className="connectivity-panel" aria-label={t("connectivity")}>
      <div
        className="diagnostic-filters"
        role="group"
        aria-label={t("diagnostics")}
      >
        {findingFilters.map(([id, key]) => (
          <button
            type="button"
            key={id}
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
          >
            {t(key)} ({bySeverity[id].length})
          </button>
        ))}
      </div>
      {bySeverity[filter].length > 0 ? (
        <ul className="diagnostic-findings">
          {bySeverity[filter].map((finding, index) => (
            <li key={index} data-severity={finding.severity}>
              <button type="button" onClick={() => jump(finding.entityIds)}>
                {t(("rule" + finding.code) as `rule${RuleCode}`)}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-hint">{t("diagnosticEmpty")}</p>
      )}
      <p>{t("connectivityScope")}</p>
      <details>
        <summary>
          {t("netlist")} ({result.nets.length})
        </summary>
        <ul>
          {result.nets.map((net) => (
            <li key={net.id}>
              {net.name} · {net.labels.join(", ")} ·{" "}
              {net.terminalIds.map((id) => {
                const terminal = project.terminals.find(
                  (item) => item.id === id,
                )!;
                const device = project.devices.find(
                  (item) => item.id === terminal.deviceId,
                )!;
                return (
                  <button key={id} onClick={() => jump([id])}>
                    {device.reference}:{terminal.designation}
                  </button>
                );
              })}
            </li>
          ))}
        </ul>
      </details>
      <details>
        <summary>
          {t("connections")} ({result.connections.length})
        </summary>
        <table className="native-bom">
          <thead>
            <tr>
              <th>{t("wireTool")}</th>
              <th>{t("source")}</th>
              <th>{t("destination")}</th>
              <th>{t("drawingLength")}</th>
              <th>{t("physicalLength")}</th>
              <th>{t("cableCore")}</th>
              <th>{t("crossSection")}</th>
              <th>{t("coreColor")}</th>
              <th>{t("cable")}</th>
            </tr>
          </thead>
          <tbody>
            {result.connections.map((record) => (
              <tr key={record.wireId}>
                <td>{record.wireNumber}</td>
                {[record.from, record.to].map((end, index) => (
                  <td key={index}>
                    <button onClick={() => jump([end.terminalId])}>
                      {end.reference}:{end.designation}
                    </button>
                  </td>
                ))}
                <td>
                  {record.drawingLengthMm === null
                    ? "—"
                    : `${record.drawingLengthMm.toFixed(2)} mm`}
                </td>
                <td>
                  {record.physicalLengthM === null
                    ? "—"
                    : `${record.physicalLengthM} m`}
                </td>
                <td>
                  {project.conductors.find(
                    (core) => core.id === record.conductorId,
                  )?.name ?? "—"}
                </td>
                <td>
                  {record.crossSectionMm2 === null
                    ? "—"
                    : `${record.crossSectionMm2} mm²`}
                </td>
                <td>{record.color ?? "—"}</td>
                <td>
                  {record.cableIds
                    .map((id) => {
                      const cable = project.cables.find((c) => c.id === id)!;
                      return (
                        cable.name +
                        (cable.shielded ? ` (${t("shielded")})` : "")
                      );
                    })
                    .join(", ") || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          try {
            setPreview(
              previewNumbering(
                project,
                scope,
                String(new FormData(event.currentTarget).get("strip") ?? ""),
              ),
            );
            setError(false);
            dialog.current?.showModal();
          } catch {
            setError(true);
          }
        }}
      >
        <label>
          {t("renumber")}
          <select
            aria-label={t("renumber")}
            value={scope}
            onChange={(e) => setScope(e.target.value as NumberingScope)}
          >
            <option value="wires">{t("wireTool")}</option>
            <option value="devices">{t("device")}</option>
            <option value="terminalStrip">{t("terminalStrip")}</option>
          </select>
        </label>
        {scope === "terminalStrip" && (
          <select name="strip" aria-label={t("terminalStrip")} required>
            {project.terminalStrips.map((strip) => (
              <option key={strip.id} value={strip.id}>
                {strip.name}
              </option>
            ))}
          </select>
        )}
        <button>{t("previewNumbering")}</button>
        {error && <p role="alert">{t("invalidProject")}</p>}
      </form>
      <CableEditor native={native} t={t} />
      <ElectricalMetadata native={native} t={t} />
      <dialog ref={dialog} aria-label={t("previewNumbering")}>
        <h2>{t("previewNumbering")}</h2>
        <ul>
          {preview.map((change) => (
            <li key={change.id}>
              {change.before} → {change.after}
            </li>
          ))}
        </ul>
        {!preview.length && <p>{t("noRecords")}</p>}
        <button
          disabled={!preview.length}
          onClick={() => {
            native.update((draft) => applyNumbering(draft, preview));
            dialog.current?.close();
          }}
        >
          {t("apply")}
        </button>
        <button onClick={() => dialog.current?.close()}>{t("cancel")}</button>
      </dialog>
    </section>
  );
}
