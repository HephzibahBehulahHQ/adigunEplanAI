import { expect, test } from "@playwright/test";
import { nativeProject } from "../fixtures/native-project.mjs";

test("target header and one Home ribbon remain ordered and accessible at desktop and mobile widths", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  for (const width of [1857, 1280, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect(page.locator(".workbench-header")).toContainText(
      "AdigunEplanAI",
    );
    await expect(page.locator(".header-profile")).toContainText("Guest");
    await expect(page.locator(".header-profile")).not.toContainText(
      "Professional",
    );
    const layout = await page.evaluate(() => {
      const box = (selector: string) =>
        document.querySelector(selector)!.getBoundingClientRect().toJSON();
      return {
        header: box(".workbench-header"),
        tabs: box(".ribbon-tabs"),
        ribbon: box('.ribbon[data-tab="home"]'),
        tabsY: [...document.querySelectorAll(".ribbon-tabs button")].map(
          (e) => e.getBoundingClientRect().y,
        ),
        actions: [...document.querySelectorAll(".header-actions > button")].map(
          (e) => e.getBoundingClientRect().toJSON(),
        ),
        width: document.documentElement.scrollWidth,
      };
    });
    expect(layout.width).toBeLessThanOrEqual(width);
    expect(new Set(layout.tabsY).size).toBe(1);
    expect(layout.tabs.y).toBeGreaterThanOrEqual(layout.header.bottom);
    expect(layout.ribbon.y).toBeGreaterThanOrEqual(layout.tabs.bottom);
    for (let i = 1; i < layout.actions.length; i++)
      expect(layout.actions[i].x).toBeGreaterThanOrEqual(
        layout.actions[i - 1].right + 4,
      );
    if (width === 1857) {
      const ribbon = page.locator('.ribbon[data-tab="home"]');
      await expect(ribbon.locator("button[data-command]")).toHaveText([
        "New project",
        "Open",
        "Save",
        "Save all",
        "Close",
        "Print",
        "Export",
        "Undo",
        "Cut",
        "Copy",
        "Paste",
        "Select",
        "Move",
        "Rotate",
        "Align",
        "Distribute",
        "Wire",
        "Junction",
        "Net Label",
        "Terminal",
        "Place Component",
        "Symbol Library",
        "Device Catalog",
        "Validate",
        "E-Check",
        "BOM",
        "2D/3D Sync",
        "Switch View",
        "Themes",
      ]);
      await testInfo.attach("target-header-ribbon", {
        body: await page.screenshot({
          clip: { x: 0, y: 0, width, height: 210 },
        }),
        contentType: "image/png",
      });
    }
  }
});

test("Home places native components, cuts and undoes, validates and opens real catalogues", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1857, height: 1000 });
  await page.goto("/");
  const project = nativeProject();
  await page.getByLabel("Import project", { exact: true }).setInputFiles({
    name: "home-tools.adeplan",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(project)),
  });
  const ribbon = page.locator('.ribbon[data-tab="home"]');
  await ribbon
    .getByRole("button", { name: "Place Component · Home", exact: true })
    .click();
  const picker = page.getByRole("dialog", {
    name: "Place Component",
    exact: true,
  });
  await picker.getByRole("button", { name: "Resistor", exact: true }).click();
  const canvas = page.locator(".engineering-canvas");
  await expect(canvas).toHaveAttribute("data-tool", "resistor");
  await canvas.click({ position: { x: 200, y: 170 } });
  await expect(canvas.locator("[data-instance]")).toHaveCount(3);
  await ribbon.getByRole("button", { name: "Cut · Home", exact: true }).click();
  await expect(canvas.locator("[data-instance]")).toHaveCount(2);
  await ribbon
    .getByRole("button", { name: "Undo · Home", exact: true })
    .click();
  await expect(canvas.locator("[data-instance]")).toHaveCount(3);
  await ribbon
    .getByRole("button", { name: "Validate · Home", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Validate", exact: true }),
  ).toContainText("Native document structure and references are valid");
  await page.keyboard.press("Escape");
  await ribbon
    .getByRole("button", { name: "Symbol Library · Home", exact: true })
    .click();
  await expect(
    page
      .getByRole("dialog", { name: "Symbol Library", exact: true })
      .getByLabel("Search symbols", { exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await ribbon
    .getByRole("button", { name: "Device Catalog · Home", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Device Catalog", exact: true }),
  ).toContainText("Phoenix");
  await page.keyboard.press("Escape");
  await ribbon
    .getByRole("button", { name: "Themes · Home", exact: true })
    .click();
  await expect(page.getByLabel("Theme", { exact: true })).toBeVisible();
});
