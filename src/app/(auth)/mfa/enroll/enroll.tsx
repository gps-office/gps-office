"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";
import { CodeInput } from "../code-input";
import { signOut } from "../../actions";

type Enrolment = { factorId: string; qr: string; secret: string };

export function MfaEnroll() {
  const [enrolment, setEnrolment] = useState<Enrolment | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      const supabase = createClient();
      // Clear any half-finished set-up from an earlier visit.
      const { data: factors } = await supabase.auth.mfa.listFactors();
      for (const f of factors?.all ?? []) {
        if (f.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `GPS Office ${new Date().toISOString()} ${Math.random().toString(36).slice(2, 6)}`,
        issuer: "GPS Office",
      });
      if (error || !data) {
        // Supabase's reason (e.g. "mfa_totp_enroll_not_enabled") has no personal data.
        const reason = error ? ` (${error.code ?? error.name}: ${error.message})` : "";
        setError(`Two-factor set-up could not start. Refresh the page to try again.${reason}`);
        return;
      }
      setEnrolment({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    })();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!enrolment) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: enrolment.factorId, code });
    if (error) {
      setBusy(false);
      setCode("");
      setError("That code is not right. Try the newest code from the app.");
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <>
      <h1 className="mb-2 text-lg font-semibold text-slate-900">Set up two-factor authentication</h1>
      <p className="mb-4 text-sm text-slate-600">
        GPS Office handles passport and immigration data, so every account needs a second step at sign-in.
      </p>
      <ol className="mb-4 list-decimal space-y-1 pl-5 text-sm text-slate-700">
        <li>Install an authenticator app (Google Authenticator, Microsoft Authenticator or 1Password).</li>
        <li>Scan this QR code with the app.</li>
        <li>Enter the 6-digit code it shows.</li>
      </ol>
      {enrolment ? (
        <div className="mb-4 flex flex-col items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- data URI from Supabase */}
          <img src={enrolment.qr} alt="QR code for your authenticator app" className="size-44 rounded border border-slate-200" />
          <details className="w-full text-xs text-slate-500">
            <summary className="cursor-pointer">Can’t scan? Enter this key instead</summary>
            <code className="mt-1 block rounded bg-slate-100 p-2 font-mono break-all text-slate-800">{enrolment.secret}</code>
          </details>
        </div>
      ) : (
        !error && <div className="mb-4 h-44 animate-pulse rounded bg-slate-100" />
      )}
      <form onSubmit={submit} className="space-y-4">
        <CodeInput value={code} onChange={setCode} />
        {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy || !enrolment || code.length !== 6}>
          {busy ? "Checking…" : "Turn on two-factor"}
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
