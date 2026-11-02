import { validateProject, type Project } from "../electrical-model/project.ts";

export type CatalogPart = {
  id: string;
  name: string;
  category: string;
  manufacturer: string;
  partNumber: string;
  sourceUrl: string;
  reviewedOn: string;
  ratings: Record<string, string | number>;
  mapping: { glyph: "terminal"; electricalNodes: number; connections: number };
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
    reviewedOn: "2026-11-02",
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
    ratings: {
      ratedCrossSectionMm2: 2.5,
      connectionMethod: "Push-in CAGE CLAMP",
      connections: 2,
    },
    mapping: { glyph: "terminal", electricalNodes: 1, connections: 2 },
  },
];

export function searchCatalog(
  query: string,
  category = "",
  manufacturer = "",
): CatalogPart[] {
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
  const instances = next.symbolInstances.filter(
    (item) => item.deviceId === deviceId,
  );
  const terminals = next.terminals.filter((item) => item.deviceId === deviceId);
  if (
    !instances.length ||
    terminals.length !== part.mapping.electricalNodes ||
    instances.some((instance) => {
      const definition = next.symbolDefinitions.find(
        (item) => item.id === instance.definitionId,
      );
      const layer = next.layers.find((item) => item.id === instance.layerId);
      return (
        definition?.glyph !== part.mapping.glyph ||
        !layer ||
        layer.locked ||
        !layer.visible
      );
    })
  )
    throw new Error("Part requires a compatible editable terminal symbol");
  let nativePart = next.manufacturerParts.find(
    (item) =>
      item.manufacturer === part.manufacturer &&
      item.partNumber === part.partNumber &&
      item.sourceUrl === part.sourceUrl &&
      JSON.stringify(item.ratings) === JSON.stringify(part.ratings),
  );
  if (!nativePart) {
    nativePart = {
      id: crypto.randomUUID(),
      name: part.name,
      manufacturer: part.manufacturer,
      partNumber: part.partNumber,
      sourceUrl: part.sourceUrl,
      ratings: structuredClone(part.ratings),
    };
    next.manufacturerParts.push(nativePart);
  }
  device.partId = nativePart.id;
  terminals[0].capacity = part.mapping.connections;
  return validateProject(next);
}
