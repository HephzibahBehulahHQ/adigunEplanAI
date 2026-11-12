import { expect, type Page } from "@playwright/test";

/** Persistence tests must explicitly reopen a saved project after a clean boot. */
export async function reloadAndReopenProject(page: Page) {
  const id = await page.locator(".application").getAttribute("data-project-id");
  if (id)
    page.once("dialog", async (dialog) => {
      expect(dialog.type()).toBe("beforeunload");
      await dialog.accept();
    });
  await page.reload();
  if (id) {
    await expect(page.locator(".empty-workspace")).toBeVisible();
    await expect(page.locator(".engineering-canvas")).toHaveCount(0);
    const picker = page.getByTestId("project-picker");
    if (!(await picker.isVisible()))
      await page
        .locator(".workbench-rail-left")
        .getByRole("button")
        .last()
        .click();
    const projectTab = page.getByRole("tab", {
      name: "Project",
      exact: true,
    });
    if (await projectTab.count()) await projectTab.click();
    await picker.selectOption(id);
  }
}
