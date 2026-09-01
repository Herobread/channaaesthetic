"use client";

import { Search, X } from "lucide-react";

interface SearchCategoryDockProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function SearchCategoryDock({
  searchQuery,
  onSearchChange,
  categories,
  activeCategory,
  onCategoryChange,
}: SearchCategoryDockProps) {
  return (
    <>
      <div className="sticky top-4 z-30 bg-white p-3.5 sm:p-4 rounded-2xl border border-[#EBE5DF] shadow-[0_12px_40px_-8px_rgba(0,0,0,0.08)] space-y-3">
        {/* Search Input */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C827A]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search treatments by name or goal..."
            className="w-full h-11 bg-[#FAFAF8] border border-[#EBE5DF] rounded-xl pl-10 pr-9 text-xs sm:text-sm font-medium text-[#1A1A1A] placeholder:text-[#8C827A] focus:outline-none focus:border-[#B8925D] focus:bg-white focus:ring-2 focus:ring-[#B8925D]/15 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8C827A] hover:text-[#1A1A1A] rounded-lg transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => onCategoryChange(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#B8925D] text-white shadow-xs"
                    : "bg-[#FAFAF8] border border-[#EBE5DF] text-[#78716C] hover:text-[#1A1A1A] hover:bg-white hover:border-[#D6CEC7]"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
