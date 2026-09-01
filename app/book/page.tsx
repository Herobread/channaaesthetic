"use client";

import {
  MappedTreatment,
  useLocations,
  useTreatments,
} from "@/api/useTreatments";
import NavBarLogoOnly from "@/components/ui/NavBarLogoOnly";
import TreatmentCard from "@/components/ui/TreatmentCard";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Loader2,
  MapPin,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface SelectedItem {
  treatment: MappedTreatment;
  quantity: number;
}

export default function BookingPage() {
  const {
    data: treatments = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useTreatments();
  const { locations } = useLocations();

  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [cart, setCart] = useState<SelectedItem[]>([]);

  // Automatically default to the first location once loaded from Wix
  useEffect(() => {
    if (!selectedLocationId && locations.length > 0) {
      setSelectedLocationId(locations[0].id);
    }
  }, [locations, selectedLocationId]);

  // Dynamically derive categories
  const categories = useMemo(() => {
    const cats = Array.from(
      new Set(treatments.map((t) => t.category).filter(Boolean)),
    );
    return ["All", ...cats];
  }, [treatments]);

  // Filter treatments
  const filteredTreatments = useMemo(() => {
    return treatments.filter((item) => {
      const matchesCategory =
        activeCategory === "All" || item.category === activeCategory;
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.desc.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLocation =
        !selectedLocationId ||
        item.locationIds.length === 0 ||
        item.locationIds.includes(selectedLocationId);

      return matchesCategory && matchesSearch && matchesLocation;
    });
  }, [treatments, activeCategory, searchQuery, selectedLocationId]);

  // Cart handlers
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

  const totalQuantity = cart.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalPrice = cart.reduce(
    (acc, curr) => acc + curr.treatment.priceNum * curr.quantity,
    0,
  );

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1A1A1A] font-sans antialiased selection:bg-[#B8925D]/20 selection:text-[#B8925D]">
      <NavBarLogoOnly theme="dark" />

      {/* Header */}
      <header className="pt-24 pb-4 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EBE5DF] pb-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-medium text-[#1A1A1A]">
              Select Your Treatments
            </h1>
            <p className="text-xs sm:text-sm text-[#666666] font-light">
              Doctor-led clinical appointments • Stack multiple procedures as
              needed
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-[#78716C]">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#B8925D]" /> GMC
              Registered
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#B8925D]" /> Zero
              Obligation
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pb-36 space-y-4">
        {/* Sticky Search + Categories */}
        <div className="sticky top-4 z-30 bg-white/95 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-[#EBE5DF] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.06)] space-y-3">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C827A]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search treatments by name or goal..."
              className="w-full h-11 bg-[#FAFAF8] border border-[#EBE5DF] rounded-xl pl-10 pr-9 text-sm font-medium placeholder:text-[#8C827A] focus:outline-none focus:border-[#B8925D] focus:ring-2 focus:ring-[#B8925D]/20 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C827A] hover:text-[#1A1A1A]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? "bg-[#1A1A1A] text-white shadow-xs"
                    : "bg-[#FAFAF8] border border-[#EBE5DF] text-[#666666] hover:text-[#1A1A1A] hover:bg-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Location Picker */}
        {locations.length > 0 && (
          <div className="flex items-center justify-between gap-3 bg-white border border-[#EBE5DF] rounded-xl px-4 py-2.5 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#8C827A] shrink-0">
              <MapPin className="w-4 h-4 text-[#B8925D]" />
              <span>Clinic Location</span>
            </div>

            <div className="relative">
              <select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                aria-label="Select clinic location"
                className="appearance-none bg-[#FAFAF8] border border-[#EBE5DF] rounded-lg pl-3 pr-8 py-1.5 text-xs font-medium text-[#1A1A1A] cursor-pointer focus:outline-none focus:border-[#B8925D] transition"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
              <ChevronRight className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8C827A] rotate-90 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="py-24 flex flex-col items-center justify-center text-[#8C827A] gap-2.5">
            <Loader2 className="w-6 h-6 animate-spin text-[#B8925D]" />
            <span className="text-xs font-medium tracking-wide">
              Loading live treatment menu...
            </span>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="py-16 text-center bg-white rounded-2xl border border-red-200 p-8 space-y-3">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-50 text-red-600 mb-1">
              <AlertCircle className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-[#1A1A1A]">
              Failed to load treatments from Wix
            </p>
            <p className="text-xs text-[#666666] max-w-sm mx-auto">
              {(error as Error)?.message || "An unexpected error occurred."}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-2 text-xs font-medium text-[#B8925D] hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && filteredTreatments.length === 0 && (
          <div className="py-16 text-center text-sm text-[#8C827A] bg-white rounded-2xl border border-[#EBE5DF] p-8 space-y-2">
            <p className="font-medium text-[#1A1A1A]">No treatments found</p>
            <p className="text-xs">
              Try adjusting your search query, selecting another category, or
              switching locations.
            </p>
          </div>
        )}

        {/* Cards Grid */}
        {!isLoading && !isError && filteredTreatments.length > 0 && (
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
        )}
      </main>

      {/* Floating Checkout Drawer */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 inset-x-4 max-w-lg mx-auto z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-[#1C1917] text-white rounded-2xl p-4 shadow-2xl border border-white/10 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-[11px] text-[#DFC095] uppercase tracking-wider font-semibold">
                {totalQuantity} {totalQuantity === 1 ? "Item" : "Items"}{" "}
                Selected
              </span>
              <p className="text-base font-serif font-medium text-white">
                Total:{" "}
                {totalPrice === 0 ? "Free Consultation" : `£${totalPrice}`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  alert(
                    `Checking out: ${cart
                      .map((c) => `${c.quantity}x ${c.treatment.title}`)
                      .join(", ")}`,
                  )
                }
                className="bg-[#B8925D] hover:bg-[#9E7B4C] text-white px-5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <span>Checkout</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCart([])}
                aria-label="Clear selection"
                className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
