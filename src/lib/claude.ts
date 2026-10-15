import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import {
  type CampaignBrief,
  type CampaignPlan,
  CampaignPlanSchema,
  type CompanyIntel,
  CompanyIntelSchema,
  type Source,
} from "./schemas";

const MODEL = process.env.REDPOWER_MODEL || "claude-opus-5-5";
const FALLBACK_BETA = "server-side-fallback-2026-07-01";

export function hasApiKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

let client: Anthropic | null = null;
function getClient() {
  client ??= new Anthropic();
  return client;
}

type Emit = (e: { type: "stage"; label: string } | { type: "source"; source: Source }) => void;

const RESEARCH_SYSTEM = `Tu es un analyste senior en stratégie média et intelligence économique, spécialiste de Reddit Ads.
Tu enquêtes sur une entreprise à partir du web pour préparer une campagne publicitaire.
Cherche des faits récents et vérifiables : activité, produits et prix, clients cibles, taille (effectifs, CA, levées),
actualités des 12 derniers mois, recrutements marketing, lancements, campagnes publicitaires connues, concurrents,
et présence de la marque / de ses clients sur Reddit (subreddits où on parle du produit ou de sa catégorie).
Quand une donnée n'est pas publique (budget marketing notamment), estime-la avec un raisonnement explicite
(benchmarks : % du CA consacré au marketing selon le secteur et le stade de l'entreprise).
Rédige des notes de recherche factuelles et denses, en français, en citant les dates.`;

/**
 * Étape 1 : recherche web temps réel (outil serveur web_search).
 * Retourne des notes en texte libre + les sources consultées.
 */
async function research(company: string, emit: Emit): Promise<{ notes: string; sources: Source[] }> {
  const anthropic = getClient();
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    {
      role: "user",
      content: `Entreprise à analyser : « ${company} ».
Aujourd'hui nous sommes le ${new Date().toISOString().slice(0, 10)}.
Si le nom est ambigu, choisis l'entreprise la plus connue et précise-le.
Termine par une section "Reddit" listant les subreddits pertinents (avec taille approximative) et une section "Budget" avec tes estimations chiffrées.`,
    },
  ];
  const sources = new Map<string, Source>();
  let notes = "";

  // Boucle pour gérer pause_turn : une recherche longue peut être mise en pause côté serveur.
  for (let turn = 0; turn < 4; turn++) {
    const stream = anthropic.beta.messages.stream({
      model: MODEL,
      max_tokens: 32000,
      betas: [FALLBACK_BETA],
      fallbacks: "default",
      system: RESEARCH_SYSTEM,
      output_config: { effort: "medium" },
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 8 }],
      messages,
    });

    stream.on("streamEvent", (event) => {
      if (event.type === "content_block_start" && event.content_block.type === "server_tool_use") {
        emit({ type: "stage", label: "Recherche web en cours…" });
      }
    });

    const response = await stream.finalMessage();

    for (const block of response.content) {
      if (block.type === "server_tool_use" && block.name === "web_search") {
        const q = (block.input as { query?: string })?.query;
        if (q) emit({ type: "stage", label: `Recherche : « ${q} »` });
      } else if (block.type === "web_search_tool_result" && Array.isArray(block.content)) {
        for (const r of block.content) {
          if (r.type === "web_search_result" && !sources.has(r.url)) {
            const s = { title: r.title, url: r.url };
            sources.set(r.url, s);
            emit({ type: "source", source: s });
          }
        }
      } else if (block.type === "text") {
        notes += block.text;
      }
    }

    if (response.stop_reason === "refusal") {
      throw new Error("La recherche a été refusée par le modèle pour cette entreprise.");
    }
    if (response.stop_reason !== "pause_turn") break;
    messages.push({ role: "assistant", content: response.content });
  }

  return { notes, sources: [...sources.values()].slice(0, 20) };
}

/** Étape de structuration : transforme du texte en JSON validé par un schéma Zod. */
async function structure<T extends z.ZodType>(schema: T, system: string, prompt: string): Promise<z.infer<T>> {
  const anthropic = getClient();
  const response = await anthropic.beta.messages.parse({
    model: MODEL,
    max_tokens: 32000,
    betas: [FALLBACK_BETA],
    fallbacks: "default",
    system,
    output_config: { effort: "low", format: betaZodOutputFormat(schema) },
    messages: [{ role: "user", content: prompt }],
  });
  if (response.stop_reason === "refusal") throw new Error("Le modèle a refusé de générer ce contenu.");
  if (response.stop_reason === "max_tokens") throw new Error("Réponse tronquée (limite de tokens atteinte).");
  if (!response.parsed_output) throw new Error("Réponse du modèle illisible, réessayez.");
  return response.parsed_output as z.infer<T>;
}

export async function analyzeCompanyLive(company: string, emit: Emit): Promise<{ intel: CompanyIntel; sources: Source[] }> {
  emit({ type: "stage", label: "Lancement de la recherche web…" });
  const { notes, sources } = await research(company, emit);
  emit({ type: "stage", label: "Synthèse du profil, du budget et des communautés…" });
  const intel = await structure(
    CompanyIntelSchema,
    `Tu convertis des notes de recherche en fiche entreprise structurée pour un planneur Reddit Ads. Écris en français.
Règles :
- Ne jamais inventer de chiffre présenté comme un fait : les estimations sont des fourchettes, et la confiance l'indique.
- 8 à 12 subreddits réels et actifs (pas de communautés inventées), triés par pertinence, mélangeant grandes communautés et niches.
- 15 à 20 keywords couvrant les 4 intentions (découverte, considération, achat, problème), en anglais ET en français si pertinent.
- Budget Reddit recommandé réaliste pour un test de 1 à 3 mois, cohérent avec la taille de l'entreprise (minimum 1500 USD/mois).
- quickWins : idées concrètes, créatives et spécifiques à cette marque (AMA du fondateur, thread de feedback, offre réservée aux redditors...).`,
    `Entreprise : ${company}\n\nNotes de recherche :\n${notes}`,
  );
  return { intel, sources };
}

export async function generateCampaignLive(brief: CampaignBrief, intel: CompanyIntel | null, emit: Emit): Promise<CampaignPlan> {
  emit({ type: "stage", label: "Analyse du brief et de l'audience…" });
  const context = intel
    ? `Fiche entreprise (JSON) :\n${JSON.stringify({
        name: intel.name,
        tagline: intel.tagline,
        summary: intel.summary,
        products: intel.products,
        targetAudiences: intel.targetAudiences,
        currentObjectives: intel.currentObjectives,
        competitors: intel.competitors,
        keywords: intel.keywords.map((k) => k.term),
        subreddits: intel.subreddits.map((s) => ({ name: s.name, tone: s.tone, risk: s.risk })),
        interests: intel.interests,
      })}`
    : "Aucune fiche entreprise : déduis le contexte du brief.";

  emit({ type: "stage", label: "Génération des concepts, headlines et ciblages…" });
  return structure(
    CampaignPlanSchema,
    `Tu es directeur de création et media buyer expert Reddit Ads. Tu écris des campagnes qui ne ressemblent pas à des pubs :
Reddit récompense la transparence, l'humour, l'autodérision, la spécificité, et punit le jargon marketing, le hype et le clickbait.
Les commentaires sont ouverts sous les pubs Reddit : chaque concept doit survivre à la section commentaires.
Règles :
- 3 concepts contrastés (angles, étapes du funnel et formats différents) dont la somme de budgetSplitPercent = 100.
- 3 annonces par concept, headlines < 120 caractères, natifs Reddit, dans la langue du marché ciblé.
- Ciblage : subreddits réels sans préfixe r/, intérêts Reddit, keywords.
- Respecte le ton demandé et l'objectif s'il est imposé ; sinon choisis le meilleur objectif Reddit pour chaque concept.
- Sois créatif : formats Conversation Ads, AMA, threads "on a lu vos critiques", easter eggs pour une communauté, etc.
Écris en français (sauf les annonces si le marché est anglophone).`,
    `${context}

Brief / besoin : ${brief.brief}
Objectif imposé : ${brief.objective === "auto" ? "à toi de choisir" : brief.objective}
Budget mensuel : ${brief.monthlyBudget} USD
Ton souhaité : ${brief.tone}
Zone géographique / langue : ${brief.geo}`,
  );
}

export { MODEL };
