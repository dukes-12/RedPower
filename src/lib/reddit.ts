import type { Subreddit } from "./schemas";

const UA = "RedPower/0.1 (campaign simulator)";

/**
 * Vérifie le nombre réel de membres via l'API publique de Reddit (about.json).
 * Best-effort : si Reddit est injoignable ou limite le débit, on garde l'estimation.
 */
export async function verifySubreddits(subs: Subreddit[]): Promise<Subreddit[]> {
  const results = await Promise.all(
    subs.map(async (s) => {
      try {
        const res = await fetch(`https://www.reddit.com/r/${encodeURIComponent(s.name)}/about.json`, {
          headers: { "User-Agent": UA },
          signal: AbortSignal.timeout(4000),
          next: { revalidate: 86400 },
        });
        if (!res.ok) return s;
        const json = (await res.json()) as { data?: { subscribers?: number; display_name?: string; over18?: boolean } };
        const members = json.data?.subscribers;
        if (typeof members !== "number") return s;
        return { ...s, name: json.data?.display_name ?? s.name, verifiedMembers: members, verified: true };
      } catch {
        return s;
      }
    }),
  );
  return results;
}

export interface SubredditSearchHit {
  name: string;
  members: number;
  description: string;
}

/** Recherche de subreddits par mot-clé (API publique). Retourne [] si indisponible. */
export async function searchSubreddits(query: string): Promise<SubredditSearchHit[]> {
  try {
    const res = await fetch(`https://www.reddit.com/subreddits/search.json?q=${encodeURIComponent(query)}&limit=10&include_over_18=false`, {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      data?: { children?: Array<{ data: { display_name: string; subscribers: number; public_description: string } }> };
    };
    return (json.data?.children ?? []).map((c) => ({
      name: c.data.display_name,
      members: c.data.subscribers ?? 0,
      description: c.data.public_description ?? "",
    }));
  } catch {
    return [];
  }
}
