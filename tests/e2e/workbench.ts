import { expect, type Page } from "@playwright/test";

const panelToggleIndex = {
  project: 0,
  properties: 1,
  panel3d: 2,
  diagnostics: 3,
  calculations: 4,
  bom: 5,
  reports: 6,
} as const;

async function showPanel(page: Page, id: keyof typeof panelToggleIndex) {
  await selectMenuTab(page, "View");
  const toggle = page
    .locator(".panel-toggles input[type=checkbox]")
    .nth(panelToggleIndex[id]);
  if (!(await toggle.isChecked())) await toggle.check();
  return page.locator(`[data-panel="${id}"]`);
}

export async function openProjectNavigator(page: Page) {
  const panel = page.locator('[data-panel="project"]');
  if (!(await panel.isVisible())) {
    if (
      (await page.locator(".application").getAttribute("data-compact")) ===
      "true"
    ) {
      await page
        .locator(".workbench-rail-left")
        .getByRole("button")
        .first()
        .click();
    } else await showPanel(page, "project");
  }
  await expect(panel).toBeVisible();
  return panel;
}

export async function openProjectPanel(page: Page, translatedTab?: string) {
  const panel = await openProjectNavigator(page);
  const tab = panel.getByRole("tab", {
    name: translatedTab ?? "Project",
    exact: true,
  });
  if ((await tab.getAttribute("aria-selected")) !== "true") await tab.click();
  return panel;
}

export async function openWorkbenchPanel(
  page: Page,
  id:
    | "properties"
    | "panel3d"
    | "diagnostics"
    | "calculations"
    | "bom"
    | "reports",
  translatedLabel?: string,
) {
  const menuTrigger = page.locator(
    ".workbench-tool-end > .workbench-menu-trigger",
  );
  if ((await menuTrigger.getAttribute("aria-expanded")) === "true")
    await menuTrigger.click();
  if (
    (await page.locator(`[data-panel="${id}"]`).isVisible()) &&
    (await page
      .locator(`[data-panel="${id}"]`)
      .evaluate((element) =>
        element.closest(".dock")?.classList.contains("dock-right"),
      ))
  )
    return page.locator(`[data-panel="${id}"]`);
  const labels = {
    properties: "Properties",
    panel3d: "3D panel",
    diagnostics: "Run electrical check",
    calculations: "Open calculations",
    bom: "Show bill of materials",
    reports: "Reports",
  };
  const panel = page.locator(`[data-panel="${id}"]`);
  await showPanel(page, id);
  if (
    (await page.locator(".application").getAttribute("data-compact")) === "true"
  ) {
    const dock = id === "properties" ? "left" : "right";
    await page
      .locator(`.workbench-rail-${dock}`)
      .getByRole("button", { name: translatedLabel ?? labels[id], exact: true })
      .click();
  }
  if (
    !(await panel.evaluate((element) =>
      element.closest(".dock")?.classList.contains("dock-right"),
    ))
  ) {
    await panel.locator(".panel-body > details > summary").click();
    await panel.getByLabel("Dock", { exact: true }).selectOption("right");
  }
  await expect(panel).toBeVisible();
  return panel;
}

export async function openComponentLibrary(page: Page) {
  const navigator = await openProjectNavigator(page);
  const tab = navigator.getByRole("tab", { name: "Library", exact: true });
  if ((await tab.getAttribute("aria-selected")) !== "true") await tab.click();
  await expect(navigator.locator(".component-library")).toBeVisible();
}

export async function openEditorTools(page: Page) {
  const button = page.getByRole("button", { name: "Layout", exact: true });
  if ((await button.getAttribute("aria-pressed")) !== "true")
    await button.click();
}

export async function selectWorkspaceView(page: Page, label: string) {
  await page
    .getByRole("toolbar", { name: "Engineering commands", exact: true })
    .getByRole("button", { name: label, exact: true })
    .click();
}

export async function selectMenuTab(page: Page, name: string) {
  const trigger = page.locator(".workbench-tool-end > .workbench-menu-trigger");
  if ((await trigger.getAttribute("aria-expanded")) !== "true")
    await trigger.click();
  const tabs = page.locator(".workbench-command-popover .ribbon-tabs");
  const tab = tabs.getByRole("button", { name, exact: true });
  if (await tab.count()) await tab.click();
  else if (name === "View") await tabs.getByRole("button").nth(4).click();
  else await tab.click();
}
