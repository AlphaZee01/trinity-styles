import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/types";

const demoAdminProfile: Profile = {
  id: "00000000-0000-4000-8000-000000000001",
  full_name: "Demo Admin",
  phone: null,
  avatar_url: null,
  shipping_address: null,
  role: "admin",
  created_at: new Date().toISOString(),
};

export async function getAuthContext() {
  if (!isSupabaseConfigured()) {
    return {
      userId: null as string | null,
      role: null as UserRole | null,
      profile: null as Profile | null,
      email: null as string | null,
    };
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = (data?.claims?.sub as string | undefined) ?? null;
  const email = (data?.claims?.email as string | undefined) ?? null;
  if (!userId) {
    return { userId: null, role: null, profile: null, email: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  const jwtRole = (data?.claims?.app_metadata as { role?: UserRole } | undefined)?.role;
  const role = (profile?.role as UserRole | undefined) ?? jwtRole ?? "customer";

  return { userId, role, profile: profile as Profile | null, email };
}

export async function requireUser() {
  const ctx = await getAuthContext();
  if (!ctx.userId) redirect("/login");
  return ctx;
}

export async function requireAdmin() {
  if (!isSupabaseConfigured()) {
    if (process.env.NODE_ENV === "production") redirect("/login");
    return { userId: demoAdminProfile.id, role: "admin" as UserRole, profile: demoAdminProfile };
  }
  const ctx = await requireUser();
  if (ctx.role !== "admin") redirect("/");
  return ctx;
}
