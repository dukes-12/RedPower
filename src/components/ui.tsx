"use client";
import type { ReactNode } from "react";

export function Section({ title, subtitle, action, children, className = "" }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`card p-5 ${className}`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-[15px] font-semibold">{title}</h3>
          {subtitle && <p className="mt-0.5 text-sm text-ink-2">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="label">{label}</div>
      <div className="tabular mt-1 truncate text-xl font-semibold">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-muted">{hint}</div>}
    </div>
  );
}

const STATUS = {
  good: { icon: "✓", cls: "text-good", label: "OK" },
  warning: { icon: "!", cls: "text-warning", label: "Attention" },
  critical: { icon: "✕", cls: "text-critical", label: "Bloquant" },
  info: { icon: "i", cls: "text-info", label: "Info" },
} as const;

export function StatusLine({ level, children }: { level: keyof typeof STATUS; children: ReactNode }) {
  const s = STATUS[level];
  return (
    <li className="flex gap-2.5 text-sm">
      <span aria-label={s.label} className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-current text-[11px] font-bold ${s.cls}`}>
        {s.icon}
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
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fill="var(--text)" fontSize={size / 4} fontWeight="700">
        {Math.round(v)}
      </text>
    </svg>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="card grid place-items-center px-6 py-16 text-center">
      <div className="max-w-md">
        <div className="text-lg font-semibold">{title}</div>
        {children && <div className="mt-2 text-sm text-ink-2">{children}</div>}
      </div>
    </div>
  );
}

export function CopyButton({ text, label = "Copier" }: { text: string; label?: string }) {
  return (
    <button
      type="button"
      className="btn btn-ghost !px-3 !py-1 text-xs"
      onClick={(e) => {
        navigator.clipboard?.writeText(text);
        const el = e.currentTarget;
        const prev = el.textContent;
        el.textContent = "Copié ✓";
        setTimeout(() => (el.textContent = prev), 1200);
      }}
    >
      {label}
    </button>
  );
}

export function Progress({ stages, sources }: { stages: string[]; sources?: { title: string; url: string }[] }) {
  return (
    <div className="card p-5">
      <ul className="space-y-2">
        {stages.map((s, i) => (
          <li key={i} className={`flex items-center gap-2 text-sm ${i === stages.length - 1 ? "text-ink" : "text-muted"}`}>
            <span className={`size-2 rounded-full ${i === stages.length - 1 ? "pulse bg-accent" : "bg-good"}`} />
            {s}
          </li>
        ))}
      </ul>
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
  );
}

export function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
