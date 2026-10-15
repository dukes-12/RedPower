import { type GoalId, type Platform, type Range, industryMultiplier } from "./platforms";

export type ScenarioKey = "low" | "mid" | "high";

export interface SimCommunity {
  name: string;
  members: number;
  relevance: number;
}

export interface SimInput {
  platform: Platform;
  goal: GoalId;
  monthlyBudget: number;
  durationDays: number;
  industry?: string;
  /** Qualité créative perçue, 0.7 (générique) à 1.4 (natif Reddit, très engageant). */
  creativeQuality: number;
  /** Valeur moyenne d'une conversion (panier moyen, LTV...), USD. 0 = non renseigné. */
  conversionValue: number;
  communities: SimCommunity[];
}

export interface DayPoint {
  day: number;
  spend: number;
  impressions: number;
  clicks: number;
  actions: number;
  cumSpend: number;
  cumImpressions: number;
  cumClicks: number;
  cumActions: number;
  reach: number;
}

export interface ScenarioResult {
  spend: number;
  impressions: number;
  reach: number;
  frequency: number;
  clicks: number;
  actions: number;
  cpm: number;
  cpc: number;
  ctr: number;
  cpa: number;
  revenue: number;
  roas: number;
  days: DayPoint[];
}

export interface CommunitySplit {
  name: string;
  share: number;
  impressions: number;
  clicks: number;
  actions: number;
}

export interface Insight {
  level: "good" | "warning" | "critical" | "info";
  text: string;
}

export interface SimOutput {
  audience: number;
  dailyBudget: number;
  industryLabel: string;
  actionLabel: string;
  goalLabel: string;
  scenarios: Record<ScenarioKey, ScenarioResult>;
  communities: CommunitySplit[];
  insights: Insight[];
}

/** Part des membres d'un subreddit réellement atteignables sur un mois (actifs + lurkers connectés). */
const ACTIVE_SHARE = 0.3;
/** Durée de la phase d'apprentissage de l'algorithme, en jours. */
const LEARNING_DAYS = 7;

/**
 * Les bornes des benchmarks sont des extrêmes de marché ; les combiner (CPM haut × CTR bas × CVR bas)
 * produirait une fourchette irréaliste. On prend donc le milieu entre médiane et extrême.
 */
const pick = (r: Range, k: ScenarioKey) => (k === "low" ? (r[0] + r[1]) / 2 : k === "mid" ? r[1] : (r[1] + r[2]) / 2);

/**
 * Scénario "low" = pessimiste : CPM haut, CTR et CVR bas. "high" = optimiste.
 */
function benchFor(k: ScenarioKey, cpm: Range, ctr: Range, cvr: Range) {
  const inv: ScenarioKey = k === "low" ? "high" : k === "high" ? "low" : "mid";
  return { cpm: pick(cpm, inv), ctr: pick(ctr, k) / 100, cvr: pick(cvr, k) / 100 };
}

export function audienceSize(input: Pick<SimInput, "platform" | "communities">): number {
  if (input.platform.id !== "reddit" || input.communities.length === 0) return input.platform.defaultAudience;
  // Les communautés se recoupent : on applique un facteur de chevauchement croissant avec leur nombre.
  const raw = input.communities.reduce((s, c) => s + c.members * ACTIVE_SHARE, 0);
  const overlap = 1 / (1 + 0.08 * (input.communities.length - 1));
  return Math.max(50_000, raw * overlap);
}

function runScenario(input: SimInput, k: ScenarioKey, audience: number): ScenarioResult {
  const goal = input.platform.goals[input.goal]!;
  const { factor } = industryMultiplier(input.industry);
  const b = benchFor(k, goal.cpm, goal.ctr, goal.cvr);
  const totalBudget = (input.monthlyBudget / 30) * input.durationDays;
  const dailySpend = totalBudget / input.durationDays;

  const days: DayPoint[] = [];
  let cumSpend = 0, cumImpr = 0, cumClicks = 0, cumActions = 0;

  for (let d = 1; d <= input.durationDays; d++) {
    const learning = Math.max(0, 1 - (d - 1) / LEARNING_DAYS);
    const freqSoFar = cumImpr / Math.max(1, reachOf(cumImpr, audience));
    // Saturation : quand l'audience est déjà beaucoup exposée, les enchères montent.
    const saturation = 1 + 0.18 * Math.max(0, freqSoFar - 3);
    const cpm = b.cpm * factor * (1 + 0.2 * learning) * saturation;
    // Fatigue créative : chaque exposition supplémentaire érode le CTR.
    const fatigue = 1 / (1 + 0.09 * Math.max(0, freqSoFar - 1.5));
    const ctr = b.ctr * input.creativeQuality * (1 - 0.25 * learning) * fatigue;
    const cvr = b.cvr * (1 - 0.15 * learning) * Math.min(1.25, 0.85 + 0.15 * input.creativeQuality);

    const impressions = (dailySpend / cpm) * 1000;
    const clicks = impressions * ctr;
    // Pour la vidéo, l'action (vue) se mesure sur les impressions, pas les clics.
    const actions = input.goal === "video" ? impressions * cvr : clicks * cvr;

    cumSpend += dailySpend;
    cumImpr += impressions;
    cumClicks += clicks;
    cumActions += actions;
    days.push({
      day: d,
      spend: dailySpend,
      impressions,
      clicks,
      actions,
      cumSpend,
      cumImpressions: cumImpr,
      cumClicks,
      cumActions,
      reach: reachOf(cumImpr, audience),
    });
  }

  const reach = reachOf(cumImpr, audience);
  const revenue = input.goal === "video" ? 0 : cumActions * input.conversionValue;
  return {
    spend: cumSpend,
    impressions: cumImpr,
    reach,
    frequency: cumImpr / Math.max(1, reach),
    clicks: cumClicks,
    actions: cumActions,
    cpm: (cumSpend / Math.max(1, cumImpr)) * 1000,
    cpc: cumSpend / Math.max(1, cumClicks),
    ctr: (cumClicks / Math.max(1, cumImpr)) * 100,
    cpa: cumSpend / Math.max(0.0001, cumActions),
    revenue,
    roas: cumSpend > 0 ? revenue / cumSpend : 0,
    days,
  };
}

/** Courbe de reach à rendements décroissants : R = A·(1 − e^(−I/A)). */
function reachOf(impressions: number, audience: number) {
  return audience * (1 - Math.exp(-impressions / audience));
}

export function simulate(input: SimInput): SimOutput {
  const goal = input.platform.goals[input.goal];
  if (!goal) throw new Error(`Objectif ${input.goal} indisponible sur ${input.platform.name}`);
  const audience = audienceSize(input);
  const scenarios = {
    low: runScenario(input, "low", audience),
    mid: runScenario(input, "mid", audience),
    high: runScenario(input, "high", audience),
  };
  const mid = scenarios.mid;

  // Répartition par communauté : poids = pertinence × √taille (favorise les niches pertinentes).
  const weights = input.communities.map((c) => (c.relevance / 100) * Math.sqrt(Math.max(1, c.members)));
  const wSum = weights.reduce((a, b) => a + b, 0) || 1;
  const communities: CommunitySplit[] = input.communities
    .map((c, i) => {
      const share = weights[i] / wSum;
      const relBoost = 0.7 + 0.6 * (c.relevance / 100);
      return {
        name: c.name,
        share,
        impressions: mid.impressions * share,
        clicks: mid.clicks * share * relBoost,
        actions: mid.actions * share * relBoost,
      };
    })
    .sort((a, b) => b.share - a.share);
  // Normalise clics/actions pour que la somme reste cohérente avec le total.
  const cSum = communities.reduce((s, c) => s + c.clicks, 0) || 1;
  const aSum = communities.reduce((s, c) => s + c.actions, 0) || 1;
  for (const c of communities) {
    c.clicks = (c.clicks / cSum) * mid.clicks;
    c.actions = (c.actions / aSum) * mid.actions;
  }

  const dailyBudget = input.monthlyBudget / 30;
  return {
    audience,
    dailyBudget,
    industryLabel: industryMultiplier(input.industry).label,
    actionLabel: goal.actionLabel,
    goalLabel: goal.label,
    scenarios,
    communities,
    insights: buildInsights(input, mid, audience, dailyBudget),
  };
}

function buildInsights(input: SimInput, mid: ScenarioResult, audience: number, dailyBudget: number): Insight[] {
  const out: Insight[] = [];
  const p = input.platform;
  const nGroups = Math.max(1, Math.min(input.communities.length, 5));

  if (dailyBudget < p.minDailyBudget) {
    out.push({ level: "critical", text: `Budget quotidien (${fmtMoney(dailyBudget)}) sous le minimum ${p.name} de ${fmtMoney(p.minDailyBudget)}/jour.` });
  } else if (p.id === "reddit" && dailyBudget / nGroups < 20) {
    out.push({ level: "warning", text: `${fmtMoney(dailyBudget / nGroups)}/jour par groupe d'annonces : regroupez les communautés en 2-3 ad groups pour sortir plus vite de l'apprentissage.` });
  }

  if (mid.frequency > 6) {
    out.push({ level: "warning", text: `Fréquence de ${mid.frequency.toFixed(1)} : l'audience va saturer. Élargissez les communautés ou prévoyez 3+ créas en rotation.` });
  } else if (mid.frequency < 1.5 && input.goal !== "awareness") {
    out.push({ level: "info", text: `Fréquence faible (${mid.frequency.toFixed(1)}) : budget dilué sur une large audience. Resserrez le ciblage pour gagner en mémorisation.` });
  } else {
    out.push({ level: "good", text: `Fréquence de ${mid.frequency.toFixed(1)} sur la période : zone saine (2 à 5).` });
  }

  const weeklyActions = (mid.actions / input.durationDays) * 7;
  if (["conversions", "catalog", "leads", "app"].includes(input.goal)) {
    if (weeklyActions < 20) {
      out.push({ level: "warning", text: `≈${Math.round(weeklyActions)} actions/semaine : trop peu pour que l'algorithme optimise (cible ≥ 20-50). Démarrez en Traffic ou optimisez sur un événement plus haut du funnel (add-to-cart, sign-up).` });
    } else {
      out.push({ level: "good", text: `≈${Math.round(weeklyActions)} actions/semaine : volume suffisant pour l'optimisation automatique des enchères.` });
    }
  }

  if (input.conversionValue > 0 && input.goal !== "video") {
    out.push(
      mid.roas >= 2
        ? { level: "good", text: `ROAS médian estimé ${mid.roas.toFixed(1)}x : campagne rentable dans le scénario réaliste.` }
        : mid.roas >= 1
          ? { level: "warning", text: `ROAS médian ${mid.roas.toFixed(1)}x : à peine à l'équilibre. Travaillez la landing page ou la valeur panier.` }
          : { level: "critical", text: `ROAS médian ${mid.roas.toFixed(1)}x : non rentable en direct, à justifier par la LTV ou la notoriété.` },
    );
  }

  if (input.creativeQuality < 0.9) {
    out.push({ level: "info", text: "Créa jugée générique : sur Reddit, un ton natif (transparent, sans jargon, avec de l'autodérision) peut doubler le CTR." });
  }

  const reachPct = mid.reach / audience;
  if (reachPct > 0.6) {
    out.push({ level: "info", text: `${Math.round(reachPct * 100)} % de l'audience ciblée touchée : vous approchez du plafond, le budget additionnel rapportera moins.` });
  }

  return out;
}

export function fmtMoney(n: number, digits?: number): string {
  const d = digits ?? (Math.abs(n) < 10 ? 2 : 0);
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD", currencyDisplay: "narrowSymbol", maximumFractionDigits: d, minimumFractionDigits: d }).format(n);
}

export function fmtNum(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1).replace(".", ",")} Md`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1).replace(".", ",")} M`;
  if (n >= 1e4) return `${Math.round(n / 1e3)} k`;
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: n < 10 ? 1 : 0 }).format(n);
}
