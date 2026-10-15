/**
 * Modèles Claude proposés pour l'analyse et la génération.
 * `tier` sert à la version artifact (claude.ai), où la plateforme retombe sur ce niveau
 * si le modèle demandé n'est pas disponible pour le compte du visiteur.
 */
export const MODELS = [
  { id: "claude-opus-5-5", label: "Opus 5.5", hint: "Recommandé · meilleur équilibre qualité / coût", tier: "complex" },
  { id: "claude-fable-5-1", label: "Fable 5.1", hint: "Le plus puissant · plus lent et plus cher", tier: "complex" },
  { id: "claude-sonnet-5-5", label: "Sonnet 5.5", hint: "Rapide et précis", tier: "default" },
  { id: "claude-haiku-5-5", label: "Haiku 5.5", hint: "Le plus rapide · analyse plus légère", tier: "quick" },
] as const;

export type ModelId = (typeof MODELS)[number]["id"];
export const DEFAULT_MODEL: ModelId = "claude-opus-5-5";

export function isModelId(v: unknown): v is ModelId {
  return MODELS.some((m) => m.id === v);
}

export function modelInfo(id: string) {
  return MODELS.find((m) => m.id === id) ?? MODELS[0];
}
