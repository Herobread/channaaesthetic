import { MappedTreatment } from "@/api/useTreatments";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SelectedItem {
  treatment: MappedTreatment;
  quantity: number;
}

export const MAX_SESSION_MINUTES = 180;

interface CartStore {
  cart: SelectedItem[];
  handleIncrement: (treatment: MappedTreatment) => void;
  handleDecrement: (targetId: string) => void;
  swapVariation: (oldTargetId: string, newTreatment: MappedTreatment) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      cart: [],

      handleIncrement: (treatment) => {
        set((state) => {
          const targetKey = treatment.variationId || treatment.id;
          const existing = state.cart.find(
            (i) => (i.treatment.variationId || i.treatment.id) === targetKey,
          );

          const nextCart = existing
            ? state.cart.map((i) =>
                (i.treatment.variationId || i.treatment.id) === targetKey
                  ? { ...i, quantity: i.quantity + 1 }
                  : i,
              )
            : [...state.cart, { treatment, quantity: 1 }];

          return { cart: nextCart };
        });
      },

      handleDecrement: (targetId) => {
        set((state) => ({
          cart: state.cart
            .map((i) => {
              const isMatch =
                i.treatment.variationId === targetId ||
                i.treatment.id === targetId;

              return isMatch ? { ...i, quantity: i.quantity - 1 } : i;
            })
            .filter((i) => i.quantity > 0),
        }));
      },

      swapVariation: (oldTargetId, newTreatment) => {
        set((state) => ({
          cart: state.cart.map((item) => {
            const isMatch =
              item.treatment.variationId === oldTargetId ||
              item.treatment.id === oldTargetId;

            return isMatch ? { ...item, treatment: newTreatment } : item;
          }),
        }));
      },

      clearCart: () => set({ cart: [] }),
    }),
    {
      name: "clinic-cart",
      version: 4,
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
    swapVariation: store.swapVariation,
    clearCart: store.clearCart,
    totalQuantity,
    totalPrice,
    totalDeposit,
    totalMinutes,
    maxMinutes: MAX_SESSION_MINUTES,
    isOverLimit: totalMinutes > MAX_SESSION_MINUTES,
  };
}
