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
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "city",
      title: "City",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "address", title: "Full Address", type: "string" }),
  ],
});
