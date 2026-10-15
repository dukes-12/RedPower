"use client";
import { REDDIT_CTAS, type CompanyIntel } from "@/lib/schemas";
import { useState } from "react";
import { RedditAdPreview } from "./RedditAdPreview";
import { Section } from "./ui";
import { VibeBadge, VibeDetails } from "./VibeCheck";

const BEFORE_AFTER: [string, string][] = [
  ["La solution révolutionnaire de gestion de projet pour les équipes innovantes !!!", "On a passé 3 ans à construire un outil de gestion de projet. Voici pour qui il n'est PAS fait."],
  ["Découvrez notre nouvelle boisson incroyable 🔥🔥🔥", "On a mis 0 g de sucre dans une boisson énergisante. Les testeurs ont été… partagés. Votre avis ?"],
];

export function HeadlineLab({ intel }: { intel: CompanyIntel | null }) {
  const [headline, setHeadline] = useState("On a construit l'outil qu'on cherchait depuis 2 ans. Dites-nous ce qui manque ?");
  const [body, setBody] = useState("Pas de jargon, juste ce qu'il fait. L'équipe répond dans les commentaires.");
  const [cta, setCta] = useState<(typeof REDDIT_CTAS)[number]>("Learn More");
  const [variants, setVariants] = useState<string[]>([]);
  const brand = intel?.name ?? "VotreMarque";

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
      <div className="min-w-0 space-y-4">
        <Section title="Reddit Vibe Check" subtitle="Tapez un headline : le score d'authenticité Reddit se met à jour en direct.">
          <label className="block">
            <span className="label">Headline</span>
            <textarea className="input mt-1 min-h-20 text-[15px] font-semibold" maxLength={300} value={headline} onChange={(e) => setHeadline(e.target.value)} />
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_180px]">
            <label className="block">
              <span className="label">Texte (optionnel)</span>
              <input className="input mt-1 text-sm" value={body} onChange={(e) => setBody(e.target.value)} />
            </label>
            <label className="block">
              <span className="label">CTA</span>
              <select className="input mt-1 text-sm" value={cta} onChange={(e) => setCta(e.target.value as typeof cta)}>
                {REDDIT_CTAS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-5 grid gap-5 border-t border-line pt-5 md:grid-cols-2">
            <VibeDetails headline={headline} />
            <div>
              <div className="label mb-2">Variantes rapides</div>
              <button className="btn btn-ghost w-full justify-center text-sm" onClick={() => setVariants(makeVariants(headline, brand))}>
                🎲 Décliner ce headline
              </button>
              <ul className="mt-3 space-y-2">
                {variants.map((v) => (
                  <li key={v}>
                    <button className="w-full rounded-lg border border-line p-2 text-left text-sm hover:border-accent" onClick={() => setHeadline(v)}>
                      <span className="flex items-start justify-between gap-2">
                        <span>{v}</span>
                        <VibeBadge headline={v} />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        <Section title="Avant / après" subtitle="Ce qui fonctionne ailleurs se fait downvoter sur Reddit">
          <div className="space-y-3">
            {BEFORE_AFTER.map(([bad, good]) => (
              <div key={bad} className="grid gap-2 sm:grid-cols-2">
                <button onClick={() => setHeadline(bad)} className="rounded-xl border border-line p-3 text-left text-sm">
                  <div className="mb-1 flex justify-between"><span className="label">Avant</span><VibeBadge headline={bad} /></div>
                  {bad}
                </button>
                <button onClick={() => setHeadline(good)} className="rounded-xl border border-line p-3 text-left text-sm">
                  <div className="mb-1 flex justify-between"><span className="label">Après</span><VibeBadge headline={good} /></div>
                  {good}
                </button>
              </div>
            ))}
          </div>
        </Section>
      </div>
      <div className="lg:sticky lg:top-4 lg:self-start">
        <div className="label mb-2">Aperçu feed</div>
        <RedditAdPreview ad={{ headline, body, cta, format: "Image", visualIdea: "Votre visuel ici" }} brand={brand} website={intel?.website} />
      </div>
    </div>
  );
}

/** Déclinaisons par gabarits éprouvés sur Reddit (sans IA, instantané). */
function makeVariants(h: string, brand: string): string[] {
  const core = h.replace(/[!?.…]+$/, "").trim();
  const lower = core.charAt(0).toLowerCase() + core.slice(1);
  return [
    `Honnêtement : ${lower}. Qu'est-ce qu'on a raté ?`,
    `On est l'équipe de ${brand}. ${core}. AMA.`,
    `${core} (oui, c'est une pub, mais on répond à tout)`,
    `Après 2 ans de retours de la communauté : ${lower}`,
    `Pour qui ${brand} n'est pas fait (et pour qui il l'est)`,
  ];
}
