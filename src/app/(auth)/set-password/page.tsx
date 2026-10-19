import { ActionForm, SubmitButton } from "@/components/action-form";
import { Field, Input } from "@/components/ui";
import { setPassword } from "../actions";

export const metadata = { title: "Choose a password" };

export default function SetPasswordPage() {
  return (
    <>
      <h1 className="mb-2 text-lg font-semibold text-slate-900">Choose a password</h1>
      <p className="mb-4 text-sm text-slate-600">
        At least 12 characters. A short sentence you can remember works well.
      </p>
      <ActionForm action={setPassword} className="space-y-4">
        <Field label="New password">
          <Input name="password" type="password" autoComplete="new-password" minLength={12} required autoFocus />
        </Field>
        <Field label="Confirm password">
          <Input name="confirm" type="password" autoComplete="new-password" minLength={12} required />
        </Field>
        <SubmitButton className="w-full">Save password</SubmitButton>
      </ActionForm>
    </>
  );
}
