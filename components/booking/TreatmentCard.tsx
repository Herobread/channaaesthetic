"use client";

import { MappedTreatment } from "@/api/useTreatments";
import TreatmentSelectButton from "@/components/booking/TreatmentSelectButton";
import { Clock } from "lucide-react";
import Image from "next/image";

interface TreatmentCardProps {
  treatment: MappedTreatment;
  quantity?: number;
  onIncrement: (treatment: MappedTreatment) => void;
  onDecrement: (treatmentId: string) => void;
}

export default function TreatmentCard({
  treatment,
  quantity = 0,
  onIncrement,
  onDecrement,
}: TreatmentCardProps) {
  const isSelected = quantity > 0;

  const handleToggle = () => {
    if (isSelected) {
      onDecrement(treatment.id);
    } else {
      onIncrement(treatment);
    }
  };

  const formattedPrice = treatment.price === 0 ? "Free" : `£${treatment.price}`;

  return (
    <div
      className={`group relative rounded-card overflow-hidden border flex flex-col justify-between transition-all duration-300 ${
        isSelected
          ? "border-accent ring-2 ring-accent/20 shadow-elevated bg-surface-canvas"
          : treatment.featured
            ? "border-accent-champagne bg-surface-elevated hover:border-accent hover:shadow-elevated shadow-subtle"
            : "border-border-subtle bg-surface-elevated hover:border-accent/60 hover:shadow-subtle shadow-subtle"
      }`}
    >
      {treatment.imageUrl ? (
        <div className="relative w-full aspect-square bg-surface-subtle overflow-hidden">
          <Image
            src={treatment.imageUrl}
            alt={treatment.title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover object-center transition-transform duration-500 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-dark/40 via-transparent to-surface-dark/10 pointer-events-none" />

          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="bg-surface-elevated/95 backdrop-blur-md text-text-primary text-caption font-sans font-medium px-3 py-1 rounded-control shadow-subtle border border-border-subtle/40">
              {treatment.category}
            </span>

            {treatment.featured && (
              <span className="bg-surface-elevated/95 backdrop-blur-md text-accent text-caption font-sans font-medium px-3 py-1 rounded-control shadow-subtle border border-border-subtle/40">
                Recommended
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="pt-6 px-6 flex items-center justify-between">
          <span className="text-caption font-sans font-medium text-text-muted">
            {treatment.category}
          </span>

          {treatment.featured && (
            <span className="text-caption font-sans font-medium text-accent">
              Recommended
            </span>
          )}
        </div>
      )}

      <div className="p-6 space-y-3 flex-1">
        <h3 className="font-serif text-title font-medium text-text-primary group-hover:text-accent transition-colors">
          {treatment.title}
        </h3>

        <p className="text-caption font-sans text-text-muted font-normal leading-relaxed">
          {treatment.desc}
        </p>
      </div>

      <div className="px-6 pb-6 pt-4 border-t border-border-subtle flex items-center justify-between gap-4">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-sans font-medium text-body text-text-primary">
              {formattedPrice}
            </span>
            <span className="text-caption text-text-muted">•</span>
            <span className="flex items-center gap-1 text-caption text-text-muted">
              <Clock className="w-4 h-4 text-accent" />
              {treatment.time}
            </span>
          </div>

          {treatment.deposit > 0 && treatment.price > 0 && (
            <span className="text-caption font-sans text-text-muted font-normal truncate">
              £{treatment.deposit} deposit to reserve
            </span>
          )}
        </div>

        <TreatmentSelectButton
          isSelected={isSelected}
          onToggle={handleToggle}
          ariaLabel={treatment.title}
        />
      </div>
    </div>
  );
}
