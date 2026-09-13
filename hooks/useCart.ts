import { MappedTreatment } from "@/api/useTreatments";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SelectedItem {
  treatment: MappedTreatment;
  quantity: number;
}

export const MAX_SESSION_MINUTES = 180; // 3 hours

interface CartStore {
  cart: SelectedItem[];
  handleIncrement: (treatment: MappedTreatment) => void;
  handleDecrement: (treatmentId: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      cart: [],

      handleIncrement: (treatment) => {
        set((state) => {
          const existing = state.cart.find(
            (i) =>
              i.treatment.id === treatment.id ||
              (treatment.variationId &&
                i.treatment.variationId === treatment.variationId),
          );

          const nextCart = existing
            ? state.cart.map((i) =>
                i.treatment.id === treatment.id ||
                (treatment.variationId &&
                  i.treatment.variationId === treatment.variationId)
                  ? { ...i, quantity: i.quantity + 1 }
                  : i,
              )
            : [...state.cart, { treatment, quantity: 1 }];

          return { cart: nextCart };
        });
      },

      handleDecrement: (treatmentId) => {
        set((state) => ({
          cart: state.cart
            .map((i) => {
              const isMatch =
                i.treatment.id === treatmentId ||
                i.treatment.variationId === treatmentId;

              return isMatch ? { ...i, quantity: i.quantity - 1 } : i;
            })
            .filter((i) => i.quantity > 0),
        }));
      },

      clearCart: () => set({ cart: [] }),
    }),
    {
      name: "clinic-cart",
      version: 2, // Bumps version so old carts lacking the new deposit attribute are wiped
      migrate: () => ({ cart: [] }),
    },
  ),
);

export function useCart() {
  const store = useCartStore();

  const totalQuantity = store.cart.reduce(
    (acc, curr) => acc + (Number(curr.quantity) || 1),
    0,
  );

  const totalPrice = store.cart.reduce(
    (acc, curr) =>
      acc + (Number(curr.treatment?.price) || 0) * (Number(curr.quantity) || 1),
    0,
  );

  const totalMinutes = store.cart.reduce(
    (acc, curr) =>
      acc +
      (Number(curr.treatment?.durationMinutes) || 30) *
        (Number(curr.quantity) || 1),
    0,
  );

  const totalDeposit = store.cart.reduce(
    (acc, curr) =>
      acc +
      (Number(curr.treatment?.deposit) || 0) * (Number(curr.quantity) || 1),
    0,
  );

  return {
    cart: store.cart,
    handleIncrement: store.handleIncrement,
    handleDecrement: store.handleDecrement,
    clearCart: store.clearCart,
    totalQuantity,
    totalPrice,
    totalDeposit,
    totalMinutes,
    maxMinutes: MAX_SESSION_MINUTES,
    isOverLimit: totalMinutes > MAX_SESSION_MINUTES,
  };
}
