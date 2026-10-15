"use client";
import { transport, type ResultMode } from "@/lib/transport";
import { REDDIT_OBJECTIVES, type AnalysisOptions, type CampaignBrief, type CampaignConcept, type CampaignPlan, type CompanyIntel } from "@/lib/schemas";
import { fmtMoney } from "@/lib/simulator";
import { useState } from "react";
import { RedditAdPreview } from "./RedditAdPreview";
import { CopyButton, Progress, Section } from "./ui";
import { VibeBadge } from "./VibeCheck";

const STARTERS = [
  "Lancer un nouveau produit auprès d'early adopters",
  "Récupérer les clients d'un concurrent qui vient d'augmenter ses prix",
  "Générer des inscriptions à l'essai gratuit avant la fin du trimestre",
  "Changer une mauvaise image de marque sur Reddit",
  "Recruter des développeurs seniors",
  "Black Friday : écouler le stock sans brader la marque",
];
const TONES = ["Authentique & transparent", "Humour / autodérision", "Expert & factuel", "Mème / culture Reddit", "Provocateur"];

export function CampaignStudio({
  intel,
  brief,
  setBrief,
  plan,
  setPlan,
  onSimulate,
  opts,
}: {
  intel: CompanyIntel | null;
  brief: CampaignBrief;
  setBrief: (b: CampaignBrief) => void;
  plan: { data: CampaignPlan; mode: ResultMode } | null;
  setPlan: (p: { data: CampaignPlan; mode: ResultMode } | null) => void;
  onSimulate: (c: CampaignConcept, budget: number) => void;
  opts: AnalysisOptions;
}) {
  const [stages, setStages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    setStages([]);
    try {
      const res = await transport().generateCampaign(brief, intel, opts, { onStage: (s) => setStages((p) => (p[p.length - 1] === s ? p : [...p, s])) });
      setPlan({ data: res.data, mode: res.mode });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[380px_1fr]">
      <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <Section title="Votre besoin" subtitle={intel ? `Contexte : ${intel.name}` : "Analysez une entreprise pour un résultat plus précis"}>
          <textarea
            className="input min-h-32 resize-y text-sm"
            placeholder="Ex : on lance une version mobile et on veut 2 000 inscriptions de freelances en 6 semaines…"
            value={brief.brief}
            onChange={(e) => setBrief({ ...brief, brief: e.target.value })}
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {STARTERS.map((s) => (
              <button key={s} className="chip text-left text-xs hover:border-accent" onClick={() => setBrief({ ...brief, brief: s })}>
                {s}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="col-span-2 text-sm">
              <span className="label">Objectif</span>
              <select className="input mt-1" value={brief.objective} onChange={(e) => setBrief({ ...brief, objective: e.target.value as CampaignBrief["objective"] })}>
                <option value="auto">Laisser l'IA choisir</option>
                {REDDIT_OBJECTIVES.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="label">Budget / mois ($)</span>
              <input type="number" min={150} step={100} className="input tabular mt-1" value={brief.monthlyBudget} onChange={(e) => setBrief({ ...brief, monthlyBudget: Number(e.target.value) || 0 })} />
            </label>
            <label className="text-sm">
              <span className="label">Marché / langue</span>
              <input className="input mt-1" value={brief.geo} onChange={(e) => setBrief({ ...brief, geo: e.target.value })} />
            </label>
          </div>

          <div className="label mb-1.5 mt-4">Ton</div>
          <div className="flex flex-wrap gap-1.5">
            {TONES.map((t) => (
              <button key={t} className="chip text-xs" data-active={brief.tone === t} onClick={() => setBrief({ ...brief, tone: t })}>
                {t}
              </button>
            ))}
          </div>

          <button className="btn btn-primary mt-5 w-full justify-center" disabled={loading || !brief.brief.trim()} onClick={generate}>
            {loading ? "Génération…" : "✨ Générer les campagnes"}
          </button>
          {error && <p className="mt-2 text-sm text-critical">✕ {error}</p>}
        </Section>
      </div>

      <div className="min-w-0 space-y-4">
        {loading && <Progress stages={stages} />}
        {!loading && !plan && (
          <div className="card grid place-items-center px-6 py-20 text-center">
            <div className="max-w-md">
              <div className="text-4xl">🧪</div>
              <div className="mt-3 text-lg font-semibold">Décrivez un besoin, une envie ou une campagne</div>
              <p className="mt-1 text-sm text-ink-2">
                Vous obtiendrez 3 concepts contrastés avec headlines natifs Reddit, ciblage, répartition budgétaire, test A/B et réponses aux commentaires.
              </p>
            </div>
          </div>
        )}
        {!loading && plan && <PlanView plan={plan.data} mode={plan.mode} intel={intel} budget={brief.monthlyBudget} onSimulate={onSimulate} />}
      </div>
    </div>
  );
}

function PlanView({ plan, mode, intel, budget, onSimulate }: { plan: CampaignPlan; mode: ResultMode; intel: CompanyIntel | null; budget: number; onSimulate: (c: CampaignConcept, budget: number) => void }) {
  const brand = intel?.name ?? "Brand";
  return (
    <>
      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="label">Stratégie {mode === "demo" && "· démo"}</div>
          <CopyButton text={toMarkdown(plan, brand, budget)} label="Exporter en Markdown" />
        </div>
        <p className="mt-2 text-[15px] leading-relaxed">{plan.strategySummary}</p>
        <div className="mt-4 rounded-xl border-l-4 border-accent bg-accent-soft p-3 text-sm">
          <span className="font-semibold">Insight : </span>
          {plan.insight}
        </div>
      </section>

      {plan.concepts.map((c, i) => (
        <ConceptCard key={c.name + i} concept={c} index={i} brand={brand} website={intel?.website} budget={budget} onSimulate={onSimulate} />
      ))}

      <div className="grid gap-4 xl:grid-cols-2">
        <Section title="Banque de headlines" action={<CopyButton text={plan.headlineBank.join("\n")} />}>
          <ul className="space-y-2">
            {plan.headlineBank.map((h) => (
              <li key={h} className="flex items-start justify-between gap-2 text-sm">
                <span>{h}</span>
                <VibeBadge headline={h} />
              </li>
            ))}
          </ul>
        </Section>
        <Section title="Survivre aux commentaires" subtitle="Réponses prêtes pour la modération">
          <ul className="space-y-3">
            {plan.commentReplies.map((r) => (
              <li key={r.likelyComment} className="text-sm">
                <div className="rounded-lg bg-surface-2 px-3 py-2 text-ink-2">💬 {r.likelyComment}</div>
                <div className="ml-6 mt-1 rounded-lg border border-line px-3 py-2">↳ {r.reply}</div>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <Section title="Checklist de lancement">
        <ul className="grid gap-2 sm:grid-cols-2">
          {plan.launchChecklist.map((c) => (
            <li key={c} className="flex gap-2 text-sm">
              <input type="checkbox" className="mt-1 accent-[var(--accent)]" /> <span className="text-ink-2">{c}</span>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}

function ConceptCard({ concept: c, index, brand, website, budget, onSimulate }: { concept: CampaignConcept; index: number; brand: string; website?: string; budget: number; onSimulate: (c: CampaignConcept, budget: number) => void }) {
  const [adIdx, setAdIdx] = useState(0);
  const ad = c.ads[adIdx] ?? c.ads[0];
  const conceptBudget = (budget * c.budgetSplitPercent) / 100;
  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line p-5">
        <div className="min-w-0">
          <div className="label">Concept {index + 1} · {c.funnelStage}</div>
          <h3 className="mt-1 text-xl font-bold">{c.name}</h3>
          <p className="mt-1 text-sm text-ink-2">{c.bigIdea}</p>
        </div>
        <div className="text-right">
          <div className="chip !border-accent text-xs font-semibold !text-accent-ink">{c.objective}</div>
          <div className="tabular mt-2 text-sm font-semibold">{c.budgetSplitPercent} % · {fmtMoney(conceptBudget)}/mois</div>
          <button className="btn btn-ghost mt-2 !px-3 !py-1 text-xs" onClick={() => onSimulate(c, conceptBudget)}>
            📈 Simuler ce concept
          </button>
        </div>
      </div>

      <div className="grid gap-5 p-5 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-4">
          <div>
            <div className="label mb-2">Annonces</div>
            <div className="space-y-2">
              {c.ads.map((a, i) => (
                <button key={i} onClick={() => setAdIdx(i)} className={`w-full rounded-xl border p-3 text-left transition ${i === adIdx ? "border-accent bg-accent-soft" : "border-line hover:bg-surface-2"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold">{a.headline}</span>
                    <VibeBadge headline={a.headline} />
                  </div>
                  <div className="mt-1 text-xs text-muted">{a.format} · {a.cta} · angle : {a.angle}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="label mb-1.5">Communautés</div>
              <div className="flex flex-wrap gap-1.5">
                {c.targeting.communities.map((s) => (
                  <span key={s} className="chip text-xs">r/{s}</span>
                ))}
              </div>
              <div className="label mb-1.5 mt-3">Keywords</div>
              <div className="flex flex-wrap gap-1.5">
                {c.targeting.keywords.map((s) => (
                  <span key={s} className="chip text-xs">{s}</span>
                ))}
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="label">Pourquoi Reddit</span><br /><span className="text-ink-2">{c.whyReddit}</span></p>
              <p><span className="label">Enchères</span><br /><span className="text-ink-2">{c.bidStrategy}</span></p>
              <p><span className="label">Ciblage</span><br /><span className="text-ink-2">{c.targeting.geo} · {c.targeting.devices} · {c.targeting.interests.join(", ")}</span></p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <MiniBlock title="Test A/B" text={c.abTest} />
            <MiniBlock title="Activation communauté" text={c.communityPlay} />
            <MiniBlock title="KPIs" text={c.kpis.join(" · ")} />
          </div>
          {c.risks.length > 0 && <p className="text-xs text-muted">⚠ Risques : {c.risks.join(" · ")}</p>}
        </div>
        <div>
          <div className="label mb-2">Aperçu dans le feed</div>
          <RedditAdPreview ad={ad} brand={brand} website={website} />
        </div>
      </div>
    </section>
  );
}

function MiniBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl bg-surface-2 p-3">
      <div className="label">{title}</div>
      <div className="mt-1 text-xs text-ink-2">{text}</div>
    </div>
  );
}

function toMarkdown(plan: CampaignPlan, brand: string, budget: number) {
  const lines = [`# Plan Reddit Ads — ${brand}`, "", `**Budget :** ${budget} $/mois`, "", `## Stratégie`, plan.strategySummary, "", `> Insight : ${plan.insight}`, ""];
  plan.concepts.forEach((c, i) => {
    lines.push(`## Concept ${i + 1} — ${c.name} (${c.objective}, ${c.budgetSplitPercent} %)`, c.bigIdea, "", `**Communautés :** ${c.targeting.communities.map((s) => "r/" + s).join(", ")}`, `**Keywords :** ${c.targeting.keywords.join(", ")}`, "", "### Annonces");
    c.ads.forEach((a) => lines.push(`- **${a.headline}** — ${a.body} _(${a.format}, CTA ${a.cta})_`));
    lines.push("", `**Test A/B :** ${c.abTest}`, `**Communauté :** ${c.communityPlay}`, `**KPIs :** ${c.kpis.join(", ")}`, "");
  });
  lines.push("## Headlines bonus", ...plan.headlineBank.map((h) => `- ${h}`), "", "## Checklist", ...plan.launchChecklist.map((c) => `- [ ] ${c}`));
  return lines.join("\n");
}
