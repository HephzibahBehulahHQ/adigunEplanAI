import type { Project } from "../electrical-model/project.ts";
import { createCustomSymbol } from "./custom-symbols.ts";

type Shape = NonNullable<
  Project["symbolDefinitions"][number]["artwork"]
>[number];
const line = (x1: number, y1: number, x2: number, y2: number): Shape => ({
  kind: "line",
  from: { x: x1, y: y1 },
  to: { x: x2, y: y2 },
});
const circle = (x: number, y: number, r: number): Shape => ({
  kind: "circle",
  center: { x, y },
  radiusMm: r,
});
const pin = (
  id: string,
  x: number,
  y: number,
  kind: Project["terminals"][number]["kind"] = "power",
) => ({ id, position: { x, y }, kind });
export const engineeringSymbols = [
  {
    id: "transformer-two-winding",
    name: "Two-winding transformer",
    category: "power",
    width: 32,
    height: 28,
    pins: [
      pin("P1", -16, -8),
      pin("P2", -16, 8),
      pin("S1", 16, -8),
      pin("S2", 16, 8),
    ],
    artwork: [
      line(-16, -8, -8, -8),
      line(-16, 8, -8, 8),
      circle(-8, -4, 4),
      circle(-8, 4, 4),
      line(-1, -12, -1, 12),
      line(1, -12, 1, 12),
      circle(8, -4, 4),
      circle(8, 4, 4),
      line(8, -8, 16, -8),
      line(8, 8, 16, 8),
    ],
  },
  {
    id: "battery",
    name: "Battery",
    category: "power",
    width: 28,
    height: 20,
    pins: [pin("positive", -14, 0), pin("negative", 14, 0)],
    artwork: [
      line(-14, 0, -6, 0),
      line(-6, -9, -6, 9),
      line(-2, -5, -2, 5),
      line(2, -9, 2, 9),
      line(6, -5, 6, 5),
      line(6, 0, 14, 0),
      line(-12, -7, -8, -7),
      line(-10, -9, -10, -5),
    ],
  },
  {
    id: "nc-contact",
    name: "Normally closed contact",
    category: "switching",
    width: 24,
    height: 16,
    pins: [pin("11", -12, 0, "control"), pin("12", 12, 0, "control")],
    artwork: [
      line(-12, 0, -4, 0),
      line(-4, 0, 4, 0),
      line(4, 0, 12, 0),
      line(-4, 4, 4, -4),
      circle(-4, 0, 0.7),
      circle(4, 0, 0.7),
    ],
  },
  {
    id: "three-phase-motor",
    name: "Three-phase motor",
    category: "motors",
    width: 32,
    height: 32,
    pins: [
      pin("U", -16, -8),
      pin("V", -16, 0),
      pin("W", -16, 8),
      pin("PE", 0, 16, "pe"),
    ],
    artwork: [
      circle(0, 0, 11),
      line(-16, -8, -7.5, -8),
      line(-16, 0, -11, 0),
      line(-16, 8, -7.5, 8),
      line(0, 11, 0, 16),
      line(-4, 4, -4, -4),
      line(-4, -4, 0, 0),
      line(0, 0, 4, -4),
      line(4, -4, 4, 4),
    ],
  },
  {
    id: "voltmeter",
    name: "Voltmeter",
    category: "instrumentation",
    width: 28,
    height: 20,
    pins: [pin("positive", -14, 0), pin("negative", 14, 0)],
    artwork: [
      circle(0, 0, 9),
      line(-14, 0, -9, 0),
      line(9, 0, 14, 0),
      line(-4, -4, 0, 4),
      line(0, 4, 4, -4),
    ],
  },
  {
    id: "socket-l-n-pe",
    name: "Socket L/N/PE",
    category: "building",
    width: 28,
    height: 24,
    pins: [
      pin("L", -14, -6),
      pin("N", -14, 6, "neutral"),
      pin("PE", 14, 0, "pe"),
    ],
    artwork: [
      circle(0, 0, 10),
      line(-14, -6, -5, -6),
      line(-14, 6, -5, 6),
      line(10, 0, 14, 0),
      circle(-3, -3, 1.2),
      circle(-3, 3, 1.2),
      line(3, -3, 3, 3),
    ],
  },
  {
    id: "circuit-breaker",
    name: "Single-pole circuit breaker",
    category: "protection",
    width: 28,
    height: 20,
    pins: [pin("1", -14, 0), pin("2", 14, 0)],
    artwork: [
      line(-14, 0, -7, 0),
      circle(-7, 0, 0.7),
      line(-7, 0, 5, -6),
      circle(7, 0, 0.7),
      line(7, 0, 14, 0),
      line(-3, -3, -3, 7),
      line(-6, 7, 3, 7),
      line(3, 7, 3, 4),
      line(-4, 4, 0, 4),
    ],
  },
  {
    id: "three-wire-sensor",
    name: "Three-wire sensor",
    category: "automation",
    width: 32,
    height: 24,
    pins: [
      pin("supply", -16, -6, "control"),
      pin("common", -16, 6, "control"),
      pin("output", 16, 0, "signal"),
    ],
    artwork: [
      line(-10, -10, 10, -10),
      line(10, -10, 10, 10),
      line(10, 10, -10, 10),
      line(-10, 10, -10, -10),
      line(-16, -6, -10, -6),
      line(-16, 6, -10, 6),
      line(10, 0, 16, 0),
      line(-5, -5, -5, 5),
      line(-5, 5, 5, 0),
      line(5, 0, -5, -5),
      line(-5, 0, -8, 0),
      line(5, 0, 10, 0),
    ],
  },
  {
    id: "variable-frequency-drive",
    name: "Variable-frequency drive",
    category: "industrial",
    width: 40,
    height: 36,
    pins: [
      pin("L1", -20, -10),
      pin("L2", -20, 0),
      pin("L3", -20, 10),
      pin("U", 20, -10),
      pin("V", 20, 0),
      pin("W", 20, 10),
      pin("PE", 0, 18, "pe"),
    ],
    artwork: [
      line(-14, -16, 14, -16),
      line(14, -16, 14, 16),
      line(14, 16, -14, 16),
      line(-14, 16, -14, -16),
      line(-14, 16, 14, -16),
      line(-20, -10, -14, -10),
      line(-20, 0, -14, 0),
      line(-20, 10, -14, 10),
      line(14, -10, 20, -10),
      line(14, 0, 20, 0),
      line(14, 10, 20, 10),
      line(0, 16, 0, 18),
      line(-10, -9, -7, -12),
      line(-7, -12, -4, -9),
      line(-4, -9, -1, -12),
      line(2, 10, 5, 7),
      line(5, 7, 8, 10),
      line(8, 10, 11, 7),
    ],
  },
] as const;

export function searchSymbols(query: string, category = "") {
  const words = query
    .normalize("NFKC")
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return engineeringSymbols.filter(
    (symbol) =>
      (!category || symbol.category === category) &&
      words.every((word) =>
        `${symbol.name} ${symbol.category}`.toLowerCase().includes(word),
      ),
  );
}
export function installSymbol(project: Project, symbolId: string): Project {
  const symbol = engineeringSymbols.find((item) => item.id === symbolId);
  if (!symbol) throw new Error("Unknown engineering symbol");
  const definition = {
    id: `library-${symbol.id}`,
    name: symbol.name,
    category: "custom",
    glyph: "box" as const,
    widthMm: symbol.width,
    heightMm: symbol.height,
    pins: structuredClone([...symbol.pins]),
    artwork: structuredClone([...symbol.artwork]),
  };
  const existing = project.symbolDefinitions.find(
    (item) => item.id === definition.id,
  );
  if (existing) {
    if (JSON.stringify(existing) !== JSON.stringify(definition))
      throw new Error(
        "Library definition has local edits; retain those edits or use a new definition",
      );
    return structuredClone(project);
  }
  return createCustomSymbol(project, definition);
}
