"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export type TryOnHistoryRow = {
  id: string;
  productName: string | null;
  status: string;
  when: string;
  personImage: string | null;
  resultImage: string | null;
};

type Shot = { src: string; label: string; alt: string };

export function TryOnHistory({ sessions }: { sessions: TryOnHistoryRow[] }) {
  const [shot, setShot] = useState<Shot | null>(null);

  return (
    <>
      <ul className="space-y-3">
        {sessions.map((session) => (
          <li key={session.id} className="glass flex flex-wrap items-center gap-4 rounded-2xl p-4">
            <div className="flex gap-3">
              {session.personImage ? (
                <button
                  type="button"
                  className="press block text-left"
                  onClick={() =>
                    setShot({
                      src: session.personImage!,
                      label: "Photo",
                      alt: `${session.productName || "Try-on"} photo`,
                    })
                  }
                >
                  <img src={session.personImage} alt="" className="h-32 w-24 rounded-xl object-cover" />
                  <span className="mt-1 block text-[10px] tracking-[0.14em] text-muted-foreground uppercase">Photo</span>
                </button>
              ) : null}
              {session.resultImage ? (
                <button
                  type="button"
                  className="press block text-left"
                  onClick={() =>
                    setShot({
                      src: session.resultImage!,
                      label: "Result",
                      alt: `${session.productName || "Try-on"} result`,
                    })
                  }
                >
                  <img src={session.resultImage} alt="" className="h-32 w-24 rounded-xl object-cover" />
                  <span className="mt-1 block text-[10px] tracking-[0.14em] text-muted-foreground uppercase">Result</span>
                </button>
              ) : null}
            </div>
            <div className="min-w-0">
              <p className="font-medium break-words">{session.productName || "Try-on"}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {session.status} · {session.when}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <Dialog open={shot !== null} onOpenChange={(open) => { if (!open) setShot(null); }}>
        <DialogContent className="max-h-[min(90vh,52rem)] overflow-y-auto sm:max-w-lg">
          <DialogTitle className="pr-8">{shot?.label}</DialogTitle>
          <DialogDescription className="sr-only">{shot?.alt}</DialogDescription>
          {shot ? (
            <img src={shot.src} alt={shot.alt} className="max-h-[70vh] w-full rounded-xl object-contain" />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
