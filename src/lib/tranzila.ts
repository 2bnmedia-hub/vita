import crypto from "crypto";

// Server-only Tranzila client. Never import this file from a "use client" component —
// TRANZILA_PRIVATE_KEY must never reach the browser bundle.

const API_BASE = "https://api.tranzila.com";

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export function tranzilaTerminal(): string {
  return env("TRANZILA_TERMINAL_NAME");
}

export function tranzilaEnv(): "test" | "production" {
  const v = (process.env.TRANZILA_ENV || "test").toLowerCase();
  return v === "production" ? "production" : "test";
}

/**
 * hash_hmac('sha256', appKey, secret + time + nonce) — message is the app
 * key, key is secret+time+nonce. Exported (pure, no I/O) so it's unit
 * testable without hitting the network or requiring real credentials.
 */
export function computeAccessToken(appKey: string, secret: string, time: string, nonce: string): string {
  return crypto.createHmac("sha256", secret + time + nonce).update(appKey).digest("hex");
}

/** HMAC-SHA256 auth headers per docs.tranzila.com/docs/payments-and-billing/authentication */
function authHeaders(): Record<string, string> {
  const appKey = env("TRANZILA_PUBLIC_KEY");
  const secret = env("TRANZILA_PRIVATE_KEY");
  const time = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(40).toString("hex");
  const accessToken = computeAccessToken(appKey, secret, time, nonce);

  return {
    "Content-Type": "application/json",
    "X-tranzila-api-app-key": appKey,
    "X-tranzila-api-request-time": time,
    "X-tranzila-api-nonce": nonce,
    "X-tranzila-api-access-token": accessToken,
  };
}

async function callTranzila<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return json as T;
}

export interface HandshakeResult {
  ok: boolean;
  thtk?: string;
  errorCode?: number;
  message?: string;
}

/** docs.tranzila.com/docs/payments-and-billing/handshake-v2 */
export async function createHandshake(sum: number, requestParams: Record<string, unknown>): Promise<HandshakeResult> {
  const json = await callTranzila<{ error_code: number; message: string; thtk?: string }>(
    "/v2/handshake/create",
    {
      terminal_name: tranzilaTerminal(),
      sum,
      request_params: requestParams,
    }
  );
  return {
    ok: json.error_code === 0 && !!json.thtk,
    thtk: json.thtk,
    errorCode: json.error_code,
    message: json.message,
  };
}

export interface TrackedTransaction {
  index: string;
  amount: string;
  currency: string;
  authorization_number: string;
  transtatus: string;
  [key: string]: unknown;
}

/**
 * Server-side reconciliation: independently ask Tranzila for the transaction
 * instead of trusting anything the browser reported.
 * docs.tranzila.com/docs/reports/track-transaction-data
 */
export async function lookupTransaction(transactionIndex: string): Promise<TrackedTransaction | null> {
  const json = await callTranzila<{ transactions?: TrackedTransaction[] }>(
    "/v1/transactions",
    {
      terminal_name: tranzilaTerminal(),
      // docs.tranzila.com/docs/reports/track-transaction-data: transaction_index is an
      // integer. Sending it as a string silently returns zero matches — every verify
      // call (including successful ones) was failing this lookup because of this.
      transaction_index: Number(transactionIndex),
    }
  );
  return json.transactions?.[0] ?? null;
}

/**
 * Tranzila's Track Transaction Data API can lag a few seconds behind a
 * charge that just completed. A single immediate lookup can come back empty
 * for a real, approved transaction, which would wrongly mark it failed —
 * this happened to real customers (empty result right after charge, even
 * though their card was approved). Retry briefly before giving up.
 * ponytail: fixed delay schedule, not adaptive; widen it if lag grows.
 */
export async function lookupTransactionWithRetry(
  transactionIndex: string,
  delaysMs: number[] = [0, 1000, 2000, 2000]
): Promise<TrackedTransaction | null> {
  let tracked: TrackedTransaction | null = null;
  for (const delay of delaysMs) {
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    tracked = await lookupTransaction(transactionIndex);
    if (tracked) return tracked;
  }
  return tracked;
}

export type PaymentOutcome = "approved" | "declined" | "unconfirmed";

/**
 * Single decision point for what a Tranzila lookup result means for an order.
 * "unconfirmed" is NOT a failure: a transaction id exists at Tranzila but we
 * could not prove it approved for this order's amount (no record in the
 * report API, or a record with a different amount). The card may well have
 * been charged, so callers must neither mark the order failed nor offer a
 * second charge. `reportedCode` (browser/webhook-reported) can only ever
 * turn a missing record into "declined" — it is never able to approve.
 */
export function classifyPayment(
  tracked: TrackedTransaction | null,
  orderTotal: number | string,
  reportedCode?: string | null
): PaymentOutcome {
  if (!tracked) {
    return reportedCode && !TRANZILA_SUCCESS_CODES.has(reportedCode) ? "declined" : "unconfirmed";
  }
  if (tracked.transtatus == null) return "unconfirmed";
  if (!TRANZILA_SUCCESS_CODES.has(String(tracked.transtatus))) return "declined";
  return Math.abs(Number(tracked.amount) - Number(orderTotal)) < 0.01 ? "approved" : "unconfirmed";
}

export interface RefundResult {
  ok: boolean;
  errorCode?: number;
  message?: string;
  transactionId?: number;
  authNumber?: string;
}

/**
 * txn_type=credit reverses/refunds a prior transaction.
 * docs.tranzila.com/docs/payments-and-billing/tranzila-transactions-api-1/create-a-credit-card-transaction
 */
export async function refundTransaction(params: {
  referenceTransactionId: string;
  authorizationNumber: string;
  amount: number;
}): Promise<RefundResult> {
  const json = await callTranzila<{
    error_code: number;
    message: string;
    transaction_result?: { transaction_id: number; auth_number: string };
  }>("/v1/transaction/credit_card/create", {
    terminal_name: tranzilaTerminal(),
    txn_type: "credit",
    txn_currency_code: "ILS",
    reference_txn_id: Number(params.referenceTransactionId),
    authorization_number: params.authorizationNumber,
    items: [{ name: "Refund", type: "I", unit_price: params.amount, units_number: 1 }],
  });
  return {
    ok: json.error_code === 0,
    errorCode: json.error_code,
    message: json.message,
    transactionId: json.transaction_result?.transaction_id,
    authNumber: json.transaction_result?.auth_number,
  };
}

/** docs.tranzila.com/docs/payments-and-billing/transaction-response-codes */
// Per docs.tranzila.com/docs/payments-and-billing/transaction-response-codes:
// "000" is the standard approved-sale code; "777" is a secondary success code
// for operations that don't record a formal transaction (e.g. J2/J5) — added
// so a real approval of that kind is never misread as a decline.
export const TRANZILA_SUCCESS_CODES = new Set(["000", "0", "777"]);

const HEBREW_DECLINE_MESSAGES: Record<string, string> = {
  "001": "הכרטיס חסום. פנה/י לחברת האשראי.",
  "002": "הכרטיס דווח כגנוב. פנה/י לחברת האשראי.",
  "003": "יש לפנות לחברת האשראי לאישור העסקה.",
  "004": "העסקה נדחתה. פנה/י לחברת האשראי.",
  "005": "הכרטיס מזויף. פנה/י לחברת האשראי.",
  "006": "מספר זהות או CVV שגויים.",
  "012": "הכרטיס אינו מורשה לביצוע עסקה זו.",
  "015": "פג תוקף הכרטיס.",
  "416": "תאריך תפוגה שגוי.",
  "420": "מספר כרטיס אשראי שגוי.",
  "447": "מספר כרטיס אשראי שגוי.",
  "900": "אימות 3D Secure נכשל.",
};

export function hebrewMessageForCode(code: string | undefined): string {
  if (!code) return "אירעה שגיאה בביצוע התשלום. נסה/י שוב.";
  if (TRANZILA_SUCCESS_CODES.has(code)) return "התשלום אושר בהצלחה.";
  return HEBREW_DECLINE_MESSAGES[code] ?? "העסקה נדחתה. בדוק/י את פרטי הכרטיס ונסה/י שוב, או פנה/י לחברת האשראי.";
}

/** Strip anything that could be a PAN/CVV before it's ever logged or stored. */
export function sanitizeForLog(input: unknown): string {
  let s = typeof input === "string" ? input : JSON.stringify(input);
  s = s.replace(/\b\d{12,19}\b/g, "[redacted-pan]");
  s = s.replace(/"?cvv"?\s*[:=]\s*"?\d{3,4}"?/gi, "cvv=[redacted]");
  return s.slice(0, 500);
}
