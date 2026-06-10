"use client";

import { useMemo, useState } from "react";
import { Network } from "lucide-react";

import type { OrgCommunications } from "@/lib/api/org";

const VIEW = 760;
const CENTER = VIEW / 2;
const RADIUS = CENTER - 96;
const MAX_NODES = 24;

interface Placed {
  rosterMemberId: string;
  name: string;
  placed: boolean;
  x: number;
  y: number;
  degree: number;
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}

export function OrgCommMap({ communications }: { communications?: OrgCommunications }) {
  const [hovered, setHovered] = useState<string | null>(null);

  const { nodes, edges, maxWeight } = useMemo(() => {
    if (!communications || !communications.edges.length) {
      return { nodes: [] as Placed[], edges: [], maxWeight: 1 };
    }
    // Rank people by total interaction strength and keep the busiest.
    const degree = new Map<string, number>();
    for (const e of communications.edges) {
      degree.set(e.source, (degree.get(e.source) ?? 0) + e.weight);
      degree.set(e.target, (degree.get(e.target) ?? 0) + e.weight);
    }
    const ranked = [...communications.nodes]
      .filter((n) => degree.has(n.rosterMemberId))
      .sort(
        (a, b) =>
          (degree.get(b.rosterMemberId) ?? 0) -
          (degree.get(a.rosterMemberId) ?? 0),
      )
      .slice(0, MAX_NODES);

    const keep = new Set(ranked.map((n) => n.rosterMemberId));
    const placed: Placed[] = ranked.map((n, i) => {
      const angle = (i / ranked.length) * Math.PI * 2 - Math.PI / 2;
      return {
        rosterMemberId: n.rosterMemberId,
        name: n.name,
        placed: n.placed,
        x: CENTER + RADIUS * Math.cos(angle),
        y: CENTER + RADIUS * Math.sin(angle),
        degree: degree.get(n.rosterMemberId) ?? 0,
      };
    });
    const visibleEdges = communications.edges.filter(
      (e) => keep.has(e.source) && keep.has(e.target),
    );
    const maxWeight = Math.max(1, ...visibleEdges.map((e) => e.weight));
    return { nodes: placed, edges: visibleEdges, maxWeight };
  }, [communications]);

  const posById = useMemo(
    () => new Map(nodes.map((n) => [n.rosterMemberId, n])),
    [nodes],
  );

  if (!nodes.length) {
    return (
      <div className="org-map org-map-empty">
        <Network className="size-5 opacity-60" />
        <p>
          No communication data yet. Run a Slack re-scan below and Ceptly will map
          who talks to whom across your channels.
        </p>
      </div>
    );
  }

  return (
    <div className="org-map">
      <div className="org-map-head">
        <Network className="size-[15px]" /> Communication map
        <span className="org-map-note">
          Edge thickness = how often they talk in Slack
        </span>
      </div>
      <svg
        className="org-map-svg"
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        role="img"
        aria-label="Communication relationship map"
      >
        <g>
          {edges.map((e, i) => {
            const a = posById.get(e.source);
            const b = posById.get(e.target);
            if (!a || !b) return null;
            const active =
              !hovered || hovered === e.source || hovered === e.target;
            return (
              <line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                className="org-map-edge"
                strokeWidth={1 + (e.weight / maxWeight) * 5}
                style={{ opacity: active ? 0.18 + (e.weight / maxWeight) * 0.5 : 0.05 }}
              />
            );
          })}
        </g>
        <g>
          {nodes.map((n) => {
            const r = 5 + Math.min(7, (n.degree / maxWeight) * 4);
            const active = !hovered || hovered === n.rosterMemberId;
            return (
              <g
                key={n.rosterMemberId}
                className="org-map-node"
                onMouseEnter={() => setHovered(n.rosterMemberId)}
                onMouseLeave={() => setHovered(null)}
                style={{ opacity: active ? 1 : 0.35 }}
              >
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={r}
                  className={n.placed ? "org-map-dot placed" : "org-map-dot"}
                />
                <text
                  x={n.x}
                  y={n.y - r - 6}
                  textAnchor="middle"
                  className="org-map-label"
                >
                  {firstName(n.name)}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      <div className="org-map-legend">
        <span className="org-map-key">
          <span className="org-map-dot placed legend" /> In the org chart
        </span>
        <span className="org-map-key">
          <span className="org-map-dot legend" /> Detected, unplaced
        </span>
      </div>
    </div>
  );
}
