import type { CompanyIntel, CountryInsight } from "./schemas";

/** Encarts pays d'une fiche, quel que soit son format (ancien : un seul pays). Sans zod, utilisable dans l'artifact. */
export function insightsOf(intel: CompanyIntel): CountryInsight[] {
  return intel.countryInsights ?? (intel.countryInsight ? [intel.countryInsight] : []);
}
