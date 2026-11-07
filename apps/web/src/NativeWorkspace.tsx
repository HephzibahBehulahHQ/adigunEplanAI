import { LazyPanelBoundary } from "./LazyPanelBoundary";
import { useRef, useState, lazy, Suspense } from "react";
import { ComponentLibrary } from "./ComponentLibrary";
import { SchematicEditor, type NativeClipboard } from "./SchematicEditor";
import type { MessageKey } from "../../../packages/localization";
import {
  maxProjectBytes,
  serializeProject,
} from "../../../packages/electrical-model/project.ts";
import type { NativeProjects } from "./useNativeProjects";
const PanelPreview = lazy(() =>
  import("./PanelEditor").then((module) => ({ default: module.PanelPreview })),
);
const PanelEditor = lazy(() => import("./PanelEditor"));
const CalculationsPanel = lazy(() =>
  import("./CalculationsPanel").then((module) => ({
    default: module.CalculationsPanel,
  })),
);
const ReportsPanel = lazy(() =>
  import("./ReportsPanel").then((module) => ({ default: module.ReportsPanel })),
);
const AutomationEditor = lazy(() =>
  import("./AutomationEditor").then((module) => ({
    default: module.AutomationEditor,
  })),
);
const BuildingEditor = lazy(() =>
  import("./BuildingEditor").then((module) => ({
    default: module.BuildingEditor,
  })),
);

type Props = { native: NativeProjects; t: (key: MessageKey) => string };
export function ProjectTools({ native, t }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const file = useRef<HTMLInputElement>(null);
  return (
    <div className="native-tools">
      <button
        disabled={native.corrupt}
        onClick={() => dialog.current?.showModal()}
      >
        {t("newProject")}
      </button>
      <button onClick={() => file.current?.click()}>
        {t("importProject")}
      </button>
      <input
        hidden
        ref={file}
        type="file"
        accept=".json,.adeplan"
        aria-label={t("importProject")}
        onChange={async (e) => {
          const selected = e.target.files?.[0];
          if (!selected) return;
          try {
            if (selected.size > maxProjectBytes) native.invalidImport();
            else
              native.importText(await selected.text(), () =>
                window.confirm(t("confirmReplace")),
              );
          } catch {
            native.invalidImport();
          }
          e.target.value = "";
        }}
      />
      {native.project && (
        <>
          <button onClick={() => native.save()}>{t("save")}</button>
          <button
            onClick={() => {
              if (!native.project) return;
              const blob = new Blob([serializeProject(native.project)], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);
              const anchor = document.createElement("a");
              anchor.href = url;
              anchor.download = `${native.project.name.replace(/[^A-Za-z0-9_-]/g, "_")}.adeplan.json`;
              anchor.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            }}
          >
            {t("exportProject")}
          </button>
          <button disabled={!native.canUndo} onClick={() => native.undo()}>
            {t("undo")}
          </button>
          <button disabled={!native.canRedo} onClick={() => native.redo()}>
            {t("redo")}
          </button>
        </>
      )}
      {native.corrupt && (
        <button
          onClick={() => {
            try {
              const raw = native.recoveryText();
              const url = URL.createObjectURL(
                new Blob([raw], { type: "application/json" }),
              );
              const anchor = document.createElement("a");
              anchor.href = url;
              anchor.download = "AdigunEplanAI-recovery.json";
              anchor.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            } catch {
              native.invalidImport();
            }
          }}
        >
          {t("downloadRecovery")}
        </button>
      )}
      {native.corrupt && (
        <button
          onClick={() => {
            if (window.confirm(t("confirmReset"))) native.resetStorage();
          }}
        >
          {t("resetStorage")}
        </button>
      )}
      <dialog ref={dialog} aria-label={t("newProject")}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const name = String(
              new FormData(event.currentTarget).get("name") ?? "",
            ).trim();
            if (!name) return;
            native.create(name, `${t("sheet")} 1`, t("document"));
            dialog.current?.close();
          }}
        >
          <h2>{t("newProject")}</h2>
          <label>
            {t("projectName")}
            <input
              aria-label={t("projectName")}
              name="name"
              required
              maxLength={160}
              autoFocus
            />
          </label>
          <div className="dialog-actions">
            <button type="button" onClick={() => dialog.current?.close()}>
              {t("cancel")}
            </button>
            <button>{t("create")}</button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
export function ProjectNavigator({ native, t }: Props) {
  const project = native.project;
  return native.projects.length ? (
    <>
      <label>
        {t("chooseProject")}
        <select
          aria-label={t("chooseProject")}
          value={project?.id ?? ""}
          onChange={(event) => native.select(event.target.value)}
        >
          {native.projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      {project?.documents.map((document) => (
        <details open key={document.id}>
          <summary>{document.name}</summary>
          <div className="navigator-pages">
            {project.pages
              .filter((page) => page.documentId === document.id)
              .sort((a, b) => a.order - b.order)
              .map((page) => (
                <button
                  key={page.id}
                  onClick={() => native.selectPage(page.id)}
                >
                  {page.name}
                </button>
              ))}
          </div>
        </details>
      ))}
      <ComponentLibrary native={native} t={t} />
    </>
  ) : (
    <p className="empty-hint">{t("noProject")}</p>
  );
}
export function NativeDataPanel({
  native,
  t,
  kind,
}: Props & { kind: "bom" | "panel3d" | "calculations" | "reports" }) {
  const project = native.project;
  if (!project) return <p className="empty-hint">{t("noProject")}</p>;
  if (kind === "calculations")
    return (
      <LazyPanelBoundary message={t("reportExportError")}>
        <Suspense fallback={<p role="status">{t("calculations")}…</p>}>
          <CalculationsPanel native={native} t={t} />
        </Suspense>
      </LazyPanelBoundary>
    );
  if (kind === "reports")
    return (
      <LazyPanelBoundary message={t("reportExportError")}>
        <Suspense fallback={<p role="status">{t("reports")}…</p>}>
          <ReportsPanel native={native} t={t} />
        </Suspense>
      </LazyPanelBoundary>
    );
  if (kind === "bom")
    return project.devices.length ? (
      <table className="native-bom">
        <thead>
          <tr>
            <th>{t("reference")}</th>
            <th>{t("device")}</th>
            <th>{t("partNumber")}</th>
            <th>{t("quantity")}</th>
          </tr>
        </thead>
        <tbody>
          {project.devices.map((device) => (
            <tr key={device.id}>
              <td>{device.reference}</td>
              <td>{device.name}</td>
              <td>
                {project.manufacturerParts.find(
                  (part) => part.id === device.partId,
                )?.partNumber ?? "—"}
              </td>
              <td>1</td>
            </tr>
          ))}
        </tbody>
      </table>
    ) : (
      <p className="empty-hint">{t("noRecords")}</p>
    );
  return (
    <LazyPanelBoundary message={t("reportExportError")}>
      <Suspense fallback={<p role="status">{t("panel3d")}…</p>}>
        <PanelPreview native={native} t={t} />
      </Suspense>
    </LazyPanelBoundary>
  );
}
export function ProjectProperties({ native, t }: Props) {
  const p = native.project;
  if (!p) return <p className="empty-hint">{t("emptyPanel")}</p>;
  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const name = String(new FormData(e.currentTarget).get("name") ?? "");
          native.update((draft) => ({ ...draft, name }));
        }}
      >
        <label>
          {t("projectName")}
          <input
            key={p.id + p.name}
            aria-label={t("projectName")}
            name="name"
            defaultValue={p.name}
            required
            maxLength={160}
          />
        </label>
        <button>{t("rename")}</button>
      </form>
      {p.documents.map((doc) => (
        <label key={doc.id}>
          {doc.name} · {t("documentLanguage")}
          <select
            aria-label={`${doc.name} ${t("documentLanguage")}`}
            value={doc.outputLanguage}
            onChange={(e) =>
              native.update((draft) => ({
                ...draft,
                documents: draft.documents.map((d) =>
                  d.id === doc.id
                    ? {
                        ...d,
                        outputLanguage: e.target
                          .value as typeof doc.outputLanguage,
                      }
                    : d,
                ),
              }))
            }
          >
            {["en", "de", "yo", "pcm"].map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
      ))}
    </>
  );
}
export function NativeDrawing({ native, t }: Props) {
  const selected = native.selectedPageId;
  const setSelected = native.selectPage;
  const { view, setView } = native;
  const [clipboard, setClipboard] = useState<NativeClipboard | null>(null);
  const p = native.project;
  if (!p) return null;
  const page = p.pages.find((item) => item.id === selected) ?? p.pages[0];
  return (
    <div className="native-drawing">
      <nav className="drawing-tabs" aria-label={t("workspaceView")}>
        <button
          aria-pressed={view === "schematic"}
          onClick={() => setView("schematic")}
        >
          {t("schematicView")}
        </button>
        <button
          aria-pressed={view === "building"}
          onClick={() => setView("building")}
        >
          {t("buildingDesign")}
        </button>
        <button
          aria-pressed={view === "automation"}
          onClick={() => setView("automation")}
        >
          {t("automationDesign")}
        </button>
        <button
          aria-pressed={view === "panel"}
          onClick={() => setView("panel")}
        >
          {t("panelDesign")}
        </button>
      </nav>
      {view === "building" ? (
        <LazyPanelBoundary message={t("buildingLoadError")}>
          <Suspense fallback={<p role="status">{t("buildingDesign")}…</p>}>
            <BuildingEditor key={p.id} native={native} t={t} />
          </Suspense>
        </LazyPanelBoundary>
      ) : view === "panel" ? (
        <LazyPanelBoundary message={t("reportExportError")}>
          <Suspense fallback={<p role="status">{t("panelDesign")}…</p>}>
            <PanelEditor key={p.id} native={native} t={t} />
          </Suspense>
        </LazyPanelBoundary>
      ) : view === "automation" ? (
        <LazyPanelBoundary message={t("reportExportError")}>
          <Suspense fallback={<p role="status">{t("automationDesign")}…</p>}>
            <AutomationEditor key={p.id} native={native} t={t} />
          </Suspense>
        </LazyPanelBoundary>
      ) : (
        <>
          <nav className="drawing-tabs" aria-label={t("pageName")}>
            {p.pages.map((item) => (
              <button
                key={item.id}
                aria-pressed={item.id === page?.id}
                onClick={() => setSelected(item.id)}
              >
                {item.name}
              </button>
            ))}
            <button
              onClick={() =>
                native.addPage(`${t("sheet")} ${p.pages.length + 1}`)
              }
            >
              {t("newPage")}
            </button>
          </nav>
          {page ? (
            <SchematicEditor
              key={`${p.id}:${page.id}`}
              native={native}
              page={page}
              t={t}
              clipboard={clipboard}
              setClipboard={setClipboard}
            />
          ) : (
            <p className="canvas-empty">{t("noPages")}</p>
          )}
        </>
      )}
    </div>
  );
}
