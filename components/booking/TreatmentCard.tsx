"use client";

import { MappedTreatment, TreatmentVariation } from "@/api/useTreatments";
import TreatmentSelectButton from "@/components/booking/TreatmentSelectButton";
import { Clock } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";

interface TreatmentCardProps {
  treatment: MappedTreatment;
  quantity?: number;
  onIncrement: (treatment: MappedTreatment) => void;
  onDecrement: (targetId: string) => void;
  onSwapVariation?: (
    oldTargetId: string,
    newTreatment: MappedTreatment,
  ) => void;
}

export default function TreatmentCard({
  treatment,
  quantity = 0,
  onIncrement,
  onDecrement,
  onSwapVariation,
}: TreatmentCardProps) {
  const hasMultipleVariations = Boolean(
    treatment.variations && treatment.variations.length > 1,
  );

  const [selectedVarIndex, setSelectedVarIndex] = useState(0);

  const activeVariation: TreatmentVariation = useMemo(() => {
    if (hasMultipleVariations && treatment.variations[selectedVarIndex]) {
      return treatment.variations[selectedVarIndex];
    }
    return {
      id: treatment.variationId || treatment.id,
      title: treatment.title,
      price: treatment.price,
      durationMinutes: treatment.durationMinutes,
      time: treatment.time,
      deposit: treatment.deposit,
    };
  }, [treatment, selectedVarIndex, hasMultipleVariations]);

  const currentTreatmentPayload: MappedTreatment = useMemo(
    () => ({
      ...treatment,
      variationId: activeVariation.id,
      price: activeVariation.price,
      durationMinutes: activeVariation.durationMinutes,
      time: activeVariation.time,
      deposit: activeVariation.deposit,
    }),
    [treatment, activeVariation],
  );

  const isSelected = quantity > 0;

  const handleToggle = () => {
    if (isSelected) {
      onDecrement(activeVariation.id);
    } else {
      onIncrement(currentTreatmentPayload);
    }
  };

  const handleVariationChange = (index: number) => {
    if (index === selectedVarIndex) return;

    const newVar = treatment.variations[index];
    const newPayload: MappedTreatment = {
      ...treatment,
      variationId: newVar.id,
      price: newVar.price,
      durationMinutes: newVar.durationMinutes,
      time: newVar.time,
      deposit: newVar.deposit,
    };

    if (isSelected) {
      if (onSwapVariation) {
        onSwapVariation(activeVariation.id, newPayload);
      } else {
        onDecrement(activeVariation.id);
        onIncrement(newPayload);
      }
    }

    setSelectedVarIndex(index);
  };

  const formattedPrice =
    activeVariation.price === 0 ? "Free" : `£${activeVariation.price}`;

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

      <div className="p-6 space-y-3.5 flex-1">
        <div className="space-y-1.5">
          <h3 className="font-serif text-title font-medium text-text-primary group-hover:text-accent transition-colors">
            {treatment.title}
          </h3>

          <p className="text-caption font-sans text-text-muted font-normal leading-relaxed">
            {treatment.desc}
          </p>
        </div>

        {/* High-conversion minimal tier pills */}
        {hasMultipleVariations && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {treatment.variations.map((v, idx) => {
              const isActive = idx === selectedVarIndex;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handleVariationChange(idx)}
                  className={`h-8 px-3 rounded-control text-caption font-sans transition-all inline-flex items-center gap-1.5 focus-ring cursor-pointer select-none ${
                    isActive
                      ? "bg-surface-canvas text-text-primary font-medium border border-accent shadow-subtle"
                      : "bg-surface-subtle/60 hover:bg-surface-subtle text-text-muted hover:text-text-primary border border-transparent"
                  }`}
                >
                  <span>{v.title}</span>
                  <span className="text-text-muted/60 text-[11px]">•</span>
                  <span
                    className={
                      isActive ? "text-accent font-medium" : "text-text-muted"
                    }
                  >
                    £{v.price}
                  </span>
                </button>
              );
            })}
          </div>
        )}
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
              {activeVariation.time}
            </span>
          </div>

          {activeVariation.deposit > 0 && activeVariation.price > 0 && (
            <span className="text-caption font-sans text-text-muted font-normal truncate">
              £{activeVariation.deposit} deposit to reserve
            </span>
          )}
        </div>

        <TreatmentSelectButton
          isSelected={isSelected}
          onToggle={handleToggle}
          ariaLabel={`${treatment.title} - ${activeVariation.title}`}
        />
      </div>
    </div>
  );
}
