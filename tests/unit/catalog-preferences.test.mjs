import { test } from "node:test";
import assert from "node:assert/strict";
import { searchCatalog } from "../../packages/component-library/catalog.ts";
import {
  emptyCatalogPreferences,
  parseCatalogPreferences,
  toggleCatalogFavorite,
  recordRecentCatalogPart,
} from "../../packages/component-library/preferences.ts";

test("rating filters compose, honor boundaries and exclude undeclared ratings", () => {
  assert.deepEqual(
    searchCatalog("", "", "", { minimumCurrentA: 24 }).map((p) => p.partNumber),
    ["3004362", "3044076"],
  );
  assert.deepEqual(
    searchCatalog("", "", "", { minimumCurrentA: 25 }).map((p) => p.partNumber),
    ["3004362"],
  );
  assert.deepEqual(
    searchCatalog("", "", "", { minimumVoltageV: 1000 }).map(
      (p) => p.partNumber,
    ),
    ["3044076"],
  );
  assert.equal(searchCatalog("", "", "WAGO", { minimumVoltageV: 0 }).length, 0);
  assert.equal(
    searchCatalog("", "", "", { minimumVoltageV: 1000, minimumCurrentA: 25 })
      .length,
    0,
  );
  for (const value of [-1, NaN, Infinity])
    assert.equal(
      searchCatalog("", "", "", { minimumVoltageV: value }).length,
      0,
    );
});

test("catalog preferences validate bounded versioned input and remove stale references", () => {
  assert.deepEqual(parseCatalogPreferences(null), emptyCatalogPreferences());
  const input = {
    version: 1,
    favoriteIds: ["phoenix-3004362", "removed", "phoenix-3004362"],
    recentIds: ["schneider-zbe101", "removed"],
  };
  assert.deepEqual(parseCatalogPreferences(JSON.stringify(input)), {
    version: 1,
    favoriteIds: ["phoenix-3004362"],
    recentIds: ["schneider-zbe101"],
  });
  for (const raw of [
    "{",
    "null",
    JSON.stringify({ ...input, version: 2 }),
    JSON.stringify({ ...input, recentIds: Array(21).fill("phoenix-3004362") }),
    JSON.stringify({ ...input, favoriteIds: [false] }),
    " ".repeat(32769),
  ])
    assert.throws(() => parseCatalogPreferences(raw));
});

test("favorites toggle without changing prior snapshots or recent history", () => {
  const initial = emptyCatalogPreferences();
  const next = toggleCatalogFavorite(initial, "phoenix-3004362");
  assert.deepEqual(initial.favoriteIds, []);
  assert.deepEqual(next.favoriteIds, ["phoenix-3004362"]);
  assert.deepEqual(next.recentIds, []);
  assert.deepEqual(toggleCatalogFavorite(next, "phoenix-3004362"), initial);
  assert.throws(() => toggleCatalogFavorite(initial, "unknown"));
});

test("recent assignments move to the front without duplicates or changing favorites", () => {
  const initial = toggleCatalogFavorite(
    emptyCatalogPreferences(),
    "schneider-zbe101",
  );
  const next = recordRecentCatalogPart(
    recordRecentCatalogPart(
      recordRecentCatalogPart(initial, "phoenix-3004362"),
      "phoenix-3044076",
    ),
    "phoenix-3004362",
  );
  assert.deepEqual(next.recentIds, ["phoenix-3004362", "phoenix-3044076"]);
  assert.deepEqual(next.favoriteIds, initial.favoriteIds);
  assert.deepEqual(initial.recentIds, []);
  assert.deepEqual(parseCatalogPreferences(JSON.stringify(next)), next);
  assert.throws(() => recordRecentCatalogPart(initial, "unknown"));
});
