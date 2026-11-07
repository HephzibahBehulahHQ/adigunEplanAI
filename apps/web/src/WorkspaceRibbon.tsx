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
  ["tools", "menuTools"],
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
      {tab === "home" && (
        <>
          {wiring}
          {dock("openDiagnostics", "diagnostics", "check")}
          {dock("openReports", "reports", "report")}
        </>
      )}
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
          {analysis}
        </>
      )}
      {tab === "project" && dock("openProperties", "properties", "report")}
    </div>
  );
}
