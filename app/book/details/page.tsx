"use client";

import BackLink from "@/components/ui/BackLink";
import { useBookingFlowStore } from "@/store/useBookingFlowStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const patientSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z
    .string()
    .trim()
    .email("Please check your email address format (e.g. jane@example.com)."),
  phone: z
    .string()
    .trim()
    .refine(
      (val) => val.replace(/[^0-9+]/g, "").length >= 8,
      "Please provide a valid phone number.",
    ),
  notes: z.string().optional(),
});

type PatientFormValues = z.infer<typeof patientSchema>;

export default function PatientDetailsPage() {
  const router = useRouter();

  const {
    selectedSlot,
    customerDetails,
    setCustomerDetails,
    setIsDetailsValid,
  } = useBookingFlowStore();

  const {
    register,
    watch,
    formState: { errors, isValid, touchedFields },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    mode: "onTouched",
    defaultValues: {
      name: customerDetails?.name || "",
      email: customerDetails?.email || "",
      phone: customerDetails?.phone || "",
      notes: customerDetails?.notes || "",
    },
  });

  // Keep bottom BookingBar enabled/disabled state synced
  useEffect(() => {
    setIsDetailsValid(isValid);
    return () => setIsDetailsValid(false);
  }, [isValid, setIsDetailsValid]);

  // Sync details silently to Zustand
  useEffect(() => {
    const subscription = watch((value) => {
      setCustomerDetails({
        name: value.name ?? "",
        email: value.email ?? "",
        phone: value.phone ?? "",
        notes: value.notes ?? "",
      });
    });

    return () => subscription.unsubscribe();
  }, [watch, setCustomerDetails]);

  useEffect(() => {
    if (!selectedSlot) {
      router.replace("/book/datetime");
    }
  }, [selectedSlot, router]);

  if (!selectedSlot) return null;

  return (
    <div className="w-full">
      <BackLink href="/book/datetime">Back to time selection</BackLink>

      <header className="mt-4 mb-8 lg:mb-10">
        <h1 className="font-serif text-headline font-normal text-text-primary tracking-tight">
          Patient details
        </h1>
      </header>

      <form id="patient-details-form" className="space-y-6" noValidate>
        {/* Full Name */}
        <div>
          <label className="block text-caption font-sans font-medium text-text-primary mb-2">
            Full name *
          </label>
          <input
            type="text"
            autoComplete="shipping name"
            placeholder="Jane Doe"
            {...register("name")}
            className={`w-full text-caption font-sans py-3.5 px-4 rounded-control border bg-surface-elevated text-text-primary placeholder:text-text-muted/60 transition-colors ${
              touchedFields.name && errors.name
                ? "border-border-error focus-ring-error"
                : "border-border-subtle focus-ring-accent"
            }`}
          />
          {touchedFields.name && errors.name && (
            <p className="text-caption font-sans text-text-error mt-1.5">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Email & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
          <div>
            <label className="block text-caption font-sans font-medium text-text-primary mb-2">
              Email address *
            </label>
            <input
              type="email"
              autoComplete="shipping email"
              placeholder="jane@example.com"
              {...register("email")}
              className={`w-full text-caption font-sans py-3.5 px-4 rounded-control border bg-surface-elevated text-text-primary placeholder:text-text-muted/60 transition-colors ${
                touchedFields.email && errors.email
                  ? "border-border-error focus-ring-error"
                  : "border-border-subtle focus-ring-accent"
              }`}
            />
            {touchedFields.email && errors.email && (
              <p className="text-caption font-sans text-text-error mt-1.5">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-caption font-sans font-medium text-text-primary mb-2">
              Mobile phone *
            </label>
            <input
              type="tel"
              autoComplete="shipping tel"
              placeholder="+44 7123 456789"
              {...register("phone")}
              className={`w-full text-caption font-sans px-4 py-3.5 rounded-control border bg-surface-elevated text-text-primary placeholder:text-text-muted/60 transition-colors ${
                touchedFields.phone && errors.phone
                  ? "border-border-error focus-ring-error"
                  : "border-border-subtle focus-ring-accent"
              }`}
            />
            {touchedFields.phone && errors.phone && (
              <p className="text-caption font-sans text-text-error mt-1.5">
                {errors.phone.message}
              </p>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-caption font-sans font-medium text-text-primary mb-2">
            Medical notes or considerations (optional)
          </label>
          <textarea
            rows={4}
            placeholder="Any previous treatments, allergies, or questions for the practitioner..."
            {...register("notes")}
            className="w-full text-caption font-sans p-4 rounded-control border border-border-subtle bg-surface-elevated text-text-primary placeholder:text-text-muted/60 focus-ring-accent transition-colors resize-none"
          />
        </div>
      </form>
    </div>
  );
}
