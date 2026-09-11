import { test, expect } from "@playwright/test";

test.describe("Admin access control", () => {
  test("visiting /admin/orders without a session redirects to /admin/login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/admin/orders");
    await page.waitForURL(/\/admin\/login/, { timeout: 10_000 });
    expect(page.url()).toContain("/admin/login");
  });

  test("GET /api/admin-auth without a cookie is unauthorized", async ({ request }) => {
    const res = await request.get("/api/admin-auth");
    expect(res.status()).toBe(401);
  });

  test("refund-order API rejects a regular (non-admin) request", async ({ request }) => {
    const res = await request.post("/api/admin/refund-order", { data: { orderId: "any", full: true } });
    expect(res.status()).toBe(401);
  });
});
