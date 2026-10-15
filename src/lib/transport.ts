"use client";
import { streamPost } from "./client";
import type { CampaignBrief, CampaignPlan, CompanyIntel, Source } from "./schemas";

/**
 * "live"      : recherche web temps réel (serveur + clé API)
 * "knowledge" : Claude sans recherche web (version artifact sur claude.ai)
 * "demo"      : données simulées
 */
export type ResultMode = "live" | "knowledge" | "demo";

export interface Handlers {
  onStage?: (label: string) => void;
  onSource?: (s: Source) => void;
}

export interface Result<T> {
  data: T;
  mode: ResultMode;
  sources: Source[];
}

export interface Status {
  live: boolean;
  /** Libellé affiché dans le badge quand live = true. */
  label: string;
  detail: string;
  /** Texte affiché sous la recherche en mode démo. */
  demoHint?: string;
}

/** Point unique d'accès aux données : serveur Next.js par défaut, remplaçable (artifact claude.ai). */
export interface Transport {
  status(): Promise<Status>;
  analyzeCompany(company: string, forceDemo: boolean, h: Handlers, signal?: AbortSignal): Promise<Result<CompanyIntel>>;
  generateCampaign(brief: CampaignBrief, intel: CompanyIntel | null, forceDemo: boolean, h: Handlers): Promise<Result<CampaignPlan>>;
  searchSubreddits(q: string): Promise<{ name: string; members: number }[]>;
}

const httpTransport: Transport = {
  async status() {
    try {
      const s = (await (await fetch("/api/status")).json()) as { live: boolean; model: string | null };
      return { live: s.live, label: "Live · web temps réel", detail: `Modèle : ${s.model}` };
    } catch {
      return { live: false, label: "", detail: "" };
    }
  },
  analyzeCompany: (company, forceDemo, h, signal) => streamPost<CompanyIntel>("/api/company", { company, forceDemo }, h, signal),
  generateCampaign: (brief, intel, forceDemo, h) => streamPost<CampaignPlan>("/api/campaign", { brief, intel, forceDemo }, h),
  async searchSubreddits(q) {
    const res = await fetch(`/api/subreddits?q=${encodeURIComponent(q)}`);
    return ((await res.json()) as { results: { name: string; members: number }[] }).results;
  },
};

let current: Transport = httpTransport;
export const transport = () => current;
export function setTransport(t: Transport) {
  current = t;
}
