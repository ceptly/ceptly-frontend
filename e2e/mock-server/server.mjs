// @ts-check
/**
 * Stub backend for E2E. The Next app points NEXT_PUBLIC_API_URL / API_URL here,
 * so every backend call (SSR, server actions, proxy routes) is intercepted at
 * the network boundary and answered deterministically — no real Postgres,
 * Slack, Stripe, or Gemini.
 *
 * Strategy: a small set of explicit fixtures for the endpoints our specs assert
 * against, plus a permissive catch-all (`{ success: true, data: {} }`) so an
 * unmodelled call never crashes a page render. Tighten fixtures as specs grow.
 *
 * Plain Node ESM (.mjs) so it runs with `node` — no TS/tsx toolchain needed.
 */
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const PORT = Number(process.env.MOCK_PORT ?? 4500);
const dataDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../fixtures/data",
);

const fixture = (name) =>
  JSON.parse(readFileSync(path.join(dataDir, name), "utf8"));

const dashboard = fixture("dashboard.json");
const billing = fixture("billing.json");
const personas = fixture("personas.json");
const workspace = fixture("workspace.json");
const meUser = fixture("user.json");
const chatChannels = fixture("chat-channels.json");
const roster = fixture("roster.json");
const appContexts = fixture("app-contexts.json");
const slackChannels = fixture("slack-channels.json");

/** Stable UUIDs for E2E — must pass z.string().uuid() in server actions. */
const E2E_SESSION_ID = "00000000-0000-4000-a000-000000000020";
const E2E_ROSTER_MEMBER_ID = roster.members[0].id;

const json = (res, status, body) => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
};

/** The inline agent-deploy form the chat returns for a standup request. */
const AGENT_FORM_VALUES = {
  destination: "channel",
  trigger: "scheduled",
  name: "Daily Standup",
  persona_preset: "scrum_master",
  channel_style: "broadcast",
  channel_id: "C123",
  frequency: "specific_days",
  days_of_week: [1, 2, 3, 4, 5],
  time_local: "09:00",
  roster_member_ids: [E2E_ROSTER_MEMBER_ID],
  result_channel_ids: [],
  result_roster_dm_ids: [],
  context_integrations: ["linear"],
};

/** Replay the chat SSE protocol: a status tick, then a `done` carrying the
 *  inline agent_form UI component (see lib/api/workspace-chat-stream.ts). */
const streamAgentForm = (res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });
  const send = (event) => res.write(`data: ${JSON.stringify(event)}\n\n`);
  send({ type: "status", label: "Thinking about your request" });
  send({ type: "text_delta", delta: "I'll set up a daily standup for your team." });
  send({
    type: "done",
    assistant_message: "I'll set up a daily standup for your team. Review and deploy:",
    agent: "meeting_creator",
    ui_component: { type: "agent_form", values: AGENT_FORM_VALUES },
    session_id: E2E_SESSION_ID,
  });
  res.end();
};

/** [method, RegExp, handler] — first match wins. */
const routes = [
  ["GET", /^\/health$/, (res) => json(res, 200, { status: "ok" })],

  // Auth
  ["POST", /^\/api\/auth\/login$/, (res) =>
    json(res, 200, {
      success: true,
      data: {
        user: meUser,
        session: {
          access_token: "e2e-access-token",
          refresh_token: "e2e-refresh-token",
          expires_at: Date.now() + 86_400_000,
        },
      },
    }),
  ],
  ["GET", /^\/api\/auth\/me$/, (res) =>
    json(res, 200, { success: true, data: { user: meUser } }),
  ],

  // Workspace + feature data
  ["GET", /^\/api\/workspaces$/, (res) =>
    json(res, 200, { success: true, data: { workspaces: [workspace] } }),
  ],
  ["GET", /^\/api\/personas$/, (res) =>
    json(res, 200, { success: true, data: { personas } }),
  ],
  ["GET", /^\/api\/workspaces\/[^/]+\/dashboard/, (res) =>
    json(res, 200, { success: true, data: dashboard }),
  ],
  ["GET", /^\/api\/workspaces\/[^/]+\/billing/, (res) =>
    json(res, 200, { success: true, data: billing }),
  ],
  ["GET", /^\/api\/workspaces\/[^/]+\/roster/, (res) =>
    json(res, 200, { success: true, data: roster }),
  ],
  ["GET", /^\/api\/workspaces\/[^/]+\/chat\/channels$/, (res) =>
    json(res, 200, { success: true, data: chatChannels }),
  ],
  ["GET", /^\/api\/workspaces\/[^/]+\/communication$/, (res) =>
    json(res, 200, { success: true, data: chatChannels }),
  ],
  ["GET", /^\/api\/workspaces\/[^/]+\/slack\/channels$/, (res) =>
    json(res, 200, { success: true, data: slackChannels }),
  ],
  ["GET", /^\/api\/workspaces\/[^/]+\/timezone$/, (res) =>
    json(res, 200, {
      success: true,
      data: { timezone: workspace.timezone ?? "America/Chicago" },
    }),
  ],
  ["GET", /^\/api\/workspaces\/[^/]+\/conversations\/app-contexts$/, (res) =>
    json(res, 200, { success: true, data: appContexts }),
  ],
  ["GET", /^\/api\/workspaces\/[^/]+\/chat\/sessions$/, (res) =>
    json(res, 200, { success: true, data: { sessions: [] } }),
  ],
  ["POST", /^\/api\/workspaces\/[^/]+\/chat\/sessions\/[^/]+\/deployed$/, (res) =>
    json(res, 200, { success: true }),
  ],
  ["GET", /^\/api\/workspaces\/[^/]+\/agents$/, (res) =>
    json(res, 200, { success: true, data: { agents: [] } }),
  ],

  // Follow-ups (Pro feature) — minimal fixtures so activity + management UI render.
  // The handler inspects ?agent_id (if present) so the agent detail page E2E gets
  // the row only when viewing the matching agent; other agents see [] (no phantom
  // follow-ups).
  ["GET", /^\/api\/workspaces\/[^/]+\/follow-ups$/, (res, rawUrl = "") => {
    const qs = rawUrl.includes("?") ? rawUrl.split("?")[1] : "";
    const agentId = new URLSearchParams(qs).get("agent_id");
    const fixtureRow = {
      id: "00000000-0000-4000-a000-0000000000f1",
      member_name: "Alex Chen",
      agent_id: "00000000-0000-4000-a000-000000000030",
      agent_name: "Daily Standup",
      item_text: "Finish the API spec",
      scheduled_for: "2026-06-18T10:00:00.000Z",
      status: "pending",
    };
    const followUps =
      !agentId || agentId === fixtureRow.agent_id ? [fixtureRow] : [];
    json(res, 200, { success: true, data: { follow_ups: followUps } });
  }],
  ["PATCH", /^\/api\/workspaces\/[^/]+\/follow-ups\/[^/]+$/, (res) =>
    json(res, 200, {
      success: true,
      data: { scheduled_for: "2026-06-19T09:00:00.000Z" },
    }),
  ],
  ["DELETE", /^\/api\/workspaces\/[^/]+\/follow-ups\/[^/]+$/, (res) =>
    json(res, 200, { success: true }),
  ],

  // Playground (in-app agent runs) — empty but shape-safe so pages don't explode
  ["GET", /^\/api\/workspaces\/[^/]+\/playground\/agents$/, (res) =>
    json(res, 200, { success: true, data: { agents: [] } }),
  ],
  ["GET", /^\/api\/workspaces\/[^/]+\/playground\/conversations$/, (res) =>
    json(res, 200, { success: true, data: { conversations: [] } }),
  ],
  ["GET", /^\/api\/workspaces\/[^/]+\/playground\/conversations\/[^/]+$/, (res) =>
    json(res, 200, {
      success: true,
      data: {
        conversation: {
          session: {
            sessionId: "00000000-0000-4000-a000-000000000021",
            agentId: "00000000-0000-4000-a000-000000000031",
            agentName: "Playground Demo",
            destination: "dm",
            style: null,
            status: "active",
            startedAt: "2026-06-16T12:00:00.000Z",
            completedAt: null,
          },
          participants: [],
          messages: [],
        },
      },
    }),
  ],
  ["DELETE", /^\/api\/workspaces\/[^/]+\/playground\/conversations\/[^/]+$/, (res) =>
    json(res, 200, { success: true }),
  ],
  ["POST", /^\/api\/workspaces\/[^/]+\/playground\/run$/, (res) =>
    json(res, 200, {
      success: true,
      data: { sessionId: "00000000-0000-4000-a000-000000000021" },
    }),
  ],
  ["POST", /^\/api\/workspaces\/[^/]+\/playground\/conversations\/[^/]+\/reply$/, (res) =>
    json(res, 200, { success: true, data: { handled: true } }),
  ],

  // Chat + agent deploy (the flagship flow)
  ["POST", /^\/api\/workspaces\/[^/]+\/chat\/stream$/, streamAgentForm],
  ["POST", /^\/api\/workspaces\/[^/]+\/agents$/, (res) =>
    json(res, 201, {
      success: true,
      data: {
        destination: "channel",
        agentId: "00000000-0000-4000-a000-000000000030",
      },
    }),
  ],
];

const server = createServer((req, res) => {
  const rawUrl = req.url ?? "";
  const url = rawUrl.split("?")[0];
  const method = req.method ?? "GET";

  const match = routes.find(
    ([m, pattern]) => m === method && pattern.test(url),
  );

  // Drain the request body so keep-alive sockets don't stall.
  req.on("data", () => {});
  req.on("end", () => {
    if (match) {
      match[2](res, rawUrl);
      return;
    }
    // Permissive default keeps unmodelled pages from crashing.
    json(res, 200, { success: true, data: {} });
  });
});

server.listen(PORT, () => {
  console.log(`[e2e mock backend] listening on http://localhost:${PORT}`);
});
