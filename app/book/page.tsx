"use client";

import { useInfiniteTreatments, useLocations } from "@/api/useTreatments";
import CheckoutBar from "@/components/booking/CheckoutBar";
import SearchCategoryDock from "@/components/booking/SearchCategoryDock";
import TreatmentCard from "@/components/booking/TreatmentCard";
import NavBarLogoOnly from "@/components/ui/NavBarLogoOnly";
import { useCart } from "@/hooks/useCart";
import { useAppStore } from "@/store/useAppStore";
import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export default function BookingPage() {
  const {
    treatments = [],
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteTreatments();

  const { locations } = useLocations();
  const { cart, handleIncrement, handleDecrement, totalQuantity, totalPrice } =
    useCart();

  const selectedLocationId = useAppStore((state) => state.selectedLocationId);
  const setSelectedLocationId = useAppStore(
    (state) => state.setSelectedLocationId,
  );

  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // FIX: Guard against unnecessary updates
  useEffect(() => {
    if (locations.length === 0) return;

    const isValid = locations.some((loc) => loc.id === selectedLocationId);

    // Only update if current ID is null or genuinely invalid,
    // AND make sure we don't re-set to the exact same value
    if (
      !isValid &&
      locations[0]?.id &&
      selectedLocationId !== locations[0].id
    ) {
      setSelectedLocationId(locations[0].id);
    }
  }, [locations, selectedLocationId, setSelectedLocationId]);

  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "250px" },
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const categories = useMemo(() => {
    const cats = Array.from(
      new Set(treatments.map((t) => t.category).filter(Boolean)),
    );
    return ["All", ...cats];
  }, [treatments]);

  const filteredTreatments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return treatments.filter((item) => {
      const matchesCategory =
        activeCategory === "All" || item.category === activeCategory;

      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.desc.toLowerCase().includes(query);

      const matchesLocation =
        !selectedLocationId ||
        item.locationIds.length === 0 ||
        item.locationIds.includes(selectedLocationId);

      return matchesCategory && matchesSearch && matchesLocation;
    });
  }, [treatments, activeCategory, searchQuery, selectedLocationId]);

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1A1A1A] font-sans antialiased selection:bg-[#B8925D]/20 selection:text-[#B8925D]">
      <NavBarLogoOnly theme="dark" />

      <header className="pt-24 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-medium text-[#1A1A1A]">
              Select Your Treatments
            </h1>
            <p className="text-xs sm:text-sm text-[#666666] font-light">
              Doctor-led clinical appointments • Add multiple procedures as
              needed
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pb-36 space-y-4">
        <SearchCategoryDock
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        {isLoading && (
          <div className="py-24 flex flex-col items-center justify-center text-[#8C827A] gap-2.5">
            <Loader2 className="w-6 h-6 animate-spin text-[#B8925D]" />
            <span className="text-xs font-medium tracking-wide">
              Loading live treatment menu...
            </span>
          </div>
        )}

        {isError && (
          <div className="py-16 text-center bg-white rounded-2xl border border-red-200 p-8 space-y-3">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-50 text-red-600 mb-1">
              <AlertCircle className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-[#1A1A1A]">
              Failed to load treatments
            </p>
            <p className="text-xs text-[#666666] max-w-sm mx-auto">
              {(error as Error)?.message || "An unexpected error occurred."}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-2 text-xs font-medium text-[#B8925D] hover:underline cursor-pointer"
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !isError && filteredTreatments.length === 0 && (
          <div className="py-16 text-center text-sm text-[#8C827A] bg-white rounded-2xl border border-[#EBE5DF] p-8 space-y-2">
            <p className="font-medium text-[#1A1A1A]">No treatments found</p>
            <p className="text-xs">
              Try adjusting your search query, selecting another category, or
              switching locations.
            </p>
          </div>
        )}

        {!isLoading && !isError && filteredTreatments.length > 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {filteredTreatments.map((treatment) => {
                const cartItem = cart.find(
                  (i) => i.treatment.id === treatment.id,
                );
                return (
                  <TreatmentCard
                    key={treatment.id}
                    treatment={treatment}
                    quantity={cartItem?.quantity || 0}
                    onIncrement={handleIncrement}
                    onDecrement={handleDecrement}
                  />
                );
              })}
            </div>

            <div
              ref={loadMoreRef}
              className="py-6 flex justify-center items-center"
            >
              {isFetchingNextPage && (
                <div className="flex items-center gap-2 text-xs text-[#8C827A]">
                  <Loader2 className="w-4 h-4 animate-spin text-[#B8925D]" />
                  <span>Loading more treatments...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <CheckoutBar
        cart={cart}
        totalQuantity={totalQuantity}
        totalPrice={totalPrice}
        onIncrement={handleIncrement}
        onDecrement={handleDecrement}
      />
    </div>
  );
}
