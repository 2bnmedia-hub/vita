import { SHIPPING_COST } from "@/lib/shipping";
import type { ShippingRegion } from "@/types";

export interface PriceableProduct {
  id: string;
  name: string;
  price: number;
  in_stock: boolean;
  stock_quantity?: number | null;
}

export interface RequestedItem {
  product_id: string;
  quantity: number;
}

export interface PricedItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
}

export type PricingError =
  | { code: "unknown_product" }
  | { code: "invalid_quantity" }
  | { code: "out_of_stock"; productName: string }
  | { code: "insufficient_stock"; productName: string; available: number };

export type PricingResult =
  | { ok: true; items: PricedItem[]; subtotal: number; shipping: number; discount: number; total: number }
  | { ok: false; error: PricingError };

/** Coupon terms as stored in `coupons` (one of percentOff / amountOff is set). */
export interface CouponRule {
  percentOff: number | null;
  amountOff: number | null;
  /** null = every product counts and is discounted. */
  productId: string | null;
  /** Units of the eligible product(s) the cart must hold. */
  minQuantity: number;
}

export interface DiscountLine {
  product_id: string;
  price: number;
  quantity: number;
}

/**
 * Discount on the eligible products only (shipping is never discounted),
 * in whole agorot, never more than the eligible lines are worth. 0 when the
 * cart holds fewer than minQuantity eligible units. Shared by the server
 * pricing below and the cart/checkout summary so both show the same number.
 */
export function couponDiscount(lines: DiscountLine[], rule: CouponRule | null): number {
  if (!rule) return 0;
  const eligible = rule.productId ? lines.filter((l) => l.product_id === rule.productId) : lines;
  const qty = eligible.reduce((n, l) => n + l.quantity, 0);
  if (qty === 0 || qty < rule.minQuantity) return 0;
  const base = Math.round(eligible.reduce((s, l) => s + l.price * l.quantity, 0) * 100);
  const off = rule.amountOff != null ? Math.round(rule.amountOff * 100) : Math.round((base * (rule.percentOff ?? 0)) / 100);
  return Math.min(off, base) / 100;
}

/**
 * Server-side source of truth for order pricing. Never trust price/quantity
 * sent by the client — only product_id + quantity are taken from it, and
 * every price/stock check is re-derived from `products` (the DB rows).
 */
export function priceOrder(
  requested: RequestedItem[],
  products: PriceableProduct[],
  shippingRegion: ShippingRegion,
  coupon: CouponRule | null = null
): PricingResult {
  const byId = new Map(products.map((p) => [p.id, p]));
  const items: PricedItem[] = [];
  let subtotal = 0;

  for (const raw of requested) {
    const qty = Number(raw.quantity);
    const product = byId.get(String(raw.product_id));
    if (!product) return { ok: false, error: { code: "unknown_product" } };
    if (!Number.isInteger(qty) || qty < 1) return { ok: false, error: { code: "invalid_quantity" } };
    if (!product.in_stock) return { ok: false, error: { code: "out_of_stock", productName: product.name } };
    if (product.stock_quantity != null && product.stock_quantity < qty) {
      return { ok: false, error: { code: "insufficient_stock", productName: product.name, available: product.stock_quantity } };
    }
    const price = Number(product.price);
    subtotal += price * qty;
    items.push({ product_id: product.id, name: product.name, price, quantity: qty });
  }

  const shipping = SHIPPING_COST[shippingRegion];
  const discount = couponDiscount(items, coupon);
  const total = Math.round((subtotal - discount + shipping) * 100) / 100;
  return { ok: true, items, subtotal, shipping, discount, total };
}
