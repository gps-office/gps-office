import Link from "next/link";
import { getCase } from "@/lib/queries";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui";
import { DueDate, LevelBadge, PriorityBadge, StageBadge } from "@/components/badges";
import { CaseTabs } from "./tabs";

export default async function CaseLayout({ children, params }: LayoutProps<"/cases/[id]">) {
  const { id } = await params;
  const c = await getCase(id);

  return (
    <>
      <div className="mb-4">
        <Link href="/cases" className="text-sm text-slate-500 hover:text-slate-800">
          ← Cases
        </Link>
      </div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-mono text-xl font-semibold text-slate-900">{c.reference}</h1>
            <StageBadge stage={c.stage} />
            <PriorityBadge priority={c.priority} />
            <LevelBadge level={c.service_level} />
            {c.cipo_complete ? <Badge tone="green">CIPO complete</Badge> : <Badge tone="purple">CIPO open</Badge>}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
            <Link href={`/clients/${c.client_id}`} className="font-medium text-brand-700 hover:underline" dir="auto">
              {c.client?.full_name}
            </Link>
            {c.client?.hebrew_name && <span dir="rtl">{c.client.hebrew_name}</span>}
            <span>· {c.service?.name}</span>
            {c.title && <span>· {c.title}</span>}
          </div>
        </div>
        <dl className="grid grid-cols-3 gap-x-6 gap-y-1 text-sm">
          <dt className="text-slate-500">Assigned</dt>
          <dt className="text-slate-500">Deadline</dt>
          <dt className="text-slate-500">Opened</dt>
          <dd>{c.assigned?.full_name ?? <span className="text-amber-700">Unassigned</span>}</dd>
          <dd>
            <DueDate date={c.deadline} closed={c.stage === "closed"} />
          </dd>
          <dd>{formatDate(c.opened_at)}</dd>
        </dl>
      </div>
      <CaseTabs id={c.id} />
      <div className="mt-6">{children}</div>
    </>
  );
}
