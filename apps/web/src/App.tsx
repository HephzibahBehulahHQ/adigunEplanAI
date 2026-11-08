import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { ConnectivityPanel } from "./ConnectivityPanel";
import { flushSync } from "react-dom";
import { LazyPanelBoundary } from "./LazyPanelBoundary";
import {
  dictionaries,
  type MessageKey,
  type Language,
} from "../../../packages/localization";
import {
  defaults,
  drawingInk,
  panelIds,
  restorePreferences,
  storageKey,
  type Dock,
  type PanelId,
  type PanelState,
  type Preferences,
} from "./preferences";
import { useNativeProjects } from "./useNativeProjects";
import { useBotFinding } from "./useBotFinding";
import {
  ProjectTools,
  NewProjectDialog,
  NativeDataPanel,
  ProjectNavigator,
  ProjectProperties,
  NativeDrawing,
} from "./NativeWorkspace";
import logo from "./assets/hephzibah-behulah-official.jpg";
import "./workspace.css";

const AdigunBot = lazy(() =>
  import("./AdigunBot").then(({ AdigunBot }) => ({ default: AdigunBot })),
);

const headerIcons = {
  language:
    "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm-9-10h18M12 2c5 5 5 15 0 20-5-5-5-15 0-20Z",
  settings:
    "M10 3h4l1 3 3-1 2 4-2 2v2l2 2-2 4-3-1-1 3h-4l-1-3-3 1-2-4 2-2v-2L4 9l2-4 3 1 1-3Zm2 6a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
  searchProject: "M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm5-2 6 6",
  help: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM9 8a3 3 0 1 1 4 3c-1 1-1 1-1 3m0 3h.01",
} as const;

function HeaderIcon({ name }: { name: keyof typeof headerIcons }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={headerIcons[name]} />
    </svg>
  );
}

export function App() {
  const native = useNativeProjects();
  const [buildingView, setBuildingView] = useState(false);
  const activeSheet =
    native.project?.pages.find(({ id }) => id === native.selectedPageId) ??
    native.project?.pages[0];
  const botFinding = useBotFinding(native.project);
  const [prefs, setPrefs] = useState<Preferences>(() => {
    try {
      return restorePreferences(localStorage.getItem(storageKey));
    } catch {
      return defaults();
    }
  });
  const [tab, setTab] = useState<"home" | "view" | "settings">("home");
  const [schematicRibbon, setSchematicRibbon] = useState<HTMLDivElement | null>(
    null,
  );
  const [storageError, setStorageError] = useState(false);
  const help = useRef<HTMLDialogElement>(null);
  const navigatorSearch = useRef<HTMLInputElement>(null);
  const newProjectDialog = useRef<HTMLDialogElement>(null);
  const openNewProject = () => newProjectDialog.current?.showModal();
  const botToggle = useRef<HTMLButtonElement>(null);
  const [botOpen, setBotOpen] = useState(() => {
    try {
      return localStorage.getItem("adiguneplanai.bot.open.v1") === "true";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("adiguneplanai.bot.open.v1", String(botOpen));
    } catch {
      /* Preferences are optional. */
    }
  }, [botOpen]);
  const [layoutOpen, setLayoutOpen] = useState<
    Partial<Record<PanelId, boolean>>
  >({});
  const t = (key: MessageKey) => dictionaries[prefs.language][key];
  useEffect(() => {
    document.documentElement.lang = prefs.language;
    document.documentElement.dataset.theme = prefs.theme;
    try {
      localStorage.setItem(storageKey, JSON.stringify(prefs));
    } catch {
      setStorageError(true);
    }
  }, [prefs]);
  const panel = (id: PanelId, change: Partial<PanelState>) =>
    setPrefs((previous) => ({
      ...previous,
      panels: {
        ...previous.panels,
        [id]: { ...previous.panels[id], ...change },
      },
    }));
  const set = <K extends keyof Preferences>(key: K, value: Preferences[K]) =>
    setPrefs((previous) => ({ ...previous, [key]: value }));
  const renderPanel = (id: PanelId) => {
    const state = prefs.panels[id];
    return (
      <section
        key={id}
        className="panel"
        aria-label={t(id)}
        style={{ flexBasis: state.collapsed ? "auto" : state.size }}
        data-panel={id}
      >
        <header className="panel-heading">
          <button
            aria-expanded={!state.collapsed}
            onClick={() => panel(id, { collapsed: !state.collapsed })}
          >
            {state.collapsed ? "▸" : "▾"} {t(id)}
          </button>
          <button
            title={t("hide")}
            aria-label={`${t("hide")} ${t(id)}`}
            onClick={() => panel(id, { visible: false })}
          >
            ×
          </button>
        </header>
        {!state.collapsed && (
          <div className="panel-body">
            {id === "project" ? (
              <ProjectNavigator
                native={native}
                t={t}
                searchRef={navigatorSearch}
              />
            ) : id === "properties" ? (
              <>
                <div id="native-object-properties" />
                <ProjectProperties native={native} t={t} />
              </>
            ) : id === "bom" ||
              id === "panel3d" ||
              id === "calculations" ||
              id === "reports" ? (
              <NativeDataPanel native={native} t={t} kind={id} />
            ) : id === "diagnostics" ? (
              <ConnectivityPanel native={native} t={t} />
            ) : (
              <p className="empty-hint">
                {t(
                  id === "diagnostics"
                    ? native.project
                      ? "modelValid"
                      : "noDiagnostics"
                    : "emptyPanel",
                )}
              </p>
            )}
            <details open={layoutOpen[id] ?? false}>
              <summary
                onClick={(event) => {
                  event.preventDefault();
                  setLayoutOpen((previous) => ({
                    ...previous,
                    [id]: !previous[id],
                  }));
                }}
              >
                {t("layout")}
              </summary>
              <label>
                {t("dock")}
                <select
                  aria-label={t("dock")}
                  value={state.dock}
                  onChange={(e) => panel(id, { dock: e.target.value as Dock })}
                >
                  {(["left", "right", "bottom"] as const).map((d) => (
                    <option key={d} value={d}>
                      {t(d)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t("size")}
                <input
                  aria-label={`${t(id)} ${t("size")}`}
                  type="range"
                  min="140"
                  max="600"
                  step="10"
                  value={state.size}
                  onChange={(e) => panel(id, { size: Number(e.target.value) })}
                />
              </label>
            </details>
          </div>
        )}
      </section>
    );
  };
  const region = (dock: Dock) => (
    <aside
      className={`dock dock-${dock}`}
      aria-label={`${t("panels")} ${t(dock)}`}
    >
      {panelIds
        .filter(
          (id) => prefs.panels[id].visible && prefs.panels[id].dock === dock,
        )
        .map(renderPanel)}
    </aside>
  );
  const has = (dock: Dock) =>
    panelIds.some(
      (id) => prefs.panels[id].visible && prefs.panels[id].dock === dock,
    );
  return (
    <div className="application">
      <a className="skip-link" href="#workspace">
        {t("skip")}
      </a>
      <header className="app-header">
        <img className="corporate-logo" src={logo} alt="Hephzibah Behulah" />
        <div className="wordmark">
          <strong>AdigunEplanAI</strong>
          <small>{t("division")}</small>
        </div>
        <span className="project-title">
          {native.project?.name ?? t("noProject")}
        </span>
        <div className="header-utilities">
          <span className="local-status">
            <i />
            {t(
              native.project
                ? native.saved
                  ? "savedLocally"
                  : "notSaved"
                : "local",
            )}
          </span>
          <button
            className="header-icon"
            type="button"
            title={t("language")}
            aria-label={`${t("interface")} · ${t("language")}`}
            onClick={() => {
              flushSync(() => setTab("settings"));
              document.getElementById("interface-language")?.focus();
            }}
          >
            <HeaderIcon name="language" />
          </button>
          <button
            className="header-icon"
            type="button"
            title={t("settings")}
            aria-label={`${t("workspace")} · ${t("settings")}`}
            onClick={() => setTab("settings")}
          >
            <HeaderIcon name="settings" />
          </button>
          <button
            className="header-icon"
            type="button"
            title={t("searchProject")}
            aria-label={t("searchProject")}
            disabled={!native.project}
            onClick={() => {
              flushSync(() =>
                panel("project", { visible: true, collapsed: false }),
              );
              navigatorSearch.current?.focus();
            }}
          >
            <HeaderIcon name="searchProject" />
          </button>
          <button
            className="header-icon"
            type="button"
            title={t("help")}
            aria-label={`${t("workspace")} · ${t("help")}`}
            onClick={() => help.current?.showModal()}
          >
            <HeaderIcon name="help" />
          </button>
          <button
            type="button"
            ref={botToggle}
            aria-expanded={botOpen}
            aria-controls={botOpen ? "adigun-bot" : undefined}
            onClick={() => setBotOpen((open) => !open)}
          >
            Adigun BOT
            {botFinding.active && !botOpen && (
              <span className="bot-badge" aria-hidden="true" />
            )}
          </button>
        </div>
        <span className="bot-announcement" role="status">
          {botFinding.active && !botOpen ? t("botFindingPending") : ""}
        </span>
      </header>
      <nav className="ribbon-tabs" aria-label={t("interface")}>
        <button aria-pressed={tab === "home"} onClick={() => setTab("home")}>
          {t("home")}
        </button>
        <button aria-pressed={tab === "view"} onClick={() => setTab("view")}>
          {t("view")}
        </button>
        <button
          aria-pressed={tab === "settings"}
          onClick={() => setTab("settings")}
        >
          {t("settings")}
        </button>
        <button onClick={() => help.current?.showModal()}>{t("help")}</button>
      </nav>
      {native.error && (
        <p className="storage-error" role="alert">
          {t(native.error)}
        </p>
      )}
      <div className="ribbon" aria-label={t(tab)}>
        {tab === "home" ? (
          <>
            <ProjectTools
              native={native}
              t={t}
              openNewProject={openNewProject}
            />
            <div className="schematic-ribbon" ref={setSchematicRibbon} />
          </>
        ) : tab === "view" ? (
          <>
            <div className="panel-toggles">
              {panelIds.map((id) => (
                <label key={id}>
                  <input
                    type="checkbox"
                    checked={prefs.panels[id].visible}
                    onChange={(e) => panel(id, { visible: e.target.checked })}
                  />
                  {t(id)}
                </label>
              ))}
            </div>
            <button
              onClick={() =>
                setPrefs((p) => ({ ...p, panels: defaults().panels }))
              }
            >
              {t("reset")}
            </button>
          </>
        ) : (
          <>
            <label>
              {t("theme")}
              <select
                aria-label={t("theme")}
                value={prefs.theme}
                onChange={(e) =>
                  set("theme", e.target.value as Preferences["theme"])
                }
              >
                <option value="dark">{t("dark")}</option>
                <option value="light">{t("light")}</option>
              </select>
            </label>
            <label>
              {t("language")}
              <select
                aria-label={t("language")}
                id="interface-language"
                value={prefs.language}
                onChange={(e) => set("language", e.target.value as Language)}
              >
                {Object.entries({
                  en: "English",
                  de: "Deutsch",
                  yo: "Yorùbá",
                  pcm: "Naijá Pidgin",
                }).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("sheetBackground")}
              <select
                aria-label={t("sheetBackground")}
                value={prefs.background}
                onChange={(e) =>
                  set("background", e.target.value as Preferences["background"])
                }
              >
                {(["white", "dark", "custom"] as const).map((value) => (
                  <option key={value} value={value}>
                    {t(value)}
                  </option>
                ))}
              </select>
            </label>
            {prefs.background === "custom" && (
              <label>
                {t("backgroundColor")}
                <input
                  aria-label={t("backgroundColor")}
                  type="color"
                  value={prefs.color}
                  onChange={(e) => set("color", e.target.value)}
                />
              </label>
            )}
          </>
        )}
      </div>
      {storageError && (
        <p className="storage-error" role="status">
          {t("storageError")}
        </p>
      )}
      <div
        className={`engineering-layout ${has("left") ? "has-left" : ""} ${has("right") ? "has-right" : ""}`}
      >
        {has("left") && region("left")}
        <main
          id="workspace"
          className="workspace"
          tabIndex={-1}
          aria-label={t("workspace")}
        >
          <header className="workspace-heading">
            <span>{t("workspace")}</span>
            <span>{native.project?.name ?? t("noProject")}</span>
          </header>
          <div className="drawing-viewport">
            <div
              className="drawing-sheet"
              data-background={prefs.background}
              style={
                {
                  "--drawing-ink":
                    prefs.background === "custom"
                      ? drawingInk(prefs.color)
                      : prefs.background === "dark"
                        ? "#e2e8f0"
                        : "#17305b",
                  backgroundColor:
                    prefs.background === "dark"
                      ? "#101827"
                      : prefs.background === "custom"
                        ? prefs.color
                        : "#ffffff",
                } as CSSProperties
              }
            >
              {native.project ? (
                <NativeDrawing
                  native={native}
                  t={t}
                  ribbon={schematicRibbon}
                  buildingView={buildingView}
                  setBuildingView={setBuildingView}
                />
              ) : (
                <div className="empty-workspace">
                  <span className="drawing-mark" aria-hidden="true">
                    ⌁
                  </span>
                  <h1>{t("noProject")}</h1>
                  <p>{t("emptyProject")}</p>
                </div>
              )}
            </div>
          </div>
        </main>
        {has("right") && (
          <div className="workspace-right">{region("right")}</div>
        )}
        {botOpen && (
          <LazyPanelBoundary message={t("botLoadError")}>
            <Suspense fallback={<p role="status">Adigun BOT…</p>}>
              <AdigunBot
                project={native.project}
                suggestions={botFinding}
                t={t}
                close={() => {
                  setBotOpen(false);
                  botToggle.current?.focus();
                }}
                openDiagnostics={() =>
                  panel("diagnostics", { visible: true, collapsed: false })
                }
                openBom={() =>
                  panel("bom", { visible: true, collapsed: false })
                }
                openHelp={() => help.current?.showModal()}
                openNewProject={openNewProject}
                canCreateProject={!native.corrupt}
              />
            </Suspense>
          </LazyPanelBoundary>
        )}
        {has("bottom") && region("bottom")}
      </div>
      <NewProjectDialog native={native} t={t} dialog={newProjectDialog} />
      <footer className="status-bar">
        <span>
          <i />
          {t("ready")}
        </span>
        {native.project && (
          <div className="status-context">
            <span>
              {t("projectName")} <b>{native.project.name}</b>
            </span>
            {buildingView ? (
              <span>{t("buildingDesign")}</span>
            ) : (
              activeSheet && (
                <>
                  <span>
                    {t("pageName")} <b>{activeSheet.name}</b>
                  </span>
                  <span>
                    {t("grid")} <b>{activeSheet.gridMm}</b>
                  </span>
                  <span>
                    {t("sheetSize")}{" "}
                    <b>
                      {activeSheet.widthMm} × {activeSheet.heightMm} mm
                    </b>
                  </span>
                </>
              )
            )}
          </div>
        )}
        <span>
          © {new Date().getFullYear()}{" "}
          <a
            href="https://hephzibahbehulah.com/"
            target="_blank"
            rel="noreferrer"
          >
            Hephzibah Behulah
          </a>{" "}
          · HB Elektroniker · AdigunEplanAI
        </span>
      </footer>
      <dialog ref={help} aria-labelledby="guide-title">
        <h2 id="guide-title">{t("guide")}</h2>
        <p>{t("guideText")}</p>
        <h3>{t("privacy")}</h3>
        <p>{t("privacyText")}</p>
        <form method="dialog">
          <button>{t("close")}</button>
        </form>
      </dialog>
    </div>
  );
}
