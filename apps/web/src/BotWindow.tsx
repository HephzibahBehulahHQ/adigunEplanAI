import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import type { MessageKey } from "../../../packages/localization";
import type { NativeProjects } from "./useNativeProjects";
import {
  analyze,
  type ConnectivityFinding,
} from "../../../packages/connectivity-engine/analyze.ts";
import {
  inspectProject,
  localIntent,
  nextSuggestion,
  findingKey,
  type Inspection,
  type LocalTool,
} from "../../../packages/assistant/local-tools.ts";
import {
  clampWindow,
  restoreBotWindow,
  type BotWindow as WindowState,
} from "../../../packages/assistant/window.ts";
import "./bot-window.css";

type Translate = (key: MessageKey) => string;
type Message = {
  id: number;
  projectId: string | null;
  query: string;
  result: Inspection | null;
};
type Props = {
  native: NativeProjects;
  ownerId: string | null;
  t: Translate;
  openSignal: number;
};
export function BotWindow({ native, ownerId, t, openSignal }: Props) {
  const preferenceKey = `adiguneplanai.bot.window.v1.${ownerId ?? "guest"}`;
  const [windowState, setWindowState] = useState<WindowState>(() => {
    try {
      return restoreBotWindow(
        localStorage.getItem(preferenceKey),
        innerWidth,
        innerHeight,
      );
    } catch {
      return restoreBotWindow(null, innerWidth, innerHeight);
    }
  });
  const [preferenceError, setPreferenceError] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestion, setSuggestion] = useState<{
    projectId: string;
    finding: ConnectivityFinding;
  } | null>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const composer = useRef<HTMLInputElement>(null);
  const transcript = useRef<HTMLDivElement>(null);
  const sequence = useRef(0);
  const gesture = useRef<{
    kind: "move" | "resize";
    x: number;
    y: number;
    initial: WindowState;
  } | null>(null);
  const activity = useRef({ pointer: false, lastAt: performance.now() });
  const lastSuggestionAt = useRef(performance.now());
  const dismissed = useRef(new Set<string>());
  const project = native.project;
  const findings = useMemo(
    () => (project ? analyze(project).findings : []),
    [project],
  );
  const liveContext = useRef({ project, findings });
  liveContext.current = { project, findings };
  useEffect(() => {
    try {
      localStorage.setItem(preferenceKey, JSON.stringify(windowState));
    } catch {
      setPreferenceError(true);
    }
  }, [windowState, preferenceKey]);
  useEffect(() => {
    const resize = () =>
      setWindowState((value) => clampWindow(value, innerWidth, innerHeight));
    addEventListener("resize", resize);
    return () => removeEventListener("resize", resize);
  }, []);
  useEffect(() => {
    if (!openSignal) return;
    setWindowState((value) => ({ ...value, open: true, minimized: false }));
  }, [openSignal]);
  useEffect(() => {
    if (windowState.open && !windowState.minimized) composer.current?.focus();
  }, [windowState.open, windowState.minimized]);
  useEffect(() => {
    setMessages([]);
    setSuggestion(null);
    setQuery("");
    dismissed.current.clear();
    lastSuggestionAt.current = performance.now();
  }, [project?.id]);
  useEffect(() => {
    transcript.current?.scrollTo({ top: transcript.current.scrollHeight });
  }, [messages]);
  useEffect(() => {
    if (!windowState.live) return;
    const pointerDown = () => {
      activity.current = { pointer: true, lastAt: performance.now() };
    };
    const pointerUp = () => {
      activity.current = { pointer: false, lastAt: performance.now() };
    };
    const typing = () => {
      activity.current.lastAt = performance.now();
    };
    addEventListener("pointerdown", pointerDown);
    addEventListener("pointerup", pointerUp);
    addEventListener("pointercancel", pointerUp);
    addEventListener("blur", pointerUp);
    addEventListener("keydown", typing);
    const interval = setInterval(() => {
      const context = liveContext.current;
      if (!context.project) return;
      const now = performance.now();
      const finding = nextSuggestion(
        context.findings,
        now,
        lastSuggestionAt.current,
        activity.current.pointer || now - activity.current.lastAt < 2000,
        dismissed.current,
      );
      if (finding) {
        dismissed.current.add(findingKey(finding));
        lastSuggestionAt.current = now;
        setSuggestion({ projectId: context.project.id, finding });
      }
    }, 1000);
    return () => {
      clearInterval(interval);
      removeEventListener("pointerdown", pointerDown);
      removeEventListener("pointerup", pointerUp);
      removeEventListener("pointercancel", pointerUp);
      removeEventListener("blur", pointerUp);
      removeEventListener("keydown", typing);
    };
  }, [windowState.live]);
  const currentSuggestion =
    suggestion?.projectId === project?.id &&
    windowState.live &&
    findings.some(
      (finding) => findingKey(finding) === findingKey(suggestion.finding),
    )
      ? suggestion.finding
      : null;
  const visibleMessages = messages.filter(
    (message) => message.projectId === (project?.id ?? null),
  );
  const open = () =>
    setWindowState((value) => ({ ...value, open: true, minimized: false }));
  const close = () => {
    setWindowState((value) => ({ ...value, open: false }));
    launcher.current?.focus();
  };
  function run(tool: LocalTool | null, text: string) {
    const result =
      project && tool
        ? inspectProject(project, tool, native.selectedDeviceId)
        : null;
    setMessages((previous) => [
      ...previous.slice(-19),
      {
        id: ++sequence.current,
        projectId: project?.id ?? null,
        query: text,
        result,
      },
    ]);
    setQuery("");
  }
  function begin(event: PointerEvent<HTMLElement>, kind: "move" | "resize") {
    if (
      event.button !== 0 ||
      windowState.maximized ||
      (kind === "move" && (event.target as HTMLElement).closest("button"))
    )
      return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = {
      kind,
      x: event.clientX,
      y: event.clientY,
      initial: windowState,
    };
  }
  function move(event: PointerEvent<HTMLElement>) {
    const drag = gesture.current;
    if (!drag) return;
    const dx = event.clientX - drag.x,
      dy = event.clientY - drag.y;
    setWindowState(
      clampWindow(
        {
          ...drag.initial,
          ...(drag.kind === "move"
            ? { x: drag.initial.x + dx, y: drag.initial.y + dy }
            : {
                width: drag.initial.width + dx,
                height: drag.initial.height + dy,
              }),
        },
        innerWidth,
        innerHeight,
      ),
    );
  }
  const rect = windowState.maximized
    ? {
        x: Math.max(16, (innerWidth - Math.min(900, innerWidth - 32)) / 2),
        y: 24,
        width: Math.min(900, innerWidth - 32),
        height: Math.min(800, innerHeight - 48),
      }
    : windowState;
  return (
    <>
      <button
        ref={launcher}
        className="bot-launcher"
        aria-label={t("botOpen")}
        title={t("botOpen")}
        onClick={open}
      >
        <BotIcon />
        <span>Adigun BOT</span>
        {currentSuggestion && <i aria-label={t("botNewFinding")} />}
      </button>
      {windowState.open && (
        <aside
          className={`bot-window ${windowState.minimized ? "bot-minimized" : ""}`}
          aria-label="Adigun BOT"
          style={
            {
              left: rect.x,
              top: rect.y,
              width: rect.width,
              height: windowState.minimized ? 48 : rect.height,
            } as CSSProperties
          }
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.stopPropagation();
              close();
            }
          }}
        >
          <header
            className="bot-header"
            onPointerDown={(event) => begin(event, "move")}
            onPointerMove={move}
            onPointerUp={() => {
              gesture.current = null;
            }}
            onPointerCancel={() => {
              gesture.current = null;
            }}
          >
            <div
              className="bot-title"
              tabIndex={0}
              role="button"
              aria-label={t("botMove")}
              title={t("botMove")}
              onKeyDown={(event) => {
                const direction = {
                  ArrowLeft: [-10, 0],
                  ArrowRight: [10, 0],
                  ArrowUp: [0, -10],
                  ArrowDown: [0, 10],
                }[event.key];
                if (direction && !windowState.maximized) {
                  event.preventDefault();
                  setWindowState((value) =>
                    clampWindow(
                      {
                        ...value,
                        x: value.x + direction[0],
                        y: value.y + direction[1],
                      },
                      innerWidth,
                      innerHeight,
                    ),
                  );
                }
              }}
            >
              <BotIcon />
              <strong>Adigun BOT</strong>
            </div>
            <div className="bot-window-controls">
              <button
                aria-label={t(
                  windowState.minimized ? "botRestore" : "botMinimize",
                )}
                title={t(windowState.minimized ? "botRestore" : "botMinimize")}
                onClick={() =>
                  setWindowState((value) => ({
                    ...value,
                    minimized: !value.minimized,
                  }))
                }
              >
                {windowState.minimized ? "▤" : "−"}
              </button>
              <button
                aria-label={t(
                  windowState.maximized ? "botRestore" : "botMaximize",
                )}
                title={t(windowState.maximized ? "botRestore" : "botMaximize")}
                onClick={() =>
                  setWindowState((value) => ({
                    ...value,
                    maximized: !value.maximized,
                    minimized: false,
                  }))
                }
              >
                {windowState.maximized ? "❐" : "□"}
              </button>
              <button
                aria-label={t("botClose")}
                title={t("botClose")}
                onClick={close}
              >
                ×
              </button>
            </div>
          </header>
          {!windowState.minimized && (
            <>
              <p className="bot-mode">{t("localAssistantScope")}</p>
              <label className="bot-live">
                <input
                  type="checkbox"
                  checked={windowState.live}
                  onChange={(event) =>
                    setWindowState((value) => ({
                      ...value,
                      live: event.target.checked,
                    }))
                  }
                />
                {t("botLive")}
              </label>
              <p className="bot-context" aria-label={t("botContext")}>
                {project?.name ?? t("noProject")}
                {native.selectedDeviceId &&
                  ` · ${project?.devices.find((device) => device.id === native.selectedDeviceId)?.reference ?? ""}`}
              </p>
              {currentSuggestion && (
                <section
                  className="bot-suggestion"
                  aria-label={t("botNewFinding")}
                >
                  <p>{t(`rule${currentSuggestion.code}`)}</p>
                  <button
                    onClick={() => {
                      const instance = project?.symbolInstances.find(
                        (item) =>
                          currentSuggestion.entityIds.includes(item.id) ||
                          currentSuggestion.entityIds.includes(item.deviceId),
                      );
                      if (instance) {
                        native.selectDevice(instance.deviceId);
                        native.setView("schematic");
                      }
                      run("connections", t("botInspect"));
                      setSuggestion(null);
                    }}
                  >
                    {t("botInspect")}
                  </button>
                  <button onClick={() => setSuggestion(null)}>
                    {t("botDismiss")}
                  </button>
                </section>
              )}
              <div
                className="bot-quick-actions"
                aria-label={t("ribbonWorkspace")}
              >
                {(
                  [
                    ["connections", "assistantValidate"],
                    ["summary", "assistantSummary"],
                    ["selection", "botSelection"],
                    ["bom", "assistantReport"],
                  ] as const
                ).map(([tool, key]) => (
                  <button
                    key={tool}
                    disabled={!project}
                    onClick={() => run(tool, t(key))}
                  >
                    {t(key)}
                  </button>
                ))}
              </div>
              <div
                ref={transcript}
                className="bot-transcript"
                role="log"
                aria-live="polite"
                aria-relevant="additions"
                aria-label={t("localAssistant")}
              >
                {!visibleMessages.length && (
                  <p className="bot-empty">
                    {t(project ? "botPrivacy" : "assistantEmpty")}
                  </p>
                )}
                {visibleMessages.map((message) => (
                  <article key={message.id}>
                    <p className="bot-query">{message.query}</p>
                    {message.result ? (
                      <ToolResult
                        result={message.result}
                        currentRevision={project?.updatedAt}
                        t={t}
                      />
                    ) : (
                      <p>
                        {t(project ? "assistantUnknown" : "assistantEmpty")}
                      </p>
                    )}
                  </article>
                ))}
              </div>
              <form
                className="bot-composer"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (query.trim()) run(localIntent(query), query.trim());
                }}
              >
                <input
                  ref={composer}
                  aria-label={t("assistantPrompt")}
                  placeholder={t("assistantPrompt")}
                  value={query}
                  maxLength={1000}
                  onChange={(event) => setQuery(event.target.value)}
                />
                <button disabled={!query.trim()}>{t("assistantSend")}</button>
              </form>
              <footer>
                <small>{t("botPrivacy")}</small>
                <button onClick={() => setMessages([])}>{t("botClear")}</button>
              </footer>
              {preferenceError && (
                <p className="bot-error" role="status">
                  {t("botPreferenceError")}
                </p>
              )}
              {!windowState.maximized && (
                <div
                  className="bot-resize"
                  role="button"
                  tabIndex={0}
                  aria-label={t("botResize")}
                  title={t("botResize")}
                  onPointerDown={(event) => begin(event, "resize")}
                  onPointerMove={move}
                  onPointerUp={() => {
                    gesture.current = null;
                  }}
                  onPointerCancel={() => {
                    gesture.current = null;
                  }}
                  onKeyDown={(event) => {
                    const direction = {
                      ArrowLeft: [-10, 0],
                      ArrowRight: [10, 0],
                      ArrowUp: [0, -10],
                      ArrowDown: [0, 10],
                    }[event.key];
                    if (direction) {
                      event.preventDefault();
                      setWindowState((value) =>
                        clampWindow(
                          {
                            ...value,
                            width: value.width + direction[0],
                            height: value.height + direction[1],
                          },
                          innerWidth,
                          innerHeight,
                        ),
                      );
                    }
                  }}
                >
                  ◢
                </div>
              )}
            </>
          )}
        </aside>
      )}
    </>
  );
}
function ToolResult({
  result,
  currentRevision,
  t,
}: {
  result: Inspection;
  currentRevision?: string;
  t: Translate;
}) {
  return (
    <div className="bot-tool-result">
      <small>
        {t(result.revision === currentRevision ? "botSnapshot" : "botStale")}
      </small>
      {result.tool === "summary" && (
        <dl>
          {(
            [
              ["botPages", result.counts.pages],
              ["botDevices", result.counts.devices],
              ["connections", result.counts.wires],
              ["netlist", result.counts.nets],
              ["errors", result.counts.errors],
              ["warnings", result.counts.warnings],
            ] as const
          ).map(([key, count]) => (
            <div key={key}>
              <dt>{t(key)}</dt>
              <dd>{count}</dd>
            </div>
          ))}
        </dl>
      )}
      {result.tool === "connections" && (
        <>
          <p>
            {t("errors")}: {result.counts.errors} · {t("warnings")}:{" "}
            {result.counts.warnings}
          </p>
          {result.findings.length ? (
            <ul>
              {result.findings.map((finding) => (
                <li key={findingKey(finding)}>{t(`rule${finding.code}`)}</li>
              ))}
            </ul>
          ) : (
            <p>{t("botNoFindings")}</p>
          )}
        </>
      )}
      {result.tool === "bom" && (
        <ul>
          {result.devices.map((device) => (
            <li key={device.reference}>
              {device.reference} · {device.name} · {device.partNumber ?? "—"}
            </li>
          ))}
        </ul>
      )}
      {result.tool === "selection" &&
        (result.selected ? (
          <>
            <p>
              <strong>{result.selected.reference}</strong> ·{" "}
              {result.selected.name}
            </p>
            <p>
              {t("terminal")}: {result.selected.terminals} · {t("connections")}:{" "}
              {result.selected.wires}
              {result.selected.mounted && ` · ${t("botMounted")}`}
            </p>
          </>
        ) : (
          <p>{t("botNoSelection")}</p>
        ))}
    </div>
  );
}
export function BotIcon() {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <path d="M16 3v4M12 3h8M7 10h18v16H7ZM3 14v8h4M25 14h4v8h-4M12 30v-4M20 30v-4M12 22h8" />
      <circle cx="12" cy="16" r="1.5" fill="currentColor" />
      <circle cx="20" cy="16" r="1.5" fill="currentColor" />
    </svg>
  );
}
