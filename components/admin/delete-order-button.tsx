"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function DeleteOrderButton({ id, reference }: { id: string; reference: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function remove() {
    setPending(true);
    try {
      const response = await fetch(`/api/admin/orders/${id}`, { method: "DELETE" });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(json.error ?? "Could not delete order");
      setOpen(false);
      toast.success("Order deleted", { description: reference });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete order");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="press h-11 rounded-full border border-destructive px-4 text-sm text-destructive"
        onClick={() => setOpen(true)}
      >
        Delete
      </button>
      <Dialog open={open} onOpenChange={(next) => { if (!pending) setOpen(next); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this order?</DialogTitle>
            <DialogDescription>
              {reference} is removed from the list. If it already took stock, those pieces go back on the shelf. Mobile Money is not refunded.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={pending}
              className="press h-11 rounded-full border border-foreground px-4 text-sm disabled:opacity-50"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={pending}
              className="press h-11 rounded-full bg-destructive px-4 text-sm text-white disabled:opacity-50"
              onClick={() => void remove()}
            >
              {pending ? "Deleting…" : "Delete"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
