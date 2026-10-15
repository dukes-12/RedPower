import { countryInfo } from "./countries";
import type { CampaignBrief, CompanyIntel } from "./schemas";

/** Consignes partagées par la version serveur (API) et la version artifact (claude.ai). */

export const COMPANY_RULES = `Tu convertis des notes de recherche en fiche entreprise structurée pour un planneur Reddit Ads. Écris en français.
Règles :
- Ne jamais inventer de chiffre présenté comme un fait : les estimations sont des fourchettes, et la confiance l'indique.
- 8 à 12 subreddits réels et actifs (pas de communautés inventées), triés par pertinence, mélangeant grandes communautés et niches.
- 15 à 20 keywords couvrant les 4 intentions (découverte, considération, achat, problème), en anglais ET en français si pertinent.
- Budget Reddit recommandé réaliste pour un test de 1 à 3 mois, cohérent avec la taille de l'entreprise (minimum 1500 USD/mois).
- quickWins : idées concrètes, créatives et spécifiques à cette marque (AMA du fondateur, thread de feedback, offre réservée aux redditors...).`;

export const CAMPAIGN_RULES = `Tu es directeur de création et media buyer expert Reddit Ads. Tu écris des campagnes qui ne ressemblent pas à des pubs :
Reddit récompense la transparence, l'humour, l'autodérision, la spécificité, et punit le jargon marketing, le hype et le clickbait.
Les commentaires sont ouverts sous les pubs Reddit : chaque concept doit survivre à la section commentaires.
Règles :
- 3 concepts contrastés (angles, étapes du funnel et formats différents) dont la somme de budgetSplitPercent = 100.
- 3 annonces par concept, headlines < 120 caractères, natifs Reddit, dans la langue du marché ciblé.
- Ciblage : subreddits réels sans préfixe r/, intérêts Reddit, keywords.
- Respecte le ton demandé et l'objectif s'il est imposé ; sinon choisis le meilleur objectif Reddit pour chaque concept.
- Sois créatif : formats Conversation Ads, AMA, threads "on a lu vos critiques", easter eggs pour une communauté, etc.
Écris en français (sauf les annonces si le marché est anglophone).`;

export function campaignPrompt(brief: CampaignBrief, intel: CompanyIntel | null): string {
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
        countryInsight: intel.countryInsight,
      })}`
    : "Aucune fiche entreprise : déduis le contexte du brief.";

  return `${context}

Brief / besoin : ${brief.brief}
Objectif imposé : ${brief.objective === "auto" ? "à toi de choisir" : brief.objective}
Budget mensuel : ${brief.monthlyBudget} USD
Ton souhaité : ${brief.tone}
Zone géographique / langue : ${brief.geo}`;
}

/** Consigne pour l'encart pays : vide si aucun pays visé. */
export function countryRules(code: string): string {
  const c = countryInfo(code);
  if (!c.code) return "- countryInsight : null (aucun pays visé).";
  return `- countryInsight (obligatoire) : pays visé = ${c.label} (langue : ${c.lang}). Décris comment la marque est perçue DANS CE PAYS :
  présence commerciale, notoriété, image et réputation locales (y compris controverses ou bad buzz connus), sentiment,
  3 à 5 différences concrètes avec le reste du monde (offre, prix, concurrence locale, culture, réglementation publicitaire),
  concurrents locaux, subreddits nationaux ou dans la langue du pays, et conseils d'adaptation du ton des annonces.
  Si la marque n'est pas présente dans ce pays, dis-le (presence = "absente") et explique ce que cela change.`;
}

/** Consigne à ajouter à la recherche web quand un pays est visé. */
export function countryResearch(code: string): string {
  const c = countryInfo(code);
  if (!c.code) return "";
  return `\nPays visé : ${c.label}. Fais aussi des recherches spécifiques à ce pays (presse locale, avis, présence commerciale, prix locaux, concurrents locaux, discussions sur les subreddits du pays) et termine par une section "Perception en ${c.label}".`;
}
