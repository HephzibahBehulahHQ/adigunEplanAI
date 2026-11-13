import { test, expect } from "@playwright/test";
import fs from "node:fs";
import crypto from "node:crypto";

test("copied interface remains identical to the owner source and its menu overlays the sheet", async ({
  page,
}) => {
  for (const [file, sha] of [
    ["apps/web/index.html", "b642d87654a6bc2a0ed578b1cfd6b7e6d889060f"],
    [
      "apps/web/public/cad-engine.js",
      "01067625647720103f495680d98685d94b048059",
    ],
  ]) {
    const bytes = fs.readFileSync(file);
    expect(
      crypto
        .createHash("sha1")
        .update(`blob ${bytes.length}\0`)
        .update(bytes)
        .digest("hex"),
    ).toBe(sha);
  }
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator(".topbar")).toBeVisible();
  await expect(page.locator(".toolbar")).toBeVisible();
  await expect(page.locator(".drawing")).toBeVisible();
  const before = await page.locator(".drawing").boundingBox();
  await page.locator('[data-module="Electrical"]').click();
  await expect(page.locator("#moduleMenu")).toBeVisible();
  expect(await page.locator(".drawing").boundingBox()).toEqual(before);
  await page.screenshot({
    path: test.info().outputPath("copied-autocad-interface.png"),
  });
  await page.keyboard.press("Escape");
  await expect(page.locator("#moduleMenu")).toBeHidden();
  expect(errors).toEqual([]);
});
