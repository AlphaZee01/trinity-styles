"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        try {
          const formData = new FormData(event.currentTarget);
          const email = String(formData.get("email"));
          const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`;
          const supabase = createClient();
          const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
          if (error) throw error;
          setSent(true);
          toast.success("Check your email for a reset link.");
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Could not send reset email.");
        } finally {
          setPending(false);
        }
      }}
    >
      {sent ? (
        <p className="text-sm text-muted-foreground">If that email is registered, a reset link is on its way.</p>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required className="h-11 text-base" />
          </div>
          <Button type="submit" className="cta-premium h-12 w-full rounded-full" disabled={pending}>
            {pending ? "Sending…" : "Send reset link"}
          </Button>
        </>
      )}
    </form>
  );
}
