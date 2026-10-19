import { countryInfo } from "./countries";
import { insightsOf } from "./intel";
import { PREP_QUESTIONS, type ClientType } from "./prep";
import type { CampaignBrief, CompanyIntel } from "./schemas";

/** Consignes partagées par la version serveur (API) et la version artifact (claude.ai). */

export const COMPANY_RULES = `Tu convertis des notes de recherche en fiche entreprise structurée pour un planneur Reddit Ads. Écris en français.
Règles :
- Ne jamais inventer de chiffre présenté comme un fait : les estimations sont des fourchettes, et la confiance l'indique.
- 8 à 12 subreddits réels et actifs (pas de communautés inventées), triés par pertinence, mélangeant grandes communautés et niches.
- 15 à 20 keywords couvrant les 4 intentions (découverte, considération, achat, problème), en anglais ET en français si pertinent.
- Budget Reddit recommandé réaliste pour un test de 1 à 3 mois, cohérent avec la taille de l'entreprise (minimum 1500 USD/mois).
- quickWins : idées concrètes, créatives et spécifiques à cette marque (AMA du fondateur, thread de feedback, offre réservée aux redditors...).
- keyTakeaways : exactement 3 constats qui changent la façon de faire de la pub pour cette marque sur Reddit (pas de généralités) ; nextAction : la toute première chose à faire.`;

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

export function campaignPrompt(brief: CampaignBrief, intel: CompanyIntel | null, clientType: ClientType = "direct"): string {
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
        countryInsights: insightsOf(intel),
      })}`
    : "Aucune fiche entreprise : déduis le contexte du brief.";

  const agency =
    clientType === "agency"
      ? "\nType de client : AGENCE. Les concepts sont à proposer à l'agence pour ses clients (ou pour un pilote Reddit sur un client précis) : indique pour quel type de client chaque concept est pensé.\n"
      : "";
  return `${context}
${agency}
Brief / besoin : ${brief.brief}
Objectif imposé : ${brief.objective === "auto" ? "à toi de choisir" : brief.objective}
Budget mensuel : ${brief.monthlyBudget} USD
Ton souhaité : ${brief.tone}
Zone géographique / langue : ${brief.geo}`;
}

/** Consignes pays : encart par pays + orientation de toute la fiche vers ces marchés. */
export function countryRules(codes: string[]): string {
  if (!codes.length) return "- countryInsights : liste vide (aucun pays visé). Les recommandations restent globales.";
  const list = codes.map((c) => countryInfo(c)).map((c) => `${c.label} (langue : ${c.lang})`).join(" ; ");
  return `- Pays visés : ${list}. TOUTE la fiche doit être orientée vers ${codes.length > 1 ? "ces marchés" : "ce marché"} :
  currentObjectives, quickWins, keyTakeaways, nextAction, budget recommandé et subreddits (inclure les communautés nationales
  ou dans la langue du pays) doivent viser ${codes.length > 1 ? "ces pays, en précisant le pays concerné quand ce n'est pas commun à tous" : "ce pays"}.
  Les keywords doivent inclure la langue de chaque pays.
- countryInsights (obligatoire) : exactement un élément par pays, dans cet ordre : ${codes.map((c) => countryInfo(c).label).join(", ")}.
  Pour chacun : présence commerciale, notoriété, image et réputation locales (y compris controverses ou bad buzz connus), sentiment,
  3 à 5 différences concrètes avec le reste du monde (offre, prix, concurrence locale, culture, réglementation publicitaire),
  concurrents locaux, subreddits nationaux ou dans la langue du pays, conseils d'adaptation du ton des annonces,
  2 à 3 objectifs publicitaires propres à ce pays, un score d'opportunité (0-100) et un budget Reddit mensuel conseillé pour ce pays.
  Si la marque n'est pas présente dans un pays, dis-le (presence = "absente") et explique ce que cela change.`;
}

/** Consigne à ajouter à la recherche web quand des pays sont visés. */
export function countryResearch(codes: string[]): string {
  if (!codes.length) return "";
  const labels = codes.map((c) => countryInfo(c).label);
  return `\nPays visés : ${labels.join(", ")}. Fais aussi des recherches spécifiques à chaque pays (presse locale, avis, présence commerciale, prix locaux, concurrents locaux, discussions sur les subreddits du pays, objectifs et lancements locaux) et termine par une section "Perception par pays".`;
}

/** Consignes selon le type de client : lecture de la fiche + brief de préparation d'appel. */
export function clientRules(type: ClientType): string {
  const questions = PREP_QUESTIONS[type].map((q) => `  ${q.id}. ${q.question}`).join("\n");
  const reading =
    type === "agency"
      ? `- Le client est une AGENCE (pas un annonceur). Lis la fiche du point de vue de l'agence :
  products = ses services ; targetAudiences = ses types de clients et verticales ; competitors = agences concurrentes ;
  subreddits et keywords = ceux qui serviraient les verticales de ses principaux clients ;
  budget = volume média géré estimé et potentiel Reddit des comptes de l'agence ;
  quickWins, keyTakeaways et nextAction = comment embarquer l'agence et quels clients pitcher en premier.`
      : `- Le client est un ANNONCEUR DIRECT : la fiche porte sur la marque elle-même.`;
  return `${reading}
- prepBrief (obligatoire) : brief de préparation de l'appel de découverte. Le déroulé est Prep -> Discovery (confirmer les hypothèses) -> Tailoring & next steps.
  answers : exactement une réponse par question ci-dessous, dans l'ordre, avec son id :
${questions}
  Les informations internes (inbound/outbound, campagnes passées avec Reddit, priorité du compte) ne sont pas publiques :
  donne les indices publics s'il y en a, mets status = "à vérifier" et indique précisément où vérifier (Salesforce / SFDC, page du site, LinkedIn...).
  Ne présente jamais une supposition comme un fait. Respecte l'équilibre prep / discovery : ce qui ne peut pas être établi en prep
  devient une hypothèse à confirmer ou une question de discovery.
  ${type === "agency" ? "Pour le siège, signale s'il faut vérifier que le pays fait partie des marchés où nous pouvons proposer nos services." : "Pour la saisonnalité, cite les temps forts des 3 à 6 prochains mois."}`;
}

/** Consigne à ajouter à la recherche web selon le type de client. */
export function clientResearch(type: ClientType): string {
  return type === "agency"
    ? `\nLe client est une AGENCE : cherche sa taille et sa structure (bureaux, effectifs LinkedIn), son siège, ses services et son media mix, ses études de cas, ses clients connus (logos, gains de budget) et lesquels pourraient convenir à Reddit. Termine par une section "Préparation d'appel".`
    : `\nPrépare aussi un appel de découverte : produits, localisation, structure du site, autres plateformes publicitaires utilisées (bibliothèques publicitaires), temps forts saisonniers à venir. Termine par une section "Préparation d'appel".`;
}
