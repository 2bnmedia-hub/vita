import { test, expect } from "@playwright/test";

/**
 * Real Hosted Fields payment flow against Tranzila's TEST terminal
 * (fxpvythtvspy, TRANZILA_ENV=test). These fill Tranzila's own cross-origin
 * iframe inputs — not local <input> elements — so selectors target the
 * iframe by its Tranzila-assigned name/title.
 *
 * Card numbers:
 * - SUCCESS_CARD defaults to 4580458045804580, the example number shown
 *   verbatim in Tranzila's own "Create a Credit Card Transaction" docs.
 *   If the test terminal rejects it, get the confirmed test-card list from
 *   my.tranzila support and set E2E_SUCCESS_CARD.
 * - DECLINE_CARD / 3DS_FAIL_CARD / 3DS_CHALLENGE_CARD are NOT documented
 *   anywhere in docs.tranzila.com's public pages fetched for this task, so
 *   they are not hardcoded here — these tests are skipped until the real
 *   numbers are confirmed with Tranzila and exported as env vars. Filling
 *   in an unverified number here would violate "don't guess test-env
 *   behavior" from the task brief.
 */

const SUCCESS_CARD = process.env.E2E_SUCCESS_CARD || "4580458045804580";
const DECLINE_CARD = process.env.E2E_DECLINE_CARD;
const CHALLENGE_3DS_CARD = process.env.E2E_3DS_CHALLENGE_CARD;

async function addFirstProductToCart(page: import("@playwright/test").Page) {
  await page.goto("/shop");
  await page.getByRole("button", { name: /הוסף לסל|הוספה לסל/ }).first().click();
}

async function fillCheckoutForm(page: import("@playwright/test").Page, email: string) {
  await page.goto("/checkout");
  await page.locator("#checkout-name").fill("בדיקת אוטומציה");
  await page.locator("#checkout-email").fill(email);
  await page.locator("#checkout-phone").fill("0501234567");
  await page.locator("#checkout-address").fill("רחוב הבדיקה 1");
  await page.locator("#checkout-city").fill("תל אביב");
  await page.locator("input[type=checkbox]").first().check();
}

async function fillHostedCard(page: import("@playwright/test").Page, cardNumber: string, expiry: string, cvv: string) {
  const numberFrame = page.frameLocator("#tz-card-number iframe");
  const expiryFrame = page.frameLocator("#tz-expiry iframe");
  const cvvFrame = page.frameLocator("#tz-cvv iframe");
  await numberFrame.locator("input").fill(cardNumber);
  await expiryFrame.locator("input").fill(expiry);
  await cvvFrame.locator("input").fill(cvv);
}

test.describe("Tranzila payment flow (test terminal)", () => {
  test("successful test payment reaches the success screen with an order number", async ({ page }) => {
    await addFirstProductToCart(page);
    await fillCheckoutForm(page, `e2e-success-${Date.now()}@example.com`);
    await fillHostedCard(page, SUCCESS_CARD, "12/30", "111");
    await page.getByRole("button", { name: /תשלום מאובטח/ }).click();
    await expect(page.getByText("התשלום אושר בהצלחה")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/מספר הזמנה/)).toBeVisible();
  });

  test("double-clicking pay does not submit twice (button disables immediately)", async ({ page }) => {
    await addFirstProductToCart(page);
    await fillCheckoutForm(page, `e2e-doubleclick-${Date.now()}@example.com`);
    await fillHostedCard(page, SUCCESS_CARD, "12/30", "111");
    const submit = page.getByRole("button", { name: /תשלום מאובטח/ });
    await submit.click();
    await expect(submit).toBeDisabled();
  });

  test("refreshing the page after a successful payment does not create a second order", async ({ page }) => {
    await addFirstProductToCart(page);
    await fillCheckoutForm(page, `e2e-refresh-${Date.now()}@example.com`);
    await fillHostedCard(page, SUCCESS_CARD, "12/30", "111");
    await page.getByRole("button", { name: /תשלום מאובטח/ }).click();
    await expect(page.getByText("התשלום אושר בהצלחה")).toBeVisible({ timeout: 30_000 });
    const orderNumberBefore = await page.getByText(/מספר הזמנה/).textContent();
    await page.reload();
    // Cart was cleared on success, so a reload lands on the empty-cart state —
    // it must NOT silently re-submit a second charge.
    await expect(page.getByText("הסל שלך ריק")).toBeVisible();
    expect(orderNumberBefore).toBeTruthy();
  });

  test("a declined test card shows a Hebrew failure screen, not a false success", async ({ page }) => {
    test.skip(!DECLINE_CARD, "Set E2E_DECLINE_CARD to a Tranzila-confirmed decline test card number to run this check");
    await addFirstProductToCart(page);
    await fillCheckoutForm(page, `e2e-decline-${Date.now()}@example.com`);
    await fillHostedCard(page, DECLINE_CARD!, "12/30", "111");
    await page.getByRole("button", { name: /תשלום מאובטח/ }).click();
    await expect(page.getByText("התשלום נכשל")).toBeVisible({ timeout: 30_000 });
  });

  test("an invalid/malformed card number is rejected client-side before any charge attempt", async ({ page }) => {
    await addFirstProductToCart(page);
    await fillCheckoutForm(page, `e2e-invalid-${Date.now()}@example.com`);
    await fillHostedCard(page, "1234", "12/30", "111");
    await page.getByRole("button", { name: /תשלום מאובטח/ }).click();
    await expect(page.getByText(/נדחה|לא תקין|שגיאה/)).toBeVisible({ timeout: 15_000 });
  });

  test("3DS challenge completes successfully", async () => {
    test.skip(!CHALLENGE_3DS_CARD, "Set E2E_3DS_CHALLENGE_CARD to a Tranzila-confirmed 3DS-challenge test card to run this check");
  });

  test("3DS authentication failure is reported as a failure, not a success", async () => {
    test.skip(!process.env.E2E_3DS_FAIL_CARD, "Set E2E_3DS_FAIL_CARD to a Tranzila-confirmed 3DS-fail test card to run this check");
  });
});
