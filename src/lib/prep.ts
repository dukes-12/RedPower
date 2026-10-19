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

/* ---------- Questions business à poser pendant l'appel ---------- */

export const BUSINESS_THEMES = ["objectives", "audience", "budget", "mix", "timing", "decision", "creative"] as const;
export type BusinessTheme = (typeof BUSINESS_THEMES)[number];

export const THEME_LABELS: Record<ClientType, Record<BusinessTheme, string>> = {
  direct: {
    objectives: "Objectifs business",
    audience: "Audience",
    budget: "Budget & KPIs",
    mix: "Mix média",
    timing: "Calendrier",
    decision: "Process de décision",
    creative: "Créa & mesure",
  },
  agency: {
    objectives: "Objectifs de l'agence",
    audience: "Clients & verticales",
    budget: "Volumes & KPIs",
    mix: "Mix média recommandé",
    timing: "Calendrier clients",
    decision: "Process de décision",
    creative: "Créa & mesure",
  },
};

export interface BusinessQuestion {
  theme: BusinessTheme;
  question: string;
  why: string;
}

/** Questions de base, utilisées en mode démo et pour les analyses antérieures à cette section. */
export const BUSINESS_QUESTIONS: Record<ClientType, BusinessQuestion[]> = {
  direct: [
    { theme: "objectives", question: "Quels sont vos objectifs business prioritaires pour les 6 à 12 prochains mois ?", why: "Aligner la proposition sur ce qui compte pour la direction." },
    { theme: "objectives", question: "À quoi ressemblerait un premier test Reddit réussi pour vous ?", why: "Fixer dès maintenant le critère de succès du test." },
    { theme: "audience", question: "Qui est votre client idéal, et quels segments avez-vous du mal à toucher aujourd'hui ?", why: "Reddit est fort sur les audiences difficiles à atteindre ailleurs." },
    { theme: "audience", question: "Quels sujets ou communautés votre audience suit-elle en ligne ?", why: "Trouver les subreddits à cibler en priorité." },
    { theme: "budget", question: "Comment votre budget média est-il réparti entre les plateformes ?", why: "Estimer la part que Reddit peut prendre." },
    { theme: "budget", question: "Quels KPIs suivez-vous (CPA, ROAS, notoriété…) et quelles sont vos cibles ?", why: "Choisir l'objectif de campagne et calibrer la simulation." },
    { theme: "mix", question: "Quelles plateformes fonctionnent le mieux pour vous, et lesquelles moins ?", why: "Positionner Reddit en complément de ce qui marche." },
    { theme: "mix", question: "Avez-vous déjà testé Reddit, en organique ou en payant ?", why: "Partir de l'existant et lever les a priori." },
    { theme: "timing", question: "Quels sont vos prochains lancements ou temps forts ?", why: "Caler le test sur un moment porteur." },
    { theme: "timing", question: "Quand se décident les budgets du prochain trimestre ?", why: "Savoir quand revenir avec une proposition." },
    { theme: "decision", question: "Qui intervient dans la décision de tester une nouvelle plateforme ?", why: "Identifier les décideurs à embarquer." },
    { theme: "decision", question: "Dans quel délai pourriez-vous lancer un test ?", why: "Définir des next steps réalistes." },
    { theme: "creative", question: "Quels formats créatifs avez-vous déjà (vidéo, image, UGC) ?", why: "Évaluer l'effort de production pour Reddit." },
    { theme: "creative", question: "Comment mesurez-vous les conversions (pixel, Conversions API, MMP) ?", why: "Anticiper la mise en place du tracking." },
  ],
  agency: [
    { theme: "objectives", question: "Quels sont les objectifs de croissance de l'agence cette année ?", why: "Présenter Reddit comme un levier de différenciation pour l'agence." },
    { theme: "objectives", question: "Quels clients cherchent de nouveaux relais de croissance en ce moment ?", why: "Repérer les comptes à pitcher en premier." },
    { theme: "audience", question: "Quelles verticales représentent le plus de budget chez vous ?", why: "Prioriser les cas d'usage Reddit par secteur." },
    { theme: "audience", question: "Quels clients visent des audiences difficiles à toucher (tech, gaming, finance…) ?", why: "Ce sont les meilleurs candidats pour un pilote." },
    { theme: "budget", question: "Quel volume média gérez-vous en social, et comment est-il réparti ?", why: "Mesurer le potentiel global de l'agence." },
    { theme: "budget", question: "Quels KPIs vos clients vous demandent-ils de tenir ?", why: "Adapter la proposition aux attentes des annonceurs." },
    { theme: "mix", question: "Quelles plateformes recommandez-vous par défaut à vos clients ?", why: "Comprendre où Reddit doit trouver sa place." },
    { theme: "mix", question: "Avez-vous déjà activé Reddit pour un client ? Avec quel résultat ?", why: "Capitaliser sur l'expérience existante ou lever les freins." },
    { theme: "timing", question: "Quand se préparent les plans média de vos clients ?", why: "Entrer dans les plans au bon moment." },
    { theme: "timing", question: "Y a-t-il des appels d'offres ou lancements clients à venir ?", why: "Proposer Reddit sur une opportunité concrète." },
    { theme: "decision", question: "Qui décide d'ajouter une plateforme au plan d'un client : l'agence ou l'annonceur ?", why: "Savoir qui convaincre." },
    { theme: "decision", question: "Comment se passe la validation d'un pilote chez vous ?", why: "Définir des next steps réalistes." },
    { theme: "creative", question: "Qui produit les créas, et sont-elles adaptables à Reddit ?", why: "Évaluer l'effort de production." },
    { theme: "creative", question: "Quels outils de mesure et d'attribution utilisez-vous ?", why: "Anticiper le tracking et le reporting." },
  ],
};
