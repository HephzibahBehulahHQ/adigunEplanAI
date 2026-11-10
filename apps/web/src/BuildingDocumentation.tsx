import type { Project } from "../../../packages/electrical-model/project.ts";
import type { MessageKey } from "../../../packages/localization";
import {
  buildingDocumentation,
  buildingSingleLineSvg,
} from "../../../packages/building-design/documentation.ts";
import { csvReport } from "../../../packages/reporting/csv.ts";
import { downloadFile } from "./download";

export function BuildingDocumentation({
  project,
  floorId,
  t,
}: {
  project: Project;
  floorId: string;
  t: (key: MessageKey) => string;
}) {
  const report = buildingDocumentation(project, floorId);
  const svg = buildingSingleLineSvg(project, floorId, {
    title: t("buildingSingleLine"),
    note: t("assignmentDiagramNote"),
    unknown: t("circuitUnknownLoads"),
  });
  const panelRows = [
    [
      t("distributionBoardName"),
      t("floorCircuits"),
      t("device"),
      "V",
      t("circuitPhases"),
      "W",
      t("circuitUnknownLoads"),
    ],
    ...report.boards.flatMap((board) =>
      board.circuits.map((circuit) => [
        board.reference,
        circuit.name,
        circuit.devices.map((device) => device.reference).join("; "),
        circuit.voltageV,
        circuit.phases,
        circuit.totalConnectedLoadW,
        circuit.unknownLoadCount,
      ]),
    ),
  ];
  return (
    <details className="building-documentation">
      <summary>{t("buildingDocumentation")}</summary>
      <p>{t("assignmentDiagramNote")}</p>
      <button
        onClick={() =>
          downloadFile("building-single-line.svg", svg, "image/svg+xml")
        }
      >
        {t("downloadSingleLine")}
      </button>
      <button
        onClick={() =>
          downloadFile(
            "panel-schedule.csv",
            csvReport(panelRows),
            "text/csv;charset=utf-8",
          )
        }
      >
        {t("downloadPanelSchedule")}
      </button>
      {report.boards.length > 0 ? (
        <img
          className="single-line-preview"
          alt={t("buildingSingleLine")}
          src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`}
        />
      ) : (
        <p>{t("noRecords")}</p>
      )}
      <h3>{t("earthingDocumentation")}</h3>
      <p>{t("earthingDocumentationNote")}</p>
      <button
        onClick={() =>
          downloadFile(
            "earthing-documentation.csv",
            csvReport([
              [t("device"), t("terminal"), t("documentedWires")],
              ...report.earthing.map((row) => [
                row.device,
                row.terminal,
                row.wireNames.join("; "),
              ]),
            ]),
            "text/csv;charset=utf-8",
          )
        }
      >
        {t("downloadEarthing")}
      </button>
      <div className="native-table-scroll">
        <table className="native-bom" aria-label={t("earthingDocumentation")}>
          <thead>
            <tr>
              <th>{t("device")}</th>
              <th>{t("terminal")}</th>
              <th>{t("documentedWires")}</th>
            </tr>
          </thead>
          <tbody>
            {report.earthing.map((row) => (
              <tr key={row.terminalId}>
                <td>{row.device}</td>
                <td>{row.terminal}</td>
                <td>{row.wireNames.join(", ") || t("unconnectedPe")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
