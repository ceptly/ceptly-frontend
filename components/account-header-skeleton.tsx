import { Skeleton } from "@/components/ui/skeleton";

export function AccountHeaderSkeleton() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/92 backdrop-blur-xl">
      <div className="mx-auto max-w-[1180px] px-6 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[22px]">
            <Skeleton className="size-[30px] rounded-none" />
            <div className="flex items-center gap-1">
              <Skeleton className="h-8 w-24 rounded-none" />
              <Skeleton className="h-8 w-16 rounded-none" />
              <Skeleton className="h-8 w-16 rounded-none" />
              <Skeleton className="h-8 w-16 rounded-none" />
              <Skeleton className="h-8 w-20 rounded-none" />
            </div>
          </div>
          <Skeleton className="size-9 rounded-full" />
        </div>
      </div>
    </header>
  );
}
