import { expect, test } from "@playwright/test";
import { nativeProject } from "../fixtures/native-project.mjs";

test("the native drawing, cabinet and docked BOT work together on desktop", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1672, height: 941 });
  const project = nativeProject();
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
  await page.goto("/");
  await page.getByLabel("Import project", { exact: true }).setInputFiles({
    name: "cabinet.adeplan",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(project)),
  });
  const cabinet = page.getByRole("region", { name: "3D panel", exact: true });
  const model = cabinet.getByRole("img", { name: "Cabinet review" });
  await expect(model.locator("polygon")).toHaveCount(3);
  await cabinet.getByRole("button", { name: "Front", exact: true }).click();
  await expect(model.locator("polygon")).toHaveCount(1);

  await page.getByRole("button", { name: "Adigun BOT", exact: true }).click();
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

  const status = page.locator(".status-context");
  await expect(status).toContainText(project.pages[0].name);
  await expect(status).toContainText(`Grid (mm) ${project.pages[0].gridMm}`);
  await page
    .getByRole("button", { name: "Building design", exact: true })
    .click();
  await expect(status).toContainText("Building design");
  await expect(status).not.toContainText("Grid (mm)");
  await page.getByRole("button", { name: "Schematic", exact: true }).click();
  await expect(status).toContainText(project.pages[0].name);

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
