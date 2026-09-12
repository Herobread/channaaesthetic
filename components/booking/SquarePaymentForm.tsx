"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

declare global {
  interface Window {
    Square?: any;
  }
}

export interface PaymentFormHandle {
  tokenize: () => Promise<string>;
}

interface Props {
  depositAmount: number;
}

export const SquarePaymentForm = forwardRef<PaymentFormHandle, Props>(
  ({ depositAmount }, ref) => {
    const cardInstanceRef = useRef<any>(null);

    useEffect(() => {
      let isMounted = true;

      async function initPayment() {
        if (!window.Square) return;

        try {
          const payments = window.Square.payments(
            process.env.NEXT_PUBLIC_NEXT_PUBLIC_SQUARE_APP_ID!,
            process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!,
          );

          const card = await payments.card({
            style: {
              input: {
                color: "#1A1A1A",
                fontSize: "13px",
              },
              "input::placeholder": {
                color: "#8C827A",
              },
            },
          });

          await card.attach("#card-container");

          if (isMounted) {
            cardInstanceRef.current = card;
          }
        } catch (e) {
          console.error("Square card container init error:", e);
        }
      }

      initPayment();

      return () => {
        isMounted = false;
        if (cardInstanceRef.current) {
          cardInstanceRef.current.destroy();
        }
      };
    }, []);

    useImperativeHandle(ref, () => ({
      tokenize: async () => {
        if (!cardInstanceRef.current) {
          throw new Error("Payment card form is not initialized.");
        }
        const result = await cardInstanceRef.current.tokenize();
        if (result.status === "OK") {
          return result.token;
        } else {
          const firstError =
            result.errors?.[0]?.message || "Card verification failed";
          throw new Error(firstError);
        }
      },
    }));

    return (
      <div className="bg-white border border-[#EBE5DF] rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-[#F4EFEA]">
          <span className="text-xs font-semibold text-[#1A1A1A]">
            Non-Refundable Deposit: £{depositAmount}
          </span>
          <span className="text-[10px] uppercase font-bold text-[#B8925D] bg-[#B8925D]/10 px-2 py-0.5 rounded-md">
            Secures Booking
          </span>
        </div>
        <p className="text-[11px] text-[#8C827A] leading-relaxed">
          A non-refundable deposit of £{depositAmount} is charged immediately to
          reserve this slot. The remainder is due at your consultation.
        </p>
        <div id="card-container" className="min-h-[90px] pt-1" />
      </div>
    );
  },
);

SquarePaymentForm.displayName = "SquarePaymentForm";
