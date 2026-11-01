import { createServerClient } from "@supabase/ssr";
import { importSPKI, jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";

const GATE_COOKIE = "serein_gate";
const PUBLIC_PATHS = ["/", "/login", "/signup", "/verify-email", "/forgot-password", "/auth"];
const GATE_PATHS = ["/gate"];
const PRE_GATE_ONLY = ["/login", "/signup"];
// Everything behind the gate. Other addresses fall through, so a mistyped one reaches the
// not-found page instead of a login form. A new signed-in section must be listed here.
const APP_PATHS = ["/home", "/finance", "/planner", "/diet", "/diary", "/profile", "/admin", "/onboarding"];

const matches = (pathname: string, paths: string[]) =>
  paths.some((path) => (path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`)));

let publicKey: Promise<CryptoKey> | undefined;

function loadPublicKey() {
  publicKey ??= importSPKI(
    Buffer.from(process.env.GATE_PASS_PUBLIC_KEY!, "base64").toString("utf8"),
    "EdDSA",
  ) as Promise<CryptoKey>;
  return publicKey;
}

// The pass only counts for the exact Supabase session it was issued to.
async function hasValidPass(request: NextRequest, userId: string, sessionId: unknown) {
  const token = request.cookies.get(GATE_COOKIE)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, await loadPublicKey(), {
      issuer: "serein-backend",
      algorithms: ["EdDSA"],
    });
    return payload.sub === userId && payload.sid === sessionId;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // Also refreshes an expiring session, writing new cookies onto the response.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  const { pathname, search } = request.nextUrl;

  const redirect = (path: string) => {
    const target = NextResponse.redirect(new URL(path, request.url));
    response.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
    return target;
  };

  // Supabase falls back to the bare site address when a redirect is not on its allowed list.
  // The link is still good, so finish signing in rather than dropping it.
  const code = request.nextUrl.searchParams.get("code");
  if (pathname === "/" && code) {
    return redirect(`/auth/callback?code=${encodeURIComponent(code)}&next=/gate`);
  }

  if (!claims) {
    if (!matches(pathname, APP_PATHS) && !matches(pathname, GATE_PATHS)) return response;
    return redirect(`/login?next=${encodeURIComponent(pathname + search)}`);
  }

  const passed = await hasValidPass(request, claims.sub, claims.session_id);

  if (matches(pathname, PRE_GATE_ONLY)) return redirect(passed ? "/home" : "/gate");
  if (matches(pathname, PUBLIC_PATHS)) return response;
  if (matches(pathname, GATE_PATHS)) {
    return passed && pathname === "/gate" ? redirect("/home") : response;
  }
  if (!matches(pathname, APP_PATHS)) return response;
  if (!passed) return redirect(`/gate?next=${encodeURIComponent(pathname + search)}`);

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|api/backend|icon.svg|.*\\.(?:png|jpg|svg|webp|ico)$).*)"],
};
