"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/lib/types";

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item, quantity = 1) => {
        const existing = get().items.find((row) => row.variantId === item.variantId);
        if (existing) {
          set({
            items: get().items.map((row) =>
              row.variantId === item.variantId
                ? { ...row, quantity: row.quantity + quantity }
                : row,
            ),
          });
          return;
        }
        set({ items: [...get().items, { ...item, quantity }] });
      },
      setQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          set({ items: get().items.filter((row) => row.variantId !== variantId) });
          return;
        }
        set({
          items: get().items.map((row) =>
            row.variantId === variantId ? { ...row, quantity } : row,
          ),
        });
      },
      removeItem: (variantId) =>
        set({ items: get().items.filter((row) => row.variantId !== variantId) }),
      clear: () => set({ items: [] }),
    }),
    { name: "trinity-styles-cart", skipHydration: true },
  ),
);
