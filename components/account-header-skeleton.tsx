import { Skeleton } from "@/components/ui/skeleton";

export function AccountHeaderSkeleton() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="px-6 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Skeleton className="size-8 rounded" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-24 rounded-md" />
              <Skeleton className="h-8 w-16 rounded-md" />
              <Skeleton className="h-8 w-16 rounded-md" />
              <Skeleton className="h-8 w-16 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          </div>
          <Skeleton className="size-9 rounded-full" />
        </div>
      </div>
    </header>
  );
}
