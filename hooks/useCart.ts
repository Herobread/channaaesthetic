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
            (i) => i.treatment.id === treatment.id,
          );

          const nextCart = existing
            ? state.cart.map((i) =>
                i.treatment.id === treatment.id
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
            .map((i) =>
              i.treatment.id === treatmentId
                ? { ...i, quantity: i.quantity - 1 }
                : i,
            )
            .filter((i) => i.quantity > 0),
        }));
      },

      clearCart: () => set({ cart: [] }),
    }),
    { name: "clinic-cart" },
  ),
);

export function useCart() {
  const store = useCartStore();

  const totalQuantity = store.cart.reduce(
    (acc, curr) => acc + curr.quantity,
    0,
  );

  const totalPrice = store.cart.reduce(
    (acc, curr) => acc + (curr.treatment.priceNum || 0) * curr.quantity,
    0,
  );

  const totalMinutes = store.cart.reduce(
    (acc, curr) => acc + (curr.treatment.durationMinutes || 30) * curr.quantity,
    0,
  );

  const totalDeposit = store.cart.reduce((acc, curr) => {
    const depositRaw = curr.treatment.deposit;
    const depVal =
      typeof depositRaw === "number"
        ? depositRaw
        : parseFloat(String(depositRaw || "").replace(/[^0-9.]/g, "")) || 0;

    return acc + depVal * curr.quantity;
  }, 0);

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
