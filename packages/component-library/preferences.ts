import { z } from "zod";
import { catalog } from "./catalog.ts";

export const catalogPreferencesKey = "adiguneplanai.catalog-preferences.v1";
const preferenceSchema = z
  .object({
    version: z.literal(1),
    favoriteIds: z.array(z.string().min(1).max(160)).max(100),
    recentIds: z.array(z.string().min(1).max(160)).max(20),
  })
  .strict();
export type CatalogPreferences = z.infer<typeof preferenceSchema>;
const known = (id: string) => catalog.some((part) => part.id === id);
export const emptyCatalogPreferences = (): CatalogPreferences => ({
  version: 1,
  favoriteIds: [],
  recentIds: [],
});
export function parseCatalogPreferences(
  raw: string | null,
): CatalogPreferences {
  if (raw === null) return emptyCatalogPreferences();
  if (raw.length > 32768) throw new Error("Catalog preferences too large");
  const parsed = preferenceSchema.parse(JSON.parse(raw));
  return {
    version: 1,
    favoriteIds: [...new Set(parsed.favoriteIds)].filter(known),
    recentIds: [...new Set(parsed.recentIds)].filter(known),
  };
}
export function toggleCatalogFavorite(
  value: CatalogPreferences,
  id: string,
): CatalogPreferences {
  if (!known(id)) throw new Error("Unknown catalog part");
  return {
    ...value,
    favoriteIds: value.favoriteIds.includes(id)
      ? value.favoriteIds.filter((item) => item !== id)
      : [...value.favoriteIds, id].slice(-100),
  };
}
export function recordRecentCatalogPart(
  value: CatalogPreferences,
  id: string,
): CatalogPreferences {
  if (!known(id)) throw new Error("Unknown catalog part");
  return {
    ...value,
    recentIds: [id, ...value.recentIds.filter((item) => item !== id)].slice(
      0,
      20,
    ),
  };
}
