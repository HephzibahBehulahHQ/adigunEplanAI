import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { plcKinds, plcSymbol } from "../packages/automation/plc.ts";
import { catalog } from "../packages/component-library/catalog.ts";
import { engineeringSymbols } from "../packages/component-library/symbols.ts";
import { csvReport } from "../packages/reporting/csv.ts";

const root = fileURLToPath(new URL("../", import.meta.url));
const context = vm.createContext({});
for (const file of ["eplan-symbols.js", "cad-engine.js"])
  vm.runInContext(
    readFileSync(path.join(root, "apps/web/public", file), "utf8"),
    context,
  );
const engine = context.AdigunCADEngine;
const terminalBatch = JSON.parse(
  readFileSync(
    new URL(
      "../packages/component-library/wago-terminal-batch.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
engine.registerWagoTerminalBatch(terminalBatch);
engine.registerWagoPcbTerminalBatch(
  JSON.parse(
    readFileSync(
      new URL(
        "../packages/component-library/wago-pcb-terminal-batch.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ),
);
engine.registerWagoWinstaBatch(
  JSON.parse(
    readFileSync(
      new URL(
        "../packages/component-library/wago-winsta-batch.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ),
);
engine.registerWagoWinstaCableBatch(
  JSON.parse(
    readFileSync(
      new URL(
        "../packages/component-library/wago-winsta-cable-batch.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ),
);
engine.registerWagoRelayBatch(
  JSON.parse(
    readFileSync(
      new URL(
        "../packages/component-library/wago-relay-batch.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ),
);
engine.registerWagoPowerSupplyBatch(
  JSON.parse(
    readFileSync(
      new URL(
        "../packages/component-library/wago-power-supply-batch.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ),
);
engine.registerWagoSingleChannelBreakerBatch(
  JSON.parse(
    readFileSync(
      new URL(
        "../packages/component-library/wago-single-channel-breaker-batch.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ),
);
engine.registerWago2086PcbTerminalBatch(
  JSON.parse(
    readFileSync(
      new URL(
        "../packages/component-library/wago-pcb-2086-batch.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ),
);
engine.registerWagoStackablePcbTerminalBatch(
  ["236-256", "255-257", "multipin"].flatMap((series) =>
    JSON.parse(
      readFileSync(
        new URL(
          `../packages/component-library/wago-pcb-${series}-batch.json`,
          import.meta.url,
        ),
        "utf8",
      ),
    ),
  ),
);
engine.registerWagoMcsBatch(
  ["231", "232", "721", "733", "734", "831"].flatMap((series) =>
    JSON.parse(
      readFileSync(
        new URL(
          `../packages/component-library/wago-mcs-${series}-batch.json`,
          import.meta.url,
        ),
        "utf8",
      ),
    ),
  ),
);
engine.registerWagoDigitalIoBatch(
  JSON.parse(
    readFileSync(
      new URL(
        "../packages/component-library/wago-digital-io-batch.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ),
);
engine.registerPlcSymbols(
  plcKinds.map((kind) => ({
    kind,
    channels: plcSymbol[kind].channels,
    symbol: engineeringSymbols.find(({ id }) => id === plcSymbol[kind].symbol),
  })),
);

const records = new Map();
function register(entry) {
  const key = [entry.manufacturer, entry.orderCode]
    .map((part) => part.trim().toLowerCase())
    .join(":");
  if (!records.has(key)) {
    records.set(key, {
      id: entry.id,
      manufacturer: entry.manufacturer,
      orderCode: entry.orderCode,
      category: entry.category,
      family: entry.family,
      function: entry.function,
      implementations: [],
    });
  }
  records.get(key).implementations.push(entry);
}

for (const part of catalog) {
  const symbol = engineeringSymbols.find(
    ({ id }) => id === part.mapping.symbolId,
  );
  register({
    id: part.id,
    catalog: "engineering",
    category: part.category,
    family: part.mapping.symbolId ?? part.mapping.glyph,
    manufacturer: part.manufacturer,
    orderCode: part.partNumber,
    function: part.name,
    poles: null,
    terminals: part.terminalMarkings ?? null,
    nodeGroups: null,
    symbolUnits: [symbol?.id ?? part.mapping.glyph],
    mapping: part.mapping,
    physicalRepresentation: part.dimensionsMm
      ? {
          dimensionsMm: part.dimensionsMm,
          mounting: part.mounting,
          mountedDepthsMm: part.mountedDepthsMm,
          appearance: part.appearance,
        }
      : null,
    properties: part.ratings,
    sources: [
      {
        url: part.sourceUrl,
        revision: part.sourceRevision,
        reviewedOn: part.reviewedOn,
      },
    ],
    status: part.verification,
  });
}

const definitions = engine.catalog().map(({ id }) => engine.component(id));
for (const def of definitions.filter((entry) => !entry.generic)) {
  register({
    id: def.id,
    catalog: "compact-editor",
    category: def.category,
    family: def.family,
    manufacturer: def.manufacturer,
    orderCode: def.manufacturerPartNumber,
    function: def.name,
    poles:
      def.specifications?.mainPoleCount ?? def.specifications?.poles ?? null,
    terminals: def.symbol.pins,
    nodeGroups: def.symbol.internalConnections,
    symbolUnits: [def.symbol.id],
    physicalRepresentation: def.panelFootprint ?? null,
    properties: def.specifications,
    sources: def.sources,
    status: "native-library-definition",
  });
}

const parts = Array.from(records.values()).sort((a, b) =>
  a.id.localeCompare(b.id),
);
const implementations = parts.flatMap((part) => part.implementations);
const symbolFamilies = [
  ...new Set(definitions.map((entry) => entry.family)),
].sort();
const revision = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: root,
  encoding: "utf8",
}).trim();
const inventory = {
  schema: "adiguneplanai-component-inventory/1",
  sourceCommit: revision,
  counts: {
    distinctSourceBackedManufacturerParts: parts.filter((part) =>
      part.implementations.some((entry) =>
        entry.sources.some(({ url }) => /^https?:\/\//.test(url)),
      ),
    ).length,
    catalogImplementations: implementations.length,
    originalEngineeringSymbolDefinitions: engineeringSymbols.length,
    compactSymbolFamilies: symbolFamilies.length,
    compactFunctionalSymbolUnits: new Set(
      definitions.map(({ symbol }) => symbol.id),
    ).size,
    partsWithCompactPanelRepresentations: parts.filter((part) =>
      part.implementations.some(
        ({ catalog, physicalRepresentation }) =>
          catalog === "compact-editor" && physicalRepresentation,
      ),
    ).length,
    compactManufacturerDefinitionsWithDeclaredTerminalMaps: definitions.filter(
      (def) => !def.generic && def.symbol.pins.length,
    ).length,
    independentlyValidatedManufacturerTerminalMaps: null,
    userCustomDefinitionsInspected: false,
  },
  symbolFamilies,
  parts,
};

const output = path.resolve(
  root,
  process.argv[2] ?? "test-results/component-inventory",
);
const relative = path.relative(root, output);
if (relative.startsWith("..") || path.isAbsolute(relative))
  throw new Error("Output must stay inside the project folder");
mkdirSync(output, { recursive: true });
writeFileSync(
  path.join(output, "component-inventory.json"),
  `${JSON.stringify(inventory, null, 2)}\n`,
);
const details = [
  "poles",
  "terminals",
  "nodeGroups",
  "symbolUnits",
  "physicalRepresentation",
  "properties",
  "sources",
  "status",
];
writeFileSync(
  path.join(output, "component-inventory.csv"),
  csvReport([
    [
      "ID",
      "Category",
      "Family",
      "Manufacturer",
      "Order code",
      "Function",
      ...details,
    ],
    ...parts.map((part) => [
      part.id,
      part.category,
      part.family,
      part.manufacturer,
      part.orderCode,
      part.function,
      ...details.map((key) =>
        JSON.stringify(
          part.implementations.map((entry) => ({
            id: entry.id,
            catalog: entry.catalog,
            value: entry[key],
          })),
        ),
      ),
    ]),
  ]),
);
console.log(JSON.stringify(inventory.counts));
