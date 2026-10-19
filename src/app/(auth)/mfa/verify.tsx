"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";
import { CodeInput } from "./code-input";
import { signOut } from "../actions";

function safeNext(next: string) {
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/";
}

export function MfaVerify({ next }: { next: string }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
    const factor = factors?.totp.find((f) => f.status === "verified");
    if (listError || !factor) {
      setBusy(false);
      setError("Two-factor authentication is not set up for this account. Contact the office manager.");
      return;
    }
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
    if (error) {
      setBusy(false);
      setCode("");
      setError("That code is not right. Check the time on your phone and try the newest code.");
      return;
    }
    router.replace(safeNext(next));
    router.refresh();
  }

  return (
    <>
      <h1 className="mb-2 text-lg font-semibold text-slate-900">Enter your 6-digit code</h1>
      <p className="mb-4 text-sm text-slate-600">Open your authenticator app and enter the code for GPS Office.</p>
      <form onSubmit={submit} className="space-y-4">
        <CodeInput value={code} onChange={setCode} />
        {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy || code.length !== 6}>
          {busy ? "Checking…" : "Verify"}
        </Button>
      </form>
      <form action={signOut} className="mt-3">
        <Button variant="ghost" className="w-full">
          Sign out
        </Button>
      </form>
    </>
  );
}
