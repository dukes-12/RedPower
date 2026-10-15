/**
 * Transport de la version artifact (claude.ai) : pas de serveur.
 * - Analyse et campagnes : capacité `sample` (Claude, sur le compte du visiteur), sans recherche web.
 * - Repli automatique sur le mode démo si Claude n'est pas disponible ou refusé.
 */
import { demoCampaign, demoCompany } from "@/lib/demo";
import { modelInfo } from "@/lib/models";
import { CAMPAIGN_RULES, COMPANY_RULES, campaignPrompt, countryRules } from "@/lib/prompts";
import { conform, type JsonSchema } from "@/lib/jsonShape";
import type { CampaignPlan, CompanyIntel } from "@/lib/schemas";

/** JSON Schemas calculés au build (voir scripts/build-artifact.mjs) : zod n'est pas embarqué dans la page. */
declare const __RP_SCHEMAS__: { company: JsonSchema; campaign: JsonSchema };
import type { Handlers, Result, Transport } from "@/lib/transport";

interface SampleFn {
  json<T = unknown>(input: string, opts?: { onText?: (u: { text: string }) => void; signal?: AbortSignal; modelTier?: "quick" | "default" | "complex"; model?: string }): Promise<T>;
}
interface SampleError {
  code: string;
  message: string;
}
declare global {
  interface Window {
    claude?: { use(name: string): Promise<unknown> };
  }
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
let samplePromise: Promise<SampleFn | null> | null = null;
let declined = false;

function getSample(): Promise<SampleFn | null> {
  samplePromise ??= window.claude ? (window.claude.use("sample") as Promise<SampleFn | null>).catch(() => null) : Promise.resolve(null);
  return samplePromise;
}

const ERRORS: Record<string, string> = {
  not_granted: "Accès à Claude refusé pour cette page : passage en mode démo.",
  sampling_disabled: "Claude n'est pas disponible pour ce compte : passage en mode démo.",
  rate_limited: "Trop de demandes ou limite d'usage atteinte. Réessayez dans quelques minutes.",
  invalid_json: "La réponse de Claude n'a pas pu être lue. Réessayez.",
  refused: "Claude a refusé cette demande. Reformulez-la.",
  session_expired: "Session expirée : reconnectez-vous à claude.ai.",
};

function toError(e: unknown): Error {
  const code = (e as SampleError)?.code;
  if (code === "not_granted" || code === "sampling_disabled" || code === "not_declared" || code === "capability_disabled") declined = true;
  return new Error(ERRORS[code] ?? "Claude est momentanément indisponible. Réessayez.");
}

/** Valide la réponse ; complète les champs manquants par la structure démo plutôt que d'échouer. */
function coerce<T>(schema: JsonSchema, raw: unknown, fallback: T): T {
  const direct = conform(schema, raw);
  if (direct.errors.length === 0) return direct.value as T;
  const merged = { ...(fallback as object), ...((direct.value && typeof direct.value === "object" ? direct.value : {}) as object) };
  const second = conform(schema, merged);
  if (second.errors.length === 0) return second.value as T;
  throw new Error("Réponse de Claude incomplète. Réessayez.");
}

function progress(h: Handlers, label: string) {
  let last = 0;
  return ({ text }: { text: string }) => {
    if (text.length - last > 600) {
      last = text.length;
      h.onStage?.(`${label} (${Math.round(text.length / 1000)} k caractères)`);
    }
  };
}

async function demoStages(h: Handlers, labels: string[]) {
  for (const l of labels) {
    h.onStage?.(l);
    await wait(350);
  }
}

/** Modèle nommé + niveau de repli si le compte du visiteur n'y a pas accès. */
function modelOptions(id: string) {
  const m = modelInfo(id);
  return { model: m.id, modelTier: m.tier };
}

const schemaText = (s: JsonSchema) => JSON.stringify(s);

export const claudeTransport: Transport = {
  async status() {
    const sample = await getSample();
    return sample
      ? {
          live: true,
          label: "Claude · votre compte",
          detail: "Analyse par Claude via votre compte claude.ai (sans recherche web)",
          demoHint: "Mode démo : données simulées. Rechargez la page et autorisez Claude pour une vraie analyse.",
        }
      : {
          live: false,
          label: "",
          detail: "",
          demoHint: "Mode démo : Claude n'est pas disponible dans cette vue, les données sont simulées.",
        };
  },

  async analyzeCompany(company, opts, h, signal): Promise<Result<CompanyIntel>> {
    const sample = await getSample();
    if (!sample || opts.forceDemo || declined) {
      await demoStages(h, ["Recherche (simulée)…", "Estimation du budget…", "Cartographie des communautés Reddit…"]);
      return { data: demoCompany(company, opts.country), mode: "demo", sources: [] };
    }
    h.onStage?.(`Claude ${modelInfo(opts.model).label} analyse l'entreprise… (une autorisation peut vous être demandée)`);
    const prompt = `Tu es un analyste senior en stratégie média et intelligence économique, spécialiste de Reddit Ads.
Produis la fiche de l'entreprise « ${company} » à partir de tes connaissances (date du jour : ${new Date().toISOString().slice(0, 10)}).
Si le nom est ambigu, choisis l'entreprise la plus connue et précise-le dans le résumé. Pour les actualités, indique des dates approximatives et reste prudent sur ce qui est récent.
Quand une donnée n'est pas publique (budget marketing notamment), estime-la avec un raisonnement explicite (ratio marketing/CA du secteur et du stade de l'entreprise).

${COMPANY_RULES.replace("Tu convertis des notes de recherche en fiche entreprise structurée pour un planneur Reddit Ads. ", "")}
${countryRules(opts.country)}

Réponds uniquement avec un objet JSON conforme à ce JSON Schema :
${schemaText(__RP_SCHEMAS__.company)}`;
    try {
      const raw = await sample.json(prompt, { onText: progress(h, "Claude rédige la fiche"), signal, ...modelOptions(opts.model) });
      h.onStage?.("Vérification de la fiche…");
      return { data: coerce(__RP_SCHEMAS__.company, raw, demoCompany(company, opts.country)) as CompanyIntel, mode: "knowledge", sources: [] };
    } catch (e) {
      if ((e as SampleError)?.code === "cancelled") throw Object.assign(new Error("cancelled"), { name: "AbortError" });
      throw toError(e);
    }
  },

  async generateCampaign(brief, intel, opts, h): Promise<Result<CampaignPlan>> {
    const sample = await getSample();
    if (!sample || opts.forceDemo || declined) {
      await demoStages(h, ["Lecture du brief…", "Idéation des concepts…", "Écriture des headlines…"]);
      return { data: demoCampaign(brief, intel), mode: "demo", sources: [] };
    }
    h.onStage?.("Claude imagine les concepts…");
    const prompt = `${CAMPAIGN_RULES}

${campaignPrompt(brief, intel)}

Réponds uniquement avec un objet JSON conforme à ce JSON Schema :
${schemaText(__RP_SCHEMAS__.campaign)}`;
    try {
      const raw = await sample.json(prompt, { onText: progress(h, "Claude écrit les campagnes"), ...modelOptions(opts.model) });
      return { data: coerce(__RP_SCHEMAS__.campaign, raw, demoCampaign(brief, intel)), mode: "knowledge", sources: [] };
    } catch (e) {
      throw toError(e);
    }
  },

  // Le réseau de la page est bloqué dans un artifact : pas d'API Reddit ici.
  async searchSubreddits() {
    return [];
  },
};
