import { defineField, defineType } from "sanity";

export const locationType = defineType({
  name: "clinicLocation",
  title: "Clinic Locations",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Location Name",
      type: "string",
      placeholder: "e.g. Glasgow - Dumbarton Rd",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "name",
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "city",
      title: "City",
      type: "string",
      placeholder: "e.g. Glasgow or London",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "hapioLocationId",
      title: "Hapio Location ID",
      type: "string",
      description: "The location ID returned by Hapio",
      placeholder: "abcde...",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "address",
      title: "Full Address",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "phoneNumber",
      title: "Contact Phone",
      type: "string",
    }),
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "city",
      hapioId: "hapioLocationId",
    },
    prepare({ title, subtitle, hapioId }) {
      return {
        title: title || "Untitled Location",
        subtitle: `${subtitle || "No City"} • ${hapioId ? `Hapio: ${hapioId}` : "Missing Hapio ID"}`,
      };
    },
  },
});
