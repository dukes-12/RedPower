/**
 * Préparation d'appel (discovery call) : questions à résoudre AVANT l'appel,
 * selon que le client est un annonceur direct ou une agence.
 * Sans dépendance à zod (utilisé dans la version artifact).
 */

export type ClientType = "direct" | "agency";

export const CLIENT_TYPES: { id: ClientType; label: string; hint: string }[] = [
  { id: "direct", label: "Annonceur direct", hint: "La marque achète elle-même ses campagnes" },
  { id: "agency", label: "Agence", hint: "Une agence média ou créative qui gère des clients" },
];

export interface PrepQuestion {
  id: string;
  question: string;
  /** Où la réponse se trouve en général (affiché si la réponse est à vérifier). */
  source: string;
}

export const PREP_QUESTIONS: Record<ClientType, PrepQuestion[]> = {
  direct: [
    { id: "q1", question: "De quoi parle l'entreprise ?", source: "Site web (accueil, « À propos »), LinkedIn" },
    { id: "q2", question: "Où l'entreprise est-elle située ? Quels sont ses produits et services ?", source: "Site web, mentions légales, LinkedIn" },
    { id: "q3", question: "Client inbound ou outbound ? A-t-il déjà une campagne en cours ? Si oui, quelle stratégie ?", source: "Salesforce (SFDC) : origine du lead, historique des opportunités et des campagnes" },
    { id: "q4", question: "A-t-il un site web, et comment est-il structuré ? Sur quelles autres plateformes fait-il de la publicité ?", source: "Site web, bibliothèques publicitaires (Meta Ad Library, Google Ads Transparency, TikTok Creative Center)" },
    { id: "q5", question: "Y a-t-il des temps forts saisonniers à venir ?", source: "Calendrier du secteur, historique de communication, actualités" },
    { id: "q6", question: "Peut-on déjà imaginer une stratégie à pitcher à partir de la prep ? Est-ce un top client qui demande un pitch plus fort ?", source: "Synthèse des notes de prep, priorité du compte dans Salesforce" },
  ],
  agency: [
    { id: "q1", question: "Quelle est la taille et la structure de l'agence ? Le site web donne-t-il des indices ?", source: "Site web (équipe, bureaux), LinkedIn (effectifs)" },
    { id: "q2", question: "Où se trouve le siège ? (évite d'échanger avec un contact basé dans un pays où nous ne pouvons pas proposer nos services)", source: "Site web, mentions légales, LinkedIn" },
    { id: "q3", question: "Inbound ou outbound ? Ont-ils déjà mené des campagnes avec nous ? Si oui, quelle stratégie ?", source: "Salesforce (SFDC) : origine du lead, historique des campagnes de l'agence" },
    { id: "q4", question: "Quels services proposent-ils ? Sont-ils spécialisés sur un ou plusieurs ? Quel est leur media mix ?", source: "Site web (offre, expertises), offres d'emploi, LinkedIn" },
    { id: "q5", question: "Que révèlent leurs études de cas sur leur spécialisation ?", source: "Page « Références » ou « Case studies » du site, prix et awards" },
    { id: "q6", question: "Peut-on identifier des clients de l'agence qui pourraient convenir à Reddit ?", source: "Logos clients et études de cas du site, communiqués de gain de budget" },
  ],
};

/** Déroulé de l'appel, commun aux deux types de clients. */
export const CALL_FLOW = [
  { title: "Prep", text: "Préparer l'appel pour connaître la marque" },
  { title: "Discovery", text: "Confirmer les hypothèses" },
  { title: "Tailoring & next steps", text: "Adapter la proposition, fixer la suite" },
];

export const PREP_RESOURCES = ["Salesforce (SFDC)", "Site web du client", "LinkedIn", "Bibliothèques publicitaires (Meta, Google, TikTok)", "Actualités et communiqués"];

export function isClientType(v: unknown): v is ClientType {
  return v === "direct" || v === "agency";
}
