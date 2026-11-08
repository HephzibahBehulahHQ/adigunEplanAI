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
  await expect(bot.getByRole("log")).toContainText(device.name);

  const ribbon = page.locator(".schematic-ribbon");
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
