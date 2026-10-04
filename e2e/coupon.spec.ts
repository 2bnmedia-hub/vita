import { test, expect } from "@playwright/test";

/**
 * Coupon checks that are safe against production: they only read coupon
 * availability and render the checkout summary. Nothing here creates an
 * order, reserves the coupon or submits a charge.
 */

test.describe("coupon — availability API", () => {
  test("unknown code is rejected with a clear message", async ({ request }) => {
    const res = await request.post("/api/checkout/coupon", { data: { code: "no-such-code-123" } });
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.status).toBe("invalid");
    expect(body.message).toContain("אינו תקין");
  });

  test("Nimry15 is accepted regardless of letter case", async ({ request }) => {
    for (const code of ["Nimry15", "NIMRY15", "nimry15", " nImRy15 "]) {
      const body = await (await request.post("/api/checkout/coupon", { data: { code } })).json();
      expect(body.ok, code).toBe(true);
      expect(body.percent).toBe(15);
    }
  });
});

test("coupon — checkout shows the discount and the reduced total before payment", async ({ page }) => {
  await page.goto("/shop");
  await page.getByRole("button", { name: /הוסף לסל|הוספה לסל/ }).first().click();
  await page.goto("/checkout");

  const money = async (testId: string) =>
    Number((await page.getByTestId(testId).textContent())!.replace(/[^\d.]/g, ""));
  const before = await money("grand-total");

  await page.locator("#checkout-coupon").fill("NiMrY15");
  await page.getByRole("button", { name: "החל" }).click();
  await expect(page.getByText("הקופון הוחל בהצלחה")).toBeVisible();

  const discount = await money("coupon-discount");
  expect(discount).toBeGreaterThan(0);
  expect(await money("grand-total")).toBeCloseTo(before - discount, 2);
  await expect(page.getByRole("button", { name: /תשלום מאובטח/ })).toContainText(String(Math.floor(before - discount)));

  // Removing it restores the full price; a bad code shows an error and no discount.
  await page.getByRole("button", { name: "הסר" }).click();
  expect(await money("grand-total")).toBeCloseTo(before, 2);
  await page.locator("#checkout-coupon").fill("wrong-code");
  await page.getByRole("button", { name: "החל" }).click();
  await expect(page.getByText("קוד הקופון אינו תקין")).toBeVisible();
  await expect(page.getByTestId("coupon-discount")).toHaveCount(0);
});
