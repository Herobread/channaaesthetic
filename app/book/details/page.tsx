"use client";

import BackLink from "@/components/ui/BackLink";
import { useCart } from "@/hooks/useCart";
import { useAppStore } from "@/store/useAppStore";
import { useBookingFlowStore } from "@/store/useBookingFlowStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CheckCircle2, CreditCard, Loader2 } from "lucide-react";
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

  const { cart, totalDeposit: hookDeposit, clearCart } = useCart();
  const selectedLocationId = useAppStore((state) => state.selectedLocationId);

  const computedDeposit = cart.reduce((sum, item) => {
    const itemDeposit = Number(item.treatment?.deposit) || 0;
    const qty = Number(item.quantity) || 1;
    return sum + itemDeposit * qty;
  }, 0);

  const totalDeposit =
    Number(hookDeposit) > 0 ? Number(hookDeposit) : computedDeposit;

  const {
    selectedSlot,
    customerDetails,
    setCustomerDetails,
    isSubmitting,
    setIsSubmitting,
    resetFlow,
  } = useBookingFlowStore();

  const hasCart = cart.length > 0;
  const hasSlot = Boolean(selectedSlot);
  const isValidSession = hasCart && hasSlot;

  useEffect(() => {
    if (!hasCart) {
      router.replace("/book");
      return;
    }
    if (!hasSlot) {
      router.replace("/book/datetime");
      return;
    }
  }, [hasCart, hasSlot, router]);

  const {
    register,
    handleSubmit,
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

  const onSubmit = async (values: PatientFormValues) => {
    if (isSubmitting) return;

    setCustomerDetails({
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      notes: values.notes?.trim() || "",
    });

    if (totalDeposit > 0) {
      router.push("/book/pay-deposit");
      return;
    }

    if (!selectedLocationId || !selectedSlot) {
      alert("Missing booking details. Please return to step 1 and re-select.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId: selectedLocationId,
          startAt: selectedSlot,
          services: cart.map((item) => ({
            variationId: item.treatment.variationId || item.treatment.id,
          })),
          depositAmount: 0,
          customer: {
            name: values.name.trim(),
            email: values.email.trim(),
            phone: values.phone.trim(),
          },
          notes: values.notes?.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to commit booking.");
      }

      const bookingId = data.booking?.id || data.booking?.uid;
      if (!bookingId) throw new Error("No booking ID returned from server.");

      if (typeof clearCart === "function") clearCart();
      resetFlow();
      router.push(`/success/${bookingId}`);
    } catch (err: any) {
      alert(err.message || "Failed to finalize booking.");
      setIsSubmitting(false);
    }
  };

  if (!isValidSession) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-text-muted gap-2.5">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
        <span className="text-caption font-sans font-medium tracking-wide">
          Verifying booking details...
        </span>
      </div>
    );
  }

  return (
    <div className="w-full">
      <BackLink href="/book/datetime">Back to time selection</BackLink>

      <header className="mt-4 mb-8 lg:mb-10">
        <h1 className="font-serif text-headline font-normal text-text-primary tracking-tight">
          Patient details
        </h1>
      </header>

      <form
        id="patient-details-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
        noValidate
      >
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

        <div className="pt-4">
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className={`w-full h-12 rounded-control text-body font-sans font-medium flex items-center justify-center gap-2 transition-all shadow-subtle focus-ring ${
              !isValid || isSubmitting
                ? "bg-surface-subtle text-text-muted cursor-not-allowed border border-border-subtle shadow-none"
                : "bg-accent hover:bg-accent-hover active:scale-[0.99] text-text-inverted cursor-pointer shadow-accent-glow"
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Securing appointment...</span>
              </>
            ) : totalDeposit > 0 ? (
              <>
                <CreditCard className="w-5 h-5" />
                <span>Continue to deposit (£{totalDeposit})</span>
                <ArrowRight className="w-5 h-5" />
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Confirm appointment</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
