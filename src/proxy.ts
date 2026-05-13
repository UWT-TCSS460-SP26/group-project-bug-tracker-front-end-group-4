import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard", "/issue"];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function proxy(request: NextRequest): NextResponse | undefined {
  const { pathname } = request.nextUrl;

  // Public routes — pass through
  if (pathname === "/" || pathname.startsWith("/api/auth")) {
    return undefined;
  }

  if (isProtected(pathname)) {
    // Defer the actual token check to the server component.
    // The proxy runs at the Edge; getToken needs the secret which
    // may not be available at the edge. We let the page's server
    // component verify the session and redirect if needed.
    return undefined;
  }

  return undefined;
}
