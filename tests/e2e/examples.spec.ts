import { reloadAndReopenProject } from "../fixtures/reopen-project";
import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
const cases = [
  [
    "Industry energy substation · 20 kV / 630 kVA",
    34,
    45,
    ".engineering-canvas",
  ],
  ["Transformer station documentation", 15, 15, ".engineering-canvas"],
  ["Photovoltaic string and inverter interfaces", 9, 8, ".engineering-canvas"],
  ["Motor starter documentation", 7, 11, ".engineering-canvas"],
  ["Residential lighting and sockets", 6, 0, ".building-editor"],
  ["PLC control cabinet", 7, 10, ".automation-editor"],
] as const;
for (const [name, devices, wires, selector] of cases) {
  test(`${name} opens a new native copy, reloads and exports without replacing earlier work`, async ({
    page,
  }, testInfo) => {
    await page.goto("/");
    async function open() {
      await page.getByRole("button", { name: "menu", exact: true }).click();
      await page
        .getByRole("button", { name: "File menu", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Example projects", exact: true })
        .first()
        .click();
      await page
        .getByRole("article")
        .filter({ hasText: name })
        .getByRole("button", { name: "Open a copy", exact: true })
        .click();
    }
    await open();
    await expect(page.locator(selector)).toBeVisible();
    if (name === "Transformer station documentation") {
      await page.setViewportSize({ width: 1857, height: 1000 });
      await page.getByRole("button", { name: "menu", exact: true }).click();
      await page.getByRole("button", { name: "Home", exact: true }).click();
      const diagnostics = page.getByRole("region", {
        name: "Diagnostics",
        exact: true,
      });
      const filters = diagnostics.getByRole("group", {
        name: "Diagnostics",
        exact: true,
      });
      await filters.getByRole("button", { name: /^Warnings \([1-9]/ }).click();
      await expect(
        diagnostics
          .getByRole("button", { name: "Open terminal", exact: true })
          .first(),
      ).toBeVisible();
      await filters
        .getByRole("button", { name: "Errors (0)", exact: true })
        .click();
      await expect(
        diagnostics.getByText("No findings in this category.", { exact: true }),
      ).toBeVisible();
      await filters.getByRole("button", { name: /^All \(/ }).click();
      const footer = page.locator(".status-bar");
      await expect(
        footer.getByText("Saved locally", { exact: true }),
      ).toHaveCount(0);
      await footer
        .getByRole("button", { name: /Diagnostics.*Errors 0.*Warnings [1-9]/ })
        .click();
      await expect(
        diagnostics.locator(".panel-heading button").first(),
      ).toBeFocused();
      const screenshotPath = testInfo.outputPath(
        "native-substation-workbench.png",
      );
      await page.screenshot({ path: screenshotPath });
      await testInfo.attach("native-substation-workbench", {
        path: screenshotPath,
        contentType: "image/png",
      });
    }
    if (name.startsWith("Industry energy substation")) {
      await page.setViewportSize({ width: 1880, height: 970 });
      await page.getByRole("button", { name: "menu", exact: true }).click();
      await page.getByRole("button", { name: "Home", exact: true }).click();
      const overview = page.locator(".engineering-canvas");
      await expect(overview).toContainText("P1");
      await expect(overview).toContainText("X30");
      await expect(overview).toContainText("X31");
      for (const reference of [
        "CT1",
        "CT2",
        "CT3",
        "X30",
        "X31",
        "X32",
        "X33",
        "X34",
        "X35",
      ])
        await expect(overview).toContainText(reference);
      await expect(
        page.getByText(/Drawing notes extend beyond the sheet/),
      ).toHaveCount(0);
      const appHeader = await page.locator(".workbench-header").boundingBox();
      const toolbar = await page.locator(".workbench-toolbar").boundingBox();
      expect(appHeader).not.toBeNull();
      expect(toolbar).not.toBeNull();
      expect(appHeader!.height).toBeLessThanOrEqual(38);
      expect(toolbar!.height).toBe(36);
      expect(toolbar!.y).toBe(appHeader!.y + appHeader!.height);
      await expect(
        page.getByRole("button", {
          name: /PLC1 · WAGO PFC200 controller/,
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", {
          name: /DI1 · WAGO 750-1405/,
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("figure", { name: "Interactive panel 3D view" }),
      ).toBeVisible();
      const structureIds = await page.evaluate(() =>
        JSON.parse(
          localStorage.getItem("adiguneplanai.projects.v1")!,
        ).projects[0].panelStructures.map((structure: { id: string }) =>
          String(structure.id),
        ),
      );
      expect(structureIds.length).toBeGreaterThan(0);
      for (const id of structureIds) {
        await expect(
          page.locator(`.panel-3d-view [data-panel-object="${id}"]`).first(),
        ).toBeVisible();
      }
      const modeledDeviceIds = await page.evaluate(() => {
        const project = JSON.parse(
          localStorage.getItem("adiguneplanai.projects.v1")!,
        ).projects[0];
        return Object.fromEntries(
          ["PLC1", "DI1", "DO1", "X5", "P1"].map((reference) => {
            const device = project.devices.find(
              (item: { reference: string }) => item.reference === reference,
            );
            return [
              reference,
              project.equipment3d.find(
                (placement: { deviceId: string }) =>
                  placement.deviceId === device?.id,
              )?.id,
            ];
          }),
        ) as Record<string, string>;
      });
      for (const [reference, color] of [
        ["PLC1", "#ded6c9"],
        ["DI1", "#ded6c9"],
        ["DO1", "#ded6c9"],
        ["X5", "#8c9291"],
      ]) {
        const placementId = modeledDeviceIds[reference];
        expect(placementId, `${reference} cabinet placement`).toBeTruthy();
        await expect(
          page
            .locator(`.panel-3d-view [data-panel-object="${placementId}"]`)
            .first()
            .locator("polygon"),
        ).toHaveAttribute("fill", color);
      }
      await expect(
        page
          .locator(
            `.panel-3d-view [data-panel-object="${modeledDeviceIds.P1}"] polygon`,
          )
          .first(),
      ).toHaveAttribute("fill", "#94a3b8");
      await expect(
        page.locator(
          `.panel-3d-view [data-panel-object="${modeledDeviceIds.DI1}"] [data-panel-detail="plc-channel"]`,
        ),
      ).toHaveCount(16);
      await expect(
        page.locator(
          `.panel-3d-view [data-panel-object="${modeledDeviceIds.DO1}"] [data-panel-detail="plc-channel"]`,
        ),
      ).toHaveCount(8);
      await expect(
        page.locator(
          `.panel-3d-view [data-panel-object="${modeledDeviceIds.P1}"] [data-panel-detail="catalog-indicator"]`,
        ),
      ).toHaveCount(16);
      await expect(
        page.locator(
          `.panel-3d-view [data-panel-object="${modeledDeviceIds.P1}"] [data-panel-detail="catalog-display"]`,
        ),
      ).toHaveCount(1);
      await expect(
        page.locator('.panel-3d-view [data-panel-detail="cable-duct-slot"]'),
      ).toHaveCount(111);
      await expect(
        page.getByRole("button", { name: "Drawing index (CSV)", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("region", { name: "Calculations", exact: true }),
      ).toContainText("20 kV transformer primary current estimate");
      await expect(page.locator(".calculation-command-row select")).toHaveValue(
        "apparent-load-current",
      );
      await expect(
        page.locator(
          '.calculation-dock-summary [data-calculation-value="current"]',
        ),
      ).toHaveText("18.19");
      await expect(
        page.locator("#native-calculation-form .calculation-input"),
      ).toHaveCount(3);
      await expect(
        page.locator("#native-calculation-form .calculation-input").last(),
      ).toBeInViewport({ ratio: 0.8 });
      await expect(
        page.getByRole("button", { name: "Load", exact: true }),
      ).toHaveAttribute("aria-pressed", "true");
      await expect(
        page.getByRole("region", { name: "Bill of materials" }),
      ).toContainText("750-8217");
      await expect(
        page.getByRole("region", { name: "Bill of materials" }),
      ).toContainText("750-1405");
      await expect(
        page.getByRole("region", { name: "Bill of materials" }),
      ).toContainText("750-530");
      await expect(
        page.getByRole("region", { name: "Bill of materials" }),
      ).toContainText("P1J122728");
      const screenshotPath = testInfo.outputPath(
        "target-substation-workbench.png",
      );
      await page.screenshot({ path: screenshotPath });
      await testInfo.attach("target-substation-workbench", {
        path: screenshotPath,
        contentType: "image/png",
      });
    }
    const first = await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("adiguneplanai.projects.v1")!)
          .projects[0],
    );
    expect(first.devices).toHaveLength(devices);
    expect(first.wires).toHaveLength(wires);
    await open();
    const before = await page.evaluate(() =>
      localStorage.getItem("adiguneplanai.projects.v1"),
    );
    const library = JSON.parse(before!);
    expect(library.projects).toHaveLength(2);
    expect(library.projects[0]).toEqual(first);
    expect(library.projects[1].id).not.toBe(first.id);
    await reloadAndReopenProject(page);
    expect(
      await page.evaluate(() =>
        localStorage.getItem("adiguneplanai.projects.v1"),
      ),
    ).toBe(before);
    const download = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Export project", exact: true })
      .click();
    const exported = JSON.parse(
      await readFile((await (await download).path())!, "utf8"),
    );
    expect(exported).toEqual(library.projects[1]);
    await expect(page.getByRole("alert")).toHaveCount(0);
  });
}

test("project navigator tabs expose the real library, examples and search", async ({
  page,
}) => {
  await page.goto("/");
  const tabs = page.getByRole("tablist", { name: "Project navigator" });
  await expect(tabs.getByRole("tab", { name: "Examples (6)" })).toBeVisible();
  await tabs.getByRole("tab", { name: "Examples (6)" }).click();
  await expect(page.getByRole("article")).toHaveCount(6);
  await page
    .getByRole("article")
    .filter({ hasText: "Photovoltaic string and inverter interfaces" })
    .getByRole("button", { name: "Open a copy", exact: true })
    .click();
  await tabs.getByRole("tab", { name: "Search" }).click();
  await page
    .getByRole("searchbox", { name: "Filter project tree" })
    .fill("INV1");
  await expect(page.getByText(/INV1 ·/)).toBeVisible();
  await tabs.getByRole("tab", { name: "Library" }).click();
  await expect(page.locator(".component-library[open]")).toBeVisible();
});
