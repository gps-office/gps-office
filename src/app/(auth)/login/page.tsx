import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Field, Input } from "@/components/ui";
import { signIn } from "../actions";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  return (
    <>
      <h1 className="mb-4 text-lg font-semibold text-slate-900">Staff sign in</h1>
      {error === "link" && (
        <p className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          That link has expired or was already used. Sign in, or ask the office manager for a new invitation.
        </p>
      )}
      <ActionForm action={signIn} className="space-y-4">
        <Field label="Email">
          <Input name="email" type="email" autoComplete="username" required autoFocus />
        </Field>
        <Field label="Password">
          <Input name="password" type="password" autoComplete="current-password" required />
        </Field>
        <SubmitButton className="w-full" pendingText="Signing in…">
          Sign in
        </SubmitButton>
      </ActionForm>
      <p className="mt-4 text-center text-sm">
        <Link href="/forgot-password" className="text-brand-600 hover:underline">
          Forgotten your password?
        </Link>
      </p>
    </>
  );
}
