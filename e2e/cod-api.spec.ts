import { test, expect } from "@playwright/test";

/**
 * Cash on delivery — server guards that reject a request before anything is
 * read from or written to the DB, so these are safe to run against production.
 * The full "place a COD order" path is tested against the DB inside a
 * rolled-back transaction (see supabase-cod-migration.sql notes in PROJECT_STATE.md).
 */
const customer = { name: "Test", email: "t@example.com", phone: "0500000000", address: "st 1", city: "TLV", agreedToTerms: true };
const items = [{ product_id: "00000000-0000-0000-0000-000000000000", quantity: 1 }];

test.describe("checkout API — cash on delivery", () => {
  test("refuses COD with self pickup", async ({ request }) => {
    const res = await request.post("/api/checkout/create-order", {
      data: { items, customer, shippingRegion: "pickup", paymentMethod: "cod", idempotencyKey: crypto.randomUUID() },
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toContain("משלוח בלבד");
  });

  test("refuses an unknown payment method", async ({ request }) => {
    const res = await request.post("/api/checkout/create-order", {
      data: { items, customer, shippingRegion: "center", paymentMethod: "bitcoin", idempotencyKey: crypto.randomUUID() },
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toContain("אמצעי תשלום");
  });

  test("COD still requires agreeing to terms", async ({ request }) => {
    const res = await request.post("/api/checkout/create-order", {
      data: { items, customer: { ...customer, agreedToTerms: false }, shippingRegion: "north", paymentMethod: "cod", idempotencyKey: crypto.randomUUID() },
    });
    expect(res.status()).toBe(400);
  });

  test("mark-cod-paid requires an admin session", async ({ request }) => {
    const res = await request.post("/api/admin/mark-cod-paid", { data: { orderId: "00000000-0000-0000-0000-000000000000" } });
    expect(res.status()).toBe(401);
  });
});
