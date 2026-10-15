"use client";
import { MODELS, modelInfo } from "@/lib/models";

/** Sélecteur de modèle Claude, avec le rôle par défaut signalé. */
export function ModelSelect({ id, value, onChange, defaultId, label = "Modèle" }: { id: string; value: string; onChange: (v: string) => void; defaultId: string; label?: string }) {
  return (
    <label className="block text-sm" htmlFor={id}>
      <span className="label">{label}</span>
      <select id={id} className="input mt-1 !py-1.5 text-sm" value={value} onChange={(e) => onChange(e.target.value)}>
        {MODELS.map((m) => (
          <option key={m.id} value={m.id}>
            Claude {m.label}
            {m.id === defaultId ? " (par défaut)" : ""}
          </option>
        ))}
      </select>
      <span className="mt-1 block text-xs text-muted">{modelInfo(value).hint}</span>
    </label>
  );
}
