interface ActivityPageShellProps {
  children: React.ReactNode;
}

export function ActivityPageShell({ children }: ActivityPageShellProps) {
  return <div className="ceptly-page">{children}</div>;
}
