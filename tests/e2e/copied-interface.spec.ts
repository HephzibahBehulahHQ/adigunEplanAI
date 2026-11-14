import { test, expect } from "@playwright/test";
import fs from "node:fs";
import crypto from "node:crypto";
import type { Page } from "@playwright/test";

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

async function sheetPoint(page: Page, x: number, y: number) {
  return page.locator("#drawing").evaluate(
    (element, point) => {
      const svg = element as SVGSVGElement;
      const converted = new DOMPoint(point.x, point.y).matrixTransform(
        svg.getScreenCTM()!,
      );
      return { x: converted.x, y: converted.y };
    },
    { x, y },
  );
}

async function saveDrawing(page: Page, name: string) {
  const event = page.waitForEvent("download", { timeout: 5000 });
  await page
    .getByRole("button", { name: "Save project locally", exact: true })
    .click();
  const download = await event;
  const path = test.info().outputPath(name + ".adigun.json");
  await download.saveAs(path);
  return { path, data: JSON.parse(fs.readFileSync(path, "utf8")) };
}

test("new project wires attach to terminals, follow edits, undo and reopen", async ({
  page,
}) => {
  page.setDefaultTimeout(5000);
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.locator('[data-action="new"]').first().click();
  await page.locator("#newProjectName").fill("Bench circuit");
  await page.locator("#createProject").click();
  await page.locator('[data-module="Electrical"]').click();
  await page.getByRole("menuitem", { name: /Symbol Library$/ }).click();
  for (const [id, x] of [
    ["terminal", 200],
    ["resistor", 350],
  ] as const) {
    await page.locator("#symbolSearch").fill("eplan-" + id);
    await page.locator(`[data-insert="eplan-${id}"]`).click();
    const point = await sheetPoint(page, x, 300);
    await page.mouse.click(point.x, point.y);
  }
  await page.locator('[data-draw="wire"]').click();
  const start = await sheetPoint(page, 200, 300),
    end = await sheetPoint(page, 340, 300);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y);
  await page.mouse.up();
  const initial = await saveDrawing(page, "before-move");
  expect(initial.data.project).toBe("Bench circuit");
  const initialWire = initial.data.objects.find(
    (o: { kind: string }) => o.kind === "wire",
  );
  expect(initialWire.attachments.start.pinId).toBe("1");
  expect(initialWire.attachments.end.pinId).toBe("1");
  await page.locator('[data-draw="select"]').click();
  await page.locator('[data-inspector="Properties"]').click();
  await page
    .locator("#userDrawings .drawing-object")
    .filter({ has: page.locator("title", { hasText: "R1 · Resistor" }) })
    .locator(".component-hit-target")
    .click();
  await page.locator('[data-object-coordinate="x"]').fill("450");
  await page.locator('[data-object-coordinate="x"]').press("Tab");
  const moved = await saveDrawing(page, "moved");
  expect(
    moved.data.objects.find((o: { kind: string }) => o.kind === "wire").x2,
  ).toBe(440);
  await page.locator('[data-action="undo"]').first().click();
  const undone = await saveDrawing(page, "undone");
  expect(
    undone.data.objects.find((o: { kind: string }) => o.kind === "wire").x2,
  ).toBe(340);
  await page.locator('[data-action="redo"]').first().click();
  await page.locator('[data-component-property="ref"]').fill("R7");
  await page.locator('[data-component-property="ref"]').press("Tab");
  const saved = await saveDrawing(page, "final-circuit");
  await page.reload();
  await page.locator("#openFile").setInputFiles(saved.path);
  await expect(
    page.locator("#userDrawings title").filter({ hasText: "R7 · Resistor" }),
  ).toHaveCount(1);
  const reopened = await saveDrawing(page, "reopened");
  expect(reopened.data.objects).toEqual(saved.data.objects);
  expect(reopened.data.project).toBe("Bench circuit");
  expect(errors).toEqual([]);
});

test("existing New Project dialog opens both connected editable examples", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  for (const id of ["indicator", "relay"]) {
    await page.locator('[data-action="new"]').first().click();
    await page.locator("#newProjectName").fill(id + " workshop");
    await page.locator("#projectTemplate").selectOption(id);
    await page.locator("#createProject").click();
    await expect(page.locator("#userDrawings .drawing-object")).toHaveCount(9);
    const saved = await saveDrawing(page, id);
    expect(saved.data.project).toBe(id + " workshop");
    expect(
      saved.data.objects.filter((o: { kind: string }) => o.kind === "wire"),
    ).toHaveLength(4);
    await page.locator('[data-inspector="Electrical checks"]').click();
    await expect(page.locator("#inspectorContent")).toContainText(
      "No wire geometry issues found",
    );
    await page.locator("#closeRightPanel").click();
  }
  expect(errors).toEqual([]);
});

test("manufacturer projects open, expose editable parts and preserve connections on reopen", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  for (const [id, count, wireCount] of [
    ["hardware-relay", 15, 6],
    ["hardware-sensor", 9, 3],
    ["hardware-sitop", 7, 2],
  ] as const) {
    await page.locator('[data-action="new"]').first().click();
    await page.locator("#newProjectName").fill(id + " bench");
    await page.locator("#projectTemplate").selectOption(id);
    await page.locator("#createProject").click();
    await expect(page.locator("#userDrawings .drawing-object")).toHaveCount(
      count,
    );
    await page.locator('[data-inspector="Properties"]').click();
    await page.locator("#userDrawings .drawing-object").first().click();
    await expect(page.locator("#inspectorContent")).toContainText(
      /UK 5 N|UT 2,5|SITOP PSU100C/,
    );
    await page.locator('[data-component-property="ref"]').fill("TEST1");
    await page.locator('[data-component-property="ref"]').press("Tab");
    const saved = await saveDrawing(page, id);
    expect(
      saved.data.objects.filter((o: { kind: string }) => o.kind === "wire"),
    ).toHaveLength(wireCount);
    expect(
      saved.data.objects.some((o: { ref?: string }) => o.ref === "TEST1"),
    ).toBe(true);
    await page.reload();
    await page.locator("#openFile").setInputFiles(saved.path);
    const reopened = await saveDrawing(page, id + "-restored");
    expect(reopened.data.objects).toEqual(saved.data.objects);
    await page.locator('[data-inspector="Electrical checks"]').click();
    await expect(page.locator("#inspectorContent")).toContainText(
      "No wire geometry issues found",
    );
    await page.locator("#closeRightPanel").click();
  }
  expect(errors).toEqual([]);
});

test("existing Electrical Symbol Library places and saves original Eplan symbols", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.locator('[data-action="new"]').first().click();
  await page.locator("#newProjectName").fill("Eplan symbol regression");
  await page.locator("#createProject").click();
  await page.locator('[data-module="Electrical"]').click();
  await page.getByRole("menuitem", { name: /Symbol Library$/ }).click();
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
  await expect(placed.locator("rect:not(.component-hit-target)")).toHaveCount(
    1,
  );
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
