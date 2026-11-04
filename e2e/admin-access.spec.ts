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

  // 4/11 security pass: every one of these was reachable without a session (or bypassed via the anon key).
  test("forged/garbage admin cookie is rejected by GET /api/admin-auth", async ({ request }) => {
    const res = await request.get("/api/admin-auth", { headers: { cookie: "vform_admin_session=anything" } });
    expect(res.status()).toBe(401);
  });

  for (const [method, path, data] of [
    ["POST", "/api/admin/data", { table: "products", op: "delete", id: "00000000-0000-0000-0000-000000000000" }],
    ["GET", "/api/admin/data?table=contact_submissions", undefined],
    ["POST", "/api/admin/redeploy", {}],
    ["GET", "/api/admin/product-views", undefined],
    ["POST", "/api/send-customer-email", { to: "x@example.com", message: "spam" }],
    ["POST", "/api/send-order-email", { items: [] }],
  ] as const) {
    test(`${method} ${path} without a session is 401`, async ({ request }) => {
      const res = method === "GET" ? await request.get(path) : await request.post(path, { data });
      expect(res.status()).toBe(401);
    });
  }

  test("wrong admin password is refused (old hardcoded one included)", async ({ request }) => {
    const res = await request.post("/api/admin-auth", { data: { email: "vformnutrition@gmail.com", password: "v12348765v" } });
    expect([401, 429]).toContain(res.status());
  });
});
