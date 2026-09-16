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
    <div className="sticky top-0 z-20 bg-surface-canvas pt-3 pb-2.5 space-y-3 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
      {/* Search Input */}
      <div className="relative w-full">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search..."
          className="w-full h-12 bg-surface-elevated border border-border-subtle rounded-control pl-10 pr-9 font-sans text-caption text-text-primary placeholder:text-text-muted shadow-subtle focus-ring-accent transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary rounded-control focus-ring transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Pill Scroller */}
      <div className="flex items-center gap-2 overflow-x-auto p-1.5 -m-1.5 scrollbar-none">
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              type="button"
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`relative focus-visible:z-10 px-4 py-2 rounded-control font-sans text-caption font-medium whitespace-nowrap transition cursor-pointer shrink-0 focus-ring ${
                isActive
                  ? "bg-accent text-text-inverted shadow-subtle"
                  : "bg-surface-elevated border border-border-subtle text-text-muted hover:text-text-primary hover:border-border-focus"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}
