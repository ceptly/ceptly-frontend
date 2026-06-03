import { AccountHeaderSkeleton } from "@/components/account-header-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

function AppSidebarSkeleton() {
  return (
    <aside
      className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col self-start border-r border-border px-3 py-4 md:flex"
      style={{
        background:
          "color-mix(in oklab, var(--background) 94%, var(--foreground) 2%)",
      }}
    >
      <div className="flex items-center gap-2.5 px-2 pt-1.5 pb-3.5">
        <Skeleton className="size-[26px] rounded-none" />
        <Skeleton className="h-5 w-20 rounded-none" />
      </div>
      <Skeleton className="mb-3.5 h-10 w-full rounded-none" />
      <div className="flex flex-col gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full rounded-none" />
        ))}
      </div>
      <div className="mt-auto pt-3">
        <Skeleton className="h-12 w-full rounded-none" />
      </div>
    </aside>
  );
}

export function AppNavSkeleton() {
  return (
    <>
      <AppSidebarSkeleton />
      <AccountHeaderSkeleton />
    </>
  );
}
