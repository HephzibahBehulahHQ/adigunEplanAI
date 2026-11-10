import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { nativeProject } from "../fixtures/native-project.mjs";
import DxfParser from "dxf-parser";

test("native SVG, actual PNG, CSV and print PDF agree with the stored project", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByLabel("Import project", { exact: true }).setInputFiles({
    name: "report-reference.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(nativeProject())),
  });
  await expect(page.locator(".project-title")).toHaveText(
    "Native model reference",
  );
  const tools = page.getByRole("region", { name: "Report tools", exact: true });
  await expect(tools).toBeVisible();
  const before = await page.evaluate(() =>
    localStorage.getItem("adiguneplanai.projects.v1"),
  );
  const terminalDownload = page.waitForEvent("download");
  await tools
    .getByRole("button", { name: "Terminal schedule (CSV)", exact: true })
    .click();
  const terminalFile = await terminalDownload;
  expect(terminalFile.suggestedFilename()).toBe("terminals.csv");
  expect(await readFile((await terminalFile.path())!, "utf8")).toContain(
    '"Xa"',
  );
  await expect(tools.getByLabel("Report type")).toHaveValue("drawing");
  const svgDownload = page.waitForEvent("download");
  await tools
    .getByRole("button", { name: "Download drawing SVG", exact: true })
    .click();
  const svg = await readFile((await (await svgDownload).path())!, "utf8");
  expect(svg).toContain('width="420mm" height="297mm"');
  expect(svg).toContain('data-wire-id="wire"');
  const parsed = await page.evaluate((text) => {
    const doc = new DOMParser().parseFromString(text, "image/svg+xml");
    return {
      errors: doc.querySelectorAll("parsererror").length,
      devices: doc.querySelectorAll("[data-device-id]").length,
    };
  }, svg);
  expect(parsed).toEqual({ errors: 0, devices: 2 });
  const dxfDownload = page.waitForEvent("download");
  await tools
    .getByRole("button", { name: "Download drawing DXF", exact: true })
    .click();
  const dxf = new DxfParser().parseSync(
    await readFile((await (await dxfDownload).path())!, "utf8"),
  )!;
  expect(dxf.header.$INSUNITS).toBe(4);
  const dxfWire = dxf.entities.find(
    (entity) => entity.type === "LWPOLYLINE",
  ) as { vertices: { x: number; y: number }[] } | undefined;
  expect(dxfWire?.vertices.map(({ x, y }) => [x, y])).toEqual([
    [10, -20],
    [50, -20],
  ]);
  const pngDownload = page.waitForEvent("download");
  await tools.getByRole("button", { name: /^Download drawing PNG/ }).click();
  const png = await readFile((await (await pngDownload).path())!);
  expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  expect(png.readUInt32BE(16)).toBe(2481);
  expect(png.readUInt32BE(20)).toBe(1754);
  // Suppress the native print dialog while Playwright renders the same document.
  await page.evaluate(() => {
    const open = window.open.bind(window);
    window.open = (...args) => {
      const popup = open(...args);
      if (popup) popup.print = () => {};
      return popup;
    };
  });
  const calculationPopup = page.waitForEvent("popup");
  await tools
    .getByRole("button", { name: "Calculation inputs (PDF)", exact: true })
    .click();
  const calculation = await calculationPopup;
  await expect(calculation.locator("table")).toBeVisible();
  await calculation.close();
  await expect(tools.getByLabel("Report type")).toHaveValue("drawing");
  const popupEvent = page.waitForEvent("popup");
  await tools
    .getByRole("button", { name: "Print / save PDF", exact: true })
    .click();
  const popup = await popupEvent;
  await expect(popup.locator("svg")).toBeVisible();
  const pdf = await popup.pdf({ preferCSSPageSize: true });
  expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
  const media = pdf
    .toString("latin1")
    .match(/\/MediaBox\s*\[0 0 ([\d.]+) ([\d.]+)\]/);
  expect(media).not.toBeNull();
  expect(Math.abs(Number(media![1]) - (420 * 72) / 25.4)).toBeLessThan(1);
  expect(Math.abs(Number(media![2]) - (297 * 72) / 25.4)).toBeLessThan(1);
  await popup.close();
  await tools
    .getByLabel("Report type", { exact: true })
    .selectOption("connections");
  await expect(
    tools.getByRole("table", { name: "Connection list", exact: true }),
  ).toContainText("Xa:1");
  const csvDownload = page.waitForEvent("download");
  await tools
    .getByRole("button", { name: "Download report CSV", exact: true })
    .click();
  const csv = await readFile((await (await csvDownload).path())!, "utf8");
  expect(csv).toContain('"W1","Xa:1","Xb:1",""');
  const deMessages = JSON.parse(
    await readFile(
      new URL("../../packages/localization/de.json", import.meta.url),
      "utf8",
    ),
  );
  const enMessages = JSON.parse(
    await readFile(
      new URL("../../packages/localization/en.json", import.meta.url),
      "utf8",
    ),
  );
  expect(csv).toContain(deMessages.reportFrom);
  expect(csv).not.toContain(`"${enMessages.reportFrom}"`);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(
    await page.evaluate(() =>
      localStorage.getItem("adiguneplanai.projects.v1"),
    ),
  ).toBe(before);
  expect(errors).toEqual([]);
});
