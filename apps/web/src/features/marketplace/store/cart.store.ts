import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { IProduct } from '@petverse/shared-types';

export interface CartItem {
  product: IProduct;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: IProduct, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalCount: () => number;
  getTotalPrice: () => number;
}

export const useMarketplaceCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isCartOpen: false,

      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),

      addItem: (product, quantity = 1) => {
        set((state) => {
          const existingIndex = state.items.findIndex((i) => i.product._id === product._id);
          if (existingIndex > -1) {
            const updated = [...state.items];
            const newQty = Math.min(product.stock, updated[existingIndex].quantity + quantity);
            updated[existingIndex].quantity = newQty;
            return { items: updated, isCartOpen: true };
          }
          return {
            items: [...state.items, { product, quantity: Math.min(product.stock, quantity) }],
            isCartOpen: true,
          };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.product._id !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.product._id === productId
              ? { ...i, quantity: Math.min(i.product.stock, quantity) }
              : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotalCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getTotalPrice: () => {
        const sum = get().items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
        return Math.round(sum * 100) / 100;
      },
    }),
    {
      name: 'petverse-marketplace-cart',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
