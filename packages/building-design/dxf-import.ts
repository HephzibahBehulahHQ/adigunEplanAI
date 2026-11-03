import DxfParser from "dxf-parser";
import type { ILineEntity, ILwpolylineEntity } from "dxf-parser";
import type { PlanImport } from "./plan-import.ts";
type Group = { code: number; value: string };
type RecordEntry = { type: string; section: string; groups: Group[] };
const numeric = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;
function number(value: string) {
  if (!numeric.test(value) || !Number.isFinite(Number(value)))
    throw new Error("Invalid DXF numeric value");
  return Number(value);
}
function preflight(text: string) {
  if (new TextEncoder().encode(text).length > 1024 * 1024)
    throw new Error("DXF exceeds 1 MiB");
  if (text.includes("\uFFFD")) throw new Error("Unsupported DXF text encoding");
  if (text.includes("\0") || text.startsWith("AutoCAD Binary DXF"))
    throw new Error("Binary DXF is not supported");
  const lines = text
    .replace(/^\uFEFF/, "")
    .trimEnd()
    .split(/\r\n|\n|\r/);
  if (lines.length % 2 || lines.length > 200000)
    throw new Error("Invalid or oversized DXF group stream");
  const groups: Group[] = [];
  for (let i = 0; i < lines.length; i += 2) {
    const code = lines[i].trim();
    if (!/^\d+$/.test(code) || Number(code) > 1071)
      throw new Error("Invalid DXF group code");
    groups.push({ code: Number(code), value: lines[i + 1].trim() });
  }
  if (groups.at(-1)?.code !== 0 || groups.at(-1)?.value !== "EOF")
    throw new Error("DXF must end with EOF");
  let section = "",
    current: RecordEntry | undefined,
    units: number | undefined;
  const records: RecordEntry[] = [];
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    if (g.code === 0) {
      if (g.value === "SECTION") {
        if (section || groups[i + 1]?.code !== 2)
          throw new Error("Invalid DXF section");
        section = groups[++i].value;
        current = undefined;
        continue;
      }
      if (g.value === "ENDSEC") {
        if (!section) throw new Error("Unexpected DXF section end");
        section = "";
        current = undefined;
        continue;
      }
      if (g.value === "EOF") {
        if (section || i !== groups.length - 1)
          throw new Error("Unclosed DXF section");
        continue;
      }
      current = { type: g.value, section, groups: [] };
      records.push(current);
    } else if (current) current.groups.push(g);
    if (section === "HEADER" && g.code === 9 && g.value === "$INSUNITS") {
      if (groups[i + 1]?.code !== 70) throw new Error("Invalid DXF INSUNITS");
      if (units !== undefined) throw new Error("Duplicate DXF INSUNITS");
      units = number(groups[i + 1].value);
      if (!Number.isInteger(units)) throw new Error("Invalid DXF INSUNITS");
    }
  }
  if (
    !groups.some(
      (g, i) =>
        g.code === 2 &&
        g.value === "ENTITIES" &&
        groups[i - 1]?.value === "SECTION",
    )
  )
    throw new Error("DXF has no ENTITIES section");
  return { records, units };
}
export function parseDxfPlan(
  text: string,
  sourceFile: string,
  overrideMmPerUnit?: number,
): PlanImport {
  const { records, units } = preflight(text);
  const factors: Record<number, number> = {
    1: 25.4,
    2: 304.8,
    4: 1,
    5: 10,
    6: 1000,
    7: 1000000,
    9: 0.0254,
    10: 914.4,
    14: 100,
  };
  const mmPerUnit =
    overrideMmPerUnit ?? (units === undefined ? undefined : factors[units]);
  if (
    mmPerUnit === undefined ||
    !Number.isFinite(mmPerUnit) ||
    mmPerUnit <= 0 ||
    mmPerUnit > 1000000
  )
    throw new Error(
      "DXF units are missing/unsupported; specify millimetres per unit",
    );
  const draft: PlanImport = {
    sourceFile,
    mmPerUnit,
    shapes: [],
    issues: [
      "DXF model coordinates converted to millimetres with Y reversed for the plan; appearance and other sections are not imported",
    ],
    layerStates: Object.create(null),
  };
  const one = (r: RecordEntry, code: number, fallback = "") =>
    r.groups.find((g) => g.code === code)?.value ?? fallback;
  for (const r of records.filter(
    (r) => r.section === "TABLES" && r.type === "LAYER",
  )) {
    const name = one(r, 2, "0");
    const flags = number(one(r, 70, "0")),
      color = number(one(r, 62, "7"));
    if (!Number.isInteger(flags) || flags < 0 || flags > 65535)
      throw new Error("Invalid DXF layer flags");
    draft.layerStates![name] = {
      visible: color >= 0 && !(flags & 3),
      locked: !!(flags & 4),
    };
  }
  const model = records.filter((r) => r.section === "ENTITIES");
  if (model.length > 2000) throw new Error("DXF exceeds 2000 model entities");
  for (const [index, r] of model.entries()) {
    const label = one(r, 5, `${r.type} ${index + 1}`).slice(0, 160);
    try {
      if (r.type !== "LINE" && r.type !== "LWPOLYLINE")
        throw new Error(`unsupported ${r.type}`);
      for (const g of r.groups)
        if (
          [
            10, 20, 30, 11, 21, 31, 38, 39, 40, 41, 42, 43, 60, 67, 70, 90, 210,
            220, 230,
          ].includes(g.code)
        )
          number(g.value);
      if (number(one(r, 67, "0")) !== 0)
        throw new Error("paper-space geometry");
      if (number(one(r, 60, "0")) !== 0) throw new Error("invisible entity");
      if (
        r.groups.some(
          (g) =>
            [30, 31, 38, 39, 40, 41, 42, 43].includes(g.code) &&
            number(g.value) !== 0,
        )
      )
        throw new Error("nonplanar, curved or width-bearing geometry");
      if (
        number(one(r, 210, "0")) !== 0 ||
        number(one(r, 220, "0")) !== 0 ||
        number(one(r, 230, "1")) !== 1
      )
        throw new Error("unsupported extrusion direction");
      if (r.type === "LWPOLYLINE") {
        const n = number(one(r, 90, "0")),
          flags = number(one(r, 70, "0"));
        if (!Number.isInteger(flags) || flags < 0 || (flags & ~129) !== 0)
          throw new Error("unsupported polyline flags");
        if (
          !Number.isInteger(n) ||
          n < 2 ||
          n > 10000 ||
          r.groups.filter((g) => g.code === 10).length !== n ||
          r.groups.filter((g) => g.code === 20).length !== n
        )
          throw new Error("invalid polyline vertex count");
      } else if (
        [10, 20, 11, 21].some(
          (code) => r.groups.filter((g) => g.code === code).length !== 1,
        )
      )
        throw new Error("invalid line endpoints");
      // The verified parser receives one bounded supported entity, preventing unknown records from disappearing silently.
      const input = `0\nSECTION\n2\nENTITIES\n0\n${r.type}\n${r.groups.map((g) => `${g.code}\n${g.value}\n`).join("")}0\nENDSEC\n0\nEOF\n`;
      const entity = new DxfParser().parseSync(input)?.entities[0] as
        ILineEntity | ILwpolylineEntity | undefined;
      if (!entity || entity.type !== r.type)
        throw new Error("DXF parser did not return the expected entity");
      const points = entity.vertices.map((v) => ({
        x: v.x === 0 ? 0 : v.x * mmPerUnit,
        y: v.y === 0 ? 0 : -v.y * mmPerUnit,
      }));
      const closed =
        r.type === "LWPOLYLINE" && !!(entity as ILwpolylineEntity).shape;
      if (
        points.length < (closed ? 3 : 2) ||
        points.some(
          (p) =>
            !Number.isFinite(p.x) ||
            !Number.isFinite(p.y) ||
            Math.abs(p.x) > 1000000 ||
            Math.abs(p.y) > 1000000,
        ) ||
        points.every((p) => p.x === points[0].x && p.y === points[0].y)
      )
        throw new Error("invalid or out-of-bounds geometry");
      const layer = entity.layer || "0";
      if (layer.length > 160)
        throw new Error("DXF layer name exceeds native limit");
      draft.shapes.push({ name: label, layer, points, closed });
    } catch (error) {
      draft.issues.push(
        `${label}: ${error instanceof Error ? error.message : "unsupported DXF geometry"}`,
      );
    }
  }
  return draft;
}
