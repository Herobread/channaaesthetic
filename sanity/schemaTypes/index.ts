import { type SchemaTypeDefinition } from "sanity";
import { locationType } from "./location";
import { treatmentType } from "./treatment";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [locationType, treatmentType],
};
