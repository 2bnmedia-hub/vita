import { NextRequest } from "next/server";
import crypto from "crypto";

const ADMIN_SESSION_COOKIE = "vform_admin_session";
export const ADMIN_EMAILS = ["2bnbussiness@gmail.com", "2bnmedia@gmail.com", "vformnutrition@gmail.com"];
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days, matches the cookie's maxAge

function secret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s) throw new Error("Missing required env var: ADMIN_SESSION_SECRET");
  return s;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("hex");
}

/**
 * `payload.signature` — payload is `email:issuedAtMs`, signature is
 * HMAC-SHA256(ADMIN_SESSION_SECRET, payload). Previously this cookie was an
 * unsigned base64 string and isAdminAuthed() only checked it was present —
 * any client could set a truthy cookie and pass every admin check (refunds,
 * order edits, promoting accounts). Signing makes it unforgeable.
 */
export function createAdminSessionToken(email: string): string {
  const payload = `${email}:${Date.now()}`;
  return `${Buffer.from(payload).toString("base64")}.${sign(payload)}`;
}

/** Pure token check, split out from isAdminAuthed() so it's unit-testable without a NextRequest. */
export function verifyAdminSessionToken(token: string | undefined | null): boolean {
  if (!token) return false;

  const dot = token.indexOf(".");
  if (dot === -1) return false; // legacy unsigned token format — reject
  const encodedPayload = token.slice(0, dot);
  const providedSig = token.slice(dot + 1);

  let payload: string;
  try {
    payload = Buffer.from(encodedPayload, "base64").toString("utf8");
  } catch {
    return false;
  }

  const expectedSig = sign(payload);
  if (
    expectedSig.length !== providedSig.length ||
    !crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(providedSig))
  ) {
    return false;
  }

  const [email, issuedAtStr] = payload.split(":");
  const issuedAt = Number(issuedAtStr);
  if (!ADMIN_EMAILS.includes(email) || !Number.isFinite(issuedAt)) return false;
  if (Date.now() - issuedAt > SESSION_MAX_AGE_MS) return false;

  return true;
}

export function isAdminAuthed(req: NextRequest): boolean {
  return verifyAdminSessionToken(req.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}
