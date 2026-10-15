"use client";
import { GOAL_LABELS, PLATFORMS, REDDIT, type GoalId } from "@/lib/platforms";
import { fmtMoney, fmtNum, simulate, type SimCommunity, type SimInput } from "@/lib/simulator";
import { transport } from "@/lib/transport";
import { useEffect, useMemo, useState } from "react";
import { BandChart, HBars } from "./Charts";
import { Icon } from "./icons";
import { Section, Stat, StatusLine } from "./ui";

export interface SimConfig {
  goal: GoalId;
  monthlyBudget: number;
  durationDays: number;
  creativeQuality: number;
  conversionValue: number;
  communities: SimCommunity[];
  industry?: string;
  label?: string;
}

type Metric = "impressions" | "reach" | "clicks" | "actions" | "spend";

const QUALITY = [
  { v: 0.75, label: "Générique", hint: "Pub recyclée d'autres réseaux" },
  { v: 1, label: "Correcte", hint: "Adaptée au format Reddit" },
  { v: 1.2, label: "Native", hint: "Ton communautaire, transparent" },
  { v: 1.4, label: "Virale", hint: "Mème / insight très fort" },
];

export function Simulator({ config, setConfig }: { config: SimConfig; setConfig: (c: SimConfig) => void }) {
  const [metric, setMetric] = useState<Metric>(config.goal === "awareness" ? "reach" : "actions");
  useEffect(() => setMetric(config.goal === "awareness" ? "reach" : "actions"), [config.goal]);
  const input: SimInput = { ...config, platform: REDDIT };
  const out = useMemo(() => simulate(input), [JSON.stringify(config)]); // eslint-disable-line react-hooks/exhaustive-deps
  const { low, mid, high } = out.scenarios;
  const range = (f: (s: typeof mid) => number, fmt: (n: number) => string) => `${fmt(f(low))} – ${fmt(f(high))}`;

  const series = useMemo(
    () =>
      mid.days.map((d, i) => {
        const get = (s: typeof mid) => {
          const p = s.days[i];
          return metric === "impressions" ? p.cumImpressions : metric === "reach" ? p.reach : metric === "clicks" ? p.cumClicks : metric === "actions" ? p.cumActions : p.cumSpend;
        };
        const vals = [get(low), get(mid), get(high)].sort((a, b) => a - b);
        return { x: d.day, low: vals[0], mid: get(mid), high: vals[2] };
      }),
    [out, metric], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const comparison = useMemo(
    () =>
      PLATFORMS.filter((p) => p.goals[config.goal]).map((p) => {
        const r = simulate({ ...input, platform: p, communities: p.id === "reddit" ? config.communities : [] }).scenarios.mid;
        return { platform: p, cpa: r.cpa, actions: r.actions, cpm: r.cpm, cpc: r.cpc, reach: r.reach };
      }),
    [JSON.stringify(config)], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const set = <K extends keyof SimConfig>(k: K, v: SimConfig[K]) => setConfig({ ...config, [k]: v });
  const isVideo = config.goal === "video";
  const isAwareness = config.goal === "awareness";

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_1fr]">
      {/* Contrôles */}
      <div className="space-y-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto lg:pb-2">
        <Section title="Paramètres" subtitle={config.label ?? "Reddit Ads"}>
          <label className="block text-sm">
            <span className="label">Objectif</span>
            <select className="input mt-1" value={config.goal} onChange={(e) => set("goal", e.target.value as GoalId)}>
              {(Object.keys(REDDIT.goals) as GoalId[]).map((g) => (
                <option key={g} value={g}>{REDDIT.goals[g]!.label}</option>
              ))}
            </select>
          </label>

          <Slider label="Budget mensuel" value={config.monthlyBudget} min={150} max={100000} step={50} log display={fmtMoney(config.monthlyBudget)} onChange={(v) => set("monthlyBudget", v)} />
          <Slider label="Durée" value={config.durationDays} min={7} max={90} step={1} display={`${config.durationDays} jours`} onChange={(v) => set("durationDays", v)} />

          <div className="mt-4">
            <span className="label">Qualité créative</span>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              {QUALITY.map((q) => (
                <button key={q.v} className="chip justify-center text-xs" data-active={config.creativeQuality === q.v} onClick={() => set("creativeQuality", q.v)} title={q.hint}>
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          {!isVideo && (
            <label className="mt-4 block text-sm">
              <span className="label">Valeur d'une conversion ($)</span>
              <input type="number" min={0} className="input tabular mt-1" value={config.conversionValue} onChange={(e) => set("conversionValue", Math.max(0, Number(e.target.value) || 0))} />
              <span className="text-xs text-muted">Panier moyen ou LTV, pour calculer le ROAS</span>
            </label>
          )}
        </Section>

        <CommunityEditor communities={config.communities} onChange={(c) => set("communities", c)} />
      </div>

      {/* Résultats */}
      <div className="min-w-0 space-y-4">
        <section className="card p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="label">Scénario réaliste · {config.durationDays} jours · {fmtMoney(mid.spend)} dépensés</div>
            <div className="text-xs text-muted">Secteur : {out.industryLabel} · audience adressable ≈ {fmtNum(out.audience)}</div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 xl:grid-cols-6">
            <Stat label="Impressions" value={fmtNum(mid.impressions)} hint={range((s) => s.impressions, fmtNum)} />
            <Stat label="Reach" value={fmtNum(mid.reach)} hint={`fréquence ${mid.frequency.toFixed(1)}`} />
            <Stat label="Clics" value={fmtNum(mid.clicks)} hint={range((s) => s.clicks, fmtNum)} />
            <Stat label={out.actionLabel} value={fmtNum(mid.actions)} hint={range((s) => s.actions, fmtNum)} />
            <Stat label="CPM / CPC" value={`${fmtMoney(mid.cpm)}`} hint={`CPC ${fmtMoney(mid.cpc)} · CTR ${mid.ctr.toFixed(2)} %`} />
            <Stat
              label={isAwareness ? "Coût / 1000 reach" : isVideo ? "Coût / vue" : config.conversionValue ? "CPA · ROAS" : "CPA"}
              value={isAwareness ? fmtMoney((mid.spend / Math.max(1, mid.reach)) * 1000) : fmtMoney(mid.cpa)}
              hint={!isVideo && config.conversionValue ? `ROAS ${mid.roas.toFixed(1)}x (${low.roas.toFixed(1)}–${high.roas.toFixed(1)})` : range((s) => s.cpa, (n) => fmtMoney(n)).split(" – ").reverse().join(" – ")}
            />
          </div>
        </section>

        <Section
          title={`${metricLabel(metric, out.actionLabel)} cumulés`}
          subtitle="Ligne : scénario réaliste · zone : fourchette pessimiste / optimiste. Phase d'apprentissage les 7 premiers jours."
          action={
            <div className="flex flex-wrap gap-1">
              {(["actions", "clicks", "impressions", "reach", "spend"] as Metric[]).map((m) => (
                <button key={m} className="chip text-xs" data-active={metric === m} onClick={() => setMetric(m)}>
                  {metricLabel(m, out.actionLabel)}
                </button>
              ))}
            </div>
          }
        >
          <BandChart data={series} format={metric === "spend" ? (n) => fmtMoney(n, 0) : fmtNum} />
        </Section>

        <div className="grid gap-4 xl:grid-cols-2">
          <Section title="Recommandations" subtitle="Générées à partir de la simulation">
            <ul className="space-y-2.5">
              {out.insights.map((i) => (
                <StatusLine key={i.text} level={i.level}>{i.text}</StatusLine>
              ))}
            </ul>
          </Section>

          <Section title="Répartition par communauté" subtitle={`${out.actionLabel} estimés (scénario réaliste)`}>
            {out.communities.length ? (
              <HBars rows={out.communities.slice(0, 10).map((c) => ({ label: `r/${c.name}`, value: c.actions, sub: `${Math.round(c.share * 100)} % du budget` }))} format={fmtNum} />
            ) : (
              <p className="text-sm text-muted">Aucune communauté : ciblage large (intérêts). Ajoutez des subreddits pour affiner.</p>
            )}
          </Section>
        </div>

        <Section
          title="Comparateur multi-plateformes"
          subtitle={`${isAwareness ? "CPM" : isVideo ? "Coût par vue" : "Coût par action"} pour « ${GOAL_LABELS[config.goal]} » à budget égal (plus court = moins cher) — benchmarks indicatifs, plateformes bientôt activables`}
        >
          <HBars
            highlight="Reddit Ads"
            rows={[...comparison]
              .sort((a, b) => (isAwareness ? a.cpm - b.cpm : a.cpa - b.cpa))
              .map((c) => ({
                label: c.platform.name,
                value: isAwareness ? c.cpm : c.cpa,
                sub: isAwareness ? `reach ≈ ${fmtNum(c.reach)}` : `${fmtNum(c.actions)} actions · CPM ${fmtMoney(c.cpm)}`,
              }))}
            format={(n) => fmtMoney(n)}
          />
        </Section>

        <p className="text-xs leading-relaxed text-muted">
          Modèle : benchmarks CPM/CTR/CVR par objectif et par secteur, courbe de reach à rendements décroissants (R = A·(1−e^(−I/A))), fatigue créative selon la fréquence,
          surcoût de phase d'apprentissage. Ce sont des estimations pour décider et dimensionner, pas une garantie de performance.
        </p>
      </div>
    </div>
  );
}

function metricLabel(m: Metric, action: string) {
  return { actions: action, clicks: "Clics", impressions: "Impressions", reach: "Reach", spend: "Dépense" }[m];
}

function Slider({ label, value, min, max, step, display, onChange, log }: { label: string; value: number; min: number; max: number; step: number; display: string; onChange: (v: number) => void; log?: boolean }) {
  // Échelle logarithmique pour le budget : précise sur les petits montants, va jusqu'à 100 k$.
  const toPos = (v: number) => (log ? (Math.log(v / min) / Math.log(max / min)) * 1000 : v);
  const fromPos = (p: number) => (log ? Math.round((min * (max / min) ** (p / 1000)) / step) * step : p);
  return (
    <label className="mt-4 block text-sm">
      <span className="flex items-baseline justify-between">
        <span className="label">{label}</span>
        <span className="tabular font-semibold">{display}</span>
      </span>
      <input
        type="range"
        className="mt-1.5 w-full"
        min={log ? 0 : min}
        max={log ? 1000 : max}
        step={log ? 1 : step}
        value={toPos(value)}
        onChange={(e) => onChange(fromPos(Number(e.target.value)))}
      />
    </label>
  );
}

function CommunityEditor({ communities, onChange }: { communities: SimCommunity[]; onChange: (c: SimCommunity[]) => void }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<{ name: string; members: number }[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const term = q.trim().replace(/^r\//i, "");
    if (term.length < 2) return setHits([]);
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        setHits(await transport().searchSubreddits(term));
      } catch {
        setHits([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [q]);

  function add(name: string, members: number) {
    const n = name.replace(/^r\//i, "").trim();
    if (!n || communities.some((c) => c.name.toLowerCase() === n.toLowerCase())) return;
    onChange([...communities, { name: n, members: members || 100_000, relevance: 70 }]);
    setQ("");
    setHits([]);
  }

  return (
    <Section title="Communautés ciblées" subtitle={`${communities.length} subreddit${communities.length > 1 ? "s" : ""}`}>
      <ul className="max-h-60 space-y-1 overflow-y-auto">
        {communities.map((c) => (
          <li key={c.name} className="flex items-center justify-between gap-2 text-sm">
            <span className="truncate">r/{c.name}</span>
            <span className="flex items-center gap-2">
              <span className="tabular text-xs text-muted">{fmtNum(c.members)}</span>
              <button className="text-muted hover:text-critical" aria-label={`Retirer r/${c.name}`} onClick={() => onChange(communities.filter((x) => x.name !== c.name))}>
                <Icon name="x" size={14} />
              </button>
            </span>
          </li>
        ))}
      </ul>
      <div className="relative mt-3">
        <input
          className="input text-sm"
          placeholder="Ajouter : r/nomdusubreddit"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add(q, 0)}
        />
        {(hits.length > 0 || searching) && (
          <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-line bg-surface p-1 shadow-lg">
            {searching && <li className="px-2 py-1.5 text-xs text-muted">Recherche sur Reddit…</li>}
            {hits.map((h) => (
              <li key={h.name}>
                <button className="flex w-full justify-between rounded-lg px-2 py-1.5 text-left text-sm hover:bg-surface-2" onClick={() => add(h.name, h.members)}>
                  <span>r/{h.name}</span>
                  <span className="tabular text-xs text-muted">{fmtNum(h.members)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="mt-1.5 text-xs text-muted">Entrée pour ajouter (taille par défaut 100 k si Reddit ne répond pas).</p>
    </Section>
  );
}
