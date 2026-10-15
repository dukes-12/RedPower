import { z } from "zod";

import { REDDIT_CTAS, REDDIT_OBJECTIVES, type RedditObjective } from "./constants";

export { REDDIT_CTAS, REDDIT_OBJECTIVES, type RedditObjective } from "./constants";

const Confidence = z.enum(["haute", "moyenne", "faible"]);

export const SubredditSchema = z.object({
  name: z.string().describe("Nom du subreddit sans le préfixe r/, ex: 'personalfinance'"),
  estimatedMembers: z.number().describe("Nombre approximatif de membres"),
  relevance: z.number().describe("Pertinence pour l'entreprise, de 0 à 100"),
  audience: z.string().describe("Qui sont les membres et pourquoi ils comptent pour la marque (1 phrase)"),
  tone: z.string().describe("Ton à adopter / règles implicites de la communauté (1 phrase)"),
  risk: z.enum(["faible", "moyen", "élevé"]).describe("Risque de rejet d'une pub dans cette communauté"),
});
export type Subreddit = z.infer<typeof SubredditSchema> & {
  /** Rempli côté serveur si l'API Reddit publique répond. */
  verifiedMembers?: number;
  verified?: boolean;
};

export const KeywordSchema = z.object({
  term: z.string(),
  intent: z.enum(["découverte", "considération", "achat", "problème"]),
  priority: z.number().describe("Priorité de 1 (haute) à 3 (basse)"),
});

export const CountryInsightSchema = z.object({
  country: z.string(),
  presence: z.enum(["forte", "moyenne", "faible", "absente"]).describe("Présence commerciale de la marque dans ce pays"),
  awareness: z.string().describe("Niveau de notoriété dans ce pays, en une phrase"),
  perception: z.string().describe("Comment la marque est perçue dans ce pays (image, réputation, controverses éventuelles), 2-3 phrases"),
  sentiment: z.enum(["positif", "mitigé", "négatif", "inconnu"]),
  differences: z.array(z.string()).describe("3 à 5 différences clés avec le reste du monde : offre, prix, concurrence, culture, réglementation"),
  localCompetitors: z.array(z.string()).describe("Concurrents locaux ou plus forts dans ce pays"),
  localSubreddits: z.array(z.string()).describe("Subreddits du pays ou de sa langue pertinents, sans le préfixe r/"),
  adaptationTips: z.array(z.string()).describe("2 à 4 conseils pour adapter le ton et les annonces à ce pays"),
  objectives: z
    .array(z.object({ objective: z.string(), rationale: z.string().describe("Pourquoi cet objectif dans ce pays (signal local, maturité du marché...)") }))
    .describe("2 à 3 objectifs publicitaires recommandés pour CE pays"),
  opportunityScore: z.number().describe("Potentiel Reddit Ads de ce marché pour la marque, 0 à 100"),
  recommendedMonthlyBudget: z.number().describe("Budget Reddit mensuel conseillé pour ce pays, en USD"),
});
export type CountryInsight = z.infer<typeof CountryInsightSchema>;

export const CompanyIntelSchema = z.object({
  name: z.string(),
  website: z.string().describe("URL du site officiel, ou chaîne vide si inconnu"),
  tagline: z.string().describe("Ce que l'entreprise représente, en une phrase percutante"),
  summary: z.string().describe("Résumé de 3-4 phrases : activité, positionnement, modèle économique"),
  industry: z.string(),
  businessModel: z.string().describe("Ex: B2B SaaS, D2C e-commerce, marketplace, app mobile freemium..."),
  headquarters: z.string(),
  founded: z.string().describe("Année ou chaîne vide si inconnu"),
  employees: z.string().describe("Fourchette, ex: '200-500'"),
  estimatedRevenue: z.string().describe("Fourchette de CA annuel estimée avec devise"),
  fundingStage: z.string().describe("Ex: bootstrappé, Série B, coté en bourse..."),
  products: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      pricing: z.string().describe("Prix ou modèle de prix, chaîne vide si inconnu"),
    }),
  ),
  targetAudiences: z.array(
    z.object({
      persona: z.string(),
      description: z.string(),
    }),
  ),
  budget: z.object({
    totalMarketingAnnual: z.string().describe("Budget marketing annuel estimé (fourchette + devise)"),
    paidSocialAnnual: z.string().describe("Part paid social estimée (fourchette + devise)"),
    recommendedRedditMonthlyLow: z.number().describe("Budget Reddit mensuel recommandé, bas de fourchette, en USD"),
    recommendedRedditMonthlyHigh: z.number().describe("Budget Reddit mensuel recommandé, haut de fourchette, en USD"),
    rationale: z.string().describe("Raisonnement derrière ces estimations"),
    confidence: Confidence,
  }),
  currentObjectives: z.array(
    z.object({
      objective: z.string(),
      evidence: z.string().describe("Signal concret (actualité, recrutement, lancement, levée...) avec date si possible"),
    }),
  ),
  recentNews: z.array(
    z.object({
      headline: z.string(),
      date: z.string(),
      implication: z.string().describe("Ce que ça implique pour une campagne publicitaire"),
    }),
  ),
  competitors: z.array(
    z.object({
      name: z.string(),
      note: z.string().describe("Différence clé / présence publicitaire connue"),
    }),
  ),
  keywords: z.array(KeywordSchema),
  subreddits: z.array(SubredditSchema),
  interests: z.array(z.string()).describe("Catégories d'intérêts Reddit pertinentes"),
  redditFit: z.object({
    score: z.number().describe("Adéquation de la marque avec Reddit, 0 à 100"),
    verdict: z.string().describe("Une phrase de verdict"),
    strengths: z.array(z.string()),
    watchouts: z.array(z.string()),
  }),
  quickWins: z.array(z.string()).describe("3 à 5 idées d'actions Reddit immédiates et créatives"),
  keyTakeaways: z.array(z.string()).describe("En bref : exactement 3 constats clés pour un media buyer, une phrase courte chacun"),
  nextAction: z.string().describe("L'action recommandée en premier, une phrase à l'impératif"),
  countryInsights: z.array(CountryInsightSchema).describe("Un encart par pays visé, dans l'ordre demandé ; liste vide si aucun pays"),
});
export type CompanyIntel = Omit<z.infer<typeof CompanyIntelSchema>, "subreddits"> & {
  subreddits: Subreddit[];
  /** Ancien format (un seul pays), conservé pour relire l'historique. */
  countryInsight?: CountryInsight | null;
};


export const AdSchema = z.object({
  headline: z.string().describe("Titre du post sponsorisé (Reddit: 300 caractères max, idéalement < 100)"),
  body: z.string().describe("Texte du post (optionnel sur Reddit, court et authentique)"),
  cta: z.enum(REDDIT_CTAS),
  format: z.enum(["Image", "Vidéo", "Carrousel", "Texte", "Conversation Ad", "Product Ad"]),
  visualIdea: z.string().describe("Description du visuel ou de la vidéo"),
  angle: z.string().describe("Angle psychologique / hook utilisé"),
});
export type Ad = z.infer<typeof AdSchema>;

export const CampaignConceptSchema = z.object({
  name: z.string(),
  bigIdea: z.string().describe("Le concept créatif en 1-2 phrases"),
  objective: z.enum(REDDIT_OBJECTIVES),
  funnelStage: z.enum(["Awareness", "Considération", "Conversion", "Fidélisation"]),
  whyReddit: z.string().describe("Pourquoi ce concept fonctionne spécifiquement sur Reddit"),
  targeting: z.object({
    communities: z.array(z.string()).describe("Subreddits sans le préfixe r/"),
    interests: z.array(z.string()),
    keywords: z.array(z.string()),
    geo: z.string(),
    devices: z.string(),
  }),
  ads: z.array(AdSchema),
  budgetSplitPercent: z.number().describe("Part du budget total allouée à ce concept, en %"),
  bidStrategy: z.string(),
  kpis: z.array(z.string()),
  abTest: z.string().describe("Hypothèse de test A/B à lancer en premier"),
  communityPlay: z.string().describe("Action organique d'accompagnement (AMA, réponse aux commentaires, post fondateur...)"),
  risks: z.array(z.string()),
});
export type CampaignConcept = z.infer<typeof CampaignConceptSchema>;

export const CampaignPlanSchema = z.object({
  strategySummary: z.string().describe("Synthèse stratégique en 2-3 phrases"),
  insight: z.string().describe("L'insight audience clé sur lequel tout repose"),
  concepts: z.array(CampaignConceptSchema),
  headlineBank: z.array(z.string()).describe("10 headlines supplémentaires, variées en ton"),
  commentReplies: z.array(
    z.object({
      likelyComment: z.string().describe("Commentaire probable d'un redditor sous la pub"),
      reply: z.string().describe("Réponse recommandée de la marque"),
    }),
  ),
  launchChecklist: z.array(z.string()),
});
export type CampaignPlan = z.infer<typeof CampaignPlanSchema>;

export const Source = z.object({ title: z.string(), url: z.string() });
export type Source = z.infer<typeof Source>;

export interface AnalysisOptions {
  /** Identifiant du modèle Claude (voir lib/models.ts). */
  model: string;
  /** Codes des pays visés (voir lib/countries.ts), vide = aucun. */
  countries: string[];
  forceDemo?: boolean;
}

export interface CampaignBrief {
  brief: string;
  objective: RedditObjective | "auto";
  monthlyBudget: number;
  tone: string;
  geo: string;
}

/** Messages de streaming NDJSON entre l'API et le client. */
export type StreamEvent<T> =
  | { type: "stage"; label: string }
  | { type: "source"; source: Source }
  | { type: "result"; data: T; mode: "live" | "knowledge" | "demo"; sources: Source[] }
  | { type: "error"; message: string };
