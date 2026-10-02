import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoggedIn = request.cookies.get("bisa_logged_in")?.value === "true";

  // When opening root "/" for the first time or not logged in, redirect to "/login"
  if (pathname === "/" && !isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If already logged in and accessing "/login", redirect to home "/"
  if (pathname === "/login" && isLoggedIn) {
    const homeUrl = new URL("/", request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login"],
};
