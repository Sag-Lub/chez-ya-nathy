"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  /** Clé composite unique : dishId + combo options (ex: "uuid_fort_optId1_optId2") */
  id: string;
  /** UUID réel du plat dans Supabase — nécessaire pour la vérification serveur */
  dishId: string;
  slug: string;
  name: string;
  /** Prix unitaire en centimes (base + options sélectionnées) */
  priceCents: number;
  quantity: number;
  /** IDs des dish_options sélectionnés — pour recalcul côté serveur */
  selectedOptionIds?: string[];
  /** Photo du plat — affichage uniquement, jamais envoyée au serveur */
  imageUrl?: string | null;
  /** Labels lisibles pour l'affichage dans le panier */
  options?: Record<string, string>;
  /** Plat disponible uniquement le week-end (précommande) — affichage uniquement */
  weekendOnly?: boolean;
};

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalCents: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === item.id
                  ? { ...i, quantity: i.quantity + (item.quantity ?? 1) }
                  : i
              ),
            };
          }
          return {
            items: [...state.items, { ...item, quantity: item.quantity ?? 1 }],
          };
        });
      },

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalCents: () =>
        get().items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0),
    }),
    { name: "nathy-food-cart" }
  )
);
