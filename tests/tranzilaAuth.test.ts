import { describe, it, expect } from "vitest";
import crypto from "crypto";
import {
  computeAccessToken,
  hebrewMessageForCode,
  TRANZILA_SUCCESS_CODES,
  sanitizeForLog,
} from "@/lib/tranzila";

describe("computeAccessToken", () => {
  it("matches hash_hmac('sha256', appKey, secret+time+nonce) from Tranzila's docs example", () => {
    const appKey = "myAppKey";
    const secret = "myS3cret";
    const time = "1700000000";
    const nonce = "abc123";
    const expected = crypto.createHmac("sha256", secret + time + nonce).update(appKey).digest("hex");
    expect(computeAccessToken(appKey, secret, time, nonce)).toBe(expected);
  });

  it("is deterministic for the same inputs", () => {
    const a = computeAccessToken("k", "s", "1", "n");
    const b = computeAccessToken("k", "s", "1", "n");
    expect(a).toBe(b);
  });

  it("changes when any input changes (time/nonce must not be reusable)", () => {
    const base = computeAccessToken("k", "s", "1", "n");
    expect(computeAccessToken("k", "s", "2", "n")).not.toBe(base);
    expect(computeAccessToken("k", "s", "1", "m")).not.toBe(base);
  });
});

describe("hebrewMessageForCode / TRANZILA_SUCCESS_CODES", () => {
  it("treats 000 as success", () => {
    expect(TRANZILA_SUCCESS_CODES.has("000")).toBe(true);
    expect(hebrewMessageForCode("000")).toContain("אושר");
  });

  it("returns a Hebrew decline message for known decline codes", () => {
    expect(hebrewMessageForCode("015")).toContain("תוקף");
    expect(hebrewMessageForCode("447")).toContain("כרטיס");
  });

  it("falls back to a generic Hebrew message for unknown codes", () => {
    expect(hebrewMessageForCode("999999")).toBeTruthy();
    expect(hebrewMessageForCode(undefined)).toBeTruthy();
  });
});

describe("sanitizeForLog", () => {
  it("redacts long digit runs that look like a PAN", () => {
    const out = sanitizeForLog("card 4580458045804580 declined");
    expect(out).not.toContain("4580458045804580");
    expect(out).toContain("[redacted-pan]");
  });

  it("redacts a cvv field", () => {
    const out = sanitizeForLog('{"cvv":"123"}');
    expect(out).not.toContain("123");
  });

  it("truncates very long input", () => {
    const out = sanitizeForLog("x".repeat(10000));
    expect(out.length).toBeLessThanOrEqual(500);
  });
});
