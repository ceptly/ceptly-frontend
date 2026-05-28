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

function ConversationCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card/50 py-6 shadow-sm">
      <div className="grid gap-2 px-6">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
      <div className="mt-4 space-y-3 px-6 pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
    </div>
  );
}

function AttentionItemSkeleton() {
  return (
    <div className="flex items-start gap-3 rounded-lg border px-4 py-3">
      <Skeleton className="size-4 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-full max-w-md" />
        <Skeleton className="h-3 w-48 max-w-full" />
      </div>
      <Skeleton className="size-8 shrink-0 rounded-md" />
    </div>
  );
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
      <section className="space-y-3" aria-busy="true" aria-label="Loading activity">
        <Skeleton className="h-4 w-40" />
        <AttentionItemSkeleton />
        <AttentionItemSkeleton />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-8 w-32 rounded-md" />
        </div>
        <div className="space-y-3">
          <ConversationCardSkeleton />
          <ConversationCardSkeleton />
          <ConversationCardSkeleton />
        </div>
      </section>

      <section className="space-y-4">
        <Skeleton className="h-4 w-32" />
        <div className="space-y-2">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </section>
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
