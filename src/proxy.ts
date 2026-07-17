import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Protected API paths that return 401 (not redirect) when unauthenticated
const PROTECTED_API = [
  "/api/profile",
  "/api/listings",
  "/api/match",
  "/api/applications",
  "/api/resume-parse",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /api/auth/* and / are public — let through immediately
  if (pathname.startsWith("/api/auth") || pathname === "/") {
    return NextResponse.next();
  }

  const token = await getToken({ req: request });

  // Page routes: no session → redirect to sign-in
  if (pathname.startsWith("/student/") || pathname.startsWith("/recruiter/")) {
    if (!token) {
      return NextResponse.redirect(new URL("/api/auth/signin", request.url));
    }
    return NextResponse.next();
  }

  // Protected API routes: no session → 401
  if (PROTECTED_API.some((p) => pathname.startsWith(p))) {
    if (!token) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/student/:path*",
    "/recruiter/:path*",
    "/api/profile",
    "/api/listings",
    "/api/match",
    "/api/applications",
    "/api/resume-parse",
  ],
};
