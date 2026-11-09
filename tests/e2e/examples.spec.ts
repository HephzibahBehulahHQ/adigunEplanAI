import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
const cases = [
  ["Transformer station documentation", 15, 15, ".engineering-canvas"],
  ["Photovoltaic string and inverter interfaces", 9, 8, ".engineering-canvas"],
  ["Motor starter documentation", 7, 11, ".engineering-canvas"],
  ["Residential lighting and sockets", 6, 0, ".building-editor"],
  ["PLC control cabinet", 7, 10, ".automation-editor"],
] as const;
for (const [name, devices, wires, selector] of cases) {
  test(`${name} opens a new native copy, reloads and exports without replacing earlier work`, async ({
    page,
  }) => {
    await page.goto("/");
    async function open() {
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
    await page.reload();
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
