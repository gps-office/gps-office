import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Field, Input } from "@/components/ui";
import { requestPasswordReset } from "../actions";

export const metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="mb-2 text-lg font-semibold text-slate-900">Reset your password</h1>
      <p className="mb-4 text-sm text-slate-600">We will email you a link to choose a new password.</p>
      <ActionForm action={requestPasswordReset} className="space-y-4">
        <Field label="Email">
          <Input name="email" type="email" autoComplete="username" required autoFocus />
        </Field>
        <SubmitButton className="w-full" pendingText="Sending…">
          Send reset link
        </SubmitButton>
      </ActionForm>
      <p className="mt-4 text-center text-sm">
        <Link href="/login" className="text-brand-600 hover:underline">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
