import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
  notes: string;
}

interface BookingFlowState {
  selectedSlot: string | null;
  slotSelectedAt: number | null;
  setSelectedSlot: (slot: string | null) => void;

  eventTypeId: number | string | null;
  setEventTypeId: (id: number | string | null) => void;

  duration: number;
  setDuration: (mins: number) => void;

  locationAddress: string | null;
  setLocationAddress: (addr: string | null) => void;

  customerDetails: CustomerDetails;
  setCustomerDetails: (details: Partial<CustomerDetails>) => void;

  isDetailsValid: boolean;
  setIsDetailsValid: (valid: boolean) => void;

  isSubmitting: boolean;
  setIsSubmitting: (loading: boolean) => void;

  resetFlow: () => void;
  checkSlotFreshness: () => boolean;
}

const initialDetails: CustomerDetails = {
  name: "",
  email: "",
  phone: "",
  notes: "",
};

const SLOT_MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes hold window

export const useBookingFlowStore = create<BookingFlowState>()(
  persist(
    (set, get) => ({
      selectedSlot: null,
      slotSelectedAt: null,
      setSelectedSlot: (slot) =>
        set({
          selectedSlot: slot,
          slotSelectedAt: slot ? Date.now() : null,
        }),

      eventTypeId: null,
      setEventTypeId: (id) => set({ eventTypeId: id }),

      duration: 30,
      setDuration: (mins) => set({ duration: mins }),

      locationAddress: null,
      setLocationAddress: (addr) => set({ locationAddress: addr }),

      customerDetails: initialDetails,
      setCustomerDetails: (details) =>
        set((state) => ({
          customerDetails: { ...state.customerDetails, ...details },
        })),

      isDetailsValid: false,
      setIsDetailsValid: (valid) => set({ isDetailsValid: valid }),

      isSubmitting: false,
      setIsSubmitting: (loading) => set({ isSubmitting: loading }),

      // Verify slot hasn't lapsed or expired
      checkSlotFreshness: () => {
        const { selectedSlot, slotSelectedAt } = get();
        if (!selectedSlot) return false;

        const isPast = new Date(selectedSlot).getTime() <= Date.now();
        const isStale =
          slotSelectedAt !== null &&
          Date.now() - slotSelectedAt > SLOT_MAX_AGE_MS;

        if (isPast || isStale) {
          set({ selectedSlot: null, slotSelectedAt: null });
          return false;
        }

        return true;
      },

      resetFlow: () =>
        set({
          selectedSlot: null,
          slotSelectedAt: null,
          eventTypeId: null,
          duration: 30,
          locationAddress: null,
          customerDetails: initialDetails,
          isDetailsValid: false,
          isSubmitting: false,
        }),
    }),
    {
      name: "booking-flow-store",
      version: 1,
      // Only persist customer form details; slot and UI state remain ephemeral
      partialize: (state) => ({
        customerDetails: state.customerDetails,
      }),
    },
  ),
);
