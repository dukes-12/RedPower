import { hasApiKey, MODEL } from "@/lib/claude";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ live: hasApiKey(), model: hasApiKey() ? MODEL : null });
}
