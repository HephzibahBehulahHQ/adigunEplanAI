import type { MessageKey } from "../../../packages/localization";
import type { NativeProjects, WorkspaceView } from "./useNativeProjects";
import type { PanelId } from "./preferences";

export const ribbonTabs = [
  ["file", "menuFile"],
  ["home", "home"],
  ["insert", "menuInsert"],
  ["edit", "menuEdit"],
  ["view", "view"],
  ["project", "menuProject"],
  ["electrical", "menuElectrical"],
  ["connections", "menuConnections"],
  ["components", "menuComponents"],
  ["automation", "menuAutomation"],
  ["plc", "menuPlc"],
  ["building", "buildingDesign"],
  ["power", "menuPower"],
  ["panel", "panel3d"],
  ["documentation", "menuDocumentation"],
  ["analysis", "menuAnalysis"],
  ["ai", "menuAiTools"],
  ["tools", "menuTools"],
  ["options", "menuOptions"],
  ["settings", "settings"],
  ["help", "help"],
] as const satisfies readonly (readonly [string, MessageKey])[];
export type RibbonTab = (typeof ribbonTabs)[number][0];
type Props = {
  tab: RibbonTab;
  native: NativeProjects;
  t: (key: MessageKey) => string;
  reveal: (id: PanelId) => void;
};

/** Original line icons; commands delegate to the same native editor actions. */
export function CommandIcon({ kind }: { kind: string }) {
  const paths: Record<string, string> = {
    "sidebar-left": "M3 4h18v16H3ZM9 4v16m-2-8-2-2m2 2-2 2",
    "sidebar-right": "M3 4h18v16H3ZM15 4v16m2-8 2-2m-2 2 2 2",
    cut: "M4 4a3 3 0 1 1 0 6 3 3 0 0 1 0-6ZM4 14a3 3 0 1 1 0 6 3 3 0 0 1 0-6ZM7 8l14 12M7 16 21 4",
    distribute: "M2 3v18M22 3v18M6 8h3v8H6ZM15 8h3v8h-3ZM2 5h20",
    junction: "M12 2v20M2 12h20M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
    terminal: "M2 12h5M17 12h5M7 5h10v14H7ZM9 12h6M12 9v6",
    catalog: "M4 2h16v20H4ZM7 6h3v4H7ZM14 6h3v4h-3ZM7 14h3v4H7ZM14 14h3v4h-3",
    sync: "M4 7h14l-4-4M20 17H6l4 4M2 12V7h4M22 12v5h-4M9 9h6v6H9Z",
    theme: "M12 2 3 7v10l9 5 9-5V7ZM12 6v12M7 9l10 6M7 15l10-6",
    cloud:
      "M6 18a5 5 0 0 1-1-10 7 7 0 0 1 13-1 5 5 0 0 1 1 10M12 12v10M8 18l4 4 4-4",
    bell: "M5 17h14l-2-3V9a5 5 0 0 0-10 0v5ZM10 21h4M12 2v2",
    help: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9 9a3 3 0 0 1 6 0c0 2-3 2-3 4M12 17h.01",
    profile: "M16 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 22v-3a8 8 0 0 1 16 0v3",
    select: "M5 3v17l5-5 4 7 3-2-4-6 7-1Z",
    pan: "M12 2v20M2 12h20M8 6l4-4 4 4M8 18l4 4 4-4M6 8l-4 4 4 4M18 8l4 4-4 4",
    wire: "M3 4h7v16h11M3 2v4M19 18v4",
    label: "M3 5h12l6 7-6 7H3ZM7 10v4M10 10v4",
    rotate: "M5 8a8 8 0 1 1-1 9M5 2v6h6",
    mirror: "M12 2v20M8 5 2 19h6ZM16 5l6 14h-6Z",
    delete: "M3 6h18M9 6V3h6v3M6 6l1 16h10l1-16M10 10v8M14 10v8",
    fit: "M2 8V2h6M16 2h6v6M2 16v6h6M16 22h6v-6M7 7h10v10H7Z",
    library: "M3 3h7v18H3ZM14 3h7v18h-7ZM5 7h3M16 7h3",
    check: "M12 2 3 6v6c0 6 9 10 9 10s9-4 9-10V6ZM7 12l3 3 7-7",
    calc: "M4 2h16v20H4ZM7 5h10v4H7ZM7 12h2M12 12h2M17 12h1M7 16h2M12 16h2M17 16h1M7 19h2M12 19h2",
    report: "M5 2h9l5 5v15H5ZM14 2v6h5M8 12h8M8 16h8M8 19h5",
    panel: "M4 2h16v20H4ZM7 6h10M7 11h10M7 16h10M8 4v4M14 9v4M10 14v4",
    circuit: "M2 6h6M8 3v6M10 3v6M10 6h5v12H9M9 15v6M7 15v6M7 18H2",
    building: "M2 21h20M4 21V3h11v18M15 10h5v11M7 6h4M7 10h4M7 14h4M7 18h4",
    undo: "M8 3 2 9l6 6M2 9h12a7 7 0 0 1 7 7v5",
    redo: "M16 3l6 6-6 6M22 9H10a7 7 0 0 0-7 7v5",
    copy: "M8 8h13v14H8ZM16 8V2H2v14h6",
    paste: "M8 3H4v19h16V3h-4M8 1h8v5H8Z",
    duplicate: "M3 3h12v12H3ZM9 15v6h12V9h-6",
    symbol: "M2 12h5M17 12h5M7 7h10v10H7Z",
    new: "M5 2h9l5 5v15H5ZM14 2v6h5M9 15h6m-3-3v6",
    open: "M2 6h8l2 2h10l-3 12H2ZM2 10h18",
    save: "M3 2h15l3 3v17H3ZM7 2v7h10V2M7 22v-8h10v8",
    export: "M13 3H5v18h14v-8M12 12l9-9M15 3h6v6",
    saveAll: "M6 2h13l3 3v14H6ZM9 2v6h9V2M2 6v16h16M9 19v-7h10v7",
    close: "M3 5h8l2 3h9v13H3ZM9 11l7 7M16 11l-7 7",
    print: "M6 8V2h12v6M6 17H2V8h20v9h-4M6 13h12v9H6ZM18 11h1",
    align: "M3 2v20M7 4h8v5H7ZM7 13h14v6H7Z",
  };
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[kind] ?? paths.symbol} />
    </svg>
  );
}
export function WorkspaceCommands({ tab, native, t, reveal }: Props) {
  const command = (
    key: MessageKey,
    icon: string,
    action: () => void,
    disabled = !native.project,
  ) => (
    <button
      key={key}
      className="ribbon-command"
      aria-label={`${t(key)} · ${t("ribbonWorkspace")}`}
      disabled={disabled}
      onClick={action}
    >
      <CommandIcon kind={icon} />
      <span>{t(key)}</span>
    </button>
  );
  const tool = (key: MessageKey, action: string, icon = action) =>
    command(key, icon, () => native.requestEditorCommand(action));
  const view = (key: MessageKey, value: WorkspaceView, icon: string) =>
    command(key, icon, () => native.setView(value));
  const dock = (key: MessageKey, id: PanelId, icon: string) =>
    command(key, icon, () => reveal(id));
  const selection = !native.selectedSymbolIds.length;
  const editing = (
    <>
      {command("undo", "undo", native.undo, !native.canUndo)}
      {command("redo", "redo", native.redo, !native.canRedo)}
      {command(
        "copy",
        "copy",
        () => native.requestEditorCommand("copy"),
        selection,
      )}
      {tool("paste", "paste")}
      {command(
        "rotate",
        "rotate",
        () => native.requestEditorCommand("rotate"),
        selection,
      )}
      {command(
        "mirror",
        "mirror",
        () => native.requestEditorCommand("mirror"),
        selection,
      )}
      {command(
        "duplicate",
        "duplicate",
        () => native.requestEditorCommand("duplicate"),
        selection,
      )}
      {command(
        "delete",
        "delete",
        () => native.requestEditorCommand("delete"),
        selection,
      )}
    </>
  );
  const wiring = (
    <>
      {tool("selectTool", "select")}
      {tool("panTool", "pan")}
      {tool("wireTool", "wire")}
      {tool("labelTool", "label")}
    </>
  );
  const analysis = (
    <>
      {dock("openDiagnostics", "diagnostics", "check")}
      {dock("openCalculations", "calculations", "calc")}
    </>
  );
  return (
    <div className="ribbon-command-groups" aria-label={t("ribbonWorkspace")}>
      {tab === "insert" && (
        <>
          {(
            [
              "terminal",
              "junction",
              "resistor",
              "fuse",
              "contact",
              "coil",
              "lamp",
              "motor",
              "ground",
            ] as const
          ).map((kind) => tool(kind, kind, "symbol"))}
          {dock("openLibrary", "project", "library")}
        </>
      )}
      {tab === "edit" && editing}
      {(tab === "electrical" || tab === "connections") && (
        <>
          {wiring}
          {dock("openDiagnostics", "diagnostics", "check")}
        </>
      )}
      {tab === "components" && (
        <>
          {dock("openLibrary", "project", "library")}
          {dock("openBom", "bom", "report")}
        </>
      )}
      {(tab === "automation" || tab === "plc") && (
        <>
          {view("openAutomation", "automation", "panel")}
          {view("openSchematic", "schematic", "circuit")}
          {dock("openReports", "reports", "report")}
        </>
      )}
      {tab === "building" && (
        <>
          {view("openBuilding", "building", "building")}
          {analysis}
          {dock("openReports", "reports", "report")}
        </>
      )}
      {tab === "power" && (
        <>
          {view("openSchematic", "schematic", "circuit")}
          {analysis}
          {dock("openReports", "reports", "report")}
        </>
      )}
      {tab === "panel" && (
        <>
          {view("openPanel", "panel", "panel")}
          {dock("panel3d", "panel3d", "panel")}
          {dock("openBom", "bom", "report")}
        </>
      )}
      {tab === "documentation" && (
        <>
          {dock("openReports", "reports", "report")}
          {dock("openBom", "bom", "report")}
          {dock("openProperties", "properties", "report")}
        </>
      )}
      {tab === "analysis" && analysis}
      {tab === "tools" && (
        <>
          {wiring}
          {tool("fitPage", "fit", "fit")}
          {tool("zoomIn", "zoomIn", "fit")}
          {tool("zoomOut", "zoomOut", "fit")}
          {tool("zoomExtents", "zoomExtents", "fit")}
          {tool("zoomWindow", "zoomWindow", "fit")}
          {tool("zoomPrevious", "zoomPrevious", "undo")}
          {analysis}
        </>
      )}
      {tab === "project" && dock("openProperties", "properties", "report")}
    </div>
  );
}
