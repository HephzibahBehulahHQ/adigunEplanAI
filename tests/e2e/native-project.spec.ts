import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
const key = "adiguneplanai.projects.v1";
async function create(page: import("@playwright/test").Page, name: string) {
  await page.getByRole("button", { name: "New project", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "New project", exact: true });
  await dialog.getByLabel("Project name", { exact: true }).fill(name);
  await dialog.getByRole("button", { name: "Create", exact: true }).click();
}
test("create, edit, undo/redo, document language, pages and reload use the native model", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await create(page, "Native project");
  await expect(
    page.getByRole("application", { name: "Sheet 1", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "New drawing page", exact: true })
    .click();
  await expect(
    page
      .locator(".drawing-tabs")
      .getByRole("button", { name: "Sheet 2", exact: true }),
  ).toBeVisible();
  const properties = page.getByRole("region", {
    name: "Properties",
    exact: true,
  });
  await properties
    .getByLabel("Project name", { exact: true })
    .fill("Renamed project");
  await properties.getByRole("button", { name: "Rename", exact: true }).click();
  await expect(page.locator(".project-title")).toHaveText("Renamed project");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.locator(".project-title")).toHaveText("Native project");
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await properties
    .getByLabel("Document Document language", { exact: true })
    .selectOption("de");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("Language", { exact: true }).selectOption("yo");
  await page.reload();
  const data = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)!),
    key,
  );
  expect(data.projects[0].name).toBe("Renamed project");
  expect(data.projects[0].pages).toHaveLength(2);
  expect(data.projects[0].documents[0].outputLanguage).toBe("de");
  expect(errors).toEqual([]);
});
test("native export round trips, invalid import preserves work and replacement requires confirmation", async ({
  page,
}) => {
  await page.goto("/");
  await create(page, "Round trip");
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export project", exact: true })
    .click();
  const download = await downloadPromise;
  const text = await readFile((await download.path())!, "utf8");
  const exported = JSON.parse(text);
  expect(exported.schemaVersion).toBe(5);
  await page.locator("input[type=file]").setInputFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"schemaVersion":99}'),
  });
  await expect(page.getByRole("alert")).toContainText("invalid");
  await expect(page.locator(".project-title")).toHaveText("Round trip");
  page.once("dialog", (d) => d.dismiss());
  await page.locator("input[type=file]").setInputFiles({
    name: "native.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ ...exported, name: "Replacement" })),
  });
  await expect(page.locator(".project-title")).toHaveText("Round trip");
  page.once("dialog", (d) => d.accept());
  await page.locator("input[type=file]").setInputFiles({
    name: "native.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ ...exported, name: "Replacement" })),
  });
  await expect(page.locator(".project-title")).toHaveText("Replacement");
});
test("corrupt local storage stays intact until explicit reset and can be downloaded", async ({
  page,
}) => {
  await page.addInitScript((k) => localStorage.setItem(k, "{broken"), key);
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText("could not be read");
  expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBe(
    "{broken",
  );
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download recovery data", exact: true })
    .click();
  const download = await downloadPromise;
  expect(await readFile((await download.path())!, "utf8")).toBe("{broken");
  page.once("dialog", (d) => d.dismiss());
  await page
    .getByRole("button", { name: "Reset project storage", exact: true })
    .click();
  expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBe(
    "{broken",
  );
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Reset project storage", exact: true })
    .click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await create(page, "Recovered");
  await expect(page.locator(".project-title")).toHaveText("Recovered");
});
test("quota failure leaves the editable native project available for export", async ({
  page,
}) => {
  await page.addInitScript((k) => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === k) throw new DOMException("Quota", "QuotaExceededError");
      original.call(this, key, value);
    };
  }, key);
  await page.goto("/");
  await create(page, "Unsaved project");
  await expect(page.getByRole("alert")).toContainText("Local saving failed");
  await expect(page.locator(".project-title")).toHaveText("Unsaved project");
  expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBeNull();
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export project", exact: true })
    .click();
  const download = await downloadPromise;
  expect(
    JSON.parse(await readFile((await download.path())!, "utf8")).name,
  ).toBe("Unsaved project");
});
