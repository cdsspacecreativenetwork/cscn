import NextAuth from "next-auth";
import authConfig from "./auth.config";
import {
  DEFAULT_LOGIN_REDIRECT,
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
  const isInstructorPublicRoute = /^\/instructor\/[^/]+$/.test(nextUrl.pathname);
  const isPublicRoute =
    publicRoutes.includes(nextUrl.pathname) ||
    isCoursePublicRoute ||
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
    if (isLoggedIn) {
      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
    return;
  }

  if (!isLoggedIn && !isPublicRoute) {
    return Response.redirect(new URL("/signin", nextUrl));
  }

  return;
});

// Optionally, don't invoke Middleware on some paths
export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
