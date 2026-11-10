import { analyze } from "../../../packages/connectivity-engine/analyze.ts";
import productConfig from "../../../product.config.json";
import brands from "../../../packages/design-tokens/brands.json";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  lazy,
  Suspense,
  type CSSProperties,
} from "react";
import {
  WorkspaceCommands,
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
import { useAccount, profileName, type Account } from "./useAccount";
import { AccountPanel } from "./AccountPanel";
import {
  ProjectTools,
  NativeDataPanel,
  ProjectNavigator,
  ProjectProperties,
  NativeDrawing,
} from "./NativeWorkspace";
import logo from "./assets/hephzibah-behulah-official.jpg";
import "./workspace.css";
import "./account.css";

const ExampleLibrary = lazy(() =>
  import("./ExampleLibrary").then((module) => ({
    default: module.ExampleLibrary,
  })),
);

export function App() {
  const account = useAccount();
  return <Workspace key={account.user?.id ?? "guest"} account={account} />;
}
function Workspace({ account }: { account: Account }) {
  const native = useNativeProjects(account.user?.id ?? null);
  const connectivity = useMemo(
    () => (native.project ? analyze(native.project) : null),
    [native.project],
  );
  const examplesDialog = useRef<HTMLDialogElement>(null);
  const accountDialog = useRef<HTMLDialogElement>(null);
  const searchDialog = useRef<HTMLDialogElement>(null);
  const languageSelect = useRef<HTMLSelectElement>(null);
  const [search, setSearch] = useState("");
  const focusLanguage = useRef(false);
  const [prefs, setPrefs] = useState<Preferences>(() => {
    try {
      return restorePreferences(localStorage.getItem(storageKey));
    } catch {
      return defaults();
    }
  });
  const [botSignal, setBotSignal] = useState(0);
  const [tab, setTab] = useState<RibbonTab>("home");
  const [storageError, setStorageError] = useState(false);
  const help = useRef<HTMLDialogElement>(null);
  const [layoutOpen, setLayoutOpen] = useState<
    Partial<Record<PanelId, boolean>>
  >({});
  const t = (key: MessageKey) => dictionaries[prefs.language][key];
  useEffect(() => {
    if (tab === "settings" && focusLanguage.current) {
      languageSelect.current?.focus();
      focusLanguage.current = false;
    }
  }, [tab]);
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
  const reveal = (id: PanelId) => {
    panel(id, { visible: true, collapsed: false });
    requestAnimationFrame(() => {
      const element = document.querySelector<HTMLElement>(
        `[data-panel="${id}"]`,
      );
      element
        ?.querySelector<HTMLButtonElement>(".panel-heading button")
        ?.focus();
      if (id === "project") {
        const library =
          element?.querySelector<HTMLDetailsElement>(".component-library");
        if (library) {
          library.open = true;
          library.querySelector<HTMLElement>("summary")?.focus();
          library.scrollIntoView({ block: "nearest" });
        }
      }
    });
  };
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
              <ProjectNavigator native={native} t={t} />
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
    <div
      className="application"
      data-compact={prefs.compact}
      inert={account.checking && !account.user}
    >
      <a className="skip-link" href="#workspace">
        {t("skip")}
      </a>
      <header className="app-header">
        <img
          className="corporate-logo"
          src={logo}
          alt={productConfig.branding.corporateLogo.alt}
        />
        <div className="wordmark">
          <strong>{productConfig.product.name}</strong>
          <small>{t("division")}</small>
        </div>
        <span className="project-title">
          {native.project?.name ?? t("noProject")}
        </span>
        <div className="owner-toolbar" aria-label={t("accountToolbar")}>
          <span
            className="local-status"
            title={t(native.saved ? "savedLocally" : "notSaved")}
          >
            {t(native.saved ? "savedLocally" : "notSaved")}
          </span>
          <button
            className="owner-icon profile-button"
            aria-label={t("account")}
            title={
              profileName(account.user) ||
              account.user?.email ||
              t("accountGuest")
            }
            onClick={() => accountDialog.current?.showModal()}
          >
            <>
              {account.avatarUrl ? (
                <img
                  src={account.avatarUrl}
                  alt=""
                  className="profile-avatar"
                />
              ) : (
                <ToolbarIcon kind="profile" />
              )}
            </>
            <span
              className={`account-dot ${account.verified ? "verified" : ""}`}
              data-account-state={
                account.verified
                  ? "verified"
                  : account.checking
                    ? "checking"
                    : account.user
                      ? "unverified"
                      : "guest"
              }
              aria-label={t(
                account.verified
                  ? "accountSignedIn"
                  : account.user
                    ? "accountOffline"
                    : "accountGuest",
              )}
            />
          </button>
          <button
            className="owner-icon"
            aria-label={t("languageOptions")}
            title={t("languageOptions")}
            onClick={() => {
              if (tab === "settings") languageSelect.current?.focus();
              else {
                focusLanguage.current = true;
                setTab("settings");
              }
            }}
          >
            {prefs.language.toUpperCase()}
          </button>
          <button
            className="owner-icon"
            aria-label={t("settings")}
            title={t("settings")}
            aria-pressed={tab === "settings"}
            onClick={() => setTab("settings")}
          >
            <ToolbarIcon kind="settings" />
          </button>
          <button
            className="owner-icon"
            aria-label={t("workspaceSearch")}
            title={t("workspaceSearch")}
            onClick={() => searchDialog.current?.showModal()}
          >
            <ToolbarIcon kind="search" />
          </button>
          <button
            className="owner-icon"
            aria-label={t("help")}
            title={t("help")}
            onClick={() => help.current?.showModal()}
          >
            <ToolbarIcon kind="help" />
          </button>
        </div>
      </header>
      <nav className="ribbon-tabs" aria-label={t("interface")}>
        {ribbonTabs.map(([id, key]) => (
          <button
            key={id}
            aria-pressed={tab === id}
            aria-label={
              id === "home" || id === "view"
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
      {native.error && (
        <p className="storage-error" role="alert">
          {t(native.error)}
        </p>
      )}
      {account.checking && (
        <p className="storage-error" role="status">
          {t("accountChecking")}
        </p>
      )}
      <div
        className="ribbon"
        aria-label={t(ribbonTabs.find(([id]) => id === tab)?.[1] ?? "home")}
      >
        {tab === "home" || tab === "file" || tab === "project" ? (
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
        ) : tab === "settings" ? (
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
                ref={languageSelect}
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
        ) : (
          <WorkspaceCommands tab={tab} native={native} t={t} reveal={reveal} />
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
                <NativeDrawing native={native} t={t} />
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
        {has("bottom") && region("bottom")}
      </div>
      <BotWindow
        native={native}
        ownerId={account.user?.id ?? null}
        t={t}
        openSignal={botSignal}
      />
      <footer className="status-bar">
        <span>
          <i />
          {t("ready")}
        </span>
        {native.project && (
          <span className="engineering-status">
            {native.project.name} ·{" "}
            {native.project.pages.find((p) => p.id === native.selectedPageId)
              ?.name ?? native.project.pages[0]?.name}
            {" · "}
            {t("selectionCount")}: {native.selectedSymbolIds.length}
            {" · mm"}
          </span>
        )}
        <span>
          {native.project
            ? t(native.saved ? "savedLocally" : "notSaved")
            : t("local")}
        </span>
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

function ToolbarIcon({
  kind,
}: {
  kind: "profile" | "settings" | "search" | "help";
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="21"
      height="21"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {kind === "profile" ? (
        <>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
        </>
      ) : kind === "search" ? (
        <>
          <circle cx="10" cy="10" r="6.5" />
          <path d="m15 15 6 6" />
        </>
      ) : kind === "help" ? (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4m0 4h.01" />
        </>
      ) : (
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="m9 3-.5 3-2 1-3-.5L2 10l2.5 2L4 15l3 2 .5 3h5l1-3 3-1 2.5 1 2-4-2-2 .5-3-3-2-1-3Z" />
        </>
      )}
    </svg>
  );
}
