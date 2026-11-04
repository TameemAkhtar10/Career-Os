import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;
  const hasAuthCookies = Boolean(accessToken || refreshToken);

  const isCandidateRoute = pathname.startsWith("/candidate");
  const isRecruiterRoute = pathname.startsWith("/recruiter");

  if ((isCandidateRoute || isRecruiterRoute) && !hasAuthCookies) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/candidate/:path*",
    "/recruiter/:path*",
  ],
};

