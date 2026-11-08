"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        try {
          const formData = new FormData(event.currentTarget);
          const password = String(formData.get("password"));
          const supabase = createClient();
          const { error } = await supabase.auth.updateUser({ password });
          if (error) throw error;
          toast.success("Password updated", { description: "You can sign in with your new password." });
          router.push("/account");
          router.refresh();
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Could not update password.");
        } finally {
          setPending(false);
        }
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input id="password" name="password" type="password" required minLength={6} className="h-11 text-base" />
      </div>
      <Button type="submit" className="cta-premium h-12 w-full rounded-full" disabled={pending}>
        {pending ? "Saving…" : "Save password"}
      </Button>
    </form>
  );
}
