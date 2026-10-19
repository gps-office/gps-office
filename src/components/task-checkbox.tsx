"use client";

import { startTransition, useActionState, useOptimistic } from "react";
import { setTaskDone } from "@/app/(app)/tasks/actions";
import type { FormResult } from "@/components/action-form";

export function TaskCheckbox({ id, done, label }: { id: string; done: boolean; label: string }) {
  const [state, action, pending] = useActionState<FormResult, FormData>(setTaskDone, null);
  const [checked, setChecked] = useOptimistic(done);
  return (
    <span className="pt-0.5">
      <input
        type="checkbox"
        checked={checked}
        disabled={pending}
        aria-label={`Done: ${label}`}
        onChange={(e) => {
          const fd = new FormData();
          fd.set("id", id);
          fd.set("done", e.target.checked ? "on" : "");
          startTransition(() => {
            setChecked(e.target.checked);
            action(fd);
          });
        }}
        className="size-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
      />
      {state && !state.ok && <span className="sr-only">{state.error}</span>}
    </span>
  );
}
