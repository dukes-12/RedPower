"use client";
import { COUNTRIES, MAX_COUNTRIES, countriesLabel } from "@/lib/countries";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./icons";

/** Sélection de 0 à MAX_COUNTRIES pays. Aucun pays = analyse globale. */
export function CountryPicker({ value, onChange }: { value: string[]; onChange: (codes: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const options = COUNTRIES.filter((c) => c.code);
  const full = value.length >= MAX_COUNTRIES;

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  function toggle(code: string) {
    onChange(value.includes(code) ? value.filter((c) => c !== code) : full ? value : [...value, code]);
  }

  return (
    <div ref={ref} className="relative text-sm">
      <span className="label" id="rp-country-label">
        Pays visés
      </span>
      <button
        type="button"
        id="rp-country"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby="rp-country-label rp-country"
        onClick={() => setOpen((o) => !o)}
        className="input mt-1 flex items-center justify-between gap-2 !py-1.5 text-left text-sm"
      >
        <span className={`truncate ${value.length ? "" : "text-muted"}`}>{value.length ? countriesLabel(value) : "Monde (aucun pays)"}</span>
        <span className="flex shrink-0 items-center gap-1.5 text-muted">
          {value.length > 0 && <span className="num rounded bg-accent-soft px-1.5 text-[11px] font-semibold text-accent-ink">{value.length}</span>}
          <Icon name="down" size={12} />
        </span>
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full min-w-64 rounded-lg border border-line bg-surface p-1 shadow-lg">
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-xs text-muted">
              {value.length}/{MAX_COUNTRIES} pays
            </span>
            {value.length > 0 && (
              <button type="button" className="text-xs font-semibold text-accent-ink hover:underline" onClick={() => onChange([])}>
                Tout effacer
              </button>
            )}
          </div>
          <ul role="listbox" aria-multiselectable="true" className="max-h-64 overflow-y-auto">
            {options.map((c) => {
              const on = value.includes(c.code);
              const disabled = !on && full;
              return (
                <li key={c.code}>
                  <label className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-surface-2 ${disabled ? "cursor-not-allowed opacity-45" : ""}`}>
                    <input type="checkbox" checked={on} disabled={disabled} onChange={() => toggle(c.code)} />
                    <span className="flex-1">{c.label}</span>
                    <span className="num text-[11px] text-muted">{c.code}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <span className="mt-1 block text-xs text-muted">
        {value.length
          ? `Objectifs, idées et budget orientés vers ${value.length > 1 ? "ces marchés" : "ce marché"}, avec un encart par pays.`
          : `Choisissez jusqu'à ${MAX_COUNTRIES} pays pour orienter l'analyse vers ces marchés.`}
      </span>
    </div>
  );
}
