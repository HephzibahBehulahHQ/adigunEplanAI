import { expect, test } from "@playwright/test";
import { nativeProject } from "../fixtures/native-project.mjs";
import { selectMenuTab } from "./workbench.ts";

test("compact workstation geometry stays fixed while menus open at desktop and mobile widths", async ({
  page,
}, testInfo) => {
  await page.addInitScript(() =>
    localStorage.removeItem("adiguneplanai.workbench-panels.v1"),
  );
  await page.goto("/");
  for (const [width, height] of [
    [1920, 1080],
    [1440, 900],
    [1280, 900],
    [390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    await expect(page.locator(".workbench-header")).toContainText(
      "AdigunEplanAI",
    );
    await expect(page.locator(".header-profile")).toContainText("Guest");
    const layout = await page.evaluate(() => {
      const box = (selector: string) =>
        document.querySelector(selector)!.getBoundingClientRect().toJSON();
      return {
        header: box(".workbench-header"),
        toolbar: box(".workbench-toolbar"),
        workspace: box(".engineering-layout"),
        footer: box(".status-bar"),
        leftRail: box(".workbench-rail-left"),
        rightRail: box(".workbench-rail-right"),
        width: document.documentElement.scrollWidth,
      };
    });
    expect(layout.width).toBeLessThanOrEqual(width);
    expect(layout.header.height).toBe(34);
    expect(layout.toolbar.height).toBe(36);
    expect(layout.leftRail.width).toBe(36);
    expect(layout.rightRail.width).toBe(36);
    expect(layout.header.bottom).toBeLessThanOrEqual(layout.toolbar.y + 1);
    expect(layout.toolbar.bottom).toBeLessThanOrEqual(layout.workspace.y + 1);
    expect(layout.workspace.bottom).toBeLessThanOrEqual(layout.footer.y + 1);
    const stableGeometry = {
      header: layout.header,
      toolbar: layout.toolbar,
      workspace: layout.workspace,
      footer: layout.footer,
    };
    await selectMenuTab(page, "File menu");
    await expect(
      page
        .getByRole("button", { name: "Example projects", exact: true })
        .first(),
    ).toBeVisible();
    const openedGeometry = await page.evaluate(() => {
      const box = (selector: string) =>
        document.querySelector(selector)!.getBoundingClientRect().toJSON();
      return {
        header: box(".workbench-header"),
        toolbar: box(".workbench-toolbar"),
        workspace: box(".engineering-layout"),
        footer: box(".status-bar"),
      };
    });
    expect(openedGeometry).toEqual(stableGeometry);
    if (width === 1440) {
      const screenshotPath = testInfo.outputPath("compact-workbench-1440.png");
      await page.screenshot({
        path: screenshotPath,
        fullPage: false,
      });
      await testInfo.attach("compact-workbench-1440", {
        path: screenshotPath,
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
  await selectMenuTab(page, "Home");
  const project = nativeProject();
  await page.getByLabel("Import project", { exact: true }).setInputFiles({
    name: "home-tools.adeplan",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(project)),
  });
  const ribbon = page.locator(
    '.workbench-command-popover .ribbon[data-tab="home"]',
  );
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
