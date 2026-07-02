import { buildDashboardUrl } from "@afterservice/utils";
import { type NextRequest, NextResponse } from "next/server";

const REDIRECT_MAP: Record<string, string> = {
  "/login": "/sign-in",
  "/sign-in": "/sign-in",
  "/signup": "/sign-up",
  "/sign-up": "/sign-up",
};

export const config = {
  matcher: ["/((?!_next/|__nextjs|_vercel|[\\w-]+\\.\\w+).*)"],
};

export default async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const dashboardPath = REDIRECT_MAP[pathname];

  if (dashboardPath) {
    const dashboardUrl = buildDashboardUrl({
      currentUrl: request.url,
      path: `${dashboardPath}${search}`,
    });

    return NextResponse.redirect(dashboardUrl);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
