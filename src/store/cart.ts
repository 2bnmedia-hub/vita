"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartState, Product, ShippingRegion } from "@/types";
import { SHIPPING_COST, SHIPPING_LABEL } from "@/lib/shipping";
import { couponDiscount } from "@/lib/orderPricing";

export { SHIPPING_COST, SHIPPING_LABEL };

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      shippingRegion: "center",
      coupon: null,

      setCoupon: (coupon) => set({ coupon }),

      setShippingRegion: (region: ShippingRegion) => set({ shippingRegion: region }),

      addItem: (product: Product, qty: number = 1) => {
        const items = get().items;
        const existing = items.find((i) => i.product.id === product.id);
        if (existing) {
          set({
            items: items.map((i) =>
              i.product.id === product.id
                ? { ...i, quantity: i.quantity + qty }
                : i
            ),
            isOpen: true,
          });
        } else {
          set({ items: [...items, { product, quantity: qty }], isOpen: true });
        }
      },

      removeItem: (productId: string) => {
        set({ items: get().items.filter((i) => i.product.id !== productId) });
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.product.id === productId ? { ...i, quantity } : i
          ),
        });
      },

      clearCart: () => set({ items: [], coupon: null }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
    }),
    {
      name: "vform-cart",
      partialize: (state) => ({ items: state.items, shippingRegion: state.shippingRegion }),
    }
  )
);

// Selectors — use these instead of destructuring total/itemCount directly
export const selectTotal = (state: CartState) =>
  state.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

export const selectItemCount = (state: CartState) =>
  state.items.reduce((sum, item) => sum + item.quantity, 0);

/** Subtotal − coupon discount + shipping, recomputed on every cart change. */
export function useCartTotals() {
  const items = useCartStore((s) => s.items);
  const coupon = useCartStore((s) => s.coupon);
  const region = useCartStore((s) => s.shippingRegion);
  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const lines = items.map((i) => ({ product_id: i.product.id, price: i.product.price, quantity: i.quantity }));
  const discount = couponDiscount(lines, coupon?.rule ?? null);
  const shipping = SHIPPING_COST[region];
  return { subtotal, discount, shipping, region, coupon, total: Math.round((subtotal - discount + shipping) * 100) / 100 };
}
