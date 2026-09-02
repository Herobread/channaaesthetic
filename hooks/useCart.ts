import { MappedTreatment } from "@/api/useTreatments";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SelectedItem {
  treatment: MappedTreatment;
  quantity: number;
}

interface CartStore {
  cart: SelectedItem[];
  handleIncrement: (treatment: MappedTreatment) => void;
  handleDecrement: (treatmentId: string) => void;
  clearCart: () => void;
}

// 1. The pure state (safe for JSON persistence)
export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      cart: [],
      handleIncrement: (treatment) => {
        set((state) => {
          const existing = state.cart.find(
            (i) => i.treatment.id === treatment.id,
          );
          const newCart = existing
            ? state.cart.map((i) =>
                i.treatment.id === treatment.id
                  ? { ...i, quantity: i.quantity + 1 }
                  : i,
              )
            : [...state.cart, { treatment, quantity: 1 }];
          return { cart: newCart };
        });
      },
      handleDecrement: (treatmentId) => {
        set((state) => {
          const newCart = state.cart
            .map((i) =>
              i.treatment.id === treatmentId
                ? { ...i, quantity: i.quantity - 1 }
                : i,
            )
            .filter((i) => i.quantity > 0);
          return { cart: newCart };
        });
      },
      clearCart: () => set({ cart: [] }),
    }),
    { name: "clinic-cart" },
  ),
);

// 2. The wrapper hook that computes derived totals dynamically
export function useCart() {
  const store = useCartStore();

  const totalQuantity = store.cart.reduce(
    (acc, curr) => acc + curr.quantity,
    0,
  );
  const totalPrice = store.cart.reduce(
    (acc, curr) => acc + curr.treatment.priceNum * curr.quantity,
    0,
  );

  return {
    cart: store.cart,
    handleIncrement: store.handleIncrement,
    handleDecrement: store.handleDecrement,
    clearCart: store.clearCart,
    totalQuantity,
    totalPrice,
  };
}
