import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { nativeProject } from "../fixtures/native-project.mjs";
import { asciiStl, binaryStl } from "../fixtures/panel-mesh.mjs";

for (const encoding of ["ascii", "binary"] as const) {
  test(`${encoding} mesh import renders actual surfaces and preserves native editing and reload`, async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const p = nativeProject();
    p.enclosures = [
      {
        id: "cabinet",
        name: "Mesh integration test",
        widthMm: 200,
        heightMm: 200,
        depthMm: 100,
      },
    ];
    p.equipment3d = ["a", "b"].map((suffix, index) => ({
      id: `placement-${suffix}`,
      name: `Placement ${suffix}`,
      enclosureId: "cabinet",
      deviceId: `device-${suffix}`,
      positionMm: { x: 10 + index * 80, y: 10, z: 10 },
      sizeMm: { x: 30, y: 30, z: 30 },
      dimensionSource: "manual",
    }));
    await page.goto("/");
    await page.getByLabel("Import project", { exact: true }).setInputFiles({
      name: "mesh-test.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(p)),
    });
    await page
      .getByRole("button", { name: "Panel design", exact: true })
      .click();
    const panel = page.locator(".native-drawing .panel-editor");
    await panel
      .locator("summary")
      .filter({ hasText: /^Cabinet equipment$/ })
      .click();
    await panel
      .getByLabel("Cabinet equipment", { exact: true })
      .selectOption("placement-a");
    const tools = panel.locator(".panel-mesh-tools");
    await tools.locator("summary").click();
    const file = tools.getByLabel("Choose STL file", { exact: true });
    await expect(file).toBeDisabled();
    await tools
      .getByLabel("STL coordinate units", { exact: true })
      .selectOption("cm");
    await tools
      .getByLabel("STL coordinate axes", { exact: true })
      .selectOption("panel");
    await expect(file).toBeEnabled();
    const original = await page.evaluate(() =>
      localStorage.getItem("adiguneplanai.projects.v1"),
    );
    await file.setInputFiles({
      name: "broken.stl",
      mimeType: "model/stl",
      buffer: Buffer.from("solid broken\nendsolid broken"),
    });
    await expect(tools.getByRole("alert")).toBeVisible();
    expect(
      await page.evaluate(() =>
        localStorage.getItem("adiguneplanai.projects.v1"),
      ),
    ).toBe(original);
    const upload = {
      name: `${encoding}-test.stl`,
      mimeType: "model/stl",
      buffer: Buffer.from(encoding === "ascii" ? asciiStl() : binaryStl()),
    };
    await file.setInputFiles(upload);
    await expect(
      tools.getByRole("button", { name: "Apply model to device", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(() =>
        localStorage.getItem("adiguneplanai.projects.v1"),
      ),
    ).toBe(original);
    await tools.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(panel.locator(".panel-mesh-surface")).toHaveCount(0);
    await file.setInputFiles(upload);
    await tools
      .getByLabel("Model name", { exact: true })
      .fill("Original test tetrahedron");
    await tools
      .getByLabel("Source URL or document reference", { exact: true })
      .fill("tests/fixtures/panel-mesh.mjs");
    await tools
      .getByLabel("License or permission reference", { exact: true })
      .fill("Original regression geometry; not a manufacturer part");
    await tools
      .getByRole("button", { name: "Apply model to device", exact: true })
      .click();
    const canvas = panel.locator(".panel-mesh-surface");
    await expect(canvas).toHaveAttribute("data-rendered", "true");
    await expect(canvas).toHaveAttribute("data-triangles", "16");
    await expect(panel.locator(".panel-3d-view")).toHaveCSS(
      "background-image",
      "none",
    );
    await expect(page.locator(".dock-right .panel-3d-view")).toHaveCSS(
      "background-image",
      "none",
    );
    const pixels = await canvas.evaluate((element) => {
      const c = element as HTMLCanvasElement;
      const gl = c.getContext("webgl")!;
      const data = new Uint8Array(c.width * c.height * 4);
      gl.readPixels(0, 0, c.width, c.height, gl.RGBA, gl.UNSIGNED_BYTE, data);
      let opaque = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i] > 0) opaque++;
      return opaque;
    });
    expect(pixels).toBeGreaterThan(100);
    await panel
      .getByLabel("Cabinet equipment", { exact: true })
      .selectOption("placement-b");
    await panel.getByRole("button", { name: "Front", exact: true }).click();
    const view = panel.locator(".panel-3d-view");
    await view.scrollIntoViewIfNeeded();
    const hit = await view.evaluate((element) => {
      const point = new DOMPoint(16, 20).matrixTransform(
        (element as SVGSVGElement).getScreenCTM()!,
      );
      return { x: point.x, y: point.y };
    });
    await page.mouse.click(hit.x, hit.y);
    await expect(
      panel.getByLabel("Cabinet equipment", { exact: true }),
    ).toHaveValue("placement-a");
    const placement = panel.getByRole("form", {
      name: "Save cabinet placement",
      exact: true,
    });
    await expect(
      placement.getByLabel("Width (mm)", { exact: true }),
    ).toHaveValue("20");
    await expect(
      placement.getByLabel("Height (mm)", { exact: true }),
    ).toHaveValue("30");
    await expect(
      placement.getByLabel("Depth (mm)", { exact: true }),
    ).toHaveValue("40");
    await expect(
      placement.getByLabel("Width (mm)", { exact: true }),
    ).not.toBeEditable();
    await panel
      .getByRole("button", { name: "Move right", exact: true })
      .click();
    await panel
      .getByRole("button", { name: "Rotate selected object 90°", exact: true })
      .click();
    const front = panel.locator(
      '.panel-front-view [data-panel-object="placement-a"] rect',
    );
    await expect(front).toHaveAttribute("x", "15");
    await expect(front).toHaveAttribute("width", "30");
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await expect(front).toHaveAttribute("width", "20");
    await page.getByRole("button", { name: "Redo", exact: true }).click();
    const download = page.waitForEvent("download");
    await panel
      .getByRole("button", { name: "Download panel geometry OBJ", exact: true })
      .click();
    const obj = await readFile((await (await download).path())!, "utf8");
    expect(obj).toContain("tests/fixtures/panel-mesh.mjs");
    expect(
      obj.split("\n").filter((line) => line.startsWith("v ")),
    ).toHaveLength(12);
    expect(
      obj.split("\n").filter((line) => line.startsWith("f ")),
    ).toHaveLength(10);
    await page.reload();
    await page
      .getByRole("button", { name: "Panel design", exact: true })
      .click();
    await expect(canvas).toHaveAttribute("data-rendered", "true");
    await expect(front).toHaveAttribute("width", "30");
    await panel
      .locator("summary")
      .filter({ hasText: /^Cabinet equipment$/ })
      .click();
    await panel
      .getByLabel("Cabinet equipment", { exact: true })
      .selectOption("placement-b");
    await tools.locator("summary").click();
    await tools
      .getByLabel("Project model library", { exact: true })
      .selectOption({ label: "Original test tetrahedron" });
    await tools
      .getByRole("button", { name: "Use selected model", exact: true })
      .click();
    await expect(canvas).toHaveAttribute("data-triangles", "8");
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await expect(canvas).toHaveAttribute("data-triangles", "16");
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await expect(canvas).toHaveAttribute("data-rendered", "true");
    await page.screenshot({
      path: test.info().outputPath(`${encoding}-mesh.png`),
      fullPage: true,
    });
    expect(errors).toEqual([]);
  });
}
