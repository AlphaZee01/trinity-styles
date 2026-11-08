import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/safe-next";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const { supabaseResponse, claims } = await updateSession(request);
  const path = request.nextUrl.pathname;
  const code = request.nextUrl.searchParams.get("code");
  if (code && path !== "/auth/callback") {
    const callback = new URL("/auth/callback", request.url);
    callback.searchParams.set("code", code);
    const destination = safeNext(request.nextUrl.searchParams.get("next"));
    callback.searchParams.set("next", destination);
    const redirectResponse = NextResponse.redirect(callback);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }
  const userId = (claims?.sub as string | undefined) ?? null;
  const role = (claims?.app_metadata as { role?: string } | undefined)?.role;

  if (path.startsWith("/account") || path.startsWith("/checkout")) {
    if (!userId) {
      const login = new URL("/login", request.url);
      login.searchParams.set("next", path);
      const redirectResponse = NextResponse.redirect(login);
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie);
      });
      return redirectResponse;
    }
  }

  if (path.startsWith("/admin")) {
    const supabaseReady = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
    if (supabaseReady && role !== "admin") {
      const target = userId ? new URL("/", request.url) : new URL("/login", request.url);
      if (!userId) target.searchParams.set("next", path);
      const redirectResponse = NextResponse.redirect(target);
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie);
      });
      return redirectResponse;
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
