import { test, expect } from "@playwright/test";

// Read-only regression checks (safe against production): no orders, no messages sent.

test("cart drawer: keyboard opens it, moves focus inside, traps Tab, Escape closes and returns focus", async ({ page, isMobile }) => {
  test.skip(isMobile, "desktop navbar cart button");
  await page.goto("/", { waitUntil: "networkidle" });
  const trigger = page.locator('nav button[aria-label="סל קניות"]').first();
  await trigger.focus();
  await page.keyboard.press("Enter");
  const drawer = page.locator('aside[role="dialog"][aria-label="סל קניות"]');
  await expect(drawer).toBeVisible();
  await expect.poll(() => page.evaluate(() => !!document.activeElement?.closest('aside[role="dialog"]'))).toBe(true);
  for (let i = 0; i < 8; i++) await page.keyboard.press("Tab");
  expect(await page.evaluate(() => !!document.activeElement?.closest('aside[role="dialog"]'))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("mobile menu: Escape closes it and returns focus to the toggle", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile menu only");
  await page.goto("/", { waitUntil: "networkidle" });
  const toggle = page.locator('button[aria-controls="mobile-menu"]');
  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();
});

test("contact API rejects invalid input server-side", async ({ request }) => {
  const res = await request.post("/api/contact", { data: { name: "", email: "nope", message: "" } });
  expect(res.status()).toBe(400);
});

test("indexable pages expose canonical + og:image; checkout is noindex", async ({ page }) => {
  await page.goto("/shop", { waitUntil: "domcontentloaded" });
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/shop$/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /^https:\/\//);
  await page.goto("/checkout", { waitUntil: "domcontentloaded" });
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});
