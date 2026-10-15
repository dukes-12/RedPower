/** Constantes partagées, sans dépendance à zod (pour garder la version artifact légère). */

/** Objectifs de campagne Reddit Ads (noms officiels de l'interface Reddit). */
export const REDDIT_OBJECTIVES = [
  "Brand Awareness & Reach",
  "Traffic",
  "Conversions",
  "Video Views",
  "App Installs",
  "Lead Generation",
  "Catalog Sales",
] as const;
export type RedditObjective = (typeof REDDIT_OBJECTIVES)[number];

export const REDDIT_CTAS = [
  "Learn More",
  "Sign Up",
  "Shop Now",
  "Install",
  "Download",
  "Get a Quote",
  "Contact Us",
  "Apply Now",
  "Watch Now",
  "Play Now",
  "View More",
  "Get Showtimes",
] as const;

