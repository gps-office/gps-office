"use client";

import { createContext, startTransition, useActionState, useContext, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { cx, buttonClass } from "@/components/ui";

export type FormResult = { ok: true; message?: string } | { ok: false; error: string } | null;

const PendingContext = createContext(false);

/**
 * A form bound to a server action returning { ok, error | message }.
 * Shows the outcome inline. Fields keep their values after submitting
 * (React would otherwise clear them), unless resetOnSuccess is set.
 */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess = false,
  onSuccess,
}: {
  action: (prev: FormResult, formData: FormData) => Promise<FormResult>;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      if (resetOnSuccess) ref.current?.reset();
      onSuccess?.();
    }
  }, [state, resetOnSuccess, onSuccess]);

  return (
    <form
      ref={ref}
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
        startTransition(() => formAction(formData));
      }}
    >
      <PendingContext value={pending}>{children}</PendingContext>
      {state && !state.ok && (
        <p role="alert" className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state?.ok && state.message && (
        <p role="status" className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.message}
        </p>
      )}
    </form>
  );
}

export function SubmitButton({
  children,
  variant = "primary",
  size = "md",
  className,
  pendingText,
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
  className?: string;
  pendingText?: string;
}) {
  const formPending = useContext(PendingContext);
  const { pending: statusPending } = useFormStatus();
  const pending = formPending || statusPending;
  return (
    <button type="submit" disabled={pending} className={cx(buttonClass(variant, size), className)}>
      {pending ? (pendingText ?? "Saving…") : children}
    </button>
  );
}
