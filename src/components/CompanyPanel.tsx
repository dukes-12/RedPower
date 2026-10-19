"use client";
import { fmtMoney, fmtNum } from "@/lib/simulator";
import { insightsOf } from "@/lib/intel";
import type { ClientType } from "@/lib/prep";
import type { CompanyIntel, CountryInsight, Source } from "@/lib/schemas";
import { useMemo, useState } from "react";
import { Icon, type IconName } from "./icons";
import { Badge, CopyButton, Gauge, Meter, Section, Stat, StatusLine, baseReliability, hostname } from "./ui";

const INTENTS = ["toutes", "découverte", "considération", "achat", "problème"] as const;

export function CompanyPanel({
  intel,
  mode,
  clientType = "direct",
  sources,
  selected,
  onToggleSub,
  onGoCampaign,
}: {
  intel: CompanyIntel;
  mode: "live" | "knowledge" | "demo";
  clientType?: ClientType;
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
  const base = baseReliability(mode);
  const agency = clientType === "agency";
  const markets = insightsOf(intel);
  const marketLabel = markets.map((m) => m.country).join(", ");
  const takeaways = intel.keyTakeaways?.length ? intel.keyTakeaways.slice(0, 3) : fallbackTakeaways(intel);
  const nextAction = intel.nextAction || intel.quickWins[0] || "";
  const totalReach = intel.subreddits
    .filter((s) => selected.includes(s.name))
    .reduce((sum, s) => sum + (s.verifiedMembers ?? s.estimatedMembers), 0);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* En bref */}
      <section className="card p-5 lg:col-span-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-accent-ink"><Icon name="layers" size={18} /></span>
          <h3 className="text-lg font-bold">En bref</h3>
          <Badge kind={base} />
        </div>
        <ul className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          {takeaways.map((t) => (
            <li key={t} className="flex gap-2.5 text-[15px] leading-snug">
              <span className="mt-0.5 shrink-0 text-accent-ink"><Icon name="target" size={16} /></span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
        {nextAction && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface-2 px-4 py-3">
            <div className="min-w-0 text-sm">
              <span className="label mr-2">Action n°1</span>
              <span className="font-medium">{nextAction}</span>
            </div>
            <button className="btn btn-primary !py-1.5 text-sm" onClick={() => onGoCampaign(nextAction)}>
              En faire une campagne <Icon name="arrowRight" size={14} />
            </button>
          </div>
        )}
      </section>

      {/* Identité */}
      <section className="card p-5 lg:col-span-2">
        <div className="flex flex-wrap items-start gap-4">
          <div className="grid size-14 shrink-0 place-items-center rounded-lg bg-accent text-2xl font-extrabold text-white">{intel.name.slice(0, 1)}</div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold">{intel.name}</h2>
              <Badge kind={base} />
              {intel.website && (
                <a href={intel.website} target="_blank" rel="noreferrer" className="chip text-xs hover:underline">
                  {hostname(intel.website)} <Icon name="external" size={12} />
                </a>
              )}
            </div>
            <p className="mt-1 text-[15px] font-medium text-ink-2">{intel.tagline}</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-ink-2">{intel.summary}</p>
        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4 sm:grid-cols-4">
          <Stat label="Secteur" mono={false} value={<span className="text-base">{intel.industry}</span>} hint={intel.businessModel} />
          <Stat label="CA" badge={<Badge kind={mode === "demo" ? "demo" : "estimate"} />} value={<span className="text-base">{intel.estimatedRevenue}</span>} hint={intel.fundingStage} />
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

      {markets.length > 0 && <MarketsCard key={`${intel.name}-${marketLabel}`} insights={markets} base={base} onGoCampaign={onGoCampaign} />}

      {/* Budget */}
      <Section title="Budget potentiel" subtitle={`Confiance : ${intel.budget.confidence}`} badge={<Badge kind={mode === "demo" ? "demo" : "estimate"} />}>
        <div className="grid grid-cols-2 gap-4">
          <Stat label="Marketing / an" value={<span className="text-base">{intel.budget.totalMarketingAnnual}</span>} />
          <Stat label="Paid social / an" value={<span className="text-base">{intel.budget.paidSocialAnnual}</span>} />
        </div>
        <div className="mt-4 rounded-lg bg-accent-soft p-4">
          <div className="label !text-accent-ink">Budget Reddit recommandé</div>
          <div className="num mt-1 text-xl font-semibold">
            {fmtMoney(intel.budget.recommendedRedditMonthlyLow)} – {fmtMoney(intel.budget.recommendedRedditMonthlyHigh)}
            <span className="text-sm font-medium text-ink-2"> / mois</span>
          </div>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted">{intel.budget.rationale}</p>
      </Section>

      {/* Objectifs */}
      <Section title="Objectifs actuels" subtitle={markets.length ? `Orientés vers : ${marketLabel}` : "Déduits des signaux récents"} badge={<Badge kind={base} />}>
        <ul className="space-y-3">
          {intel.currentObjectives.map((o) => (
            <li key={o.objective} className="group">
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm font-semibold">{o.objective}</div>
                <button className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-accent-ink opacity-80 hover:opacity-100" onClick={() => onGoCampaign(o.objective)}>
                  Campagne <Icon name="arrowRight" size={12} />
                </button>
              </div>
              <div className="text-xs text-muted">{o.evidence}</div>
            </li>
          ))}
        </ul>
      </Section>

      {/* Actualités */}
      <Section title="Actualités & signaux" subtitle="Et ce qu'ils impliquent pour vos pubs" badge={<Badge kind={base} />}>
        <ul className="space-y-3">
          {intel.recentNews.map((n) => (
            <li key={n.headline}>
              <div className="text-sm font-medium">{n.headline}</div>
              <div className="text-xs text-muted">{n.date}</div>
              <div className="mt-0.5 flex gap-1 text-xs text-ink-2"><Icon name="arrowRight" size={12} className="mt-0.5 shrink-0" />{n.implication}</div>
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
                      <span className="mt-1 flex justify-end">{s.verified ? <Badge kind="verified" /> : <Badge kind={mode === "demo" ? "demo" : "estimate"} />}</span>
                    </td>
                    <td className="px-2 py-3">
                      <Meter value={s.relevance} />
                      <span className="tabular text-[11px] text-muted">{Math.round(s.relevance)}/100</span>
                    </td>
                    <td className="px-2 py-2.5">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${s.risk === "élevé" ? "text-critical" : s.risk === "moyen" ? "text-warning" : "text-good"}`}>
                        <Icon name={s.risk === "élevé" ? "x" : s.risk === "moyen" ? "alert" : "check"} size={13} /> {s.risk}
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
      <Section title={agency ? "Clients & verticales" : "Audiences cibles"}>
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
      <Section title={agency ? "Services & agences concurrentes" : "Produits & concurrents"}>
        <ul className="space-y-2.5">
          {intel.products.map((p) => (
            <li key={p.name} className="text-sm">
              <span className="font-semibold">{p.name}</span>
              {p.pricing && <span className="tabular text-xs text-muted"> · {p.pricing}</span>}
              <span className="block text-xs text-ink-2">{p.description}</span>
            </li>
          ))}
        </ul>
        <div className="label mb-2 mt-5">{agency ? "Agences concurrentes" : "Concurrents"}</div>
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
            <button key={q} onClick={() => onGoCampaign(q)} className="rounded-lg border border-line p-3 text-left text-sm text-ink-2 transition hover:border-accent hover:bg-accent-soft">
              <span className="flex gap-2"><Icon name="bulb" size={16} className="mt-0.5 shrink-0 text-accent-ink" />{q}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Sources" subtitle={mode === "live" ? "Recherche web en temps réel" : mode === "knowledge" ? "Connaissances de Claude, sans recherche web" : "Mode démo : aucune source réelle"}>
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
          <p className="text-sm text-muted">
            {mode === "knowledge"
              ? "Analyse issue des connaissances de Claude : vérifiez les faits récents. La version serveur avec clé API ajoute la recherche web en temps réel."
              : "Configurez ANTHROPIC_API_KEY pour une analyse sourcée."}
          </p>
        )}
      </Section>
    </div>
  );
}

const PRESENCE: Record<CountryInsight["presence"], { level: "good" | "info" | "warning" | "critical"; text: string }> = {
  forte: { level: "good", text: "Présence forte" },
  moyenne: { level: "info", text: "Présence moyenne" },
  faible: { level: "warning", text: "Présence faible" },
  absente: { level: "critical", text: "Absente du pays" },
};
const SENTIMENT: Record<CountryInsight["sentiment"], { level: "good" | "info" | "warning" | "critical"; text: string }> = {
  positif: { level: "good", text: "Image positive" },
  mitigé: { level: "warning", text: "Image mitigée" },
  négatif: { level: "critical", text: "Image négative" },
  inconnu: { level: "info", text: "Image peu documentée" },
};
const PILL = { good: "text-good", info: "text-info", warning: "text-warning", critical: "text-critical" };
const ICON: Record<keyof typeof PILL, IconName> = { good: "check", info: "info", warning: "alert", critical: "x" };

function Pill({ s }: { s: { level: keyof typeof PILL; text: string } }) {
  return (
    <span className={`chip text-xs font-medium ${PILL[s.level]}`}>
      <Icon name={ICON[s.level]} size={13} /> {s.text}
    </span>
  );
}

function MarketsCard({
  insights,
  base,
  onGoCampaign,
}: {
  insights: CountryInsight[];
  base: "verified" | "sourced" | "claude" | "estimate" | "demo";
  onGoCampaign: (brief?: string) => void;
}) {
  const [active, setActive] = useState(0);
  const c = insights[Math.min(active, insights.length - 1)];
  const multi = insights.length > 1;
  const best = multi ? insights.reduce((a, b) => ((b.opportunityScore ?? 0) > (a.opportunityScore ?? 0) ? b : a)) : null;

  return (
    <section className="card p-5 lg:col-span-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-accent-ink"><Icon name="globe" size={18} /></span>
        <h3 className="text-lg font-bold">{multi ? `${insights.length} marchés visés` : `Perception en ${c.country}`}</h3>
        <Badge kind={base} />
      </div>

      {multi && (
        <>
          <p className="mt-1 text-sm text-ink-2">
            Marché le plus prometteur : <span className="font-semibold text-ink">{best?.country}</span>. Sélectionnez un pays pour voir le détail.
          </p>
          <div role="tablist" aria-label="Pays" className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {insights.map((m, i) => {
              const on = i === active;
              return (
                <button
                  key={m.country}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setActive(i)}
                  className={`rounded-lg border p-3 text-left transition ${on ? "border-accent bg-accent-soft" : "border-line hover:border-line-strong"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold">{m.country}</span>
                    {m === best && <span className="label !text-accent-ink">Top</span>}
                  </div>
                  {typeof m.opportunityScore === "number" && (
                    <div className="mt-2">
                      <div className="mb-1 flex items-baseline justify-between">
                        <span className="text-[11px] text-muted">Opportunité</span>
                        <span className="num text-xs font-semibold">{Math.round(m.opportunityScore)}</span>
                      </div>
                      <Meter value={m.opportunityScore} />
                    </div>
                  )}
                  {typeof m.recommendedMonthlyBudget === "number" && (
                    <div className="num mt-2 text-xs text-ink-2">{fmtMoney(m.recommendedMonthlyBudget)}/mois</div>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      <div className={multi ? "mt-5 border-t border-line pt-5" : "mt-1"} role={multi ? "tabpanel" : undefined}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {multi && <h4 className="text-base font-bold" style={{ fontFamily: "var(--font-display)" }}>Perception en {c.country}</h4>}
            <p className="mt-1 text-sm text-ink-2">{c.awareness}</p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Pill s={PRESENCE[c.presence] ?? PRESENCE.moyenne} />
            <Pill s={SENTIMENT[c.sentiment] ?? SENTIMENT.inconnu} />
            {!multi && typeof c.recommendedMonthlyBudget === "number" && (
              <span className="chip num text-xs">{fmtMoney(c.recommendedMonthlyBudget)}/mois</span>
            )}
          </div>
        </div>
        <p className="mt-3 max-w-4xl text-[15px] leading-relaxed">{c.perception}</p>

        {c.objectives?.length > 0 && (
          <div className="mt-4">
            <div className="label mb-2">Objectifs recommandés en {c.country}</div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              {c.objectives.map((o) => (
                <div key={o.objective} className="flex flex-col justify-between gap-2 rounded-lg bg-surface-2 p-3">
                  <div>
                    <div className="text-sm font-semibold">{o.objective}</div>
                    <div className="mt-0.5 text-xs text-ink-2">{o.rationale}</div>
                  </div>
                  <button
                    className="inline-flex items-center gap-1 self-start text-xs font-semibold text-accent-ink hover:underline"
                    onClick={() => onGoCampaign(`${o.objective} (marché : ${c.country})`)}
                  >
                    Campagne <Icon name="arrowRight" size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="min-w-0">
            <div className="label mb-2">Différences avec le reste du monde</div>
            <ul className="space-y-1.5 text-sm text-ink-2">
              {c.differences.map((d) => (
                <li key={d} className="flex gap-2"><span className="num text-muted">≠</span>{d}</li>
              ))}
            </ul>
          </div>
          <div className="min-w-0">
            <div className="label mb-2">Adapter les annonces</div>
            <ul className="space-y-1.5 text-sm text-ink-2">
              {c.adaptationTips.map((d) => (
                <li key={d} className="flex gap-2"><Icon name="arrowRight" size={14} className="mt-0.5 shrink-0 text-accent-ink" />{d}</li>
              ))}
            </ul>
          </div>
          <div className="min-w-0 space-y-3">
            <div>
              <div className="label mb-1.5">Concurrents locaux</div>
              <div className="flex flex-wrap gap-1.5">
                {c.localCompetitors.map((x) => (
                  <span key={x} className="chip text-xs">{x}</span>
                ))}
              </div>
            </div>
            <div>
              <div className="label mb-1.5">Subreddits du pays</div>
              <div className="flex flex-wrap gap-1.5">
                {c.localSubreddits.map((x) => (
                  <a key={x} href={`https://www.reddit.com/r/${x}`} target="_blank" rel="noreferrer" className="chip text-xs hover:border-accent">
                    r/{x}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Pour les analyses antérieures au résumé « En bref » : reconstruit 3 constats depuis la fiche. */
function fallbackTakeaways(intel: CompanyIntel): string[] {
  const top = [...intel.subreddits].sort((a, b) => b.relevance - a.relevance).slice(0, 2).map((s) => `r/${s.name}`);
  return [
    intel.redditFit.verdict,
    `Budget test conseillé : ${fmtMoney(intel.budget.recommendedRedditMonthlyLow)} à ${fmtMoney(intel.budget.recommendedRedditMonthlyHigh)} par mois.`,
    top.length ? `Communautés prioritaires : ${top.join(" et ")}.` : intel.tagline,
  ];
}
