import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { classifyPayment, type TrackedTransaction } from "@/lib/tranzila";

const tx = (over: Partial<TrackedTransaction> = {}): TrackedTransaction => ({
  index: "97588",
  amount: "184",
  currency: "ILS",
  authorization_number: "0123456",
  transtatus: "0",
  ...over,
});

describe("classifyPayment", () => {
  it("approves only a Tranzila-side record with a success status and the order's amount", () => {
    expect(classifyPayment(tx(), 184)).toBe("approved");
    expect(classifyPayment(tx({ amount: "184.00", transtatus: "000" }), "184.00")).toBe("approved");
  });

  it("declines when Tranzila's own record carries a failing status", () => {
    expect(classifyPayment(tx({ transtatus: "004" }), 184, "000")).toBe("declined");
  });

  it("never approves from the browser-reported code alone (the production bug)", () => {
    expect(classifyPayment(null, 184, "000")).toBe("unconfirmed");
  });

  it("no record + no reported code (lookup lag / timeout) is unconfirmed, not failed", () => {
    expect(classifyPayment(null, 184)).toBe("unconfirmed");
    expect(classifyPayment(null, 184, null)).toBe("unconfirmed");
  });

  it("no record + a reported decline code is a decline", () => {
    expect(classifyPayment(null, 184, "004")).toBe("declined");
  });

  it("an approved record for a different amount is unconfirmed — charged, but not this order's price", () => {
    expect(classifyPayment(tx({ amount: "1" }), 184)).toBe("unconfirmed");
  });

  it("a record with no status at all is unconfirmed", () => {
    expect(classifyPayment(tx({ transtatus: undefined as unknown as string }), 184)).toBe("unconfirmed");
  });
});

// ---- /api/checkout/verify against an in-memory orders table ----------------

const h = vi.hoisted(() => {
  process.env.TRANZILA_WEBHOOK_SECRET = "test-secret";
  return {
    order: {} as Record<string, any>,
    claimed: new Set<string>(),
    stock: 10,
    failConfirm: false,
    lookup: vi.fn(),
    notify: vi.fn(async () => {}),
  };
});

vi.mock("@/lib/orderNotify", () => ({ notifyOrderPaid: h.notify }));

vi.mock("@/lib/tranzila", async (orig) => ({
  ...(await orig<typeof import("@/lib/tranzila")>()),
  tranzilaEnv: () => "test",
  lookupTransactionWithRetry: h.lookup,
}));

// Mirrors the real DB contract: confirm_tranzila_payment claims the
// transaction id once and only moves a *pending* order to paid;
// mark_tranzila_payment_failed only touches a *pending* order.
vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { ...h.order } }) }) }),
      update: (patch: Record<string, any>) => ({
        eq: () => ({
          eq: async (_col: string, requiredStatus: string) => {
            if (h.order.payment_status === requiredStatus) Object.assign(h.order, patch);
            return { error: null };
          },
        }),
      }),
    }),
    rpc: async (name: string, args: Record<string, any>) => {
      if (name === "mark_tranzila_payment_failed") {
        if (h.order.payment_status === "pending") {
          h.order.payment_status = "payment_failed";
          h.order.last_payment_error = args.p_error;
        }
        return { data: null, error: null };
      }
      if (h.failConfirm) return { data: null, error: { message: "db down" } };
      if (h.claimed.has(args.p_transaction_id)) return { data: false, error: null };
      h.claimed.add(args.p_transaction_id);
      if (h.order.payment_status !== "pending") return { data: false, error: null };
      h.order.payment_status = "paid";
      h.stock -= 1;
      return { data: true, error: null };
    },
  },
}));

import { POST as verify } from "@/app/api/checkout/verify/route";

const call = async (body: Record<string, unknown> = {}) => {
  const res = await verify(
    new NextRequest("https://shop.test/api/checkout/verify", {
      method: "POST",
      body: JSON.stringify({ orderId: "o1", transactionId: "97588", processorCode: "000", ...body }),
    })
  );
  return { status: res.status, body: await res.json() };
};

describe("POST /api/checkout/verify", () => {
  beforeEach(() => {
    h.order = { id: "o1", total: "184.00", payment_status: "pending", payment_attempts: 0, last_payment_error: null };
    h.claimed.clear();
    h.stock = 10;
    h.failConfirm = false;
    h.lookup.mockReset();
    h.notify.mockClear();
  });

  it("success: confirmed record → paid, one email, one stock decrement", async () => {
    h.lookup.mockResolvedValue(tx());
    const r = await call();
    expect(r.body.ok).toBe(true);
    expect(h.order.payment_status).toBe("paid");
    expect(h.notify).toHaveBeenCalledTimes(1);
    expect(h.stock).toBe(9);
  });

  it("decline: failing record → payment_failed with a decline message, not a success message", async () => {
    h.lookup.mockResolvedValue(tx({ transtatus: "004" }));
    const r = await call({ processorCode: "004" });
    expect(r.body.ok).toBe(false);
    expect(r.body.pending).toBeUndefined();
    expect(r.body.message).not.toContain("אושר");
    expect(h.order.payment_status).toBe("payment_failed");
  });

  it("production bug: browser says 000 but no record → pending, never 'failed' + success text", async () => {
    h.lookup.mockResolvedValue(null);
    const r = await call();
    expect(r.body).toMatchObject({ ok: false, pending: true });
    expect(r.body.message).toContain("אין לבצע תשלום נוסף");
    expect(r.body.message).not.toContain("אושר בהצלחה");
    expect(h.order.payment_status).toBe("pending");
    expect(h.order.last_payment_error).toContain("verify_unconfirmed transactionId=97588");
    expect(h.notify).not.toHaveBeenCalled();
  });

  it("timeout: lookup throws → pending, order untouched apart from the trace", async () => {
    h.lookup.mockRejectedValue(new Error("fetch failed"));
    const r = await call();
    expect(r.status).toBe(502);
    expect(r.body).toMatchObject({ ok: false, pending: true });
    expect(h.order.payment_status).toBe("pending");
    expect(h.order.last_payment_error).toContain("verify_lookup_error");
  });

  it("duplicate callback: second verify of a paid order is a no-op success", async () => {
    h.lookup.mockResolvedValue(tx());
    await call();
    const again = await call();
    expect(again.body.ok).toBe(true);
    expect(h.notify).toHaveBeenCalledTimes(1);
    expect(h.stock).toBe(9);
    expect(h.lookup).toHaveBeenCalledTimes(1);
  });

  it("out of order: status re-check after 'unconfirmed' confirms once the record appears", async () => {
    h.lookup.mockResolvedValueOnce(null).mockResolvedValueOnce(tx());
    expect((await call()).body.pending).toBe(true);
    const later = await call();
    expect(later.body.ok).toBe(true);
    expect(h.order.payment_status).toBe("paid");
    expect(h.stock).toBe(9);
  });

  it("out of order: a late 'no record' answer cannot pull a paid order back", async () => {
    h.order.payment_status = "paid";
    h.lookup.mockResolvedValue(null);
    const r = await call();
    expect(r.body.ok).toBe(true);
    expect(h.order.payment_status).toBe("paid");
  });

  it("save failure after approval: reported as pending, not as a failed payment", async () => {
    h.lookup.mockResolvedValue(tx());
    h.failConfirm = true;
    const r = await call();
    expect(r.status).toBe(500);
    expect(r.body).toMatchObject({ ok: false, pending: true });
    expect(r.body.message).toContain("אין לבצע תשלום נוסף");
    expect(h.order.payment_status).toBe("pending");
    expect(h.notify).not.toHaveBeenCalled();
  });
});
