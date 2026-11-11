import { validateProject, type Project } from "../electrical-model/project.ts";

export type CatalogPart = {
  id: string;
  name: string;
  category: string;
  manufacturer: string;
  partNumber: string;
  sourceUrl: string;
  reviewedOn: string;
  verification: "source-reviewed-facts";
  licensing: "factual-metadata-only";
  dimensionsMm?: { width: number; height: number; depth: number };
  mountedDepthsMm?: readonly { rail: string; depth: number }[];
  terminalMarkings?: readonly string[];
  mounting?: string;
  sourceRevision?: string;
  /** Display-only swatch based on manufacturer-described product finish. */
  appearance?: { finish: string; displayHex: string };
  /** Manufacturer-documented front-panel feature counts; layout is illustrative. */
  frontPanel?: { statusIndicators?: number; display?: "large" | "standard" };
  ratings: Record<string, string | number>;
  mapping:
    | {
        glyph: "terminal" | "contact";
        electricalNodes: number;
        connections: number;
      }
    | {
        glyph: "component";
        symbolId: string;
        electricalNodes: number;
        connections: number;
      };
};

// Factual specifications only; no manufacturer artwork or copied datasheet is bundled.
export const catalog: readonly CatalogPart[] = [
  {
    id: "phoenix-3004362",
    name: "UK 5 N",
    category: "connections",
    manufacturer: "Phoenix Contact",
    partNumber: "3004362",
    sourceUrl:
      "https://www.phoenixcontact.com/en-us/products/feed-through-terminal-block-uk-5-n-3004362",
    reviewedOn: "2026-11-02",
    verification: "source-reviewed-facts",
    licensing: "factual-metadata-only",
    ratings: {
      nominalVoltageV: 800,
      nominalCurrentA: 32,
      ratedCrossSectionMm2: 4,
      minimumCrossSectionMm2: 0.2,
      maximumCrossSectionMm2: 6,
      connectionMethod: "screw",
      connections: 2,
    },
    // One electrical node represents the common potential of this feed-through block.
    mapping: { glyph: "terminal", electricalNodes: 1, connections: 2 },
  },
  {
    id: "phoenix-3044076",
    name: "UT 2,5",
    category: "connections",
    manufacturer: "Phoenix Contact",
    partNumber: "3044076",
    sourceUrl:
      "https://www.phoenixcontact.com/en-us/products/feed-through-terminal-block-ut-25-3044076",
    reviewedOn: "2026-11-03",
    verification: "source-reviewed-facts",
    licensing: "factual-metadata-only",
    appearance: { finish: "gray (RAL 7042)", displayHex: "#8c9291" },
    dimensionsMm: { width: 5.2, height: 47.7, depth: 46.9 },
    mounting: "NS 35/7.5; NS 35/15",
    mountedDepthsMm: [
      { rail: "NS 35/7.5", depth: 47.5 },
      { rail: "NS 35/15", depth: 55 },
    ],
    ratings: {
      nominalVoltageV: 1000,
      nominalCurrentA: 24,
      ratedCrossSectionMm2: 2.5,
      minimumCrossSectionMm2: 0.14,
      maximumCrossSectionMm2: 4,
      connectionMethod: "screw",
      connections: 2,
      sectionRangeBasis:
        "Unprepared rigid or flexible conductors; ferrule ranges differ",
    },
    mapping: { glyph: "terminal", electricalNodes: 1, connections: 2 },
  },
  {
    id: "wago-2002-1201",
    name: "TOPJOB S 2002-1201",
    category: "connections",
    manufacturer: "WAGO",
    partNumber: "2002-1201",
    sourceUrl:
      "https://www.wago.com/global/rail-mount-terminal-blocks/2-conductor-through-terminal-block/p/2002-1201",
    reviewedOn: "2026-11-02",
    verification: "source-reviewed-facts",
    licensing: "factual-metadata-only",
    ratings: {
      ratedCrossSectionMm2: 2.5,
      connectionMethod: "Push-in CAGE CLAMP",
      connections: 2,
    },
    mapping: { glyph: "terminal", electricalNodes: 1, connections: 2 },
  },
  {
    id: "schneider-zbe101",
    name: "Harmony ZBE101 NO contact block",
    category: "switching",
    manufacturer: "Schneider Electric",
    partNumber: "ZBE101",
    sourceUrl:
      "https://www.se.com/us/en/product/ZBE101/harmony-22mm-push-button-add-on-contact-block-1-no-screw-clamp-terminal/",
    reviewedOn: "2026-11-02",
    verification: "source-reviewed-facts",
    licensing: "factual-metadata-only",
    ratings: { contactArrangement: "1 NO", connectionMethod: "screw clamp" },
    mapping: { glyph: "contact", electricalNodes: 2, connections: 2 },
  },
  {
    id: "wago-750-1405",
    name: "16-channel digital input; 24 VDC; 3 ms",
    category: "automation",
    manufacturer: "WAGO",
    partNumber: "750-1405",
    sourceUrl:
      "https://wago.partcommunity.com/3d-cad-models/750-1405-16-channel-digital-input-module-dc-24-v-positive-switching-wago?info=wago%2Fpg15%2Fserie750%2F0750-1405_0999-0962.prj",
    reviewedOn: "2026-11-10",
    verification: "source-reviewed-facts",
    licensing: "factual-metadata-only",
    appearance: { finish: "light gray", displayHex: "#ded6c9" },
    dimensionsMm: { width: 12, height: 64, depth: 100 },
    mounting: "DIN-35 rail",
    ratings: {
      channels: 16,
      fieldVoltageV: 24,
      inputFilterMs: 3,
      inputCharacteristic: "high-side switching",
    },
    mapping: {
      glyph: "component",
      symbolId: "library-digital-input-sixteen",
      electricalNodes: 18,
      connections: 18,
    },
  },
  {
    id: "wago-750-8217-625-000",
    name: "PFC200 G2 controller; 2 Ethernet; RS-232/485; 4G; extended temperature",
    category: "automation",
    manufacturer: "WAGO",
    partNumber: "750-8217/625-000",
    sourceUrl:
      "https://wago.partcommunity.com/3d-cad-models/?info=wago%2Fpg15%2Fserie750%2F0750-8217_0625_0999-0962.prj",
    reviewedOn: "2026-11-10",
    verification: "source-reviewed-facts",
    licensing: "factual-metadata-only",
    appearance: { finish: "light gray", displayHex: "#ded6c9" },
    dimensionsMm: { width: 102.5, height: 100, depth: 64.7 },
    mounting: "DIN-35 rail",
    ratings: {},
    mapping: {
      glyph: "component",
      symbolId: "library-modular-controller-interface",
      electricalNodes: 2,
      connections: 2,
    },
  },
  {
    id: "wago-750-530",
    name: "8-channel digital output; 24 VDC; 0.5 A per channel",
    category: "automation",
    manufacturer: "WAGO",
    partNumber: "750-530",
    sourceUrl:
      "https://wago.partcommunity.com/3d-cad-models/?info=wago%2Fpg15%2Fserie750%2F0750-0530_0999-0962.prj",
    reviewedOn: "2026-11-10",
    verification: "source-reviewed-facts",
    licensing: "factual-metadata-only",
    appearance: { finish: "light gray", displayHex: "#ded6c9" },
    dimensionsMm: { width: 12, height: 64, depth: 100 },
    mounting: "DIN-35 rail",
    ratings: {
      channels: 8,
      fieldVoltageV: 24,
      outputCurrentPerChannelA: 0.5,
    },
    mapping: {
      glyph: "component",
      symbolId: "library-digital-output-eight",
      electricalNodes: 10,
      connections: 10,
    },
  },
  {
    id: "siemens-p1j122728",
    name: "SIPROTEC 7SJ82 overcurrent protection; standard variant",
    category: "protection",
    manufacturer: "Siemens",
    partNumber: "P1J122728",
    sourceUrl:
      "https://mall.industry.siemens.com/mall/en/de/Catalog/Product/P1J122728",
    reviewedOn: "2026-11-10",
    verification: "source-reviewed-facts",
    licensing: "factual-metadata-only",
    mounting: "Flush mounting; 1/3 × 19 in housing width",
    frontPanel: { statusIndicators: 16, display: "large" },
    ratings: {
      binaryInputs: 11,
      binaryOutputs: 9,
      currentInputs: 4,
      voltageInputs: 4,
      auxiliarySupplyMinV: 24,
      auxiliarySupplyMaxV: 48,
      auxiliarySupplyType: "DC",
    },
    mapping: {
      glyph: "component",
      symbolId: "library-protection-relay-trip",
      electricalNodes: 7,
      connections: 7,
    },
  },
];

export function catalogMissingData(part: CatalogPart) {
  const missing: (
    | "nominalVoltage"
    | "nominalCurrent"
    | "catalogDimensions"
    | "catalogTerminalMarkings"
    | "catalogMounting"
    | "catalogSourceRevision"
  )[] = [];
  if (typeof part.ratings.nominalVoltageV !== "number")
    missing.push("nominalVoltage");
  if (typeof part.ratings.nominalCurrentA !== "number")
    missing.push("nominalCurrent");
  if (!part.dimensionsMm) missing.push("catalogDimensions");
  if (!part.terminalMarkings?.length) missing.push("catalogTerminalMarkings");
  if (!part.mounting?.trim()) missing.push("catalogMounting");
  if (!part.sourceRevision?.trim()) missing.push("catalogSourceRevision");
  return missing;
}

export function compatibleCatalogDevice(
  project: Project,
  deviceId: string,
  part: CatalogPart,
): boolean {
  const instances = project.symbolInstances.filter(
    (s) => s.deviceId === deviceId,
  );
  return (
    instances.length > 0 &&
    project.terminals.filter((t) => t.deviceId === deviceId).length ===
      part.mapping.electricalNodes &&
    instances.every((instance) => {
      const definition = project.symbolDefinitions.find(
        (d) => d.id === instance.definitionId,
      );
      const layer = project.layers.find((l) => l.id === instance.layerId);
      return (
        (part.mapping.glyph === "component"
          ? definition?.id === part.mapping.symbolId
          : definition?.glyph === part.mapping.glyph) &&
        !!layer &&
        !layer.locked &&
        layer.visible
      );
    })
  );
}

export function searchCatalog(
  query: string,
  category = "",
  manufacturer = "",
  requirements: { minimumVoltageV?: number; minimumCurrentA?: number } = {},
): CatalogPart[] {
  if (
    Object.values(requirements).some(
      (value) => value !== undefined && (!Number.isFinite(value) || value < 0),
    )
  )
    return [];
  const words = query
    .trim()
    .normalize("NFKC")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  return catalog.filter(
    (part) =>
      (!category || part.category === category) &&
      (!manufacturer || part.manufacturer === manufacturer) &&
      (requirements.minimumVoltageV === undefined ||
        (typeof part.ratings.nominalVoltageV === "number" &&
          part.ratings.nominalVoltageV >= requirements.minimumVoltageV)) &&
      (requirements.minimumCurrentA === undefined ||
        (typeof part.ratings.nominalCurrentA === "number" &&
          part.ratings.nominalCurrentA >= requirements.minimumCurrentA)) &&
      words.every((word) =>
        `${part.name} ${part.manufacturer} ${part.partNumber} ${part.category}`
          .normalize("NFKC")
          .toLowerCase()
          .includes(word),
      ),
  );
}

export function assignCatalogPart(
  project: Project,
  deviceId: string,
  catalogId: string,
): Project {
  const part = catalog.find((item) => item.id === catalogId);
  if (!part) throw new Error("Unknown catalog part");
  const next = structuredClone(project);
  const device = next.devices.find((item) => item.id === deviceId);
  if (!device) throw new Error("Unknown device");
  const terminals = next.terminals.filter((item) => item.deviceId === deviceId);
  if (!compatibleCatalogDevice(next, deviceId, part))
    throw new Error("Part requires a compatible editable symbol");
  const catalogSnapshot = {
    catalogId: part.id,
    reviewedOn: part.reviewedOn,
    category: part.category,
    description: part.name,
    mapping: structuredClone(part.mapping),
    ...(part.dimensionsMm
      ? { dimensionsMm: structuredClone(part.dimensionsMm) }
      : {}),
    ...(part.mountedDepthsMm
      ? { mountedDepthsMm: structuredClone([...part.mountedDepthsMm]) }
      : {}),
    ...(part.terminalMarkings
      ? { terminalMarkings: [...part.terminalMarkings] }
      : {}),
    ...(part.mounting ? { mounting: part.mounting } : {}),
    ...(part.frontPanel
      ? { frontPanel: structuredClone(part.frontPanel) }
      : {}),
    ...(part.sourceRevision ? { sourceRevision: part.sourceRevision } : {}),
  };
  let nativePart = next.manufacturerParts.find(
    (item) =>
      !item.custom &&
      item.manufacturer === part.manufacturer &&
      item.partNumber === part.partNumber &&
      item.sourceUrl === part.sourceUrl &&
      JSON.stringify(item.ratings) === JSON.stringify(part.ratings) &&
      JSON.stringify(item.catalogSnapshot) === JSON.stringify(catalogSnapshot),
  );
  if (!nativePart) {
    nativePart = {
      id: crypto.randomUUID(),
      name: part.name,
      manufacturer: part.manufacturer,
      partNumber: part.partNumber,
      sourceUrl: part.sourceUrl,
      ratings: structuredClone(part.ratings),
      catalogSnapshot,
    };
    next.manufacturerParts.push(nativePart);
  }
  device.partId = nativePart.id;
  if (part.mapping.glyph === "terminal")
    terminals[0].capacity = part.mapping.connections;
  return validateProject(next);
}
