/**
 * Mode démo : génère des fiches et campagnes plausibles sans clé API.
 * Tout est déterministe (même nom → même résultat) et explicitement étiqueté "démo" dans l'UI.
 */
import { countryInfo } from "./countries";
import type { CampaignBrief, CampaignConcept, CampaignPlan, CompanyIntel, RedditObjective, Subreddit } from "./schemas";

interface Archetype {
  industry: string;
  businessModel: string;
  persona: [string, string][];
  subreddits: [name: string, members: number, audience: string][];
  keywords: string[];
  interests: string[];
  competitors: string[];
  fit: number;
  products: [string, string, string][];
}

const ARCHETYPES: Record<string, Archetype> = {
  saas: {
    industry: "Logiciel / SaaS",
    businessModel: "B2B SaaS freemium",
    persona: [["Ops & PM", "Chefs de projet et ops qui cherchent à structurer le travail d'équipe"], ["Fondateurs", "Fondateurs de startups qui veulent un outil simple et scalable"], ["Freelances", "Indépendants qui centralisent clients, notes et facturation"]],
    subreddits: [["productivity", 3_900_000, "Obsédés de l'organisation, testent beaucoup d'outils"], ["startups", 1_900_000, "Fondateurs early-stage, sensibles au prix"], ["SaaS", 380_000, "Builders et acheteurs SaaS"], ["Entrepreneur", 4_700_000, "Entrepreneurs généralistes"], ["projectmanagement", 120_000, "Professionnels de la gestion de projet"], ["sysadmin", 950_000, "Décideurs IT, très allergiques au marketing"], ["freelance", 480_000, "Indépendants à la recherche d'outils"], ["smallbusiness", 2_100_000, "TPE/PME pragmatiques"], ["webdev", 2_800_000, "Développeurs web"]],
    keywords: ["project management tool", "notion alternative", "team wiki", "workflow automation", "productivity app", "outil gestion de projet", "remote team tools", "how to organize team docs", "best saas for startups", "free plan", "async collaboration", "knowledge base software", "meeting notes template", "kanban board", "OKR tracking", "replace spreadsheets"],
    interests: ["Technology & Computing", "Business & Finance", "Careers", "Education"],
    competitors: ["Notion", "Asana", "Monday.com", "ClickUp"],
    fit: 82,
    products: [["Plan Free", "Fonctionnalités de base pour individus", "Gratuit"], ["Plan Pro", "Collaboration et intégrations", "≈10 $/utilisateur/mois"], ["Enterprise", "SSO, sécurité, support dédié", "Sur devis"]],
  },
  fintech: {
    industry: "Fintech / Services financiers",
    businessModel: "B2C fintech, abonnement + interchange",
    persona: [["Jeunes actifs", "25-35 ans qui veulent reprendre le contrôle de leur budget"], ["Voyageurs", "Utilisateurs fréquents de paiements à l'étranger"], ["Investisseurs débutants", "Premiers pas en bourse ou crypto"]],
    subreddits: [["personalfinance", 20_000_000, "Méga-communauté budget et épargne, très exigeante"], ["financialindependence", 2_300_000, "Communauté FIRE, épargne agressive"], ["vosfinances", 260_000, "Finances perso francophones"], ["investing", 2_900_000, "Investisseurs grand public"], ["Frugal", 2_400_000, "Chasseurs d'économies"], ["travel", 9_000_000, "Voyageurs fréquents"], ["povertyfinance", 1_500_000, "Budgets serrés, sensibles aux frais cachés"], ["fintech", 90_000, "Professionnels et early adopters fintech"]],
    keywords: ["no fee bank account", "banque en ligne sans frais", "budgeting app", "best card for travel", "frais bancaires", "how to save money", "investing app", "high yield savings", "virement international", "carte sans frais à l'étranger", "budget tracker", "cashback", "compte joint", "épargne automatique"],
    interests: ["Business & Finance", "Travel", "Technology & Computing"],
    competitors: ["Revolut", "N26", "Wise", "Boursorama"],
    fit: 70,
    products: [["Compte standard", "Compte et carte sans frais", "Gratuit"], ["Premium", "Assurance voyage, retraits illimités", "≈8 €/mois"], ["Investissement", "Actions et ETF fractionnés", "Commission par ordre"]],
  },
  gaming: {
    industry: "Jeu vidéo / Gaming",
    businessModel: "Éditeur de jeux, premium + microtransactions",
    persona: [["Core gamers", "Joueurs PC/console passionnés, très actifs sur Reddit"], ["Casual mobile", "Sessions courtes, sensibles au free-to-play"], ["Créateurs", "Streamers et modders"]],
    subreddits: [["gaming", 44_000_000, "Généraliste, énorme portée"], ["pcgaming", 4_300_000, "Joueurs PC exigeants (perfs, DRM)"], ["Games", 3_400_000, "Discussions sérieuses sur l'industrie"], ["patientgamers", 900_000, "Joueurs qui attendent les promos"], ["indiegaming", 600_000, "Fans de jeux indés"], ["PS5", 2_100_000, "Joueurs PlayStation"], ["NintendoSwitch", 5_800_000, "Joueurs Switch"], ["MobileGaming", 400_000, "Joueurs mobile"]],
    keywords: ["new rpg 2026", "co-op games", "steam wishlist", "early access", "best indie games", "jeu coop", "gameplay trailer", "open world", "cozy games", "roguelike", "no microtransactions", "release date"],
    interests: ["Gaming", "Technology & Computing", "Entertainment"],
    competitors: ["Ubisoft", "Electronic Arts", "Devolver Digital"],
    fit: 92,
    products: [["Jeu principal", "Titre phare multi-plateforme", "≈40-70 $"], ["DLC / Season pass", "Contenus additionnels", "≈15-30 $"]],
  },
  ecommerce: {
    industry: "E-commerce / Retail",
    businessModel: "D2C e-commerce",
    persona: [["Acheteurs malins", "Comparent les prix et lisent les avis"], ["Éco-conscients", "Préfèrent le reconditionné ou le durable"], ["Cadeaux", "Achat d'impulsion lors des temps forts"]],
    subreddits: [["BuyItForLife", 2_300_000, "Fans de produits durables, détestent l'obsolescence"], ["frugalmalefashion", 3_000_000, "Bons plans mode"], ["femalefashionadvice", 4_000_000, "Conseils mode"], ["deals", 600_000, "Chasseurs de promos"], ["france", 1_000_000, "Communauté FR généraliste"], ["sustainability", 400_000, "Consommation responsable"], ["Frugal", 2_400_000, "Économies"], ["gifts", 150_000, "Idées cadeaux"]],
    keywords: ["best value", "promo code", "code promo", "avis", "reconditionné", "sustainable brand", "durable", "free shipping", "livraison gratuite", "gift ideas", "black friday", "comparatif", "worth it?", "alternative pas chère"],
    interests: ["Fashion & Beauty", "Home & Garden", "Shopping"],
    competitors: ["Amazon", "Zalando", "Back Market"],
    fit: 64,
    products: [["Catalogue principal", "Gamme phare", "Variable"], ["Abonnement fidélité", "Livraison gratuite et avantages", "≈5 €/mois"]],
  },
  food: {
    industry: "Grande consommation / Boissons",
    businessModel: "CPG, distribution retail + D2C",
    persona: [["Gen Z", "Sensibles à l'humour et aux marques à personnalité"], ["Healthy", "Lisent les étiquettes, cherchent moins de sucre"], ["Foodies", "Testent les nouveautés"]],
    subreddits: [["food", 24_000_000, "Méga-communauté visuelle"], ["Cooking", 4_000_000, "Cuisiniers amateurs"], ["EatCheapAndHealthy", 3_700_000, "Manger sain à petit budget"], ["fitness", 13_000_000, "Sport et nutrition"], ["snackexchange", 200_000, "Échange de snacks du monde"], ["drinks", 120_000, "Amateurs de boissons"], ["mildlyinteresting", 24_000_000, "Curiosités du quotidien"], ["HydroHomies", 1_300_000, "Fans d'hydratation, mèmes"]],
    keywords: ["healthy snack", "low sugar", "sans sucre", "new flavor", "taste test", "where to buy", "où acheter", "best energy drink", "protein snack", "vegan", "recette", "review"],
    interests: ["Food & Drink", "Sports & Fitness", "Entertainment"],
    competitors: ["Liquid Death", "Red Bull", "Danone"],
    fit: 68,
    products: [["Gamme principale", "Produit phare en grande distribution", "≈2-4 €"], ["Packs D2C", "Abonnement en ligne", "≈30 €/mois"]],
  },
  education: {
    industry: "EdTech / Éducation",
    businessModel: "App freemium + abonnement",
    persona: [["Étudiants", "Préparent examens et certifications"], ["Reconversion", "Adultes en reconversion professionnelle"], ["Curieux", "Apprentissage loisir"]],
    subreddits: [["languagelearning", 2_100_000, "Apprenants en langues, très méthodiques"], ["learnprogramming", 4_300_000, "Débutants en code"], ["GetStudying", 600_000, "Méthodes d'étude"], ["college", 1_100_000, "Étudiants US"], ["careerguidance", 800_000, "Orientation et reconversion"], ["productivity", 3_900_000, "Habitudes et routines"], ["French", 300_000, "Apprenants du français"], ["learnmath", 300_000, "Mathématiques"]],
    keywords: ["learn fast", "apprendre une langue", "study app", "certification", "online course", "streak", "how long to become fluent", "best app to learn", "reconversion", "spaced repetition", "free course", "exam prep"],
    interests: ["Education", "Careers", "Technology & Computing"],
    competitors: ["Duolingo", "Babbel", "Coursera", "OpenClassrooms"],
    fit: 78,
    products: [["Version gratuite", "Leçons de base", "Gratuit"], ["Premium", "Sans pub, fonctions avancées", "≈10 €/mois"]],
  },
  travel: {
    industry: "Voyage / Hospitalité",
    businessModel: "Marketplace / OTA, commission",
    persona: [["Backpackers", "Budget serré, voyages longs"], ["Familles", "Planifient longtemps à l'avance"], ["Digital nomads", "Travaillent en voyageant"]],
    subreddits: [["travel", 9_000_000, "Généraliste voyage"], ["solotravel", 3_000_000, "Voyageurs solo"], ["digitalnomad", 2_300_000, "Nomades digitaux"], ["TravelHacks", 1_200_000, "Astuces voyage"], ["backpacking", 3_200_000, "Routards"], ["Shoestring", 600_000, "Voyage petit budget"], ["onebag", 600_000, "Voyage léger"], ["france", 1_000_000, "Communauté FR"]],
    keywords: ["cheap flights", "vol pas cher", "itinerary", "where to stay", "travel insurance", "best time to visit", "hidden gems", "booking tips", "remote work travel", "weekend getaway", "city break", "hostel"],
    interests: ["Travel", "Food & Drink", "Outdoors"],
    competitors: ["Airbnb", "Booking.com", "Expedia"],
    fit: 72,
    products: [["Réservation", "Hébergements et expériences", "Commission"], ["Programme fidélité", "Réductions membres", "Gratuit"]],
  },
};

const KNOWN: Record<string, string> = {
  notion: "saas", slack: "saas", figma: "saas", canva: "saas", shopify: "saas", hubspot: "saas", mistral: "saas", qonto: "fintech",
  revolut: "fintech", n26: "fintech", wise: "fintech", lydia: "fintech", boursorama: "fintech", stripe: "fintech", alan: "fintech",
  ubisoft: "gaming", riot: "gaming", nintendo: "gaming", steam: "gaming", supercell: "gaming", "ea": "gaming",
  "back market": "ecommerce", backmarket: "ecommerce", vinted: "ecommerce", zalando: "ecommerce", nike: "ecommerce", sezane: "ecommerce", decathlon: "ecommerce",
  "liquid death": "food", "red bull": "food", danone: "food", oatly: "food", michel: "food",
  duolingo: "education", babbel: "education", openclassrooms: "education", coursera: "education",
  airbnb: "travel", booking: "travel", blablacar: "travel", expedia: "travel",
};

const HINTS: Array<[RegExp, string]> = [
  [/bank|pay|fin|money|cash|invest|crypto|assur/i, "fintech"],
  [/game|play|studio|arcade/i, "gaming"],
  [/shop|store|wear|fashion|market|boutique/i, "ecommerce"],
  [/food|drink|eat|bev|brew|snack|café|coffee/i, "food"],
  [/learn|edu|school|academy|course/i, "education"],
  [/travel|trip|tour|hotel|fly|air/i, "travel"],
];

function hash(s: string) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

function archetypeFor(name: string): Archetype {
  const key = name.trim().toLowerCase();
  if (KNOWN[key]) return ARCHETYPES[KNOWN[key]];
  for (const [re, k] of HINTS) if (re.test(key)) return ARCHETYPES[k];
  const keys = Object.keys(ARCHETYPES);
  return ARCHETYPES[keys[hash(key) % keys.length]];
}

const cap = (s: string) => s.trim().replace(/\b\w/g, (c) => c.toUpperCase());

export function demoCompany(rawName: string, countryCode = ""): CompanyIntel {
  const name = cap(rawName);
  const a = archetypeFor(rawName);
  const h = hash(rawName.toLowerCase());
  const sizeTier = h % 3; // 0 = startup, 1 = scale-up, 2 = grand compte
  const tiers = [
    { emp: "20-80", rev: "2-10 M$", mkt: "0,4-1,5 M$", paid: "150-500 k$", lo: 2000, hi: 6000, stage: "Série A" },
    { emp: "200-800", rev: "40-150 M$", mkt: "6-20 M$", paid: "2-6 M$", lo: 8000, hi: 25000, stage: "Série C / D" },
    { emp: "2 000-10 000", rev: "1-4 Md$", mkt: "120-400 M$", paid: "30-90 M$", lo: 40000, hi: 150000, stage: "Coté en bourse" },
  ][sizeTier];

  const subreddits: Subreddit[] = a.subreddits.map(([sub, members, audience], i) => ({
    name: sub,
    estimatedMembers: members,
    relevance: Math.max(45, 95 - i * 6 - (h >>> i) % 5),
    audience,
    tone: i % 3 === 0 ? "Généraliste : visuel fort, humour bienvenu, zéro jargon." : i % 3 === 1 ? "Exigeant : arguments concrets, transparence sur le prix." : "Niche experte : parler comme un pair, apporter de la valeur.",
    risk: (["faible", "moyen", "élevé"] as const)[(h >>> (i + 2)) % 3],
  }));

  return {
    name,
    website: `https://www.${rawName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "")}.com`,
    tagline: `${name}, acteur ${a.industry.toLowerCase()} qui mise sur la simplicité et une communauté engagée.`,
    summary: `${name} opère dans le secteur ${a.industry} avec un modèle ${a.businessModel}. Données de démonstration : ajoutez une clé ANTHROPIC_API_KEY pour une analyse réelle basée sur une recherche web en temps réel (actualités, levées, recrutements, présence sur Reddit).`,
    industry: a.industry,
    businessModel: a.businessModel,
    headquarters: "Paris, France (démo)",
    founded: String(2008 + (h % 14)),
    employees: tiers.emp,
    estimatedRevenue: tiers.rev,
    fundingStage: tiers.stage,
    products: a.products.map(([n, d, p]) => ({ name: n, description: d, pricing: p })),
    targetAudiences: a.persona.map(([persona, description]) => ({ persona, description })),
    budget: {
      totalMarketingAnnual: tiers.mkt,
      paidSocialAnnual: tiers.paid,
      recommendedRedditMonthlyLow: tiers.lo,
      recommendedRedditMonthlyHigh: tiers.hi,
      rationale: `Estimation basée sur un ratio marketing/CA typique du secteur (${a.industry}) et une allocation test de 3 à 8 % du paid social vers Reddit.`,
      confidence: "faible",
    },
    currentObjectives: [
      { objective: "Accélérer l'acquisition sur un nouveau segment", evidence: "Démo : signal type « recrutement d'un Head of Growth »" },
      { objective: "Renforcer la notoriété face aux concurrents", evidence: `Démo : concurrence frontale avec ${a.competitors[0]}` },
      { objective: "Lancer une nouvelle offre", evidence: "Démo : signal type « page produit en bêta »" },
    ],
    recentNews: [
      { headline: `${name} annonce une nouvelle fonctionnalité phare`, date: "il y a 2 mois (démo)", implication: "Angle « on vous a écoutés » idéal pour Reddit." },
      { headline: `${name} étend sa présence en Europe`, date: "il y a 5 mois (démo)", implication: "Cibler des communautés locales (r/france, r/de...)." },
    ],
    competitors: a.competitors.filter((c) => c.toLowerCase() !== rawName.trim().toLowerCase()).map((c) => ({ name: c, note: "Concurrent direct, présence publicitaire active (démo)." })),
    keywords: a.keywords.map((term, i) => ({
      term,
      intent: (["découverte", "considération", "achat", "problème"] as const)[i % 4],
      priority: (i % 3) + 1,
    })),
    subreddits,
    interests: a.interests,
    redditFit: {
      score: a.fit,
      verdict: a.fit >= 80 ? "Excellente adéquation : l'audience cible vit littéralement sur Reddit." : a.fit >= 70 ? "Bonne adéquation, à condition d'adopter un ton natif et transparent." : "Adéquation moyenne : privilégier des niches pertinentes plutôt que la portée brute.",
      strengths: ["Communautés de niche très qualifiées", "CPM inférieurs à Meta et LinkedIn", "Discussions organiques existantes sur la catégorie"],
      watchouts: ["Communautés allergiques au ton corporate", "Commentaires publics sous les pubs : prévoir une modération active"],
    },
    countryInsight: demoCountry(name, countryCode, a, h),
    quickWins: [
      `Organiser un AMA du fondateur de ${name} sur r/${a.subreddits[1][0]} puis le sponsoriser en Conversation Ad.`,
      `Post « On a lu toutes vos critiques sur ${a.competitors[0]} – voici ce qu'on a fait différemment ».`,
      "Offre exclusive redditors avec un code lié à un mème de la communauté.",
      "Sponsoriser un thread de feedback produit plutôt qu'une pub classique.",
    ],
  };
}

const LOCAL_SUBS: Record<string, string[]> = {
  FR: ["france", "vosfinances", "AskFrance", "jeuxvideo"],
  BE: ["belgium", "belgique", "brussels"],
  CH: ["Switzerland", "Romandie", "zurich"],
  "CA-QC": ["Quebec", "montreal", "PersonalFinanceCanada"],
  CA: ["canada", "PersonalFinanceCanada", "toronto"],
  US: ["AskAnAmerican", "personalfinance", "BuyItForLife"],
  GB: ["unitedkingdom", "UKPersonalFinance", "AskUK"],
  DE: ["de", "Finanzen", "germany"],
  ES: ["spain", "es", "SpainFIRE"],
  IT: ["italy", "ItaliaPersonalFinance", "Italia"],
  NL: ["thenetherlands", "geldzaken", "Netherlands"],
};

function demoCountry(name: string, code: string, a: Archetype, h: number): CompanyIntel["countryInsight"] {
  if (!code) return null;
  const c = countryInfo(code);
  const presence = (["forte", "moyenne", "faible"] as const)[(h >>> 3) % 3];
  return {
    country: c.label,
    presence,
    awareness: presence === "forte" ? `${name} est une marque connue du grand public en ${c.label} (démo).` : `${name} reste surtout connue des early adopters en ${c.label} (démo).`,
    perception: `Données de démonstration : en ${c.label}, la marque est associée à la simplicité, mais on lui reproche parfois un manque d'adaptation locale (langue, support, moyens de paiement).`,
    sentiment: (["positif", "mitigé", "inconnu"] as const)[(h >>> 5) % 3],
    differences: [
      `Offre et prix ajustés au marché ${c.label} (démo)`,
      `Concurrence locale plus forte qu'à l'international`,
      `Communication attendue en ${c.lang || "langue locale"}, ton plus direct`,
      "Réglementation et usages publicitaires spécifiques",
    ],
    localCompetitors: [`${a.competitors[0]} (démo)`, "Acteur local historique (démo)"],
    localSubreddits: LOCAL_SUBS[code] ?? [c.label.toLowerCase().replace(/[^a-z]/g, "")],
    adaptationTips: [
      `Écrire les annonces en ${c.lang || "langue locale"}, avec des références culturelles locales`,
      "Mentionner la disponibilité locale (livraison, support, prix en devise locale)",
      "Cibler les subreddits nationaux en plus des communautés thématiques",
    ],
  };
}

const OBJ_BY_STAGE: RedditObjective[] = ["Brand Awareness & Reach", "Traffic", "Conversions"];

export function demoCampaign(brief: CampaignBrief, intel: CompanyIntel | null): CampaignPlan {
  const brand = intel?.name ?? "Votre marque";
  const subs = intel?.subreddits.map((s) => s.name) ?? ["Entrepreneur", "productivity", "smallbusiness"];
  const kws = intel?.keywords.map((k) => k.term) ?? ["alternative", "review", "best tool"];
  const need = brief.brief.trim().replace(/\.$/, "") || "faire connaître notre offre";
  const short = need.length > 60 ? need.slice(0, 57) + "…" : need;
  const pick = (i: number) => subs.slice(i, i + 3).concat(subs).slice(0, 3);

  const concept = (i: number, c: Omit<CampaignConcept, "objective" | "targeting" | "budgetSplitPercent"> & { split: number }): CampaignConcept => ({
    ...c,
    objective: brief.objective === "auto" ? OBJ_BY_STAGE[i] : brief.objective,
    targeting: { communities: pick(i * 2), interests: intel?.interests ?? ["Technology & Computing"], keywords: kws.slice(i * 3, i * 3 + 5), geo: brief.geo, devices: "Mobile + desktop" },
    budgetSplitPercent: c.split,
  });

  return {
    strategySummary: `Démarrer par la crédibilité (prise de parole transparente dans les communautés clés), convertir l'attention en trafic qualifié, puis retargeter les engagés avec une offre exclusive. Brief : « ${short} ».`,
    insight: "Les redditors ne détestent pas la pub, ils détestent qu'on les prenne pour des idiots : une marque qui parle franchement de ses défauts gagne leur confiance.",
    concepts: [
      concept(0, {
        name: "On vous dit tout",
        bigIdea: `${brand} publie ce que les autres marques cachent : coulisses, chiffres, erreurs, et ouvre les commentaires.`,
        funnelStage: "Awareness",
        whyReddit: "La transparence est la monnaie de Reddit ; les commentaires ouverts deviennent un atout.",
        ads: [
          { headline: `On est ${brand}. Voici ce qu'on a raté l'an dernier (et ce qu'on a changé)`, body: "Pas de slogan. Juste ce qu'on a appris. Posez vos questions en commentaire, l'équipe répond toute la journée.", cta: "Learn More", format: "Texte", visualIdea: "Capture d'écran d'un vrai doc interne annoté", angle: "Vulnérabilité / transparence" },
          { headline: `3 ans, 14 personnes, 1 obsession : ${short.toLowerCase()}`, body: "Ce qu'on fait, pour qui, et pour qui ce n'est PAS fait.", cta: "Learn More", format: "Image", visualIdea: "Photo d'équipe non retouchée, post-its en fond", angle: "Spécificité chiffrée" },
          { headline: "Demandez-nous n'importe quoi (oui, même le prix)", body: `AMA avec l'équipe ${brand} sponsorisé.`, cta: "Learn More", format: "Conversation Ad", visualIdea: "Fil de commentaires mis en avant", angle: "Dialogue" },
        ],
        split: 30,
        bidStrategy: "CPM automatique, plafond de fréquence 3/semaine",
        kpis: ["Upvote ratio > 70 %", "Commentaires / 1000 impressions", "Recherche de marque (+%)"],
        abTest: "Titre « vulnérabilité » vs titre « chiffré » à budget égal sur 7 jours.",
        communityPlay: "Un membre de l'équipe répond aux commentaires en signant de son prénom pendant 48 h.",
        risks: ["Commentaires négatifs visibles : préparer les réponses", "Ton jugé « faussement authentique » si trop écrit"],
      }),
      concept(1, {
        name: "Le comparatif honnête",
        bigIdea: `Un comparatif où ${brand} admet où un concurrent est meilleur, et montre où il gagne.`,
        funnelStage: "Considération",
        whyReddit: "Les threads « X vs Y » sont parmi les plus recherchés ; répondre directement à ces questions capte une intention forte.",
        ads: [
          { headline: `${brand} vs ${intel?.competitors[0]?.name ?? "les autres"} : là où ils sont meilleurs que nous`, body: "Et les 3 cas où on est clairement le meilleur choix. Tableau complet dans le lien.", cta: "View More", format: "Carrousel", visualIdea: "Tableau comparatif sobre, cases vertes ET rouges", angle: "Honnêteté contre-intuitive" },
          { headline: `Vous cherchez une alternative ? Voici pour qui ${brand} n'est pas fait`, body: "Gagnez du temps : lisez ça avant de tester.", cta: "Learn More", format: "Image", visualIdea: "Checklist manuscrite", angle: "Disqualification" },
          { headline: `Ce que ${brand} coûte vraiment après 12 mois (calcul détaillé)`, body: "Pas de frais cachés, on a fait le calcul pour vous.", cta: "Learn More", format: "Image", visualIdea: "Ticket de caisse illustré", angle: "Transparence prix" },
        ],
        split: 40,
        bidStrategy: "CPC optimisé, enchère médiane recommandée",
        kpis: ["CTR > 0,6 %", "Temps passé sur la page comparatif", "Coût par visite qualifiée"],
        abTest: "Landing page comparatif vs page produit classique.",
        communityPlay: "Poster le comparatif en organique dans un subreddit qui autorise le self-promo, avec les sources.",
        risks: ["Mentionner un concurrent peut attirer ses fans", "Vérifier l'exactitude juridique du comparatif"],
      }),
      concept(2, {
        name: "Réservé aux redditors",
        bigIdea: "Une offre exclusive cachée derrière une référence culturelle de la communauté.",
        funnelStage: "Conversion",
        whyReddit: "Les communautés adorent être reconnues ; un clin d'œil interne crée de l'affinité et du bouche-à-oreille.",
        ads: [
          { headline: `Code REDDIT20 : parce que vous lisez les petites lignes`, body: `-20 % sur ${brand} pour les 1 000 premiers. Pas de piège, résiliable en 2 clics.`, cta: "Shop Now", format: "Image", visualIdea: "Snoo qui tient une loupe", angle: "Exclusivité + clin d'œil" },
          { headline: `On a mis la même offre que pour nos investisseurs. Enfin, presque.`, body: "Essai gratuit étendu à 30 jours pour la communauté.", cta: "Sign Up", format: "Image", visualIdea: "Faux slide de pitch deck humoristique", angle: "Autodérision" },
          { headline: `Testez ${brand} 30 jours. Si c'est nul, dites-le ici.`, body: "On lit tout.", cta: "Sign Up", format: "Texte", visualIdea: "Aucun visuel, texte seul", angle: "Défi / confiance" },
        ],
        split: 30,
        bidStrategy: "Optimisation conversions (CPA cible) après 50 conversions",
        kpis: ["CPA", "Taux d'utilisation du code", "ROAS"],
        abTest: "Remise % vs essai prolongé.",
        communityPlay: "Retargeter les personnes ayant engagé avec les concepts 1 et 2.",
        risks: ["Volume de conversions faible au départ", "Code partagé hors Reddit"],
      }),
    ],
    headlineBank: [
      `Honnêtement, ${brand} n'est pas pour tout le monde`,
      `Le truc qu'on aurait aimé savoir avant de créer ${brand}`,
      `On a demandé à 500 utilisateurs ce qui cloche chez nous`,
      `${brand} en 12 secondes, sans bullshit`,
      `Pourquoi on refuse d'ajouter cette fonctionnalité`,
      `Vous l'avez demandé dans r/${subs[0]}, on l'a fait`,
      `Ce qu'on fait différemment (et pourquoi c'est plus cher)`,
      `Avis honnête demandé : qu'est-ce qui vous empêcherait d'essayer ?`,
      `Un dev de chez nous a écrit cette pub, désolé d'avance`,
      `${short} : on a passé 2 ans à régler ce problème`,
    ],
    commentReplies: [
      { likelyComment: "Encore une pub déguisée en post authentique…", reply: "Oui, c'est une pub, on a payé pour être ici 😅 Mais les réponses en commentaires sont 100 % humaines. Une question ?" },
      { likelyComment: "C'est quoi la différence avec le concurrent X ?", reply: "Bonne question. X est meilleur sur [point précis]. Nous, on est plus rapides sur [point précis]. Le comparatif complet est ici, sans filtre." },
      { likelyComment: "Trop cher.", reply: "Compréhensible. La version gratuite couvre [usage] ; le payant vaut le coup seulement si [cas]. Sinon, restez en gratuit, vraiment." },
    ],
    launchChecklist: [
      "Installer le Reddit Pixel + Conversions API",
      "Créer 2-3 ad groups (une thématique de communautés chacun)",
      "Préparer 3 créas minimum par ad group",
      "Désigner un community manager pour répondre aux commentaires sous 2 h",
      "Activer les exclusions de communautés sensibles (brand safety)",
      "Fixer un plafond de fréquence et un calendrier de rotation créa",
    ],
  };
}
