import { NextResponse } from "next/server";

// Route Classifications
export const PUBLIC_ROUTES = ["/login", "/join-us", "/"];
export const PROTECTED_ROUTES = ["/member/:path*"];
export const ADMIN_ROUTES = ["/dashboard/:path*"];

// Future extension hooks (Pass-through placeholders)
async function checkAuthentication(context) {
  // TODO: Implement JWT / Session verification in future phases
  return { success: true };
}

async function checkRole(context) {
  // TODO: Implement role-based authorization check in future phases
  return { success: true };
}

async function checkRateLimit(context) {
  // TODO: Implement rate limiting verification in future phases
  return { success: true };
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const timestamp = new Date().toISOString();
  const method = request.method;
  const userAgent = request.headers.get("user-agent") || "unknown";
  const ipAddress =
    request.ip ||
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  // Determine route category
  let routeCategory = "UNKNOWN";
  if (pathname.startsWith("/dashboard")) {
    routeCategory = "ADMIN";
  } else if (pathname.startsWith("/member")) {
    routeCategory = "PROTECTED";
  } else if (PUBLIC_ROUTES.includes(pathname)) {
    routeCategory = "PUBLIC";
  }

  // Build the context object
  const context = {
    pathname,
    timestamp,
    method,
    userAgent,
    ipAddress,
    routeCategory,
  };

  // Development diagnostics logging
  if (process.env.NODE_ENV !== "production") {
    console.log(`[Middleware] Route: ${pathname} Category: ${routeCategory}`);
  }

  // Invoke future extension hooks as pass-through structures
  await checkRateLimit(context);
  await checkAuthentication(context);
  await checkRole(context);

  // Continue to the requested route (non-blocking pass-through)
  return NextResponse.next();
}

// Configure middleware matcher to only execute on targeted routes
export const config = {
  matcher: ["/dashboard/:path*", "/member/:path*"],
};
