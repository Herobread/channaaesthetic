"use client";

import Navbar from "@/components/ui/NavBar";
import heroBg from "@/public/DP4-Treatment.jpg";
import {
  ChevronRight,
  Clock,
  MapPin,
  Minus,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";

interface Treatment {
  id: number;
  category: "Consultations" | "Fillers" | "Anti-Wrinkle" | "Skin Boosters";
  title: string;
  desc: string;
  time: string;
  price: string;
  priceNum: number;
  featured?: boolean;
}

interface SelectedItem {
  treatment: Treatment;
  quantity: number;
}

const TREATMENTS: Treatment[] = [
  {
    id: 1,
    category: "Consultations",
    title: "Comprehensive Facial Assessment",
    desc: "A thorough 1-on-1 anatomical mapping session to identify facial vectors, balance, and build a phased treatment plan.",
    time: "45 min",
    price: "Free",
    priceNum: 0,
    featured: true,
  },
  {
    id: 2,
    category: "Fillers",
    title: "2ml Mid-Face Cheek Contour",
    desc: "Restores deep structural volume, creates high-cheek definition, and provides a subtle mid-face lifting effect.",
    time: "45 min",
    price: "£250",
    priceNum: 250,
  },
  {
    id: 3,
    category: "Fillers",
    title: "2ml Lower Face & Jawline Definition",
    desc: "Sculpting the mandibular angle to sharpen jawline contour and tighten the appearance of the lower face profile.",
    time: "45 min",
    price: "£250",
    priceNum: 250,
  },
  {
    id: 4,
    category: "Fillers",
    title: "1ml Chin Projection & Harmony",
    desc: "Corrects retrognathia and lengthens the lower third of the face to create balanced aesthetic harmony.",
    time: "30 min",
    price: "£120",
    priceNum: 120,
  },
  {
    id: 5,
    category: "Anti-Wrinkle",
    title: "3 Areas Anti-Wrinkle Smoothing",
    desc: "Precision micro-injections targeting forehead lines, glabella frown lines, and crow's feet. Refreshed and expressive.",
    time: "30 min",
    price: "£220",
    priceNum: 220,
  },
  {
    id: 6,
    category: "Anti-Wrinkle",
    title: "Masseter Slimming & Bruxism",
    desc: "Relieves clenching tension and slims the lower facial profile by relaxing overactive masseter muscles.",
    time: "30 min",
    price: "£240",
    priceNum: 240,
  },
  {
    id: 7,
    category: "Skin Boosters",
    title: "Profhilo® Full Face Remodelling",
    desc: "High-concentration hyaluronic acid bio-remodelling across 10 anatomical points to trigger collagen and elasticity.",
    time: "30 min",
    price: "£280",
    priceNum: 280,
  },
  {
    id: 8,
    category: "Skin Boosters",
    title: "Polynucleotide Eye Rejuvenation",
    desc: "DNA-derived cellular therapy to repair under-eye hollowing, dark pigmentation, and delicate fine lines.",
    time: "45 min",
    price: "£260",
    priceNum: 260,
  },
];

const CATEGORIES = [
  "All",
  "Consultations",
  "Fillers",
  "Anti-Wrinkle",
  "Skin Boosters",
];

export default function BookingPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<
    "london" | "glasgow"
  >("london");
  const [cart, setCart] = useState<SelectedItem[]>([]);

  const filteredTreatments = useMemo(() => {
    return TREATMENTS.filter((item) => {
      const matchesCategory =
        activeCategory === "All" || item.category === activeCategory;
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.desc.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const incrementItem = (treatment: Treatment) => {
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

  const decrementItem = (treatmentId: number) => {
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

  const getBookingLink = () => {
    const params = cart
      .flatMap((i) => Array(i.quantity).fill(i.treatment.id))
      .join(",");
    const baseUrl =
      selectedLocation === "london"
        ? "https://yourbookingplatform.com/london"
        : "https://yourbookingplatform.com/glasgow";
    return `${baseUrl}?services=${params}`;
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1A1A1A] font-sans antialiased selection:bg-[#B8925D]/20 selection:text-[#B8925D]">
      <Navbar />

      {/* Atmospheric Hero */}
      <section className="relative text-white pt-28 pb-16 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={heroBg}
            alt="Clinical Precision"
            fill
            priority
            quality={90}
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#1C1917]/85 via-[#1C1917]/90 to-[#FAFAF8]" />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] uppercase tracking-widest text-[#DFC095] font-medium border border-white/10">
            <Sparkles className="w-3 h-3" /> Doctor-Led Treatment Menu
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl font-normal tracking-tight">
            Select Your Treatments
          </h1>

          <p className="text-sm sm:text-base text-white/80 font-light max-w-md mx-auto">
            Choose single procedures or stack multiple treatments for your
            bespoke appointment.
          </p>
        </div>
      </section>

      {/* Main Feed */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 relative z-20 pb-36 space-y-6">
        {/* Sticky Search & Filter Container */}
        <div className="sticky top-4 z-30 bg-white/95 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-[#EBE5DF] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.08)] space-y-3">
          {/* Integrated Search Input */}
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C827A]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search treatments by name or goal (e.g. Jawline, Botox)..."
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

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
            {CATEGORIES.map((cat) => (
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

        {/* Compact Location Picker */}
        <div className="flex items-center justify-between gap-3 bg-white border border-[#EBE5DF] rounded-xl px-4 py-2.5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#8C827A] shrink-0">
            <MapPin className="w-4 h-4 text-[#B8925D]" />
            <span>Location</span>
          </div>

          <div className="relative">
            <select
              value={selectedLocation}
              onChange={(e) =>
                setSelectedLocation(e.target.value as "london" | "glasgow")
              }
              aria-label="Select clinic location"
              className="appearance-none bg-[#FAFAF8] border border-[#EBE5DF] rounded-lg pl-3 pr-8 py-1.5 text-xs font-medium text-[#1A1A1A] cursor-pointer focus:outline-none focus:border-[#B8925D] focus:ring-1 focus:ring-[#B8925D]/20 transition"
            >
              <option value="london">London (WC1N)</option>
              <option value="glasgow">Glasgow</option>
            </select>
            <ChevronRight className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8C827A] rotate-90 pointer-events-none" />
          </div>
        </div>

        {/* Treatment Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTreatments.map((treatment) => {
            const cartItem = cart.find((i) => i.treatment.id === treatment.id);
            const quantity = cartItem?.quantity || 0;
            const isSelected = quantity > 0;

            return (
              <div
                key={treatment.id}
                className={`group relative bg-white rounded-2xl p-6 border flex flex-col justify-between transition-all duration-200 ${
                  isSelected
                    ? "border-[#B8925D] ring-2 ring-[#B8925D]/20 shadow-md bg-[#FAFAF8]/50"
                    : "border-[#EBE5DF] hover:border-[#B8925D]/60 hover:shadow-xs shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)]"
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C827A]">
                      {treatment.category}
                    </span>
                    {treatment.featured && (
                      <span className="bg-[#B8925D]/10 text-[#B8925D] text-[10px] font-medium uppercase px-2 py-0.5 rounded-md">
                        Recommended First Step
                      </span>
                    )}
                  </div>

                  <h3 className="font-serif text-2xl font-semibold text-[#1A1A1A] group-hover:text-[#B8925D] transition-colors">
                    {treatment.title}
                  </h3>

                  <p className="text-sm text-[#666666] font-light leading-relaxed">
                    {treatment.desc}
                  </p>
                </div>

                <div className="pt-4 mt-5 border-t border-[#EBE5DF] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-xs text-[#8C827A]">
                      <Clock className="w-3.5 h-3.5 text-[#B8925D]" />{" "}
                      {treatment.time}
                    </span>
                    <span className="font-semibold text-base text-[#1A1A1A]">
                      {treatment.price}
                    </span>
                  </div>

                  {/* Multi-Select Stepper */}
                  {isSelected ? (
                    <div className="flex items-center gap-2 bg-white border border-[#B8925D] rounded-xl p-1 shadow-xs">
                      <button
                        onClick={() => decrementItem(treatment.id)}
                        aria-label="Decrease quantity"
                        className="w-7 h-7 rounded-lg bg-[#FAFAF8] hover:bg-[#EBE5DF] text-[#1A1A1A] flex items-center justify-center transition"
                      >
                        {quantity === 1 ? (
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        ) : (
                          <Minus className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <span className="text-xs font-semibold text-[#1A1A1A] px-1.5 min-w-[18px] text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => incrementItem(treatment)}
                        aria-label="Increase quantity"
                        className="w-7 h-7 rounded-lg bg-[#B8925D] hover:bg-[#9E7B4C] text-white flex items-center justify-center transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => incrementItem(treatment)}
                      className="h-9 px-4 rounded-xl bg-[#FAFAF8] hover:bg-[#B8925D] text-[#1A1A1A] hover:text-white border border-[#EBE5DF] hover:border-[#B8925D] text-xs font-medium flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Floating Bottom Selection Dock */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 inset-x-4 max-w-lg mx-auto z-50">
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
              <a
                href={getBookingLink()}
                className="bg-[#B8925D] hover:bg-[#9E7B4C] text-white px-5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-1.5 shadow-sm transition"
              >
                <span>Checkout</span>
                <ChevronRight className="w-4 h-4" />
              </a>
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
