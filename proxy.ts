import { NextResponse } from "next/server";
import { auth } from "./lib/auth";

export const proxy = auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isPublicRoute =
    nextUrl.pathname === "/" ||
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/register");

  // Allow API auth routes
  if (isApiAuthRoute) return NextResponse.next();

  // Redirect logged-in users away from public auth pages
  if (isPublicRoute && isLoggedIn) {
    if (role === "TEACHER") {
      return NextResponse.redirect(new URL("/teacher/dashboard", nextUrl));
    }
    if (role === "STUDENT") {
      return NextResponse.redirect(new URL("/student/dashboard", nextUrl));
    }
    return NextResponse.next();
  }

  // Protect teacher routes
  if (nextUrl.pathname.startsWith("/teacher")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/", nextUrl));
    if (role !== "TEACHER") {
      return NextResponse.redirect(new URL("/student/dashboard", nextUrl));
    }
  }

  // Protect student routes
  if (nextUrl.pathname.startsWith("/student")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/", nextUrl));
    if (role !== "STUDENT") {
      return NextResponse.redirect(new URL("/teacher/dashboard", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
