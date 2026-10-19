import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";

// Pages reachable without signing in.
const PUBLIC_PATHS = ["/login", "/forgot-password", "/auth/confirm"];
// Signed in, password only (2FA not yet set up).
const ENROL_PATHS = ["/mfa/enroll", "/set-password", "/inactive", "/auth/confirm"];
// Signed in, 2FA set up but not yet entered this session (exact paths).
const VERIFY_PATHS = ["/mfa", "/inactive", "/auth/confirm"];

function matches(pathname: string, paths: string[]) {
  return paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

// Refreshes the Supabase session cookie and routes each request to the right
// step: login → (set password) → 2FA set-up or 2FA code → the office.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Do not run code between createServerClient and getClaims().
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const { pathname } = request.nextUrl;

  const redirectTo = (path: string, keepNext = false) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = "";
    if (keepNext && pathname !== "/") url.searchParams.set("next", pathname);
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  };

  if (!claims) {
    return matches(pathname, PUBLIC_PATHS) ? response : redirectTo("/login");
  }

  if (claims.aal !== "aal2") {
    // nextLevel only decides which 2FA screen to show. Access itself depends
    // on the verified aal claim above, and again on AAL2 in every RLS policy.
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.nextLevel === "aal2") {
      // Has 2FA set up: must enter a code before anything else.
      return VERIFY_PATHS.includes(pathname) ? response : redirectTo("/mfa", true);
    }
    // No 2FA yet: 2FA is mandatory, so set it up now.
    return matches(pathname, ENROL_PATHS) ? response : redirectTo("/mfa/enroll");
  }

  // Fully signed in: keep people out of the login screens.
  if (matches(pathname, ["/login", "/mfa"])) {
    return redirectTo("/");
  }

  return response;
}
