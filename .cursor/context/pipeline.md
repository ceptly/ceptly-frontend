# Ceptly — User Story Pipeline

**Sources:** [prd.md](./prd.md) · [spec.md](./spec.md) · [conversation.md](./conversation.md)  
**Repos:** `ceptly2` (Next.js / Vercel) · `ceptly-backend` (Express / Render)  
**Last updated:** May 2026

Use this file as the execution checklist. Check items when shipped and verified in staging or with one real team.

---

## Legend

| Symbol | Meaning |
|--------|---------|
| `[ ]` | Not started |
| `[~]` | In progress (optional — replace with `[x]` when done) |
| `[x]` | Done |

**Phase gates:** Do not start the next phase until the previous phase’s “Phase complete” box is checked.

---

## Phase 0 — Platform & Auth (foundation)

**Goal:** Vercel app and Render API share auth; workspace exists in Postgres.

### User stories

- [ ] **As a founder**, I can sign up and sign in on the web app so I can configure Ceptly for my team.
- [ ] **As a founder**, my session is validated on every API call so the backend remains the single trust boundary.

### Tasks

**Backend (`ceptly-backend`)**

- [x] Express scaffold + `GET /health`
- [x] Drizzle + Postgres connection
- [ ] `workspaces` table with:
    - schedule columns: `timezone`, `days`, `time`, `frequency`, idempotency field (e.g. `last_checkin_schedule_fire_at`)
    - `team_members` column (associates multiple users to a workspace)
    - unique constraint or composite primary key as necessary for integrity
    - workspace `name` (display), `created_at`, `updated_at`
    - foreign key to organization (if multi-org/future-proofing)
    - migration or seed for first workspace in dev
- [x] User auth routes (`/api/auth/*`) + JWT
- [ ] Link authenticated user → workspace (membership / role model)
- [ ] Seed script or admin path for first test workspace

**Frontend (`ceptly2`)**

- [x] Auth page (sign in / sign up)
- [x] Auth cookies + server session helpers
- [x] `NEXT_PUBLIC_API_URL` wired to backend
- [ ] Post-login redirect to home (not stuck on `/auth`)
- [ ] Protected routes for settings / dashboard (middleware or layout guard)

### Phase complete

- [ ] Founder can register, log in, and hit a protected page that calls the API with a valid token.

---

## Phase 1 — Check-In Core Loop (Weeks 1–4)

**Goal:** Scheduled Slack DMs → conversational check-in → responses stored. One real team can run a week.

**Spec reference:** [spec.md §9](./spec.md) (build order 1–6, acceptance criteria).

### User stories — Individual contributor

- [ ] **As an IC**, I receive a short conversational check-in in Slack DM on the days my team configured, so I can report status without a meeting.
- [ ] **As an IC**, the check-in feels like a chat, not a form, so I actually reply.
- [ ] **As an IC**, I can flag a blocker in natural language so leadership can hear it without me escalating manually.

### User stories — Founder / team lead

- [ ] **As a founder**, I can set check-in days, time, frequency, and workspace timezone in Settings so the schedule fits my team.
- [ ] **As a founder**, I see a preview of when check-ins run in local time so I don’t misconfigure timezone.
- [ ] **As a founder**, I can add ICs to a roster (Slack user mapping) so the agent knows who to DM.
- [ ] **As a founder**, I can designate `#leadership-digest` (or equivalent) for digests and alerts.
- [ ] **As a founder**, I get a weekly digest in Slack summarizing what everyone is working on (manual trigger OK for Phase 1 end).
- [ ] **As a founder**, I am alerted in Slack when someone reports a blocker during a check-in.

### Tasks

**Backend**

- [ ] `GET` / `PUT` `/api/workspaces/:id/schedule` (auth + founder/admin only)
- [ ] Roster schema + CRUD (IC Slack user id, display name, paused/opt-out flags)
- [ ] Check-in session + response storage schema
- [ ] Re-enable `POST /internal/checkin-scheduler` with `X-Cron-Secret` (401 without secret)
- [ ] Due-window algorithm per workspace timezone (§7.1 in spec)
- [ ] Idempotency: no double-DM in same 15-minute window (`last_checkin_schedule_fire_at`)
- [ ] Render Cron Job: `*/15 * * * *` → scheduler endpoint
- [ ] Slack app: OAuth install, bot token, signing secret
- [ ] Check-In Agent: DM opener + default question set (hardcoded v1)
- [ ] Persist each turn; mark session complete
- [ ] Blocker detection on response → post to leadership channel
- [ ] Manual/internal endpoint or script to trigger synthesis digest (stub OK)

**Frontend**

- [ ] Settings → **Check-in schedule** section (days, time, frequency, timezone)
- [ ] Local time preview string (“9:00 AM Central Time”)
- [ ] Save/load schedule via schedule API
- [ ] Settings → **Team roster** (minimal list + add Slack member)
- [ ] Settings → **Slack connection** (install app / team linked indicator)
- [ ] Settings → **Digest channel** picker (or channel id field)

### Acceptance (from spec §9.2)

- [ ] Founder sets Mon+Thu, 9:00 AM, workspace timezone in UI; reload persists
- [ ] Timezone change updates preview without redeploying cron
- [ ] Wrong cron secret → 401, no DMs
- [ ] Correct secret → DMs only workspaces due in local window
- [ ] Same workspace not double-triggered within one 15-minute window

### Phase complete

- [ ] One real team completes at least one full check-in cycle (scheduled DM → replies → data in DB → digest or blocker alert visible to founder).

---

## Phase 2 — Question Editor + Intelligence (Weeks 5–8)

**Goal:** Managers own questions; synthesis, alerts, and Q&A run without manual triggers.

### User stories — Question Editor

- [ ] **As a founder**, I tell Ceptly what I care about (e.g. sprint progress + team energy) and get a suggested question set I can customize.
- [ ] **As a manager**, I add custom questions so check-ins reflect what matters now.
- [ ] **As a manager**, I reorder questions so the most important are asked first.
- [ ] **As a manager**, I preview what the agent will say to an IC before publishing.
- [ ] **As a manager**, active question set changes apply on the next scheduled check-in.

### User stories — Executive / founder (Slack + web)

- [ ] **As a founder**, I receive an automated weekly digest in `#leadership-digest` without triggering it manually.
- [ ] **As a founder**, I get a real-time alert when an IC reports a blocker (refine detection beyond keywords).
- [ ] **As a founder**, I get an alert when an IC misses 2+ consecutive check-ins (disengagement).
- [ ] **As a founder**, I ask questions in Slack DM to the Q&A agent and get answers grounded in stored check-in data only.
- [ ] **As an executive**, I talk to a Strategy Agent in the web app and get text answers (charts optional shell; check-in data only).

### Tasks

**Backend**

- [ ] Question sets schema (versioning, active flag, order, prompt text)
- [ ] Question set API: CRUD, reorder, activate version
- [ ] AI Question Suggester endpoint (goal → suggested questions via Claude)
- [ ] Check-In Agent reads active question set (not hardcoded)
- [ ] `/internal/synthesis-scheduler` (same cron pattern as check-in)
- [ ] Synthesis Agent: digest generation + post to digest channel
- [ ] Disengagement alert job
- [ ] Q&A Agent (Slack DM): RAG over stored responses only; no unsourced claims
- [ ] Strategy chat API for web (streaming optional v2)

**Frontend**

- [ ] Question Editor page: list, create, edit, reorder, toggle active
- [ ] “Suggest questions” flow (goal input → review → save set)
- [ ] “Preview as IC” panel
- [ ] Home / dashboard: Strategy Agent chat shell wired to API
- [ ] Team Health strip placeholder (check-in sentiment only)

### Phase complete

- [ ] Founder customizes questions, previews, publishes; next check-in uses new set; weekly digest and Q&A work in Slack; web chat returns synthesized answers from real data.

---

## Phase 3 — Polish & Retention (Weeks 9–12)

**Goal:** Better questions, trends, and workspace onboarding.

### User stories

- [ ] **As a manager**, I see which questions ICs skip or answer briefly so I can improve them.
- [ ] **As a manager**, I can restore a previous question set version after a bad edit.
- [ ] **As a founder**, I see workload and sentiment trends over time for the team.
- [ ] **As an IC**, check-in follow-ups reference my prior answers (e.g. blocker update).
- [ ] **As an IC**, I can pause check-ins or opt out temporarily (`/ceptly pause` or equivalent).
- [ ] **As a new workspace**, I get guided onboarding (Slack install, timezone, roster, digest channel, default schedule).

### Tasks

- [ ] Question analytics (response rate, skip rate, avg length per question)
- [ ] Question set version history + restore
- [ ] Trend aggregates API + simple charts in web app
- [ ] Adaptive follow-up in Check-In Agent (prior session context)
- [ ] IC Slack commands: pause / resume / status
- [ ] Workspace onboarding wizard in Next.js
- [ ] Resolve PRD open questions: digest visible to ICs? contractors in roster?

### Phase complete

- [ ] Team runs 4+ weeks with measurable check-in completion; manager uses analytics to tune questions; onboarding works without engineer hand-holding.

---

## Phase 4 — Linear & Capacity (Weeks 13–18)

**Goal:** “Who’s overloaded?” with hard + soft signals; exec dashboard charts.

### User stories — Executive

- [ ] **As an executive**, I ask “Show me who’s overloaded” and see a respectful list with Linear data and check-in/Slack soft signals.
- [ ] **As an executive**, I see a color-coded Team Health roster with one-line reasons.
- [ ] **As an executive**, when someone is overloaded, I get suggested actions (reassign, sync) without oversharing private detail.
- [ ] **As an executive**, Strategy Agent responses include inline charts (velocity, capacity) when I ask.

### User stories — Individual contributor

- [ ] **As an IC**, when I’m overloaded, I get a private supportive Slack message and triage before burnout escalates silently.
- [ ] **As an IC**, the agent asks before reassigning or deprioritizing my work.

### Tasks

**Backend**

- [ ] Linear OAuth (workspace-level — confirm PRD decision)
- [ ] Issue sync job (assignee, state, estimates, cycle time)
- [ ] Capacity score pipeline (Linear + check-ins + optional Slack signals)
- [ ] Overload detection thresholds + IC triage DM flow
- [ ] Team Health API for dashboard
- [ ] Strategy Agent tool responses: `capacity_list`, `velocity_chart` (per spec §13)

**Frontend**

- [ ] Linear connect in Settings
- [ ] Team Health strip (live data)
- [ ] Context panel chart components (pick chart library — PRD open question)
- [ ] Drill-down from roster row → summary + suggested actions

### Phase complete

- [ ] Exec asks “who’s overloaded” in web app; sees evidence-based list; IC overload flow tested end-to-end with consent before ticket moves.

---

## Phase 5 — Assignment, HR & Full Swarm (Weeks 19+)

**Goal:** Goal → tickets, assignment suggestions, HR-triggered onboarding, performance rollups.

### User stories

- [ ] **As an executive**, I state a high-level goal and get OKRs / Linear tickets with acceptance criteria (human approves).
- [ ] **As an executive**, I get assignment suggestions matched to skills and capacity (human override).
- [ ] **As an executive**, I ask “How has Jordan been performing?” and get an evidence-based rollup.
- [ ] **As HR adds a hire**, onboarding agent sets up Slack, Linear profile, and channels from role data.
- [ ] **As a team**, culture/values nudges and peer pulses run lightly in Slack (later agent).

### Tasks

- [ ] Strategy + Coordination agents (LangGraph or CrewAI — per PRD)
- [ ] Executive goal → ticket breakdown + approval UI
- [ ] Assignment suggestion API + approve/reject flow
- [ ] HRIS webhook integration (vendor TBD)
- [ ] Onboarding agent workflow
- [ ] Performance profile job (Linear, reviews, pulses, outcomes)
- [ ] Vector store for company memory (docs, past projects)
- [ ] Review agent first-pass (design/code) — escalate only when ambiguous

### Phase complete

- [ ] At least one executive goal → approved Linear breakdown; one hire onboarded via HRIS; performance query returns sourced summary.

---

## Cross-cutting — Ops, trust & compliance

Not tied to a single phase; revisit before each phase gate.

- [ ] Environment variables documented and set on Render + Vercel (see spec §8)
- [ ] `CRON_SECRET` rotation procedure
- [ ] Slack rate-limit handling (stagger DMs for large teams)
- [ ] IC transparency copy: what is collected, who sees it, how to pause
- [ ] No surveillance framing in agent copy; IC can view own stored responses (product decision)
- [ ] Error monitoring / structured logs on scheduler runs
- [ ] Privacy review for Slack “stress language” signals (Phase 4)

---

## Open product decisions (block or default before build)

Track in [prd.md §11](./prd.md); resolve and check here when decided.

- [ ] Digest visible to ICs or exec-only?
- [ ] Contractors vs FTE in roster?
- [ ] Default check-in frequency (2×/week vs configurable only)?
- [ ] Chart library + exec-only auth pattern for dashboard?
- [ ] Linear OAuth: workspace vs per-user?
- [ ] HRIS vendor for first integration?
- [ ] Per-sub-team question sets vs one set per workspace?

---

## Quick status snapshot (codebase)

Update this section when phases advance.

| Area | Status |
|------|--------|
| Backend health + auth | Done |
| Workspace schedule schema | Done |
| Internal cron scheduler | Stub commented out |
| Schedule API | Not started |
| Slack Check-In Agent | Not started |
| Frontend auth | Done |
| Settings schedule UI | Not started |
| Question Editor | Not started |
| Linear / capacity | Not started |

---

## How to use this file

1. Work **top to bottom**; do not skip Phase 1 acceptance for “nicer” dashboard work.
2. When finishing a task, check `[ ]` → `[x]` and add PR link or commit hash in a comment if useful.
3. Keep [spec.md](./spec.md) and [prd.md](./prd.md) as source of truth for behavior; update this file when scope shifts.
4. **prd-test.md** is intentionally empty — do not use it for planning.
