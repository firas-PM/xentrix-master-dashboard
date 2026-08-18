import { auth } from "@/auth";
import { NextResponse } from "next/server";

const PUBLIC = new Set(["/login", "/api/auth"]);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic = [...PUBLIC].some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (isPublic) return NextResponse.next();
  if (!req.auth) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
});

export const config = {
  // Skip Next internals and static assets.
  matcher: ["/((?!_next|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
