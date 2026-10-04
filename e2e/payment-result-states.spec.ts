import { test, expect, type Page } from "@playwright/test";

/**
 * Result-screen states after a charge was submitted. Tranzila's hosted-fields
 * script and our own checkout API routes are all stubbed in the browser, so
 * this never creates an order and never charges a card — safe against
 * production.
 */

const HOSTED_FIELDS_STUB = `
  window.TzlaHostedFields = {
    create: () => ({
      charge: (_params, cb) =>
        cb(null, {
          errors: null,
          transaction_response: {
            success: true,
            processor_response_code: "000",
            transaction_id: "97588",
            credit_card_last_4_digits: "2312",
          },
        }),
    }),
  };
`;

type VerifyReply = { status?: number; body: Record<string, unknown> } | "network-error";

async function payWithStubbedProvider(page: Page, replies: VerifyReply[]) {
  let createCalls = 0;
  await page.route("**/thostedf.js", (r) => r.fulfill({ contentType: "application/javascript", body: HOSTED_FIELDS_STUB }));
  await page.route("**/api/checkout/create-order", (r) => {
    createCalls++;
    return r.fulfill({
      json: { orderId: "00000000-0000-4000-8000-000000000001", orderNumber: "VF-E2ESTUB", amount: 184, currency: "ILS", terminalName: "stub", thtk: "stub" },
    });
  });
  await page.route("**/api/checkout/verify", (r) => {
    const reply = replies.length > 1 ? replies.shift()! : replies[0];
    return reply === "network-error" ? r.abort() : r.fulfill({ status: reply.status ?? 200, json: reply.body });
  });

  await page.goto("/shop");
  await page.locator('button[aria-label^="הוסף "]:not([disabled])').first().click();
  await page.goto("/checkout");
  await page.locator("#checkout-name").fill("בדיקת אוטומציה");
  await page.locator("#checkout-email").fill("e2e-stub@example.com");
  await page.locator("#checkout-phone").fill("0501234567");
  await page.locator("#checkout-address").fill("רחוב הבדיקה 1");
  await page.locator("#checkout-city").fill("תל אביב");
  await page.locator("input[type=checkbox]").first().check();
  await page.getByRole("button", { name: /תשלום מאובטח/ }).click();
  return { createCalls: () => createCalls };
}

const PENDING = { body: { ok: false, pending: true, message: "העסקה התקבלה אצל חברת הסליקה ואנו משלימים את אימות התשלום. אין לבצע תשלום נוסף — ניצור איתך קשר לאישור ההזמנה." } };

test.describe("payment result screen (stubbed provider, no charge)", () => {
  test("unconfirmed charge: 'in review' screen, no failure title, no button that can charge again", async ({ page }) => {
    const calls = await payWithStubbedProvider(page, [PENDING]);
    await expect(page.getByRole("heading", { name: "התשלום בבדיקה" })).toBeVisible();
    await expect(page.getByText("VF-E2ESTUB")).toBeVisible();
    await expect(page.getByText("אין לבצע תשלום נוסף")).toBeVisible();
    await expect(page.getByText("התשלום נכשל")).toHaveCount(0);
    await expect(page.getByText("התשלום אושר בהצלחה")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "נסה/י שוב" })).toHaveCount(0);

    // The only action is a read-only status check — it must not open a new order/charge.
    await page.getByRole("button", { name: "בדיקת סטטוס" }).click();
    await expect(page.getByRole("heading", { name: "התשלום בבדיקה" })).toBeVisible();
    expect(calls.createCalls()).toBe(1);

    // No horizontal overflow on the result screen (matters on the mobile project).
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    // Refresh must not land on a ready-to-pay form.
    await page.reload();
    await expect(page.getByText("הסל שלך ריק")).toBeVisible();
  });

  test("status check moves to success once the server confirms", async ({ page }) => {
    await payWithStubbedProvider(page, [PENDING, { body: { ok: true, message: "התשלום אושר בהצלחה." } }]);
    await page.getByRole("button", { name: "בדיקת סטטוס" }).click();
    await expect(page.getByRole("heading", { name: "התשלום אושר בהצלחה!" })).toBeVisible();
    await expect(page.getByText("VF-E2ESTUB")).toBeVisible();
  });

  test("verify unreachable after the charge: 'in review', not 'failed'", async ({ page }) => {
    await payWithStubbedProvider(page, ["network-error"]);
    await expect(page.getByRole("heading", { name: "התשלום בבדיקה" })).toBeVisible();
    await expect(page.getByRole("button", { name: "נסה/י שוב" })).toHaveCount(0);
  });

  test("real decline: failure screen with a decline message and a retry button", async ({ page }) => {
    await payWithStubbedProvider(page, [{ body: { ok: false, message: "העסקה נדחתה. פנה/י לחברת האשראי." } }]);
    await expect(page.getByRole("heading", { name: "התשלום נכשל" })).toBeVisible();
    await expect(page.getByText("העסקה נדחתה")).toBeVisible();
    await expect(page.getByText("אושר בהצלחה")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "נסה/י שוב" })).toBeVisible();
  });

  test("confirmed payment: success screen", async ({ page }) => {
    await payWithStubbedProvider(page, [{ body: { ok: true, message: "התשלום אושר בהצלחה." } }]);
    await expect(page.getByRole("heading", { name: "התשלום אושר בהצלחה!" })).toBeVisible();
  });
});
