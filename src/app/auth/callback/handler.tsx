"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/set-password";
}

export function EmailLinkHandler() {
  const router = useRouter();
  const params = useSearchParams();
  const [failed, setFailed] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const hash = new URLSearchParams(window.location.hash.slice(1));
    // Remove the tokens from the address bar and history straight away.
    window.history.replaceState(null, "", window.location.pathname + window.location.search);

    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");
    (async () => {
      if (!accessToken || !refreshToken) return setFailed(true);
      const { error } = await createClient().auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      if (error) return setFailed(true);
      router.replace(safeNext(params.get("next")));
      router.refresh();
    })();
  }, [params, router]);

  if (failed) {
    return (
      <div className="max-w-sm text-center">
        <p className="mb-4">That link has expired or was already used.</p>
        <a href="/login?error=link" className="underline">
          Go to sign in
        </a>
      </div>
    );
  }
  return <p>Signing you in…</p>;
}
