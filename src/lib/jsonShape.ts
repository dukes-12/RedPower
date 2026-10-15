/**
 * Validation légère d'une valeur JSON contre un JSON Schema (sous-ensemble produit par zod) :
 * object/properties/required, array/items, string/enum, number, boolean, anyOf (nullable).
 * Remplace zod dans la version artifact pour garder la page légère.
 */
export interface JsonSchema {
  type?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  enum?: unknown[];
  anyOf?: JsonSchema[];
}

export function conform(schema: JsonSchema, value: unknown, path = "$"): { value: unknown; errors: string[] } {
  if (schema.anyOf) {
    let best: { value: unknown; errors: string[] } | null = null;
    for (const option of schema.anyOf) {
      const r = conform(option, value, path);
      if (r.errors.length === 0) return r;
      if (!best || r.errors.length < best.errors.length) best = r;
    }
    return best ?? { value, errors: [`${path}: aucune variante`] };
  }
  switch (schema.type) {
    case "null":
      return value === null ? { value, errors: [] } : { value, errors: [`${path}: null attendu`] };
    case "string": {
      const v = typeof value === "number" ? String(value) : value;
      if (typeof v !== "string") return { value, errors: [`${path}: texte attendu`] };
      if (schema.enum && !schema.enum.includes(v)) return { value: v, errors: [`${path}: valeur inattendue « ${v} »`] };
      return { value: v, errors: [] };
    }
    case "number":
    case "integer": {
      const v = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
      return typeof v === "number" && Number.isFinite(v) ? { value: v, errors: [] } : { value, errors: [`${path}: nombre attendu`] };
    }
    case "boolean":
      return typeof value === "boolean" ? { value, errors: [] } : { value, errors: [`${path}: booléen attendu`] };
    case "array": {
      if (!Array.isArray(value)) return { value, errors: [`${path}: liste attendue`] };
      const out: unknown[] = [];
      const errors: string[] = [];
      value.forEach((item, i) => {
        const r = schema.items ? conform(schema.items, item, `${path}[${i}]`) : { value: item, errors: [] };
        // Un élément invalide est écarté plutôt que de faire échouer toute la liste.
        if (r.errors.length === 0) out.push(r.value);
      });
      return { value: out, errors };
    }
    case "object": {
      if (!value || typeof value !== "object" || Array.isArray(value)) return { value, errors: [`${path}: objet attendu`] };
      const src = value as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      const errors: string[] = [];
      for (const [key, sub] of Object.entries(schema.properties ?? {})) {
        if (!(key in src)) {
          if (schema.required?.includes(key)) errors.push(`${path}.${key}: manquant`);
          continue;
        }
        const r = conform(sub, src[key], `${path}.${key}`);
        out[key] = r.value;
        errors.push(...r.errors);
      }
      return { value: out, errors };
    }
    default:
      return { value, errors: [] };
  }
}
