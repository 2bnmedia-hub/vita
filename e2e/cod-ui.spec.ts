import { test, expect, type Page, type Route } from "@playwright/test";

/**
 * Cash on delivery — checkout UI. /api/checkout/create-order is intercepted
 * and answered by the test, so no order is ever created and nothing reaches
 * Tranzila: safe against production.
 */

const CHEW = "88c99155-29a8-42aa-85fa-d7f05eba4fcb"; // קריאטין טבליות לעיסה, 155 ₪
const SHIPPING: Record<string, number> = { "צפון": 29, "מרכז": 39, "דרום ואילת": 49, "איסוף עצמי": 0 };

async function openCheckout(page: Page, region = "center") {
  await page.addInitScript(([id, region]) => {
    localStorage.setItem("vform-cart", JSON.stringify({
      state: {
        items: [{ product: { id, name: "קריאטין טבליות לעיסה", slug: "creatine-chewable", price: 155, images: [], in_stock: true }, quantity: 2 }],
        shippingRegion: region,
      },
      version: 0,
    }));
  }, [CHEW, region]);
  await page.goto("/checkout");
  const banner = page.getByRole("region", { name: "הודעת עוגיות" });
  if (await banner.isVisible().catch(() => false)) await banner.getByRole("button", { name: "סגור" }).click();
}

async function fillCustomer(page: Page) {
  await page.getByLabel("שם מלא *").fill("בדיקת תשלום לשליח");
  await page.getByLabel("אימייל *").fill("e2e-cod@example.com");
  await page.getByLabel("טלפון *").fill("0500000000");
  await page.getByLabel("כתובת *").fill("רחוב הבדיקה 1");
  await page.getByLabel("עיר *").fill("חיפה");
  await page.getByRole("checkbox").check();
}

const codRadio = (page: Page) => page.getByRole("radio", { name: "תשלום לשליח בעת קבלת המוצר" });
const cardRadio = (page: Page) => page.getByRole("radio", { name: "תשלום באשראי באתר" });
// The radios are sr-only; a real user clicks the visible label.
const pick = (page: Page, text: string) => page.locator("label", { hasText: text }).click();
const cardFields = (page: Page) => page.locator("#tz-card-number");

test("card is the default, COD hides card fields, switching back restores them", async ({ page }) => {
  await openCheckout(page);
  await expect(cardRadio(page)).toBeChecked();
  await expect(cardFields(page)).toBeVisible();
  await expect(page.getByRole("button", { name: /תשלום מאובטח/ })).toBeVisible();

  await pick(page, "תשלום לשליח בעת קבלת המוצר");
  await expect(cardFields(page)).toBeHidden();
  await expect(page.getByText("התשלום יתבצע לשליח בעת קבלת ההזמנה. אין צורך להזין פרטי אשראי באתר.")).toBeVisible();
  await expect(page.getByRole("button", { name: "אישור הזמנה — תשלום לשליח" })).toBeVisible();

  await pick(page, "תשלום באשראי באתר");
  await expect(cardFields(page)).toBeVisible();
  await expect(page.getByRole("button", { name: /תשלום מאובטח/ })).toBeVisible();
});

for (const [label, cost] of Object.entries(SHIPPING).filter(([l]) => l !== "איסוף עצמי")) {
  test(`COD total includes shipping — ${label}`, async ({ page }) => {
    await openCheckout(page);
    await pick(page, label);
    await pick(page, "תשלום לשליח בעת קבלת המוצר");
    const row = page.getByText("לתשלום לשליח בעת המסירה (כולל משלוח)").locator("..");
    await expect(row).toContainText(String(310 + cost));
  });
}

test("self pickup removes COD and falls back to card", async ({ page }) => {
  await openCheckout(page);
  await pick(page, "תשלום לשליח בעת קבלת המוצר");
  await pick(page, "איסוף עצמי");
  await expect(codRadio(page)).toHaveCount(0);
  await expect(cardFields(page)).toBeVisible();
  // Back to delivery: card is still selected, COD has to be chosen again.
  await pick(page, "צפון");
  await expect(cardRadio(page)).toBeChecked();
});

test("COD order: one request with method cod, success screen with amount and status", async ({ page }) => {
  let calls = 0;
  let sent: any = null;
  await page.route("**/api/checkout/create-order", async (route: Route) => {
    calls++;
    sent = route.request().postDataJSON();
    await new Promise((r) => setTimeout(r, 400)); // window for a double click
    await route.fulfill({ json: { orderId: "x", orderNumber: "VF-TESTCOD", amount: 349, paymentMethod: "cod", paymentStatus: "cod_pending" } });
  });
  // The hosted-fields script loads on page open; only calls after the click count.
  let tranzilaCalls = 0;
  page.on("request", (r) => { if (/tranzila\.com/.test(r.url())) tranzilaCalls++; });

  await openCheckout(page);
  await fillCustomer(page);
  await pick(page, "תשלום לשליח בעת קבלת המוצר");
  tranzilaCalls = 0;
  await page.getByRole("button", { name: "אישור הזמנה — תשלום לשליח" }).dblclick();

  await expect(page.getByRole("heading", { name: "ההזמנה התקבלה בהצלחה!" })).toBeVisible();
  await expect(page.getByText("VF-TESTCOD")).toBeVisible();
  await expect(page.getByText("ממתין לתשלום בעת המסירה")).toBeVisible();
  await expect(page.getByText(/סכום לגבייה בעת המסירה/)).toContainText("349");
  expect(calls).toBe(1);
  expect(sent.paymentMethod).toBe("cod");
  expect(sent.shippingRegion).toBe("center");
  expect(tranzilaCalls).toBe(0);
});

test("COD server error shows the failure screen, nothing charged", async ({ page }) => {
  await page.route("**/api/checkout/create-order", (route) =>
    route.fulfill({ status: 500, json: { error: "יצירת ההזמנה נכשלה. נסה/י שוב." } })
  );
  await openCheckout(page);
  await fillCustomer(page);
  await pick(page, "תשלום לשליח בעת קבלת המוצר");
  await page.getByRole("button", { name: "אישור הזמנה — תשלום לשליח" }).click();
  await expect(page.getByRole("heading", { name: "התשלום נכשל" })).toBeVisible();
  await expect(page.getByText("יצירת ההזמנה נכשלה. נסה/י שוב.")).toBeVisible();
});

test("COD with a coupon sends the coupon code", async ({ page }) => {
  let sent: any = null;
  await page.route("**/api/checkout/coupon", (route) =>
    route.fulfill({ json: { ok: true, code: "zz-test", rule: { percentOff: 10, amountOff: null, productId: null, minQuantity: 1 }, terms: null } })
  );
  await page.route("**/api/checkout/create-order", (route) => {
    sent = route.request().postDataJSON();
    return route.fulfill({ json: { orderId: "x", orderNumber: "VF-TESTCOD2", amount: 318, paymentMethod: "cod", paymentStatus: "cod_pending" } });
  });
  await openCheckout(page);
  await fillCustomer(page);
  await pick(page, "תשלום לשליח בעת קבלת המוצר");
  const couponInput = page.getByLabel("קוד קופון").filter({ visible: true });
  await couponInput.fill("zz-test");
  await couponInput.press("Enter");
  await expect(page.getByText("לתשלום לשליח בעת המסירה (כולל משלוח)").locator("..")).toContainText("318");
  await page.getByRole("button", { name: "אישור הזמנה — תשלום לשליח" }).click();
  await expect(page.getByRole("heading", { name: "ההזמנה התקבלה בהצלחה!" })).toBeVisible();
  expect(sent.couponCode).toBe("zz-test");
  expect(sent.paymentMethod).toBe("cod");
});
