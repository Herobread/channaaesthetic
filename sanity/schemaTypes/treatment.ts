import { defineField, defineType } from "sanity";

export const treatmentType = defineType({
  name: "treatment",
  title: "Treatments & Services",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "category", title: "Category", type: "string" }),
    defineField({ name: "desc", title: "Description", type: "text", rows: 3 }),
    defineField({
      name: "durationMinutes",
      title: "Duration (Minutes)",
      type: "number",
      initialValue: 45,
    }),
    defineField({
      name: "priceNum",
      title: "Price (£)",
      type: "number",
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({ name: "deposit", title: "Deposit (£)", type: "number" }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "locations",
      title: "Available Clinic Locations",
      type: "array",
      of: [{ type: "reference", to: [{ type: "clinicLocation" }] }],
    }),
  ],
});
