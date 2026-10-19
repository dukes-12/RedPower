"use client";
import { BUSINESS_THEMES, THEME_LABELS, type BusinessQuestion, type BusinessTheme, type ClientType } from "@/lib/prep";
import { useState } from "react";
import { Icon, type IconName } from "./icons";
import { CopyButton } from "./ui";

const THEME_ICONS: Record<BusinessTheme, IconName> = {
  objectives: "target",
  audience: "users",
  budget: "chart",
  mix: "layers",
  timing: "flag",
  decision: "check",
  creative: "sparkles",
};

/** Clés des notes : réponse du client et case « posée » pour chaque question. */
export const answerKey = (i: number) => `bq-${i}`;
export const askedKey = (i: number) => `bq-${i}-asked`;

export function BusinessQuestions({
  questions,
  clientType,
  tailored,
  notes,
  onNote,
}: {
  questions: BusinessQuestion[];
  clientType: ClientType;
  /** false = banque de questions standard (analyse ancienne ou démo). */
  tailored: boolean;
  notes: Record<string, string>;
  onNote: (id: string, text: string) => void;
}) {
  const [theme, setTheme] = useState<BusinessTheme | "all">("all");
  const labels = THEME_LABELS[clientType];
  const indexed = questions.map((q, i) => ({ ...q, i }));
  const themes = BUSINESS_THEMES.filter((t) => indexed.some((q) => q.theme === t));
  const asked = indexed.filter((q) => notes[askedKey(q.i)] === "1").length;
  const visible = themes.filter((t) => theme === "all" || t === theme);

  return (
    <section className="card p-5 lg:col-span-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-accent-ink">
              <Icon name="message" size={18} />
            </span>
            <h3 className="text-lg font-bold">Questions business à poser</h3>
            {!tailored && <span className="chip text-xs">Liste standard</span>}
          </div>
          <p className="mt-1 text-sm text-ink-2">
            Pendant la discovery : cochez chaque question posée et notez la réponse du client.{" "}
            <span className="num font-semibold text-ink">
              {asked}/{questions.length}
            </span>{" "}
            posées.
          </p>
        </div>
        <CopyButton text={questions.map((q) => `- [${labels[q.theme]}] ${q.question}`).join("\n")} label="Copier la liste" />
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-2" aria-hidden>
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${questions.length ? (asked / questions.length) * 100 : 0}%` }} />
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5" role="tablist" aria-label="Thèmes">
        <button role="tab" aria-selected={theme === "all"} className="chip text-xs" data-active={theme === "all"} onClick={() => setTheme("all")}>
          Tous les thèmes
        </button>
        {themes.map((t) => (
          <button key={t} role="tab" aria-selected={theme === t} className="chip text-xs" data-active={theme === t} onClick={() => setTheme(t)}>
            <Icon name={THEME_ICONS[t]} size={12} /> {labels[t]}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
        {visible.map((t) => (
          <div key={t} className="min-w-0">
            <div className="label mb-2 flex items-center gap-1.5">
              <Icon name={THEME_ICONS[t]} size={12} /> {labels[t]}
            </div>
            <ul className="space-y-2">
              {indexed
                .filter((q) => q.theme === t)
                .map((q) => {
                  const isAsked = notes[askedKey(q.i)] === "1";
                  return (
                    <li key={q.i} className={`rounded-lg border p-3 transition ${isAsked ? "border-good/40 bg-surface-2" : "border-line"}`}>
                      <label className="flex cursor-pointer gap-2.5">
                        <input
                          type="checkbox"
                          className="mt-1 shrink-0"
                          checked={isAsked}
                          onChange={(e) => onNote(askedKey(q.i), e.target.checked ? "1" : "")}
                        />
                        <span className="min-w-0">
                          <span className={`block text-sm font-medium ${isAsked ? "text-ink-2" : "text-ink"}`}>{q.question}</span>
                          <span className="mt-0.5 block text-xs text-muted">Pourquoi : {q.why}</span>
                        </span>
                      </label>
                      {(isAsked || notes[answerKey(q.i)]) && (
                        <input
                          id={`rp-bq-${q.i}`}
                          className="input mt-2 !py-1.5 text-sm"
                          placeholder="Réponse du client…"
                          value={notes[answerKey(q.i)] ?? ""}
                          onChange={(e) => onNote(answerKey(q.i), e.target.value)}
                        />
                      )}
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
