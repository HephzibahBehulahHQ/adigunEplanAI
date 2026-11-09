import { expect, test } from "@playwright/test";
import { nativeProject } from "../fixtures/native-project.mjs";

test("the native drawing, cabinet and docked BOT work together on desktop", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1672, height: 941 });
  const project = nativeProject();
  project.calculations.push(
    {
      id: "calc-feeder",
      name: "Feeder inputs",
      kind: "Load study",
      inputs: { voltage: 400, offset: 0 },
      units: { voltage: "V" },
      assumptions: ["Balanced phases"],
      methodReference: "Feeder study worksheet A",
    },
    {
      id: "calc-control",
      name: "Control inputs",
      kind: "Load study",
      inputs: { voltage: 24 },
      units: { voltage: "V" },
      assumptions: [],
      methodReference: "Control study worksheet B",
    },
  );
  const device = project.devices[0];
  project.enclosures.push({
    id: "cabinet-review",
    name: "Cabinet review",
    widthMm: 800,
    heightMm: 1000,
    depthMm: 300,
  });
  project.equipment3d.push({
    id: "mount-review",
    name: device.name,
    deviceId: device.id,
    enclosureId: "cabinet-review",
    positionMm: { x: 100, y: 200, z: 20 },
    sizeMm: { x: 100, y: 80, z: 45 },
  });
  project.enclosures.push({
    ...project.enclosures[0],
    id: "cabinet-secondary",
    name: "Secondary cabinet",
  });
  project.equipment3d.push({
    ...project.equipment3d[0],
    id: "mount-secondary",
    name: project.devices[1].name,
    deviceId: project.devices[1].id,
    enclosureId: "cabinet-secondary",
  });
  await page.goto("/");
  await page.getByLabel("Import project", { exact: true }).setInputFiles({
    name: "cabinet.adeplan",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(project)),
  });
  const calculations = page.getByRole("region", { name: "Calculations" });
  await expect(calculations).toContainText("400 V");
  await expect(calculations).toContainText("Feeder study worksheet A");
  await calculations.getByText("Assumptions", { exact: true }).click();
  await expect(calculations.getByText("Balanced phases")).toBeVisible();
  await calculations
    .getByRole("combobox", { name: "Calculations" })
    .selectOption("calc-control");
  await expect(calculations).toContainText("24 V");
  await expect(calculations).not.toContainText("Feeder study worksheet A");
  const tabs = page.locator(".ribbon-tabs");
  await calculations.getByRole("button", { name: "Hide Calculations" }).click();
  await tabs.getByRole("button", { name: "Analysis", exact: true }).click();
  await page.getByRole("button", { name: "Show Calculations" }).click();
  await expect(calculations).toBeVisible();
  await expect(
    calculations.locator(".panel-heading button").first(),
  ).toBeFocused();
  await tabs.getByRole("button", { name: "Home", exact: true }).click();
  await page.setViewportSize({ width: 375, height: 812 });
  const homeRibbon = page.locator('.ribbon[data-tab="home"]');
  await homeRibbon
    .getByRole("button", { name: "Fit page", exact: true })
    .focus();
  const ribbonSize = await homeRibbon.evaluate((element) => ({
    height: element.offsetHeight,
    scroll: element.scrollLeft,
    documentWidth: document.documentElement.scrollWidth,
  }));
  expect(ribbonSize.height).toBeLessThanOrEqual(100);
  expect(ribbonSize.scroll).toBeGreaterThan(0);
  expect(ribbonSize.documentWidth).toBe(375);
  await page.setViewportSize({ width: 1672, height: 941 });
  const titleBlock = page.locator(".drawing-title-block");
  await expect(titleBlock).toContainText("Projektname");
  await expect(titleBlock).toContainText(project.name);
  await expect(titleBlock).toContainText(project.pages[0].name);
  await expect(titleBlock).toContainText("420 × 297 mm");
  const cabinet = page.getByRole("region", { name: "3D panel", exact: true });
  const model = cabinet.getByRole("img", { name: "Cabinet review" });
  const axes = cabinet.locator(".cabinet-axes text");
  const cube = cabinet.locator(".cabinet-orientation text");
  await expect(axes).toHaveText(["X", "Y", "Z"]);
  await expect(cube).toHaveText(["+X", "+Y", "+Z"]);
  await expect(model.locator(".enclosure-hidden-edge")).toHaveCount(3);
  await expect(model.locator("polygon")).toHaveCount(3);
  await cabinet.getByRole("button", { name: "Front", exact: true }).click();
  await expect(axes).toHaveText(["X", "Y"]);
  await expect(cube).toHaveText(["+Z"]);
  await expect(model.locator("polygon")).toHaveCount(1);
  const highlighted = model.locator("[data-highlighted]");
  await page
    .locator(`[data-instance="${project.symbolInstances[0].id}"] text`)
    .first()
    .click();
  await expect(highlighted).toHaveCount(1);
  await expect(highlighted.locator("title")).toHaveText(device.reference);
  await page
    .locator(`[data-instance="${project.symbolInstances[1].id}"] text`)
    .first()
    .click();
  const secondary = cabinet.getByRole("img", { name: "Secondary cabinet" });
  await expect(secondary.locator("[data-highlighted] title")).toHaveText(
    project.devices[1].reference,
  );
  await cabinet
    .getByRole("combobox", { name: "3D panel" })
    .selectOption("cabinet-review");
  await expect(model).toBeVisible();
  await expect(highlighted).toHaveCount(0);

  await tabs.getByRole("button", { name: "AI tools", exact: true }).click();
  await page
    .getByRole("button", { name: "Show Adigun BOT", exact: true })
    .click();
  await tabs.getByRole("button", { name: "Home", exact: true }).click();
  const bot = page.getByRole("region", { name: "Adigun BOT", exact: true });
  const lookup = bot.getByRole("textbox", {
    name: "Look up a device reference",
  });
  await lookup.fill(device.reference.toLowerCase());
  await lookup.press("Enter");
  await expect(bot.getByRole("log")).toContainText(device.name);
  await bot.getByRole("button", { name: "Dock BOT to workspace" }).click();
  const drawingBounds = await page
    .getByRole("main", { name: "Workspace" })
    .boundingBox();
  const cabinetBounds = await cabinet.boundingBox();
  const botBounds = await bot.boundingBox();
  expect(drawingBounds!.x + drawingBounds!.width).toBeLessThan(
    cabinetBounds!.x,
  );
  expect(cabinetBounds!.x + cabinetBounds!.width).toBeLessThan(botBounds!.x);
  const leftDock = await page.locator(".dock-left").boundingBox();
  const lowerDock = await page.locator(".dock-bottom").boundingBox();
  expect(lowerDock!.x).toBe(drawingBounds!.x);
  expect(leftDock!.y + leftDock!.height).toBe(lowerDock!.y + lowerDock!.height);
  expect(drawingBounds!.y + drawingBounds!.height).toBeLessThan(lowerDock!.y);
  await expect(bot.getByRole("log")).toContainText(device.name);

  const composerBounds = await lookup.boundingBox();
  const scroller = bot.locator(".bot-body");
  for (let i = 0; i < 10; i++) {
    await lookup.fill(device.reference);
    await bot.getByRole("button", { name: "Ask", exact: true }).click();
  }
  await expect
    .poll(() => scroller.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0);
  await scroller.evaluate((element) => (element.scrollTop = 0));
  expect(await lookup.boundingBox()).toEqual(composerBounds);
  expect(composerBounds!.y + composerBounds!.height).toBeLessThanOrEqual(
    botBounds!.y + botBounds!.height,
  );

  const status = page.locator(".status-context");
  const sheetProperties = page
    .getByRole("region", { name: "Properties", exact: true })
    .locator(".sheet-properties");
  await expect(sheetProperties).toContainText(project.pages[0].name);
  await expect(sheetProperties).toContainText("420 × 297 mm");
  await expect(status).toContainText(project.pages[0].name);
  await expect(status).toContainText(`Grid (mm) ${project.pages[0].gridMm}`);
  await tabs
    .getByRole("button", { name: "Building workspace", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Show Building design", exact: true })
    .click();
  await expect(status).toContainText("Building design");
  await expect(sheetProperties).toHaveCount(0);
  await expect(status).not.toContainText("Grid (mm)");
  await page
    .getByRole("button", { name: "Show Schematic", exact: true })
    .click();
  await tabs.getByRole("button", { name: "Home", exact: true }).click();
  await expect(status).toContainText(project.pages[0].name);
  await expect(sheetProperties).toContainText(project.pages[0].name);

  const ribbon = page.locator(".schematic-ribbon");
  const groups = await ribbon.getByRole("group").evaluateAll((elements) =>
    elements.map((element) => {
      const { top, right } = element.getBoundingClientRect();
      return { top, right };
    }),
  );
  expect(groups).toHaveLength(4);
  for (const group of groups) {
    expect(group.top).toBe(groups[0].top);
    expect(group.right).toBeLessThanOrEqual(1672);
  }
  await ribbon.getByRole("button", { name: "Wire", exact: true }).click();
  await expect(
    ribbon.getByRole("button", { name: "Wire", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(
    bot.getByRole("button", { name: "Float BOT window" }),
  ).toBeVisible();
  await expect(model).toBeVisible();
});
