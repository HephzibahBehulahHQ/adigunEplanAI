import {
  openComponentLibrary,
  openEditorTools,
  openProjectPanel,
} from "./workbench.ts";
import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
const storageKey = "adiguneplanai.projects.v1";
async function create(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "New project", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "New project", exact: true });
  await dialog
    .getByLabel("Project name", { exact: true })
    .fill("Library loading reference");
  await dialog.getByRole("button", { name: "Create", exact: true }).click();
}
const project = (page: Page) =>
  page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!).projects[0],
    storageKey,
  );
const summary = (page: Page) =>
  page
    .locator(".component-library summary")
    .filter({ hasText: /^Engineering symbols$/ });

test("engineering symbols load only on demand and preserve search while collapsed", async ({
  page,
}) => {
  let requests = 0;
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.endsWith("/EngineeringSymbols.tsx"))
      requests++;
  });
  await create(page);
  const before = await project(page);
  await openComponentLibrary(page);
  await openComponentLibrary(page);
  expect(requests).toBe(0);
  await summary(page).click();
  await page.getByLabel("Search symbols", { exact: true }).fill("transformer");
  expect(requests).toBe(1);
  await summary(page).click();
  await summary(page).click();
  await expect(page.getByLabel("Search symbols", { exact: true })).toHaveValue(
    "transformer",
  );
  expect(requests).toBe(1);
  expect(await project(page)).toEqual(before);
});

test("failed engineering-symbol download leaves native editing and export functional", async ({
  page,
}) => {
  await page.route(
    (url) => url.pathname.endsWith("/EngineeringSymbols.tsx"),
    (route) => route.abort("failed"),
  );
  await create(page);
  await openComponentLibrary(page);
  await openComponentLibrary(page);
  await summary(page).click();
  await expect(
    page.locator(".component-library").getByRole("alert"),
  ).toHaveText(
    "Engineering symbols could not load. Your project remains available for editing and export.",
  );
  await openEditorTools(page);
  await page
    .getByRole("combobox", { name: "Symbols", exact: true })
    .selectOption("terminal");
  const canvas = page.locator(".engineering-canvas");
  await canvas.scrollIntoViewIfNeeded();
  const point = await canvas.evaluate((svg) => {
    const p = new DOMPoint(100, 100).matrixTransform(
      (svg as SVGSVGElement).getScreenCTM()!,
    );
    return { x: p.x, y: p.y };
  });
  await page.mouse.click(point.x, point.y);
  const data = await project(page);
  expect(data.pins).toHaveLength(1);
  expect(data.terminals).toHaveLength(1);
  const downloaded = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export project", exact: true })
    .click();
  const download = await downloaded;
  const exported = JSON.parse(readFileSync((await download.path())!, "utf8"));
  expect(exported.devices).toEqual(data.devices);
  expect(exported.pins).toEqual(data.pins);
});

test("secondary category browsing and search leave native project unchanged", async ({
  page,
}) => {
  await create(page);
  const before = await project(page);
  await openComponentLibrary(page);
  await openComponentLibrary(page);
  await summary(page).click();
  const category = page.getByRole("combobox", {
    name: "Symbol category",
    exact: true,
  });
  await category.selectOption("power");
  await expect(
    page.locator('[data-library-preview="busbar-four-taps"]'),
  ).toBeVisible();
  await expect(
    page.locator('[data-library-preview="distribution-three-way"]'),
  ).toBeVisible();
  await page.getByLabel("Search symbols", { exact: true }).fill("busbar");
  await expect(page.locator("[data-library-preview]")).toHaveCount(1);
  await category.selectOption("connections");
  await expect(
    page.locator('[data-library-preview="busbar-four-taps"]'),
  ).toBeVisible();
  expect(await project(page)).toEqual(before);
});

test("catalog exposes missing manufacturer data and conductor range limitations", async ({
  page,
}) => {
  await create(page);
  await openComponentLibrary(page);
  await openComponentLibrary(page);
  const phoenix = page.getByRole("article", {
    name: "Phoenix Contact 3044076",
    exact: true,
  });
  await expect(phoenix.getByRole("complementary")).toContainText(
    "Manufacturer terminal markings",
  );
  await expect(phoenix.getByRole("complementary")).not.toContainText(
    "Nominal voltage",
  );
  await expect(phoenix).toContainText("ferrule ranges differ");
  await expect(phoenix).toContainText("5.2 × 47.7 × 46.9 mm");
  await expect(phoenix).toContainText("NS 35/7.5: 47.5 mm; NS 35/15: 55 mm");
  await expect(phoenix.getByRole("complementary")).not.toContainText(
    "Mechanical dimensions",
  );
  const wago = page.getByRole("article", {
    name: "WAGO 2002-1201",
    exact: true,
  });
  await expect(wago.getByRole("complementary")).toContainText(
    "Nominal voltage",
  );
  await expect(wago).toContainText("not manufacturer certification");
  await expect(wago).toContainText(
    "Listed facts reviewed against the manufacturer source",
  );
  await expect(wago).toContainText("no redistribution rights granted");
});

test("catalog loads only when opened and retains query after collapse", async ({
  page,
}) => {
  let requests = 0;
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.endsWith("/CatalogPanel.tsx"))
      requests++;
  });
  await create(page);
  expect(requests).toBe(0);
  const before = await project(page);
  const projectPanel = await openProjectPanel(page);
  await projectPanel.getByRole("tab", { name: "Library", exact: true }).click();
  await expect(page.locator(".component-library")).toBeVisible();
  const summary = page.locator(".component-library > summary");
  await expect(page.getByLabel("Search parts", { exact: true })).toBeVisible();
  expect(requests).toBe(1);
  await page.getByLabel("Search parts", { exact: true }).fill("3044076");
  await summary.click();
  await summary.click();
  await expect(page.getByLabel("Search parts", { exact: true })).toHaveValue(
    "3044076",
  );
  expect(requests).toBe(1);
  expect(await project(page)).toEqual(before);
});

test("failed catalog download preserves project export and schematic tools", async ({
  page,
}) => {
  await page.route(
    (url) => url.pathname.endsWith("/CatalogPanel.tsx"),
    (route) => route.abort("failed"),
  );
  await create(page);
  const before = await project(page);
  await openComponentLibrary(page);
  await openComponentLibrary(page);
  await expect(
    page.locator(".component-library").getByRole("alert"),
  ).toHaveText(
    "The component library could not load. Your project remains available for editing and export.",
  );
  await expect(page.locator(".engineering-canvas")).toBeVisible();
  const downloaded = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export project", exact: true })
    .click();
  const download = await downloaded;
  expect(JSON.parse(readFileSync((await download.path())!, "utf8"))).toEqual(
    before,
  );
});

test("failed building download allows return to the unchanged schematic project", async ({
  page,
}) => {
  await page.route(
    (url) => url.pathname.endsWith("/BuildingEditor.tsx"),
    (route) => route.abort("failed"),
  );
  await create(page);
  const before = await project(page);
  await page
    .getByRole("button", { name: "Building design", exact: true })
    .click();
  await expect(page.getByRole("alert")).toHaveText(
    "Building design could not load. Your project remains available in the schematic workspace.",
  );
  await page
    .getByRole("navigation", { name: "Workspace view", exact: true })
    .getByRole("button", { name: "Schematic", exact: true })
    .click();
  await expect(page.locator(".engineering-canvas")).toBeVisible();
  expect(await project(page)).toEqual(before);
});

// These suites exercise the optional full contextual editor controls.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const key = "adiguneplanai.interface.v1";
    const prefs = JSON.parse(localStorage.getItem(key) || "{}");
    localStorage.setItem(key, JSON.stringify({ ...prefs, compact: false }));
  });
});
