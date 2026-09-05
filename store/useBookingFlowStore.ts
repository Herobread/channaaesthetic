import { create } from "zustand";

export interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
  notes: string;
}

interface BookingFlowState {
  selectedSlot: string | null;
  setSelectedSlot: (slot: string | null) => void;

  eventTypeId: number | string | null;
  setEventTypeId: (id: number | string | null) => void;

  duration: number;
  setDuration: (mins: number) => void;

  locationAddress: string | null;
  setLocationAddress: (addr: string | null) => void;

  customerDetails: CustomerDetails;
  setCustomerDetails: (details: Partial<CustomerDetails>) => void;

  isSubmitting: boolean;
  setIsSubmitting: (loading: boolean) => void;

  resetFlow: () => void;
}

const initialDetails: CustomerDetails = {
  name: "",
  email: "",
  phone: "",
  notes: "",
};

export const useBookingFlowStore = create<BookingFlowState>((set) => ({
  selectedSlot: null,
  setSelectedSlot: (slot) => set({ selectedSlot: slot }),

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

  isSubmitting: false,
  setIsSubmitting: (loading) => set({ isSubmitting: loading }),

  resetFlow: () =>
    set({
      selectedSlot: null,
      eventTypeId: null,
      duration: 30,
      locationAddress: null,
      customerDetails: initialDetails,
      isSubmitting: false,
    }),
}));
