import { test, expect } from "@playwright/test";

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
  await page.getByRole("button", { name: "Settings", exact: true }).click();
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
  await page.goto("/");
  await page.getByRole("button", { name: "View", exact: true }).click();
  const panel = page.locator('[data-panel="project"]');
  await panel.locator("summary").click();
  await panel.getByLabel("Dock", { exact: true }).selectOption("right");
  await expect(
    page.locator('.dock-right [data-panel="project"]'),
  ).toBeVisible();
  const range = panel.getByRole("slider");
  await range.focus();
  await range.press("ArrowRight");
  await expect(range).toHaveValue("340");
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
  await page.getByRole("button", { name: "View", exact: true }).click();
  await page.getByRole("button", { name: "Reset layout", exact: true }).click();
  await expect(page.locator('.dock-left [data-panel="project"]')).toBeVisible();
  await page
    .getByRole("button", { name: "Hide Project navigator", exact: true })
    .click();
  await expect(page.locator('[data-panel="project"]')).toHaveCount(0);
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
    ".ribbon-tabs",
    ".ribbon",
    ".engineering-layout",
    ".dock-left",
    ".workspace",
    ".dock-right",
    ".dock-bottom",
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
  const baseline = await geometry();
  expect(baseline[".ribbon"]?.[3]).toBe(88);
  for (const category of [
    "Electrical",
    "Automation",
    "View",
    "Settings",
    "Home",
  ]) {
    await page
      .locator(".ribbon-tabs")
      .getByRole("button", { name: new RegExp(`^${category}`) })
      .click();
    expect(await geometry()).toEqual(baseline);
  }
});
