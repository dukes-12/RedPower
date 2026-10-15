import { analyzeCompanyLive, hasApiKey, resolveModel } from "@/lib/claude";
import { countryInfo } from "@/lib/countries";
import { demoCompany } from "@/lib/demo";
import { delay, ndjsonResponse } from "@/lib/ndjson";
import { verifySubreddits } from "@/lib/reddit";
import type { CompanyIntel } from "@/lib/schemas";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  const { company, forceDemo, model, country } = (await req.json().catch(() => ({}))) as { company?: string; forceDemo?: boolean; model?: string; country?: string };
  const countryCode = countryInfo(country).code;
  const name = company?.trim().slice(0, 120);
  if (!name) return Response.json({ error: "Nom d'entreprise manquant." }, { status: 400 });

  return ndjsonResponse<CompanyIntel>(async (emit) => {
    if (!hasApiKey() || forceDemo) {
      for (const label of ["Recherche web (simulée)…", "Estimation du budget…", "Cartographie des communautés Reddit…"]) {
        emit({ type: "stage", label });
        await delay(450);
      }
      const intel = demoCompany(name, countryCode);
      emit({ type: "result", data: intel, mode: "demo", sources: [] });
      return;
    }

    const { intel, sources } = await analyzeCompanyLive(name, { model: resolveModel(model), country: countryCode }, emit);
    emit({ type: "stage", label: "Vérification des communautés sur Reddit…" });
    intel.subreddits = await verifySubreddits(intel.subreddits);
    emit({ type: "result", data: intel, mode: "live", sources });
  });
}
