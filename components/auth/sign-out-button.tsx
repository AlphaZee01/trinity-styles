"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "cn";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton({ className, onDone }: { className?: string; onDone?: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setOpen(false);
      onDone?.();
      router.push("/");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not sign out");
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn("press flex h-11 items-center text-sm", className)}
      >
        Sign out
      </button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next && !pending) setOpen(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign out?</DialogTitle>
            <DialogDescription>You can sign back in anytime. Your bag stays on this device.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="press h-11 rounded-full border border-foreground px-4 text-sm disabled:opacity-50"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="press h-11 rounded-full bg-destructive px-4 text-sm text-white disabled:opacity-50"
              disabled={pending}
              onClick={() => void signOut()}
            >
              {pending ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
