import { defineField, defineType } from "sanity";
import { CategoryAutocomplete } from "../components/CategoryAutocomplete";

export const treatmentType = defineType({
  name: "treatment",
  title: "Treatments & Services",
  type: "document",
  fieldsets: [
    {
      name: "pricing",
      title: "Pricing & Booking Terms",
      options: { columns: 2 },
    },
    {
      name: "logistics",
      title: "Logistics & Availability",
      options: { columns: 2 },
    },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Treatment Name",
      type: "string",
      description: "Customer-facing title (e.g. 'Vitamin C IV Drip').",
      placeholder: "e.g. Microneedling Therapy",
      validation: (Rule) =>
        Rule.required().error("Treatment name is mandatory"),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      description: "Used to group procedures in the dock filter.",
      components: { input: CategoryAutocomplete },
      validation: (Rule) =>
        Rule.required().error("A category is required for filtering"),
    }),
    defineField({
      name: "desc",
      title: "Short Description",
      type: "text",
      rows: 3,
      description:
        "Brief clinical summary shown on the treatment card (recommended: 1-3 sentences).",
    }),
    defineField({
      name: "priceNum",
      title: "Total Price (£)",
      type: "number",
      fieldset: "pricing",
      description: "Full cost in GBP. Set to 0 for free consultations.",
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: "deposit",
      title: "Required Deposit (£)",
      type: "number",
      fieldset: "pricing",
      description:
        "Optional upfront booking deposit. Leave blank if full price or no deposit.",
      validation: (Rule) =>
        Rule.custom((deposit, context) => {
          const price = (context.document?.priceNum as number) || 0;
          if (deposit && deposit > price) {
            return "Deposit cannot exceed the full treatment price.";
          }
          return true;
        }),
    }),
    defineField({
      name: "durationMinutes",
      title: "Duration (Minutes)",
      type: "number",
      fieldset: "logistics",
      description:
        "Appointment length (used for patient scheduling estimates).",
      initialValue: 45,
    }),
    defineField({
      name: "featured",
      title: "Featured Treatment",
      type: "boolean",
      fieldset: "logistics",
      description:
        "Highlight this card with subtle visual accents on the booking page.",
      initialValue: false,
    }),
    defineField({
      name: "locations",
      title: "Available Clinic Locations",
      type: "array",
      description:
        "Select which branches offer this service. Treatments without locations won't show in location-specific filters.",
      of: [{ type: "reference", to: [{ type: "clinicLocation" }] }],
      validation: (Rule) =>
        Rule.min(1).warning(
          "Treatments should ideally be assigned to at least one clinic.",
        ),
    }),
    defineField({
      name: "image",
      title: "Card Cover Image",
      type: "image",
      description:
        "High-resolution square or portrait photo. Hotspot enabled for responsive cropping.",
      options: { hotspot: true },
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "category",
      price: "priceNum",
      media: "image",
    },
    prepare({ title, subtitle, price, media }) {
      return {
        title: title || "Untitled Treatment",
        subtitle: `${subtitle || "Uncategorized"} • ${price === 0 ? "Free" : `£${price}`}`,
        media,
      };
    },
  },
});
