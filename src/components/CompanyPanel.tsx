"use client";
import { fmtMoney, fmtNum } from "@/lib/simulator";
import type { CompanyIntel, Source } from "@/lib/schemas";
import { useMemo, useState } from "react";
import { CopyButton, Gauge, Meter, Section, Stat, StatusLine, hostname } from "./ui";

const INTENTS = ["toutes", "découverte", "considération", "achat", "problème"] as const;

export function CompanyPanel({
  intel,
  sources,
  selected,
  onToggleSub,
  onGoCampaign,
}: {
  intel: CompanyIntel;
  sources: Source[];
  selected: string[];
  onToggleSub: (name: string) => void;
  onGoCampaign: (brief?: string) => void;
}) {
  const [intent, setIntent] = useState<(typeof INTENTS)[number]>("toutes");
  const keywords = useMemo(
    () => [...intel.keywords].filter((k) => intent === "toutes" || k.intent === intent).sort((a, b) => a.priority - b.priority),
    [intel.keywords, intent],
  );
  const totalReach = intel.subreddits
    .filter((s) => selected.includes(s.name))
    .reduce((sum, s) => sum + (s.verifiedMembers ?? s.estimatedMembers), 0);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Identité */}
      <section className="card p-5 lg:col-span-2">
        <div className="flex flex-wrap items-start gap-4">
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-accent text-2xl font-extrabold text-white">{intel.name.slice(0, 1)}</div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold">{intel.name}</h2>
              {intel.website && (
                <a href={intel.website} target="_blank" rel="noreferrer" className="chip text-xs hover:underline">
                  {hostname(intel.website)} ↗
                </a>
              )}
            </div>
            <p className="mt-1 text-[15px] font-medium text-ink-2">{intel.tagline}</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-ink-2">{intel.summary}</p>
        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4 sm:grid-cols-4">
          <Stat label="Secteur" value={<span className="text-base">{intel.industry}</span>} hint={intel.businessModel} />
          <Stat label="CA estimé" value={<span className="text-base">{intel.estimatedRevenue}</span>} hint={intel.fundingStage} />
          <Stat label="Effectifs" value={<span className="text-base">{intel.employees}</span>} hint={intel.headquarters} />
          <Stat label="Fondée" value={<span className="text-base">{intel.founded || "—"}</span>} />
        </div>
      </section>

      {/* Reddit fit */}
      <section className="card flex flex-col p-5">
        <div className="label">Reddit Fit Score</div>
        <div className="mt-2 flex items-center gap-4">
          <Gauge score={intel.redditFit.score} />
          <p className="text-sm text-ink-2">{intel.redditFit.verdict}</p>
        </div>
        <ul className="mt-4 space-y-2">
          {intel.redditFit.strengths.slice(0, 3).map((s) => (
            <StatusLine key={s} level="good">{s}</StatusLine>
          ))}
          {intel.redditFit.watchouts.slice(0, 3).map((s) => (
            <StatusLine key={s} level="warning">{s}</StatusLine>
          ))}
        </ul>
      </section>

      {/* Budget */}
      <Section title="Budget potentiel" subtitle={`Confiance : ${intel.budget.confidence}`}>
        <div className="grid grid-cols-2 gap-4">
          <Stat label="Marketing / an" value={<span className="text-base">{intel.budget.totalMarketingAnnual}</span>} />
          <Stat label="Paid social / an" value={<span className="text-base">{intel.budget.paidSocialAnnual}</span>} />
        </div>
        <div className="mt-4 rounded-xl bg-accent-soft p-4">
          <div className="label !text-accent-ink">Budget Reddit recommandé</div>
          <div className="tabular mt-1 text-xl font-bold">
            {fmtMoney(intel.budget.recommendedRedditMonthlyLow)} – {fmtMoney(intel.budget.recommendedRedditMonthlyHigh)}
            <span className="text-sm font-medium text-ink-2"> / mois</span>
          </div>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted">{intel.budget.rationale}</p>
      </Section>

      {/* Objectifs */}
      <Section title="Objectifs actuels" subtitle="Déduits des signaux récents">
        <ul className="space-y-3">
          {intel.currentObjectives.map((o) => (
            <li key={o.objective} className="group">
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm font-semibold">{o.objective}</div>
                <button className="shrink-0 text-xs font-semibold text-accent-ink opacity-70 hover:opacity-100" onClick={() => onGoCampaign(o.objective)}>
                  Campagne →
                </button>
              </div>
              <div className="text-xs text-muted">{o.evidence}</div>
            </li>
          ))}
        </ul>
      </Section>

      {/* Actualités */}
      <Section title="Actualités & signaux" subtitle="Et ce qu'ils impliquent pour vos pubs">
        <ul className="space-y-3">
          {intel.recentNews.map((n) => (
            <li key={n.headline}>
              <div className="text-sm font-medium">{n.headline}</div>
              <div className="text-xs text-muted">{n.date}</div>
              <div className="mt-0.5 text-xs text-ink-2">→ {n.implication}</div>
            </li>
          ))}
        </ul>
      </Section>

      {/* Communautés */}
      <Section
        className="lg:col-span-2"
        title="Meilleures communautés"
        subtitle="Cochez celles à cibler : elles alimentent le simulateur et le studio."
        action={
          <div className="text-right text-xs text-muted">
            <div className="tabular text-sm font-semibold text-ink">{fmtNum(totalReach)} membres</div>
            {selected.length} communautés sélectionnées
          </div>
        }
      >
        <div className="-mx-2 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="text-left">
                <th className="label px-2 pb-2 font-semibold">Communauté</th>
                <th className="label px-2 pb-2 text-right font-semibold">Membres</th>
                <th className="label w-28 px-2 pb-2 font-semibold">Pertinence</th>
                <th className="label px-2 pb-2 font-semibold">Risque</th>
              </tr>
            </thead>
            <tbody>
              {intel.subreddits.map((s) => {
                const on = selected.includes(s.name);
                return (
                  <tr key={s.name} className="border-t border-line align-top">
                    <td className="px-2 py-2.5">
                      <label className="flex cursor-pointer gap-2.5">
                        <input type="checkbox" className="mt-1 accent-[var(--accent)]" checked={on} onChange={() => onToggleSub(s.name)} />
                        <span>
                          <a href={`https://www.reddit.com/r/${s.name}`} target="_blank" rel="noreferrer" className="font-semibold hover:underline">
                            r/{s.name}
                          </a>
                          <span className="block text-xs text-ink-2">{s.audience}</span>
                          <span className="block text-xs text-muted">Ton : {s.tone}</span>
                        </span>
                      </label>
                    </td>
                    <td className="tabular px-2 py-2.5 text-right">
                      {fmtNum(s.verifiedMembers ?? s.estimatedMembers)}
                      <span className="block text-[11px] text-muted">{s.verified ? "vérifié ✓" : "estimé"}</span>
                    </td>
                    <td className="px-2 py-3">
                      <Meter value={s.relevance} />
                      <span className="tabular text-[11px] text-muted">{Math.round(s.relevance)}/100</span>
                    </td>
                    <td className="px-2 py-2.5">
                      <span className={`text-xs font-medium ${s.risk === "élevé" ? "text-critical" : s.risk === "moyen" ? "text-warning" : "text-good"}`}>
                        {s.risk === "élevé" ? "✕" : s.risk === "moyen" ? "!" : "✓"} {s.risk}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Audiences */}
      <Section title="Audiences cibles">
        <ul className="space-y-3">
          {intel.targetAudiences.map((a) => (
            <li key={a.persona}>
              <div className="text-sm font-semibold">{a.persona}</div>
              <div className="text-xs text-ink-2">{a.description}</div>
            </li>
          ))}
        </ul>
        <div className="label mb-2 mt-5">Intérêts Reddit</div>
        <div className="flex flex-wrap gap-1.5">
          {intel.interests.map((i) => (
            <span key={i} className="chip text-xs">{i}</span>
          ))}
        </div>
      </Section>

      {/* Keywords */}
      <Section
        className="lg:col-span-2"
        title="Keywords"
        subtitle="Pour le ciblage par mots-clés de Reddit (conversations où ils apparaissent)"
        action={<CopyButton text={keywords.map((k) => k.term).join("\n")} label="Copier la liste" />}
      >
        <div className="mb-3 flex flex-wrap gap-1.5">
          {INTENTS.map((i) => (
            <button key={i} className="chip text-xs capitalize" data-active={intent === i} onClick={() => setIntent(i)}>
              {i}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {keywords.map((k) => (
            <span key={k.term} className="chip" title={`Intention : ${k.intent} · priorité ${k.priority}`}>
              <span className={`size-1.5 rounded-full ${k.priority === 1 ? "bg-accent" : k.priority === 2 ? "bg-series" : "bg-muted"}`} />
              {k.term}
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">● orange = priorité haute · ● bleu = moyenne · ● gris = basse</p>
      </Section>

      {/* Produits & concurrents */}
      <Section title="Produits & concurrents">
        <ul className="space-y-2.5">
          {intel.products.map((p) => (
            <li key={p.name} className="text-sm">
              <span className="font-semibold">{p.name}</span>
              {p.pricing && <span className="tabular text-xs text-muted"> · {p.pricing}</span>}
              <span className="block text-xs text-ink-2">{p.description}</span>
            </li>
          ))}
        </ul>
        <div className="label mb-2 mt-5">Concurrents</div>
        <ul className="space-y-1.5">
          {intel.competitors.map((c) => (
            <li key={c.name} className="text-sm">
              <span className="font-medium">{c.name}</span> <span className="text-xs text-muted">— {c.note}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* Quick wins */}
      <Section className="lg:col-span-2" title="Idées immédiates" subtitle="Cliquez pour en faire un brief de campagne">
        <div className="grid gap-2 sm:grid-cols-2">
          {intel.quickWins.map((q) => (
            <button key={q} onClick={() => onGoCampaign(q)} className="rounded-xl border border-line p-3 text-left text-sm text-ink-2 transition hover:border-accent hover:bg-accent-soft">
              💡 {q}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Sources" subtitle={sources.length ? "Recherche web en temps réel" : "Mode démo : aucune source réelle"}>
        {sources.length ? (
          <ul className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
            {sources.map((s) => (
              <li key={s.url} className="truncate text-xs">
                <a href={s.url} target="_blank" rel="noreferrer" className="hover:underline">
                  <span className="text-muted">{hostname(s.url)}</span> · {s.title}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Configurez ANTHROPIC_API_KEY pour une analyse sourcée.</p>
        )}
      </Section>
    </div>
  );
}
