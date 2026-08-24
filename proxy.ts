import NextAuth from "next-auth";
import authConfig from "./auth.config";
import {
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
} from "@/routes";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isCoursePublicRoute =
    /^\/courses\/[^/]+$/.test(nextUrl.pathname) ||
    /^\/courses\/[^/]+\/watch\/[^/]+$/.test(nextUrl.pathname);
  const isProjectPublicRoute = /^\/projects\/[^/]+$/.test(nextUrl.pathname);
  const isCohortPublicRoute = /^\/cohorts\/[^/]+$/.test(nextUrl.pathname);
  const isShowcasePublicRoute = /^\/showcase\/[^/]+$/.test(nextUrl.pathname);
  const isCredentialPublicRoute = /^\/credentials\/[^/]+$/.test(nextUrl.pathname);
  const isInstructorPublicRoute = /^\/instructor\/[^/]+$/.test(nextUrl.pathname);
  const isPublicRoute =
    publicRoutes.includes(nextUrl.pathname) ||
    isCoursePublicRoute ||
    isCohortPublicRoute ||
    isShowcasePublicRoute ||
    isCredentialPublicRoute ||
    isProjectPublicRoute ||
    isInstructorPublicRoute;
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);
  const isInviteRoute = nextUrl.pathname.startsWith("/invite/");

  if (isApiAuthRoute) return;

  // Webhooks from third-party services are unauthenticated by design (they carry their own signatures)
  if (nextUrl.pathname.startsWith("/api/webhooks/")) return;
  if (nextUrl.pathname.startsWith("/api/cron/")) return;

  // Invite links are public — anyone can view them
  if (isInviteRoute) return;

  if (isAuthRoute) {
    return;
  }

  if (!isLoggedIn && nextUrl.pathname.startsWith("/api/")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isLoggedIn && !isPublicRoute) {
    return Response.redirect(new URL("/signin", nextUrl));
  }

  return;
});

// Avoid invoking Proxy for static assets and Auth.js internals.
export const config = {
  matcher: ["/((?!api/auth|.+\\.[\\w]+$|_next).*)", "/"],
};
