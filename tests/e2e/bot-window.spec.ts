import { test, expect } from "@playwright/test";
const key = "adiguneplanai.bot.window.v1.guest";
async function loadExample(
  page: import("@playwright/test").Page,
  name = "Transformer station documentation",
) {
  await page.getByRole("button", { name: "Home", exact: true }).click();
  await page
    .getByRole("button", { name: "Example projects", exact: true })
    .first()
    .click();
  await page
    .getByRole("article")
    .filter({ hasText: name })
    .getByRole("button", { name: "Open a copy" })
    .click();
}

test("BOT moves, resizes, minimizes, maximizes, closes and restores without blocking the canvas", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1672, height: 941 });
  await page.goto("/");
  await loadExample(page);
  const before = await page.evaluate(() =>
    localStorage.getItem("adiguneplanai.projects.v1"),
  );
  await page
    .getByRole("button", { name: "Open Adigun BOT", exact: true })
    .click();
  const bot = page.getByRole("complementary", {
    name: "Adigun BOT",
    exact: true,
  });
  await expect(bot).toBeVisible();
  await expect(bot).toContainText("Hosted AI is not configured");
  const title = page.getByRole("button", {
    name: "Move Adigun BOT",
    exact: true,
  });
  const box = (await bot.boundingBox())!;
  await title.focus();
  await title.press("ArrowLeft");
  await expect.poll(async () => (await bot.boundingBox())!.x).toBe(box.x - 10);
  const titleBox = (await title.boundingBox())!;
  await page.mouse.move(titleBox.x + 10, titleBox.y + 10);
  await page.mouse.down();
  await page.mouse.move(titleBox.x - 90, titleBox.y + 20, { steps: 5 });
  await page.mouse.up();
  await expect.poll(async () => (await bot.boundingBox())!.x).toBe(box.x - 110);
  const size = page.getByRole("button", {
    name: "Resize Adigun BOT",
    exact: true,
  });
  await size.focus();
  await size.press("ArrowRight");
  const sized = (await bot.boundingBox())!;
  expect(sized.width).toBe(box.width + 10);
  await page.reload();
  await expect(bot).toBeVisible();
  expect((await bot.boundingBox())!.x).toBe(sized.x);
  expect((await bot.boundingBox())!.width).toBe(sized.width);
  await page
    .getByRole("button", { name: "Minimize Adigun BOT", exact: true })
    .click();
  await expect(bot).toHaveClass(/bot-minimized/);
  const symbol = page.locator("[data-instance]").first();
  await symbol.focus();
  await symbol.press("Enter");
  await expect(symbol).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "Restore Adigun BOT", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Maximize Adigun BOT", exact: true })
    .click();
  expect((await bot.boundingBox())!.width).toBe(900);
  await page
    .getByRole("button", { name: "Restore Adigun BOT", exact: true })
    .click();
  expect((await bot.boundingBox())!.width).toBe(sized.width);
  await page
    .getByLabel("Ask about this project", { exact: true })
    .press("Escape");
  await expect(bot).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Open Adigun BOT", exact: true }),
  ).toBeFocused();
  await page.reload();
  await expect(bot).toHaveCount(0);
  await page
    .getByRole("button", { name: "AI tools menu", exact: true })
    .click();
  await expect(bot).toBeVisible();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("adiguneplanai.projects.v1"),
    ),
  ).toBe(before);
});

test("BOT answers from current native context, marks old snapshots and clears obsolete project conversation", async ({
  page,
}) => {
  await page.goto("/");
  await loadExample(page);
  await page
    .getByRole("button", { name: "Open Adigun BOT", exact: true })
    .click();
  const bot = page.getByRole("complementary", {
    name: "Adigun BOT",
    exact: true,
  });
  await bot
    .getByRole("button", { name: "Inspect project data", exact: true })
    .click();
  await expect(bot.locator("dd").nth(0)).toHaveText("2");
  await expect(bot.locator("dd").nth(1)).toHaveText("15");
  await page.locator("[data-instance]").first().focus();
  await page.locator("[data-instance]").first().press("Enter");
  await bot
    .getByRole("button", { name: "Inspect selection", exact: true })
    .click();
  await expect(bot.locator(".bot-tool-result").last()).toContainText("X1");
  await bot
    .getByLabel("Ask about this project", { exact: true })
    .fill("execute arbitrary JavaScript");
  await bot.getByRole("button", { name: "Run", exact: true }).click();
  await expect(bot.locator("article").last()).toContainText(
    "Available commands",
  );
  await page
    .locator('[data-panel="properties"]')
    .getByLabel("Project name", { exact: true })
    .fill("Updated substation");
  await page.getByRole("button", { name: "Rename", exact: true }).click();
  await expect(bot).toContainText("Earlier project revision");
  await expect(
    bot.getByLabel("Current project context", { exact: true }),
  ).toContainText("Updated substation");
  await loadExample(page, "Motor starter documentation");
  await expect(bot.locator("article")).toHaveCount(0);
  await expect(bot).not.toContainText("Updated substation");
});

test("live native finding creates a badge without opening the BOT or writing engineering data", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  await loadExample(page);
  const before = await page.evaluate(() =>
    localStorage.getItem("adiguneplanai.projects.v1"),
  );
  await page.clock.fastForward(26000);
  await expect(page.getByLabel("New finding", { exact: true })).toHaveCount(1);
  await expect(
    page.getByRole("complementary", { name: "Adigun BOT", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Open Adigun BOT", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "New finding", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Dismiss finding", exact: true })
    .click();
  await page.clock.fastForward(60000);
  await expect(
    page.getByRole("region", { name: "New finding", exact: true }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      localStorage.getItem("adiguneplanai.projects.v1"),
    ),
  ).toBe(before);
});

for (const language of ["en", "de", "yo", "pcm"]) {
  test(`mobile ${language} BOT remains inside the viewport with a keyboard-accessible close`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(
      ({ key, language }) => {
        localStorage.setItem(
          "adiguneplanai.interface.v1",
          JSON.stringify({ language }),
        );
        localStorage.setItem(
          key,
          JSON.stringify({
            open: true,
            x: 1500,
            y: 1200,
            width: 900,
            height: 800,
          }),
        );
      },
      { key, language },
    );
    await page.goto("/");
    const bot = page.getByRole("complementary", {
      name: "Adigun BOT",
      exact: true,
    });
    await expect(bot).toBeVisible();
    const bounds = (await bot.boundingBox())!;
    expect(bounds.x).toBe(8);
    expect(bounds.y).toBe(8);
    expect(bounds.width).toBe(374);
    expect(bounds.height).toBe(828);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await bot.locator("input:not([type=checkbox])").press("Escape");
    await expect(bot).toHaveCount(0);
  });
}

test("live findings wait for pointer editing to finish and preference quota failures leave native work usable", async ({
  page,
}) => {
  await page.clock.install();
  await page.addInitScript(() => {
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith("adiguneplanai.bot.window."))
        throw new DOMException("Storage quota", "QuotaExceededError");
      return setItem.call(this, key, value);
    };
  });
  await page.goto("/");
  await loadExample(page);
  await page.mouse.move(350, 300);
  await page.mouse.down();
  await page.clock.fastForward(30000);
  await expect(page.getByLabel("New finding", { exact: true })).toHaveCount(0);
  await page.mouse.up();
  await page.clock.fastForward(3000);
  await expect(page.getByLabel("New finding", { exact: true })).toHaveCount(1);
  await page
    .getByRole("button", { name: "Open Adigun BOT", exact: true })
    .click();
  const bot = page.getByRole("complementary", {
    name: "Adigun BOT",
    exact: true,
  });
  await expect(bot).toContainText("Window preferences could not be saved");
  await bot
    .getByRole("checkbox", { name: "Live connection findings", exact: true })
    .uncheck();
  await expect(
    bot.getByRole("region", { name: "New finding", exact: true }),
  ).toHaveCount(0);
  await bot
    .getByRole("button", { name: "Inspect project data", exact: true })
    .click();
  await expect(bot.locator("dd").nth(1)).toHaveText("15");
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("adiguneplanai.projects.v1")!),
  );
  expect(stored.projects[0].devices).toHaveLength(15);
});
