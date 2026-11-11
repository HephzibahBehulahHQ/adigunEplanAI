import { lazy, Suspense, useRef, useState } from "react";
import { primitives } from "../../../packages/schematic-editor/commands.ts";
import { validateProject } from "../../../packages/electrical-model/project.ts";
import type { MessageKey } from "../../../packages/localization";
import type { NativeProjects } from "./useNativeProjects";
import type { PanelId } from "./preferences";
import { CommandIcon } from "./WorkspaceRibbon";
import { LazyPanelBoundary } from "./LazyPanelBoundary";

const CatalogPanel = lazy(() =>
  import("./CatalogPanel").then((m) => ({ default: m.CatalogPanel })),
);
const EngineeringSymbols = lazy(() =>
  import("./EngineeringSymbols").then((m) => ({
    default: m.EngineeringSymbols,
  })),
);
type Dialog =
  | "align"
  | "distribute"
  | "place"
  | "symbols"
  | "catalog"
  | "validation"
  | "sync";

/** One ordered Home ribbon. Every button invokes native data or an existing editor command. */
export function HomeRibbon({
  native,
  t,
  reveal,
  themes,
}: {
  native: NativeProjects;
  t: (key: MessageKey) => string;
  reveal: (id: PanelId) => void;
  themes: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [content, setContent] = useState<Dialog>("place");
  const [valid, setValid] = useState(false);
  const [active, setActive] = useState("select");
  const selection = native.selectedSymbolIds.length;
  const iconOnlyCommands = new Set<MessageKey>([
    "undo",
    "cut",
    "copy",
    "paste",
    "rotate",
    "ribbonAlign",
    "ribbonDistribute",
    "junction",
    "ribbonNetLabel",
  ]);
  const open = (value: Dialog) => {
    setContent(value);
    dialog.current?.showModal();
  };
  const tool = (action: string) => {
    setActive(action);
    native.requestEditorCommand(action);
  };
  const command = (
    label: MessageKey,
    icon: string,
    action: () => void,
    disabled = !native.project,
    pressed?: boolean,
  ) => (
    <button
      className="ribbon-command"
      data-command={label}
      data-icon-only={iconOnlyCommands.has(label) || undefined}
      aria-label={`${t(label)} · ${t("home")}`}
      title={t(label)}
      disabled={disabled}
      aria-pressed={pressed}
      onClick={action}
    >
      <CommandIcon kind={icon} />
      <span>{t(label)}</span>
    </button>
  );
  const close = () => dialog.current?.close();
  const device = native.project?.devices.find(
    (d) => d.id === native.selectedDeviceId,
  );
  const mapped = native.project?.equipment3d.some(
    (e) => e.deviceId === device?.id,
  );
  return (
    <>
      <div className="home-command-groups" aria-label={t("ribbonWorkspace")}>
        <div className="home-group home-clipboard">
          {command("undo", "undo", native.undo, !native.canUndo)}
          {command("cut", "cut", () => tool("cut"), !selection)}
          {command("copy", "copy", () => tool("copy"), !selection)}
          {command("paste", "paste", () => tool("paste"))}
        </div>
        <div className="home-group">
          {command(
            "ribbonSelect",
            "select",
            () => tool("select"),
            !native.project,
            active === "select",
          )}
          {command(
            "ribbonMove",
            "pan",
            () => tool("move"),
            !native.project,
            active === "move",
          )}
          {command("rotate", "rotate", () => tool("rotate"), !selection)}
          {command("ribbonAlign", "align", () => open("align"), selection < 2)}
          {command(
            "ribbonDistribute",
            "distribute",
            () => open("distribute"),
            selection < 3,
          )}
        </div>
        <div className="home-group">
          {command("ribbonWire", "wire", () => tool("wire"))}
          {command("junction", "junction", () => tool("junction"))}
          {command("ribbonNetLabel", "label", () => tool("label"))}
          {command("terminal", "terminal", () => tool("terminal"))}
        </div>
        <div className="home-group home-library">
          {command("ribbonPlace", "symbol", () => open("place"))}
          {command("ribbonSymbols", "library", () => open("symbols"))}
          {command("ribbonCatalog", "catalog", () => open("catalog"))}
        </div>
        <div className="home-group">
          {command("ribbonValidate", "check", () => {
            try {
              validateProject(native.project);
              setValid(true);
            } catch {
              setValid(false);
            }
            open("validation");
          })}
          {command("ribbonECheck", "report", () => reveal("diagnostics"))}
        </div>
        <div className="home-group">
          {command("ribbonBom", "report", () => reveal("bom"))}
        </div>
        <div className="home-group home-view">
          {command("ribbonSync", "sync", () => {
            if (device && mapped) {
              native.selectDevice(device.id);
              reveal("panel3d");
            } else open("sync");
          })}
          {command("ribbonSwitch", "panel", () =>
            native.setView(native.view === "panel" ? "schematic" : "panel"),
          )}
        </div>
        <div className="home-group">
          {command("ribbonThemes", "theme", themes, false)}
        </div>
      </div>
      <dialog
        ref={dialog}
        className="home-command-dialog"
        aria-label={t(
          {
            align: "ribbonAlign",
            distribute: "ribbonDistribute",
            place: "ribbonPlace",
            symbols: "ribbonSymbols",
            catalog: "ribbonCatalog",
            validation: "ribbonValidate",
            sync: "ribbonSync",
          }[content] as MessageKey,
        )}
      >
        <div className="dialog-actions">
          <button onClick={close}>{t("close")}</button>
        </div>
        {(content === "align" || content === "distribute") && (
          <div className="arrangement-choices">
            {(["x", "y"] as const).map((axis) => (
              <button
                key={axis}
                onClick={() => {
                  tool(
                    content === "align"
                      ? axis === "x"
                        ? "alignX"
                        : "alignY"
                      : axis === "x"
                        ? "distributeX"
                        : "distributeY",
                  );
                  close();
                }}
              >
                {t(
                  content === "align"
                    ? axis === "x"
                      ? "alignX"
                      : "alignY"
                    : axis === "x"
                      ? "distributeX"
                      : "distributeY",
                )}
              </button>
            ))}
          </div>
        )}
        {content === "place" && (
          <>
            <p>{t("ribbonPlacementHint")}</p>
            <div className="placement-choices">
              {Object.keys(primitives).map((kind) => (
                <button
                  key={kind}
                  onClick={() => {
                    tool(kind);
                    close();
                  }}
                >
                  <CommandIcon kind={kind} />
                  {t(kind as MessageKey)}
                </button>
              ))}
            </div>
            {native.project?.symbolDefinitions
              .filter((d) => d.category === "custom")
              .map((d) => (
                <button
                  key={d.id}
                  onClick={() => {
                    tool("custom:" + d.id);
                    close();
                  }}
                >
                  {d.name}
                </button>
              ))}
          </>
        )}
        {(content === "catalog" || content === "symbols") && (
          <LazyPanelBoundary message={t("catalogScope")}>
            <Suspense fallback={<p role="status">{t("openLibrary")}…</p>}>
              {content === "catalog" ? (
                <CatalogPanel native={native} t={t} />
              ) : (
                <EngineeringSymbols
                  native={native}
                  t={t}
                  onPlace={(id) => {
                    tool("custom:" + id);
                    close();
                  }}
                />
              )}
            </Suspense>
          </LazyPanelBoundary>
        )}
        {content === "validation" && (
          <p role="status">
            {t(valid ? "nativeValidationPassed" : "nativeValidationFailed")}
          </p>
        )}
        {content === "sync" && <p>{t("ribbonSyncHint")}</p>}
      </dialog>
    </>
  );
}
