import { test, expect, type Page } from "@playwright/test";

/**
 * NIMRY21 checks, safe against production: nothing here submits a charge.
 * The create-order calls open a Tranzila handshake (no money moves) and
 * leave pending test orders from e2e-coupon@example.com — delete them after:
 *   delete from orders where customer_email = 'e2e-coupon@example.com';
 */

const CHEW = "88c99155-29a8-42aa-85fa-d7f05eba4fcb"; // קריאטין טבליות לעיסה, 155 ₪
const OTHER = "dfd1a69e-abb9-4440-9cb9-d89eb15045aa"; // קריאטין ענבים, 94 ₪
const TERMS = "הקופון תקף ברכישת 3 קופסאות קריאטין טבליות לעיסה לפחות";

test.describe("coupon — API", () => {
  test("old Nimry15 no longer works", async ({ request }) => {
    const body = await (await request.post("/api/checkout/coupon", { data: { code: "Nimry15" } })).json();
    expect(body.ok).toBe(false);
    expect(body.status).toBe("invalid");
  });

  test("NIMRY21 ignores case and surrounding spaces", async ({ request }) => {
    for (const code of ["NIMRY21", "nimry21", " NiMrY21 "]) {
      const body = await (await request.post("/api/checkout/coupon", { data: { code } })).json();
      expect(body.ok, code).toBe(true);
      expect(body.rule).toEqual({ percentOff: null, amountOff: 155, productId: CHEW, minQuantity: 3 });
      expect(body.terms).toBe(TERMS);
    }
  });

  const order = (request: any, items: { product_id: string; quantity: number; price?: number }[], couponCode?: string) =>
    request.post("/api/checkout/create-order", {
      data: {
        items,
        couponCode,
        shippingRegion: "pickup", // 0 ₪ shipping keeps the expected amounts exact
        idempotencyKey: crypto.randomUUID(),
        customer: { name: "E2E coupon test", email: "e2e-coupon@example.com", phone: "0500000000", address: "test 1", city: "test", agreedToTerms: true },
      },
    });

  test("server pricing: 465 without, 310 with, 155 off max, others not counted", async ({ request }) => {
    const amount = async (items: any[], code?: string) => {
      const res = await order(request, items, code);
      expect(res.status(), JSON.stringify(items)).toBe(200);
      return Number((await res.json()).amount);
    };
    expect(await amount([{ product_id: CHEW, quantity: 3 }])).toBe(465);
    expect(await amount([{ product_id: CHEW, quantity: 3 }], " nimry21 ")).toBe(310);
    expect(await amount([{ product_id: CHEW, quantity: 5 }], "NIMRY21")).toBe(5 * 155 - 155);
    expect(await amount([{ product_id: CHEW, quantity: 3 }, { product_id: OTHER, quantity: 2 }], "NIMRY21")).toBe(465 + 188 - 155);
    // A price sent by the browser is ignored.
    expect(await amount([{ product_id: CHEW, quantity: 3, price: 1 }], "NIMRY21")).toBe(310);
  });

  test("server refuses NIMRY21 below 3 eligible boxes, other products don't count", async ({ request }) => {
    for (const items of [
      [{ product_id: CHEW, quantity: 2 }],
      [{ product_id: CHEW, quantity: 2 }, { product_id: OTHER, quantity: 4 }],
    ]) {
      const res = await order(request, items, "NIMRY21");
      expect(res.status()).toBe(409);
      const body = await res.json();
      expect(body.couponStatus).toBe("not_eligible");
      expect(body.error).toBe(TERMS);
    }
  });

  test("server refuses Nimry15", async ({ request }) => {
    const res = await order(request, [{ product_id: CHEW, quantity: 3 }], "Nimry15");
    expect(res.status()).toBe(409);
  });
});

const money = async (scope: ReturnType<Page["locator"]>, testId: string) =>
  Number((await scope.getByTestId(testId).textContent())!.replace(/[^\d.]/g, ""));

test("coupon — cart drawer and checkout breakdown follow the quantity", async ({ page }) => {
  await page.goto("/shop/creatine-chewable");
  await page.getByRole("button", { name: "הגדל כמות", exact: true }).click();
  await page.getByRole("button", { name: "הגדל כמות", exact: true }).click();
  await page.getByRole("button", { name: /הוסף לסל/ }).first().click();

  const drawer = page.getByRole("dialog", { name: "סל קניות" });
  await expect(drawer).toBeVisible();
  expect(await money(drawer, "subtotal")).toBe(465);
  await expect(drawer.getByTestId("coupon-discount")).toHaveCount(0); // no automatic discount
  const shipping = (await money(drawer, "grand-total")) - 465;

  await drawer.getByLabel("קוד קופון").fill("  nimry21 ");
  await drawer.getByRole("button", { name: "החל" }).click();
  await expect(drawer.getByTestId("coupon-discount")).toContainText("הנחת קופון NIMRY21");
  expect(await money(drawer, "coupon-discount")).toBe(155);
  expect(await money(drawer, "grand-total")).toBe(310 + shipping);

  // Down to 2 boxes: discount disappears at once and the terms are shown.
  await drawer.getByRole("button", { name: /הקטן כמות של קריאטין טבליות לעיסה/ }).click();
  await expect(drawer.getByTestId("coupon-discount")).toHaveCount(0);
  await expect(drawer.getByTestId("coupon-message")).toHaveText(TERMS);
  expect(await money(drawer, "grand-total")).toBe(310 + shipping);

  // Up to 4: still exactly 155 off.
  await drawer.getByRole("button", { name: /הגדל כמות של קריאטין טבליות לעיסה/ }).click();
  await drawer.getByRole("button", { name: /הגדל כמות של קריאטין טבליות לעיסה/ }).click();
  expect(await money(drawer, "coupon-discount")).toBe(155);
  expect(await money(drawer, "grand-total")).toBe(620 - 155 + shipping);

  // Checkout shows the same coupon and numbers; the pay button matches.
  await drawer.getByRole("link", { name: /לתשלום/ }).click();
  await page.waitForURL("**/checkout");
  const main = page.locator("#main-content");
  expect(await money(main, "coupon-discount")).toBe(155);
  const total = await money(main, "grand-total");
  expect(total).toBe(620 - 155 + shipping);
  await expect(page.getByRole("button", { name: /תשלום מאובטח/ })).toContainText(String(Math.floor(total)));
  await main.getByTestId("grand-total").scrollIntoViewIfNeeded();
  await page.screenshot({ path: test.info().outputPath("checkout-nimry21.png") });

  // Removing the coupon restores the full price.
  await main.getByRole("button", { name: "הסר", exact: true }).click();
  await expect(main.getByTestId("coupon-discount")).toHaveCount(0);
  expect(await money(main, "grand-total")).toBe(620 + shipping);

  // The old coupon is refused.
  await main.getByLabel("קוד קופון").fill("Nimry15");
  await main.getByRole("button", { name: "החל" }).click();
  await expect(main.getByText("קוד הקופון אינו תקין")).toBeVisible();
});

test("home — bestseller chewable creatine is the first (rightmost) featured card", async ({ page }) => {
  await page.goto("/");
  const first = page.locator(".product-card").first();
  await expect(first).toContainText("קריאטין טבליות לעיסה");
  await expect(first).toContainText("הנמכר ביותר");
  await first.scrollIntoViewIfNeeded();
  await page.screenshot({ path: test.info().outputPath("home-bestseller.png") });
});
