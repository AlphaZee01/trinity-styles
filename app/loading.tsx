import { HomeSkeleton } from "@/components/states/page-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex h-16 items-center justify-between px-4">
        <Skeleton className="h-8 w-40 rounded-full" />
        <div className="flex gap-2">
          <Skeleton className="size-11 rounded-full" />
          <Skeleton className="size-11 rounded-full" />
          <Skeleton className="size-11 rounded-full" />
        </div>
      </div>
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-4">
        <HomeSkeleton />
      </div>
    </div>
  );
}
