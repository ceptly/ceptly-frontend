import { ActivityPageShell } from "@/components/activity/activity-page-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PageSkeletonProps {
  className?: string;
}

function PageHeaderSkeleton({ className }: PageSkeletonProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72 max-w-full" />
    </div>
  );
}

function BackLinkSkeleton() {
  return <Skeleton className="h-8 w-24" />;
}

function RollupCardSkeleton() {
  return (
    <div className="ceptly-rollup-card min-h-[220px]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-3.5 w-56 max-w-full" />
        </div>
        <Skeleton className="h-[21px] w-24" />
      </div>
      <div className="ceptly-rollup-card-body">
        <div className="mt-4 flex justify-between">
          <Skeleton className="h-3.5 w-40" />
          <Skeleton className="h-3.5 w-20" />
        </div>
        <Skeleton className="mt-2 h-[7px] w-full" />
        <Skeleton className="mt-3 min-h-[2.75rem] flex-1" />
        <Skeleton className="mt-auto h-3 w-28" />
      </div>
    </div>
  );
}

function AttentionItemSkeleton() {
  return (
    <div className="ceptly-warn-row">
      <Skeleton className="size-[18px] shrink-0" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-full max-w-md" />
        <Skeleton className="h-3 w-48 max-w-full" />
      </div>
      <Skeleton className="size-8 shrink-0" />
    </div>
  );
}

function ReachOutCardSkeleton() {
  return (
    <div className="ceptly-reachout">
      <div className="flex justify-between gap-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-[21px] w-20" />
      </div>
      <Skeleton className="mt-2 h-5 w-40" />
      <Skeleton className="mt-3 h-14 w-full" />
      <Skeleton className="mt-3.5 h-3.5 w-52" />
    </div>
  );
}

function ConversationCardSkeleton() {
  return <RollupCardSkeleton />;
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="flex gap-4 border-b bg-muted/30 px-4 py-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="ml-auto h-4 w-16" />
      </div>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 border-b px-4 py-3 last:border-b-0"
        >
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-8 w-28 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-md" />
          <Skeleton className="ml-auto h-8 w-8 rounded-md" />
        </div>
      ))}
    </div>
  );
}

function FormSectionSkeleton() {
  return (
    <div className="space-y-4 rounded-xl border bg-card/50 p-6 shadow-sm">
      <Skeleton className="h-5 w-36" />
      <Skeleton className="h-4 w-full max-w-lg" />
      <Skeleton className="h-9 w-full max-w-sm rounded-md" />
    </div>
  );
}

export function ActivityPageContentSkeleton() {
  return (
    <>
      <div className="ceptly-page-head" aria-busy="true" aria-label="Loading activity">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-2 h-4 w-80 max-w-full" />
      </div>

      <section className="ceptly-section">
        <Skeleton className="mb-3.5 h-4 w-44" />
        <div className="ceptly-list-card">
          <AttentionItemSkeleton />
          <AttentionItemSkeleton />
        </div>
      </section>

      <section className="ceptly-section">
        <Skeleton className="mb-3.5 h-4 w-28" />
        <div className="ceptly-rollup-card-grid">
          <RollupCardSkeleton />
          <RollupCardSkeleton />
        </div>
      </section>

      <section className="ceptly-section">
        <Skeleton className="mb-3.5 h-4 w-40" />
        <div className="ceptly-rollup-card-grid">
          <RollupCardSkeleton />
          <RollupCardSkeleton />
        </div>
      </section>

      <section className="ceptly-section">
        <Skeleton className="mb-3.5 h-4 w-36" />
        <ReachOutCardSkeleton />
      </section>
    </>
  );
}

export function DashboardPageContentSkeleton() {
  return (
    <>
      <div
        className="ceptly-page-head"
        aria-busy="true"
        aria-label="Loading dashboard"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
        <Skeleton className="h-80 w-full rounded-xl" />
        <Skeleton className="h-56 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    </>
  );
}

export function ActivityPageSkeleton() {
  return (
    <ActivityPageShell>
      <ActivityPageContentSkeleton />
    </ActivityPageShell>
  );
}

export function ConversationDetailSkeleton({ className }: PageSkeletonProps) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-8",
        className,
      )}
      aria-busy="true"
      aria-label="Loading conversation"
    >
      <div className="space-y-4">
        <BackLinkSkeleton />
        <PageHeaderSkeleton />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16 rounded-md" />
          <Skeleton className="h-8 w-16 rounded-md" />
        </div>
      </div>

      <div className="space-y-4">
        <Skeleton className="h-9 w-full max-w-xs rounded-md" />
        <div className="space-y-3">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function TeamPageContentSkeleton() {
  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-9 w-36 rounded-md" />
        <Skeleton className="h-9 w-36 rounded-md" />
        <Skeleton className="h-9 w-36 rounded-md" />
      </div>

      <div className="space-y-4 rounded-xl border bg-card/50 p-6 shadow-sm">
        <Skeleton className="h-5 w-28" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>

      <TableSkeleton rows={6} />
    </>
  );
}

export function TeamPageSkeleton({ className }: PageSkeletonProps) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-8",
        className,
      )}
      aria-busy="true"
      aria-label="Loading team roster"
    >
      <PageHeaderSkeleton />
      <TeamPageContentSkeleton />
    </div>
  );
}

export function ChatPageSkeleton({ className }: PageSkeletonProps) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col px-4 py-8 sm:py-12",
        className,
      )}
      aria-busy="true"
      aria-label="Loading chat"
    >
      <div className="mx-auto flex w-full max-w-2xl min-h-0 flex-1 flex-col justify-center gap-6">
        <div className="mx-auto space-y-3 text-center">
          <Skeleton className="mx-auto h-10 w-72 max-w-full" />
          <Skeleton className="mx-auto h-4 w-48" />
        </div>
        <div className="mx-auto w-full max-w-xl space-y-3">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="size-9 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SettingsPageContentSkeleton() {
  return (
    <>
      <FormSectionSkeleton />
      <FormSectionSkeleton />
      <FormSectionSkeleton />
      <div className="space-y-4">
        <Skeleton className="h-5 w-32" />
        <TableSkeleton rows={4} />
      </div>
      <FormSectionSkeleton />
    </>
  );
}

export function SettingsPageSkeleton({ className }: PageSkeletonProps) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-8",
        className,
      )}
      aria-busy="true"
      aria-label="Loading settings"
    >
      <PageHeaderSkeleton />
      <SettingsPageContentSkeleton />
    </div>
  );
}

export function ConversationFormSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading form">
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
      <FormSectionSkeleton />
      <FormSectionSkeleton />
      <Skeleton className="h-9 w-32 rounded-md" />
    </div>
  );
}

export function DefaultPageSkeleton({ className }: PageSkeletonProps) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-8",
        className,
      )}
      aria-busy="true"
      aria-label="Loading"
    >
      <PageHeaderSkeleton />
      <div className="space-y-3">
        <ConversationCardSkeleton />
        <ConversationCardSkeleton />
        <ConversationCardSkeleton />
      </div>
    </div>
  );
}
