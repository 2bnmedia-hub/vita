import { describe, expect, it } from "vitest";
import { validateContact } from "../src/lib/contact";

const ok = { name: "ישראל ישראלי", email: "Test@Example.com ", phone: "", message: "שלום" };

describe("validateContact", () => {
  it("accepts a normal message and normalises fields", () => {
    const r = validateContact(ok);
    expect(r).toEqual({ ok: true, value: { name: "ישראל ישראלי", email: "test@example.com", phone: null, message: "שלום" } });
  });
  it("flags the honeypot as spam", () => {
    expect(validateContact({ ...ok, website: "http://x" })).toMatchObject({ ok: false, spam: true });
  });
  it.each([
    ["missing name", { ...ok, name: " " }],
    ["bad email", { ...ok, email: "a@b" }],
    ["email header injection", { ...ok, email: "a@b.com,c@d.com" }],
    ["bad phone", { ...ok, phone: "<script>" }],
    ["empty message", { ...ok, message: "" }],
    ["oversized message", { ...ok, message: "x".repeat(5001) }],
    ["non-string fields", { name: 1, email: {}, message: [] }],
    ["no body", null],
  ])("rejects %s", (_l, body) => {
    expect(validateContact(body).ok).toBe(false);
  });
});
