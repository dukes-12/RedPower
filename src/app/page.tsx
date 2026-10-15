"use client";
import { CampaignStudio } from "@/components/CampaignStudio";
import { CompanyPanel } from "@/components/CompanyPanel";
import { HeadlineLab } from "@/components/HeadlineLab";
import { Icon, type IconName } from "@/components/icons";
import { ModelSelect } from "@/components/ModelSelect";
import { Simulator, type SimConfig } from "@/components/Simulator";
import { Empty, Progress } from "@/components/ui";
import { loadJSON, saveJSON } from "@/lib/client";
import { COUNTRIES, countryInfo } from "@/lib/countries";
import { DEFAULT_ANALYSIS_MODEL, DEFAULT_CAMPAIGN_MODEL, isModelId, modelInfo } from "@/lib/models";
import { PLATFORMS, REDDIT_OBJECTIVE_TO_GOAL } from "@/lib/platforms";
import type { CampaignBrief, CampaignConcept, CampaignPlan, CompanyIntel, Source } from "@/lib/schemas";
import { transport, type ResultMode, type Status } from "@/lib/transport";
import { useEffect, useRef, useState } from "react";

type Tab = "intel" | "studio" | "sim" | "lab";

/** Parcours guidé : chaque étape reste accessible directement. */
const STEPS: { id: Exclude<Tab, "lab">; label: string; icon: IconName }[] = [
  { id: "intel", label: "Analyser", icon: "search" },
  { id: "studio", label: "Campagnes", icon: "sparkles" },
  { id: "sim", label: "Simuler", icon: "chart" },
];

const TOOLS: { id: Tab; label: string; icon: IconName; text: string }[] = [
  { id: "studio", label: "Studio campagne", icon: "sparkles", text: "Un besoin → 3 concepts, annonces et ciblage" },
  { id: "sim", label: "Simulateur", icon: "chart", text: "Budget → impressions, clics, conversions" },
  { id: "lab", label: "Headline Lab", icon: "type", text: "Tester un titre avant de le publier" },
];

const EXAMPLES = ["Notion", "Duolingo", "Back Market", "Liquid Death", "Revolut", "Ubisoft"];

interface Analysis {
  intel: CompanyIntel;
  sources: Source[];
  mode: ResultMode;
  at: number;
  model?: string;
  country?: string;
}

interface Settings {
  analysisModel: string;
  campaignModel: string;
  country: string;
}

const DEFAULT_SETTINGS: Settings = { analysisModel: DEFAULT_ANALYSIS_MODEL, campaignModel: DEFAULT_CAMPAIGN_MODEL, country: "" };
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
  const [plan, setPlan] = useState<{ data: CampaignPlan; mode: ResultMode } | null>(null);
  const [sim, setSim] = useState<SimConfig>(DEFAULT_SIM);
  const [simVisited, setSimVisited] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const [forceDemo, setForceDemo] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    transport().status().then(setStatus);
    setHistory(loadJSON<Analysis[]>("rp-history", []));
    const saved = loadJSON<Partial<Settings>>("rp-settings-v2", {});
    setSettings({
      analysisModel: isModelId(saved.analysisModel) ? saved.analysisModel : DEFAULT_ANALYSIS_MODEL,
      campaignModel: isModelId(saved.campaignModel) ? saved.campaignModel : DEFAULT_CAMPAIGN_MODEL,
      country: countryInfo(saved.country).code,
    });
    setTheme((document.documentElement.dataset.theme as "light" | "dark" | undefined) ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  }, []);

  useEffect(() => {
    if (tab === "sim") setSimVisited(true);
  }, [tab]);

  function toggleTheme() {
    const current = theme ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    setTheme(next);
    try {
      localStorage.setItem("rp-theme", next);
    } catch {}
  }

  function updateSettings(patch: Partial<Settings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveJSON("rp-settings-v2", next);
  }

  function go(next: Tab) {
    setTab(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function applyAnalysis(a: Analysis) {
    setAnalysis(a);
    const top = [...a.intel.subreddits].sort((x, y) => y.relevance - x.relevance).slice(0, 5).map((s) => s.name);
    setSelected(top);
    const budget = Math.round((a.intel.budget.recommendedRedditMonthlyLow + a.intel.budget.recommendedRedditMonthlyHigh) / 2 / 100) * 100 || 3000;
    setSim((s) => ({ ...s, monthlyBudget: budget, industry: a.intel.industry, label: a.intel.name, communities: toCommunities(a.intel, top) }));
    const c = countryInfo(a.country);
    setBrief((b) => ({ ...b, monthlyBudget: budget, geo: c.code ? `${c.label}, ${c.lang}` : b.geo }));
    setPlan(null);
  }

  async function analyze(name = query) {
    const company = name.trim();
    if (!company) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const { analysisModel: model, country } = settings;
    setQuery(company);
    setTab("intel");
    setLoading(true);
    setError(null);
    setStages([]);
    setLiveSources([]);
    try {
      const res = await transport().analyzeCompany(
        company,
        { forceDemo, model, country },
        { onStage: (s) => setStages((p) => (p[p.length - 1] === s ? p : [...p, s])), onSource: (s) => setLiveSources((p) => [...p, s]) },
        ctrl.signal,
      );
      const a: Analysis = { intel: res.data, sources: res.sources, mode: res.mode, at: Date.now(), model, country };
      applyAnalysis(a);
      const nextHistory = [a, ...history.filter((h) => !(h.intel.name.toLowerCase() === a.intel.name.toLowerCase() && (h.country ?? "") === country))].slice(0, 8);
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
    go("studio");
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
    go("sim");
  }

  const intel = analysis?.intel ?? null;
  const isDemo = !status?.live || forceDemo;
  const done: Record<Exclude<Tab, "lab">, boolean> = { intel: !!intel, studio: !!plan, sim: simVisited };
  const stepHint: Record<Exclude<Tab, "lab">, string> = {
    intel: intel ? intel.name : "Une entreprise",
    studio: plan ? `${plan.data.concepts.length} concepts` : "Un besoin",
    sim: sim.label ?? "Un budget",
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
      {/* En-tête */}
      <header className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div className="flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-lg bg-accent text-white">
            <Icon name="target" size={20} strokeWidth={2.2} />
          </div>
          <div className="leading-tight">
            <div className="text-lg font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              RedPower
            </div>
            <div className="label !text-[9.5px]">Reddit Ads planner</div>
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
            title={status?.live ? `${status.detail}. Cliquer pour basculer en démo.` : "Claude n'est pas disponible : données de démonstration"}
          >
            <span className={`size-2 rounded-full ${isDemo ? "bg-warning" : "bg-good"}`} />
            {isDemo ? "Mode démo" : status?.label}
          </button>
          <button className="chip !px-2 text-xs" onClick={toggleTheme} aria-label="Changer de thème">
            <Icon name={theme === "dark" ? "sun" : "moon"} size={14} />
          </button>
        </div>
      </header>

      {/* Recherche */}
      <section className={`card relative overflow-hidden ${intel || loading ? "p-4" : "px-5 py-10 sm:px-10 sm:py-14"}`}>
        {!intel && !loading && (
          <div className="mb-6 max-w-2xl">
            <h1 className="text-3xl font-extrabold sm:text-[42px] sm:leading-[1.05]">
              Tapez une entreprise.
              <br />
              <span className="text-accent">Obtenez sa campagne Reddit.</span>
            </h1>
            <p className="mt-3 max-w-xl text-ink-2">
              Ce qu'elle représente, son budget potentiel, ses objectifs du moment, ses keywords et ses meilleures communautés. Puis des campagnes prêtes à lancer et leur simulation de performance.
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
          <div className="relative flex-1">
            <Icon name="search" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input className="input !py-3 !pl-11 text-base" placeholder="Nom d'une entreprise : Notion, Alan, Michel et Augustin…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Entreprise" />
          </div>
          <button className="btn btn-primary justify-center !px-6 !py-3" disabled={loading || !query.trim()}>
            {loading ? "Analyse…" : "Analyser"}
          </button>
        </form>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-3xl">
          <ModelSelect id="rp-model" value={settings.analysisModel} onChange={(v) => updateSettings({ analysisModel: v })} defaultId={DEFAULT_ANALYSIS_MODEL} label="Modèle pour l'analyse" />
          <label className="block text-sm" htmlFor="rp-country">
            <span className="label">Pays visé</span>
            <select id="rp-country" className="input mt-1 !py-1.5 text-sm" value={settings.country} onChange={(e) => updateSettings({ country: e.target.value })}>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-muted">
              {settings.country ? `Ajoute un encart sur la perception de la marque en ${countryInfo(settings.country).label}.` : "Choisissez un pays pour voir comment la marque y est perçue."}
            </span>
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="label mr-1">{history.length ? "Récents" : "Essayez"}</span>
          {history.length
            ? history.map((h) => (
                <button
                  key={`${h.intel.name}-${h.country ?? ""}`}
                  className="chip text-xs"
                  onClick={() => {
                    applyAnalysis(h);
                    setQuery(h.intel.name);
                    setTab("intel");
                  }}
                >
                  {h.intel.name}
                  {h.country ? <span className="num text-[11px] text-muted">{h.country}</span> : null}
                </button>
              ))
            : EXAMPLES.map((n) => (
                <button key={n} className="chip text-xs" onClick={() => analyze(n)}>
                  {n}
                </button>
              ))}
        </div>
        {isDemo && !intel && !loading && status && <p className="mt-4 text-xs text-muted">{status.demoHint ?? "Mode démo actif : données simulées."}</p>}

        {!intel && !loading && (
          <div className="mt-8 border-t border-line pt-5">
            <div className="label mb-3">Ou ouvrez directement un outil</div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {TOOLS.map((t) => (
                <button key={t.id} onClick={() => go(t.id)} className="group flex items-start gap-3 rounded-lg border border-line p-3 text-left transition hover:border-accent">
                  <span className="grid size-8 shrink-0 place-items-center rounded-md bg-surface-2 text-ink-2 group-hover:bg-accent-soft group-hover:text-accent-ink">
                    <Icon name={t.icon} size={16} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{t.label}</span>
                    <span className="block text-xs text-muted">{t.text}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Parcours */}
      <nav className="sticky top-[env(safe-area-inset-top,0px)] z-20 -mx-4 mt-4 bg-bg/92 px-4 py-2 backdrop-blur sm:mx-0 sm:px-0" aria-label="Parcours">
        <div className="flex items-center gap-2 overflow-x-auto">
          <ol className="flex shrink-0 items-center">
            {STEPS.map((s, i) => {
              const active = tab === s.id;
              return (
                <li key={s.id} className="flex items-center">
                  {i > 0 && <span className={`mx-1 h-px w-4 sm:w-8 ${done[STEPS[i - 1].id] ? "bg-accent" : "bg-line-strong"}`} aria-hidden />}
                  <button
                    onClick={() => go(s.id)}
                    aria-current={active ? "step" : undefined}
                    className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition ${active ? "bg-surface shadow-[0_0_0_1px_var(--border-strong)]" : "hover:bg-surface"}`}
                  >
                    <span
                      className={`num grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${
                        done[s.id] ? "bg-accent text-white" : active ? "bg-ink text-bg" : "border border-line-strong text-muted"
                      }`}
                    >
                      {done[s.id] ? <Icon name="check" size={13} strokeWidth={2.6} /> : i + 1}
                    </span>
                    <span className="leading-tight">
                      <span className={`block text-sm font-semibold ${active ? "text-ink" : "text-ink-2"}`}>{s.label}</span>
                      <span className="hidden max-w-[150px] truncate text-[11px] text-muted sm:block">{stepHint[s.id]}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <span className="mx-1 h-6 w-px shrink-0 bg-line-strong" aria-hidden />
          <button
            onClick={() => go("lab")}
            aria-current={tab === "lab" ? "page" : undefined}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-semibold transition ${tab === "lab" ? "bg-surface text-ink shadow-[0_0_0_1px_var(--border-strong)]" : "text-ink-2 hover:bg-surface"}`}
          >
            <Icon name="type" size={15} /> Headline Lab
          </button>
          {analysis && (
            <span className="ml-auto hidden shrink-0 text-right text-[11px] leading-tight text-muted lg:block">
              {analysis.mode === "demo" ? "Données démo" : analysis.mode === "knowledge" ? "Analyse Claude" : "Analyse live"}
              {analysis.mode !== "demo" && analysis.model ? ` ${modelInfo(analysis.model).label}` : ""}
              {analysis.country ? ` · ${countryInfo(analysis.country).label}` : ""}
              <br />
              {new Date(analysis.at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
            </span>
          )}
        </div>
      </nav>

      <main className="mt-3">
        {error && (
          <div className="card mb-4 flex gap-2 border-critical/40 p-4 text-sm text-critical">
            <Icon name="x" size={16} className="mt-0.5 shrink-0" /> {error}
          </div>
        )}

        {tab === "intel" &&
          (loading ? (
            <Progress
              stages={stages.length ? stages : ["Connexion…"]}
              sources={liveSources}
              onStop={() => abortRef.current?.abort()}
              hint={isDemo ? undefined : `Claude ${modelInfo(settings.analysisModel).label} : comptez ${modelInfo(settings.analysisModel).eta}.`}
            />
          ) : intel ? (
            <>
              <CompanyPanel intel={intel} mode={analysis!.mode} sources={analysis!.sources} selected={selected} onToggleSub={toggleSub} onGoCampaign={goCampaign} />
              <NextStep text="Étape suivante : transformer cette analyse en campagnes." cta="Créer les campagnes" onClick={() => go("studio")} />
            </>
          ) : (
            <Empty title="Commencez par une entreprise">
              La fiche s'affichera ici : résumé, identité, budget estimé, objectifs actuels, actualités, keywords par intention et communautés Reddit classées par pertinence.
            </Empty>
          ))}

        {tab === "studio" && (
          <CampaignStudio
            intel={intel}
            brief={brief}
            setBrief={setBrief}
            plan={plan}
            setPlan={setPlan}
            onSimulate={simulateConcept}
            opts={{ forceDemo, country: analysis?.country ?? settings.country }}
            model={settings.campaignModel}
            setModel={(v) => updateSettings({ campaignModel: v })}
            onNext={() => go("sim")}
          />
        )}
        {tab === "sim" && (
          <>
            <Simulator config={sim} setConfig={setSim} />
            <NextStep text="Pour aller plus loin : vérifier que vos titres passent le « vibe check » Reddit." cta="Ouvrir le Headline Lab" onClick={() => go("lab")} />
          </>
        )}
        {tab === "lab" && <HeadlineLab intel={intel} />}
      </main>
    </div>
  );
}

function NextStep({ text, cta, onClick }: { text: string; cta: string; onClick: () => void }) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-line-strong px-4 py-3">
      <span className="text-sm text-ink-2">{text}</span>
      <button className="btn btn-primary !py-1.5 text-sm" onClick={onClick}>
        {cta} <Icon name="arrowRight" size={14} />
      </button>
    </div>
  );
}

function toCommunities(intel: CompanyIntel, names: string[]) {
  return intel.subreddits
    .filter((s) => names.includes(s.name))
    .map((s) => ({ name: s.name, members: s.verifiedMembers ?? s.estimatedMembers, relevance: s.relevance }));
}
