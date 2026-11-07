import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";

export async function updateSession(request: NextRequest) {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();

  let supabaseResponse = NextResponse.next({ request });

  if (!url || !key) {
    return { supabaseResponse, claims: null as Record<string, unknown> | null };
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
        if (headers) {
          Object.entries(headers).forEach(([headerKey, headerValue]) => {
            supabaseResponse.headers.set(headerKey, String(headerValue));
          });
        }
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  return { supabaseResponse, claims: data?.claims ?? null };
}
