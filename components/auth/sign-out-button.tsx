"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "cn";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton({ className, onDone }: { className?: string; onDone?: () => void }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      onDone?.();
      router.push("/");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not sign out");
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={cn("press flex h-11 items-center text-sm disabled:opacity-50", className)}
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
