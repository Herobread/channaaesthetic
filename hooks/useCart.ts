"use client";

import { MappedTreatment } from "@/api/useTreatments";
import { useState } from "react";

export interface SelectedItem {
  treatment: MappedTreatment;
  quantity: number;
}

export function useCart() {
  const [cart, setCart] = useState<SelectedItem[]>([]);

  const handleIncrement = (treatment: MappedTreatment) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.treatment.id === treatment.id);
      if (existing) {
        return prev.map((i) =>
          i.treatment.id === treatment.id
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        );
      }
      return [...prev, { treatment, quantity: 1 }];
    });
  };

  const handleDecrement = (treatmentId: string) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.treatment.id === treatmentId
            ? { ...i, quantity: i.quantity - 1 }
            : i,
        )
        .filter((i) => i.quantity > 0),
    );
  };

  const clearCart = () => setCart([]);

  const totalQuantity = cart.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalPrice = cart.reduce(
    (acc, curr) => acc + curr.treatment.priceNum * curr.quantity,
    0,
  );

  return {
    cart,
    handleIncrement,
    handleDecrement,
    clearCart,
    totalQuantity,
    totalPrice,
  };
}
