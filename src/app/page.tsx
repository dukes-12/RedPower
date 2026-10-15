"use client";
import { CampaignStudio } from "@/components/CampaignStudio";
import { CompanyPanel } from "@/components/CompanyPanel";
import { HeadlineLab } from "@/components/HeadlineLab";
import { Simulator, type SimConfig } from "@/components/Simulator";
import { Empty, Progress } from "@/components/ui";
import { loadJSON, saveJSON, streamPost } from "@/lib/client";
import { PLATFORMS, REDDIT_OBJECTIVE_TO_GOAL } from "@/lib/platforms";
import type { CampaignBrief, CampaignConcept, CampaignPlan, CompanyIntel, Source } from "@/lib/schemas";
import { useEffect, useRef, useState } from "react";

type Tab = "intel" | "studio" | "sim" | "lab";
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "intel", label: "Intelligence", icon: "🔎" },
  { id: "studio", label: "Studio campagne", icon: "✨" },
  { id: "sim", label: "Simulateur", icon: "📈" },
  { id: "lab", label: "Headline Lab", icon: "🧪" },
];
const EXAMPLES = ["Notion", "Duolingo", "Back Market", "Liquid Death", "Revolut", "Ubisoft"];

interface Analysis {
  intel: CompanyIntel;
  sources: Source[];
  mode: "live" | "demo";
  at: number;
}

const DEFAULT_SIM: SimConfig = { goal: "traffic", monthlyBudget: 3000, durationDays: 30, creativeQuality: 1, conversionValue: 0, communities: [] };
const DEFAULT_BRIEF: CampaignBrief = { brief: "", objective: "auto", monthlyBudget: 3000, tone: "Authentique & transparent", geo: "France, français" };

export default function Home() {
  const [tab, setTab] = useState<Tab>("intel");
  const [query, setQuery] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [history, setHistory] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [stages, setStages] = useState<string[]>([]);
  const [liveSources, setLiveSources] = useState<Source[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [brief, setBrief] = useState<CampaignBrief>(DEFAULT_BRIEF);
  const [plan, setPlan] = useState<{ data: CampaignPlan; mode: "live" | "demo" } | null>(null);
  const [sim, setSim] = useState<SimConfig>(DEFAULT_SIM);
  const [status, setStatus] = useState<{ live: boolean; model: string | null } | null>(null);
  const [forceDemo, setForceDemo] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetch("/api/status").then((r) => r.json()).then(setStatus).catch(() => setStatus({ live: false, model: null }));
    setHistory(loadJSON<Analysis[]>("rp-history", []));
    setTheme((document.documentElement.dataset.theme as "light" | "dark") ?? null);
  }, []);

  function toggleTheme() {
    const current = theme ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    setTheme(next);
    try {
      localStorage.setItem("rp-theme", next);
    } catch {}
  }

  function applyAnalysis(a: Analysis) {
    setAnalysis(a);
    const top = [...a.intel.subreddits].sort((x, y) => y.relevance - x.relevance).slice(0, 5).map((s) => s.name);
    setSelected(top);
    const budget = Math.round((a.intel.budget.recommendedRedditMonthlyLow + a.intel.budget.recommendedRedditMonthlyHigh) / 2 / 100) * 100 || 3000;
    setSim((s) => ({ ...s, monthlyBudget: budget, industry: a.intel.industry, label: a.intel.name, communities: toCommunities(a.intel, top) }));
    setBrief((b) => ({ ...b, monthlyBudget: budget }));
    setPlan(null);
  }

  async function analyze(name = query) {
    const company = name.trim();
    if (!company) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setQuery(company);
    setTab("intel");
    setLoading(true);
    setError(null);
    setStages([]);
    setLiveSources([]);
    try {
      const res = await streamPost<CompanyIntel>(
        "/api/company",
        { company, forceDemo },
        { onStage: (s) => setStages((p) => (p[p.length - 1] === s ? p : [...p, s])), onSource: (s) => setLiveSources((p) => [...p, s]) },
        ctrl.signal,
      );
      const a: Analysis = { intel: res.data, sources: res.sources, mode: res.mode, at: Date.now() };
      applyAnalysis(a);
      const nextHistory = [a, ...history.filter((h) => h.intel.name.toLowerCase() !== a.intel.name.toLowerCase())].slice(0, 8);
      setHistory(nextHistory);
      saveJSON("rp-history", nextHistory);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  function toggleSub(name: string) {
    const next = selected.includes(name) ? selected.filter((s) => s !== name) : [...selected, name];
    setSelected(next);
    if (analysis) setSim((s) => ({ ...s, communities: toCommunities(analysis.intel, next) }));
  }

  function goCampaign(seed?: string) {
    if (seed) setBrief((b) => ({ ...b, brief: seed }));
    setTab("studio");
  }

  function simulateConcept(c: CampaignConcept, budget: number) {
    const known = new Map((analysis?.intel.subreddits ?? []).map((s) => [s.name.toLowerCase(), s]));
    setSim((s) => ({
      ...s,
      label: `Concept « ${c.name} »`,
      goal: REDDIT_OBJECTIVE_TO_GOAL[c.objective] ?? "traffic",
      monthlyBudget: Math.max(150, Math.round(budget)),
      creativeQuality: 1.2,
      communities: c.targeting.communities.map((n) => {
        const k = known.get(n.toLowerCase());
        return { name: n, members: k ? (k.verifiedMembers ?? k.estimatedMembers) : 150_000, relevance: k?.relevance ?? 75 };
      }),
    }));
    setTab("sim");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const intel = analysis?.intel ?? null;
  const isDemo = !status?.live || forceDemo;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
      {/* En-tête */}
      <header className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div className="flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-xl bg-accent text-lg font-black text-white">R</div>
          <div className="leading-tight">
            <div className="text-lg font-extrabold tracking-tight">RedPower</div>
            <div className="text-[11px] text-muted">Simulateur de campagnes Ads</div>
          </div>
        </div>
        <nav className="order-3 flex w-full gap-1.5 overflow-x-auto sm:order-none sm:w-auto" aria-label="Plateformes">
          {PLATFORMS.map((p) => (
            <span key={p.id} className="chip shrink-0 text-xs" data-active={p.status === "live"} title={p.status === "live" ? "Active" : "Bientôt : déjà disponible dans le comparateur du simulateur"}>
              <span className="size-2 rounded-full" style={{ background: p.color }} />
              {p.name.replace(" Ads", "")}
              {p.status === "soon" && <span className="text-[10px] text-muted">bientôt</span>}
            </span>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button
            className="chip text-xs"
            onClick={() => status?.live && setForceDemo((v) => !v)}
            title={status?.live ? `Modèle : ${status.model}. Cliquer pour basculer en démo.` : "Ajoutez ANTHROPIC_API_KEY dans .env.local pour activer l'analyse temps réel"}
          >
            <span className={`size-2 rounded-full ${isDemo ? "bg-warning" : "bg-good"}`} />
            {isDemo ? "Mode démo" : "Live · web temps réel"}
          </button>
          <button className="chip text-xs" onClick={toggleTheme} aria-label="Changer de thème">
            {theme === "dark" ? "☀" : "☾"}
          </button>
        </div>
      </header>

      {/* Recherche */}
      <section className={`card relative overflow-hidden ${intel || loading ? "p-4" : "px-5 py-12 sm:px-10 sm:py-16"}`}>
        {!intel && !loading && (
          <div className="mb-6 max-w-2xl">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Tapez une entreprise.<br />
              <span className="text-accent">Obtenez sa campagne Reddit.</span>
            </h1>
            <p className="mt-3 text-ink-2">
              Ce qu'elle représente, son budget potentiel, ses objectifs du moment, ses keywords et ses meilleures communautés — puis des campagnes prêtes à lancer et leur simulation de performance.
            </p>
          </div>
        )}
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            analyze();
          }}
        >
          <input className="input !rounded-full !px-5 !py-3 text-base" placeholder="Nom d'une entreprise : Notion, Alan, Michel et Augustin…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Entreprise" />
          <button className="btn btn-primary justify-center !px-6 !py-3" disabled={loading || !query.trim()}>
            {loading ? "Analyse…" : "Analyser"}
          </button>
        </form>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted">{history.length ? "Récents :" : "Essayez :"}</span>
          {(history.length ? history.map((h) => h.intel.name) : EXAMPLES).map((n) => (
            <button
              key={n}
              className="chip text-xs hover:border-accent"
              onClick={() => {
                const h = history.find((x) => x.intel.name === n);
                if (h) {
                  applyAnalysis(h);
                  setQuery(h.intel.name);
                  setTab("intel");
                } else analyze(n);
              }}
            >
              {n}
            </button>
          ))}
        </div>
        {isDemo && !intel && !loading && (
          <p className="mt-4 text-xs text-muted">
            Mode démo actif : données simulées. Ajoutez <code className="rounded bg-surface-2 px-1">ANTHROPIC_API_KEY</code> dans <code className="rounded bg-surface-2 px-1">.env.local</code> pour l'analyse en temps réel avec recherche web.
          </p>
        )}
      </section>

      {/* Onglets */}
      <nav className="sticky top-0 z-20 -mx-4 mt-4 flex gap-1 overflow-x-auto bg-bg/90 px-4 py-2 backdrop-blur sm:mx-0 sm:px-0" aria-label="Sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`btn shrink-0 !rounded-full text-sm ${tab === t.id ? "bg-ink text-bg" : "text-ink-2 hover:bg-surface-2"}`}
            aria-current={tab === t.id}
          >
            <span aria-hidden>{t.icon}</span> {t.label}
          </button>
        ))}
        {analysis && (
          <span className="ml-auto hidden items-center gap-1.5 self-center text-xs text-muted md:flex">
            {analysis.mode === "demo" ? "Données démo" : "Analyse live"} · {new Date(analysis.at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
          </span>
        )}
      </nav>

      <main className="mt-3">
        {error && <div className="card mb-4 border-critical/40 p-4 text-sm text-critical">✕ {error}</div>}

        {tab === "intel" &&
          (loading ? (
            <Progress stages={stages.length ? stages : ["Connexion…"]} sources={liveSources} />
          ) : intel ? (
            <CompanyPanel intel={intel} sources={analysis!.sources} selected={selected} onToggleSub={toggleSub} onGoCampaign={goCampaign} />
          ) : (
            <Empty title="Commencez par une entreprise">
              La fiche s'affichera ici : identité, budget estimé, objectifs actuels, actualités, keywords par intention et communautés Reddit classées par pertinence.
            </Empty>
          ))}

        {tab === "studio" && <CampaignStudio intel={intel} brief={brief} setBrief={setBrief} plan={plan} setPlan={setPlan} onSimulate={simulateConcept} forceDemo={forceDemo} />}
        {tab === "sim" && <Simulator config={sim} setConfig={setSim} />}
        {tab === "lab" && <HeadlineLab intel={intel} />}
      </main>
    </div>
  );
}

function toCommunities(intel: CompanyIntel, names: string[]) {
  return intel.subreddits
    .filter((s) => names.includes(s.name))
    .map((s) => ({ name: s.name, members: s.verifiedMembers ?? s.estimatedMembers, relevance: s.relevance }));
}
