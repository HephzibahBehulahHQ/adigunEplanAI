import { test, expect } from "@playwright/test";
import { openProjectPanel, selectMenuTab } from "./workbench.ts";

test("theme, locale and custom background survive reload", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "No project open" }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Hephzibah Behulah" }),
  ).toHaveCount(1);
  await selectMenuTab(page, "Settings");
  await page.getByLabel("Theme", { exact: true }).selectOption("light");
  await page
    .getByLabel("Drawing background", { exact: true })
    .selectOption("custom");
  await page.getByLabel("Background color", { exact: true }).fill("#123456");
  await page.getByLabel("Language", { exact: true }).selectOption("de");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator(".drawing-sheet")).toHaveCSS(
    "background-color",
    "rgb(18, 52, 86)",
  );
  expect(errors).toEqual([]);
});
test("panels dock, resize, collapse and restore through keyboard-accessible controls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1680, height: 1050 });
  await page.goto("/");
  await expect(page.locator('.dock-left [data-panel="project"]')).toBeVisible();
  await expect(
    page.locator('.dock-right [data-panel="panel3d"]'),
  ).toBeVisible();
  await openProjectPanel(page);
  const panel = page.locator('[data-panel="project"]');
  await panel.locator("summary").click();
  await panel.getByLabel("Dock", { exact: true }).selectOption("right");
  await expect(
    page.locator('.dock-right [data-panel="project"]'),
  ).toBeVisible();
  const range = panel.getByRole("slider");
  await range.focus();
  await range.press("ArrowRight");
  await expect(range).toHaveValue("290");
  await panel
    .getByRole("button", { name: "Project navigator", exact: false })
    .first()
    .click();
  await expect(panel.getByRole("button").first()).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await page.reload();
  await expect(
    page.locator('.dock-right [data-panel="project"] button').first(),
  ).toHaveAttribute("aria-expanded", "false");
  await selectMenuTab(page, "View");
  await page.getByRole("button", { name: "Reset layout", exact: true }).click();
  await expect(page.locator('.dock-left [data-panel="project"]')).toBeVisible();
  await page
    .getByRole("button", { name: "Hide Project navigator", exact: true })
    .click();
  await expect(page.locator('[data-panel="project"]')).toHaveCount(0);
  await selectMenuTab(page, "View");
  await page
    .getByRole("checkbox", { name: "Project navigator", exact: true })
    .check();
  await expect(page.locator('[data-panel="project"]')).toBeVisible();
});
test("help dialog supports keyboard dismissal", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Help", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
for (const language of ["en", "de", "yo", "pcm"]) {
  test(`mobile ${language} has no viewport overflow`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(
      (l) =>
        localStorage.setItem(
          "adiguneplanai.interface.v1",
          JSON.stringify({ language: l }),
        ),
      language,
    );
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", language);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
}

test("workstation regions stay fixed while ribbon categories change", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1680, height: 1050 });
  await page.goto("/");
  await expect(page.locator(".storage-error[role=status]")).toHaveCount(0);
  const regions = [
    ".workbench-header",
    ".workbench-toolbar",
    ".engineering-layout",
    ".workspace",
    ".status-bar",
  ];
  const geometry = () =>
    page.evaluate(
      (selectors) =>
        Object.fromEntries(
          selectors.map((selector) => {
            const element = document.querySelector(selector);
            if (!element) return [selector, null];
            const rect = element.getBoundingClientRect();
            return [
              selector,
              [rect.x, rect.y, rect.width, rect.height].map(
                (value) => Math.round(value * 100) / 100,
              ),
            ];
          }),
        ),
      regions,
    );
  await selectMenuTab(page, "Electrical menu");
  const baseline = await geometry();
  expect(baseline[".workbench-header"]?.[3]).toBe(50);
  expect(baseline[".workbench-toolbar"]?.[3]).toBe(44);
  for (const category of [
    "Electrical menu",
    "Automation menu",
    "View",
    "Settings",
    "Home",
  ]) {
    await selectMenuTab(page, category);
    expect(await geometry()).toEqual(baseline);
  }
});
