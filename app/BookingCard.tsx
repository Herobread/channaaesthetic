"use client";

import LocationPicker from "@/components/shared/LocationPicker";
import { ArrowUpRight, ChevronRight, Phone } from "lucide-react";
import Link from "next/link";

interface BookingCardProps {
  className?: string;
  id?: string;
}

export default function BookingCard({
  className = "",
  id = "book",
}: BookingCardProps) {
  return (
    <div
      id={id}
      className={`bg-surface-elevated rounded-card shadow-subtle border border-border-subtle  ${className}`}
    >
      {/* Primary Intake Row */}
      <div className="p-6 sm:p-8 space-y-6">
        <div className="space-y-1 text-center sm:text-left">
          <h2 className="font-serif text-headline font-medium text-text-primary">
            Reserve Your Appointment
          </h2>
          <p className="font-sans text-caption text-text-muted">
            Personalized aesthetic care delivered with absolute discretion.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <LocationPicker className="flex-1 min-w-0 h-12" />

          <Link
            href="/book"
            className="h-12 px-6 bg-accent hover:bg-accent-hover active:scale-[0.99] text-text-inverted rounded-control font-medium text-caption sm:text-body flex items-center justify-center gap-2 transition-all focus-ring-accent whitespace-nowrap shadow-subtle shrink-0"
          >
            <span>Check Clinic Availability</span>
            <ChevronRight className="w-4 h-4 shrink-0" />
          </Link>
        </div>
      </div>

      {/* Dual Utility Footer Shelf */}
      <div className="px-6 sm:px-8 py-3.5 bg-surface-subtle/50 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-3 text-caption">
        <Link
          href="/book"
          className="inline-flex items-center gap-1 text-text-muted hover:text-text-primary font-medium transition focus-ring rounded-xs group"
        >
          <span>View our treatment portfolio</span>
          <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-accent" />
        </Link>

        <a
          href="tel:+442079460921"
          className="inline-flex items-center gap-1.5 font-medium text-text-muted hover:text-text-primary transition focus-ring rounded-xs"
        >
          <Phone className="w-3.5 h-3.5 text-accent" />
          <span>Call us: +44 (0)20 7946 0921</span>
        </a>
      </div>
    </div>
  );
}
