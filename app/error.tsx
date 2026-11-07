"use client";

import { ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4">
      <ErrorState message={error.message || "The page could not finish loading."} />
      <Button className="mt-6 self-center" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
