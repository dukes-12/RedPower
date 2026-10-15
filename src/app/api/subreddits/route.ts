import { searchSubreddits } from "@/lib/reddit";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim();
  if (!q) return Response.json({ results: [] });
  return Response.json({ results: await searchSubreddits(q.slice(0, 80)) });
}
