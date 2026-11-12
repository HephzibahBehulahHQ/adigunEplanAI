import { expect, test } from "@playwright/test";
import { nativeProject } from "../fixtures/native-project.mjs";
import { selectMenuTab } from "./workbench";

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
  const bot = page.getByRole("complementary", {
    name: "Adigun BOT",
    exact: true,
  });
  await expect(bot).toBeVisible();
  await expect(bot).toHaveAttribute("data-docked", "true");
  const docked = (await bot.boundingBox())!;
  const cabinetBounds = (await cabinet.boundingBox())!;
  expect(docked.x).toBeGreaterThanOrEqual(
    cabinetBounds.x + cabinetBounds.width,
  );
  await bot
    .getByRole("button", { name: "Float BOT window", exact: true })
    .click();
  await expect(bot).toHaveAttribute("data-docked", "false");
  await bot
    .getByRole("button", { name: "Dock BOT to workspace", exact: true })
    .click();
  await expect(bot).toHaveAttribute("data-docked", "true");
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
  await selectMenuTab(page, "File menu");
  const menus = page.locator(".workbench-command-popover .ribbon-tabs");
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
    await selectMenuTab(page, "Tools menu");
    await expect(
      page.getByRole("button", {
        name: "Fit page · Engineering commands",
        exact: true,
      }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    const help = menus.getByRole("button", { name: "Help menu", exact: true });
    await help.click();
    const guide = page.getByRole("dialog", {
      name: "Workspace guide",
      exact: true,
    });
    await expect(guide).toBeVisible();
    const bounds = (await guide.boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width + 1);
    await page.keyboard.press("Escape");
    await expect(guide).toHaveCount(0);
    await expect(help).toBeFocused();
  }
});

test("Home commands print native geometry, open the library and close without losing saved projects", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1672, height: 941 });
  const project = nativeProject();
  await page.goto("/");
  await page.getByLabel("Import project", { exact: true }).setInputFiles({
    name: "ribbon.adeplan",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(project)),
  });
  const before = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("adiguneplanai.projects.v1")!).projects,
  );
  await page.getByRole("button", { name: "Save all", exact: true }).click();
  const popupEvent = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Print", exact: true }).click();
  const popup = await popupEvent;
  await expect(popup.locator("svg")).toHaveAttribute("viewBox", "0 0 420 297");
  await expect(popup.locator("svg > title")).toContainText(project.name);
  const pdf = await popup.pdf({ preferCSSPageSize: true });
  expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
  await popup.close();
  await page
    .getByRole("button", {
      name: "Device Catalog · Home",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Device Catalog", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("dialog", { name: "Device Catalog", exact: true })
    .getByRole("button", { name: "Close", exact: true })
    .click();
  await page.getByRole("tab", { name: "Project", exact: true }).click();
  await page
    .getByRole("button", { name: "Close project", exact: true })
    .click();
  await expect(page.locator(".empty-workspace")).toBeVisible();
  await expect(page.locator(".engineering-canvas")).toHaveCount(0);
  await page.reload();
  await expect(page.locator(".empty-workspace")).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("adiguneplanai.projects.v1")!).projects,
    ),
  ).toEqual(before);
  await page
    .getByLabel("Choose project", { exact: true })
    .selectOption(project.id);
  await expect(page.locator(".engineering-canvas")).toBeVisible();
});

test("many drawing sheets keep the add command visible on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 844 });
  const project = nativeProject();
  for (let index = 2; index <= 9; index++) {
    project.pages.push({
      ...project.pages[0],
      id: `extra-page-${index}`,
      name: `Sheet ${index}`,
      order: index - 1,
    });
  }
  await page.goto("/");
  await page.getByLabel("Import project", { exact: true }).setInputFiles({
    name: "many-sheets.adeplan",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(project)),
  });
  await page
    .locator('[data-panel="project"]')
    .getByRole("button", { name: "Sheet 9", exact: true })
    .click();
  const tabs = page.locator(".drawing-pages");
  await tabs.scrollIntoViewIfNeeded();
  const active = tabs.getByRole("button", { name: "Sheet 9", exact: true });
  await expect(active).toHaveAttribute("aria-pressed", "true");
  await expect(active).toBeInViewport();
  const add = tabs.getByRole("button", {
    name: "New drawing page",
    exact: true,
  });
  await expect(add).toBeInViewport();
  await add.click();
  await expect(
    tabs.getByRole("button", { name: "Sheet 10", exact: true }),
  ).toHaveCount(1);
});
