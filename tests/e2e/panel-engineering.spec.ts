import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { nativeProject } from "../fixtures/native-project.mjs";

test("native panel editing synchronizes front and 3D geometry, undo, diagnostics and exports", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  await page.getByLabel("Import project", { exact: true }).setInputFiles({
    name: "panel-reference.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(nativeProject())),
  });
  await page.getByRole("button", { name: "Panel design", exact: true }).click();
  const panel = page.locator(".native-drawing .panel-editor");
  const enclosure = panel.getByRole("form", {
    name: "Save enclosure",
    exact: true,
  });
  await enclosure
    .getByLabel("Enclosure name", { exact: true })
    .fill("Control cabinet");
  await enclosure
    .getByRole("button", { name: "Save enclosure", exact: true })
    .click();
  await expect(
    panel.getByRole("group", { name: "Panel front layout", exact: true }),
  ).toBeVisible();
  await panel
    .locator("summary")
    .filter({ hasText: /^Mounting structures$/ })
    .click();
  const structure = panel.getByRole("form", {
    name: "Save structure",
    exact: true,
  });
  await structure.getByLabel("Structure name", { exact: true }).fill("Rail A");
  await structure
    .getByLabel("Structure type", { exact: true })
    .selectOption("din-rail");
  await structure.getByLabel("Y position (mm)", { exact: true }).fill("100");
  await structure.getByLabel("Z position (mm)", { exact: true }).fill("2.5");
  await structure
    .getByLabel("Support mounting profile (user supplied)", { exact: true })
    .fill("TS35");
  await structure
    .getByRole("button", { name: "Save structure", exact: true })
    .click();
  await panel
    .locator("summary")
    .filter({ hasText: /^Cabinet equipment$/ })
    .click();
  const placement = panel.getByRole("form", {
    name: "Save cabinet placement",
    exact: true,
  });
  await placement
    .getByLabel("Device", { exact: true })
    .selectOption("device-a");
  await placement.getByLabel("Description", { exact: true }).fill("Terminal A");
  await placement.getByLabel("Y position (mm)", { exact: true }).fill("90");
  await placement.getByLabel("Depth (mm)", { exact: true }).fill("40");
  await placement
    .getByLabel("Mounting support", { exact: true })
    .selectOption({ label: "Rail A" });
  await placement
    .getByRole("button", { name: "Save cabinet placement", exact: true })
    .click();
  await expect(
    panel.getByText("No geometric conflicts detected", { exact: true }),
  ).toBeVisible();
  const frontObject = panel
    .locator(".panel-front-view [data-panel-object]")
    .filter({ has: page.locator("title", { hasText: /^Xa —/ }) });
  await expect(frontObject.locator("rect")).toHaveAttribute("x", "50");
  await panel.getByRole("button", { name: "Move right", exact: true }).click();
  await expect(frontObject.locator("rect")).toHaveAttribute("x", "55");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(frontObject.locator("rect")).toHaveAttribute("x", "50");
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await panel
    .getByRole("button", { name: "Rotate selected object 90°", exact: true })
    .click();
  await expect(frontObject.locator("rect")).toHaveAttribute("width", "80");
  await expect(frontObject.locator("rect")).toHaveAttribute("height", "60");
  const beforeOrbit = await page.evaluate(() =>
    localStorage.getItem("adiguneplanai.projects.v1"),
  );
  const projected = panel.locator(".panel-3d-view polygon").first();
  const oldPoints = await projected.getAttribute("points");
  await panel.getByLabel("View yaw (°)", { exact: true }).focus();
  await panel.getByLabel("View yaw (°)", { exact: true }).press("ArrowRight");
  await expect(projected).not.toHaveAttribute("points", oldPoints!);
  expect(
    await page.evaluate(() =>
      localStorage.getItem("adiguneplanai.projects.v1"),
    ),
  ).toBe(beforeOrbit);
  await placement
    .getByLabel("Required mounting profile (user supplied)", { exact: true })
    .fill("TS15");
  await placement
    .getByRole("button", { name: "Save cabinet placement", exact: true })
    .click();
  await expect(
    panel.getByText(
      "Required mounting profile is missing or does not match: Xa / Rail A (TS35 / TS15)",
      { exact: true },
    ),
  ).toBeVisible();
  await placement
    .getByLabel("Required mounting profile (user supplied)", { exact: true })
    .fill("TS35");
  await placement
    .getByRole("button", { name: "Save cabinet placement", exact: true })
    .click();
  await expect(
    panel.getByText("No geometric conflicts detected", { exact: true }),
  ).toBeVisible();
  await placement.getByLabel("X position (mm)", { exact: true }).fill("590");
  await placement
    .getByRole("button", { name: "Save cabinet placement", exact: true })
    .click();
  await expect(
    panel.getByText("Outside enclosure bounds: Xa", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  const svgEvent = page.waitForEvent("download");
  await panel
    .getByRole("button", { name: "Download panel layout SVG", exact: true })
    .click();
  const svg = await readFile((await (await svgEvent).path())!, "utf8");
  expect(svg).toContain("Control cabinet");
  expect(svg).toContain('width="80" height="60"');
  const objEvent = page.waitForEvent("download");
  await panel
    .getByRole("button", { name: "Download generic geometry OBJ", exact: true })
    .click();
  const obj = await readFile((await (await objEvent).path())!, "utf8");
  expect(obj.split("\n").filter((line) => line.startsWith("v "))).toHaveLength(
    16,
  );
  await page.reload();
  await page.getByRole("button", { name: "Panel design", exact: true }).click();
  await expect(frontObject.locator("rect")).toHaveAttribute("x", "55");
  await expect(frontObject.locator("rect")).toHaveAttribute("width", "80");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("face features, non-solid compartments, closed doors and the read-only dock persist correctly", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const project = nativeProject();
  project.enclosures.push({
    id: "cabinet",
    name: "Cabinet features",
    widthMm: 600,
    heightMm: 800,
    depthMm: 200,
  });
  project.equipment3d.push({
    id: "cabinet-device",
    name: "Terminal A",
    enclosureId: "cabinet",
    deviceId: "device-a",
    positionMm: { x: 20, y: 30, z: 180 },
    sizeMm: { x: 40, y: 50, z: 20 },
    dimensionSource: "manual",
    lossPowerW: 0,
  });
  await page.goto("/");
  await page.getByLabel("Import project", { exact: true }).setInputFiles({
    name: "panel-features.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(project)),
  });
  await page.getByRole("button", { name: "Panel design", exact: true }).click();
  const panel = page.locator(".native-drawing .panel-editor");
  await panel
    .locator("summary")
    .filter({ hasText: /^Face holes and cable entries$/ })
    .click();
  const feature = panel.getByRole("form", {
    name: "Save face feature",
    exact: true,
  });
  await feature
    .getByLabel("Feature name", { exact: true })
    .fill("Left cable entry");
  await feature
    .getByLabel("Feature type", { exact: true })
    .selectOption("cable-entry");
  await feature
    .getByLabel("Enclosure face", { exact: true })
    .selectOption("left");
  await feature.getByLabel("Face centre U (mm)", { exact: true }).fill("50");
  await feature.getByLabel("Face centre V (mm)", { exact: true }).fill("100");
  await feature.getByLabel("Diameter (mm)", { exact: true }).fill("20");
  await feature
    .getByRole("button", { name: "Save face feature", exact: true })
    .click();
  await expect(
    panel.locator(".panel-3d-view [data-panel-feature]"),
  ).toHaveCount(1);
  await expect(
    panel.locator(".panel-front-view [data-panel-feature]"),
  ).toHaveCount(0);
  const download = page.waitForEvent("download");
  await panel
    .getByRole("button", { name: "Download face drawing SVG", exact: true })
    .click();
  const svg = await readFile((await (await download).path())!, "utf8");
  expect(svg).toContain('width="200" height="800"');
  expect(svg).toContain('cx="50" cy="100" r="10"');
  await panel
    .locator("summary")
    .filter({ hasText: /^Save enclosure$/ })
    .click();
  const enclosure = panel.getByRole("form", {
    name: "Save enclosure",
    exact: true,
  });
  await enclosure
    .getByLabel("Enclosure name", { exact: true })
    .fill("Renamed cabinet");
  await enclosure
    .getByRole("button", { name: "Save enclosure", exact: true })
    .click();
  await expect(
    panel.locator(".panel-3d-view [data-panel-feature]"),
  ).toHaveCount(1);
  await panel
    .locator("summary")
    .filter({ hasText: /^Mounting structures$/ })
    .click();
  const structure = panel.getByRole("form", {
    name: "Save structure",
    exact: true,
  });
  await structure
    .getByLabel("Structure name", { exact: true })
    .fill("Upper compartment");
  await structure
    .getByLabel("Structure type", { exact: true })
    .selectOption("compartment");
  await structure
    .getByRole("button", { name: "Save structure", exact: true })
    .click();
  await expect(
    panel.getByText("No geometric conflicts detected", { exact: true }),
  ).toBeVisible();
  await panel
    .getByLabel("Mounting structures", { exact: true })
    .selectOption("");
  await structure
    .getByLabel("Structure name", { exact: true })
    .fill("Front door");
  await structure
    .getByLabel("Structure type", { exact: true })
    .selectOption("door");
  await structure
    .getByRole("button", { name: "Save structure", exact: true })
    .click();
  await expect(
    panel.getByText("Solid volumes overlap: Front door / Xa", { exact: true }),
  ).toBeVisible();
  await panel
    .getByRole("table", { name: "Equipment placement list", exact: true })
    .getByRole("button", { name: "Xa", exact: true })
    .click();
  const placement = panel.getByRole("form", {
    name: "Save cabinet placement",
    exact: true,
  });
  await placement.getByLabel("Z position (mm)", { exact: true }).fill("170");
  await placement
    .getByLabel("Service access clearance (mm; blank = no rule)", {
      exact: true,
    })
    .fill("20");
  await placement
    .getByRole("button", { name: "Save cabinet placement", exact: true })
    .click();
  await expect(
    panel.getByText("Solid volumes overlap: Front door / Xa", { exact: true }),
  ).toHaveCount(0);
  await expect(
    panel.getByText(
      "Documented service access zone is obstructed: Xa / Front door",
      { exact: true },
    ),
  ).toBeVisible();
  await panel
    .locator(".panel-views")
    .screenshot({ path: test.info().outputPath("panel-geometry.png") });
  const preview = page.locator('[data-panel="panel3d"] .panel-preview');
  await expect(
    preview.getByRole("img", {
      name: "Interactive panel 3D view",
      exact: true,
    }),
  ).toBeVisible();
  await expect(preview.locator("form")).toHaveCount(0);
  const before = await page.evaluate(() =>
    localStorage.getItem("adiguneplanai.projects.v1"),
  );
  await preview.getByLabel("View yaw (°)", { exact: true }).focus();
  await preview.getByLabel("View yaw (°)", { exact: true }).press("ArrowRight");
  expect(
    await page.evaluate(() =>
      localStorage.getItem("adiguneplanai.projects.v1"),
    ),
  ).toBe(before);
  await page.reload();
  await page.getByRole("button", { name: "Panel design", exact: true }).click();
  await expect(
    panel.locator(".panel-3d-view [data-panel-feature]"),
  ).toHaveCount(1);
  await expect(
    panel.getByText(
      "Documented service access zone is obstructed: Xa / Front door",
      { exact: true },
    ),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
