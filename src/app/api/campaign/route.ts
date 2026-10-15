import { generateCampaignLive, hasApiKey, resolveModel } from "@/lib/claude";
import { demoCampaign } from "@/lib/demo";
import { delay, ndjsonResponse } from "@/lib/ndjson";
import type { CampaignBrief, CampaignPlan, CompanyIntel } from "@/lib/schemas";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { brief?: CampaignBrief; intel?: CompanyIntel | null; forceDemo?: boolean; model?: string };
  const brief = body.brief;
  if (!brief?.brief?.trim()) return Response.json({ error: "Décrivez votre besoin." }, { status: 400 });
  brief.brief = brief.brief.slice(0, 4000);

  return ndjsonResponse<CampaignPlan>(async (emit) => {
    if (!hasApiKey() || body.forceDemo) {
      for (const label of ["Lecture du brief…", "Idéation des concepts…", "Écriture des headlines…"]) {
        emit({ type: "stage", label });
        await delay(400);
      }
      emit({ type: "result", data: demoCampaign(brief, body.intel ?? null), mode: "demo", sources: [] });
      return;
    }
    const plan = await generateCampaignLive(brief, body.intel ?? null, resolveModel(body.model), emit);
    emit({ type: "result", data: plan, mode: "live", sources: [] });
  });
}
