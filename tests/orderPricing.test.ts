import { describe, it, expect } from "vitest";
import { priceOrder, type PriceableProduct } from "@/lib/orderPricing";

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
