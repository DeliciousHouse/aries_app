import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

type AuthRequest = {
  auth?: unknown;
  nextUrl: URL & { pathname: string; search: string };
  url: string;
};

export default auth((request: AuthRequest) => {
  const { pathname, search } = request.nextUrl;
  const isAuthed = Boolean(request.auth);

  const isAuthApi = pathname.startsWith("/api/auth");
  const isOAuthCallback = pathname === "/api/platforms/onboarding/meta/callback";
  const isPublicPage = pathname === "/login";
  const isPublicAsset =
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/brand/") ||
    pathname === "/favicon.ico" ||
    pathname === "/manifest.json";

  if (isAuthApi || isOAuthCallback || isPublicAsset) {
    return NextResponse.next();
  }

  if (isPublicPage) {
    if (isAuthed) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!isAuthed) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)"],
};
