"use client";

/* eslint-disable @next/next/no-img-element */

import {
  ChevronRight,
  Library,
  Loader2,
  Plug,
  Plus,
  RefreshCw,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import type {
  ContextProjects,
  ContextScanState,
  ContextSource,
} from "@/lib/api/context";
import {
  TRACKER_LABELS,
  relativeTime,
  sourceVisual,
  trackerLogo,
} from "./knowledge-config";

function sourceMeta(source: ContextSource): string {
  if (source.status === "indexing") {
    return "Indexing…";
  }
  if (source.status === "error") {
    return source.error_message ?? "Indexing failed";
  }
  const parts: string[] = [
    source.kind === "text" ? "Indexed" : "Indexed",
  ];
  parts.push(
    `${source.facts_count} ${source.facts_count === 1 ? "finding" : "findings"}`,
  );
  const when = relativeTime(source.indexed_at);
  if (when) {
    parts.push(when);
  }
  return parts.join(" · ");
}

interface SourceRowProps {
  source: ContextSource;
  canEdit: boolean;
  onReindex: () => void;
  onRemove: () => void;
}

function SourceRow({ source, canEdit, onReindex, onRemove }: SourceRowProps) {
  const vis = sourceVisual(source);
  const VisIcon = vis.icon;
  return (
    <div className="kn-src">
      <span className="kn-src-ic">
        {vis.img ? (
          <img src={vis.img} alt="" width={16} height={16} />
        ) : VisIcon ? (
          <VisIcon size={15} />
        ) : null}
      </span>
      <div className="kn-src-main">
        <div className="kn-src-name">{source.name}</div>
        <div className={"kn-src-meta" + (source.status === "error" ? " error" : "")}>
          {source.status === "indexing" ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 size={11} className="animate-spin" /> {sourceMeta(source)}
            </span>
          ) : (
            sourceMeta(source)
          )}
        </div>
        {source.status === "indexing" ? (
          <div className="kn-src-bar">
            <span style={{ width: "60%" }} />
          </div>
        ) : null}
      </div>
      {canEdit && source.status !== "indexing" ? (
        <span className="kn-src-acts">
          <button
            type="button"
            className="kn-act"
            aria-label={"Re-index " + source.name}
            onClick={onReindex}
          >
            <RefreshCw size={13} />
          </button>
          <button
            type="button"
            className="kn-act"
            aria-label={"Remove " + source.name}
            onClick={onRemove}
          >
            <X size={14} />
          </button>
        </span>
      ) : null}
    </div>
  );
}

interface SlackSourceRowProps {
  scan: ContextScanState;
  canEdit: boolean;
  onScan: () => void;
}

function SlackSourceRow({ scan, canEdit, onScan }: SlackSourceRowProps) {
  const active = scan.active;
  const scanning = active?.status === "running";
  const pct = active?.channels_total
    ? Math.round((active.channels_scanned / active.channels_total) * 100)
    : 8;

  const meta = scanning
    ? `Scanning ${active?.current_channel ?? "channels"}…`
    : scan.last_completed_at
      ? `Last scanned ${relativeTime(scan.last_completed_at)}`
      : "Never scanned — click Scan to start";

  return (
    <div className="kn-src">
      <span className="kn-src-ic">
        <img src="/integrations/slack.png" alt="" width={16} height={16} />
      </span>
      <div className="kn-src-main">
        <div className="kn-src-name">Slack</div>
        <div className="kn-src-meta">
          {scanning ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 size={11} className="animate-spin" /> {meta}
            </span>
          ) : (
            meta
          )}
        </div>
        {scanning ? (
          <div className="kn-src-bar">
            <span style={{ width: `${Math.max(8, pct)}%` }} />
          </div>
        ) : null}
      </div>
      {canEdit ? (
        <span className="kn-src-cta">
          <Button variant="outline" size="sm" disabled={scanning} onClick={onScan}>
            {scanning ? (
              <>
                <Loader2 size={13} className="animate-spin" /> Scanning
              </>
            ) : (
              <>
                <RefreshCw size={13} /> Scan
              </>
            )}
          </Button>
        </span>
      ) : null}
    </div>
  );
}

interface SourcesRailProps {
  scan: ContextScanState;
  projects: ContextProjects;
  sources: ContextSource[];
  canEdit: boolean;
  onScan: () => void;
  onAddSource: () => void;
  onReindexSource: (sourceId: string) => void;
  onRemoveSource: (sourceId: string) => void;
}

export function SourcesRail({
  scan,
  projects,
  sources,
  canEdit,
  onScan,
  onAddSource,
  onReindexSource,
  onRemoveSource,
}: SourcesRailProps) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "dark" : "light";
  const tracker = projects.tracker;

  return (
    <aside className="kn-rail">
      <div className="kn-rail-card">
        <div className="kn-rail-head">
          <span className="kn-rail-title">Connected</span>
        </div>
        <SlackSourceRow scan={scan} canEdit={canEdit} onScan={onScan} />
        {tracker ? (
          <div className="kn-src">
            <span className="kn-src-ic">
              <img src={trackerLogo(tracker, theme)} alt="" width={16} height={16} />
            </span>
            <div className="kn-src-main">
              <div className="kn-src-name">{TRACKER_LABELS[tracker]}</div>
              <div className="kn-src-meta">
                {projects.projects.length} projects
                {relativeTime(projects.synced_at)
                  ? ` · synced ${relativeTime(projects.synced_at)}`
                  : ""}
              </div>
            </div>
          </div>
        ) : null}
        <button
          type="button"
          className="kn-rail-link"
          onClick={() => router.push("/settings/integrations")}
        >
          <Plug size={14} />
          {tracker
            ? "Connect more integrations…"
            : "Connect Jira, Linear, Monday…"}
          <ChevronRight size={14} className="go" />
        </button>
      </div>

      <div className="kn-rail-card">
        <div className="kn-rail-head">
          <span className="kn-rail-title">Your library</span>
          {canEdit ? (
            <Button variant="outline" size="sm" onClick={onAddSource}>
              <Plus size={13} /> Add
            </Button>
          ) : null}
        </div>
        {sources.length ? (
          sources.map((source) => (
            <SourceRow
              key={source.id}
              source={source}
              canEdit={canEdit}
              onReindex={() => onReindexSource(source.id)}
              onRemove={() => onRemoveSource(source.id)}
            />
          ))
        ) : (
          <div className="kn-rail-empty">
            <Library size={20} />
            <p className="kn-rail-empty-txt">
              Docs, notes, or pasted text — Ceptly reads them and cites them in
              answers.
            </p>
            {canEdit ? (
              <Button variant="default" size="sm" onClick={onAddSource}>
                <Plus size={13} /> Add your first source
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </aside>
  );
}
