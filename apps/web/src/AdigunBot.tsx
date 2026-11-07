import { useEffect, useRef, useState, type PointerEvent } from "react";
import { analyze } from "../../../packages/connectivity-engine/analyze.ts";
import type { Project } from "../../../packages/electrical-model/project.ts";
import type { MessageKey } from "../../../packages/localization";

type Props = {
  project: Project | null;
  t: (key: MessageKey) => string;
  close: () => void;
  openDiagnostics: () => void;
  openBom: () => void;
  openHelp: () => void;
};

const layoutKey = "adiguneplanai.bot.layout.v1";
type Bounds = { x: number; y: number; width: number; height: number };
type Layout = Bounds & { mode: "normal" | "minimized" | "maximized" };
function readLayout(): Layout {
  const initial: Layout = {
    x: window.innerWidth - 348,
    y: 100,
    width: 332,
    height: 410,
    mode: "normal",
  };
  try {
    const saved: Partial<Layout> | null = JSON.parse(
      localStorage.getItem(layoutKey) ?? "null",
    );
    if (!saved) return initial;
    for (const key of ["x", "y", "width", "height"] as const)
      if (typeof saved[key] === "number" && Number.isFinite(saved[key]))
        initial[key] = saved[key];
    if (saved.mode === "minimized" || saved.mode === "maximized")
      initial.mode = saved.mode;
  } catch {
    // A missing or inaccessible preference must not block workspace tools.
  }
  return initial;
}

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.max(minimum, Math.min(value, maximum));
function fit(
  bounds: Bounds,
  viewport: { width: number; height: number },
): Bounds {
  const width = clamp(
    bounds.width,
    Math.min(320, viewport.width),
    Math.min(900, viewport.width),
  );
  const height = clamp(
    bounds.height,
    Math.min(320, viewport.height),
    Math.min(800, viewport.height),
  );
  return {
    x: clamp(bounds.x, 0, viewport.width - width),
    y: clamp(bounds.y, 0, viewport.height - height),
    width,
    height,
  };
}

export function AdigunBot({
  project,
  t,
  close,
  openDiagnostics,
  openBom,
  openHelp,
}: Props) {
  const [layout, setLayout] = useState(readLayout);
  const [viewport, setViewport] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));
  const drag = useRef<{
    pointer: number;
    x: number;
    y: number;
    bounds: Bounds;
    resize: boolean;
  } | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const mobile = viewport.width <= 680;
  const normal = fit(layout, viewport);
  const bounds =
    layout.mode === "maximized"
      ? {
          x: 16,
          y: 16,
          width: viewport.width - 32,
          height: viewport.height - 32,
        }
      : normal;

  useEffect(() => {
    const resize = () =>
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(layoutKey, JSON.stringify(layout));
    } catch {
      /* Preferences are optional. */
    }
  }, [layout]);
  useEffect(() => {
    closeButton.current?.focus({ preventScroll: true });
  }, []);

  function start(event: PointerEvent<HTMLElement>, resize: boolean) {
    if (
      mobile ||
      layout.mode === "maximized" ||
      event.button !== 0 ||
      !event.isPrimary ||
      (event.target as Element).closest("button")
    )
      return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      pointer: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      bounds: normal,
      resize,
    };
  }
  function move(event: PointerEvent<HTMLElement>) {
    const gesture = drag.current;
    if (gesture?.pointer !== event.pointerId) return;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    const startBounds = gesture.bounds;
    const next = gesture.resize
      ? {
          ...startBounds,
          width: clamp(
            startBounds.width + dx,
            320,
            viewport.width - startBounds.x,
          ),
          height: clamp(
            startBounds.height + dy,
            320,
            viewport.height - startBounds.y,
          ),
        }
      : { ...startBounds, x: startBounds.x + dx, y: startBounds.y + dy };
    setLayout((previous) => ({ ...previous, ...fit(next, viewport) }));
  }
  function end(event: PointerEvent<HTMLElement>) {
    if (drag.current?.pointer === event.pointerId) drag.current = null;
  }
  const [check, setCheck] = useState<{
    project: Project;
    errors: number;
    warnings: number;
  }>();
  const latest = check?.project === project ? check : undefined;

  return (
    <section
      className="bot-panel"
      data-mode={layout.mode}
      id="adigun-bot"
      aria-labelledby="adigun-bot-title"
      style={
        mobile
          ? undefined
          : {
              left: bounds.x,
              top: bounds.y,
              width: bounds.width,
              height: layout.mode === "minimized" ? undefined : bounds.height,
            }
      }
      onKeyDown={(event) => {
        if (event.key === "Escape") close();
      }}
    >
      <header
        className="bot-heading"
        onPointerDown={(event) => start(event, false)}
        onPointerMove={move}
        onLostPointerCapture={end}
      >
        <svg
          aria-hidden="true"
          width="27"
          height="27"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <rect x="4" y="6" width="16" height="14" rx="5" />
          <path d="M12 6V2M9 15h6M2 10v5m20-5v5" />
          <circle cx="9" cy="11" r="1" />
          <circle cx="15" cy="11" r="1" />
        </svg>
        <strong id="adigun-bot-title">Adigun BOT</strong>
        {!mobile && (
          <>
            <button
              type="button"
              title={t(
                layout.mode === "minimized" ? "botRestore" : "botMinimize",
              )}
              aria-label={t(
                layout.mode === "minimized" ? "botRestore" : "botMinimize",
              )}
              onClick={() =>
                setLayout((previous) => ({
                  ...previous,
                  mode: previous.mode === "minimized" ? "normal" : "minimized",
                }))
              }
            >
              {layout.mode === "minimized" ? "▣" : "−"}
            </button>
            {layout.mode !== "minimized" && (
              <button
                type="button"
                title={t(
                  layout.mode === "maximized" ? "botRestore" : "botMaximize",
                )}
                aria-label={t(
                  layout.mode === "maximized" ? "botRestore" : "botMaximize",
                )}
                onClick={() =>
                  setLayout((previous) => ({
                    ...previous,
                    mode:
                      previous.mode === "maximized" ? "normal" : "maximized",
                  }))
                }
              >
                {layout.mode === "maximized" ? "▣" : "□"}
              </button>
            )}
          </>
        )}
        <button
          ref={closeButton}
          type="button"
          onClick={close}
          aria-label={t("close")}
          title={t("close")}
        >
          ×
        </button>
      </header>
      <div className="bot-body" hidden={!mobile && layout.mode === "minimized"}>
        <p className="bot-mode">{t("botLocalTools")}</p>
        <p className="bot-context">{project?.name ?? t("noProject")}</p>
        <div
          className="bot-actions"
          role="group"
          aria-label={t("botQuickActions")}
        >
          <h3>{t("botQuickActions")}</h3>
          <button
            type="button"
            disabled={!project}
            onClick={() => {
              if (!project) return;
              const { findings } = analyze(project);
              setCheck({
                project,
                errors: findings.filter((item) => item.severity === "error")
                  .length,
                warnings: findings.filter((item) => item.severity === "warning")
                  .length,
              });
              openDiagnostics();
            }}
          >
            {t("botRunCheck")}
          </button>
          <button type="button" disabled={!project} onClick={openBom}>
            {t("bom")}
          </button>
          <button type="button" onClick={openHelp}>
            {t("help")}
          </button>
        </div>
        <div role="status">
          {latest && (
            <p>
              {t("errors")}: {latest.errors} · {t("warnings")}:{" "}
              {latest.warnings}
            </p>
          )}
        </div>
      </div>
      {!mobile && layout.mode === "normal" && (
        <span
          className="bot-resize"
          aria-hidden="true"
          onPointerDown={(event) => start(event, true)}
          onPointerMove={move}
          onLostPointerCapture={end}
        />
      )}
    </section>
  );
}
