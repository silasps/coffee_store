"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  id: string;
  productId: string;
  productSlug: string;
  name: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  notes: string;
  modifiers: Record<string, string>;
};

type CartStore = {
  storeSlug: string | null;
  items: CartItem[];
  _hasHydrated: boolean;

  setStoreSlug: (slug: string) => void;
  addItem: (item: Omit<CartItem, "quantity" | "notes" | "modifiers"> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateNotes: (id: string, notes: string) => void;
  clearCart: () => void;
  _setHasHydrated: (v: boolean) => void;

  total: () => number;
  itemCount: () => number;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      storeSlug: null,
      items: [],
      _hasHydrated: false,

      setStoreSlug: (slug) => set({ storeSlug: slug }),
      _setHasHydrated: (v) => set({ _hasHydrated: v }),

      addItem: (item) => {
        const items = get().items;
        const existing = items.find((i) => i.productId === item.productId);

        if (existing) {
          set({
            items: items.map((i) =>
              i.productId === item.productId
                ? { ...i, quantity: i.quantity + (item.quantity ?? 1) }
                : i
            ),
          });
        } else {
          set({
            items: [
              ...items,
              {
                ...item,
                id: `${item.productId}-${Date.now()}`,
                quantity: item.quantity ?? 1,
                notes: "",
                modifiers: {},
              },
            ],
          });
        }
      },

      removeItem: (id) =>
        set({ items: get().items.filter((i) => i.id !== id) }),

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          set({ items: get().items.filter((i) => i.id !== id) });
          return;
        }
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, quantity } : i
          ),
        });
      },

      updateNotes: (id, notes) =>
        set({
          items: get().items.map((i) => (i.id === id ? { ...i, notes } : i)),
        }),

      clearCart: () => set({ items: [] }),

      total: () =>
        get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),

      itemCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: "cafe-at-cart",
      partialize: (state) => ({
        storeSlug: state.storeSlug,
        items: state.items,
      }),
      onRehydrateStorage: () => (state) => {
        state?._setHasHydrated(true);
      },
      storage: {
        getItem: (name) => {
          try {
            const value = localStorage.getItem(name);
            return value ? JSON.parse(value) : null;
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch {}
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch {}
        },
      },
    }
  )
);
