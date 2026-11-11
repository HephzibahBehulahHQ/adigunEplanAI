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
    await page.getByTestId("project-picker").selectOption(id);
  }
}
