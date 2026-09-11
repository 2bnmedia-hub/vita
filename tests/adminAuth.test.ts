import { describe, it, expect, beforeAll } from "vitest";

beforeAll(() => {
  process.env.ADMIN_SESSION_SECRET = "test-secret-not-real";
});

describe("admin session token", () => {
  it("accepts a freshly issued token for an allowed admin email", async () => {
    const { createAdminSessionToken, verifyAdminSessionToken } = await import("@/lib/adminAuth");
    const token = createAdminSessionToken("2bnbussiness@gmail.com");
    expect(verifyAdminSessionToken(token)).toBe(true);
  });

  it("rejects the old unsigned format (no '.') — closes the original forge-any-cookie bug", async () => {
    const { verifyAdminSessionToken } = await import("@/lib/adminAuth");
    const legacyToken = Buffer.from("2bnbussiness@gmail.com:1700000000000").toString("base64");
    expect(verifyAdminSessionToken(legacyToken)).toBe(false);
  });

  it("rejects a token with a tampered signature", async () => {
    const { createAdminSessionToken, verifyAdminSessionToken } = await import("@/lib/adminAuth");
    const token = createAdminSessionToken("2bnbussiness@gmail.com");
    const [payload] = token.split(".");
    expect(verifyAdminSessionToken(`${payload}.0000000000000000000000000000000000000000000000000000000000000000`)).toBe(false);
  });

  it("rejects a well-signed token for an email outside the admin allowlist", async () => {
    const { verifyAdminSessionToken } = await import("@/lib/adminAuth");
    const crypto = await import("crypto");
    const payload = `attacker@example.com:${Date.now()}`;
    const sig = crypto.createHmac("sha256", process.env.ADMIN_SESSION_SECRET!).update(payload).digest("hex");
    const forged = `${Buffer.from(payload).toString("base64")}.${sig}`;
    expect(verifyAdminSessionToken(forged)).toBe(false);
  });

  it("rejects an expired token (older than 7 days)", async () => {
    const { verifyAdminSessionToken } = await import("@/lib/adminAuth");
    const crypto = await import("crypto");
    const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
    const payload = `2bnbussiness@gmail.com:${eightDaysAgo}`;
    const sig = crypto.createHmac("sha256", process.env.ADMIN_SESSION_SECRET!).update(payload).digest("hex");
    const expired = `${Buffer.from(payload).toString("base64")}.${sig}`;
    expect(verifyAdminSessionToken(expired)).toBe(false);
  });

  it("rejects empty/missing tokens", async () => {
    const { verifyAdminSessionToken } = await import("@/lib/adminAuth");
    expect(verifyAdminSessionToken(undefined)).toBe(false);
    expect(verifyAdminSessionToken(null)).toBe(false);
    expect(verifyAdminSessionToken("")).toBe(false);
  });
});
