import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DashboardMemberMomentum } from "@/lib/api/types";

function DoneSparkline({
  doneByDay,
  days,
}: {
  doneByDay: { date: string; count: number }[];
  days: string[];
}) {
  const countByDate = new Map(
    doneByDay.map((point) => [point.date, point.count]),
  );
  const max = Math.max(1, ...doneByDay.map((point) => point.count));

  return (
    <div
      className="flex h-6 w-24 items-end gap-px"
      aria-hidden
      title="Tasks completed per day"
    >
      {days.map((date) => {
        const count = countByDate.get(date) ?? 0;
        return (
          <div
            key={date}
            className="min-w-px flex-1 rounded-t-[1px] bg-primary/70"
            style={{
              height: count > 0 ? `${Math.max((count / max) * 100, 18)}%` : "2px",
              opacity: count > 0 ? 1 : 0.25,
            }}
          />
        );
      })}
    </div>
  );
}

interface MemberMomentumTableProps {
  members: DashboardMemberMomentum[];
  days: string[];
}

export function MemberMomentumTable({
  members,
  days,
}: MemberMomentumTableProps) {
  if (members.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No member activity in this window yet.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead>Response rate</TableHead>
          <TableHead>Tasks done</TableHead>
          <TableHead className="text-right">Carry-overs</TableHead>
          <TableHead className="text-right">Blockers</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <TableRow key={member.roster_member_id}>
            <TableCell className="font-medium">
              <span className="flex items-center gap-2">
                {member.display_name}
                {member.paused ? (
                  <Badge variant="outline" className="text-[10px]">
                    Paused
                  </Badge>
                ) : null}
              </span>
            </TableCell>
            <TableCell>
              <div className="flex w-40 items-center gap-2">
                <Progress
                  value={member.response_rate_pct ?? 0}
                  className="flex-1"
                />
                <span className="w-14 shrink-0 text-xs text-muted-foreground">
                  {member.response_rate_pct !== null
                    ? `${Math.round(member.response_rate_pct)}%`
                    : "—"}{" "}
                  <span className="text-[10px]">
                    ({member.sessions_responded}/{member.sessions_expected})
                  </span>
                </span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <span className="w-6 text-sm tabular-nums">
                  {member.tasks_done}
                </span>
                <DoneSparkline doneByDay={member.done_by_day} days={days} />
              </div>
            </TableCell>
            <TableCell className="text-right">
              {member.carry_overs > 0 ? (
                <Badge variant="attention" className="border-0">
                  {member.carry_overs}
                </Badge>
              ) : (
                <span className="text-muted-foreground">0</span>
              )}
            </TableCell>
            <TableCell className="text-right text-sm text-muted-foreground">
              {member.blockers_reported} reported · {member.blockers_resolved}{" "}
              resolved
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
