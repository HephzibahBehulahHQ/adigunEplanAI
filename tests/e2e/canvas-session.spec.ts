import { expect, test } from "@playwright/test";
import { nativeProject } from "../fixtures/native-project.mjs";

test("refresh and a new tab start blank; saved projects reopen explicitly with clean history", async ({
  page,
  context,
}) => {
  const project = nativeProject();
  await page.goto("/");
  await page.getByLabel("Import project", { exact: true }).setInputFiles({
    name: "session.adeplan",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(project)),
  });
  await page
    .getByRole("button", { name: "New drawing page", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Undo · Header", exact: true }),
  ).toBeEnabled();
  await page.reload();
  await expect(page.locator(".empty-workspace")).toBeVisible();
  await expect(page.locator(".engineering-canvas")).toHaveCount(0);
  await expect(page.locator(".application")).toHaveAttribute(
    "data-project-id",
    "",
  );
  await expect(
    page.getByRole("button", { name: "Undo · Header", exact: true }),
  ).toBeDisabled();
  await page.getByTestId("project-picker").selectOption(project.id);
  await expect(page.locator(".engineering-canvas")).toBeVisible();
  await expect(
    page.locator('[data-instance][aria-pressed="true"]'),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Undo · Header", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Sheet 2", exact: true }),
  ).toBeVisible();
  const next = await context.newPage();
  await next.goto("/");
  await expect(next.locator(".empty-workspace")).toBeVisible();
  await next.getByTestId("project-picker").selectOption(project.id);
  await expect(next.locator("[data-instance]")).toHaveCount(2);
  await next.close();
});

test("close and create-new reset the canvas while keeping saved projects", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Import project", { exact: true }).setInputFiles({
    name: "session.adeplan",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(nativeProject())),
  });
  await page
    .getByRole("button", { name: "Close project", exact: true })
    .click();
  await expect(page.locator(".empty-workspace")).toBeVisible();
  await page.getByRole("button", { name: "New project", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "New project", exact: true });
  await dialog
    .getByLabel("Project name", { exact: true })
    .fill("Fresh empty drawing");
  await dialog.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.locator("[data-instance]")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Undo · Header", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByTestId("project-picker").locator("option"),
  ).toHaveCount(2);
  await page.reload();
  await expect(page.locator(".empty-workspace")).toBeVisible();
});

test("failed autosave guards leaving; cancellation preserves work and successful saving removes the guard", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Import project", { exact: true }).setInputFiles({
    name: "session.adeplan",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(nativeProject())),
  });
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Object.defineProperty(window, "restoreSessionStorageWriter", {
      value: () => {
        Storage.prototype.setItem = original;
      },
      configurable: true,
    });
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith("adiguneplanai.projects."))
        throw new DOMException("Test storage quota", "QuotaExceededError");
      return original.call(this, key, value);
    };
  });
  await page
    .getByRole("button", { name: "New drawing page", exact: true })
    .click();
  await expect(page.locator(".project-save-state")).toHaveText("Not saved");
  const prevented = () =>
    page.evaluate(() => {
      const event = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    });
  expect(await prevented()).toBe(true);
  page.once("dialog", (dialog) => dialog.dismiss());
  await page
    .getByRole("button", { name: "Close project", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Sheet 2", exact: true }),
  ).toBeVisible();
  await page.evaluate(() =>
    (
      window as unknown as { restoreSessionStorageWriter: () => void }
    ).restoreSessionStorageWriter(),
  );
  await page.getByRole("button", { name: "Save locally", exact: true }).click();
  await expect(page.locator(".project-save-state")).toHaveText("Saved locally");
  expect(await prevented()).toBe(false);
});
