interface ActivityPageShellProps {
  children: React.ReactNode;
}

export function ActivityPageShell({ children }: ActivityPageShellProps) {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Activity</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Check-in results and items that need your attention.
        </p>
      </div>
      {children}
    </div>
  );
}
