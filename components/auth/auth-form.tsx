"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

function safeNext(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/account";
  return value;
}

export function AuthForm({ mode, next }: { mode: "login" | "register"; next?: string }) {
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    if (!isSupabaseConfigured()) {
      toast.error("Add Supabase keys to .env.local before signing in.");
      return;
    }
    setPending(true);
    try {
      const supabase = createClient();
      const email = String(formData.get("email"));
      const password = String(formData.get("password"));
      if (mode === "register") {
        const fullName = String(formData.get("full_name") ?? "");
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        if (!data.session) {
          const message = "Open the confirmation email. That link signs you in.";
          setNotice(`Account created. ${message}`);
          toast.info("Confirm your email", { description: message });
          return;
        }
        toast.success("Welcome to Trinity Styles", { description: "Your account is ready." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back", { description: "Taking you to your account." });
      }
      window.location.assign(safeNext(next));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Auth failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={onSubmit} className="space-y-4">
      {mode === "register" ? (
        <div className="space-y-2">
          <Label htmlFor="full_name">Name</Label>
          <Input id="full_name" name="full_name" required className="h-11 text-base" />
        </div>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required className="h-11 text-base" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required minLength={6} className="h-11 text-base" />
      </div>
      {notice ? <p className="text-sm text-muted-foreground">{notice}</p> : null}
      <Button type="submit" className="cta-premium h-12 w-full rounded-full" disabled={pending}>
        {pending ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
      </Button>
    </form>
  );
}
