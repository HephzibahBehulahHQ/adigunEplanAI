import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import type { MessageKey } from "../../../packages/localization";
import { ribbonTabs, type RibbonTab } from "./WorkspaceRibbon";

export function WorkbenchMenus({
  active,
  setActive,
  t,
  children,
}: {
  active: RibbonTab | null;
  setActive: (menu: RibbonTab | null) => void;
  t: (key: MessageKey) => string;
  children: ReactNode;
}) {
  const nav = useRef<HTMLElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const trigger = (menu: RibbonTab | null) =>
    nav.current?.querySelector<HTMLButtonElement>(
      `[data-menu-trigger="${menu}"]`,
    );
  function cancelClose() {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }
  function deferClose() {
    cancelClose();
    timer.current = setTimeout(() => setActive(null), 200);
  }
  function open(id: RibbonTab) {
    cancelClose();
    setActive(id);
  }
  useEffect(() => cancelClose, []);
  useLayoutEffect(() => {
    if (!active) return;
    const place = () => {
      const rect = trigger(active)?.getBoundingClientRect();
      if (!rect) return;
      const width = shell.current?.offsetWidth ?? 0;
      setPosition({
        left: Math.max(4, Math.min(rect.left, window.innerWidth - width - 4)),
        top: Math.max(
          rect.bottom,
          (nav.current?.getBoundingClientRect().bottom ?? rect.bottom) - 1,
        ),
      });
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return;
      if (
        shell.current?.contains(event.target) ||
        (event.target instanceof Element &&
          event.target.closest("[data-menu-trigger]"))
      )
        return;
      cancelClose();
      setActive(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      cancelClose();
      setActive(null);
      trigger(active)?.focus({ preventScroll: true });
    };
    place();
    const bar = nav.current;
    bar?.addEventListener("scroll", place);
    window.addEventListener("resize", place);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      bar?.removeEventListener("scroll", place);
      window.removeEventListener("resize", place);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [active, setActive]);
  return (
    <>
      <nav ref={nav} className="ribbon-tabs" aria-label={t("interface")}>
        {ribbonTabs.map(([id, key]) => (
          <button
            key={id}
            id={`workbench-trigger-${id}`}
            data-menu-trigger={id}
            title={t(key)}
            aria-expanded={active === id}
            aria-controls={active === id ? `workbench-menu-${id}` : undefined}
            aria-label={
              id === "home" ||
              id === "view" ||
              id === "options" ||
              id === "settings"
                ? t(key)
                : `${t(key)} ${t("ribbonMenu")}`
            }
            onPointerEnter={(event) => {
              if (event.pointerType === "mouse" && active) open(id);
            }}
            onPointerLeave={(event) => {
              if (event.pointerType === "mouse" && active === id) deferClose();
            }}
            onClick={() => open(id)}
            onKeyDown={(event) => {
              if (event.key !== "ArrowDown" && event.key !== "Tab") return;
              if (event.shiftKey || (event.key === "Tab" && active !== id))
                return;
              event.preventDefault();
              open(id);
              requestAnimationFrame(() =>
                shell.current
                  ?.querySelector<HTMLElement>(
                    "button:not(:disabled), input:not(:disabled), select:not(:disabled)",
                  )
                  ?.focus(),
              );
            }}
          >
            {t(key)}
          </button>
        ))}
      </nav>
      {active &&
        createPortal(
          <div
            key={active}
            ref={shell}
            id={`workbench-menu-${active}`}
            className="workbench-menu"
            data-tab={active}
            role="region"
            aria-labelledby={`workbench-trigger-${active}`}
            style={{
              ...position,
              maxHeight: `calc(100dvh - ${position.top + 4}px)`,
            }}
            onPointerEnter={cancelClose}
            onPointerLeave={(event) => {
              if (event.pointerType === "mouse") deferClose();
            }}
            onClick={(event) => {
              if (!(event.target instanceof Element)) return;
              if (!event.target.closest("button")) return;
              cancelClose();
              setActive(null);
              if (shell.current?.contains(document.activeElement)) {
                trigger(active)?.focus({ preventScroll: true });
              }
            }}
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  );
}
