import { create } from "zustand";

interface BookingFlowState {
  // DateTime & Form data
  selectedSlot: string | null;
  setSelectedSlot: (slot: string | null) => void;

  customerDetails: {
    name: string;
    email: string;
    phone: string;
    notes: string;
  };
  setCustomerDetails: (
    details: Partial<BookingFlowState["customerDetails"]>,
  ) => void;

  // Submission signals
  isSubmitting: boolean;
  setIsSubmitting: (loading: boolean) => void;

  // Reset helper
  resetFlow: () => void;
}

const initialDetails = { name: "", email: "", phone: "", notes: "" };

export const useBookingFlowStore = create<BookingFlowState>((set) => ({
  selectedSlot: null,
  setSelectedSlot: (slot) => set({ selectedSlot: slot }),

  customerDetails: initialDetails,
  setCustomerDetails: (details) =>
    set((state) => ({
      customerDetails: { ...state.customerDetails, ...details },
    })),

  isSubmitting: false,
  setIsSubmitting: (loading) => set({ isSubmitting: loading }),

  resetFlow: () =>
    set({
      selectedSlot: null,
      customerDetails: initialDetails,
      isSubmitting: false,
    }),
}));
