import type { StreamEvent } from "./schemas";

/**
 * Réponse en streaming NDJSON : une ligne JSON par événement (étapes, sources, résultat).
 * Permet d'afficher la progression de la recherche en temps réel côté client.
 */
export function ndjsonResponse<T>(run: (emit: (e: StreamEvent<T>) => void) => Promise<void>): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (e: StreamEvent<T>) => controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      try {
        await run(emit);
      } catch (err) {
        emit({ type: "error", message: errorMessage(err) });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function errorMessage(err: unknown): string {
  if (err && typeof err === "object" && "status" in err) {
    const status = (err as { status?: number }).status;
    if (status === 401) return "Clé API Anthropic invalide.";
    if (status === 429) return "Limite de requêtes atteinte, réessayez dans un instant.";
    if (status && status >= 500) return "Le service d'IA est momentanément indisponible.";
  }
  return err instanceof Error ? err.message : "Erreur inconnue.";
}

export const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
