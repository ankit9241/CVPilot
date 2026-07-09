import { cn } from "@/lib/utils";

function Shimmer({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted/70", className)} />;
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5 shadow-subtle", className)}>
      <Shimmer className="h-3 w-24" />
      <Shimmer className="mt-3 h-6 w-32" />
      <Shimmer className="mt-2 h-2 w-40" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 lg:col-span-8 rounded-2xl border border-border bg-card p-6">
        <Shimmer className="h-4 w-32" />
        <Shimmer className="mt-4 h-6 w-2/3" />
        <Shimmer className="mt-2 h-3 w-1/2" />
      </div>
      <div className="col-span-12 lg:col-span-4">
        <CardSkeleton />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="col-span-6 lg:col-span-3">
          <CardSkeleton />
        </div>
      ))}
    </div>
  );
}

export function ResumePreviewSkeleton() {
  return (
    <div className="mx-auto aspect-[8.5/11] w-full max-w-[560px] rounded-lg border border-border bg-background p-8 shadow-soft">
      <Shimmer className="mx-auto h-5 w-40" />
      <Shimmer className="mx-auto mt-2 h-3 w-56" />
      <div className="mt-6 space-y-2">
        <Shimmer className="h-3 w-24" />
        <Shimmer className="h-2 w-full" />
        <Shimmer className="h-2 w-11/12" />
        <Shimmer className="h-2 w-10/12" />
      </div>
      <div className="mt-6 space-y-2">
        <Shimmer className="h-3 w-24" />
        <Shimmer className="h-2 w-full" />
        <Shimmer className="h-2 w-9/12" />
      </div>
      <div className="mt-6 grid grid-cols-3 gap-2">
        <Shimmer className="h-2" />
        <Shimmer className="h-2" />
        <Shimmer className="h-2" />
      </div>
    </div>
  );
}

export function VaultSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-background p-4">
          <Shimmer className="aspect-[3/4] w-full" />
          <Shimmer className="mt-3 h-3 w-24" />
          <Shimmer className="mt-2 h-2 w-32" />
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-border rounded-2xl border border-border bg-card">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4">
          <Shimmer className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Shimmer className="h-3 w-1/3" />
            <Shimmer className="h-2 w-1/2" />
          </div>
          <Shimmer className="h-4 w-10 rounded-full" />
        </div>
      ))}
    </div>
  );
}
