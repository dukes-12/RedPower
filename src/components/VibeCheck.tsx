"use client";
import { scoreHeadline } from "@/lib/headlineScore";
import { useMemo } from "react";

export function VibeBadge({ headline }: { headline: string }) {
  const { score, grade } = useMemo(() => scoreHeadline(headline), [headline]);
  const tone = score >= 80 ? "text-good" : score >= 60 ? "text-ink-2" : score >= 40 ? "text-warning" : "text-critical";
  return (
    <span className={`chip tabular !py-0 text-[11px] ${tone}`} title="Reddit Vibe Check : authenticité perçue du titre">
      <b>{score}</b> {grade}
    </span>
  );
}

export function VibeDetails({ headline }: { headline: string }) {
  const { score, grade, checks } = useMemo(() => scoreHeadline(headline), [headline]);
  return (
    <div>
      <div className="mb-3 flex items-baseline gap-2">
        <span className="tabular text-4xl font-bold">{score}</span>
        <span className="text-ink-2">/ 100 · {grade}</span>
      </div>
      <ul className="space-y-2">
        {checks.map((c) => (
          <li key={c.label} className="flex gap-2 text-sm">
            <span aria-label={c.ok ? "réussi" : "à améliorer"} className={c.ok ? "text-good" : "text-warning"}>{c.ok ? "✓" : "!"}</span>
            <span>
              <span className={c.ok ? "text-ink" : "text-ink"}>{c.label}</span>
              {!c.ok && c.tip && <span className="block text-xs text-muted">{c.tip}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
