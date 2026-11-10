import { annotationLayout } from "../../../packages/reporting/annotation-layout.ts";
import {
  drawingIndex,
  projectBom,
  reportCsv,
} from "../../../packages/electrical-model/project-reports.ts";
import { CommandIcon } from "./WorkspaceRibbon";
import { useState } from "react";
import { dictionaries, type MessageKey } from "../../../packages/localization";
import type { NativeProjects } from "./useNativeProjects";
import {
  reportKinds,
  projectReport,
  reportHtml,
  type ReportKind,
} from "../../../packages/reporting/reports.ts";
import {
  schematicSvg,
  printDocument,
} from "../../../packages/reporting/drawings.ts";
import { csvReport } from "../../../packages/reporting/csv.ts";
import { downloadFile } from "./download";
import { schematicDxf } from "../../../packages/reporting/dxf.ts";

export function ReportsPanel({
  native,
  t,
}: {
  native: NativeProjects;
  t: (key: MessageKey) => string;
}) {
  const [kind, setKind] = useState<ReportKind | "drawing">("drawing");
  const [pageId, setPageId] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!native.project) return <p>{t("noProject")}</p>;
  const project = native.project;
  const page =
    project.pages.find(
      (item) => item.id === (pageId || native.selectedPageId),
    ) ?? project.pages[0];
  const table =
    kind === "drawing"
      ? null
      : projectReport(project, kind, (key) => t(key as MessageKey));
  const svg =
    kind === "drawing" && page ? schematicSvg(project, page.id) : null;
  const reportNames: Record<ReportKind | "drawing", MessageKey> = {
    drawing: "reportDrawing",
    devices: "reportDevices",
    bom: "bom",
    cables: "reportCables",
    terminals: "reportTerminals",
    connections: "reportConnections",
    plc: "reportPlc",
    drawings: "reportDrawingIndex",
    revisions: "reportRevisions",
    calculations: "reportCalculations",
  };
  const label = (key: string) => t(key as MessageKey);
  const outputLanguage =
    project.documents.find((item) => item.id === page?.documentId)
      ?.outputLanguage ?? "en";
  const outputLabel = (key: string) =>
    dictionaries[outputLanguage][key as MessageKey];
  const outputTable =
    kind === "drawing" ? null : projectReport(project, kind, outputLabel);
  function downloadTable(report: ReportKind) {
    const data = projectReport(project, report, outputLabel);
    downloadFile(
      `${report}.csv`,
      csvReport([data.columns.map(outputLabel), ...data.rows]),
      "text/csv;charset=utf-8",
    );
  }
  function printReport(report: ReportKind | "drawing") {
    setError(false);
    const title = `${project.name} · ${outputLabel(reportNames[report])}`;
    const content =
      report === "drawing"
        ? svg
        : reportHtml(
            title,
            projectReport(project, report, outputLabel),
            outputLabel,
          );
    if (!content) return;
    const popup = window.open("", "_blank");
    if (!popup) {
      setError(true);
      return;
    }
    popup.document.open();
    popup.document.write(
      printDocument(title, content, report === "drawing" ? page : undefined),
    );
    popup.document.close();
    void popup.document.fonts.ready.then(() => {
      if (!popup.closed) {
        popup.focus();
        popup.print();
      }
    });
  }
  const shortcuts: { label: string; disabled?: boolean; run: () => void }[] = [
    {
      label: t("reportDrawingIndexCsv"),
      disabled: !project.pages.length,
      run: () =>
        downloadFile(
          "drawing-index.csv",
          reportCsv([
            [
              t("document"),
              t("pageName"),
              t("cabinetWidth"),
              t("cabinetHeight"),
            ],
            ...drawingIndex(project),
          ]),
          "text/csv;charset=utf-8",
        ),
    },
    ...(["terminals", "cables", "devices"] as const).map((report) => ({
      label: `${t(reportNames[report])} (CSV)`,
      run: () => downloadTable(report),
    })),
    {
      label: t("reportBomCsv"),
      disabled: !project.devices.length,
      run: () =>
        downloadFile(
          "bill-of-materials.csv",
          reportCsv([
            [t("reference"), t("device"), t("partNumber"), t("quantity")],
            ...projectBom(project).map(
              ({ reference, name, partNumber, quantity }) => [
                reference,
                name,
                partNumber,
                quantity,
              ],
            ),
          ]),
          "text/csv;charset=utf-8",
        ),
    },
    {
      label: `${t("reportCalculations")} (PDF)`,
      run: () => printReport("calculations"),
    },
  ];
  const overflowingNotes = page
    ? project.annotations.filter(
        (note) =>
          note.pageId === page.id &&
          project.layers.find((layer) => layer.id === note.layerId)?.visible &&
          annotationLayout(
            note.text,
            note.position.x,
            note.position.y,
            page.widthMm,
            page.heightMm,
          ).overflow,
      ).length
    : 0;
  const pngScale = page
    ? Math.min(150 / 25.4, 4096 / page.widthMm, 4096 / page.heightMm)
    : 1;
  return (
    <section className="engineering-tools" aria-label={t("reportTools")}>
      <ul className="report-shortcuts">
        {shortcuts.map(({ label, disabled, run }) => (
          <li key={label}>
            <button type="button" disabled={disabled} onClick={run}>
              <CommandIcon kind="report" />
              <span>{label}</span>
            </button>
          </li>
        ))}
      </ul>
      {kind === "drawing" && overflowingNotes > 0 && (
        <p role="status">
          {t("annotationOverflow")} ({overflowingNotes})
        </p>
      )}
      <label>
        {t("reportType")}
        <select
          aria-label={t("reportType")}
          value={kind}
          onChange={(event) => {
            setKind(event.target.value as ReportKind | "drawing");
            setError(false);
          }}
        >
          {["drawing" as const, ...reportKinds].map((value) => (
            <option key={value} value={value}>
              {t(reportNames[value])}
            </option>
          ))}
        </select>
      </label>
      {kind === "drawing" && (
        <label>
          {t("pageName")}
          <select
            aria-label={t("reportDrawingPage")}
            value={page?.id ?? ""}
            onChange={(event) => setPageId(event.target.value)}
          >
            {project.pages.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <p>{t("reportNativeScope")}</p>
      <p>
        {t("documentLanguage")}: {outputLanguage.toUpperCase()}
      </p>
      {svg && page && (
        <>
          <button
            onClick={() =>
              downloadFile(`${page.name}.svg`, svg, "image/svg+xml")
            }
          >
            {t("reportDownloadSvg")}
          </button>
          <button
            onClick={() =>
              downloadFile(
                `${page.name}.dxf`,
                schematicDxf(project, page.id),
                "application/dxf;charset=utf-8",
              )
            }
          >
            {t("reportDownloadDxf")}
          </button>
          <button
            disabled={busy}
            onClick={async () => {
              setError(false);
              setBusy(true);
              const url = URL.createObjectURL(
                new Blob([svg], { type: "image/svg+xml" }),
              );
              try {
                const image = new Image();
                image.src = url;
                await image.decode();
                const canvas = document.createElement("canvas");
                canvas.width = Math.ceil(page.widthMm * pngScale);
                canvas.height = Math.ceil(page.heightMm * pngScale);
                const context = canvas.getContext("2d");
                if (!context) throw new Error("Canvas unavailable");
                context.drawImage(image, 0, 0, canvas.width, canvas.height);
                const blob = await new Promise<Blob>((resolve, reject) =>
                  canvas.toBlob(
                    (result) =>
                      result
                        ? resolve(result)
                        : reject(new Error("PNG failed")),
                    "image/png",
                  ),
                );
                downloadFile(`${page.name}.png`, blob, "image/png");
              } catch {
                setError(true);
              } finally {
                URL.revokeObjectURL(url);
                setBusy(false);
              }
            }}
          >
            {t("reportDownloadPng")} ({Math.ceil(page.widthMm * pngScale)} ×{" "}
            {Math.ceil(page.heightMm * pngScale)} px)
          </button>
        </>
      )}
      {table && (
        <>
          <button onClick={() => kind !== "drawing" && downloadTable(kind)}>
            {t("reportDownloadCsv")}
          </button>
          <button
            onClick={() =>
              downloadFile(
                `${kind}.json`,
                JSON.stringify(
                  {
                    projectId: project.id,
                    sourceUpdatedAt: project.updatedAt,
                    kind,
                    outputLanguage,
                    ...outputTable,
                  },
                  null,
                  2,
                ),
                "application/json",
              )
            }
          >
            {t("reportDownloadJson")}
          </button>
        </>
      )}
      <button disabled={!svg && !table} onClick={() => printReport(kind)}>
        {t("reportPrintPdf")}
      </button>
      {error && <p role="alert">{t("reportExportError")}</p>}
      {table && (
        <div className="native-table-scroll">
          <table className="native-bom" aria-label={t(reportNames[kind])}>
            <thead>
              <tr>
                {table.columns.map((column, i) => (
                  <th key={i}>{label(column)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j}>{cell ?? "—"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
