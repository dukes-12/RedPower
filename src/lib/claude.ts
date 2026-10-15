import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import { DEFAULT_MODEL, isModelId, type ModelId } from "./models";
import { CAMPAIGN_RULES, COMPANY_RULES, campaignPrompt, countryResearch, countryRules } from "./prompts";
import {
  type CampaignBrief,
  type CampaignPlan,
  CampaignPlanSchema,
  type CompanyIntel,
  CompanyIntelSchema,
  type Source,
} from "./schemas";

const ENV_MODEL = process.env.REDPOWER_MODEL;
const MODEL: ModelId = isModelId(ENV_MODEL) ? ENV_MODEL : DEFAULT_MODEL;
const FALLBACK_BETA = "server-side-fallback-2026-07-01";

/** Modèle demandé par l'utilisateur, limité à la liste autorisée. */
export function resolveModel(requested: unknown): ModelId {
  return isModelId(requested) ? requested : MODEL;
}

/** Repli serveur en cas de refus : non proposé pour Haiku. */
function fallbackParams(model: ModelId) {
  return model === "claude-haiku-5-5" ? {} : { betas: [FALLBACK_BETA], fallbacks: "default" as const };
}

/** La recherche web à filtrage dynamique n'existe que sur Opus et Sonnet ; Haiku et Fable utilisent la version de base. */
function webSearchTool(model: ModelId): Anthropic.Beta.BetaToolUnion {
  return model === "claude-opus-5-5" || model === "claude-sonnet-5-5"
    ? { type: "web_search_20260209", name: "web_search", max_uses: 8 }
    : { type: "web_search_20250305", name: "web_search", max_uses: 8 };
}

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
async function research(company: string, model: ModelId, countries: string[], emit: Emit): Promise<{ notes: string; sources: Source[] }> {
  const anthropic = getClient();
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    {
      role: "user",
      content: `Entreprise à analyser : « ${company} ».
Aujourd'hui nous sommes le ${new Date().toISOString().slice(0, 10)}.
Si le nom est ambigu, choisis l'entreprise la plus connue et précise-le.
Termine par une section "Reddit" listant les subreddits pertinents (avec taille approximative) et une section "Budget" avec tes estimations chiffrées.${countryResearch(countries)}`,
    },
  ];
  const sources = new Map<string, Source>();
  let notes = "";

  // Boucle pour gérer pause_turn : une recherche longue peut être mise en pause côté serveur.
  for (let turn = 0; turn < 4; turn++) {
    const stream = anthropic.beta.messages.stream({
      model,
      max_tokens: 32000,
      ...fallbackParams(model),
      system: RESEARCH_SYSTEM,
      output_config: { effort: "medium" },
      tools: [webSearchTool(model)],
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
async function structure<T extends z.ZodType>(model: ModelId, schema: T, system: string, prompt: string): Promise<z.infer<T>> {
  const anthropic = getClient();
  const response = await anthropic.beta.messages.parse({
    model,
    max_tokens: 32000,
    ...fallbackParams(model),
    system,
    output_config: { effort: "low", format: betaZodOutputFormat(schema) },
    messages: [{ role: "user", content: prompt }],
  });
  if (response.stop_reason === "refusal") throw new Error("Le modèle a refusé de générer ce contenu.");
  if (response.stop_reason === "max_tokens") throw new Error("Réponse tronquée (limite de tokens atteinte).");
  if (!response.parsed_output) throw new Error("Réponse du modèle illisible, réessayez.");
  return response.parsed_output as z.infer<T>;
}

export async function analyzeCompanyLive(
  company: string,
  opts: { model: ModelId; countries: string[] },
  emit: Emit,
): Promise<{ intel: CompanyIntel; sources: Source[] }> {
  emit({ type: "stage", label: "Lancement de la recherche web…" });
  const { notes, sources } = await research(company, opts.model, opts.countries, emit);
  emit({ type: "stage", label: "Synthèse du profil, du budget et des communautés…" });
  const intel = await structure(
    opts.model,
    CompanyIntelSchema,
    `${COMPANY_RULES}\n${countryRules(opts.countries)}`,
    `Entreprise : ${company}\n\nNotes de recherche :\n${notes}`,
  );
  return { intel, sources };
}

export async function generateCampaignLive(brief: CampaignBrief, intel: CompanyIntel | null, model: ModelId, emit: Emit): Promise<CampaignPlan> {
  emit({ type: "stage", label: "Analyse du brief et de l'audience…" });
  emit({ type: "stage", label: "Génération des concepts, headlines et ciblages…" });
  return structure(
    model,
    CampaignPlanSchema,
    CAMPAIGN_RULES,
    campaignPrompt(brief, intel),
  );
}

export { MODEL };
