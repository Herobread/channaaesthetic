import { TreatmentZone } from "@/components/ui/AnatomyIcon";

export function getTreatmentZone(
  title: string,
  category = "",
  desc = "",
): TreatmentZone {
  const text = `${title} ${category} ${desc}`.toLowerCase();

  // 1. Scalp / Hair
  if (
    text.includes("hair plasma") ||
    text.includes("hair meso") ||
    text.includes("hair growth")
  ) {
    return "hair";
  }

  // 2. IV Drips & Injections
  if (
    text.includes("iv drip") ||
    text.includes("vitamin d3") ||
    text.includes("injections & iv")
  ) {
    return "iv_wellness";
  }

  // 3. Body & Laser Hair Removal
  if (text.includes("hollywood") || text.includes("bikini")) {
    return "bikini";
  }
  if (text.includes("underarms")) {
    return "underarms";
  }
  if (
    text.includes("laser") ||
    text.includes("male laser") ||
    text.includes("female laser")
  ) {
    if (text.includes("face")) return "full_face";
    return "body_laser";
  }

  // 4. Facial Specific Zones
  if (text.includes("temple")) return "temple";
  if (text.includes("nose") || text.includes("rhinoplasty")) return "nose";
  if (text.includes("lip")) return "lips";
  if (text.includes("cheek")) return "cheeks";
  if (
    text.includes("under eye") ||
    text.includes("eye prp") ||
    text.includes("eye booster") ||
    text.includes("eyes")
  ) {
    return "eyes";
  }
  if (text.includes("neck only") || text.includes("neck")) return "neck";

  // 5. Full Face Treatments (Profhilo, Radiesse, HIFU Full Face, Microneedling, Facials)
  if (
    text.includes("profhilo") ||
    text.includes("radiesse") ||
    text.includes("microneedling") ||
    text.includes("facial") ||
    text.includes("full face") ||
    text.includes("consultation")
  ) {
    return "full_face";
  }

  return "general";
}
