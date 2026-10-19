import { createClient } from "@/lib/supabase/server";
import { getCase } from "@/lib/queries";
import { CIPO_STEPS, isPastCipo } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { Badge, Card } from "@/components/ui";
import { CipoStep } from "./cipo-step";

export const metadata = { title: "CIPO" };

export default async function CipoPage({ params }: PageProps<"/cases/[id]/cipo">) {
  const { id } = await params;
  const c = await getCase(id);
  const supabase = await createClient();
  const { data: checks } = await supabase
    .from("cipo_checks")
    .select("step, checked, checked_at, note, by:staff!cipo_checks_checked_by_fkey(full_name)")
    .eq("case_id", c.id)
    .order("step");
  const done = (checks ?? []).filter((k) => k.checked).length;
  const locked = isPastCipo(c.stage);

  return (
    <div className="mx-auto max-w-3xl">
      <Card
        title="CIPO – Case Intake, Preparation & Organisation"
        actions={c.cipo_complete ? <Badge tone="green">CIPO complete</Badge> : <Badge tone="purple">{done} of 9</Badge>}
      >
        <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${(done / 9) * 100}%` }} />
        </div>
        <ol className="divide-y divide-slate-100">
          {CIPO_STEPS.map((label, i) => {
            const check = checks?.find((k) => k.step === i + 1);
            return (
              <CipoStep
                key={i}
                caseId={c.id}
                step={i + 1}
                label={label}
                checked={check?.checked ?? false}
                note={check?.note ?? ""}
                stamp={check?.checked ? `${check.by?.full_name ?? "Unknown"} · ${formatDateTime(check.checked_at)}` : null}
                locked={locked}
              />
            );
          })}
        </ol>
        <p className="mt-4 text-xs text-slate-500">
          {locked
            ? "The case has moved past CIPO / Intake, so CIPO is locked."
            : c.cipo_complete
              ? "All steps done. You can now move the case on from the Overview tab."
              : "Tick each step as it is done. The case can move past CIPO / Intake once all nine are ticked."}
        </p>
      </Card>
    </div>
  );
}
