import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PREFIXES = ["/login", "/api/auth"];

// Auth POST rate limit — process-local, per IP. Doesn't cover a multi-instance
// scaled deploy (Vercel Fluid Compute can spin many concurrent instances), but
// it's a real speed bump for opportunistic brute-force against one instance.
// For hard guarantees, add Vercel Firewall rules or a Redis-backed limiter.
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_HITS = 12;
const bucket = new Map<string, { hits: number; resetAt: number }>();

function ipOf(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "anonymous";
}

function checkAuthRateLimit(req: NextRequest): NextResponse | null {
  const isAuthPost =
    req.method === "POST" && req.nextUrl.pathname.startsWith("/api/auth/");
  if (!isAuthPost) return null;

  const key = `${ipOf(req)}::${req.nextUrl.pathname}`;
  const now = Date.now();
  const entry = bucket.get(key);
  if (!entry || entry.resetAt < now) {
    bucket.set(key, { hits: 1, resetAt: now + RATE_WINDOW_MS });
    return null;
  }
  entry.hits += 1;
  if (entry.hits > RATE_MAX_HITS) {
    const retryIn = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    return new NextResponse("Too many attempts. Please wait and try again.", {
      status: 429,
      headers: { "Retry-After": String(retryIn) },
    });
  }
  return null;
}

// Lightweight proxy: only redirects unauthenticated navigations to /login.
// Does NOT call `auth()` — that would parse the session on every request and
// interfere with Server Action request bodies. Real auth is enforced by
// requireSession() inside each protected route/layout.
export default function proxy(req: NextRequest) {
  const rate = checkAuthRateLimit(req);
  if (rate) return rate;

  const { pathname } = req.nextUrl;

  if (PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  // Session cookie name for NextAuth v5 defaults.
  const cookieName = req.nextUrl.protocol === "https:"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";
  const hasSession = req.cookies.has(cookieName);

  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
