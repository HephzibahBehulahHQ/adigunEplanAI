import { annotationLayout } from "../../../packages/reporting/annotation-layout.ts";
import { Glyph } from "./Glyph";
import { createPortal } from "react-dom";
import { SymbolArtwork } from "./SymbolArtwork";
import { WireProperties } from "./WireProperties";
import "./schematic-editor.css";
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { Project } from "../../../packages/electrical-model/project.ts";
import {
  bounds,
  pinPosition,
  route,
  type Point,
} from "../../../packages/schematic-editor/geometry.ts";
import {
  align,
  connect,
  insertJunction,
  ensureLayer,
  mirror,
  move,
  place,
  paste,
  primitives,
  remove,
  removeWire,
  setWireRoute,
  rotate,
  type Primitive,
} from "../../../packages/schematic-editor/commands.ts";
import type { MessageKey } from "../../../packages/localization";
import type { NativeProjects } from "./useNativeProjects";
export type NativeClipboard = { project: Project; ids: string[] };
type Props = {
  clipboard: NativeClipboard | null;
  setClipboard: (value: NativeClipboard | null) => void;
  native: NativeProjects;
  page: Project["pages"][number];
  t: (key: MessageKey) => string;
};
type Box = { x: number; y: number; w: number; h: number };
type Drag = {
  kind: "pan" | "move" | "marquee";
  start: Point;
  view: Box;
  matrix: DOMMatrix;
  ids: string[];
  last: Point;
};
export function SchematicEditor({
  native,
  page,
  t,
  clipboard,
  setClipboard,
}: Props) {
  const project = native.project!;
  const [tool, setTool] = useState<
    "select" | "pan" | "wire" | "label" | "custom" | Primitive
  >("select");
  const [customDefinition, setCustomDefinition] = useState("");
  const selected = native.selectedSymbolIds.filter((id) =>
    project.symbolInstances.some((s) => s.id === id && s.pageId === page.id),
  );
  const setSelected = native.selectSymbols;
  const [selectedWire, setSelectedWire] = useState<string | null>(null);
  const [fromPin, setFromPin] = useState<string | null>(null);
  const [labelPin, setLabelPin] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState<string | null>(null);
  const [view, setView] = useState<Box>({
    x: 0,
    y: 0,
    w: page.widthMm,
    h: page.heightMm,
  });
  const [preview, setPreview] = useState<Point>({ x: 0, y: 0 });
  const [marquee, setMarquee] = useState<{ a: Point; b: Point } | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<Drag | null>(null);
  const layers = project.layers.filter((l) => l.pageId === page.id);
  const layerId = layers.some((l) => l.id === activeLayer)
    ? activeLayer
    : (layers[0]?.id ?? null);
  const grid = page.snapping ? page.gridMm : 0;
  const moveStep = page.snapping ? page.gridMm : 1;
  useEffect(() => {
    setSelected((previous) => {
      const next = previous.filter((id) => {
        const instance = project.symbolInstances.find((item) => item.id === id);
        const layer = project.layers.find(
          (item) => item.id === instance?.layerId,
        );
        return instance && layer?.visible && !layer.locked;
      });
      return next.length === previous.length ? previous : next;
    });
    setSelectedWire((previous) =>
      previous && project.wires.some((wire) => wire.id === previous)
        ? previous
        : null,
    );
    setFromPin((previous) =>
      previous && project.pins.some((pin) => pin.id === previous)
        ? previous
        : null,
    );
    setLabelPin((previous) =>
      previous && project.pins.some((pin) => pin.id === previous)
        ? previous
        : null,
    );
  }, [project]);
  useEffect(
    () => setView({ x: 0, y: 0, w: page.widthMm, h: page.heightMm }),
    [page.widthMm, page.heightMm],
  );
  function point(event: { clientX: number; clientY: number }): Point {
    const matrix = svg.current?.getScreenCTM()?.inverse();
    if (!matrix) throw new Error("Canvas transform unavailable");
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(
      matrix,
    );
    return { x: p.x, y: p.y };
  }
  function fit() {
    setView({ x: 0, y: 0, w: page.widthMm, h: page.heightMm });
  }
  function zoom(
    factor: number,
    anchor: Point = { x: view.x + view.w / 2, y: view.y + view.h / 2 },
  ) {
    const w = Math.min(page.widthMm * 4, Math.max(20, view.w / factor));
    const scale = w / view.w;
    setView({
      x: anchor.x - (anchor.x - view.x) * scale,
      y: anchor.y - (anchor.y - view.y) * scale,
      w,
      h: view.h * scale,
    });
  }
  function edit(action: (p: Project) => Project) {
    native.update(action);
  }
  function deleteSelected() {
    if (selectedWire) {
      edit((p) => removeWire(p, selectedWire));
      setSelectedWire(null);
    } else if (selected.length) {
      edit((p) => remove(p, selected));
      setSelected([]);
    }
  }
  function duplicateSelected(ids = selected) {
    if (!ids.length) return;
    edit((p) => {
      const target = layerId ?? ensureLayer(p, page.id, t("layers"));
      setSelected(paste(p, structuredClone(p), ids, page.id, target, grid));
      return p;
    });
  }
  function pasteClipboard() {
    if (!clipboard?.ids.length) return;
    edit((p) => {
      const target = layerId ?? ensureLayer(p, page.id, t("layers"));
      setSelected(
        paste(p, clipboard.project, clipboard.ids, page.id, target, grid),
      );
      return p;
    });
  }
  function begin(event: ReactPointerEvent<SVGSVGElement>) {
    svg.current?.focus();
    const world = point(event);
    const matrix = svg.current!.getScreenCTM()!.inverse();
    if (tool === "pan" || event.button === 1) {
      event.preventDefault();
      drag.current = {
        kind: "pan",
        start: world,
        last: world,
        view,
        matrix,
        ids: [],
      };
      svg.current!.setPointerCapture(event.pointerId);
      return;
    }
    if (Object.hasOwn(primitives, tool) || tool === "custom") {
      edit((p) => {
        const target = layerId ?? ensureLayer(p, page.id, t("layers"));
        const id = place(
          p,
          page.id,
          target,
          tool as Primitive | "custom",
          world,
          grid,
          customDefinition,
        );
        setSelected([id]);
        setActiveLayer(target);
        return p;
      });
      return;
    }
    if (tool === "select") {
      drag.current = {
        kind: "marquee",
        start: world,
        last: world,
        view,
        matrix,
        ids: event.shiftKey ? selected : [],
      };
      setMarquee({ a: world, b: world });
      svg.current!.setPointerCapture(event.pointerId);
      setSelectedWire(null);
    }
  }
  function beginSymbol(event: ReactPointerEvent<SVGGElement>, id: string) {
    if (tool === "pan") return;
    if (tool !== "select") return;
    event.stopPropagation();
    svg.current?.focus();
    const symbol = project.symbolInstances.find((s) => s.id === id)!;
    const layer = project.layers.find((l) => l.id === symbol.layerId)!;
    if (layer.locked) return;
    const members = project.groups.find((g) => g.symbolIds.includes(id))
      ?.symbolIds ?? [id];
    const ids = event.shiftKey
      ? selected.includes(id)
        ? selected.filter((old) => !members.includes(old))
        : [...new Set([...selected, ...members])]
      : selected.includes(id)
        ? selected
        : members;
    setSelected(ids);
    setSelectedWire(null);
    const world = point(event);
    drag.current = {
      kind: "move",
      start: world,
      last: world,
      view,
      matrix: svg.current!.getScreenCTM()!.inverse(),
      ids,
    };
    svg.current!.setPointerCapture(event.pointerId);
  }
  function pointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    const current = drag.current;
    if (!current) return;
    const value = new DOMPoint(event.clientX, event.clientY).matrixTransform(
      current.matrix,
    );
    current.last = { x: value.x, y: value.y };
    const delta = {
      x: value.x - current.start.x,
      y: value.y - current.start.y,
    };
    if (current.kind === "pan")
      setView({
        ...current.view,
        x: current.view.x - delta.x,
        y: current.view.y - delta.y,
      });
    else if (current.kind === "move") setPreview(delta);
    else setMarquee({ a: current.start, b: current.last });
  }
  function pointerUp() {
    const current = drag.current;
    drag.current = null;
    if (!current) return;
    const delta = {
      x: current.last.x - current.start.x,
      y: current.last.y - current.start.y,
    };
    if (
      current.kind === "move" &&
      (Math.abs(delta.x) > 0.1 || Math.abs(delta.y) > 0.1)
    )
      edit((p) => move(p, current.ids, delta, grid));
    if (current.kind === "marquee") {
      const left = Math.min(current.start.x, current.last.x),
        right = Math.max(current.start.x, current.last.x),
        top = Math.min(current.start.y, current.last.y),
        bottom = Math.max(current.start.y, current.last.y);
      const found = project.symbolInstances
        .filter((s) => {
          const layer = project.layers.find((l) => l.id === s.layerId)!;
          const b = bounds(project, s);
          return (
            s.pageId === page.id &&
            layer.visible &&
            !layer.locked &&
            b.left >= left &&
            b.right <= right &&
            b.top >= top &&
            b.bottom <= bottom
          );
        })
        .map((s) => s.id);
      setSelected([...new Set([...current.ids, ...found])]);
    }
    setPreview({ x: 0, y: 0 });
    setMarquee(null);
  }
  function activatePin(pinId: string) {
    if (tool === "wire") {
      if (fromPin) {
        edit((p) => connect(p, fromPin, pinId));
        setFromPin(null);
      } else setFromPin(pinId);
    } else if (tool === "label") setLabelPin(pinId);
  }
  const visible = project.symbolInstances.filter(
    (s) =>
      s.pageId === page.id &&
      project.layers.find((l) => l.id === s.layerId)?.visible,
  );
  const pinDisplay = (pinId: string) => {
    const pin = project.pins.find((p) => p.id === pinId)!;
    const original = project.symbolInstances.find(
      (s) => s.id === pin.symbolInstanceId,
    )!;
    const p = pinPosition(project, pinId);
    return selected.includes(original.id)
      ? { x: p.x + preview.x, y: p.y + preview.y }
      : p;
  };
  const selectedInstance = project.symbolInstances.find(
    (s) => s.id === selected[0],
  );
  const selectedDevice = project.devices.find(
    (d) => d.id === selectedInstance?.deviceId,
  );
  function group() {
    if (selected.length < 2) return;
    edit((p) => {
      p.groups = p.groups.filter(
        (g) => !g.symbolIds.some((id) => selected.includes(id)),
      );
      p.groups.push({
        id: crypto.randomUUID(),
        name: `${t("group")} ${p.groups.length + 1}`,
        pageId: page.id,
        symbolIds: [...selected],
      });
      return p;
    });
  }
  function resize(
    dimensions: readonly [number, number] | null,
    desiredPortrait?: boolean,
  ) {
    edit((p) => {
      const target = p.pages.find((item) => item.id === page.id)!;
      const portrait = desiredPortrait ?? target.widthMm < target.heightMm;
      const base = dimensions ?? [
        Math.max(target.widthMm, target.heightMm),
        Math.min(target.widthMm, target.heightMm),
      ];
      const width = portrait ? base[1] : base[0],
        height = portrait ? base[0] : base[1];
      for (const symbol of p.symbolInstances.filter(
        (s) => s.pageId === page.id,
      )) {
        const b = bounds(p, symbol);
        if (b.right > width || b.bottom > height)
          throw new Error("Drawing does not fit requested page");
      }
      target.widthMm = width;
      target.heightMm = height;
      return p;
    });
  }
  useEffect(() => {
    const element = svg.current;
    if (!element) return;
    const handler = (event: WheelEvent) => {
      event.preventDefault();
      const matrix = element.getScreenCTM()?.inverse();
      if (!matrix) return;
      const anchor = new DOMPoint(event.clientX, event.clientY).matrixTransform(
        matrix,
      );
      setView((previous) => {
        const w = Math.min(
          page.widthMm * 4,
          Math.max(20, previous.w / (event.deltaY < 0 ? 1.1 : 1 / 1.1)),
        );
        const scale = w / previous.w;
        return {
          x: anchor.x - (anchor.x - previous.x) * scale,
          y: anchor.y - (anchor.y - previous.y) * scale,
          w,
          h: previous.h * scale,
        };
      });
    };
    element.addEventListener("wheel", handler, { passive: false });
    return () => element.removeEventListener("wheel", handler);
  }, [page.widthMm]);
  // Requests are ephemeral UI commands. A request runs once, including after switching views.
  const handledCommand = useRef(0);
  useEffect(() => {
    const request = native.editorCommand;
    if (!request || handledCommand.current === request.id) return;
    handledCommand.current = request.id;
    native.consumeEditorCommand(request.id);
    const action = request.action;
    if (
      ["select", "pan", "wire", "label"].includes(action) ||
      Object.hasOwn(primitives, action)
    ) {
      setTool(action as typeof tool);
      setFromPin(null);
    } else if (action === "fit")
      setView({ x: 0, y: 0, w: page.widthMm, h: page.heightMm });
    else if (action === "zoomIn") zoom(1.2);
    else if (action === "zoomOut") zoom(1 / 1.2);
    else if (action === "rotate" && selected.length)
      edit((p) => rotate(p, selected));
    else if (action === "mirror" && selected.length)
      edit((p) => mirror(p, selected));
    else if (action === "delete") deleteSelected();
    else if (action === "duplicate") duplicateSelected();
    else if (action === "paste") pasteClipboard();
    else if (action === "copy" && selected.length)
      setClipboard({ project: structuredClone(project), ids: [...selected] });
    svg.current?.focus();
  }, [native.editorCommand]);
  const sizes = {
    A4: [297, 210],
    A3: [420, 297],
    A2: [594, 420],
    A1: [841, 594],
    A0: [1189, 841],
  } as const;
  const size =
    Object.entries(sizes).find(
      ([, v]) =>
        Math.max(page.widthMm, page.heightMm) === v[0] &&
        Math.min(page.widthMm, page.heightMm) === v[1],
    )?.[0] ?? "custom";
  const wire = project.wires.find((w) => w.id === selectedWire);
  const visibleAnnotations = project.annotations
    .filter(
      (a) =>
        a.pageId === page.id &&
        project.layers.find((layer) => layer.id === a.layerId)?.visible,
    )
    .map((annotation) => ({
      annotation,
      layout: annotationLayout(
        annotation.text,
        annotation.position.x,
        annotation.position.y,
        page.widthMm,
        page.heightMm,
      ),
    }));
  const overflowingNotes = visibleAnnotations.filter(
    ({ layout }) => layout.overflow,
  ).length;
  return (
    <div
      className="schematic-editor"
      onKeyDown={(event) => {
        if ((event.target as HTMLElement).closest("input,select,textarea"))
          return;
        const key = event.key.toLowerCase();
        if (
          (event.ctrlKey || event.metaKey) &&
          ["z", "y", "c", "v", "d", "x"].includes(key)
        ) {
          event.preventDefault();
          if (key === "z") {
            if (event.shiftKey) native.redo();
            else native.undo();
          }
          if (key === "y") native.redo();
          if (key === "c")
            setClipboard({
              project: structuredClone(project),
              ids: [...selected],
            });
          if (key === "v") pasteClipboard();
          if (key === "d") duplicateSelected();
          if (key === "x") {
            setClipboard({
              project: structuredClone(project),
              ids: [...selected],
            });
            deleteSelected();
          }
        } else if (key === "delete") {
          event.preventDefault();
          deleteSelected();
        } else if (key === "r" && selected.length) {
          edit((p) => rotate(p, selected));
        } else if (key === "escape") {
          setFromPin(null);
          setLabelPin(null);
          setTool("select");
        } else if (
          selected.length &&
          ["arrowleft", "arrowright", "arrowup", "arrowdown"].includes(key)
        ) {
          event.preventDefault();
          edit((p) =>
            move(
              p,
              selected,
              {
                x:
                  key === "arrowleft"
                    ? -moveStep
                    : key === "arrowright"
                      ? moveStep
                      : 0,
                y:
                  key === "arrowup"
                    ? -moveStep
                    : key === "arrowdown"
                      ? moveStep
                      : 0,
              },
              grid,
            ),
          );
        }
      }}
    >
      <div
        className="editor-toolbar compact-editor-tools"
        aria-label={t("components")}
      >
        {(["select", "pan", "wire", "label"] as const).map((mode) => (
          <button
            key={mode}
            aria-pressed={tool === mode}
            onClick={() => {
              setTool(mode);
              setFromPin(null);
            }}
          >
            {t(
              mode === "select"
                ? "selectTool"
                : mode === "pan"
                  ? "panTool"
                  : mode === "wire"
                    ? "wireTool"
                    : "labelTool",
            )}
          </button>
        ))}
        <select
          aria-label={t("components")}
          value={Object.hasOwn(primitives, tool) ? tool : ""}
          onChange={(e) => setTool(e.target.value as Primitive)}
        >
          <option value="" disabled>
            {t("components")}
          </option>
          {Object.keys(primitives).map((kind) => (
            <option key={kind} value={kind}>
              {t(kind as Primitive)}
            </option>
          ))}
        </select>
        <select
          aria-label={t("customSymbols")}
          value={tool === "custom" ? customDefinition : ""}
          onChange={(e) => {
            setCustomDefinition(e.target.value);
            setTool("custom");
          }}
        >
          <option value="" disabled>
            {t("customSymbols")}
          </option>
          {project.symbolDefinitions
            .filter((d) => d.category === "custom")
            .map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
        </select>
        <button onClick={() => zoom(1.2)} aria-label="+">
          +
        </button>
        <span>{Math.round((page.widthMm / view.w) * 100)}%</span>
        <button onClick={() => zoom(1 / 1.2)} aria-label="−">
          −
        </button>
        <button onClick={fit}>{t("fitPage")}</button>
        <label>
          {t("grid")}
          <input
            type="number"
            min="1"
            max="100"
            value={page.gridMm}
            onChange={(e) =>
              edit((p) => ({
                ...p,
                pages: p.pages.map((item) =>
                  item.id === page.id
                    ? { ...item, gridMm: Number(e.target.value) }
                    : item,
                ),
              }))
            }
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={page.snapping}
            onChange={(e) =>
              edit((p) => ({
                ...p,
                pages: p.pages.map((item) =>
                  item.id === page.id
                    ? { ...item, snapping: e.target.checked }
                    : item,
                ),
              }))
            }
          />
          {t("snapping")}
        </label>
      </div>
      <div
        className="editor-toolbar compact-editor-tools"
        aria-label={t("selection")}
      >
        {[
          ["rotate", () => edit((p) => rotate(p, selected))],
          ["mirror", () => edit((p) => mirror(p, selected))],
          [
            "copy",
            () =>
              setClipboard({
                project: structuredClone(project),
                ids: [...selected],
              }),
          ],
          ["duplicate", () => duplicateSelected()],
          ["delete", deleteSelected],
          ["alignX", () => edit((p) => align(p, selected, "x"))],
          ["alignY", () => edit((p) => align(p, selected, "y"))],
          ["group", group],
          [
            "ungroup",
            () =>
              edit((p) => ({
                ...p,
                groups: p.groups.filter(
                  (g) => !g.symbolIds.some((id) => selected.includes(id)),
                ),
              })),
          ],
        ].map(([key, action]) => (
          <button
            key={key as string}
            disabled={
              key === "delete"
                ? !selected.length && !selectedWire
                : key === "group" || key === "alignX" || key === "alignY"
                  ? selected.length < 2
                  : key === "ungroup"
                    ? !project.groups.some((g) =>
                        g.symbolIds.some((id) => selected.includes(id)),
                      )
                    : !selected.length
            }
            onClick={action as () => void}
          >
            {t(key as MessageKey)}
          </button>
        ))}
        <button
          disabled={!clipboard?.ids.length}
          onClick={() => pasteClipboard()}
        >
          {t("paste")}
        </button>
      </div>
      <details className="editor-options">
        <summary>
          {t("layers")} / {t("sheetSize")}
        </summary>
        <div className="editor-toolbar">
          <select
            aria-label={t("sheetSize")}
            value={size}
            onChange={(e) => {
              const dimensions = sizes[e.target.value as keyof typeof sizes];
              if (dimensions) resize(dimensions);
            }}
          >
            {size === "custom" && (
              <option value="custom" disabled>
                {t("custom")}
              </option>
            )}
            {Object.keys(sizes).map((size) => (
              <option key={size}>{size}</option>
            ))}
          </select>
          <button onClick={() => resize(null, page.widthMm > page.heightMm)}>
            {t(page.widthMm > page.heightMm ? "portrait" : "landscape")}
          </button>
          <button
            onClick={() =>
              edit((p) => {
                const id = crypto.randomUUID();
                p.layers.push({
                  id,
                  name: `${t("layers")} ${layers.length + 1}`,
                  pageId: page.id,
                  visible: true,
                  locked: false,
                });
                setActiveLayer(id);
                return p;
              })
            }
          >
            {t("newLayer")}
          </button>
          {layers.map((layer) => (
            <div className="layer-controls" key={layer.id}>
              <label>
                <input
                  type="radio"
                  name={`layer-${page.id}`}
                  checked={layerId === layer.id}
                  onChange={() => setActiveLayer(layer.id)}
                />
                {layer.name}
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={layer.visible}
                  onChange={(e) => {
                    edit((p) => ({
                      ...p,
                      layers: p.layers.map((l) =>
                        l.id === layer.id
                          ? { ...l, visible: e.target.checked }
                          : l,
                      ),
                    }));
                    setSelected([]);
                    setSelectedWire(null);
                    setFromPin(null);
                    setLabelPin(null);
                  }}
                />
                {t("visible")}
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={layer.locked}
                  onChange={(e) => {
                    edit((p) => ({
                      ...p,
                      layers: p.layers.map((l) =>
                        l.id === layer.id
                          ? { ...l, locked: e.target.checked }
                          : l,
                      ),
                    }));
                    setSelected([]);
                    setSelectedWire(null);
                    setFromPin(null);
                    setLabelPin(null);
                  }}
                />
                {t("locked")}
              </label>
            </div>
          ))}
        </div>
      </details>
      {selectedInstance &&
        selectedDevice &&
        createPortal(
          <form
            className="editor-toolbar"
            aria-label={t("properties")}
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              edit((p) => {
                const d = p.devices.find((d) => d.id === selectedDevice.id)!;
                d.reference = String(data.get("reference"));
                const s = p.symbolInstances.find(
                  (s) => s.id === selectedInstance.id,
                )!;
                s.name = d.reference;
                const x = Number(data.get("x")),
                  y = Number(data.get("y"));
                move(
                  p,
                  [s.id],
                  { x: x - s.position.x, y: y - s.position.y },
                  grid,
                );
                for (const term of p.terminals.filter(
                  (term) => term.deviceId === d.id,
                ))
                  term.designation = String(data.get(term.id));
                return p;
              });
            }}
          >
            <label>
              {t("reference")}
              <input
                key={selectedDevice.reference}
                name="reference"
                defaultValue={selectedDevice.reference}
                required
                maxLength={160}
              />
            </label>
            <label>
              X (mm)
              <input
                key={`x${selectedInstance.position.x}`}
                name="x"
                type="number"
                step="any"
                defaultValue={selectedInstance.position.x}
              />
            </label>
            <label>
              Y (mm)
              <input
                key={`y${selectedInstance.position.y}`}
                name="y"
                type="number"
                step="any"
                defaultValue={selectedInstance.position.y}
              />
            </label>
            {project.terminals
              .filter((term) => term.deviceId === selectedDevice.id)
              .map((term) => (
                <label key={term.id}>
                  {t("terminalDesignation")} {term.name}
                  <input
                    key={term.designation}
                    name={term.id}
                    defaultValue={term.designation}
                    required
                    maxLength={160}
                  />
                </label>
              ))}
            <button>{t("apply")}</button>
          </form>,
          document.getElementById("native-object-properties") ??
            document.querySelector(".schematic-editor")!,
        )}
      {wire && (
        <WireProperties project={project} wire={wire} edit={edit} t={t} />
      )}
      {wire && (
        <form
          className="editor-toolbar"
          aria-label={t("manualRoute")}
          onSubmit={(e) => {
            e.preventDefault();
            const text = String(new FormData(e.currentTarget).get("points"));
            edit((p) => {
              const points = text
                .trim()
                .split(/\r?\n/)
                .map((line) => {
                  const pair = line
                    .split(",")
                    .map((value) => Number(value.trim()));
                  if (
                    pair.length !== 2 ||
                    line.split(",").some((value) => !value.trim())
                  )
                    throw new Error("Invalid route point");
                  return { x: pair[0], y: pair[1] };
                });
              return setWireRoute(p, wire.id, points);
            });
          }}
        >
          <label>
            {t("routePoints")}
            <textarea
              name="points"
              key={
                wire.id +
                JSON.stringify(
                  project.wirePaths.find((path) => path.wireId === wire.id)
                    ?.points,
                )
              }
              required
              maxLength={200000}
              defaultValue={project.wirePaths
                .find((path) => path.wireId === wire.id)
                ?.points.map((point) => `${point.x}, ${point.y}`)
                .join("\n")}
            />
          </label>
          <button>{t("manualRoute")}</button>
          <button
            type="button"
            onClick={() => edit((p) => setWireRoute(p, wire.id, null))}
          >
            {t("automaticRoute")}
          </button>
        </form>
      )}
      {wire && (
        <form
          className="editor-toolbar"
          onSubmit={(e) => {
            e.preventDefault();
            const name = String(new FormData(e.currentTarget).get("name"));
            edit((p) => ({
              ...p,
              wires: p.wires.map((w) =>
                w.id === wire.id ? { ...w, name } : w,
              ),
            }));
          }}
        >
          <label>
            {t("wireTool")}
            <input
              name="name"
              key={wire.id + wire.name}
              defaultValue={wire.name}
              required
              maxLength={160}
            />
          </label>
          <button>{t("apply")}</button>
        </form>
      )}
      {labelPin && (
        <form
          className="editor-toolbar"
          onSubmit={(e) => {
            e.preventDefault();
            const text = String(new FormData(e.currentTarget).get("text"));
            edit((p) => {
              const target = layerId ?? ensureLayer(p, page.id, t("layers"));
              const position = pinPosition(p, labelPin);
              p.annotations.push({
                id: crypto.randomUUID(),
                name: text,
                text,
                pageId: page.id,
                layerId: target,
                pinId: labelPin,
                position: { x: position.x + 3, y: position.y - 3 },
              });
              return p;
            });
            setLabelPin(null);
          }}
        >
          <label>
            {t("labelText")}
            <input name="text" required maxLength={160} />
          </label>
          <button>{t("addLabel")}</button>
        </form>
      )}
      <p className="editor-hint">{t("editorHint")}</p>
      {overflowingNotes > 0 && (
        <p className="annotation-overflow" role="status">
          {t("annotationOverflow")} ({overflowingNotes})
        </p>
      )}
      <svg
        ref={svg}
        className="native-sheet engineering-canvas"
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        role="application"
        aria-label={page.name}
        tabIndex={0}
        onPointerDown={begin}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={() => {
          drag.current = null;
          setPreview({ x: 0, y: 0 });
          setMarquee(null);
        }}
      >
        <defs>
          <pattern
            id={`grid-${page.id}`}
            width={page.gridMm}
            height={page.gridMm}
            patternUnits="userSpaceOnUse"
          >
            <circle cx={0} cy={0} r={0.18} fill="#a9b6c9" />
          </pattern>
        </defs>
        <rect
          width={page.widthMm}
          height={page.heightMm}
          fill={`url(#grid-${page.id})`}
        />
        <rect
          x={8}
          y={8}
          width={page.widthMm - 16}
          height={page.heightMm - 16}
          fill="none"
          stroke="currentColor"
          strokeWidth={0.3}
        />
        <path
          d={`M8 ${page.heightMm - 22}H${page.widthMm - 8}`}
          stroke="currentColor"
          strokeWidth={0.3}
        />
        <text x={12} y={page.heightMm - 13} fontSize={3.5}>
          {project.name} · {page.name} · {page.widthMm} × {page.heightMm} mm
        </text>
        {project.wirePaths
          .filter(
            (path) =>
              path.pageId === page.id &&
              project.layers.find((l) => l.id === path.layerId)?.visible,
          )
          .map((path) => {
            const wire = project.wires.find((w) => w.id === path.wireId)!;
            const points =
              preview.x || preview.y
                ? route(pinDisplay(wire.fromPinId), pinDisplay(wire.toPinId))
                : path.points;
            return (
              <g
                key={path.id}
                onPointerDown={(e) => {
                  if (tool === "junction" || tool === "terminal") {
                    e.stopPropagation();
                    const position = point(e);
                    edit((p) => {
                      setSelected([
                        insertJunction(
                          p,
                          wire.id,
                          position,
                          grid,
                          tool as "junction" | "terminal",
                        ),
                      ]);
                      return p;
                    });
                    return;
                  }
                  if (tool !== "select") return;
                  e.stopPropagation();
                  setSelectedWire(wire.id);
                  setSelected([]);
                  svg.current?.focus();
                }}
                data-wire={wire.id}
              >
                <polyline
                  points={points.map((p) => `${p.x},${p.y}`).join(" ")}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={4}
                />
                <polyline
                  points={points.map((p) => `${p.x},${p.y}`).join(" ")}
                  fill="none"
                  stroke={
                    selectedWire === wire.id
                      ? "#e67e00"
                      : (wire.color ?? "#d02030")
                  }
                  strokeWidth={0.6}
                />
              </g>
            );
          })}
        {visible.map((instance) => {
          const definition = project.symbolDefinitions.find(
            (d) => d.id === instance.definitionId,
          )!;
          const device = project.devices.find(
            (d) => d.id === instance.deviceId,
          )!;
          const position = selected.includes(instance.id)
            ? {
                x: instance.position.x + preview.x,
                y: instance.position.y + preview.y,
              }
            : instance.position;
          return (
            <g
              key={instance.id}
              data-instance={instance.id}
              aria-label={device.reference}
              role="button"
              tabIndex={0}
              aria-pressed={selected.includes(instance.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  event.stopPropagation();
                  setSelected([instance.id]);
                }
              }}
              onPointerDown={(e) => beginSymbol(e, instance.id)}
            >
              <g
                transform={`translate(${position.x} ${position.y}) rotate(${instance.rotation}) scale(${instance.mirrored ? -1 : 1} 1)`}
                stroke="currentColor"
                strokeWidth={0.5}
                fill="none"
              >
                <rect
                  x={-definition.widthMm / 2 - 2}
                  y={-definition.heightMm / 2 - 2}
                  width={definition.widthMm + 4}
                  height={definition.heightMm + 4}
                  fill={
                    selected.includes(instance.id) ? "#2563eb16" : "transparent"
                  }
                  stroke={
                    selected.includes(instance.id)
                      ? "currentColor"
                      : "transparent"
                  }
                  strokeDasharray="1 1"
                />
                {definition.artwork ? (
                  <g data-custom-artwork={definition.id}>
                    <SymbolArtwork artwork={definition.artwork} />
                  </g>
                ) : (
                  <Glyph
                    kind={definition.glyph}
                    width={definition.widthMm}
                    height={definition.heightMm}
                  />
                )}
              </g>
              <text
                x={position.x}
                y={
                  bounds(project, instance).bottom +
                  (selected.includes(instance.id) ? preview.y : 0) +
                  4
                }
                textAnchor="middle"
                fontSize={3.5}
                fill="currentColor"
                textLength={
                  device.reference.length > 8
                    ? Math.max(definition.widthMm, 12)
                    : undefined
                }
                lengthAdjust="spacingAndGlyphs"
              >
                <title>{device.reference}</title>
                {device.reference.length > 16
                  ? device.reference.slice(0, 14) + "…"
                  : device.reference}
              </text>
            </g>
          );
        })}
        {project.pins
          .filter((pin) => visible.some((s) => s.id === pin.symbolInstanceId))
          .map((pin) => {
            const position = pinDisplay(pin.id);
            const instance = project.symbolInstances.find(
              (s) => s.id === pin.symbolInstanceId,
            )!;
            const device = project.devices.find(
              (d) => d.id === instance.deviceId,
            )!;
            const terminal = project.terminals.find(
              (term) => term.id === pin.terminalId,
            )!;
            return (
              <g
                key={pin.id}
                data-pin={pin.id}
                role="button"
                tabIndex={0}
                aria-label={`${device.reference}:${terminal.designation}${project.pins.filter((p) => p.symbolInstanceId === instance.id && p.terminalId === terminal.id).length > 1 ? `/${pin.definitionPinId}` : ""}`}
                onPointerDown={(e) => {
                  if (tool === "pan" || Object.hasOwn(primitives, tool)) return;
                  if (tool === "select") {
                    beginSymbol(e, instance.id);
                    return;
                  }
                  e.stopPropagation();
                  activatePin(pin.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    activatePin(pin.id);
                  }
                }}
              >
                <circle
                  cx={position.x}
                  cy={position.y}
                  r={2.4}
                  fill="transparent"
                />
                <circle
                  cx={position.x}
                  cy={position.y}
                  r={0.8}
                  fill={fromPin === pin.id ? "#e67e00" : "white"}
                  stroke="#2563eb"
                  strokeWidth={0.5}
                />
              </g>
            );
          })}
        {visibleAnnotations.map(({ annotation: a, layout }) => {
          return (
            <text
              key={a.id}
              data-annotation-id={a.id}
              data-overflow={layout.overflow}
              x={a.position.x}
              y={a.position.y}
              fontSize={layout.fontSizeMm}
              fill="currentColor"
              aria-label={a.text}
            >
              <title>{a.text}</title>
              {layout.lines.map((line, index) => (
                <tspan
                  key={index}
                  x={a.position.x}
                  dy={index ? layout.lineHeightMm : 0}
                >
                  {line}
                </tspan>
              ))}
            </text>
          );
        })}
        {marquee && (
          <rect
            x={Math.min(marquee.a.x, marquee.b.x)}
            y={Math.min(marquee.a.y, marquee.b.y)}
            width={Math.abs(marquee.a.x - marquee.b.x)}
            height={Math.abs(marquee.a.y - marquee.b.y)}
            fill="#2563eb15"
            stroke="#2563eb"
            strokeWidth={0.4}
          />
        )}
      </svg>
    </div>
  );
}
