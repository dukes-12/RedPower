"use client";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./icons";

export function Section({
  title,
  subtitle,
  action,
  badge,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`card min-w-0 p-5 ${className}`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[16px] font-bold">{title}</h3>
            {badge}
          </div>
          {subtitle && <p className="mt-0.5 text-sm text-ink-2">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Stat({ label, value, hint, badge, mono = true }: { label: string; value: ReactNode; hint?: ReactNode; badge?: ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5">
        <span className="label">{label}</span>
        {badge}
      </div>
      <div className={`${mono ? "num" : ""} mt-1 truncate text-lg font-semibold`}>{value}</div>
      {hint && <div className="mt-0.5 text-xs text-muted">{hint}</div>}
    </div>
  );
}

/* ---------- Fiabilité des données ---------- */

export type Reliability = "verified" | "sourced" | "claude" | "estimate" | "demo";

const RELIABILITY: Record<Reliability, { icon: IconName; text: string; cls: string; title: string }> = {
  verified: { icon: "check", text: "Vérifié", cls: "text-good border-good/40", title: "Donnée vérifiée à la source (API Reddit)" },
  sourced: { icon: "globe", text: "Source web", cls: "text-info border-info/40", title: "Issue d'une recherche web en temps réel, voir les sources" },
  claude: { icon: "sparkles", text: "Claude", cls: "text-ink-2 border-line-strong", title: "Issue des connaissances de Claude : à vérifier pour les faits récents" },
  estimate: { icon: "target", text: "Estimation", cls: "text-warning border-warning/40", title: "Estimation calculée, pas une donnée publique" },
  demo: { icon: "alert", text: "Démo", cls: "text-muted border-line-strong border-dashed", title: "Donnée fictive du mode démo" },
};

export function Badge({ kind, label }: { kind: Reliability; label?: string }) {
  const r = RELIABILITY[kind];
  return (
    <span title={r.title} className={`inline-flex shrink-0 items-center gap-1 rounded-[5px] border px-1.5 py-px font-mono text-[10px] font-medium uppercase tracking-wide ${r.cls}`}>
      <Icon name={r.icon} size={11} />
      {label ?? r.text}
    </span>
  );
}

/** Origine des faits d'une analyse, selon son mode. */
export function baseReliability(mode: "live" | "knowledge" | "demo"): Reliability {
  return mode === "live" ? "sourced" : mode === "knowledge" ? "claude" : "demo";
}

/* ---------- États ---------- */

const STATUS = {
  good: { icon: "check" as IconName, cls: "text-good", label: "OK" },
  warning: { icon: "alert" as IconName, cls: "text-warning", label: "Attention" },
  critical: { icon: "x" as IconName, cls: "text-critical", label: "Bloquant" },
  info: { icon: "info" as IconName, cls: "text-info", label: "Info" },
} as const;

export function StatusLine({ level, children }: { level: keyof typeof STATUS; children: ReactNode }) {
  const s = STATUS[level];
  return (
    <li className="flex gap-2.5 text-sm">
      <span aria-label={s.label} className={`mt-0.5 shrink-0 ${s.cls}`}>
        <Icon name={s.icon} size={16} />
      </span>
      <span className="text-ink-2">{children}</span>
    </li>
  );
}

export function Meter({ value, max = 100, tone = "accent" }: { value: number; max?: number; tone?: "accent" | "series" }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
      <div className={`h-full rounded-full ${tone === "accent" ? "bg-accent" : "bg-series"}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Gauge({ score, size = 96 }: { score: number; size?: number }) {
  const r = size / 2 - 7;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, score));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Score ${v} sur 100`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth="7" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={`${(v / 100) * c} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fill="var(--text)" fontSize={size / 3.6} fontWeight="600" fontFamily="var(--font-mono)">
        {Math.round(v)}
      </text>
    </svg>
  );
}

export function Empty({ title, icon = "search", children }: { title: string; icon?: IconName; children?: ReactNode }) {
  return (
    <div className="card grid place-items-center px-6 py-16 text-center">
      <div className="max-w-md">
        <div className="mx-auto grid size-11 place-items-center rounded-lg bg-surface-2 text-ink-2">
          <Icon name={icon} size={20} />
        </div>
        <div className="mt-3 text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>
          {title}
        </div>
        {children && <div className="mt-2 text-sm text-ink-2">{children}</div>}
      </div>
    </div>
  );
}

export function CopyButton({ text, label = "Copier" }: { text: string; label?: string }) {
  return (
    <button
      type="button"
      className="btn btn-ghost !px-2.5 !py-1 text-xs"
      onClick={(e) => {
        const el = e.currentTarget.querySelector("span");
        navigator.clipboard?.writeText(text).catch(() => undefined);
        if (!el) return;
        const prev = el.textContent;
        el.textContent = "Copié";
        setTimeout(() => (el.textContent = prev), 1200);
      }}
    >
      <Icon name="copy" size={13} />
      <span>{label}</span>
    </button>
  );
}

export function Progress({ stages, sources, onStop, hint, skeleton = true }: { stages: string[]; sources?: { title: string; url: string }[]; onStop?: () => void; hint?: string; skeleton?: boolean }) {
  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <ul className="min-w-0 space-y-2">
            {stages.map((s, i) => (
              <li key={i} className={`flex items-center gap-2 text-sm ${i === stages.length - 1 ? "text-ink" : "text-muted"}`}>
                <span className={`size-2 shrink-0 rounded-full ${i === stages.length - 1 ? "pulse bg-accent" : "bg-good"}`} />
                {s}
              </li>
            ))}
          </ul>
          {onStop && (
            <button className="btn btn-ghost !py-1 text-xs" onClick={onStop}>
              <Icon name="stop" size={13} /> Arrêter
            </button>
          )}
        </div>
        {hint && <p className="mt-3 text-xs text-muted">{hint}</p>}
        {sources && sources.length > 0 && (
          <div className="mt-4 border-t border-line pt-3">
            <div className="label mb-2">{sources.length} sources consultées</div>
            <div className="flex flex-wrap gap-1.5">
              {sources.slice(-12).map((s) => (
                <span key={s.url} className="chip max-w-[220px] truncate text-xs">{hostname(s.url)}</span>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Squelette de la fiche pendant l'attente */}
      {skeleton && <div className="grid grid-cols-1 gap-4 lg:grid-cols-3" aria-hidden>
        <div className="card space-y-3 p-5 lg:col-span-2">
          <div className="skeleton h-6 w-1/3" />
          <div className="skeleton h-4 w-2/3" />
          <div className="skeleton h-16 w-full" />
        </div>
        <div className="card space-y-3 p-5">
          <div className="skeleton h-4 w-1/2" />
          <div className="skeleton h-20 w-20 !rounded-full" />
        </div>
        <div className="card space-y-2 p-5 lg:col-span-3">
          <div className="skeleton h-4 w-1/4" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-5/6" />
        </div>
      </div>}
    </div>
  );
}

export function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
