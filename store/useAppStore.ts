import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  // Generic location state
  selectedLocationId: string | null;
  setLocationId: (id: string) => void;

  // Future proofing: You can easily add cart or user state here later
  // cart: SelectedItem[];
  // clearCart: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedLocationId: null,
      setLocationId: (id) => set({ selectedLocationId: id }),
    }),
    {
      name: "channa-app-storage", // The key used in localStorage
      // Only save specific fields to local storage so we don't cache stale data
      partialize: (state) => ({ selectedLocationId: state.selectedLocationId }),
    },
  ),
);
