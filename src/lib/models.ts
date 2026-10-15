/**
 * Modèles Claude proposés pour l'analyse et la génération.
 * `tier` sert à la version artifact (claude.ai), où la plateforme retombe sur ce niveau
 * si le modèle demandé n'est pas disponible pour le compte du visiteur.
 */
export const MODELS = [
  { id: "claude-opus-5-5", label: "Opus 5.5", hint: "Le plus approfondi au quotidien · plus lent", tier: "complex", eta: "30 s à 2 min" },
  { id: "claude-fable-5-1", label: "Fable 5.1", hint: "Le plus puissant · le plus lent", tier: "complex", eta: "1 à 4 min" },
  { id: "claude-sonnet-5-5", label: "Sonnet 5.5", hint: "Rapide et bonne plume · idéal pour les campagnes", tier: "default", eta: "20 s à 1 min" },
  { id: "claude-haiku-5-5", label: "Haiku 5.5", hint: "Le plus rapide · idéal pour une première analyse", tier: "quick", eta: "10 à 30 s" },
] as const;

export type ModelId = (typeof MODELS)[number]["id"];
/** Défaut côté serveur quand aucun modèle valide n'est demandé. */
export const DEFAULT_MODEL: ModelId = "claude-opus-5-5";
/** Défauts de l'interface : rapide pour l'analyse, plus rédactionnel pour les campagnes. */
export const DEFAULT_ANALYSIS_MODEL: ModelId = "claude-haiku-5-5";
export const DEFAULT_CAMPAIGN_MODEL: ModelId = "claude-sonnet-5-5";

export function isModelId(v: unknown): v is ModelId {
  return MODELS.some((m) => m.id === v);
}

export function modelInfo(id: string) {
  return MODELS.find((m) => m.id === id) ?? MODELS[0];
}
