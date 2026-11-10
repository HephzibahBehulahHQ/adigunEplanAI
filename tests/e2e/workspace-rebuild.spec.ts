import { expect, test } from "@playwright/test";
import { nativeProject } from "../fixtures/native-project.mjs";

test("native drawing frame, cabinet and calculation records share the current project", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1672, height: 941 });
  const project = nativeProject();
  project.enclosures.push({
    id: "cabinet-review",
    name: "Cabinet review",
    widthMm: 800,
    heightMm: 1000,
    depthMm: 300,
  });
  project.equipment3d.push({
    id: "mount-review",
    name: project.devices[0].name,
    deviceId: project.devices[0].id,
    enclosureId: "cabinet-review",
    positionMm: { x: 100, y: 200, z: 20 },
    sizeMm: { x: 100, y: 80, z: 45 },
  });
  project.calculations.push(
    ...[400, 24].map((voltage, index) => ({
      id: `calc-${index}`,
      name: `Voltage study ${index}`,
      kind: "Load study",
      inputs: { voltage },
      units: { voltage: "V" },
      assumptions: ["Entered design voltage"],
      methodReference: "Project input worksheet",
    })),
  );
  await page.goto("/");
  await page.getByLabel("Import project", { exact: true }).setInputFiles({
    name: "workspace.adeplan",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(project)),
  });
  const frame = page.locator(".drawing-title-block");
  await expect(frame).toContainText(project.name);
  await expect(frame).toContainText(project.pages[0].name);
  await expect(frame).toContainText("420 × 297 mm");
  const calculations = page.locator('[data-panel="calculations"]');
  await expect(calculations.locator(".calculation-record")).toContainText(
    "400 V",
  );
  await calculations
    .getByRole("combobox", { name: "Calculations", exact: true })
    .selectOption("calc-1");
  await expect(calculations.locator(".calculation-record")).toContainText(
    "24 V",
  );
  const cabinet = page.locator(".panel-preview");
  await expect(
    cabinet.getByRole("combobox", { name: "Selected enclosure" }),
  ).toHaveValue("cabinet-review");
  await expect(
    cabinet
      .locator('.panel-3d-view [data-panel-object="mount-review"]')
      .first(),
  ).toBeVisible();
  const drawing = (await page.locator(".engineering-canvas").boundingBox())!;
  const bottom = (await page.locator(".dock-bottom").boundingBox())!;
  expect(drawing.height).toBeGreaterThan(450);
  expect(drawing.y + drawing.height).toBeLessThanOrEqual(bottom.y);
  const before = await page.evaluate(() =>
    localStorage.getItem("adiguneplanai.projects.v1"),
  );
  await page
    .getByRole("button", { name: "Open Adigun BOT", exact: true })
    .click();
  const bot = page.getByRole("complementary", {
    name: "Adigun BOT",
    exact: true,
  });
  await expect(bot).toBeVisible();
  await expect(bot).toContainText(project.name);
  await expect(bot).toContainText("Hosted AI is not configured");
  await bot
    .getByRole("button", { name: "Close Adigun BOT", exact: true })
    .click();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("adiguneplanai.projects.v1"),
    ),
  ).toBe(before);
});

test("the ordered target menus remain reachable without desktop or mobile overflow", async ({
  page,
}) => {
  await page.goto("/");
  const menus = page.locator(".ribbon-tabs");
  await expect(menus.getByRole("button")).toHaveText([
    "File",
    "Home",
    "Insert",
    "Edit",
    "View",
    "Project",
    "Electrical",
    "Connections",
    "Components",
    "Automation",
    "PLC",
    "Building design",
    "Power engineering",
    "3D panel",
    "Documentation",
    "Analysis",
    "AI tools",
    "Tools",
    "Settings",
    "Help",
  ]);
  for (const width of [1672, 375]) {
    await page.setViewportSize({ width, height: 941 });
    await menus
      .getByRole("button", { name: "Tools menu", exact: true })
      .click();
    await expect(
      page.getByRole("button", {
        name: "Fit page · Engineering commands",
        exact: true,
      }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
  }
});
