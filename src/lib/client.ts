"use client";
import type { Source, StreamEvent } from "./schemas";

export interface StreamHandlers<T> {
  onStage?: (label: string) => void;
  onSource?: (s: Source) => void;
}

/** Appelle une route NDJSON et relaie la progression. Résout avec le résultat final. */
export async function streamPost<T>(
  url: string,
  body: unknown,
  handlers: StreamHandlers<T>,
  signal?: AbortSignal,
): Promise<{ data: T; mode: "live" | "demo"; sources: Source[] }> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal });
  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `Erreur ${res.status}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line) continue;
      const evt = JSON.parse(line) as StreamEvent<T>;
      if (evt.type === "stage") handlers.onStage?.(evt.label);
      else if (evt.type === "source") handlers.onSource?.(evt.source);
      else if (evt.type === "error") throw new Error(evt.message);
      else if (evt.type === "result") return { data: evt.data, mode: evt.mode, sources: evt.sources };
    }
  }
  throw new Error("Flux interrompu avant la fin.");
}

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* stockage indisponible : on ignore */
  }
}
