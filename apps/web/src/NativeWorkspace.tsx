import { LazyPanelBoundary } from "./LazyPanelBoundary";
import { useRef, useState, lazy, Suspense } from "react";
import { ComponentLibrary } from "./ComponentLibrary";
import { SchematicEditor, type NativeClipboard } from "./SchematicEditor";
import type { MessageKey } from "../../../packages/localization";
import {
  maxProjectBytes,
  serializeProject,
} from "../../../packages/electrical-model/project.ts";
import { projectStorageKey } from "../../../packages/project-storage/repository.ts";
import type { NativeProjects } from "./useNativeProjects";
const BuildingEditor = lazy(() =>
  import("./BuildingEditor").then((module) => ({
    default: module.BuildingEditor,
  })),
);
const EnclosureView = lazy(() =>
  import("./EnclosureView").then(({ EnclosureView }) => ({
    default: EnclosureView,
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
              const raw = localStorage.getItem(projectStorageKey) ?? "";
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
  const [query, setQuery] = useState("");
  const term = query.trim().toLowerCase();
  const matches = (value: string) => value.toLowerCase().includes(term);
  const devices = new Map(
    term
      ? project?.devices
          .filter((device) => matches(device.reference) || matches(device.name))
          .map((device) => [device.id, device] as const)
      : [],
  );
  const pageDevices = new Map<string, Set<string>>();
  if (devices.size) {
    for (const symbol of project?.symbolInstances ?? []) {
      const device = devices.get(symbol.deviceId);
      if (!device) continue;
      const references = pageDevices.get(symbol.pageId) ?? new Set<string>();
      references.add(device.reference);
      pageDevices.set(symbol.pageId, references);
    }
  }
  const documents = project?.documents.flatMap((document) => {
    const pages = project.pages
      .filter((page) => page.documentId === document.id)
      .filter(
        (page) =>
          matches(document.name) ||
          matches(page.name) ||
          pageDevices.has(page.id),
      )
      .sort((a, b) => a.order - b.order);
    return matches(document.name) || pages.length ? [{ document, pages }] : [];
  });
  return native.projects.length ? (
    <>
      <label>
        {t("chooseProject")}
        <select
          aria-label={t("chooseProject")}
          value={project?.id ?? ""}
          onChange={(event) => {
            native.select(event.target.value);
            setQuery("");
          }}
        >
          {native.projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      {project && (
        <label className="navigator-search">
          {t("searchProject")}
          <input
            type="search"
            value={query}
            maxLength={160}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      )}
      {term && !documents?.length && (
        <p role="status">{t("noProjectSearchMatches")}</p>
      )}
      {documents?.map(({ document, pages }) => (
        <details open key={document.id}>
          <summary>{document.name}</summary>
          <div className="navigator-pages">
            {pages.map((page) => (
              <button
                key={page.id}
                aria-current={
                  native.selectedPageId === page.id ? "page" : undefined
                }
                onClick={() => native.selectPage(page.id)}
              >
                {page.name}
                {pageDevices.has(page.id) && (
                  <small>
                    {Array.from(pageDevices.get(page.id) ?? []).join(", ")}
                  </small>
                )}
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
  if (kind === "panel3d")
    return (
      <LazyPanelBoundary message={t("enclosureLoadError")}>
        <Suspense fallback={<p role="status">{t("panel3d")}…</p>}>
          <EnclosureView
            key={project.id}
            project={project}
            t={t}
            addEnclosure={(enclosure) =>
              native.update((draft) => ({
                ...draft,
                enclosures: [...draft.enclosures, enclosure],
              }))
            }
          />
        </Suspense>
      </LazyPanelBoundary>
    );
  const records =
    kind === "calculations" ? project.calculations : project.reports;
  return records.length ? (
    <ul>
      {records.map((record) => (
        <li key={record.id}>{record.name}</li>
      ))}
    </ul>
  ) : (
    <p className="empty-hint">{t("noRecords")}</p>
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
export function NativeDrawing({
  native,
  t,
  ribbon,
}: Props & { ribbon: HTMLElement | null }) {
  const selected = native.selectedPageId;
  const setSelected = native.selectPage;
  const [buildingView, setBuildingView] = useState(false);
  const [clipboard, setClipboard] = useState<NativeClipboard | null>(null);
  const p = native.project;
  if (!p) return null;
  const page = p.pages.find((item) => item.id === selected) ?? p.pages[0];
  return (
    <div className="native-drawing">
      <div className="drawing-tab-bar">
        <nav className="drawing-tabs" aria-label={t("workspaceView")}>
          <button
            aria-pressed={!buildingView}
            onClick={() => setBuildingView(false)}
          >
            {t("schematicView")}
          </button>
          <button
            aria-pressed={buildingView}
            onClick={() => setBuildingView(true)}
          >
            {t("buildingDesign")}
          </button>
        </nav>
        {!buildingView && (
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
        )}
      </div>
      {buildingView ? (
        <LazyPanelBoundary message={t("buildingLoadError")}>
          <Suspense fallback={<p role="status">{t("buildingDesign")}…</p>}>
            <BuildingEditor key={p.id} native={native} t={t} />
          </Suspense>
        </LazyPanelBoundary>
      ) : (
        <>
          {page ? (
            <SchematicEditor
              key={`${p.id}:${page.id}`}
              native={native}
              page={page}
              t={t}
              clipboard={clipboard}
              setClipboard={setClipboard}
              ribbon={ribbon}
            />
          ) : (
            <p>{t("noPages")}</p>
          )}
        </>
      )}
    </div>
  );
}
