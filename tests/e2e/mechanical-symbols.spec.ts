import { test, expect, type Page } from "@playwright/test";
const key = "adiguneplanai.projects.v1";
async function create(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "New project", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "New project", exact: true });
  await dialog
    .getByLabel("Project name", { exact: true })
    .fill("Mechanical reference");
  await dialog.getByRole("button", { name: "Create", exact: true }).click();
}
async function project(page: Page) {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!).projects[0],
    key,
  );
}
async function clickWorld(page: Page, x: number, y: number) {
  const canvas = page.locator(".engineering-canvas");
  await canvas.scrollIntoViewIfNeeded();
  const screen = await canvas.evaluate(
    (svg, p) => {
      const point = new DOMPoint(p.x, p.y).matrixTransform(
        (svg as SVGSVGElement).getScreenCTM()!,
      );
      return { x: point.x, y: point.y };
    },
    { x, y },
  );
  await page.mouse.click(screen.x, screen.y);
}

test("mechanical gland remains pinless through native placement, BOM assignment and reload", async ({
  page,
}) => {
  await create(page);
  await page
    .locator(".navigator-tabs")
    .getByRole("button", { name: "Component library", exact: true })
    .click();
  await page
    .locator(".component-library summary")
    .filter({ hasText: /^Engineering symbols$/ })
    .click();
  await page.getByLabel("Search symbols", { exact: true }).fill("cable gland");
  await expect(
    page.getByRole("img", { name: "Mechanical cable gland", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Import symbol: Mechanical cable gland",
      exact: true,
    })
    .click();
  await page
    .getByRole("combobox", { name: "Custom symbols", exact: true })
    .selectOption("library-cable-gland-mechanical");
  await clickWorld(page, 100, 100);
  let data = await project(page);
  expect(data.devices[0].reference).toBe("ME1");
  expect(data.pins).toHaveLength(0);
  expect(data.terminals).toHaveLength(0);
  expect(data.nets).toHaveLength(0);
  await expect(page.getByRole("button", { name: /^ME1:/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Wire", exact: true }).click();
  await clickWorld(page, 100, 100);
  expect((await project(page)).wires).toHaveLength(0);
  await page.locator(".custom-components > summary").click();
  const form = page.getByRole("form", {
    name: "Custom components",
    exact: true,
  });
  await form
    .getByLabel("Component name", { exact: true })
    .fill("User gland fixture");
  await form
    .getByLabel("Manufacturer", { exact: true })
    .fill("User laboratory");
  await form.getByLabel("Part number", { exact: true }).fill("USER-GLAND");
  await form.getByLabel("Category", { exact: true }).fill("connections");
  await form
    .getByLabel("Description", { exact: true })
    .fill("User mechanical gland without electrical connections");
  await form
    .getByLabel("Mapped native symbol", { exact: true })
    .selectOption("library-cable-gland-mechanical");
  await form
    .getByRole("button", { name: "Create component", exact: true })
    .click();
  const card = page.getByRole("article", {
    name: "User gland fixture v1",
    exact: true,
  });
  await card
    .getByLabel("Compatible device", { exact: true })
    .selectOption(data.devices[0].id);
  await card.getByRole("button", { name: "Assign part", exact: true }).click();
  data = await project(page);
  expect(data.devices[0].partId).toBe(data.manufacturerParts[0].id);
  expect(data.manufacturerParts[0].custom.verification).toBe("unverified");
  await expect(
    page.getByRole("region", { name: "Bill of materials", exact: true }),
  ).toContainText("USER-GLAND");
  await page.reload();
  expect((await project(page)).devices).toEqual(data.devices);
  expect((await project(page)).pins).toHaveLength(0);
  expect((await project(page)).terminals).toHaveLength(0);
  expect((await project(page)).nets).toHaveLength(0);
});

test("custom mechanical drawings create without pins and reject reclassification after placement", async ({
  page,
}) => {
  await create(page);
  await page
    .locator(".navigator-tabs")
    .getByRole("button", { name: "Component library", exact: true })
    .click();
  await page
    .locator(".component-library summary")
    .filter({ hasText: /^Custom symbols$/ })
    .click();
  const form = page.getByRole("form", { name: "Custom symbols", exact: true });
  await form
    .getByLabel("Symbol name", { exact: true })
    .fill("User mechanical body");
  await form.getByLabel("Body width (mm)", { exact: true }).fill("20");
  await form.getByLabel("Body height (mm)", { exact: true }).fill("12");
  await form
    .getByRole("checkbox", {
      name: "Mechanical symbol (no electrical connections)",
      exact: true,
    })
    .check();
  await form.getByRole("button", { name: "Create", exact: true }).click();
  let data = await project(page);
  const definition = data.symbolDefinitions.find(
    (d: { name: string }) => d.name === "User mechanical body",
  );
  expect(definition.connectionClass).toBe("mechanical");
  expect(definition.pins).toHaveLength(0);
  await page
    .getByRole("combobox", { name: "Custom symbols", exact: true })
    .selectOption(definition.id);
  await clickWorld(page, 100, 100);
  data = await project(page);
  expect(data.pins).toHaveLength(0);
  await page
    .getByRole("combobox", { name: "Edit custom symbol", exact: true })
    .selectOption(definition.id);
  await form
    .getByRole("checkbox", {
      name: "Mechanical symbol (no electrical connections)",
      exact: true,
    })
    .uncheck();
  await form.getByLabel(/^Pins:/).fill("A, 0, 0");
  await form.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Existing work has been preserved",
  );
  expect(await project(page)).toEqual(data);
});
