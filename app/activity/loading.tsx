import { ActivityPageShell } from "@/components/activity/activity-page-shell";
import { ActivityPageContentSkeleton } from "@/components/page-skeletons";

export default function ActivityLoading() {
  return (
    <ActivityPageShell>
      <ActivityPageContentSkeleton />
    </ActivityPageShell>
  );
}
