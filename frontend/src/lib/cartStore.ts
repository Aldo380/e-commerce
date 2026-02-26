import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  productId: string;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (productId, quantity) =>
        set((state) => {
          const existingItem = state.items.find((item) => item.productId === productId);
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.productId === productId ? { ...item, quantity: item.quantity + quantity } : item
              ),
            };
          }
          return { items: [...state.items, { productId, quantity }] };
        }),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        })),
      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items.map((item) => (item.productId === productId ? { ...item, quantity } : item)),
        })),
      clearCart: () => set({ items: [] }),
      getItemCount: () => {
        const state = get();
        return state.items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
