"use client";

import { useState, useTransition } from "react";
import {
  ArrowUpRight,
  Check,
  Circle,
  FileCheck2,
  FileText,
  FileUp,
  Link2,
  Loader2,
  Plus,
  Sparkles,
  UploadCloud,
  X,
  Zap,
} from "lucide-react";

import { saveContextSectionAction } from "@/actions/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CX_AGENTS,
  CX_AGENT_ORDER,
  CX_CATEGORY_META,
  getCategoryMeta,
} from "@/lib/context-config";
import type {
  CompanyContext,
  CompanyContextField,
  CompanyContextSection,
} from "@/lib/api/context";
import { cn } from "@/lib/utils";

/** A section carrying its workspace id so the drawer can save without prop-drilling. */
type BrainSection = CompanyContextSection & { workspaceId: string };

// ---- helpers ------------------------------------------------------------
function isFilled(field: CompanyContextField): boolean {
  if (Array.isArray(field.value)) {
    return field.value.some((v) => v.trim().length > 0);
  }
  return field.value.trim().length > 0;
}

function sectionCompleteness(fields: CompanyContextField[]): number {
  if (!fields.length) return 0;
  const filled = fields.filter(isFilled).length;
  return Math.round((filled / fields.length) * 100);
}

function overallCompleteness(sections: CompanyContextSection[]): number {
  if (!sections.length) return 0;
  return Math.round(
    sections.reduce((sum, s) => sum + s.completeness, 0) / sections.length,
  );
}

function summarize(section: CompanyContextSection): string {
  const parts: string[] = [];
  for (const f of section.fields) {
    if (Array.isArray(f.value)) {
      const items = f.value.map((v) => v.trim()).filter(Boolean);
      if (items.length) parts.push(items.join(" · "));
    } else if (f.value.trim()) {
      parts.push(f.value.trim());
    }
  }
  return parts.join(" · ");
}

// ---- completeness ring --------------------------------------------------
function Ring({
  pct,
  size = 52,
  stroke = 5,
  showNum = true,
  numSize,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  showNum?: boolean;
  numSize?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="block -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{
            stroke: "var(--brand-green-soft)",
            transition: "stroke-dashoffset .8s cubic-bezier(.2,.7,.2,1)",
          }}
        />
      </svg>
      {showNum ? (
        <span
          className="absolute font-semibold tabular-nums"
          style={{ fontSize: numSize ?? Math.round(size * 0.3) }}
        >
          {Math.round(pct)}
          <small className="text-[0.55em] text-muted-foreground">%</small>
        </span>
      ) : null}
    </span>
  );
}

function AgentChips({ ids, on }: { ids: string[]; on: boolean }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ids.map((id) => {
        const a = CX_AGENTS[id];
        if (!a) return null;
        const Icon = a.icon;
        return (
          <span
            key={id}
            className={cn(
              "inline-flex items-center gap-1.5 border px-2 py-1 text-[11.5px]",
              on
                ? "border-[var(--brand-green-soft)] text-foreground [&_svg]:text-[var(--brand-green-soft)]"
                : "border-border text-muted-foreground [&_svg]:text-muted-foreground",
            )}
            style={
              on
                ? {
                    background:
                      "color-mix(in oklab, var(--brand-green) 8%, transparent)",
                  }
                : undefined
            }
          >
            <Icon className="size-3" /> {a.label}
          </span>
        );
      })}
    </div>
  );
}

// ---- ingest (UI-only mock, mirrors the prototype) -----------------------
interface QueueItem {
  id: number;
  name: string;
  meta: string;
  into: string;
  pct: number;
  done: boolean;
}
let cxQId = 0;

function IngestZone({
  onIngest,
}: {
  onIngest: (name: string, meta: string) => void;
}) {
  const [drag, setDrag] = useState(false);
  return (
    <div
      className={cn(
        "flex items-center gap-4 border border-dashed p-4 transition-colors",
        drag
          ? "border-[var(--brand-green-soft)] bg-[color-mix(in_oklab,var(--brand-green)_8%,transparent)]"
          : "border-border",
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        onIngest("Dropped file", "Scanning document");
      }}
    >
      <span className="flex size-11 shrink-0 items-center justify-center border border-border text-[var(--brand-green-soft)]">
        <UploadCloud className="size-6" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">
          Drop docs, decks, or paste a link
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          Ceptly reads handbooks, specs, and roadmaps and pulls the context into
          the right sections automatically.
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onIngest("Company handbook.pdf", "Reading PDF · 24 pages")}
        >
          <FileUp className="size-3.5" /> Upload
        </Button>
        <Button
          size="sm"
          onClick={() => onIngest("notion.so/handbook", "Fetching link")}
        >
          <Link2 className="size-3.5" /> Paste link
        </Button>
      </div>
    </div>
  );
}

function IngestQueue({ items }: { items: QueueItem[] }) {
  if (!items.length) return null;
  return (
    <div className="flex flex-col gap-2">
      {items.map((it) => (
        <div
          key={it.id}
          className="flex items-center gap-3 border border-border bg-card px-3 py-2.5"
        >
          <span className="flex size-8 shrink-0 items-center justify-center border border-border text-muted-foreground">
            {it.done ? (
              <FileCheck2 className="size-4" />
            ) : (
              <FileText className="size-4" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold">{it.name}</div>
            <div className="text-[11.5px] text-muted-foreground">
              {it.done ? `Extracted → ${it.into}` : it.meta}
            </div>
            {!it.done ? (
              <div className="mt-1.5 h-1 w-full overflow-hidden bg-muted">
                <span
                  className="block h-full"
                  style={{
                    width: `${it.pct}%`,
                    background: "var(--brand-green-soft)",
                  }}
                />
              </div>
            ) : null}
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[11.5px] font-semibold",
              it.done ? "text-[var(--brand-green-soft)]" : "text-muted-foreground",
            )}
          >
            {it.done ? (
              <>
                <Check className="size-3.5" /> Added
              </>
            ) : (
              <>
                <Loader2 className="size-3.5 animate-spin" /> Reading…
              </>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---- bento tile ---------------------------------------------------------
function Tile({
  section,
  onOpen,
}: {
  section: CompanyContextSection;
  onOpen: () => void;
}) {
  const meta = getCategoryMeta(section.category);
  if (!meta) return null;
  const Icon = meta.icon;
  const pct = section.completeness;
  const filled = pct > 0;
  const count = section.fields.filter(isFilled).length;
  return (
    <button
      onClick={onOpen}
      className={cn(
        "flex flex-col gap-3 border border-border bg-card p-4 text-left transition-colors hover:border-foreground/30",
        meta.span,
        pct >= 100 &&
          "border-[var(--brand-green-soft)] bg-[color-mix(in_oklab,var(--brand-green)_5%,transparent)]",
      )}
    >
      <div className="flex items-start justify-between">
        <span className="flex size-9 items-center justify-center border border-border">
          <Icon className="size-[17px]" />
        </span>
        {filled ? (
          <Ring pct={pct} size={40} stroke={4} numSize={11} />
        ) : (
          <Plus className="size-[18px] text-muted-foreground" />
        )}
      </div>
      <div className="text-[15px] font-semibold">{meta.label}</div>
      <div className="line-clamp-2 text-xs text-muted-foreground">
        {filled ? summarize(section) : "Nothing captured yet — tap to add."}
      </div>
      <div className="mt-auto flex items-center justify-between pt-1">
        {filled ? (
          <span className="text-[11.5px] text-muted-foreground">
            {count} {count === 1 ? "field" : "fields"}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11.5px] text-muted-foreground">
            <Plus className="size-3" /> Add context
          </span>
        )}
        <ArrowUpRight className="size-[15px] text-muted-foreground" />
      </div>
    </button>
  );
}

function AgentMap({ active }: { active: boolean }) {
  return (
    <div className="border border-border bg-card p-4">
      <div className="mb-4 inline-flex items-center gap-2 text-[13px] font-semibold">
        <Zap className="size-3.5" /> Agents powered by this context
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {CX_AGENT_ORDER.map((id) => {
          const a = CX_AGENTS[id];
          const Icon = a.icon;
          return (
            <div
              key={id}
              className={cn(
                "flex flex-col items-center gap-2 border p-3 text-center",
                active
                  ? "border-[var(--brand-green-soft)]"
                  : "border-border opacity-70",
              )}
            >
              <span className="flex size-9 items-center justify-center border border-border">
                <Icon className="size-[15px]" />
              </span>
              <div className="text-xs font-semibold">{a.label}</div>
              <div className="inline-flex items-center gap-1 text-[10.5px] text-muted-foreground">
                {active ? (
                  <>
                    <span
                      className="inline-block size-1.5 rounded-full"
                      style={{ background: "var(--brand-green-soft)" }}
                    />
                    Grounded
                  </>
                ) : (
                  <>
                    <Circle className="size-2" /> Needs context
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- field + tag editors ------------------------------------------------
function TagEditor({
  values,
  onChange,
  disabled,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    onChange([...values, v]);
    setDraft("");
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((v, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 border border-border px-2 py-1 text-xs"
        >
          {v}
          {!disabled ? (
            <button
              type="button"
              aria-label="Remove"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => onChange(values.filter((_, j) => j !== i))}
            >
              <X className="size-3" />
            </button>
          ) : null}
        </span>
      ))}
      {!disabled ? (
        <span className="inline-flex items-center gap-1">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            placeholder="Add…"
            className="h-7 w-28 px-2 text-xs"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Add"
            onClick={add}
          >
            <Plus className="size-3.5" />
          </Button>
        </span>
      ) : null}
    </div>
  );
}

function TileDrawer({
  section,
  canEdit,
  onClose,
  onSaved,
}: {
  section: BrainSection;
  canEdit: boolean;
  onClose: () => void;
  onSaved: (fields: CompanyContextField[]) => void;
}) {
  const meta = getCategoryMeta(section.category)!;
  const Icon = meta.icon;
  const [fields, setFields] = useState<CompanyContextField[]>(() =>
    section.fields.map((f) => ({
      ...f,
      value: Array.isArray(f.value) ? [...f.value] : f.value,
    })),
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const setFieldValue = (key: string, value: string | string[]) => {
    setFields((cur) =>
      cur.map((f) => (f.key === key ? { ...f, value } : f)),
    );
  };

  const save = () => {
    setError(null);
    startTransition(async () => {
      const result = await saveContextSectionAction(
        section.workspaceId,
        section.category,
        fields,
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      onSaved(fields);
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-[560px] flex-col border border-border bg-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border p-5">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center border border-border">
              <Icon className="size-[18px]" />
            </span>
            <div>
              <div className="text-[15px] font-semibold">{meta.label}</div>
              <div className="text-xs text-muted-foreground">{meta.desc}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-[18px]" />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
          {fields.map((f) => (
            <div key={f.key}>
              <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                {f.label}
              </span>
              {f.type === "tags" ? (
                <TagEditor
                  values={Array.isArray(f.value) ? f.value : []}
                  disabled={!canEdit}
                  onChange={(next) => setFieldValue(f.key, next)}
                />
              ) : f.type === "textarea" ? (
                <Textarea
                  rows={2}
                  disabled={!canEdit}
                  value={Array.isArray(f.value) ? "" : f.value}
                  placeholder={`Add ${f.label.toLowerCase()}…`}
                  onChange={(e) => setFieldValue(f.key, e.target.value)}
                />
              ) : (
                <Input
                  disabled={!canEdit}
                  value={Array.isArray(f.value) ? "" : f.value}
                  placeholder={`Add ${f.label.toLowerCase()}…`}
                  onChange={(e) => setFieldValue(f.key, e.target.value)}
                />
              )}
            </div>
          ))}

          <div className="flex flex-wrap items-center gap-2.5 border-t border-border pt-4">
            <span className="text-[11.5px] text-muted-foreground">Powers</span>
            <AgentChips ids={meta.agents} on />
          </div>
          {error ? (
            <p className="text-xs text-destructive">{error}</p>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border p-4">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
          {canEdit ? (
            <Button size="sm" onClick={save} disabled={pending}>
              {pending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Check className="size-3.5" />
              )}{" "}
              Save
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ---- main ---------------------------------------------------------------
interface ContextBrainProps {
  workspaceId: string;
  companyName: string;
  initialContext: CompanyContext;
  canEdit: boolean;
}

export function ContextBrain({
  workspaceId,
  companyName,
  initialContext,
  canEdit,
}: ContextBrainProps) {
  // Keep workspaceId on each section so the drawer can save without prop-drilling.
  const [sections, setSections] = useState(() =>
    initialContext.sections.map((s) => ({ ...s, workspaceId })),
  );
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);

  const overall = overallCompleteness(sections);
  const active = overall > 0;

  // Order sections to match the display config.
  const orderedSections = CX_CATEGORY_META.map((m) =>
    sections.find((s) => s.category === m.id),
  ).filter((s): s is (typeof sections)[number] => !!s);

  const openSection = openCategory
    ? sections.find((s) => s.category === openCategory)
    : null;

  function ingest(name: string, meta: string) {
    const id = ++cxQId;
    const into =
      CX_CATEGORY_META[Math.floor(Math.random() * CX_CATEGORY_META.length)]
        .label;
    setQueue((q) =>
      [{ id, name, meta, into, pct: 8, done: false }, ...q].slice(0, 4),
    );
    const tick = setInterval(() => {
      setQueue((q) =>
        q.map((it) =>
          it.id === id ? { ...it, pct: Math.min(100, it.pct + 22) } : it,
        ),
      );
    }, 240);
    setTimeout(() => {
      clearInterval(tick);
      setQueue((q) =>
        q.map((it) => (it.id === id ? { ...it, pct: 100, done: true } : it)),
      );
    }, 1300);
  }

  function handleSaved(category: string, fields: CompanyContextField[]) {
    setSections((cur) =>
      cur.map((s) =>
        s.category === category
          ? {
              ...s,
              fields,
              completeness: sectionCompleteness(fields),
              updated_at: new Date().toISOString(),
            }
          : s,
      ),
    );
    setOpenCategory(null);
  }

  return (
    <div className="ceptly-page mx-auto flex max-w-[1080px] flex-col gap-6">
      <div className="flex items-center justify-between gap-6">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--brand-green-soft)]">
            <Sparkles className="size-3.5" /> Company brain
          </span>
          <h1 className="ceptly-page-title mt-1">
            Everything Ceptly knows about {companyName}
          </h1>
          <p className="ceptly-page-sub max-w-[60ch]">
            Feed it docs and answers once. Each agent reads from the same shared
            memory — so check-ins, insights, and reach-out all speak your
            company&apos;s language.
          </p>
        </div>
        <Ring pct={overall} size={104} stroke={9} numSize={30} />
      </div>

      {canEdit ? <IngestZone onIngest={ingest} /> : null}
      <IngestQueue items={queue} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-6">
        {orderedSections.map((s) => (
          <Tile
            key={s.category}
            section={s}
            onOpen={() => setOpenCategory(s.category)}
          />
        ))}
      </div>

      <AgentMap active={active} />

      {openSection ? (
        <TileDrawer
          section={openSection}
          canEdit={canEdit}
          onClose={() => setOpenCategory(null)}
          onSaved={(fields) => handleSaved(openSection.category, fields)}
        />
      ) : null}
    </div>
  );
}
