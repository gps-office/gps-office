import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff } from "@/lib/auth";
import { FINANCE_TYPES, labelOf } from "@/lib/constants";
import { addDays, formatDate, formatMoney, todayLondon } from "@/lib/format";
import { Card, EmptyState, PageHeader, Stat, cx } from "@/components/ui";
import { StageBadge } from "@/components/badges";

export const metadata = { title: "Finance" };

const PERIODS = [
  { value: "30", label: "Last 30 days" },
  { value: "month", label: "This month" },
  { value: "90", label: "Last 90 days" },
  { value: "year", label: "This year" },
];

export default async function FinancePage({ searchParams }: PageProps<"/finance">) {
  await getCurrentStaff();
  const sp = await searchParams;
  const period = PERIODS.some((p) => p.value === sp.period) ? (sp.period as string) : "30";
  const today = todayLondon();
  const from =
    period === "month" ? `${today.slice(0, 7)}-01` : period === "year" ? `${today.slice(0, 4)}-01-01` : addDays(today, -Number(period));

  const supabase = await createClient();
  const [{ data: balances }, { data: received }] = await Promise.all([
    supabase.from("case_balances").select("*").neq("balance", 0).order("balance", { ascending: false }).limit(500),
    supabase
      .from("finance_lines")
      .select("id, line_type, amount, line_date, payment_method, description, case_id, case:cases!finance_lines_case_id_fkey(reference, client:clients!cases_client_id_fkey(full_name))")
      .in("line_type", ["deposit", "payment", "refund"])
      .gte("line_date", from)
      .order("line_date", { ascending: false })
      .limit(1000),
  ]);

  const ids = (balances ?? []).map((b) => b.case_id).filter((x): x is string => !!x);
  const { data: cases } = ids.length
    ? await supabase
        .from("cases")
        .select("id, reference, stage, client:clients!cases_client_id_fkey(full_name), assigned:staff!cases_assigned_to_fkey(full_name)")
        .in("id", ids)
    : { data: [] };
  const byId = Object.fromEntries((cases ?? []).map((c) => [c.id, c]));

  const owing = (balances ?? []).filter((b) => Number(b.balance) > 0);
  const credit = (balances ?? []).filter((b) => Number(b.balance) < 0);
  const totalOwed = owing.reduce((s, b) => s + Number(b.balance), 0);
  const totalIn = (received ?? []).reduce((s, l) => s + (l.line_type === "refund" ? -1 : 1) * Number(l.amount), 0);

  return (
    <>
      <PageHeader title="Finance" />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Outstanding balances" value={formatMoney(totalOwed)} tone={totalOwed > 0 ? "red" : undefined} />
        <Stat label="Cases owing" value={owing.length} />
        <Stat label={`Received · ${PERIODS.find((p) => p.value === period)!.label.toLowerCase()}`} value={formatMoney(totalIn)} />
        <Stat label="Cases in credit" value={credit.length} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Outstanding balances" padded={false}>
          {owing.length === 0 ? (
            <EmptyState>Nothing outstanding.</EmptyState>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-2">Case</th>
                  <th className="px-4 py-2">Client</th>
                  <th className="hidden px-4 py-2 sm:table-cell">Stage</th>
                  <th className="px-4 py-2 text-right">Charged</th>
                  <th className="px-4 py-2 text-right">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {owing.map((b) => {
                  const c = byId[b.case_id!];
                  return (
                    <tr key={b.case_id} className="hover:bg-slate-50">
                      <td className="px-4 py-2">
                        <Link href={`/cases/${b.case_id}/finance`} className="font-mono text-brand-700 hover:underline">
                          {c?.reference}
                        </Link>
                      </td>
                      <td className="px-4 py-2" dir="auto">
                        {c?.client?.full_name}
                      </td>
                      <td className="hidden px-4 py-2 sm:table-cell">{c && <StageBadge stage={c.stage} />}</td>
                      <td className="px-4 py-2 text-right text-slate-500 tabular-nums">{formatMoney(b.charged)}</td>
                      <td className="px-4 py-2 text-right font-medium text-red-700 tabular-nums">{formatMoney(b.balance)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>

        <Card
          title="Payments received"
          padded={false}
          actions={
            <div className="flex gap-1">
              {PERIODS.map((p) => (
                <Link
                  key={p.value}
                  href={`/finance?period=${p.value}`}
                  className={cx("rounded px-2 py-1 text-xs", p.value === period ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100")}
                >
                  {p.label}
                </Link>
              ))}
            </div>
          }
        >
          {!received?.length ? (
            <EmptyState>No payments in this period.</EmptyState>
          ) : (
            <ul className="divide-y divide-slate-100">
              {received.map((l) => (
                <li key={l.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-sm">
                  <span className="w-24 text-slate-500">{formatDate(l.line_date)}</span>
                  <Link href={`/cases/${l.case_id}/finance`} className="font-mono text-brand-700 hover:underline">
                    {l.case?.reference}
                  </Link>
                  <span dir="auto">{l.case?.client?.full_name}</span>
                  <span className="text-xs text-slate-500">
                    {labelOf(FINANCE_TYPES, l.line_type)}
                    {l.payment_method && ` · ${l.payment_method}`}
                  </span>
                  <span className={`ml-auto font-medium tabular-nums ${l.line_type === "refund" ? "text-red-700" : "text-emerald-700"}`}>
                    {l.line_type === "refund" ? "−" : "+"}
                    {formatMoney(l.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {credit.length > 0 && (
        <Card title="Cases in credit (refund due?)" className="mt-6" padded={false}>
          <ul className="divide-y divide-slate-100">
            {credit.map((b) => (
              <li key={b.case_id} className="flex items-center gap-3 px-4 py-2 text-sm">
                <Link href={`/cases/${b.case_id}/finance`} className="font-mono text-brand-700 hover:underline">
                  {byId[b.case_id!]?.reference}
                </Link>
                <span dir="auto">{byId[b.case_id!]?.client?.full_name}</span>
                <span className="ml-auto font-medium text-emerald-700 tabular-nums">{formatMoney(Math.abs(Number(b.balance)))}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
