import Link from "next/link";
import { EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4">
      <EmptyState
        title="That page is not here"
        description="The collection moved, or the link is longer than Supercalifragilistic-fashion-archive-lookup."
      />
      <Button className="mt-6 self-center" nativeButton={false} render={<Link href="/" />}>
        Back to the shop
      </Button>
    </div>
  );
}
