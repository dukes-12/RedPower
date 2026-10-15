"use client";
import { useMemo, useRef, useState } from "react";

export interface BandPoint {
  x: number;
  low: number;
  mid: number;
  high: number;
}

/**
 * Courbe cumulée (scénario réaliste) + bande pessimiste/optimiste.
 * Une seule série : le titre la nomme, pas de légende. Survol = réticule + infobulle.
 */
export function BandChart({ data, format, xLabel = "Jour" }: { data: BandPoint[]; format: (n: number) => string; xLabel?: string }) {
  const W = 640, H = 240, P = { l: 52, r: 12, t: 12, b: 26 };
  const [hover, setHover] = useState<number | null>(null);
  const ref = useRef<SVGSVGElement>(null);

  const { xs, ys, ticks, path, band } = useMemo(() => {
    const maxY = Math.max(1, ...data.map((d) => d.high)) * 1.05;
    const n = Math.max(1, data.length - 1);
    const xs = (i: number) => P.l + (i / n) * (W - P.l - P.r);
    const ys = (v: number) => H - P.b - (v / maxY) * (H - P.t - P.b);
    const ticks = niceTicks(maxY, 4);
    const path = data.map((d, i) => `${i ? "L" : "M"}${xs(i).toFixed(1)},${ys(d.mid).toFixed(1)}`).join("");
    const band =
      data.map((d, i) => `${i ? "L" : "M"}${xs(i).toFixed(1)},${ys(d.high).toFixed(1)}`).join("") +
      [...data].reverse().map((d, j) => `L${xs(data.length - 1 - j).toFixed(1)},${ys(d.low).toFixed(1)}`).join("") +
      "Z";
    return { xs, ys, ticks, path, band };
  }, [data]);

  function onMove(e: React.PointerEvent) {
    const svg = ref.current;
    if (!svg || data.length === 0) return;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((x - P.l) / (W - P.l - P.r)) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  }

  const h = hover !== null ? data[hover] : null;
  return (
    <div className="relative">
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="w-full touch-none select-none" onPointerMove={onMove} onPointerLeave={() => setHover(null)} role="img" aria-label="Évolution cumulée sur la période">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={P.l} x2={W - P.r} y1={ys(t)} y2={ys(t)} stroke="var(--grid)" />
            <text x={P.l - 8} y={ys(t)} textAnchor="end" dominantBaseline="central" fontSize="11" fill="var(--muted)" className="tabular">
              {format(t)}
            </text>
          </g>
        ))}
        <path d={band} fill="var(--series-band)" />
        <path d={path} fill="none" stroke="var(--series-1)" strokeWidth="2" strokeLinejoin="round" />
        {[0, Math.floor((data.length - 1) / 2), data.length - 1].map((i) =>
          data[i] ? (
            <text key={i} x={xs(i)} y={H - 8} textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"} fontSize="11" fill="var(--muted)">
              {xLabel} {data[i].x}
            </text>
          ) : null,
        )}
        {h && hover !== null && (
          <g>
            <line x1={xs(hover)} x2={xs(hover)} y1={P.t} y2={H - P.b} stroke="var(--muted)" strokeDasharray="3 3" />
            <circle cx={xs(hover)} cy={ys(h.mid)} r="4.5" fill="var(--series-1)" stroke="var(--surface)" strokeWidth="2" />
          </g>
        )}
      </svg>
      {h && hover !== null && (
        <div
          className="pointer-events-none absolute top-2 rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-lg"
          style={{ left: `${(xs(hover) / W) * 100}%`, transform: hover > data.length / 2 ? "translateX(calc(-100% - 10px))" : "translateX(10px)" }}
        >
          <div className="font-semibold">{xLabel} {h.x}</div>
          <div className="tabular text-ink">Réaliste : <b>{format(h.mid)}</b></div>
          <div className="tabular text-muted">Fourchette : {format(h.low)} – {format(h.high)}</div>
        </div>
      )}
    </div>
  );
}

function niceTicks(max: number, count: number) {
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const out: number[] = [];
  for (let v = 0; v <= max; v += step) out.push(v);
  return out;
}

/** Barres horizontales simples, valeur étiquetée directement. */
export function HBars({ rows, format, highlight }: { rows: { label: string; value: number; sub?: string; dim?: boolean }[]; format: (n: number) => string; highlight?: string }) {
  const max = Math.max(1e-9, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label} title={`${r.label} : ${format(r.value)}`} className={r.dim ? "opacity-60" : ""}>
          <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
            <span className={r.label === highlight ? "font-semibold" : ""}>
              {r.label} {r.sub && <span className="text-xs text-muted">{r.sub}</span>}
            </span>
            <span className="tabular font-medium">{format(r.value)}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-surface-2">
            <div className={`h-full rounded-[4px] ${r.label === highlight ? "bg-accent" : "bg-series"}`} style={{ width: `${Math.max(1.5, (r.value / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
