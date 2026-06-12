"use client";

import {
  Check,
  MessageSquare,
  Plug,
  Plus,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  addFactAction,
  addTextSourceAction,
  confirmFindingAction,
  dismissFindingAction,
  getContextSnapshotAction,
  reindexSourceAction,
  removeFactAction,
  removeSourceAction,
  startScanAction,
  updateFactAction,
  uploadSourceAction,
} from "@/actions/context";
import { Button } from "@/components/ui/button";
import type {
  ContextFact,
  ContextFactGroup,
  ContextProjects,
  ContextScanState,
  ContextSnapshot,
} from "@/lib/api/context";
import { AddSourceModal } from "./add-source-modal";
import { FactGroupCard } from "./fact-group-card";
import { KN_GROUPS } from "./knowledge-config";
import { ReviewQueue } from "./review-queue";
import { SourcesRail } from "./sources-rail";
import { SyncedProjects } from "./synced-projects";

const POLL_MS = 2500;

const EMPTY_SCAN: ContextScanState = { active: null, last_completed_at: null };

interface KnowledgePageProps {
  workspaceId: string;
  companyName: string;
  canEdit: boolean;
  initialSnapshot: ContextSnapshot;
  initialProjects: ContextProjects;
}

function KnowledgeHero({
  canEdit,
  onAddSource,
}: {
  canEdit: boolean;
  onAddSource: () => void;
}) {
  return (
    <>
      <div className="kn-hero">
        <div className="kn-hero-grid" />
        <span className="kn-hero-eyebrow">
          <Sparkles size={13} /> Company context
        </span>
        <div className="kn-hero-title">Ceptly builds this page for you</div>
        <p className="kn-hero-sub">
          As check-ins run and projects sync, Ceptly turns what your team
          actually says into facts — each with a receipt you can check. Give it
          a head start with a doc, a note, or a Slack scan.
        </p>
        {canEdit ? (
          <div className="kn-hero-acts">
            <Button variant="default" onClick={onAddSource}>
              <Plus size={14} /> Add a source
            </Button>
          </div>
        ) : null}
      </div>
      <div className="kn-steps">
        <div className="kn-step">
          <div className="kn-step-num">01</div>
          <div className="kn-step-title">
            <Plug size={14} /> Connect sources
          </div>
          <div className="kn-step-desc">
            Slack is already connected. Add docs or notes, or connect your
            tracker so Ceptly has more to read.
          </div>
        </div>
        <div className="kn-step">
          <div className="kn-step-num">02</div>
          <div className="kn-step-title">
            <MessageSquare size={14} /> Ceptly reads
          </div>
          <div className="kn-step-desc">
            Run a Slack scan — check-ins, threads, and your documents become
            facts grounded in what people actually said.
          </div>
        </div>
        <div className="kn-step">
          <div className="kn-step-num">03</div>
          <div className="kn-step-title">
            <Check size={14} /> You stay in control
          </div>
          <div className="kn-step-desc">
            Anything uncertain waits for your review. Edit or remove any fact;
            agents update immediately.
          </div>
        </div>
      </div>
    </>
  );
}

export function KnowledgePage({
  workspaceId,
  companyName,
  canEdit,
  initialSnapshot,
  initialProjects,
}: KnowledgePageProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = useState(false);

  const facts = snapshot.facts ?? [];
  const findings = snapshot.findings ?? [];
  const sources = snapshot.sources ?? [];
  const scan = snapshot.scan ?? EMPTY_SCAN;

  const refresh = useCallback(async () => {
    const result = await getContextSnapshotAction(workspaceId);
    if (result.data) {
      setSnapshot(result.data);
    }
  }, [workspaceId]);

  // Poll while a scan is running or any library source is indexing.
  const busy =
    scan.active?.status === "running" ||
    sources.some((s) => s.status === "indexing");
  useEffect(() => {
    if (!busy) return;
    const tick = setInterval(refresh, POLL_MS);
    return () => clearInterval(tick);
  }, [busy, refresh]);

  function flash(id: string) {
    setFlashIds((cur) => new Set(cur).add(id));
  }

  // ---- review queue ---------------------------------------------------------
  function confirmFinding(factId: string, text?: string) {
    const finding = findings.find((f) => f.id === factId);
    if (!finding) return;
    const optimistic: ContextFact = {
      ...finding,
      status: "live",
      ...(text ? { text, edited: true } : {}),
    };
    setSnapshot((cur) => ({
      ...cur,
      findings: cur.findings.filter((f) => f.id !== factId),
      facts: [...cur.facts, optimistic],
    }));
    flash(factId);
    void confirmFindingAction(workspaceId, factId, text).then((result) => {
      if (result.error) {
        toast.error(result.error);
        void refresh();
      }
    });
  }

  function dismissFinding(factId: string) {
    setSnapshot((cur) => ({
      ...cur,
      findings: cur.findings.filter((f) => f.id !== factId),
    }));
    void dismissFindingAction(workspaceId, factId).then((result) => {
      if (result.error) {
        toast.error(result.error);
        void refresh();
      }
    });
  }

  // ---- facts ------------------------------------------------------------------
  function editFact(factId: string, text: string) {
    setSnapshot((cur) => ({
      ...cur,
      facts: cur.facts.map((f) =>
        f.id === factId ? { ...f, text, edited: true } : f,
      ),
    }));
    void updateFactAction(workspaceId, factId, text).then((result) => {
      if (result.error) {
        toast.error(result.error);
        void refresh();
      }
    });
  }

  function removeFact(factId: string) {
    setSnapshot((cur) => ({
      ...cur,
      facts: cur.facts.filter((f) => f.id !== factId),
    }));
    void removeFactAction(workspaceId, factId).then((result) => {
      if (result.error) {
        toast.error(result.error);
        void refresh();
      }
    });
  }

  function addFact(group: ContextFactGroup, text: string) {
    void addFactAction(workspaceId, group, text).then((result) => {
      if (result.error || !result.data) {
        toast.error(result.error ?? "Failed to add fact.");
        return;
      }
      const fact = result.data.fact;
      setSnapshot((cur) => ({ ...cur, facts: [...cur.facts, fact] }));
      flash(fact.id);
    });
  }

  // ---- scan ----------------------------------------------------------------------
  function startScan() {
    void startScanAction(workspaceId).then((result) => {
      if (result.error || !result.data) {
        toast.error(result.error ?? "Failed to start the Slack scan.");
        return;
      }
      const active = result.data.scan;
      setSnapshot((cur) => ({
        ...cur,
        scan: { ...(cur.scan ?? EMPTY_SCAN), active },
      }));
    });
  }

  // ---- sources --------------------------------------------------------------------
  function uploadSource(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    void uploadSourceAction(workspaceId, formData).then((result) => {
      if (result.error || !result.data) {
        toast.error(result.error ?? "Failed to upload the file.");
        return;
      }
      const source = result.data.source;
      setSnapshot((cur) => ({ ...cur, sources: [...cur.sources, source] }));
    });
  }

  function pasteSource(name: string, text: string) {
    void addTextSourceAction(workspaceId, name, text).then((result) => {
      if (result.error || !result.data) {
        toast.error(result.error ?? "Failed to add the source.");
        return;
      }
      const source = result.data.source;
      setSnapshot((cur) => ({ ...cur, sources: [...cur.sources, source] }));
    });
  }

  function reindexSource(sourceId: string) {
    void reindexSourceAction(workspaceId, sourceId).then((result) => {
      if (result.error || !result.data) {
        toast.error(result.error ?? "Failed to re-index the source.");
        return;
      }
      const source = result.data.source;
      setSnapshot((cur) => ({
        ...cur,
        sources: cur.sources.map((s) => (s.id === sourceId ? source : s)),
      }));
    });
  }

  function removeSource(sourceId: string) {
    setSnapshot((cur) => ({
      ...cur,
      sources: cur.sources.filter((s) => s.id !== sourceId),
    }));
    void removeSourceAction(workspaceId, sourceId).then((result) => {
      if (result.error) {
        toast.error(result.error);
      }
      // Re-pull: the source's unreviewed findings were removed with it.
      void refresh();
    });
  }

  const sourceCount =
    1 + (initialProjects.tracker ? 1 : 0) + sources.length;
  const showHero = facts.length === 0 && findings.length === 0;

  return (
    <div className="ceptly-page" style={{ maxWidth: 1180 }}>
      <div className="ceptly-page-head" style={{ marginBottom: 22 }}>
        <div className="kn-head-row">
          <div>
            <h1 className="ceptly-page-title">Company context</h1>
            <p className="ceptly-page-sub" style={{ maxWidth: "64ch" }}>
              What Ceptly has learned about {companyName} — from check-ins,
              Slack, and the sources you give it. Every fact keeps its receipt;
              correct anything and agents use it immediately.
            </p>
            {!showHero ? (
              <div className="kn-meta">
                <span>
                  {facts.length} {facts.length === 1 ? "fact" : "facts"}
                </span>
                <span className="sep">·</span>
                <span>
                  {sourceCount} {sourceCount === 1 ? "source" : "sources"}
                </span>
              </div>
            ) : null}
          </div>
          {canEdit ? (
            <div className="kn-head-actions">
              <Button variant="default" size="sm" onClick={() => setAddOpen(true)}>
                <Plus size={14} /> Add source
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="kn-cols">
        <div className="kn-main">
          {showHero ? (
            <KnowledgeHero canEdit={canEdit} onAddSource={() => setAddOpen(true)} />
          ) : null}
          <ReviewQueue
            findings={findings}
            canEdit={canEdit}
            onConfirm={confirmFinding}
            onDismiss={dismissFinding}
          />
          {KN_GROUPS.map((group) => (
            <FactGroupCard
              key={group.id}
              group={group}
              facts={facts.filter((f) => f.group === group.id)}
              canEdit={canEdit}
              flashIds={flashIds}
              onEditFact={editFact}
              onRemoveFact={removeFact}
              onAddFact={(text) => addFact(group.id, text)}
              extra={
                group.id === "priorities_goals" &&
                initialProjects.tracker &&
                initialProjects.projects.length ? (
                  <SyncedProjects
                    workspaceId={workspaceId}
                    initial={initialProjects}
                    canEdit={canEdit}
                  />
                ) : undefined
              }
            />
          ))}
        </div>
        <SourcesRail
          scan={scan}
          projects={initialProjects}
          sources={sources}
          canEdit={canEdit}
          onScan={startScan}
          onAddSource={() => setAddOpen(true)}
          onReindexSource={reindexSource}
          onRemoveSource={removeSource}
        />
      </div>

      <AddSourceModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onUpload={uploadSource}
        onPaste={pasteSource}
      />
    </div>
  );
}
