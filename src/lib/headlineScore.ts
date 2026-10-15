/**
 * "Reddit Vibe Check" : note heuristique d'un headline selon les codes de Reddit.
 * Les redditors détestent le ton corporate, le hype et le clickbait ; ils récompensent
 * la transparence, la spécificité et l'humour. Fonctionne côté client, en direct.
 */

export interface HeadlineCheck {
  label: string;
  ok: boolean;
  tip?: string;
  weight: number;
}

export interface HeadlineScore {
  score: number;
  grade: "Natif" | "Correct" | "Risqué" | "Downvote assuré";
  checks: HeadlineCheck[];
}

const HYPE = [
  "révolutionnaire", "revolutionary", "game changer", "game-changer", "incroyable", "incredible", "best-in-class",
  "leader", "ultime", "ultimate", "meilleur du marché", "unbeatable", "disruptive", "disruptif", "synergy", "synergie",
  "seamless", "cutting-edge", "next-gen", "world-class", "innovant", "innovative", "solution", "leverage", "empower",
];
const CLICKBAIT = ["vous ne croirez pas", "you won't believe", "ce qui va suivre", "what happens next", "secret", "choquant", "shocking", "hack"];
const AUTHENTIC = [
  "on a", "nous avons", "we built", "we made", "honest", "honnête", "franchement", "tbh", "ama", "transparent",
  "on s'est trompé", "we messed up", "pourquoi", "why", "comment", "how", "real", "vrai", "sans bullshit", "no bs",
];

export function scoreHeadline(raw: string, maxChars = 300): HeadlineScore {
  const h = raw.trim();
  const lower = h.toLowerCase();
  const len = h.length;
  const words = h.split(/\s+/).filter(Boolean);
  const capsWords = words.filter((w) => w.length > 3 && w === w.toUpperCase() && /[A-Z]/.test(w));
  const emojis = (h.match(/\p{Extended_Pictographic}/gu) ?? []).length;
  const exclam = (h.match(/!/g) ?? []).length;

  const checks: HeadlineCheck[] = [
    {
      label: `Longueur (${len}/${maxChars})`,
      ok: len >= 20 && len <= 120,
      tip: len > 120 ? "Au-delà de ~120 caractères le titre est tronqué dans le feed mobile." : len < 20 ? "Trop court pour donner du contexte : Reddit aime les titres explicites." : undefined,
      weight: 15,
    },
    {
      label: "Pas de jargon marketing",
      ok: !HYPE.some((w) => lower.includes(w)),
      tip: "Mots comme « révolutionnaire » ou « solution » déclenchent le réflexe anti-pub.",
      weight: 20,
    },
    {
      label: "Pas de clickbait",
      ok: !CLICKBAIT.some((w) => lower.includes(w)),
      tip: "Les redditors signalent et downvotent le clickbait.",
      weight: 15,
    },
    {
      label: "Pas de MAJUSCULES ni de !!!",
      ok: capsWords.length === 0 && exclam <= 1,
      tip: "Crier dans un titre = downvote. Un seul « ! » maximum.",
      weight: 10,
    },
    {
      label: "Emojis sobres (≤ 1)",
      ok: emojis <= 1,
      tip: "Contrairement à Meta/TikTok, l'excès d'emojis fait « spam » sur Reddit.",
      weight: 5,
    },
    {
      label: "Spécifique (chiffre, détail concret)",
      ok: /\d/.test(h) || /\b(en|in) \d|\bpar\b|\bper\b/.test(lower),
      tip: "Un chiffre ou un détail précis rend le message crédible (« 3 ans de dev », « 12 €/mois »).",
      weight: 15,
    },
    {
      label: "Ton humain / transparent",
      ok: AUTHENTIC.some((w) => lower.includes(w)) || /\b(je|j'|on|nous|we|i|our|notre)\b/.test(lower),
      tip: "Parlez à la 1re personne, comme un membre de la communauté (« On a construit… »).",
      weight: 15,
    },
    {
      label: "Invite à la discussion",
      ok: h.includes("?") || /\b(avis|feedback|thoughts|ama|demandez|ask)\b/.test(lower),
      tip: "Une question ou un appel au feedback génère des commentaires, donc de la portée.",
      weight: 5,
    },
  ];

  if (!h) return { score: 0, grade: "Downvote assuré", checks };
  const total = checks.reduce((s, c) => s + c.weight, 0);
  const score = Math.round((checks.reduce((s, c) => s + (c.ok ? c.weight : 0), 0) / total) * 100);
  const grade = score >= 80 ? "Natif" : score >= 60 ? "Correct" : score >= 40 ? "Risqué" : "Downvote assuré";
  return { score, grade, checks };
}
