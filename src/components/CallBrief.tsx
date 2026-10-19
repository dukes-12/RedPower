"use client";
import { BUSINESS_QUESTIONS, CALL_FLOW, CLIENT_TYPES, PREP_QUESTIONS, PREP_RESOURCES, THEME_LABELS, type ClientType } from "@/lib/prep";
import { BusinessQuestions, answerKey, askedKey } from "./BusinessQuestions";
import type { PrepBrief } from "@/lib/schemas";
import { Icon, type IconName } from "./icons";
import { Badge, CopyButton, Empty, Section, type Reliability } from "./ui";

const STATUS: Record<PrepBrief["answers"][number]["status"], { icon: IconName; cls: string; text: string }> = {
  répondu: { icon: "check", cls: "text-good border-good/40", text: "Répondu" },
  partiel: { icon: "alert", cls: "text-warning border-warning/40", text: "Partiel" },
  "à vérifier": { icon: "search", cls: "text-info border-info/40", text: "À vérifier" },
};

const PRIORITY: Record<PrepBrief["priority"], { cls: string; text: string }> = {
  top: { cls: "border-accent bg-accent-soft text-accent-ink", text: "Top client · pitch renforcé" },
  standard: { cls: "border-line-strong text-ink-2", text: "Compte standard" },
  faible: { cls: "border-line text-muted", text: "Priorité faible" },
};

export function CallBrief({
  name,
  brief,
  clientType,
  base,
  notes,
  onNote,
}: {
  name: string;
  brief?: PrepBrief;
  clientType: ClientType;
  base: Reliability;
  notes: Record<string, string>;
  onNote: (id: string, text: string) => void;
}) {
  const questions = PREP_QUESTIONS[clientType];
  if (!brief) {
    return (
      <Empty title="Pas encore de brief d'appel" icon="message">
        Cette analyse date d'avant le brief d'appel. Relancez l'analyse de {name} pour le générer.
      </Empty>
    );
  }
  const answers = new Map(brief.answers.map((a) => [a.id, a]));
  const toVerify = brief.answers.filter((a) => a.status !== "répondu").length;
  const tailored = Boolean(brief.businessQuestions?.length);
  const business = tailored ? brief.businessQuestions : BUSINESS_QUESTIONS[clientType];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* En-tête + déroulé */}
      <section className="card p-5 lg:col-span-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold">Brief d'appel · {name}</h3>
              <span className="chip text-xs">{CLIENT_TYPES.find((c) => c.id === clientType)?.label}</span>
              <Badge kind={base} />
            </div>
            <p className="mt-1 text-sm text-ink-2">
              {questions.length - toVerify}/{questions.length} questions résolues en prep · {toVerify} à vérifier ou compléter avant l'appel.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${PRIORITY[brief.priority].cls}`} title={brief.priorityRationale}>
              {PRIORITY[brief.priority].text}
            </span>
            <CopyButton text={toMarkdown(name, clientType, brief, business, notes)} label="Copier le brief" />
          </div>
        </div>
        <ol className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {CALL_FLOW.map((step, i) => (
            <li key={step.title} className={`flex items-start gap-3 rounded-lg p-3 ${i === 0 ? "bg-accent-soft" : "bg-surface-2"}`}>
              <span className={`num grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${i === 0 ? "bg-accent text-white" : "border border-line-strong text-muted"}`}>
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{step.title}</span>
                <span className="block text-xs text-ink-2">{step.text}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* Questions de prep */}
      <div className="min-w-0 space-y-3 lg:col-span-2">
        <div className="label px-1">Avant l'appel, nous devons répondre à ces questions</div>
        {questions.map((q, i) => {
          const a = answers.get(q.id);
          const st = STATUS[a?.status ?? "à vérifier"];
          return (
            <section key={q.id} className="card p-4">
              <div className="flex items-start gap-3">
                <span className="num grid size-6 shrink-0 place-items-center rounded-full border border-line-strong text-[11px] font-semibold text-ink-2">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h4 className="text-[15px] font-semibold leading-snug" style={{ fontFamily: "var(--font-body)" }}>
                      {q.question}
                    </h4>
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-[5px] border px-1.5 py-px font-mono text-[10px] font-medium uppercase tracking-wide ${st.cls}`}>
                      <Icon name={st.icon} size={11} /> {st.text}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-ink-2">{a?.answer ?? "Pas de réponse générée."}</p>
                  <p className="mt-2 flex gap-1.5 text-xs text-muted">
                    <Icon name="info" size={13} className="mt-px shrink-0" />
                    <span>
                      <span className="font-semibold">Où vérifier : </span>
                      {a?.howToVerify || q.source}
                    </span>
                  </p>
                  <label className="mt-2.5 block">
                    <span className="sr-only">Vos notes pour la question {i + 1}</span>
                    <textarea
                      id={`rp-note-${q.id}`}
                      rows={notes[q.id] ? 2 : 1}
                      className="input resize-y !py-1.5 text-sm"
                      placeholder="Vos notes (ce que vous avez trouvé dans SFDC, sur le site…)"
                      value={notes[q.id] ?? ""}
                      onChange={(e) => onNote(q.id, e.target.value)}
                    />
                  </label>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* Colonne pitch / discovery */}
      <div className="min-w-0 space-y-4">
        <Section title="Stratégie à pitcher">
          <p className="text-sm leading-relaxed">{brief.pitchAngle}</p>
          <p className="mt-2 text-xs text-muted">{brief.priorityRationale}</p>
        </Section>
        <Section title="Hypothèses à confirmer" subtitle="Pendant la discovery">
          <ul className="space-y-2">
            {brief.hypotheses.map((h) => (
              <li key={h} className="flex gap-2 text-sm text-ink-2">
                <Icon name="target" size={14} className="mt-0.5 shrink-0 text-accent-ink" />
                {h}
              </li>
            ))}
          </ul>
        </Section>
        <Section title="Tailoring & next steps">
          <ul className="space-y-2">
            {brief.nextSteps.map((s) => (
              <li key={s} className="flex gap-2 text-sm text-ink-2">
                <Icon name="arrowRight" size={14} className="mt-0.5 shrink-0 text-accent-ink" />
                {s}
              </li>
            ))}
          </ul>
        </Section>
        <section className="card p-4">
          <div className="flex gap-2 text-sm">
            <Icon name="alert" size={15} className="mt-0.5 shrink-0 text-warning" />
            <span className="text-ink-2">
              <span className="font-semibold text-ink">Attention :</span> respecter l'équilibre entre prep et discovery. Ce qui n'est pas confirmé reste une hypothèse à valider avec le client.
            </span>
          </div>
          <div className="label mb-1.5 mt-3">Ressources pour la prep</div>
          <div className="flex flex-wrap gap-1.5">
            {PREP_RESOURCES.map((r) => (
              <span key={r} className="chip text-xs">{r}</span>
            ))}
          </div>
        </section>
      </div>

      <BusinessQuestions questions={business} clientType={clientType} tailored={tailored} notes={notes} onNote={onNote} />
    </div>
  );
}

function toMarkdown(name: string, type: ClientType, b: PrepBrief, business: PrepBrief["businessQuestions"], notes: Record<string, string>) {
  const answers = new Map(b.answers.map((a) => [a.id, a]));
  const lines = [
    `# Brief d'appel · ${name} (${CLIENT_TYPES.find((c) => c.id === type)?.label})`,
    "",
    `**Priorité :** ${PRIORITY[b.priority].text}. ${b.priorityRationale}`,
    "",
    "## Avant l'appel",
  ];
  PREP_QUESTIONS[type].forEach((q, i) => {
    const a = answers.get(q.id);
    lines.push(`${i + 1}. **${q.question}**`, `   ${a?.answer ?? ""} _(${a?.status ?? "à vérifier"})_`);
    if (a?.status !== "répondu") lines.push(`   Où vérifier : ${a?.howToVerify || q.source}`);
    if (notes[q.id]) lines.push(`   Notes : ${notes[q.id]}`);
  });
  lines.push("", "## Stratégie à pitcher", b.pitchAngle, "", "## Hypothèses à confirmer", ...b.hypotheses.map((h) => `- ${h}`));
  lines.push("", "## Questions business");
  business.forEach((q, i) => {
    const done = notes[askedKey(i)] === "1" ? "x" : " ";
    lines.push(`- [${done}] **${THEME_LABELS[type][q.theme]}** · ${q.question}`);
    if (notes[answerKey(i)]) lines.push(`  Réponse : ${notes[answerKey(i)]}`);
  });
  lines.push("", "## Tailoring & next steps", ...b.nextSteps.map((s) => `- ${s}`));
  return lines.join("\n");
}
