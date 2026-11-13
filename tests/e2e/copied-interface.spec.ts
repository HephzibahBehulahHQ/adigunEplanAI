import { test, expect } from "@playwright/test";
import fs from "node:fs";
import crypto from "node:crypto";

test("approved interface branding and menu overlay remain intact", async ({
  page,
}) => {
  const source = fs.readFileSync("apps/web/index.html", "utf8");
  expect(
    crypto
      .createHash("sha256")
      .update(source.match(/<style>[\s\S]*?<\/style>/g)!.join(""))
      .digest("hex"),
  ).toBe("e74748cfcb584a2be56e86f0aa52d959947718daf9ed4caaf773191ebfd96b29");
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page).toHaveTitle("AdigunEplanAI — Electrical CAD Workspace");
  await expect(page.locator(".brandname")).toHaveText("AdigunEplanAI");
  const logo = page.getByRole("img", { name: "HB Elektroniker" });
  await expect(logo).toBeVisible();
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

test("existing Electrical Symbol Library places and saves original Eplan symbols", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.locator('[data-module="Electrical"]').click();
  await page
    .getByRole("menuitem", { name: "Symbol Library", exact: true })
    .click();
  await expect(page.locator('#symbolList [data-insert^="eplan-"]')).toHaveCount(
    83,
  );
  await page.locator("#symbolSearch").fill("eplan-resistor");
  await expect(page.locator("#symbolList .symbol-row")).toHaveCount(1);
  await page.locator('[data-insert="eplan-resistor"]').click();
  await page.locator("#drawing").click({ position: { x: 350, y: 220 } });
  const placed = page.locator("#userDrawings .drawing-object").filter({
    has: page.locator("title", {
      hasText: "Original Eplan electrical symbol",
    }),
  });
  await expect(placed).toHaveCount(1);
  await expect(placed.locator("rect")).toHaveCount(1);
  await expect(placed.locator("circle")).toHaveCount(2);
  const downloadEvent = page.waitForEvent("download");
  await page.locator('[data-action="save"]').first().click();
  const download = await downloadEvent;
  const saved = test.info().outputPath("original-symbol.adigun.json");
  await download.saveAs(saved);
  await page.reload();
  await page.locator("#openFile").setInputFiles(saved);
  await expect(placed).toHaveCount(1);
  await expect(placed.locator("title")).toContainText(
    "manufacturer part not assigned",
  );
  expect(errors).toEqual([]);
});
