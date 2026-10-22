import { Suspense } from "react";
import { EmailLinkHandler } from "./handler";

export const metadata = { title: "Signing in" };

// Landing page for Supabase's standard email links (invitation, password
// reset). Those put the session in the URL fragment, which only the browser
// can read; /auth/confirm handles the custom-template (token_hash) links.
export default function AuthCallbackPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-900 px-4 text-white">
      <Suspense>
        <EmailLinkHandler />
      </Suspense>
    </main>
  );
}
