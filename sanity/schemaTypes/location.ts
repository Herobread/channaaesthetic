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
      name: "calEventTypeId",
      title: "Cal.com Event Type ID",
      type: "number",
      description:
        "The numeric ID found in the URL when editing the event in Cal.com (e.g. cal.com/event-types/123456)",
      validation: (Rule) => Rule.required().positive().integer(),
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
      calId: "calEventTypeId",
    },
    prepare({ title, subtitle, calId }) {
      return {
        title: title || "Untitled Location",
        subtitle: `${subtitle || "No City"} • ${
          calId ? `Cal Event ID: ${calId}` : "Missing Cal Event ID"
        }`,
      };
    },
  },
});
