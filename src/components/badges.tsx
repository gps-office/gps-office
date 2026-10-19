import { Badge, type Tone } from "@/components/ui";
import { STAGE_SHORT, labelOf, PRIORITIES, SERVICE_LEVELS, type Stage } from "@/lib/constants";
import { daysUntil, formatDate } from "@/lib/format";

const STAGE_TONE: Record<Stage, Tone> = {
  new_enquiry: "slate",
  cipo_intake: "purple",
  documents_outstanding: "amber",
  application_preparation: "blue",
  submitted: "blue",
  approved: "green",
  closed: "slate",
};

export function StageBadge({ stage }: { stage: Stage }) {
  return <Badge tone={STAGE_TONE[stage]}>{STAGE_SHORT[stage]}</Badge>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  if (priority === "normal") return null;
  const tone: Tone = priority === "urgent" ? "red" : priority === "high" ? "amber" : "slate";
  return <Badge tone={tone}>{labelOf(PRIORITIES, priority)}</Badge>;
}

export function LevelBadge({ level }: { level: string }) {
  if (level === "standard") return null;
  return <Badge tone={level === "urgent" ? "red" : "purple"}>{labelOf(SERVICE_LEVELS, level)}</Badge>;
}

/** Shows an expiry date, flagged when expired or within warnDays. */
export function ExpiryBadge({ date, warnDays = 180 }: { date: string | null | undefined; warnDays?: number }) {
  const d = daysUntil(date);
  if (d === null) return <span className="text-slate-400">—</span>;
  if (d < 0) return <Badge tone="red">Expired {formatDate(date)}</Badge>;
  if (d <= warnDays) return <Badge tone="amber">Expires {formatDate(date)}</Badge>;
  return <span>{formatDate(date)}</span>;
}

/** A deadline or due date with overdue / soon colouring. */
export function DueDate({ date, closed = false }: { date: string | null | undefined; closed?: boolean }) {
  const d = daysUntil(date);
  if (d === null) return <span className="text-slate-400">—</span>;
  if (closed) return <span>{formatDate(date)}</span>;
  if (d < 0) return <span className="font-medium text-red-700">{formatDate(date)} · {-d}d overdue</span>;
  if (d === 0) return <span className="font-medium text-red-700">Today</span>;
  if (d <= 7) return <span className="font-medium text-amber-700">{formatDate(date)} · {d}d</span>;
  return <span>{formatDate(date)}</span>;
}
