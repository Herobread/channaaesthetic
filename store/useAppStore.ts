import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  selectedLocationId: string | null;
  setSelectedLocationId: (id: string | null) => void;
  // Keep setLocationId as an alias for backwards compatibility
  setLocationId: (id: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedLocationId: null,
      setSelectedLocationId: (id) => set({ selectedLocationId: id }),
      setLocationId: (id) => set({ selectedLocationId: id }),
    }),
    {
      name: "channa-app-storage",
      version: 2, // Incremented version to purge stale Wix IDs
      migrate: () => {
        // Reset cached location on version bump
        return { selectedLocationId: null };
      },
      partialize: (state) => ({ selectedLocationId: state.selectedLocationId }),
    },
  ),
);
