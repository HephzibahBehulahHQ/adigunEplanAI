import { expect, type Page } from "@playwright/test";

export async function clickWirePin(page: Page, label: string) {
  const pin = page.getByRole("button", { name: label, exact: true });
  const aperture = pin.locator(".pin-aperture");
  await aperture.scrollIntoViewIfNeeded();
  const { x, y, width, height } = (await aperture.boundingBox())!;
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  await page.mouse.move(centerX, centerY);
  await expect(pin).toHaveAttribute("data-snap-pin", "true");
  await page.mouse.click(centerX, centerY);
  return pin.getAttribute("data-pin");
}
