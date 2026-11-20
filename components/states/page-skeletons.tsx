import { ViewTransition } from "react";
import { Skeleton } from "@/components/ui/skeleton";

function blocks(count: number, className: string) {
  return Array.from({ length: count }, (_, index) => <Skeleton key={index} className={className} />);
}

export function HomeSkeleton() {
  return (
    <div className="space-y-10">
      <Skeleton className="h-[46svh] min-h-72 rounded-3xl sm:h-[52svh]" />
      <div className="flex gap-3 overflow-hidden">
        {blocks(5, "h-36 w-40 shrink-0 rounded-2xl")}
      </div>
      <div className="space-y-4">
        <Skeleton className="h-8 w-36" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">{blocks(4, "aspect-[3/4] rounded-2xl")}</div>
      </div>
    </div>
  );
}

export function CatalogSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-32" />
      <div className="flex gap-2 overflow-hidden">{blocks(5, "h-11 w-24 shrink-0 rounded-full")}</div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{blocks(4, "h-11 rounded-xl")}</div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">{blocks(6, "aspect-[3/4] rounded-2xl")}</div>
    </div>
  );
}

export function ProductSkeleton({ transitionName }: { transitionName?: string }) {
  return (
    <div className="mx-auto max-w-md space-y-5">
      <ViewTransition name={transitionName} share="morph" exit="morph" enter="morph" update="none">
        <Skeleton
          className="aspect-[3/4] w-full rounded-3xl"
          style={transitionName ? { viewTransitionName: transitionName, viewTransitionClass: "morph" } : undefined}
        />
      </ViewTransition>
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="h-6 w-24" />
      <div className="flex gap-2">{blocks(3, "h-11 w-14 rounded-full")}</div>
      <Skeleton className="h-12 w-full rounded-full" />
      <Skeleton className="h-12 w-full rounded-full" />
    </div>
  );
}

export function AccountSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-36 rounded-3xl" />
      <Skeleton className="h-80 rounded-3xl" />
      <div className="grid gap-3 sm:grid-cols-3">{blocks(3, "h-20 rounded-2xl")}</div>
      <div className="space-y-3">
        <Skeleton className="h-8 w-40" />
        {blocks(2, "h-20 rounded-2xl")}
      </div>
    </div>
  );
}

export function RecordListSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-40" />
      {blocks(4, "h-20 rounded-2xl")}
    </div>
  );
}

export function MediaGridSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-40" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">{blocks(6, "aspect-[3/4] rounded-2xl")}</div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="mx-auto max-w-sm space-y-6">
      <Skeleton className="h-10 w-48" />
      {blocks(3, "h-11 w-full rounded-lg")}
      <Skeleton className="h-11 w-full rounded-lg" />
    </div>
  );
}

export function CartSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-10 w-24" />
      {blocks(2, "h-28 w-full rounded-2xl")}
      <Skeleton className="h-40 rounded-3xl" />
    </div>
  );
}

export function CheckoutSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-10 w-40" />
      <div className="space-y-3">{blocks(5, "h-11 w-full rounded-lg")}</div>
      <Skeleton className="h-12 w-full rounded-full" />
    </div>
  );
}

export function SuccessSkeleton() {
  return (
    <div className="mx-auto max-w-md space-y-4 pt-8">
      <Skeleton className="mx-auto size-16 rounded-full" />
      <Skeleton className="mx-auto h-10 w-48" />
      <Skeleton className="h-28 rounded-3xl" />
    </div>
  );
}

export function AdminHomeSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-8 w-36" />
      <div className="flex gap-3 overflow-hidden">{blocks(3, "h-28 min-w-[180px] flex-1 rounded-2xl")}</div>
      <div className="space-y-3">
        <Skeleton className="h-8 w-40" />
        {blocks(4, "h-16 rounded-2xl")}
      </div>
    </div>
  );
}

export function AdminTableSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      {blocks(6, "h-12 rounded-xl")}
    </div>
  );
}

export function AdminFormSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-48" />
      {blocks(6, "h-11 w-full rounded-lg")}
      <Skeleton className="h-11 w-36 rounded-lg" />
    </div>
  );
}
