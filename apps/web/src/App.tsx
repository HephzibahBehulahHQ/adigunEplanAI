import { useEffect, useRef, useState } from "react";
import {
  dictionaries,
  type MessageKey,
  type Language,
} from "../../../packages/localization";
import {
  defaults,
  panelIds,
  restorePreferences,
  storageKey,
  type Dock,
  type PanelId,
  type PanelState,
  type Preferences,
} from "./preferences";
import logo from "./assets/hephzibah-behulah-official.jpg";
import "./workspace.css";

export function App() {
  const [prefs, setPrefs] = useState<Preferences>(() => {
    try {
      return restorePreferences(localStorage.getItem(storageKey));
    } catch {
      return defaults();
    }
  });
  const [tab, setTab] = useState<"view" | "settings">("view");
  const [storageError, setStorageError] = useState(false);
  const help = useRef<HTMLDialogElement>(null);
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
            <p className="empty-hint">
              {t(id === "diagnostics" ? "noDiagnostics" : "emptyPanel")}
            </p>
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
        <span className="project-title">{t("noProject")}</span>
        <span className="local-status">
          <i />
          {t("local")}
        </span>
      </header>
      <nav className="ribbon-tabs" aria-label={t("interface")}>
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
      <div className="ribbon" aria-label={t(tab)}>
        {tab === "view" ? (
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
            <span>{t("noProject")}</span>
          </header>
          <div className="drawing-viewport">
            <div
              className="drawing-sheet"
              data-background={prefs.background}
              style={{
                backgroundColor:
                  prefs.background === "dark"
                    ? "#101827"
                    : prefs.background === "custom"
                      ? prefs.color
                      : "#ffffff",
              }}
            >
              <div className="empty-workspace">
                <span className="drawing-mark" aria-hidden="true">
                  ⌁
                </span>
                <h1>{t("noProject")}</h1>
                <p>{t("emptyProject")}</p>
              </div>
            </div>
          </div>
        </main>
        {has("right") && region("right")}
        {has("bottom") && region("bottom")}
      </div>
      <footer className="status-bar">
        <span>
          <i />
          {t("ready")}
        </span>
        <span>{t("local")}</span>
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
