/** Pays visés proposés. "" = aucun pays (analyse globale, sans encart pays). */
export const COUNTRIES = [
  { code: "", label: "Monde (aucun pays)", lang: "" },
  { code: "FR", label: "France", lang: "français" },
  { code: "BE", label: "Belgique", lang: "français / néerlandais" },
  { code: "CH", label: "Suisse", lang: "français / allemand" },
  { code: "CA-QC", label: "Canada (Québec)", lang: "français québécois" },
  { code: "CA", label: "Canada (anglophone)", lang: "anglais" },
  { code: "US", label: "États-Unis", lang: "anglais" },
  { code: "GB", label: "Royaume-Uni", lang: "anglais" },
  { code: "DE", label: "Allemagne", lang: "allemand" },
  { code: "ES", label: "Espagne", lang: "espagnol" },
  { code: "IT", label: "Italie", lang: "italien" },
  { code: "NL", label: "Pays-Bas", lang: "néerlandais" },
  { code: "SE", label: "Suède", lang: "suédois / anglais" },
  { code: "PL", label: "Pologne", lang: "polonais" },
  { code: "BR", label: "Brésil", lang: "portugais" },
  { code: "MX", label: "Mexique", lang: "espagnol" },
  { code: "IN", label: "Inde", lang: "anglais / hindi" },
  { code: "JP", label: "Japon", lang: "japonais" },
  { code: "AU", label: "Australie", lang: "anglais" },
] as const;

export function countryInfo(code: string | undefined) {
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];
}

/** Nombre maximum de pays par analyse (temps de réponse et taille de la fiche). */
export const MAX_COUNTRIES = 5;

/** Nettoie une liste de codes pays : valides, sans doublon, sans « Monde », au plus MAX_COUNTRIES. */
export function normalizeCountries(input: unknown): string[] {
  const list = Array.isArray(input) ? input : typeof input === "string" && input ? [input] : [];
  const valid = list.map((c) => countryInfo(String(c)).code).filter((c): c is Exclude<typeof c, ""> => c !== "");
  return [...new Set(valid)].slice(0, MAX_COUNTRIES);
}

export function countriesLabel(codes: string[]): string {
  return codes.map((c) => countryInfo(c).label).join(", ");
}
