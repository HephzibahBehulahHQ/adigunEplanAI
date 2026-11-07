import { LazyPanelBoundary } from "./LazyPanelBoundary";
import { useRef, useState, lazy, Suspense } from "react";
import { ComponentLibrary } from "./ComponentLibrary";
import { exampleCatalog } from "../../../packages/example-projects/catalog.ts";
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
const ExampleLibrary = lazy(() =>
  import("./ExampleLibrary").then((module) => ({
    default: module.ExampleLibrary,
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
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 2h9l5 5v15H5z M14 2v6h5 M9 15h6 M12 12v6" />
        </svg>
        {t("newProject")}
      </button>
      <button onClick={() => file.current?.click()}>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 6h8l2 2h10l-3 12H2z M2 10h18" />
        </svg>
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
          <button onClick={() => native.save()}>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 3h15l3 3v15H3z M7 3v6h10V3 M7 21v-7h10v7" />
            </svg>
            {t("save")}
          </button>
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
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M13 3H5v18h14v-8 M12 12l9-9 M15 3h6v6" />
            </svg>
            {t("exportProject")}
          </button>
          <button disabled={!native.canUndo} onClick={() => native.undo()}>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 4l-5 5 5 5 M4 9h10a5 5 0 0 1 0 10h-3" />
            </svg>
            {t("undo")}
          </button>
          <button disabled={!native.canRedo} onClick={() => native.redo()}>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 4l5 5-5 5 M20 9H10a5 5 0 0 0 0 10h3" />
            </svg>
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
  const [filter, setFilter] = useState("");
  const [pane, setPane] = useState<
    "project" | "library" | "examples" | "search"
  >("project");
  const filterInput = useRef<HTMLInputElement>(null);
  const project = native.project;
  const query = filter.normalize("NFKC").toLocaleLowerCase().trim();
  const matches = (...values: string[]) =>
    !query ||
    values.some((value) =>
      value.normalize("NFKC").toLocaleLowerCase().includes(query),
    );
  const devices =
    project?.devices.filter((device) =>
      matches(device.reference, device.name),
    ) ?? [];
  const activePage =
    project?.pages.find((page) => page.id === native.selectedPageId) ??
    project?.pages[0];
  return (
    <>
      <nav className="navigator-tabs" role="tablist" aria-label={t("project")}>
        <button
          type="button"
          role="tab"
          aria-selected={pane === "project"}
          onClick={() => setPane("project")}
        >
          {t("navigatorTabProject")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={pane === "library"}
          onClick={() => setPane("library")}
        >
          {t("navigatorTabLibrary")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={pane === "examples"}
          onClick={() => setPane("examples")}
        >
          {t("navigatorTabExamples")} ({exampleCatalog.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={pane === "search"}
          onClick={() => {
            setPane("search");
            requestAnimationFrame(() => filterInput.current?.focus());
          }}
        >
          {t("navigatorTabSearch")}
        </button>
      </nav>
      {pane === "library" ? (
        <ComponentLibrary native={native} t={t} open />
      ) : pane === "examples" ? (
        <LazyPanelBoundary message={t("catalogLoadError")}>
          <Suspense fallback={<p role="status">{t("catalogLoading")}</p>}>
            <ExampleLibrary
              native={native}
              t={t}
              opened={() => setPane("project")}
            />
          </Suspense>
        </LazyPanelBoundary>
      ) : !project ? (
        <p className="empty-hint">{t("noProject")}</p>
      ) : (
        <div className="navigator-pane" role="tabpanel">
          {pane === "project" && (
            <label>
              {t("chooseProject")}
              <select
                aria-label={t("chooseProject")}
                value={project.id}
                onChange={(event) => native.select(event.target.value)}
              >
                {native.projects.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="navigator-filter">
            {t("navigatorFilter")}
            <input
              ref={filterInput}
              type="search"
              aria-label={t("navigatorFilter")}
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            />
          </label>
          <p className="navigator-root" title={project?.name}>
            {project?.name}
          </p>
          {project?.documents.map((document) => {
            const pages = project.pages
              .filter(
                (page) =>
                  page.documentId === document.id &&
                  (matches(document.name) || matches(page.name)),
              )
              .sort((a, b) => a.order - b.order);
            if (!pages.length) return null;
            return (
              <details open key={document.id}>
                <summary>
                  {document.name} ({pages.length})
                </summary>
                <div className="navigator-pages">
                  {pages.slice(0, 100).map((page) => (
                    <button
                      key={page.id}
                      aria-current={
                        page.id === activePage?.id ? "page" : undefined
                      }
                      onClick={() => {
                        native.selectPage(page.id);
                        native.setView("schematic");
                      }}
                    >
                      {page.name}
                    </button>
                  ))}
                </div>
                {pages.length > 100 && <p>{t("navigatorLimit")}</p>}
              </details>
            );
          })}
          {!!devices.length && (
            <details open={query ? true : undefined}>
              <summary>
                {t("botDevices")} ({devices.length})
              </summary>
              <div className="navigator-pages">
                {devices.slice(0, 100).map((device) => (
                  <button
                    key={device.id}
                    aria-pressed={native.selectedDeviceId === device.id}
                    onClick={() => {
                      native.selectDevice(device.id);
                      if (
                        project?.symbolInstances.some(
                          (symbol) => symbol.deviceId === device.id,
                        )
                      )
                        native.setView("schematic");
                    }}
                  >
                    {device.reference} · {device.name}
                  </button>
                ))}
              </div>
              {devices.length > 100 && <p>{t("navigatorLimit")}</p>}
            </details>
          )}
          {!!project?.buildings.length && (
            <details open={query ? true : undefined}>
              <summary>{t("navigatorBuildings")}</summary>
              {project.buildings.map((building) => (
                <details key={building.id} open={query ? true : undefined}>
                  <summary>{building.name}</summary>
                  {project.floors
                    .filter((floor) => floor.buildingId === building.id)
                    .map((floor) => (
                      <details key={floor.id} open={query ? true : undefined}>
                        <summary>
                          {floor.name} · {floor.elevationMm} mm
                        </summary>
                        <ul>
                          {project.rooms
                            .filter(
                              (room) =>
                                room.floorId === floor.id &&
                                matches(building.name, floor.name, room.name),
                            )
                            .map((room) => (
                              <li key={room.id}>{room.name}</li>
                            ))}
                        </ul>
                      </details>
                    ))}
                </details>
              ))}
              <button onClick={() => native.setView("building")}>
                {t("openBuilding")}
              </button>
            </details>
          )}
          {!!project?.enclosures.length && (
            <details open={query ? true : undefined}>
              <summary>
                {t("navigatorPanels")} ({project.enclosures.length})
              </summary>
              {project.enclosures
                .filter((enclosure) => matches(enclosure.name))
                .map((enclosure) => (
                  <details key={enclosure.id}>
                    <summary>{enclosure.name}</summary>
                    <p>
                      {enclosure.widthMm} × {enclosure.heightMm} ×{" "}
                      {enclosure.depthMm} mm
                    </p>
                    <ul>
                      {project.equipment3d
                        .filter((item) => item.enclosureId === enclosure.id)
                        .map((item) => (
                          <li key={item.id}>
                            {
                              project.devices.find(
                                (device) => device.id === item.deviceId,
                              )?.reference
                            }{" "}
                            · {item.name}
                          </li>
                        ))}
                    </ul>
                  </details>
                ))}
              <button onClick={() => native.setView("panel")}>
                {t("openPanel")}
              </button>
            </details>
          )}
          <ComponentLibrary native={native} t={t} />
        </div>
      )}
    </>
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
