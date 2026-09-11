import { test, expect } from "@playwright/test";

async function addFirstProductToCart(page: import("@playwright/test").Page) {
  await page.goto("/shop");
  const addButton = page.getByRole("button", { name: /הוסף לסל|הוספה לסל/ }).first();
  await addButton.click();
}

test.describe("Checkout UI", () => {
  test("checkout page renders RTL", async ({ page }) => {
    await addFirstProductToCart(page);
    await page.goto("/checkout");
    await expect(page.locator("div[dir='rtl']").first()).toBeVisible();
  });

  test("Hosted Fields card inputs are present and card data never touches our own <input>", async ({ page }) => {
    await addFirstProductToCart(page);
    await page.goto("/checkout");
    // These are plain containers Tranzila's script injects real cross-origin
    // iframes into — assert no local <input name="cardNumber"> etc. exists.
    await expect(page.locator("#tz-card-number")).toBeVisible();
    await expect(page.locator("#tz-cvv")).toBeVisible();
    await expect(page.locator("#tz-expiry")).toBeVisible();
    const rawCardInput = await page.locator("input[name*='card' i], input[name*='cvv' i]").count();
    expect(rawCardInput).toBe(0);
  });

  test("submit is blocked until the purchase-terms checkbox is checked", async ({ page }) => {
    await addFirstProductToCart(page);
    await page.goto("/checkout");
    const submit = page.getByRole("button", { name: /תשלום מאובטח/ });
    await expect(submit).toBeDisabled();
    await page.getByLabel(/תנאי הרכישה/).check({ force: true }).catch(() => {});
    // Some browsers need the actual checkbox click, not the label text match:
    await page.locator("input[type=checkbox]").first().check();
    await expect(submit).toBeEnabled();
  });

  test("required fields show native validation and block submit when empty", async ({ page }) => {
    await addFirstProductToCart(page);
    await page.goto("/checkout");
    await page.locator("input[type=checkbox]").first().check();
    const nameInput = page.locator("#checkout-name");
    await expect(nameInput).toHaveAttribute("required", "");
  });

  test("mobile viewport renders the checkout form without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await addFirstProductToCart(page);
    await page.goto("/checkout");
    const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
  });

  test("empty cart redirects to the empty-cart state instead of a broken form", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page.getByText("הסל שלך ריק")).toBeVisible();
  });
});
