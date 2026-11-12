import { expect, type Page } from "@playwright/test";

export async function openProjectNavigator(page: Page) {
  const panel = page.locator('[data-panel="project"]');
  if (!(await panel.isVisible())) {
    await page
      .locator(".workbench-rail-left")
      .getByRole("button")
      .first()
      .click();
  }
  await expect(panel).toBeVisible();
  return panel;
}

export async function openProjectPanel(page: Page) {
  const panel = await openProjectNavigator(page);
  const tab = panel.getByRole("tab", { name: "Project", exact: true });
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
) {
  const panel = page.locator(`[data-panel="${id}"]`);
  if (await panel.isVisible()) return panel;
  const labels = {
    properties: "Properties",
    panel3d: "Panel design",
    diagnostics: "Run electrical check",
    calculations: "Open calculations",
    bom: "Bill of materials",
    reports: "Reports",
  };
  await page
    .locator(".workbench-rail-right")
    .getByRole("button", { name: labels[id], exact: true })
    .click();
  await expect(panel).toBeVisible();
  return panel;
}

export async function openComponentLibrary(page: Page) {
  const panel = page.locator('[data-panel="project"]');
  if (!(await panel.isVisible())) {
    await page
      .locator(".workbench-rail-left")
      .getByRole("button", { name: "Open component library", exact: true })
      .click();
  }
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

export async function selectMenuTab(page: Page, name: string) {
  const trigger = page.getByRole("button", { name: "menu", exact: true });
  if ((await trigger.getAttribute("aria-expanded")) !== "true")
    await trigger.click();
  await page
    .locator(".workbench-command-popover .ribbon-tabs")
    .getByRole("button", { name, exact: true })
    .click();
}

