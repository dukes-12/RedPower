"use client";
import type { Ad } from "@/lib/schemas";

/** Maquette d'un post sponsorisé Reddit (feed mobile/desktop). */
export function RedditAdPreview({ ad, brand, website }: { ad: Pick<Ad, "headline" | "body" | "cta" | "format" | "visualIdea">; brand: string; website?: string }) {
  const handle = brand.toLowerCase().replace(/[^a-z0-9]+/g, "") || "brand";
  const domain = (website || `${handle}.com`).replace(/^https?:\/\/(www\.)?/, "").replace(/\/.*$/, "");
  const truncated = ad.headline.length > 120;
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface text-[14px]">
      <div className="flex items-center gap-2 px-3 pt-3">
        <div className="grid size-8 place-items-center rounded-full bg-accent text-sm font-bold text-white">{brand.slice(0, 1).toUpperCase()}</div>
        <div className="leading-tight">
          <div className="text-[13px] font-semibold">u/{handle}</div>
          <div className="text-[11px] text-muted">Promoted</div>
        </div>
        <span className="ml-auto text-muted">•••</span>
      </div>
      <div className="px-3 pt-2 text-[15px] font-semibold leading-snug">
        {truncated ? ad.headline.slice(0, 117) + "…" : ad.headline}
      </div>
      {ad.body && <div className="px-3 pt-1 text-[13px] text-ink-2">{ad.body}</div>}
      {ad.format !== "Texte" && (
        <div className="mx-3 mt-2 grid aspect-[16/9] place-items-center rounded-lg bg-gradient-to-br from-accent-soft to-surface-2 px-6 text-center text-xs text-ink-2">
          <div>
            <div className="label mb-1">{ad.format}</div>
            {ad.visualIdea}
          </div>
        </div>
      )}
      <div className="mx-3 mt-2 flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2">
        <span className="truncate text-xs text-muted">{domain}</span>
        <span className="rounded-full bg-[#0045ac] px-3 py-1 text-xs font-semibold text-white">{ad.cta}</span>
      </div>
      <div className="flex items-center gap-4 px-3 py-2.5 text-xs text-muted">
        <span>⬆ Vote ⬇</span>
        <span>💬 Commentaires</span>
        <span>↗ Partager</span>
      </div>
    </div>
  );
}
