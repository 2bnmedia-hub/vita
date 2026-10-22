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

// The radios are sr-only; a real user clicks the visible label.
const group = (page: Page) => page.getByRole("radiogroup", { name: "אזור משלוח *" });
const codGroup = (page: Page) => page.getByRole("radiogroup", { name: "אזור למסירה *" });
const pick = (scope: ReturnType<Page["locator"]>, text: string) => scope.locator("label", { hasText: text }).click();
const COD = "תשלום לשליח בעת קבלת המוצר";
const cardFields = (page: Page) => page.locator("#tz-card-number");
const totalRow = (page: Page) => page.getByText("לתשלום לשליח בעת המסירה (כולל משלוח)").locator("..");

test("אזור משלוח has exactly five options; COD is one of them", async ({ page }) => {
  await openCheckout(page);
  const radios = group(page).getByRole("radio");
  await expect(radios).toHaveCount(5);
  for (const label of ["צפון", "מרכז", "דרום ואילת", "איסוף עצמי", COD]) {
    await expect(group(page).locator("label", { hasText: label })).toBeVisible();
  }
  await expect(group(page).getByRole("radio", { name: /מרכז/ })).toBeChecked();
  await expect(cardFields(page)).toBeVisible();
});

test("COD hides card fields, needs a delivery region, switching away restores card", async ({ page }) => {
  await openCheckout(page);
  await fillCustomer(page);
  await pick(group(page), COD);
  await expect(group(page).getByRole("radio", { name: new RegExp(COD) })).toBeChecked();
  await expect(group(page).getByRole("radio", { name: /מרכז/ })).not.toBeChecked();
  await expect(cardFields(page)).toBeHidden();
  await expect(page.getByText("התשלום עבור ההזמנה והמשלוח יתבצע לשליח בעת קבלת המוצר.")).toBeVisible();
  // No region yet: shipping is not assumed, confirm is blocked.
  await expect(page.getByText("יש לבחור אזור למסירה").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "אישור הזמנה — תשלום לשליח" })).toBeDisabled();
  await pick(codGroup(page), "צפון");
  await expect(page.getByRole("button", { name: "אישור הזמנה — תשלום לשליח" })).toBeEnabled();

  await pick(group(page), "איסוף עצמי");
  await expect(codGroup(page)).toHaveCount(0);
  await expect(cardFields(page)).toBeVisible();
  await expect(page.getByRole("button", { name: /תשלום מאובטח/ })).toBeVisible();
  // Back to COD: the old delivery region is cleared, it has to be chosen again.
  await pick(group(page), COD);
  await expect(codGroup(page).getByRole("radio", { checked: true })).toHaveCount(0);
});

for (const [label, cost] of Object.entries(SHIPPING).filter(([l]) => l !== "איסוף עצמי")) {
  test(`COD total includes shipping — ${label}`, async ({ page }) => {
    await openCheckout(page);
    await pick(group(page), COD);
    await pick(codGroup(page), label);
    await expect(totalRow(page)).toContainText(String(310 + cost));
  });
}

test("COD order: one request with method cod + chosen region, success screen with amount and status", async ({ page }) => {
  let calls = 0;
  let sent: any = null;
  await page.route("**/api/checkout/create-order", async (route: Route) => {
    calls++;
    sent = route.request().postDataJSON();
    await new Promise((r) => setTimeout(r, 400)); // window for a double click
    await route.fulfill({ json: { orderId: "x", orderNumber: "VF-TESTCOD", amount: 359, paymentMethod: "cod", paymentStatus: "cod_pending" } });
  });
  await openCheckout(page);
  await fillCustomer(page);
  await pick(group(page), COD);
  await pick(codGroup(page), "דרום ואילת");
  // The hosted-fields script loads on page open; only calls after the click count.
  let tranzilaCalls = 0;
  page.on("request", (r) => { if (/tranzila\.com/.test(r.url())) tranzilaCalls++; });
  await page.getByRole("button", { name: "אישור הזמנה — תשלום לשליח" }).dblclick();

  await expect(page.getByRole("heading", { name: "ההזמנה התקבלה בהצלחה!" })).toBeVisible();
  await expect(page.getByText("VF-TESTCOD")).toBeVisible();
  await expect(page.getByText("ממתין לתשלום לשליח")).toBeVisible();
  await expect(page.getByText(/סכום לגבייה בעת המסירה/)).toContainText("359");
  expect(calls).toBe(1);
  expect(sent.paymentMethod).toBe("cod");
  expect(sent.shippingRegion).toBe("south");
  expect(tranzilaCalls).toBe(0);
});

test("COD server error shows the failure screen, nothing charged", async ({ page }) => {
  await page.route("**/api/checkout/create-order", (route) =>
    route.fulfill({ status: 500, json: { error: "יצירת ההזמנה נכשלה. נסה/י שוב." } })
  );
  await openCheckout(page);
  await fillCustomer(page);
  await pick(group(page), COD);
  await pick(codGroup(page), "מרכז");
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
  await pick(group(page), COD);
  await pick(codGroup(page), "מרכז");
  const couponInput = page.getByLabel("קוד קופון").filter({ visible: true });
  await couponInput.fill("zz-test");
  await couponInput.press("Enter");
  await expect(totalRow(page)).toContainText("318");
  await page.getByRole("button", { name: "אישור הזמנה — תשלום לשליח" }).click();
  await expect(page.getByRole("heading", { name: "ההזמנה התקבלה בהצלחה!" })).toBeVisible();
  expect(sent.couponCode).toBe("zz-test");
  expect(sent.paymentMethod).toBe("cod");
});
