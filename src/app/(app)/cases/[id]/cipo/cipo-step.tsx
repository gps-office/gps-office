"use client";

import { startTransition, useActionState, useOptimistic, useState } from "react";
import { setCipoStep } from "../../actions";
import type { FormResult } from "@/components/action-form";

export function CipoStep({
  caseId,
  step,
  label,
  checked,
  note,
  stamp,
  locked,
}: {
  caseId: string;
  step: number;
  label: string;
  checked: boolean;
  note: string;
  stamp: string | null;
  locked: boolean;
}) {
  const [state, action, pending] = useActionState<FormResult, FormData>(setCipoStep, null);
  const [optimistic, setOptimistic] = useOptimistic(checked);
  const [noteDraft, setNoteDraft] = useState(note);
  const [editingNote, setEditingNote] = useState(false);

  function submit(nextChecked: boolean, nextNote = noteDraft) {
    const fd = new FormData();
    fd.set("case_id", caseId);
    fd.set("step", String(step));
    fd.set("checked", nextChecked ? "on" : "");
    fd.set("note", nextNote);
    startTransition(() => {
      setOptimistic(nextChecked);
      action(fd);
    });
  }

  return (
    <li className="py-3">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={optimistic}
          disabled={pending || (locked && checked)}
          onChange={(e) => submit(e.target.checked)}
          className="mt-0.5 size-5 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          aria-label={`Step ${step}: ${label}`}
        />
        <div className="min-w-0 flex-1">
          <div className={`text-sm ${optimistic ? "text-slate-500" : "font-medium text-slate-900"}`}>
            <span className="mr-2 text-slate-400 tabular-nums">{step}.</span>
            {label}
          </div>
          {stamp && <div className="mt-0.5 text-xs text-emerald-700">✓ {stamp}</div>}
          {editingNote ? (
            <div className="mt-2 flex gap-2">
              <input
                dir="auto"
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                className="field"
                placeholder="Note for this step"
                aria-label="Note"
              />
              <button
                type="button"
                className="text-sm font-medium text-brand-700"
                onClick={() => {
                  setEditingNote(false);
                  submit(checked, noteDraft);
                }}
              >
                Save
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setEditingNote(true)} className="mt-1 text-left text-xs text-slate-500 hover:text-brand-700">
              {note ? <span dir="auto">Note: {note}</span> : "+ Add note"}
            </button>
          )}
          {state && !state.ok && <p className="mt-1 text-xs text-red-700">{state.error}</p>}
        </div>
      </div>
    </li>
  );
}
