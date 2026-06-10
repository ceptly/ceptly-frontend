"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import {
  ArrowDown,
  Check,
  ChevronRight,
  GitMerge,
  GripVertical,
  MessagesSquare,
  Network,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";

import { rescanOrgAction, saveOrgStructureAction } from "@/actions/org";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type {
  OrgCommunications,
  OrgCompanyNode,
  OrgGroupInput,
  OrgGroupNode,
  OrgPersonNode,
  OrgPoolMember,
  OrgStructure,
} from "@/lib/api/org";
import { cn } from "@/lib/utils";

// ---- communication helpers ----------------------------------------------
interface ContactRanking {
  rosterMemberId: string;
  name: string;
  weight: number;
  mentionCount: number;
  replyCount: number;
}

function topContactsFor(
  rosterMemberId: string | null,
  comms: OrgCommunications | undefined,
  limit = 5,
): ContactRanking[] {
  if (!rosterMemberId || !comms) return [];
  const nameById = new Map(comms.nodes.map((n) => [n.rosterMemberId, n.name]));
  return comms.edges
    .filter(
      (e) => e.source === rosterMemberId || e.target === rosterMemberId,
    )
    .map((e) => {
      const other = e.source === rosterMemberId ? e.target : e.source;
      return {
        rosterMemberId: other,
        name: nameById.get(other) ?? "Unknown",
        weight: e.weight,
        mentionCount: e.mentionCount,
        replyCount: e.replyCount,
      };
    })
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit);
}

function findPersonNodeByName(
  node: OrgCompanyNode | OrgPersonNode,
  name: string,
): OrgPersonNode | null {
  const target = name.trim().toLowerCase();
  for (const g of node.groups) {
    for (const p of g.people) {
      if (p.name.trim().toLowerCase() === target) return p;
      const deeper = findPersonNodeByName(p, name);
      if (deeper) return deeper;
    }
  }
  return null;
}

// ---- ids + helpers ------------------------------------------------------
let _oid = 0;
const oid = (p: string) => `${p}-new-${++_oid}`;
function initials(name: string) {
  return (name || "")
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ---- immutable tree ops -------------------------------------------------
function nodeById(
  node: OrgCompanyNode | OrgPersonNode,
  id: string,
): OrgCompanyNode | OrgPersonNode | null {
  if (node.id === id) return node;
  for (const g of node.groups) {
    for (const p of g.people) {
      const r = nodeById(p, id);
      if (r) return r;
    }
  }
  return null;
}

function mapNode<T extends OrgCompanyNode | OrgPersonNode>(
  node: T,
  id: string,
  fn: (n: OrgCompanyNode | OrgPersonNode) => OrgCompanyNode | OrgPersonNode,
): T {
  if (node.id === id) return fn(node) as T;
  if (!node.groups.length) return node;
  return {
    ...node,
    groups: node.groups.map((g) => ({
      ...g,
      people: g.people.map((p) => mapNode(p, id, fn)),
    })),
  };
}

function removeNode<T extends OrgCompanyNode | OrgPersonNode>(
  node: T,
  id: string,
): T {
  return {
    ...node,
    groups: node.groups.map((g) => ({
      ...g,
      people: g.people.filter((p) => p.id !== id).map((p) => removeNode(p, id)),
    })),
  };
}

function countReports(person: OrgCompanyNode | OrgPersonNode) {
  return person.groups.reduce((n, g) => n + g.people.length, 0);
}

function newPerson(
  name: string,
  role = "",
  rosterMemberId: string | null = null,
): OrgPersonNode {
  return { id: oid("p"), name, role: role || null, rosterMemberId, groups: [] };
}
function newGroup(name: string): OrgGroupNode {
  return { id: oid("g"), name, people: [] };
}

// serialize tree → input shape (drop ids; server regenerates)
function serializeGroups(groups: OrgGroupNode[]): OrgGroupInput[] {
  return groups.map((g) => ({
    name: g.name,
    people: g.people.map((p) => ({
      name: p.name,
      role: p.role,
      rosterMemberId: p.rosterMemberId,
      groups: serializeGroups(p.groups),
    })),
  }));
}

// ---- inline editors -----------------------------------------------------
function InlineEdit({
  value,
  onCommit,
  className,
  placeholder,
  disabled,
}: {
  value: string;
  onCommit: (v: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  if (disabled) {
    return <span className={className}>{value || placeholder}</span>;
  }
  if (editing) {
    return (
      <input
        className="org-inline-input"
        autoFocus
        value={draft}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          setEditing(false);
          const v = draft.trim();
          if (v && v !== value) onCommit(v);
          else setDraft(value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
          }
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
      />
    );
  }
  return (
    <span
      className={cn(className, "org-editable")}
      title="Click to rename"
      onClick={(e) => {
        e.stopPropagation();
        setDraft(value);
        setEditing(true);
      }}
    >
      {value || placeholder}
    </span>
  );
}

function AddInline({
  onAdd,
  label,
  placeholder,
  block,
  variant,
}: {
  onAdd: (v: string) => void;
  label: string;
  placeholder: string;
  block?: boolean;
  variant?: string;
}) {
  const [open, setOpen] = useState(false);
  const [v, setV] = useState("");
  if (!open) {
    return (
      <button
        className={cn("org-add-btn", block && "block", variant)}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
      >
        <Plus className="size-3.5" /> {label}
      </button>
    );
  }
  return (
    <form
      className={cn("org-add-form", block && "block")}
      onClick={(e) => e.stopPropagation()}
      onSubmit={(e) => {
        e.preventDefault();
        const t = v.trim();
        if (t) onAdd(t);
        setV("");
        setOpen(false);
      }}
    >
      <input
        className="org-inline-input"
        autoFocus
        placeholder={placeholder}
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => {
          if (!v.trim()) setOpen(false);
        }}
      />
      <Button type="submit" size="icon-sm" aria-label="Add">
        <Check className="size-3.5" />
      </Button>
    </form>
  );
}

// ---- handlers interface -------------------------------------------------
interface Handlers {
  canEdit: boolean;
  drillTo: (childId: string) => void;
  focusIndex: (i: number) => void;
  renamePerson: (id: string, key: "name" | "role", val: string) => void;
  renameGroup: (pid: string, gid: string, name: string) => void;
  addGroup: (pid: string, name: string) => void;
  removeGroup: (pid: string, gid: string) => void;
  addPerson: (pid: string, gid: string, name: string) => void;
  removePerson: (id: string) => void;
  dragStartPool: (id: string) => void;
  dragEnd: () => void;
  dragOverZone: (z: string) => void;
  dragLeaveZone: (z: string) => void;
  dropOnGroup: (pid: string, gid: string) => void;
  placeInFocused: (id: string) => void;
  placeSuggested: (member: OrgPoolMember) => void;
}

// ---- member row ---------------------------------------------------------
function OrgMember({ p, h }: { p: OrgPersonNode; h: Handlers }) {
  const reports = countReports(p);
  return (
    <div
      className="org-member"
      onClick={() => h.drillTo(p.id)}
      title={`Open ${p.name}'s team`}
    >
      <div className="org-member-main">
        <div className="org-member-name">{p.name}</div>
        {p.role ? <div className="org-member-role">{p.role}</div> : null}
      </div>
      {reports ? (
        <span className="org-member-count">
          <Users className="size-[11px]" /> {reports}
        </span>
      ) : null}
      {h.canEdit ? (
        <button
          className="org-act org-member-x"
          title="Remove from org"
          onClick={(e) => {
            e.stopPropagation();
            h.removePerson(p.id);
          }}
        >
          <X className="size-3.5" />
        </button>
      ) : null}
      <ChevronRight className="org-member-go size-[15px]" />
    </div>
  );
}

// ---- group section ------------------------------------------------------
function OrgSection({
  focused,
  g,
  h,
  dragOver,
}: {
  focused: OrgCompanyNode | OrgPersonNode;
  g: OrgGroupNode;
  h: Handlers;
  dragOver: string | null;
}) {
  return (
    <div
      className={cn("org-section org-zone", dragOver === g.id && "drop")}
      onDragOver={(e) => {
        e.preventDefault();
        h.dragOverZone(g.id);
      }}
      onDragLeave={() => h.dragLeaveZone(g.id)}
      onDrop={(e) => {
        e.preventDefault();
        h.dropOnGroup(focused.id, g.id);
      }}
    >
      <div className="org-section-head">
        <GitMerge className="org-section-ic size-3" />
        <InlineEdit
          value={g.name}
          className="org-section-name"
          placeholder="Group name"
          disabled={!h.canEdit}
          onCommit={(v) => h.renameGroup(focused.id, g.id, v)}
        />
        <span className="org-section-count">{g.people.length}</span>
        {h.canEdit ? (
          <button
            className="org-act org-section-x"
            title="Remove group"
            onClick={() => h.removeGroup(focused.id, g.id)}
          >
            <X className="size-3" />
          </button>
        ) : null}
      </div>
      <div className="org-members">
        {g.people.length ? (
          g.people.map((p) => <OrgMember key={p.id} p={p} h={h} />)
        ) : (
          <div className="org-empty">
            Empty group — add a person or drop a detected teammate here.
          </div>
        )}
      </div>
      {h.canEdit ? (
        <AddInline
          label="Add person"
          placeholder="Full name"
          onAdd={(name) => h.addPerson(focused.id, g.id, name)}
        />
      ) : null}
    </div>
  );
}

// ---- focused card -------------------------------------------------------
function OrgContacts({ contacts }: { contacts: ContactRanking[] }) {
  if (!contacts.length) return null;
  const max = contacts[0].weight || 1;
  return (
    <div className="org-contacts">
      <div className="org-contacts-head">
        <MessagesSquare className="size-3.5" /> Talks most with
        <span className="org-contacts-note">from Slack</span>
      </div>
      <div className="org-contacts-list">
        {contacts.map((c) => (
          <div key={c.rosterMemberId} className="org-contact">
            <span className="org-contact-name">{c.name}</span>
            <span className="org-contact-bar">
              <span
                className="org-contact-fill"
                style={{ width: `${Math.max(8, (c.weight / max) * 100)}%` }}
              />
            </span>
            <span className="org-contact-count" title="Interaction strength">
              {c.weight}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrgFocus({
  focused,
  depth,
  h,
  dragOver,
  contacts,
}: {
  focused: OrgCompanyNode | OrgPersonNode;
  depth: number;
  h: Handlers;
  dragOver: string | null;
  contacts: ContactRanking[];
}) {
  const reports = countReports(focused);
  const groups = focused.groups;
  const isCompany = "kind" in focused && focused.kind === "company";
  return (
    <div className="org-focus">
      <div className="org-focus-head">
        <div className="org-focus-id">
          <InlineEdit
            value={focused.name}
            className="org-focus-name"
            placeholder="Name"
            disabled={!h.canEdit}
            onCommit={(v) => h.renamePerson(focused.id, "name", v)}
          />
          <InlineEdit
            value={focused.role || ""}
            className="org-focus-role"
            placeholder={isCompany ? "Add a description" : "Add a role"}
            disabled={!h.canEdit}
            onCommit={(v) => h.renamePerson(focused.id, "role", v)}
          />
        </div>
        {depth > 0 && h.canEdit ? (
          <button
            className="org-act org-focus-x"
            title="Remove this person"
            onClick={() => h.removePerson(focused.id)}
          >
            <Trash2 className="size-3.5" />
          </button>
        ) : null}
      </div>
      <div className="org-focus-meta">
        {reports
          ? `${reports} ${reports === 1 ? "person" : "people"} across ${groups.length} ${groups.length === 1 ? "group" : "groups"}`
          : `No one reports to ${focused.name.split(" ")[0]} yet`}
      </div>
      <OrgContacts contacts={contacts} />
      <div className="org-sections">
        {groups.map((g) => (
          <OrgSection
            key={g.id}
            focused={focused}
            g={g}
            h={h}
            dragOver={dragOver}
          />
        ))}
      </div>
      {h.canEdit ? (
        <div className="org-focus-foot">
          <AddInline
            label="Add group"
            placeholder="Group name"
            block
            variant="ghosty"
            onAdd={(name) => h.addGroup(focused.id, name)}
          />
        </div>
      ) : null}
    </div>
  );
}

// ---- collapsed ancestor -------------------------------------------------
function OrgSpine({
  person,
  onClick,
}: {
  person: OrgCompanyNode | OrgPersonNode;
  onClick: () => void;
}) {
  return (
    <button
      className="org-spine"
      onClick={onClick}
      title={`Back to ${person.name}`}
    >
      <span className="org-spine-id">
        <span className="org-spine-name">{person.name}</span>
        {person.role ? (
          <span className="org-spine-role">{person.role}</span>
        ) : null}
      </span>
      <span className="org-spine-hint">{countReports(person)}</span>
    </button>
  );
}

// ---- detected pool ------------------------------------------------------
function OrgPoolChip({
  d,
  h,
  focusedName,
}: {
  d: OrgPoolMember;
  h: Handlers;
  focusedName: string;
}) {
  return (
    <div
      className="org-pool-person"
      draggable={h.canEdit}
      onDragStart={(e) => {
        h.dragStartPool(d.rosterMemberId);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", d.rosterMemberId);
      }}
      onDragEnd={h.dragEnd}
    >
      <GripVertical className="org-grip size-3.5" />
      <span className="org-pool-av">{initials(d.name)}</span>
      <div className="org-pool-main">
        <div className="org-pool-name">
          {d.name}
          {d.source ? (
            <span className="org-src">seen in {d.source}</span>
          ) : null}
        </div>
        <div className="org-pool-suggest">
          {d.reason || d.role || "New teammate"}
        </div>
        {d.suggestedGroupName || d.suggestedManagerName ? (
          <div className="org-pool-hint">
            <Sparkles className="size-3" />
            Suggested: {d.suggestedGroupName || "a group"}
            {d.suggestedManagerName ? ` · under ${d.suggestedManagerName}` : ""}
          </div>
        ) : null}
      </div>
      {h.canEdit ? (
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            d.suggestedGroupName || d.suggestedManagerName
              ? h.placeSuggested(d)
              : h.placeInFocused(d.rosterMemberId)
          }
          title={
            d.suggestedManagerName
              ? `Place under ${d.suggestedManagerName}`
              : `Add under ${focusedName}`
          }
        >
          <ArrowDown className="size-3.5" /> Place
        </Button>
      ) : null}
    </div>
  );
}

function OrgPool({
  pool,
  h,
  focusedName,
  onRescan,
  rescanning,
}: {
  pool: OrgPoolMember[];
  h: Handlers;
  focusedName: string;
  onRescan: () => void;
  rescanning: boolean;
}) {
  if (!pool.length) return null;
  return (
    <div className="org-pool">
      <div className="org-pool-head">
        <span className="org-pool-ic">
          <Sparkles className="size-[15px]" />
        </span>
        <span className="org-pool-title">Detected by Ceptly</span>
        <Badge variant="outline">{pool.length}</Badge>
        <span className="flex-1" />
        {h.canEdit ? (
          <Button variant="outline" size="sm" onClick={onRescan} disabled={rescanning}>
            <RefreshCw className={cn("size-3.5", rescanning && "animate-spin")} />{" "}
            Re-scan Slack
          </Button>
        ) : null}
      </div>
      <div className="org-pool-sub">
        Teammates Ceptly noticed in Slack, not yet placed. Drag one onto a group,
        or hit Place to drop them under whoever&apos;s in view.
      </div>
      <div className="org-pool-list">
        {pool.map((d) => (
          <OrgPoolChip
            key={d.rosterMemberId}
            d={d}
            h={h}
            focusedName={focusedName}
          />
        ))}
      </div>
    </div>
  );
}

// ---- main ---------------------------------------------------------------
interface OrgEditorProps {
  workspaceId: string;
  canEdit: boolean;
  initial: OrgStructure;
  communications?: OrgCommunications;
}

export function OrgEditor({
  workspaceId,
  canEdit,
  initial,
  communications,
}: OrgEditorProps) {
  const [root, setRoot] = useState<OrgCompanyNode>(initial.tree);
  const [path, setPath] = useState<string[]>([]);
  const [pool, setPool] = useState<OrgPoolMember[]>(initial.pool);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [rescanning, setRescanning] = useState(false);
  const [saving, startSave] = useTransition();
  const dragRef = useRef<string | null>(null);
  const navRef = useRef<HTMLDivElement | null>(null);

  const chain = useMemo(() => {
    const ids = path.length ? path : [root.id];
    const out: (OrgCompanyNode | OrgPersonNode)[] = [];
    for (const id of ids) {
      const n = nodeById(root, id);
      if (!n) break;
      out.push(n);
    }
    if (!out.length) out.push(root);
    return out;
  }, [root, path]);
  const focused = chain[chain.length - 1];

  const markDirty = () => {
    setDirty(true);
    setSaveError(null);
  };

  // remove a roster-linked person back into the pool when removed
  const personById = (id: string) => nodeById(root, id);

  const h: Handlers = useMemo(
    () => ({
      canEdit,
      drillTo: (childId) =>
        setPath((p) => [...(p.length ? p : [root.id]), childId]),
      focusIndex: (i) => setPath(chain.slice(0, i + 1).map((c) => c.id)),
      renamePerson: (id, key, val) => {
        setRoot((r) => mapNode(r, id, (n) => ({ ...n, [key]: val })));
        markDirty();
      },
      renameGroup: (pid, gid, name) => {
        setRoot((r) =>
          mapNode(r, pid, (n) => ({
            ...n,
            groups: n.groups.map((g) => (g.id === gid ? { ...g, name } : g)),
          })),
        );
        markDirty();
      },
      addGroup: (pid, name) => {
        setRoot((r) =>
          mapNode(r, pid, (n) => ({ ...n, groups: [...n.groups, newGroup(name)] })),
        );
        markDirty();
      },
      removeGroup: (pid, gid) => {
        setRoot((r) =>
          mapNode(r, pid, (n) => ({
            ...n,
            groups: n.groups.filter((g) => g.id !== gid),
          })),
        );
        markDirty();
      },
      addPerson: (pid, gid, name) => {
        setRoot((r) =>
          mapNode(r, pid, (n) => ({
            ...n,
            groups: n.groups.map((g) =>
              g.id === gid ? { ...g, people: [...g.people, newPerson(name)] } : g,
            ),
          })),
        );
        markDirty();
      },
      removePerson: (id) => {
        const person = personById(id);
        setRoot((r) => removeNode(r, id));
        setPath((p) => p.filter((x) => x !== id));
        // return a roster-linked person to the detected pool
        if (person && "rosterMemberId" in person && person.rosterMemberId) {
          setPool((pl) =>
            pl.some((x) => x.rosterMemberId === person.rosterMemberId)
              ? pl
              : [
                  ...pl,
                  {
                    rosterMemberId: person.rosterMemberId!,
                    name: person.name,
                    role: person.role,
                    source: "Slack",
                  },
                ],
          );
        }
        markDirty();
      },
      dragStartPool: (id) => {
        dragRef.current = id;
      },
      dragEnd: () => {
        dragRef.current = null;
        setDragOver(null);
      },
      dragOverZone: (z) => setDragOver((c) => (c === z ? c : z)),
      dragLeaveZone: (z) => setDragOver((c) => (c === z ? null : c)),
      dropOnGroup: (pid, gid) => {
        const id = dragRef.current;
        dragRef.current = null;
        setDragOver(null);
        if (!id) return;
        const d = pool.find((x) => x.rosterMemberId === id);
        if (!d) return;
        setRoot((r) =>
          mapNode(r, pid, (n) => ({
            ...n,
            groups: n.groups.map((g) =>
              g.id === gid
                ? {
                    ...g,
                    people: [
                      ...g.people,
                      newPerson(d.name, d.role || "", d.rosterMemberId),
                    ],
                  }
                : g,
            ),
          })),
        );
        setPool((pl) => pl.filter((x) => x.rosterMemberId !== id));
        markDirty();
      },
      placeInFocused: (id) => {
        const d = pool.find((x) => x.rosterMemberId === id);
        if (!d) return;
        setRoot((r) =>
          mapNode(r, focused.id, (n) => {
            const groups = n.groups.length
              ? n.groups
              : [newGroup("New hires")];
            const target = groups[0];
            return {
              ...n,
              groups: groups.map((g) =>
                g.id === target.id
                  ? {
                      ...g,
                      people: [
                        ...g.people,
                        newPerson(d.name, d.role || "", d.rosterMemberId),
                      ],
                    }
                  : g,
              ),
            };
          }),
        );
        setPool((pl) => pl.filter((x) => x.rosterMemberId !== id));
        markDirty();
      },
      placeSuggested: (member) => {
        const d = pool.find(
          (x) => x.rosterMemberId === member.rosterMemberId,
        );
        if (!d) return;
        // Host = the suggested manager if we can find them, else whoever's in view.
        const host: OrgCompanyNode | OrgPersonNode =
          (member.suggestedManagerName
            ? findPersonNodeByName(root, member.suggestedManagerName)
            : null) ?? focused;
        const wantGroup = member.suggestedGroupName?.trim().toLowerCase();
        setRoot((r) =>
          mapNode(r, host.id, (n) => {
            let groups = n.groups;
            let target =
              (wantGroup
                ? groups.find((g) => g.name.trim().toLowerCase() === wantGroup)
                : undefined) ?? groups[0];
            if (!target) {
              target = newGroup(member.suggestedGroupName || "New hires");
              groups = [...groups, target];
            }
            return {
              ...n,
              groups: groups.map((g) =>
                g.id === target!.id
                  ? {
                      ...g,
                      people: [
                        ...g.people,
                        newPerson(d.name, d.role || "", d.rosterMemberId),
                      ],
                    }
                  : g,
              ),
            };
          }),
        );
        setPool((pl) =>
          pl.filter((x) => x.rosterMemberId !== member.rosterMemberId),
        );
        markDirty();
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [root, chain, focused, pool, canEdit],
  );

  const focusedContacts = useMemo(
    () =>
      topContactsFor(
        "rosterMemberId" in focused ? focused.rosterMemberId : null,
        communications,
      ),
    [focused, communications],
  );

  const save = () => {
    setSaveError(null);
    startSave(async () => {
      const result = await saveOrgStructureAction(workspaceId, {
        name: root.name,
        groups: serializeGroups(root.groups),
      });
      if (result.error || !result.data) {
        setSaveError(result.error ?? "Failed to save.");
        return;
      }
      setRoot(result.data.tree);
      setPool(result.data.pool);
      setPath([]);
      setDirty(false);
    });
  };

  const rescan = () => {
    setRescanning(true);
    void rescanOrgAction(workspaceId).then((res) => {
      setRescanning(false);
      if (res.pool) setPool(res.pool);
    });
  };

  const MAX_VISIBLE = 3; // 2 ancestor spines + focused card
  const startIdx = Math.max(0, chain.length - MAX_VISIBLE);
  const spines = chain.slice(startIdx, -1);

  return (
    <div className="ceptly-section">
      <div className="ceptly-section-title flex items-center gap-2">
        <Network className="size-[15px]" /> Org &amp; who-does-what
        <span className="flex-1" />
        {dirty && canEdit ? (
          <Button size="sm" onClick={save} disabled={saving}>
            <Check className="size-3.5" /> {saving ? "Saving…" : "Save changes"}
          </Button>
        ) : null}
      </div>

      {saveError ? (
        <p className="mb-3 text-xs text-destructive">{saveError}</p>
      ) : null}

      <div className="org-ai-banner">
        <span className="org-ai-ic">
          <Sparkles className="size-[18px]" />
        </span>
        <div className="org-ai-main">
          <div className="org-ai-title">Ceptly keeps this org chart current</div>
          <div className="org-ai-sub">
            Everyone belongs to a group, and any person can hold their own groups
            of people. Click a teammate to focus them — their groups fan out to
            the right; click anyone in the trail to step back up. Rename, add,
            drag, or remove anytime.
          </div>
        </div>
      </div>

      <OrgPool
        pool={pool}
        h={h}
        focusedName={focused.name}
        onRescan={rescan}
        rescanning={rescanning}
      />

      <div className="org-nav" ref={navRef}>
        {spines.map((person, i) => (
          <span key={person.id} className="contents">
            <OrgSpine
              person={person}
              onClick={() => h.focusIndex(startIdx + i)}
            />
            <ChevronRight className="org-nav-sep size-4" />
          </span>
        ))}
        <OrgFocus
          focused={focused}
          depth={chain.length - 1}
          h={h}
          dragOver={dragOver}
          contacts={focusedContacts}
        />
      </div>
    </div>
  );
}
