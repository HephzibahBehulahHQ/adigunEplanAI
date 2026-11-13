import { analyze } from "../../../packages/connectivity-engine/analyze.ts";
import productConfig from "../../../product.config.json";
import brands from "../../../packages/design-tokens/brands.json";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  lazy,
  Suspense,
  type CSSProperties,
  type MouseEvent,
} from "react";
import {
  WorkspaceCommands,
  CommandIcon,
  ribbonTabs,
  type RibbonTab,
} from "./WorkspaceRibbon";
import { BotWindow } from "./BotWindow";
import { ConnectivityPanel } from "./ConnectivityPanel";
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
import { useAccount, type Account } from "./useAccount";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { HomeRibbon } from "./HomeRibbon";
import { AccountPanel } from "./AccountPanel";
import {
  ProjectTools,
  NativeDataPanel,
  ProjectNavigator,
  ProjectProperties,
  NativeDrawing,
} from "./NativeWorkspace";
import "./workspace.css";
import "./account.css";
import "./home-ribbon.css";
import "./workbench-shell.css";

const ExampleLibrary = lazy(() =>
  import("./ExampleLibrary").then((module) => ({
    default: module.ExampleLibrary,
  })),
);
const activePanelsKey = "adiguneplanai.workbench-panels.v1";
type MenuSource = "electrical" | "ribbon" | "settings";

export function App() {
  const account = useAccount();
  return <Workspace key={account.user?.id ?? "guest"} account={account} />;
}
function Workspace({ account }: { account: Account }) {
  const native = useNativeProjects(account.user?.id ?? null);
  const [orthogonal, setOrthogonal] = useState(false);
  const coordinateReadout = useRef<HTMLSpanElement>(null);
  const toggleOrthogonal = () => setOrthogonal((enabled) => !enabled);
  const activePage =
    native.project?.pages.find(({ id }) => id === native.selectedPageId) ??
    native.project?.pages[0];
  const toggleSnap = () => {
    if (!activePage) return;
    native.update((project) => ({
      ...project,
      pages: project.pages.map((page) =>
        page.id === activePage.id
          ? { ...page, snapping: !page.snapping }
          : page,
      ),
    }));
  };
  const connectivity = useMemo(
    () => (native.project ? analyze(native.project) : null),
    [native.project],
  );
  const errorCount =
    connectivity?.findings.filter(({ severity }) => severity === "error")
      .length ?? 0;
  const warningCount =
    connectivity?.findings.filter(({ severity }) => severity === "warning")
      .length ?? 0;
  const examplesDialog = useRef<HTMLDialogElement>(null);
  const accountDialog = useRef<HTMLDialogElement>(null);
  const searchDialog = useRef<HTMLDialogElement>(null);
  const [search, setSearch] = useState("");
  const [prefs, setPrefs] = useState<Preferences>(() => {
    try {
      return restorePreferences(localStorage.getItem(storageKey));
    } catch {
      return defaults();
    }
  });
  const [botSignal, setBotSignal] = useState(0);
  const [librarySignal, setLibrarySignal] = useState(0);
  const [tab, setTab] = useState<RibbonTab>("home");
  const [activeMenu, setActiveMenu] = useState<MenuSource | null>(null);
  const commandOpen = activeMenu !== null;
  const activeMenuRef = useRef<MenuSource | null>(null);
  activeMenuRef.current = activeMenu;
  const menuAnchorRef = useRef<HTMLButtonElement | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<CSSProperties>({});
  const [editorToolsOpen, setEditorToolsOpen] = useState(false);
  const restoreActivePanel = (dock: Dock): PanelId | null => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(activePanelsKey) ?? "null",
      ) as Partial<Record<Dock, unknown>> | null;
      const id = saved?.[dock];
      if (
        typeof id === "string" &&
        panelIds.includes(id as PanelId) &&
        prefs.panels[id as PanelId].visible &&
        prefs.panels[id as PanelId].dock === dock
      )
        return id as PanelId;
    } catch {
      /* Invalid panel activation state should leave compact rails collapsed. */
    }
    return null;
  };
  const [activeLeft, setActiveLeft] = useState<PanelId | null>(() =>
    restoreActivePanel("left"),
  );
  const [activeRight, setActiveRight] = useState<PanelId | null>(() =>
    restoreActivePanel("right"),
  );
  const [activeBottom, setActiveBottom] = useState<PanelId | null>(() =>
    restoreActivePanel("bottom"),
  );
  const menuCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [storageError, setStorageError] = useState(false);
  const help = useRef<HTMLDialogElement>(null);
  const [layoutOpen, setLayoutOpen] = useState<
    Partial<Record<PanelId, boolean>>
  >({});
  useEffect(() => {
    const keepOneMobileDrawer = () => {
      if (
        window.matchMedia("(max-width: 620px)").matches &&
        activeLeft !== null &&
        activeRight !== null
      )
        setActiveRight(null);
    };
    keepOneMobileDrawer();
    window.addEventListener("resize", keepOneMobileDrawer);
    return () => window.removeEventListener("resize", keepOneMobileDrawer);
  }, [activeLeft, activeRight]);
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
  useEffect(() => {
    try {
      localStorage.setItem(
        activePanelsKey,
        JSON.stringify({
          left: activeLeft,
          right: activeRight,
          bottom: activeBottom,
        }),
      );
    } catch {
      setStorageError(true);
    }
  }, [activeLeft, activeRight, activeBottom]);
  const panel = (id: PanelId, change: Partial<PanelState>) =>
    setPrefs((previous) => ({
      ...previous,
      panels: {
        ...previous.panels,
        [id]: { ...previous.panels[id], ...change },
      },
    }));
  const activateDock = (dock: Dock, id: PanelId | null) => {
    if (dock === "left") setActiveLeft(id);
    else if (dock === "right") setActiveRight(id);
    else setActiveBottom(id);
  };
  const movePanel = (id: PanelId, dock: Dock) => {
    panel(id, { dock });
    setActiveLeft((current) => (current === id ? null : current));
    setActiveRight((current) => (current === id ? null : current));
    setActiveBottom((current) => (current === id ? null : current));
    if (window.matchMedia("(max-width: 620px)").matches) {
      if (dock === "left") setActiveRight(null);
      else if (dock === "right") setActiveLeft(null);
    }
    if (prefs.panels[id].visible) activateDock(dock, id);
  };
  const set = <K extends keyof Preferences>(key: K, value: Preferences[K]) =>
    setPrefs((previous) => ({ ...previous, [key]: value }));
  const reveal = (id: PanelId) => {
    const dock: Dock = id === "project" ? "left" : "right";
    const compactViewport = window.matchMedia("(max-width: 620px)").matches;
    panel(id, { visible: true, collapsed: false, dock });
    if (dock === "left") {
      setActiveLeft(id);
      if (compactViewport) setActiveRight(null);
    } else {
      setActiveRight(id);
      if (compactViewport) setActiveLeft(null);
    }
    if (id === "project") setLibrarySignal((value) => value + 1);
    requestAnimationFrame(() => {
      const element = document.querySelector<HTMLElement>(
        `[data-panel="${id}"]`,
      );
      element
        ?.querySelector<HTMLButtonElement>(".panel-heading button")
        ?.focus();
    });
  };
  const togglePanel = (id: PanelId) => {
    if (id === "project" && activeLeft === id) setActiveLeft(null);
    else if (id !== "project" && activeRight === id) setActiveRight(null);
    else reveal(id);
  };
  const iconButton = (
    label: MessageKey,
    icon: string,
    action: (event: MouseEvent<HTMLButtonElement>) => void,
    pressed = false,
    disabled = false,
    ariaLabel?: string,
  ) => (
    <button
      type="button"
      className="workbench-icon-button"
      aria-label={ariaLabel ?? t(label)}
      title={t(label)}
      aria-pressed={pressed}
      onClick={action}
      disabled={disabled}
    >
      <CommandIcon kind={icon} />
    </button>
  );
  const closeMenu = () => {
    if (menuCloseTimer.current) clearTimeout(menuCloseTimer.current);
    menuCloseTimer.current = null;
    setActiveMenu(null);
  };
  const cancelMenuClose = () => {
    if (menuCloseTimer.current) clearTimeout(menuCloseTimer.current);
    menuCloseTimer.current = null;
  };
  const scheduleMenuClose = (pointerType: string) => {
    if (pointerType !== "mouse" && pointerType !== "pen") return;
    cancelMenuClose();
    menuCloseTimer.current = setTimeout(() => {
      const focused = document.activeElement;
      if (
        focused instanceof Element &&
        document.querySelector(".workbench-command-popover")?.contains(focused)
      )
        return;
      closeMenu();
    }, 300);
  };
  const measurePopover = (anchor: HTMLButtonElement) => {
    const rect = anchor.getBoundingClientRect();
    const width = Math.min(800, Math.max(0, window.innerWidth - 16));
    const left = Math.max(
      8,
      Math.min(rect.left, window.innerWidth - width - 8),
    );
    const top = Math.min(
      rect.bottom + 4,
      Math.max(8, window.innerHeight - 120),
    );
    return {
      left,
      top,
      maxHeight: Math.max(
        120,
        Math.min(window.innerHeight * 0.72, window.innerHeight - top - 8),
      ),
    };
  };
  const toggleMenu = (
    source: MenuSource,
    anchor: HTMLButtonElement,
    nextTab?: RibbonTab,
  ) => {
    cancelMenuClose();
    if (activeMenuRef.current === source) {
      closeMenu();
      return;
    }
    menuAnchorRef.current = anchor;
    setPopoverPosition(measurePopover(anchor));
    if (nextTab) setTab(nextTab);
    activeMenuRef.current = source;
    setActiveMenu(source);
  };
  useLayoutEffect(() => {
    if (!commandOpen) return;
    const reposition = () => {
      if (menuAnchorRef.current?.isConnected)
        setPopoverPosition(measurePopover(menuAnchorRef.current));
    };
    reposition();
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [commandOpen]);
  useEffect(() => {
    if (!commandOpen) return;
    const outside = (event: PointerEvent) => {
      if (
        (event.target as Element).closest(
          ".workbench-command-popover, .workbench-menu-trigger",
        )
      )
        return;
      closeMenu();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (document.querySelector("dialog[open]")) return;
      closeMenu();
      menuAnchorRef.current?.focus();
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [commandOpen]);
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
            onClick={() => {
              panel(id, { visible: false });
              if (id === activeLeft) setActiveLeft(null);
              if (id === activeRight) setActiveRight(null);
              if (id === activeBottom) setActiveBottom(null);
            }}
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
                librarySignal={librarySignal}
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
              <ConnectivityPanel native={native} t={t} result={connectivity} />
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
                  onChange={(e) => movePanel(id, e.target.value as Dock)}
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
          (id) =>
            prefs.panels[id].visible &&
            prefs.panels[id].dock === dock &&
            (!prefs.compact ||
              (dock === "left"
                ? id === activeLeft
                : dock === "right"
                  ? id === activeRight
                  : id === activeBottom)),
        )
        .map(renderPanel)}
    </aside>
  );
  const has = (dock: Dock) => {
    if (!prefs.compact)
      return panelIds.some(
        (id) => prefs.panels[id].visible && prefs.panels[id].dock === dock,
      );
    const id =
      dock === "left"
        ? activeLeft
        : dock === "right"
          ? activeRight
          : activeBottom;
    return (
      id !== null && prefs.panels[id].visible && prefs.panels[id].dock === dock
    );
  };
  return (
    <div
      className="application workbench-interface"
      data-project-id={native.project?.id ?? ""}
      data-compact={prefs.compact}
      inert={account.checking && !account.user}
    >
      <a className="skip-link" href="#workspace">
        {t("skip")}
      </a>
      <WorkspaceHeader
        native={native}
        account={account}
        t={t}
        openAccount={() => accountDialog.current?.showModal()}
        openDiagnostics={() => reveal("diagnostics")}
        openHelp={() => help.current?.showModal()}
      />

      <div
        className="workbench-toolbar"
        role="toolbar"
        aria-label={t("ribbonWorkspace")}
      >
        <div className="workbench-file-tools">
          <ProjectTools native={native} t={t} />
        </div>
        <div className="workbench-tool-group">
          {iconButton("undo", "undo", native.undo, false, !native.canUndo)}
          {iconButton("redo", "redo", native.redo, false, !native.canRedo)}
        </div>
        <div className="workbench-tool-group">
          {iconButton(
            "selectTool",
            "select",
            () => native.requestEditorCommand("select"),
            false,
            !native.project,
          )}
          {iconButton(
            "wireTool",
            "wire",
            () => native.requestEditorCommand("wire"),
            false,
            !native.project,
          )}
          {iconButton(
            "junction",
            "junction",
            () => native.requestEditorCommand("junction"),
            false,
            !native.project,
          )}
          {iconButton(
            "terminal",
            "terminal",
            () => native.requestEditorCommand("terminal"),
            false,
            !native.project,
          )}
          <button
            type="button"
            className="workbench-icon-button workbench-menu-trigger"
            aria-label={t("menuElectrical")}
            title={t("menuElectrical")}
            aria-haspopup="menu"
            aria-expanded={activeMenu === "electrical"}
            aria-controls="workbench-command-popover"
            onPointerEnter={cancelMenuClose}
            onPointerLeave={(event) => scheduleMenuClose(event.pointerType)}
            onClick={(event) => {
              toggleMenu("electrical", event.currentTarget, "electrical");
            }}
          >
            <span className="workbench-bolt" aria-hidden="true">
              ϟ
            </span>
            <span className="workbench-chevron" aria-hidden="true">
              ⌄
            </span>
          </button>
          {iconButton(
            "motor",
            "symbol",
            () => native.requestEditorCommand("motor"),
            false,
            !native.project,
          )}
          {iconButton(
            "ground",
            "symbol",
            () => native.requestEditorCommand("ground"),
            false,
            !native.project,
          )}
        </div>
        <div className="workbench-tool-group">
          {iconButton(
            "panTool",
            "pan",
            () => native.requestEditorCommand("pan"),
            false,
            !native.project,
          )}
          {iconButton(
            "zoomIn",
            "fit",
            () => native.requestEditorCommand("zoomIn"),
            false,
            !native.project,
          )}
          {iconButton(
            "fitPage",
            "fit",
            () => native.requestEditorCommand("fit"),
            false,
            !native.project,
          )}
          {iconButton(
            "zoomOut",
            "fit",
            () => native.requestEditorCommand("zoomOut"),
            false,
            !native.project,
          )}
        </div>
        <div className="workbench-tool-group">
          {iconButton(
            "schematicView",
            "circuit",
            () => native.setView("schematic"),
            native.view === "schematic",
            !native.project,
          )}
          {iconButton(
            "buildingDesign",
            "building",
            () => native.setView("building"),
            native.view === "building",
            !native.project,
            `${t("buildingDesign")} ${t("workspace")}`,
          )}
          {iconButton(
            "automationDesign",
            "junction",
            () => native.setView("automation"),
            native.view === "automation",
            !native.project,
            `${t("automationDesign")} ${t("workspace")}`,
          )}
          {iconButton(
            "panelDesign",
            "panel",
            () => native.setView("panel"),
            native.view === "panel",
            !native.project,
          )}
        </div>
        <div className="workbench-tool-group workbench-tool-end">
          {iconButton("openLibrary", "library", () => reveal("project"))}
          {iconButton("openDiagnostics", "check", () =>
            togglePanel("diagnostics"),
          )}
          {iconButton("workspaceSearch", "catalog", () =>
            searchDialog.current?.showModal(),
          )}
          <button
            type="button"
            className="workbench-icon-button workbench-menu-trigger"
            aria-label={t("ribbonMenu")}
            title={t("ribbonMenu")}
            aria-expanded={activeMenu === "ribbon"}
            aria-controls="workbench-command-popover"
            aria-haspopup="menu"
            onPointerEnter={cancelMenuClose}
            onPointerLeave={(event) => scheduleMenuClose(event.pointerType)}
            onClick={(event) => {
              toggleMenu("ribbon", event.currentTarget);
            }}
          >
            <CommandIcon kind="library" />
          </button>
          <button
            type="button"
            className="workbench-icon-button"
            aria-label={t("layout")}
            title={t("layout")}
            aria-pressed={editorToolsOpen}
            onClick={() => setEditorToolsOpen(!editorToolsOpen)}
          >
            <CommandIcon kind="align" />
          </button>
        </div>
      </div>
      <div
        className="workbench-command-popover"
        id="workbench-command-popover"
        data-open={commandOpen}
        style={popoverPosition}
        onPointerEnter={cancelMenuClose}
        onPointerLeave={(event) => scheduleMenuClose(event.pointerType)}
        onClick={(event) => {
          const target = event.target;
          if (
            !(target instanceof Element) ||
            target.closest(".ribbon-tabs") ||
            !target.closest("button")
          )
            return;
          closeMenu();
          if (!document.querySelector("dialog[open]"))
            menuAnchorRef.current?.focus();
        }}
        aria-hidden={!commandOpen}
        inert={!commandOpen}
      >
        <nav className="ribbon-tabs" aria-label={t("interface")}>
          {ribbonTabs.map(([id, key]) => (
            <button
              key={id}
              aria-pressed={tab === id}
              aria-label={
                id === "home" || id === "view" || id === "settings"
                  ? t(key)
                  : `${t(key)} ${t("ribbonMenu")}`
              }
              onClick={() =>
                id === "help"
                  ? help.current?.showModal()
                  : id === "ai"
                    ? setBotSignal((value) => value + 1)
                    : setTab(id)
              }
            >
              {t(key)}
            </button>
          ))}
        </nav>
        <div
          className="ribbon"
          data-tab={tab}
          aria-label={t(ribbonTabs.find(([id]) => id === tab)?.[1] ?? "home")}
        >
          {tab === "home" ? (
            <>
              <ProjectTools native={native} t={t} home />
              <HomeRibbon
                native={native}
                t={t}
                reveal={reveal}
                themes={() => setTab("settings")}
              />
            </>
          ) : tab === "file" || tab === "project" ? (
            <>
              <ProjectTools native={native} t={t} />
              <button
                className="ribbon-example-button"
                onClick={() => examplesDialog.current?.showModal()}
              >
                {t("demoProjects")}
              </button>
              <WorkspaceCommands
                tab={tab}
                native={native}
                t={t}
                reveal={reveal}
              />
            </>
          ) : tab === "view" ? (
            <>
              <label>
                <input
                  type="checkbox"
                  checked={prefs.compact}
                  onChange={(event) => set("compact", event.target.checked)}
                />
                {t("compactWorkspace")}
              </label>
              <div className="panel-toggles">
                {panelIds.map((id) => (
                  <label key={id}>
                    <input
                      type="checkbox"
                      checked={prefs.panels[id].visible}
                      onChange={(e) => {
                        const visible = e.target.checked;
                        panel(id, { visible });
                        if (visible) activateDock(prefs.panels[id].dock, id);
                        else {
                          setActiveLeft((current) =>
                            current === id ? null : current,
                          );
                          setActiveRight((current) =>
                            current === id ? null : current,
                          );
                          setActiveBottom((current) =>
                            current === id ? null : current,
                          );
                        }
                      }}
                    />
                    {t(id)}
                  </label>
                ))}
              </div>
              <button
                onClick={() => {
                  setPrefs((p) => ({ ...p, panels: defaults().panels }));
                  setActiveLeft("project");
                  setActiveRight(null);
                  setActiveBottom(null);
                }}
              >
                {t("reset")}
              </button>
            </>
          ) : tab === "settings" ? (
            <>
              <button
                aria-label={t("workspaceSearch")}
                onClick={() => searchDialog.current?.showModal()}
              >
                {t("workspaceSearch")}
              </button>
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
                    set(
                      "background",
                      e.target.value as Preferences["background"],
                    )
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
          ) : (
            <WorkspaceCommands
              tab={tab}
              native={native}
              t={t}
              reveal={reveal}
            />
          )}
        </div>
      </div>
      {native.error && (
        <p className="storage-error workbench-feedback" role="alert">
          {t(native.error)}
        </p>
      )}
      {account.checking && (
        <p className="storage-error workbench-feedback" role="status">
          {t("accountChecking")}
        </p>
      )}
      {storageError && (
        <p className="storage-error" role="status">
          {t("storageError")}
        </p>
      )}
      <div
        className={`engineering-layout ${has("left") ? "has-left" : ""} ${has("right") ? "has-right" : ""}`}
        data-editor-tools-open={editorToolsOpen}
      >
        <aside
          className="workbench-icon-rail workbench-rail-left"
          aria-label={t("panels")}
        >
          {iconButton(
            "project",
            "library",
            () => togglePanel("project"),
            activeLeft === "project",
          )}
          {iconButton(
            "schematicView",
            "circuit",
            () => native.setView("schematic"),
            native.view === "schematic",
            !native.project,
          )}
          {iconButton(
            "buildingDesign",
            "building",
            () => native.setView("building"),
            native.view === "building",
            !native.project,
          )}
          {iconButton(
            "automationDesign",
            "junction",
            () => native.setView("automation"),
            native.view === "automation",
            !native.project,
          )}
          {iconButton(
            "panelDesign",
            "panel",
            () => native.setView("panel"),
            native.view === "panel",
            !native.project,
          )}
          {iconButton(
            "openLibrary",
            "catalog",
            () => {
              if (activeLeft === "project") setActiveLeft(null);
              else reveal("project");
            },
            activeLeft === "project",
          )}
        </aside>
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
                  orthogonal={orthogonal}
                  toggleOrthogonal={toggleOrthogonal}
                  toggleSnap={toggleSnap}
                  coordinateReadout={coordinateReadout}
                />
              ) : (
                <div className="empty-workspace">
                  <span className="drawing-mark" aria-hidden="true">
                    ⌁
                  </span>
                  <h1>{t("noProject")}</h1>
                  <p>{t("emptyProject")}</p>
                  <button onClick={() => examplesDialog.current?.showModal()}>
                    {t("demoProjects")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
        {has("right") && region("right")}
        <aside
          className="workbench-icon-rail workbench-rail-right"
          aria-label={t("panels")}
        >
          {iconButton(
            "properties",
            "align",
            () => togglePanel("properties"),
            activeRight === "properties",
          )}
          {iconButton(
            "openDiagnostics",
            "check",
            () => togglePanel("diagnostics"),
            activeRight === "diagnostics",
          )}
          {iconButton(
            "openCalculations",
            "calc",
            () => togglePanel("calculations"),
            activeRight === "calculations",
          )}
          {iconButton(
            "panel3d",
            "panel",
            () => togglePanel("panel3d"),
            activeRight === "panel3d",
          )}
          {iconButton(
            "openBom",
            "report",
            () => togglePanel("bom"),
            activeRight === "bom",
          )}
          {iconButton(
            "reports",
            "report",
            () => togglePanel("reports"),
            activeRight === "reports",
          )}
          {iconButton("menuAiTools", "profile", () =>
            setBotSignal((value) => value + 1),
          )}
          {iconButton("settings", "theme", (event) => {
            toggleMenu("settings", event.currentTarget, "settings");
          })}
        </aside>
        <BotWindow
          native={native}
          ownerId={account.user?.id ?? null}
          t={t}
          openSignal={botSignal}
        />
        {has("bottom") && region("bottom")}
      </div>
      <footer className="status-bar">
        <span>
          <i />
          {t("ready")}
        </span>
        {native.project && (
          <span className="engineering-status">
            {native.project.name} · {activePage?.name}
            {" · "}
            {t("selectionCount")}: {native.selectedSymbolIds.length}
            {" · mm"}
          </span>
        )}
        {activePage && native.view === "schematic" && (
          <div className="status-cad-tools">
            <span className="status-coordinates" ref={coordinateReadout} />
            <button
              type="button"
              className="status-cad-toggle"
              aria-pressed={activePage.snapping}
              aria-keyshortcuts="F9"
              title={`${t("snapping")} (F9)`}
              onClick={toggleSnap}
            >
              {t("snapping")}
            </button>
            <button
              type="button"
              className="status-cad-toggle"
              aria-pressed={orthogonal}
              aria-keyshortcuts="F8"
              title={`${t("orthogonalMove")} (F8)`}
              onClick={toggleOrthogonal}
            >
              {t("orthogonalMove")}
            </button>
          </div>
        )}
        {connectivity && (
          <button
            type="button"
            className="status-diagnostics"
            data-severity={
              errorCount ? "error" : warningCount ? "warning" : "clear"
            }
            onClick={() => reveal("diagnostics")}
          >
            {t("diagnostics")} · {t("errors")} {errorCount} · {t("warnings")}{" "}
            {warningCount}
          </button>
        )}
        <span>
          © {new Date().getFullYear()}{" "}
          <a
            href={productConfig.links.corporateWebsite}
            target="_blank"
            rel="noreferrer"
          >
            Hephzibah Behulah
          </a>{" "}
          · {brands.elektroniker.name} · {productConfig.product.name}
        </span>
      </footer>
      <dialog
        ref={examplesDialog}
        className="examples-dialog"
        aria-label={t("demoProjects")}
      >
        <header>
          <h2>{t("demoProjects")}</h2>
          <button
            aria-label={`${t("close")} ${t("demoProjects")}`}
            onClick={() => examplesDialog.current?.close()}
          >
            ×
          </button>
        </header>
        <Suspense fallback={<p role="status">{t("catalogLoading")}</p>}>
          <ExampleLibrary
            native={native}
            t={t}
            opened={() => {
              set("compact", true);
              examplesDialog.current?.close();
            }}
          />
        </Suspense>
      </dialog>
      <dialog ref={help} aria-labelledby="guide-title">
        <h2 id="guide-title">{t("guide")}</h2>
        <p>{t("guideText")}</p>
        <h3>{t("privacy")}</h3>
        <p>{t("privacyText")}</p>
        <form method="dialog">
          <button>{t("close")}</button>
        </form>
      </dialog>
      <AccountPanel
        account={account}
        native={native}
        dialog={accountDialog}
        t={t}
      />
      <dialog
        ref={searchDialog}
        className="account-dialog"
        aria-label={t("workspaceSearch")}
      >
        <h2>{t("workspaceSearch")}</h2>
        <p>{t("workspaceSearchScope")}</p>
        <label>
          {t("workspaceSearchQuery")}
          <input
            type="search"
            value={search}
            maxLength={160}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <ul className="workspace-search-results">
          {native.projects
            .flatMap((project) => [
              {
                key: project.id,
                projectId: project.id,
                pageId: null as string | null,
                label: project.name,
              },
              ...project.pages.map((page) => ({
                key: `${project.id}:${page.id}`,
                projectId: project.id,
                pageId: page.id,
                label: `${page.name} · ${project.name}`,
              })),
            ])
            .filter(
              (result) =>
                search.trim() &&
                result.label
                  .toLocaleLowerCase()
                  .includes(search.trim().toLocaleLowerCase()),
            )
            .slice(0, 50)
            .map((result) => (
              <li key={result.key}>
                <button
                  onClick={() => {
                    native.select(result.projectId);
                    native.selectPage(result.pageId);
                    searchDialog.current?.close();
                  }}
                >
                  {result.label}
                </button>
              </li>
            ))}
        </ul>
        <form method="dialog">
          <button>{t("close")}</button>
        </form>
      </dialog>
    </div>
  );
}
