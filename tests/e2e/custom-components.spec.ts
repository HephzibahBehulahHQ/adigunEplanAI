import { openComponentLibrary, openEditorTools } from "./workbench";
import { reloadAndReopenProject } from "../fixtures/reopen-project";
import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
const storageKey = "adiguneplanai.projects.v1";
async function project(page: Page) {
  return page.evaluate((key) => {
    const library = JSON.parse(localStorage.getItem(key)!);
    return library.projects.find(
      (p: { id: string }) => p.id === library.activeProjectId,
    );
  }, storageKey);
}
async function create(page: Page, name: string) {
  await page.goto("/");
  await page.getByRole("button", { name: "New project", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "New project", exact: true });
  await dialog.getByLabel("Project name", { exact: true }).fill(name);
  await dialog.getByRole("button", { name: "Create", exact: true }).click();
}
async function terminal(page: Page, x: number) {
  await openEditorTools(page);
  await page
    .getByRole("combobox", { name: "Symbols", exact: true })
    .selectOption("terminal");
  const canvas = page.locator(".engineering-canvas");
  await canvas.scrollIntoViewIfNeeded();
  const point = await canvas.evaluate((svg, x) => {
    const p = new DOMPoint(x, 100).matrixTransform(
      (svg as SVGSVGElement).getScreenCTM()!,
    );
    return { x: p.x, y: p.y };
  }, x);
  await page.mouse.click(point.x, point.y);
}
async function openLibrary(page: Page) {
  await openComponentLibrary(page);
  await page.locator(".component-library > summary").click();
  await page.locator(".custom-components > summary").click();
}
async function addComponent(page: Page) {
  const data = await project(page);
  const form = page.getByRole("form", {
    name: "Custom components",
    exact: true,
  });
  await form
    .getByLabel("Component name", { exact: true })
    .fill("User terminal fixture");
  await form
    .getByLabel("Manufacturer", { exact: true })
    .fill("User test laboratory");
  await form.getByLabel("Part number", { exact: true }).fill("USER-T1");
  await form.getByLabel("Category", { exact: true }).fill("connections");
  await form
    .getByLabel("Description", { exact: true })
    .fill("User-authored test terminal record");
  await form
    .getByLabel("Mapped native symbol", { exact: true })
    .selectOption(
      data.symbolDefinitions.find(
        (d: { glyph: string }) => d.glyph === "terminal",
      ).id,
    );
  await form
    .getByLabel("Declared voltage (V, optional)", { exact: true })
    .fill("24");
  await form
    .getByLabel("Data rights", { exact: true })
    .selectOption("user-owned");
  await form
    .getByRole("button", { name: "Create component", exact: true })
    .click();
  return page.getByRole("article", {
    name: "User terminal fixture v1",
    exact: true,
  });
}

test("custom component revisions preserve native wiring and require explicit part replacement", async ({
  page,
}) => {
  await create(page, "Custom component revisions");
  await terminal(page, 100);
  await terminal(page, 160);
  await page.getByRole("button", { name: "Wire", exact: true }).click();
  await page.getByRole("button", { name: "X1:1", exact: true }).click();
  await page.getByRole("button", { name: "X2:1", exact: true }).click();
  const before = await project(page);
  await openLibrary(page);
  const firstCard = await addComponent(page);
  await expect(firstCard).toContainText("User-supplied · Unverified");
  await firstCard
    .getByLabel("Compatible device", { exact: true })
    .selectOption(before.devices[0].id);
  await firstCard
    .getByRole("button", { name: "Assign part", exact: true })
    .click();
  const first = (await project(page)).manufacturerParts[0];
  const form = page.getByRole("form", {
    name: "Custom components",
    exact: true,
  });
  await form
    .getByLabel("Declared voltage (V, optional)", { exact: true })
    .fill("48");
  await form
    .getByRole("button", { name: "Create next revision", exact: true })
    .click();
  let data = await project(page);
  expect(data.manufacturerParts).toHaveLength(2);
  expect(data.devices[0].partId).toBe(first.id);
  expect(data.manufacturerParts[0].ratings.nominalVoltageV).toBe(24);
  expect(data.manufacturerParts[1].custom.revision).toBe(2);
  expect(data.manufacturerParts[1].custom.componentId).toBe(
    first.custom.componentId,
  );
  await page
    .getByRole("button", { name: "Undo · Header", exact: true })
    .click();
  expect((await project(page)).manufacturerParts).toHaveLength(1);
  await page
    .getByRole("button", { name: "Redo · Header", exact: true })
    .click();
  const secondCard = page.getByRole("article", {
    name: "User terminal fixture v2",
    exact: true,
  });
  await secondCard
    .getByLabel("Compatible device", { exact: true })
    .selectOption(before.devices[0].id);
  await secondCard
    .getByRole("button", { name: "Assign part", exact: true })
    .click();
  data = await project(page);
  expect(data.devices[0].partId).toBe(data.manufacturerParts[1].id);
  expect(data.wires).toEqual(before.wires);
  expect(data.pins).toEqual(before.pins);
  expect(data.terminals).toEqual(before.terminals);
  await reloadAndReopenProject(page);
  await openLibrary(page);
  await expect(secondCard).toBeVisible();
  expect((await project(page)).manufacturerParts).toEqual(
    data.manufacturerParts,
  );
  expect((await project(page)).wires).toEqual(data.wires);
});

test("custom component file round trips across projects and invalid imports preserve work", async ({
  page,
}) => {
  await create(page, "Component source");
  await terminal(page, 100);
  await openLibrary(page);
  const card = await addComponent(page);
  const downloaded = page.waitForEvent("download");
  await card
    .getByRole("button", {
      name: "Export component: User terminal fixture v1",
      exact: true,
    })
    .click();
  const download = await downloaded;
  const file = readFileSync((await download.path())!, "utf8");
  const exported = JSON.parse(file);
  expect(exported.format).toBe("adiguneplanai.component");
  expect(exported.part.custom.verification).toBe("unverified");
  await create(page, "Component target");
  await openLibrary(page);
  const upload = page.getByLabel("Import component", { exact: true });
  await upload.setInputFiles({
    name: "fixture.adcomponent.json",
    mimeType: "application/json",
    buffer: Buffer.from(file),
  });
  await expect(
    page.getByRole("article", {
      name: "User terminal fixture v1",
      exact: true,
    }),
  ).toBeVisible();
  const imported = await project(page);
  expect(imported.manufacturerParts[0]).toEqual(exported.part);
  expect(imported.symbolDefinitions[0]).toEqual(
    exported.part.custom.symbolDefinition,
  );
  for (const corrupt of [
    "{",
    JSON.stringify({ ...exported, formatVersion: 99 }),
    JSON.stringify({
      ...exported,
      part: { ...exported.part, name: "Conflicting record" },
    }),
  ]) {
    await upload.setInputFiles({
      name: "invalid.json",
      mimeType: "application/json",
      buffer: Buffer.from(corrupt),
    });
    await expect(
      page.locator(".custom-components").getByRole("status"),
    ).toHaveText(
      "Component action rejected. Existing work has been preserved.",
    );
    expect(await project(page)).toEqual(imported);
  }
  await reloadAndReopenProject(page);
  await openLibrary(page);
  expect((await project(page)).manufacturerParts[0]).toEqual(exported.part);
});

// These suites exercise the optional full contextual editor controls.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const key = "adiguneplanai.interface.v1";
    const prefs = JSON.parse(localStorage.getItem(key) || "{}");
    localStorage.setItem(key, JSON.stringify({ ...prefs, compact: false }));
  });
});
