# Deploy-an-Agent page + unified agent model

## Context

Ceptly has grown several overlapping "things the user deploys": scheduled check-ins
(`scheduledConversations`, kind `scheduled`), one-off reach-outs (`scheduledConversations`,
kind `adhoc`, via `/adhoc-conversation/commit`), and channel standups (`standups`). Each has its
own table, routes, services, members/sessions tables, and its own UI surface (`/agents/new`,
`/activity/new`, `/settings/standups`). The current `/agents/new` only deploys 2 of these and has
no preview/summary/test.

The Claude Design handoff (`app.ceptly.ai-handoff (1).zip` → `DeployDirections.jsx` `DirectionA`)
specifies a single **Deploy an agent** page: a split layout with a config form on the left and a
sticky rail on the right showing a **generated live preview** (the first Slack message the agent
would send), a **Summary**, and a deploy bar with **Deploy agent** + **Test** buttons.

Goal: (1) rebuild `/agents/new` to match `DirectionA`, with a backend-generated live preview, a
config summary, and a Test button that fires the agent once with no schedule and no saved agent;
(2) unify the three agent definitions into **one `agents` model** on the backend so every Ceptly
feature is "an agent you deploy," driven from this one page.

Decisions confirmed with the user: three agent types (**check-in, reach-out, channel standup** —
no "custom autonomous"); **Test = true dry-run** (run once, persist no recurring agent); **full
backend refactor into one agent model**.

Design source (extracted): `/tmp/ceptly-design/app-ceptly-ai/project/app/` — key files
`DeployDirections.jsx` (`DirectionA`/`AgentDeployForm`), `AgentKit.jsx` (all the pieces), `agents.css`
(exact styles). Note `AGENTS.md`: this Next.js has breaking changes — consult
`node_modules/next/dist/docs/` before writing app/router code.

---

## Phase 1 — Backend: unify the agent definition model

Merge the _definition/config_ of all three features into one table. Keep the runtime/session
tables specialized (a DM transcript and a channel thread are genuinely different shapes) but
repoint their owning FK to the new `agents` table.

### New schema (`src/db/schema/agent.ts`)

`agents` table = superset of the shared columns of `scheduledConversations` + `standups`:

- `id`, `workspaceId`
- `kind` enum `agent_kind` = `['checkin','reachout','standup']`
- `triggerMode` enum `agent_trigger_mode` = `['schedule','manual','event']` (new — encodes
  reach-out/one-off vs recurring without a separate `kind`)
- `name`, `summary`, `templateId`
- `agentPersona`, `conversationGoal`, `agentNotes`, `personaPreset`
- `intent` enum (`gather`/`inform`, reuse `conversationIntentEnum`)
- `contextIntegrations text[]`, `resultDestinations jsonb`
- `timezone`, `scheduleFrequency`, `scheduleDays`, `scheduleTime`, `scheduleEnabled`
- `channelId` (nullable; standup), `style` enum (nullable; standup, reuse `standupStyleEnum`)
- `lastFireAt`, `sortOrder`, `createdAt`, `updatedAt`

Plus unified children:

- `agent_members` (`agentId`, `rosterMemberId`, `sortOrder`) — replaces
  `scheduledConversationMembers` + `standupMembers`.
- `agent_questions` — `conversationQuestions` with the FK column renamed to `agentId`.

Repoint existing runtime tables' owning FK to `agents.id` (rename column, keep the rest):
`conversationRuns.conversationId → agentId`, `checkinSessions.scheduledConversationId → agentId`,
`standupSessions.standupId → agentId`. `standupSessionMessages`, `checkinMessages` unchanged.

### Migration (`drizzle/`)

Generate with `npm run db:generate` then hand-edit the SQL to **migrate data, not drop it**:

1. create `agents` + `agent_members` + `agent_questions`;
2. `INSERT INTO agents` from `scheduled_conversations` (kind from existing `kind`: `scheduled`→
   `checkin`, `adhoc`→`reachout`; `triggerMode` = `schedule` for checkin, `manual` for reachout)
   and from `standups` (kind `standup`, triggerMode `schedule`), preserving ids;
3. copy members/questions into the unified children (preserve ids so session FKs still resolve);
4. add new `agent_id` columns to the three runtime tables, backfill from old FK, swap NOT
   NULL/constraints, drop old columns;
5. drop the old definition tables last.

### Services / routes

- Add `src/services/agent-service.ts`: `listAgents`, `getAgent`, `createAgent`, `updateAgent`,
  `deleteAgent`, `setAgentEnabled` working on the unified table; an `AgentDefinition` type that the
  run services consume.
- Refactor `scheduler-service.ts` + `standup-scheduler-service.ts` to read from `agents` filtered by
  `kind`/`scheduleEnabled` (logic in `isDueNow` is unchanged).
- Refactor `agent-run-service.ts`, `checkin-service.ts` (`startCheckin`), and
  `standup-session-service.ts` (`startStandupSession`) to accept **either** an `agentId` (load from
  DB) **or** an inline `AgentDefinition` (test/dry-run, no DB definition row). Sessions/runs are
  still created so the live Slack interaction works.
- New route file `src/routes/agents.ts` mounted at
  `/api/workspaces/:workspaceId/agents` in `src/app.ts` (alongside, then replacing, the
  `conversations`/`standups`/`adhoc` routers):
  - `GET /` list, `GET /:id`, `POST /` create, `PATCH /:id`, `DELETE /:id`, `POST /:id/run`,
    `POST /:id/enabled` — thin wrappers over `agent-service` + `agent-run-service`.
  - `POST /preview` — **generated live preview**. Body = draft config (kind, persona/goal, intent,
    contextIntegrations, first recipient {name,email}, channel, name, style). Returns
    `{ opener: string }` by calling `generateCheckinOpeningMessage`
    (`checkin-conversation-agent.ts:458`, checkin/reachout) or `generateStandupOpeningMessages`
    (`standup-turn-service.ts:340`, standup). No persistence.
  - `POST /test` — **dry-run**. Body = full draft config → build an inline `AgentDefinition` →
    `startCheckin`/`startStandupSession` in inline mode. Creates the runtime session (so the user
    sees the real Slack DM/thread) but **no `agents` row**. Returns `{ sessionsStarted }`.

Keep `WORKSPACE_MANAGE_ROLES` auth on all of these (reuse `assertManageAccess`).

### Compatibility

Update the existing `conversations`/`standups`/`adhoc` routers to delegate to `agent-service`
(so the rest of the app keeps working during/after migration), or migrate their callers to the
new endpoints. Prefer delegating to minimize blast radius; remove dead code once the frontend is
fully on `/agents`.

---

## Phase 2 — Frontend API + actions

- `lib/api/agents.ts`: `listAgents`, `getAgent`, `createAgent`, `updateAgent`, `deleteAgent`,
  `runAgentNow`, `setAgentEnabled`, `previewAgent(draft)`, `testAgent(draft)`. Model on existing
  `lib/api/conversations.ts` / `standups.ts` (same `parseJsonResponse` + `resolveApiBaseUrl`
  pattern). Add an `AgentDraft` / `Agent` type to `lib/api/types.ts`.
- `actions/agents.ts` (extend the existing file): add `deployAgentAction(draft)`,
  `previewAgentAction(draft)`, `testAgentAction(draft)` (server actions; reuse `getAccessToken`).
- `lib/agents.ts`: extend `AgentKind` to `'checkin' | 'reachout' | 'standup'` and the
  `AGENT_KINDS` array to the three design types (names/descs/icons from `AgentKit.jsx`
  `AGENT_TYPES`). Keep `SCHEDULE_PRESETS`, persona helpers.

---

## Phase 3 — Frontend: rebuild `/agents/new` to DirectionA

`app/(dashboard)/agents/new/page.tsx` loader stays (swap data fns to the agents API where useful;
roster/channels/appContext loads are unchanged). Rebuild the components:

- **`components/agents/agent-deploy-form.tsx`** → DirectionA shell: back button + header +
  `.ag-split` grid (`1fr 372px`): left `.ag-form`, right sticky `.ag-rail`.
- **Left form** — reuse existing section components, now with 3 types:
  - Agent type: 3-card grid (`agentTypeCardVariants`, already used) — check-in / reach-out / standup.
  - Persona: existing pretrained/custom toggle + role/goal/notes.
  - Standup-only: style pills (broadcast/sequential).
  - Audience: `RecipientChipsPicker` (recipients/participants) + `ChannelChipsPicker` (channel for
    standup / rollups) + DM rollups — all existing.
  - Trigger: `TriggerScheduleSection` (existing; reach-out defaults to `manual`).
  - Details: name + `AppContextPicker` (existing — this is the "app context / context tools" the
    user referenced; already wired).
- **Right rail** — new components:
  - `components/agents/slack-preview.tsx` (port `SlackPreview`): shows the generated opener. Calls
    `previewAgentAction` via a debounced effect **once all required fields for the chosen type are
    complete** (name + audience + persona/goal valid + channel for standup); shows a skeleton while
    generating and re-generates on meaningful changes. Renders the returned `opener` (markdown-ish
    Slack styling per `.ag-slack*`).
  - `components/agents/config-summary.tsx` (port `ConfigSummary`): Type / Goal / Audience / Channel
    / Trigger rows (`.ag-summary`).
  - `components/agents/deploy-bar.tsx` (port `DeployBar`): **Deploy agent** (primary) calls
    `deployAgentAction` then routes to `/agents?deployed=<kind>`; **Test** (outline, flask icon)
    calls `testAgentAction` with the current draft, shows a running/toast state ("Test started —
    check Slack"), disabled until required fields complete.
- **`components/agents/agent-deployed-dialog.tsx`**: confetti success dialog already exists — keep,
  ensure it fires on deploy.

Validation reuses the current `handleDeploy` checks in `agent-deploy-fields.tsx`; fold its logic
into the new form (don't keep both).

### CSS (`app/globals.css`)

Many `.ag-*` classes already exist (`.ag-head`, `.ag-type*`, `.ag-divider`, `.ag-modal*`,
`.ag-check*`, `.ag-confetti`, agent-row). Add the **missing** ones from design `agents.css`:
`.ag-split`, `.ag-form`, `.ag-rail`, `.ag-group-sub`, `.ag-chips`, `.ag-chip`, `.ag-chip-x`,
`.ag-chip-add`, `.ag-chip-hash`, `.ag-pill`, `.ag-cadence`, `.ag-preview`, `.ag-preview-head`,
`.ag-slack`, `.ag-slack-body/name/tag/time/msg`, `.ag-tok`, `.ag-summary`, `.ag-sum-row/k/v`,
`.ag-deploy-bar`, `.ag-toast*`, plus the `@media (max-width:760px)` stack rule. Copy values verbatim
from `/tmp/ceptly-design/app-ceptly-ai/project/app/agents.css`; tokens (`--green-ink`,
`--card-glass`, `--border-strong`, etc.) already exist in `globals.css`.

---

## Phase 4 — Consolidate the other entry points

So "every Ceptly feature is an agent deployed from this page":

- Point `/activity/new` (reach-out) and `/settings/standups` "new" CTAs at `/agents/new` (preselect
  type via `?type=reachout|standup`). Keep edit/detail pages working against the agents API.
- `agents-list.tsx` + `lib/agents.ts` row mappers read unified `agents`; pause/run actions call the
  agents API.

---

## Verification

Backend (`/home/michaelehmke/Projects/ceptly-backend`):

- `npm run db:generate` review SQL; apply to a scratch DB (`npm run db:migrate` or the project's
  script) and confirm existing rows land in `agents` with correct `kind`/`triggerMode` and that
  session/run FKs still resolve.
- `npm run build` (tsc) clean. Hit `POST /api/workspaces/:id/agents/preview` and `/test` with curl
  - a real workspace token; confirm `/preview` returns a generated opener and `/test` posts a real
    Slack DM/thread with **no** new `agents` row.
- Re-run an existing scheduler tick locally (`/internal/checkin-scheduler`, `/internal/standup-
scheduler` with `X-Cron-Secret`) to confirm scheduled agents still fire from the unified table.

Frontend (`/home/michaelehmke/Projects/ceptly2`):

- `npm run build` + `npm run lint` clean.
- Run the app; at `/agents/new`: pick each of the 3 types, fill required fields, confirm the live
  preview generates (and re-generates on edits), the summary updates, **Test** triggers a one-off
  Slack run, and **Deploy** creates a recurring agent + shows the confetti dialog and lands on
  `/agents`. Verify deployed agent appears in `/agents` and on schedule.
- Use the `verify`/`run` skill to drive the app and confirm the split layout matches `DirectionA`
  at desktop and stacks under 760px.
