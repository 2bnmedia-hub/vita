import { describe, it, expect } from "vitest";
import { priceOrder, type PriceableProduct, type CouponRule } from "@/lib/orderPricing";

const pct15: CouponRule = { percentOff: 15, amountOff: null, productId: null, minQuantity: 1 };

const products: PriceableProduct[] = [
  { id: "p1", name: "קריאטין רגיל", price: 89, in_stock: true, stock_quantity: null },
  { id: "p2", name: "מוצר אזל", price: 50, in_stock: false, stock_quantity: null },
  { id: "p3", name: "מוצר מוגבל", price: 30, in_stock: true, stock_quantity: 2 },
];

describe("priceOrder", () => {
  it("computes subtotal + shipping from DB prices, ignoring any client price", () => {
    const result = priceOrder([{ product_id: "p1", quantity: 2 } as any], products, "center");
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");
    expect(result.items).toEqual([{ product_id: "p1", name: "קריאטין רגיל", price: 89, quantity: 2 }]);
    expect(result.subtotal).toBe(178);
    expect(result.shipping).toBe(39);
    expect(result.total).toBe(217);
  });

  it("ignores a client-supplied price field entirely (server always re-derives from DB)", () => {
    const tampered = [{ product_id: "p1", quantity: 1, price: 1 } as any];
    const result = priceOrder(tampered, products, "pickup");
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");
    expect(result.total).toBe(89); // not 1
  });

  it("rejects an unknown product id", () => {
    const result = priceOrder([{ product_id: "ghost", quantity: 1 }], products, "center");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("unknown_product");
  });

  it("rejects zero/negative/non-integer quantity", () => {
    for (const quantity of [0, -1, 1.5]) {
      const result = priceOrder([{ product_id: "p1", quantity }], products, "center");
      expect(result.ok).toBe(false);
    }
  });

  it("rejects an out-of-stock product", () => {
    const result = priceOrder([{ product_id: "p2", quantity: 1 }], products, "center");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("out_of_stock");
  });

  it("rejects a quantity beyond tracked stock_quantity", () => {
    const result = priceOrder([{ product_id: "p3", quantity: 3 }], products, "center");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("insufficient_stock");
    if (result.error.code === "insufficient_stock") expect(result.error.available).toBe(2);
  });

  it("allows a quantity within tracked stock_quantity", () => {
    const result = priceOrder([{ product_id: "p3", quantity: 2 }], products, "center");
    expect(result.ok).toBe(true);
  });

  it("applies pickup shipping as free", () => {
    const result = priceOrder([{ product_id: "p1", quantity: 1 }], products, "pickup");
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");
    expect(result.shipping).toBe(0);
  });
});

describe("coupon discount", () => {
  it("takes the percentage off the products subtotal only — shipping is not discounted", () => {
    const result = priceOrder([{ product_id: "p1", quantity: 2 }], products, "center", pct15);
    if (!result.ok) throw new Error("unreachable");
    expect(result.subtotal).toBe(178);
    expect(result.discount).toBe(26.7);
    expect(result.shipping).toBe(39);
    expect(result.total).toBe(190.3); // 178 - 26.70 + 39
  });

  it("rounds the discount to a whole agora and the total stays exact", () => {
    const odd: PriceableProduct[] = [{ id: "o1", name: "odd", price: 94.99, in_stock: true, stock_quantity: null }];
    const result = priceOrder([{ product_id: "o1", quantity: 1 }], odd, "pickup", pct15);
    if (!result.ok) throw new Error("unreachable");
    expect(result.discount).toBe(14.25); // 14.2485 → 14.25
    expect(result.total).toBe(80.74);
    expect(Number.isInteger(Math.round(result.total * 100))).toBe(true);
  });

  it("no coupon means no discount", () => {
    const result = priceOrder([{ product_id: "p1", quantity: 1 }], products, "pickup");
    if (!result.ok) throw new Error("unreachable");
    expect(result.discount).toBe(0);
    expect(result.total).toBe(89);
  });
});

describe("NIMRY21 — 155 ₪ off with 3+ chewable creatine boxes", () => {
  const CHEW = "88c99155-29a8-42aa-85fa-d7f05eba4fcb";
  const catalog: PriceableProduct[] = [
    { id: CHEW, name: "קריאטין טבליות לעיסה", price: 155, in_stock: true, stock_quantity: null },
    { id: "other", name: "קריאטין ענבים", price: 94, in_stock: true, stock_quantity: null },
  ];
  const nimry21: CouponRule = { percentOff: null, amountOff: 155, productId: CHEW, minQuantity: 3 };
  const price = (lines: { product_id: string; quantity: number }[], rule: CouponRule | null = nimry21) => {
    const r = priceOrder(lines, catalog, "pickup", rule);
    if (!r.ok) throw new Error("unreachable");
    return r;
  };

  it("3 boxes without the coupon = 465, no automatic discount", () => {
    const r = price([{ product_id: CHEW, quantity: 3 }], null);
    expect(r.discount).toBe(0);
    expect(r.total).toBe(465);
  });

  it("3 boxes with the coupon = 310", () => {
    const r = price([{ product_id: CHEW, quantity: 3 }]);
    expect(r.subtotal).toBe(465);
    expect(r.discount).toBe(155);
    expect(r.total).toBe(310);
  });

  it("1 or 2 boxes get no discount", () => {
    for (const quantity of [1, 2]) expect(price([{ product_id: CHEW, quantity }]).discount).toBe(0);
  });

  it("more than 3 boxes still get exactly 155 off", () => {
    for (const quantity of [4, 6, 9]) {
      const r = price([{ product_id: CHEW, quantity }]);
      expect(r.discount).toBe(155);
      expect(r.total).toBe(155 * quantity - 155);
    }
  });

  it("other products neither count toward the 3 nor get discounted", () => {
    expect(price([{ product_id: CHEW, quantity: 2 }, { product_id: "other", quantity: 5 }]).discount).toBe(0);
    const mixed = price([{ product_id: CHEW, quantity: 3 }, { product_id: "other", quantity: 2 }]);
    expect(mixed.subtotal).toBe(465 + 188);
    expect(mixed.discount).toBe(155);
    expect(mixed.total).toBe(465 + 188 - 155);
  });

  it("shipping is added on top, never discounted", () => {
    const r = priceOrder([{ product_id: CHEW, quantity: 3 }], catalog, "center", nimry21);
    if (!r.ok) throw new Error("unreachable");
    expect(r.total).toBe(310 + r.shipping);
  });
});
