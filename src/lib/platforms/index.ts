/**
 * Registre des plateformes publicitaires.
 *
 * Reddit est la plateforme "live" (ciblage communautés, preview, génération dédiée).
 * Les autres plateformes partagent le même modèle de benchmarks : elles alimentent
 * déjà le comparateur du simulateur et pourront être activées une à une
 * (prompts, preview et règles créatives dédiées).
 *
 * Les benchmarks sont des fourchettes indicatives [bas, médian, haut] issues de
 * moyennes publiques du marché ; ils servent à simuler, pas à promettre.
 */

export type GoalId = "awareness" | "traffic" | "conversions" | "video" | "app" | "leads" | "catalog";

export type Range = readonly [low: number, mid: number, high: number];

export interface GoalBenchmark {
  /** Libellé de l'objectif tel qu'il apparaît dans le gestionnaire de pub de la plateforme. */
  label: string;
  /** Coût pour 1000 impressions, USD. */
  cpm: Range;
  /** Taux de clic, en %. */
  ctr: Range;
  /** Taux de conversion post-clic (ou action principale : lead, install, vue), en %. */
  cvr: Range;
  /** Nom de l'action principale mesurée. */
  actionLabel: string;
}

export interface Platform {
  id: string;
  name: string;
  status: "live" | "soon";
  /** Couleur de marque, utilisée seulement pour les pastilles d'identité (jamais pour du texte). */
  color: string;
  minDailyBudget: number;
  headlineMaxChars: number;
  /** Taille d'audience mensuelle adressable par défaut (personnes) quand aucun ciblage n'est défini. */
  defaultAudience: number;
  goals: Partial<Record<GoalId, GoalBenchmark>>;
  strengths: string[];
}

export const PLATFORMS: Platform[] = [
  {
    id: "reddit",
    name: "Reddit Ads",
    status: "live",
    color: "#ff4500",
    minDailyBudget: 5,
    headlineMaxChars: 300,
    defaultAudience: 60_000_000,
    goals: {
      awareness: { label: "Brand Awareness & Reach", cpm: [2.5, 4, 6.5], ctr: [0.2, 0.35, 0.55], cvr: [0.5, 1, 2], actionLabel: "Conversions post-clic" },
      traffic: { label: "Traffic", cpm: [3.5, 5.5, 8.5], ctr: [0.4, 0.65, 1.0], cvr: [0.8, 1.5, 3], actionLabel: "Conversions post-clic" },
      conversions: { label: "Conversions", cpm: [5, 8, 12], ctr: [0.4, 0.6, 0.9], cvr: [1.2, 2.5, 5], actionLabel: "Conversions" },
      video: { label: "Video Views", cpm: [3, 5, 8], ctr: [0.15, 0.3, 0.5], cvr: [12, 20, 30], actionLabel: "Vues vidéo (≥3 s / 50 %)" },
      app: { label: "App Installs", cpm: [4, 7, 10], ctr: [0.4, 0.7, 1.1], cvr: [3, 6, 12], actionLabel: "Installations" },
      leads: { label: "Lead Generation", cpm: [5, 8, 12], ctr: [0.4, 0.6, 0.9], cvr: [3, 7, 12], actionLabel: "Leads" },
      catalog: { label: "Catalog Sales", cpm: [5, 8, 11], ctr: [0.5, 0.8, 1.2], cvr: [1.2, 2.5, 4.5], actionLabel: "Achats" },
    },
    strengths: ["Ciblage par communautés d'intérêt", "CPM bas", "Audiences difficiles à toucher ailleurs (tech, gaming, finance)"],
  },
  {
    id: "meta",
    name: "Meta Ads",
    status: "soon",
    color: "#0866ff",
    minDailyBudget: 1,
    headlineMaxChars: 40,
    defaultAudience: 250_000_000,
    goals: {
      awareness: { label: "Notoriété", cpm: [4, 7, 12], ctr: [0.4, 0.7, 1.1], cvr: [0.5, 1, 2], actionLabel: "Conversions post-clic" },
      traffic: { label: "Trafic", cpm: [6, 10, 15], ctr: [0.8, 1.2, 1.8], cvr: [0.8, 1.5, 3], actionLabel: "Conversions post-clic" },
      conversions: { label: "Ventes", cpm: [8, 13, 20], ctr: [0.8, 1.1, 1.6], cvr: [1.5, 3, 6], actionLabel: "Conversions" },
      video: { label: "Vues de vidéo", cpm: [3, 6, 10], ctr: [0.3, 0.5, 0.8], cvr: [15, 25, 35], actionLabel: "ThruPlays" },
      app: { label: "Promotion d'app", cpm: [6, 10, 15], ctr: [0.8, 1.2, 1.8], cvr: [4, 8, 14], actionLabel: "Installations" },
      leads: { label: "Prospects", cpm: [8, 12, 18], ctr: [0.7, 1.0, 1.5], cvr: [5, 9, 15], actionLabel: "Leads" },
      catalog: { label: "Ventes catalogue", cpm: [8, 12, 18], ctr: [0.9, 1.3, 2], cvr: [1.8, 3, 5], actionLabel: "Achats" },
    },
    strengths: ["Volume massif", "Algorithme de conversion mature", "Retargeting"],
  },
  {
    id: "tiktok",
    name: "TikTok Ads",
    status: "soon",
    color: "#25f4ee",
    minDailyBudget: 20,
    headlineMaxChars: 100,
    defaultAudience: 150_000_000,
    goals: {
      awareness: { label: "Reach", cpm: [2.5, 5, 8], ctr: [0.3, 0.6, 1], cvr: [0.4, 0.8, 1.6], actionLabel: "Conversions post-clic" },
      traffic: { label: "Traffic", cpm: [4, 7, 11], ctr: [0.6, 1.0, 1.5], cvr: [0.6, 1.2, 2.5], actionLabel: "Conversions post-clic" },
      conversions: { label: "Website conversions", cpm: [6, 10, 15], ctr: [0.6, 0.9, 1.4], cvr: [1, 2, 4], actionLabel: "Conversions" },
      video: { label: "Video views", cpm: [2, 4, 7], ctr: [0.3, 0.5, 0.8], cvr: [20, 30, 45], actionLabel: "Vues 6 s" },
      app: { label: "App promotion", cpm: [5, 8, 12], ctr: [0.7, 1.1, 1.6], cvr: [4, 7, 12], actionLabel: "Installations" },
      leads: { label: "Lead generation", cpm: [6, 10, 15], ctr: [0.6, 0.9, 1.3], cvr: [4, 8, 13], actionLabel: "Leads" },
      catalog: { label: "Product sales", cpm: [6, 10, 15], ctr: [0.8, 1.2, 1.8], cvr: [1.2, 2.2, 4], actionLabel: "Achats" },
    },
    strengths: ["Viralité créative", "Audience jeune", "CPM vidéo bas"],
  },
  {
    id: "linkedin",
    name: "LinkedIn Ads",
    status: "soon",
    color: "#0a66c2",
    minDailyBudget: 10,
    headlineMaxChars: 70,
    defaultAudience: 30_000_000,
    goals: {
      awareness: { label: "Brand awareness", cpm: [20, 30, 45], ctr: [0.3, 0.45, 0.65], cvr: [1, 2, 4], actionLabel: "Conversions post-clic" },
      traffic: { label: "Website visits", cpm: [25, 35, 55], ctr: [0.4, 0.55, 0.8], cvr: [1.5, 3, 5], actionLabel: "Conversions post-clic" },
      conversions: { label: "Website conversions", cpm: [30, 45, 65], ctr: [0.4, 0.55, 0.8], cvr: [2, 4, 7], actionLabel: "Conversions" },
      video: { label: "Video views", cpm: [15, 25, 40], ctr: [0.2, 0.35, 0.5], cvr: [15, 25, 35], actionLabel: "Vues vidéo" },
      leads: { label: "Lead generation", cpm: [30, 45, 70], ctr: [0.4, 0.6, 0.9], cvr: [6, 11, 18], actionLabel: "Leads" },
    },
    strengths: ["Ciblage B2B par poste et entreprise", "Leads qualifiés", "Décideurs"],
  },
  {
    id: "x",
    name: "X Ads",
    status: "soon",
    color: "#71767b",
    minDailyBudget: 1,
    headlineMaxChars: 280,
    defaultAudience: 80_000_000,
    goals: {
      awareness: { label: "Reach", cpm: [2, 4, 7], ctr: [0.3, 0.6, 1], cvr: [0.4, 0.8, 1.5], actionLabel: "Conversions post-clic" },
      traffic: { label: "Website traffic", cpm: [3, 5.5, 9], ctr: [0.5, 0.9, 1.4], cvr: [0.6, 1.2, 2.4], actionLabel: "Conversions post-clic" },
      conversions: { label: "Website conversions", cpm: [5, 8, 13], ctr: [0.5, 0.8, 1.2], cvr: [0.8, 1.8, 3.5], actionLabel: "Conversions" },
      video: { label: "Video views", cpm: [2, 4, 7], ctr: [0.2, 0.4, 0.7], cvr: [12, 20, 30], actionLabel: "Vues vidéo" },
      app: { label: "App installs", cpm: [4, 7, 11], ctr: [0.5, 0.8, 1.2], cvr: [2.5, 5, 9], actionLabel: "Installations" },
    },
    strengths: ["Conversation temps réel", "Actualité & événements", "Tech & finance"],
  },
];

export const REDDIT = PLATFORMS[0];

export function getPlatform(id: string): Platform {
  return PLATFORMS.find((p) => p.id === id) ?? REDDIT;
}

/** Correspondance objectif Reddit → objectif générique (pour comparer entre plateformes). */
export const REDDIT_OBJECTIVE_TO_GOAL: Record<string, GoalId> = {
  "Brand Awareness & Reach": "awareness",
  Traffic: "traffic",
  Conversions: "conversions",
  "Video Views": "video",
  "App Installs": "app",
  "Lead Generation": "leads",
  "Catalog Sales": "catalog",
};

export const GOAL_LABELS: Record<GoalId, string> = {
  awareness: "Notoriété",
  traffic: "Trafic",
  conversions: "Conversions",
  video: "Vues vidéo",
  app: "Installations d'app",
  leads: "Génération de leads",
  catalog: "Ventes catalogue",
};

/**
 * Coefficient appliqué au CPM selon le secteur : les enchères sont plus disputées
 * en finance ou santé qu'en gaming ou divertissement.
 */
const INDUSTRY_CPM: Array<[RegExp, number, string]> = [
  [/financ|bank|banque|fintech|crypto|assur|insur|invest/i, 1.35, "Finance"],
  [/sant|health|pharma|medic|bien-être|wellness/i, 1.2, "Santé"],
  [/saas|software|logiciel|cloud|tech|ia\b|ai\b|developer|cyber/i, 1.15, "Tech / SaaS"],
  [/auto|mobilit|vehic/i, 1.1, "Automobile"],
  [/travel|voyage|hotel|tourism|airline/i, 1.05, "Voyage"],
  [/retail|e-?commerce|d2c|dtc|mode|fashion|beauty|beauté|cosm/i, 1.0, "Retail / E-commerce"],
  [/education|edtech|formation|learning/i, 1.0, "Éducation"],
  [/food|boisson|beverage|drink|cpg|fmcg|grande conso|alimentaire/i, 0.9, "Grande consommation"],
  [/game|gaming|jeu|esport/i, 0.85, "Gaming"],
  [/media|entertain|divertissement|streaming|music|musique|film/i, 0.85, "Divertissement"],
];

export function industryMultiplier(industry: string | undefined): { factor: number; label: string } {
  if (industry) {
    for (const [re, factor, label] of INDUSTRY_CPM) if (re.test(industry)) return { factor, label };
  }
  return { factor: 1, label: "Moyenne marché" };
}
