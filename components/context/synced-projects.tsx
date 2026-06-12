"use client";

/* eslint-disable @next/next/no-img-element */

import { Loader2, RefreshCw } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { resyncProjectsAction } from "@/actions/context";
import { Button } from "@/components/ui/button";
import type { ContextProjects } from "@/lib/api/context";
import { TRACKER_LABELS, relativeTime, trackerLogo } from "./knowledge-config";

interface SyncedProjectsProps {
  workspaceId: string;
  initial: ContextProjects;
  canEdit: boolean;
}

/** "In flight — synced from {tracker}" block inside Priorities & goals. */
export function SyncedProjects({
  workspaceId,
  initial,
  canEdit,
}: SyncedProjectsProps) {
  const [data, setData] = useState(initial);
  const [syncing, startSync] = useTransition();
  const { resolvedTheme } = useTheme();

  if (!data.tracker || !data.projects.length) {
    return null;
  }
  const tracker = data.tracker;

  function resync() {
    startSync(async () => {
      const result = await resyncProjectsAction(workspaceId);
      if (result.error || !result.data) {
        toast.error(result.error ?? "Failed to re-sync projects.");
        return;
      }
      setData(result.data.projects);
    });
  }

  return (
    <div className="kn-sync">
      <div className="kn-sync-head">
        <img
          src={trackerLogo(tracker, resolvedTheme === "dark" ? "dark" : "light")}
          alt=""
          width={15}
          height={15}
        />
        <span className="kn-sync-label">
          In flight — synced from {TRACKER_LABELS[tracker]}
        </span>
        <span className="kn-sync-when">
          {relativeTime(data.synced_at) ?? ""}
        </span>
        <span className="spacer" />
        {canEdit ? (
          <Button variant="ghost" size="sm" disabled={syncing} onClick={resync}>
            {syncing ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <RefreshCw size={13} />
            )}{" "}
            Re-sync
          </Button>
        ) : null}
      </div>
      {data.projects.map((project) => {
        const pctValue =
          project.progress_pct ??
          (project.done !== null && project.total ? Math.round((project.done / project.total) * 100) : null);
        return (
          <div className="kn-proj" key={project.key + project.name}>
            <span className="kn-proj-key">{project.key}</span>
            <div className="kn-proj-main">
              <div className="kn-proj-name">{project.name}</div>
              {project.owner ? (
                <div className="kn-proj-meta">{project.owner}</div>
              ) : null}
            </div>
            <span
              className={
                project.status === "at_risk" ? "kn-badge-risk" : "kn-badge-track"
              }
            >
              {project.status === "at_risk" ? "At risk" : "On track"}
            </span>
            {pctValue !== null ? (
              <div className="kn-proj-prog">
                <span className="kn-proj-bar">
                  <span style={{ width: `${pctValue}%` }} />
                </span>
                <span className="kn-proj-num">
                  {project.done !== null && project.total !== null
                    ? `${project.done}/${project.total}`
                    : `${pctValue}%`}
                </span>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
