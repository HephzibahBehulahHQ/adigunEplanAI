import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
const key = "adiguneplanai.projects.v1";
async function create(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "New project", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "New project", exact: true });
  await dialog
    .getByLabel("Project name", { exact: true })
    .fill("Editor reference");
  await dialog.getByRole("button", { name: "Create", exact: true }).click();
  await expect(
    page.getByRole("application", { name: "Sheet 1", exact: true }),
  ).toBeVisible();
}
async function clickWorld(page: Page, x: number, y: number) {
  await page.locator(".engineering-canvas").scrollIntoViewIfNeeded();
  const screen = await page.locator(".engineering-canvas").evaluate(
    (svg, point) => {
      const p = new DOMPoint(point.x, point.y).matrixTransform(
        (svg as SVGSVGElement).getScreenCTM()!,
      );
      return { x: p.x, y: p.y };
    },
    { x, y },
  );
  await page.mouse.click(screen.x, screen.y);
}
async function place(page: Page, kind: string, x: number, y: number) {
  await page
    .getByRole("combobox", { name: "Symbols", exact: true })
    .selectOption(kind);
  await clickWorld(page, x, y);
}
async function project(page: Page) {
  return page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)!).projects[0],
    key,
  );
}
test("symbols create native terminals, connect through real pins and reroute after editing", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await create(page);
  await place(page, "resistor", 50, 50);
  await place(page, "lamp", 120, 80);
  await expect(page.locator("[data-instance]")).toHaveCount(2);
  await page.getByRole("button", { name: "Wire", exact: true }).click();
  await page.getByRole("button", { name: "R1:2", exact: true }).click();
  await page.getByRole("button", { name: "H1:1", exact: true }).click();
  await expect(page.locator("[data-wire]")).toHaveCount(1);
  await page.getByRole("button", { name: "Select", exact: true }).click();
  await clickWorld(page, 50, 50);
  await page.getByRole("application", { name: "Sheet 1", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  let data = await project(page);
  expect(
    data.symbolInstances.find((s: { name: string }) => s.name === "R1").position
      .x,
  ).toBe(55);
  expect(data.wires).toHaveLength(1);
  expect(data.wirePaths[0].points[0].x).toBe(65);
  await page.getByRole("button", { name: "Rotate", exact: true }).click();
  data = await project(page);
  expect(
    data.symbolInstances.find((s: { name: string }) => s.name === "R1")
      .rotation,
  ).toBe(90);
  expect(data.wires).toHaveLength(1);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await page.reload();
  data = await project(page);
  expect(
    data.symbolInstances.find((s: { name: string }) => s.name === "R1")
      .rotation,
  ).toBe(0);
  await expect(page.locator("[data-wire]")).toHaveCount(1);
  expect(errors).toEqual([]);
});
test("property editing, labels, layer locks, sheet sizes and zoom change real state", async ({
  page,
}) => {
  await create(page);
  await place(page, "resistor", 50, 50);
  await page.getByRole("button", { name: "Select", exact: true }).click();
  const props = page.getByRole("form", { name: "Properties", exact: true });
  await props.getByLabel("Reference", { exact: true }).fill("R10");
  await props.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "R10:1", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Net label", exact: true }).click();
  await page.getByRole("button", { name: "R10:1", exact: true }).click();
  await page.getByLabel("Label text", { exact: true }).fill("CONTROL_24V");
  await page.getByRole("button", { name: "Add label", exact: true }).click();
  expect((await project(page)).annotations[0].text).toBe("CONTROL_24V");
  await page.locator(".editor-options summary").click();
  await page.getByRole("checkbox", { name: "Locked", exact: true }).check();
  await place(page, "lamp", 140, 100);
  await expect(page.locator("[data-instance]")).toHaveCount(1);
  await page.getByRole("checkbox", { name: "Locked", exact: true }).uncheck();
  await page
    .getByRole("combobox", { name: "Sheet size", exact: true })
    .selectOption("A4");
  await page.getByRole("button", { name: "Portrait", exact: true }).click();
  const data = await project(page);
  expect(data.pages[0].widthMm).toBe(210);
  expect(data.pages[0].heightMm).toBe(297);
  const canvas = page.locator(".engineering-canvas");
  const before = await canvas.getAttribute("viewBox");
  await page.getByRole("button", { name: "+", exact: true }).click();
  expect(await canvas.getAttribute("viewBox")).not.toBe(before);
  await page.getByRole("button", { name: "Fit page", exact: true }).click();
  await expect(canvas).toHaveAttribute("viewBox", "0 0 210 297");
});
test("native clipboard survives deletion and undo restores the original graph", async ({
  page,
}) => {
  await create(page);
  await place(page, "coil", 80, 70);
  await page.getByRole("button", { name: "Copy", exact: true }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.locator("[data-instance]")).toHaveCount(0);
  await page.getByRole("button", { name: "Paste", exact: true }).click();
  await expect(page.locator("[data-instance]")).toHaveCount(1);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.locator("[data-instance]")).toHaveCount(0);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.locator("[data-instance]")).toHaveCount(1);
});
for (const language of ["en", "de", "yo", "pcm"])
  test(`native editor stays inside mobile viewport in ${language}`, async ({
    page,
  }) => {
    const messages = JSON.parse(
      readFileSync(`packages/localization/${language}.json`, "utf8"),
    );
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
    await page
      .getByRole("button", { name: messages.newProject, exact: true })
      .click();
    const dialog = page.getByRole("dialog", {
      name: messages.newProject,
      exact: true,
    });
    await dialog
      .getByLabel(messages.projectName, { exact: true })
      .fill("Mobile");
    await dialog
      .getByRole("button", { name: messages.create, exact: true })
      .click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });

test("group selection, keyboard transforms, cross-page paste and panning persist real objects", async ({
  page,
}) => {
  await create(page);
  await place(page, "resistor", 80, 80);
  await place(page, "lamp", 140, 130);
  await page.getByRole("button", { name: "Select", exact: true }).click();
  await clickWorld(page, 80, 80);
  await page.keyboard.down("Shift");
  await clickWorld(page, 140, 130);
  await page.keyboard.up("Shift");
  await page.getByRole("button", { name: "Group", exact: true }).click();
  expect((await project(page)).groups).toHaveLength(1);
  await page.getByRole("button", { name: "Copy", exact: true }).click();
  await page
    .getByRole("button", { name: "New drawing page", exact: true })
    .click();
  await page
    .locator(".drawing-tabs")
    .getByRole("button", { name: "Sheet 2", exact: true })
    .click();
  await page.getByRole("button", { name: "Paste", exact: true }).click();
  const data = await project(page);
  expect(data.symbolInstances).toHaveLength(4);
  expect(data.groups).toHaveLength(2);
  expect(
    data.symbolInstances.filter(
      (s: { pageId: string }) => s.pageId === data.pages[1].id,
    ),
  ).toHaveLength(2);
  await page.getByRole("button", { name: "Pan", exact: true }).click();
  const canvas = page.locator(".engineering-canvas");
  await canvas.scrollIntoViewIfNeeded();
  const before = await canvas.getAttribute("viewBox");
  const box = await canvas.boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box!.x + box!.width / 2 + 30,
    box!.y + box!.height / 2 + 20,
  );
  await page.mouse.up();
  expect(await canvas.getAttribute("viewBox")).not.toBe(before);
  await page.getByRole("button", { name: "Fit page", exact: true }).click();
  await expect(canvas).toHaveAttribute("viewBox", "0 0 420 297");
});

test("junction insertion updates the real wire graph and BOM while navigator controls the active drawing", async ({
  page,
}) => {
  await create(page);
  await place(page, "resistor", 50, 50);
  await place(page, "lamp", 150, 50);
  await page.getByRole("button", { name: "Wire", exact: true }).click();
  await page.getByRole("button", { name: "R1:2", exact: true }).click();
  await page.getByRole("button", { name: "H1:1", exact: true }).click();
  await place(page, "junction", 100, 50);
  const data = await project(page);
  expect(data.wires).toHaveLength(2);
  expect(data.devices).toHaveLength(3);
  expect(data.wirePaths).toHaveLength(2);
  const bom = page.getByRole("region", {
    name: "Bill of materials",
    exact: true,
  });
  await expect(bom.locator("tbody tr")).toHaveCount(3);
  await expect(bom).toContainText("J1");
  await page
    .getByRole("button", { name: "New drawing page", exact: true })
    .click();
  await page
    .getByRole("region", { name: "Project navigator", exact: true })
    .getByRole("button", { name: "Sheet 2", exact: true })
    .click();
  await expect(
    page.getByRole("application", { name: "Sheet 2", exact: true }),
  ).toBeVisible();
});

test("desktop engineering workspace stays within the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1672, height: 941 });
  await create(page);
  await place(page, "resistor", 80, 80);
  await expect(
    page.getByRole("form", { name: "Properties", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollHeight <= window.innerHeight,
    ),
  ).toBe(true);
});
