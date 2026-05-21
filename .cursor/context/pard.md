# PRD: Ceptly — AI-Powered Team Management for Flat Organizations

**Version:** 0.3  
**Status:** Draft  
**Author:** Michael Ehmke  
**Last Updated:** May 2026

---

## 1. Overview

### Problem Statement

Flat organizations — startups and small companies intentionally operating without a middle management layer — break down at scale because coordination, visibility, and team health depend on humans manually doing the work that managers typically own: check-ins, status updates, blocker identification, and performance signals. Without tooling to replace that function, founders become the information bottleneck and problems surface too late.

### Solution

Ceptly is a Slack-native product powered by AI agents that proactively gather context from individual contributors through async conversations, synthesize that context, and deliver structured updates, alerts, and answers to founders and team leads — without requiring a manager in the loop.

### Target User

- **Primary:** Founders and team leads at flat-structure startups (10–80 people)
- **Secondary:** Individual contributors who need a lightweight async way to surface blockers and progress

### Core Value Proposition

> "Your team's AI chief of staff. Always listening, never in the way."

---

## 2. Goals & Success Metrics

### Goals

- Replace the coordination and visibility function of middle managers for flat orgs
- Reduce founder time spent on status gathering and team health monitoring
- Surface problems earlier than they would appear organically
- Require zero behavior change from ICs beyond a Slack DM

### Success Metrics (MVP)

| Metric | Target |
|---|---|
| Weekly active teams | 10+ within 60 days of launch |
| IC check-in completion rate | >70% per week |
| Founder-reported time saved on status gathering | >3 hrs/week |
| Retention at 30 days | >60% of teams |

---

## 3. User Stories

### Founder / Team Lead

- As a founder, I want to see a weekly summary of what every team member is working on, without having to ask them myself.
- As a founder, I want to be alerted when someone is blocked so I can unblock them before it becomes a sprint-level problem.
- As a founder, I want to ask a question like "Is anyone burnt out?" and get an honest synthesized answer based on recent check-in data.
- As a team lead, I want to know if team morale is trending down before someone quits.

### Founder / Team Lead (Question Editor)

- As a founder, I want to tell Ceptly what I care about (e.g. "I want to track sprint progress and team energy") and have it suggest a question set I can customize.
- As a manager, I want to add my own custom questions so the check-in reflects what actually matters to my team right now.
- As a manager, I want to reorder questions so the most important ones get asked first.
- As a manager, I want to preview exactly what the agent will say to an IC before I publish changes.
- As a manager, I want to see which questions ICs tend to skip or give short answers to, so I can improve them.

### Individual Contributor

- As an IC, I want to report my status without having to write a formal update or attend a sync.
- As an IC, I want to flag a blocker to leadership without having to navigate politics or escalate manually.
- As an IC, I want the check-in to feel conversational, not like filling out a form.

---

## 4. Agent Architecture

The product is built around three agents with distinct roles. All agents operate inside Slack.

---

### 4.1 Check-In Agent

**Role:** Proactively contacts individual contributors on a set cadence to gather status context.

**Behavior:**
- DMs each IC on a configurable schedule (default: Monday morning and Thursday EOD)
- Conducts a short, conversational async interview — not a form
- Adapts follow-up questions based on prior responses (e.g., if someone flagged a blocker last week, asks for an update on it)
- Persists responses to a structured data store for downstream synthesis

**Sample Check-In Flow:**

> **Agent:** Hey Sarah — quick check-in! What are you focused on this week?  
> **Sarah:** Finishing the onboarding flow and a bug fix for the dashboard.  
> **Agent:** Got it. Any blockers or things slowing you down?  
> **Sarah:** Waiting on design to finalize the empty state screens.  
> **Agent:** Noted. On a scale of 1–5, how are you feeling about your workload right now?  
> **Sarah:** 3, it's manageable but getting full.

**Questions Asked (rotating, not all every session):**
- What are you working on this week?
- Any blockers or dependencies waiting on others?
- How is your workload feeling? (1–5)
- Anything you want leadership to know?
- Is there anything you're unclear on in terms of priorities?

**Configuration (per workspace):**
- Check-in frequency (daily / 2x week / weekly)
- Check-in window (e.g., only between 9am–11am in team's timezone)
- Active question set (managed via Question Editor — see Section 4.4)
- Whether ICs can opt out of specific questions

---

### 4.2 Synthesis Agent

**Role:** Processes raw check-in responses and produces structured summaries and alerts for team leads.

**Behavior:**
- Runs after each check-in window closes
- Reads all IC responses for the period
- Groups insights by theme: progress, blockers, workload, morale, open questions
- Identifies patterns across the team (e.g., multiple people waiting on the same dependency)
- Flags anomalies: someone who usually responds positively suddenly rates workload 1 or 5
- Posts a digest to a designated Slack channel (e.g., `#leadership-digest`)

**Output Format (posted to Slack):**

```
📋 Weekly Team Digest — Week of May 19

✅ Progress
• Sarah: Onboarding flow, dashboard bug fix
• James: Auth refactor (Day 3/5)
• Priya: Customer interviews for Q3 research

🚧 Blockers (3)
• Sarah → waiting on design: empty state screens
• James → needs backend env access from DevOps
• Priya → no blockers

📊 Workload Sentiment
Average: 3.2 / 5  ▓▓▓░░
• 2 people trending toward overload (4+)
• 1 person underloaded (1)

⚠️ Flags
• James hasn't responded to 2 consecutive check-ins
• Workload scores up 0.8 pts vs last week — worth a pulse check

💬 Open Items for Leadership
• "Are we still targeting a June launch or has that shifted?"
• "Can we get clarity on the new feature prioritization?"
```

**Alert Types:**

| Alert | Trigger |
|---|---|
| Blocker Alert | IC reports a blocker; posts immediately to `#leadership-digest` |
| Disengagement Flag | IC misses 2+ consecutive check-ins |
| Workload Spike | Team average workload score increases >1pt week-over-week |
| Morale Dip | 2+ ICs report low scores in same window |
| Unanswered Question | IC submits a question that no digest has addressed in 7+ days |

---

### 4.3 Q&A Agent

**Role:** Allows founders and team leads to ask natural language questions about their team and get answers synthesized from check-in history.

**Behavior:**
- Responds to @mentions or DMs from authorized users (founders, leads)
- Queries the check-in data store to construct answers
- Answers are grounded in actual IC responses — never fabricated
- Cites the source timeframe ("based on check-ins from this week")

**Example Queries:**

| Query | Agent Response |
|---|---|
| "Is anyone blocked right now?" | Lists current blockers with names and context |
| "How is team morale looking?" | Synthesizes workload and sentiment scores with trend |
| "What is James working on?" | Summarizes James's last 2 check-ins |
| "Who hasn't checked in this week?" | Lists non-responders |
| "Are there any recurring blockers?" | Identifies dependencies that have appeared 2+ times |
| "What questions does the team have for me?" | Surfaces unaddressed IC questions |

**Guardrails:**
- Q&A Agent only answers questions about team members to authorized roles (founder, team lead)
- ICs can only query their own data
- Agent always attributes answers to timeframe and source ("Sarah mentioned this on Monday")
- Agent does not speculate or extrapolate beyond what was said

---

### 4.4 Question Editor (Next.js UI)

**Role:** Gives managers a web UI to define, customize, and preview the exact questions the Check-In Agent asks their team — with an AI assistant that suggests and refines questions based on stated goals.

This is the primary surface of the Ceptly web app. Everything else (digests, alerts) flows through Slack; this is where managers shape what the agents ask.

---

#### 4.4.1 Question Management

Managers can build and maintain a question library for their workspace.

**Question Types:**

| Type | Description | Example |
|---|---|---|
| Open text | Free-form response | "What are you working on this week?" |
| Scale (1–5) | Numeric rating with optional label | "How is your workload? (1 = light, 5 = overwhelmed)" |
| Yes / No | Binary with optional follow-up | "Are you blocked on anything?" |
| Multiple choice | Select from options | "Which best describes your week: on track / behind / ahead" |

**Question List UI:**
- Displays all questions in the active question set as a drag-and-drop ordered list
- Each question row shows: question text, type, active/inactive toggle, edit and delete controls
- Max active questions per check-in session: configurable (default: 4)
- Questions marked inactive stay in the library but won't be asked
- Changes to the active set take effect on the next scheduled check-in

**Editing a Question:**
- Inline edit or modal editor
- Fields: question text, question type, follow-up prompt (optional), skip logic (optional: only ask if previous answer meets condition)
- "Tone preview" toggle: shows how the agent will phrase the question conversationally (e.g., a stiff "Please rate your workload 1–5" becomes "How's your workload feeling this week? (1 = easy, 5 = overwhelming)")

---

#### 4.4.2 AI Question Suggester

The Question Editor includes an AI-powered suggestion flow that helps managers build their question set without starting from scratch.

**Entry Point:** "Help me build my question set" prompt at the top of the Question Editor page.

**Flow:**

```
Step 1 — Manager states their goal
Ceptly: "What do you most want to understand about your team right now?"
Manager: "I want to track sprint velocity and whether people are burning out"

Step 2 — AI generates suggested questions
Ceptly returns 6–8 suggested questions tailored to the stated goal:

  Suggested for "sprint velocity + burnout":
  ✦ What did you ship or complete since the last check-in?
  ✦ Are you on track to hit your goals this sprint?
  ✦ What's one thing slowing you down right now?
  ✦ How are you feeling energy-wise this week? (1 = drained, 5 = energized)
  ✦ Is your current workload sustainable at this pace?
  ✦ Anything you'd want to flag before the weekend?

Step 3 — Manager reviews and selects
  - Add individual questions with one click
  - Edit any question before adding
  - Regenerate the whole set with a different goal

Step 4 — Confirm active set
  - Drag to reorder
  - Preview full check-in flow
  - Publish
```

**Guardrails on AI Suggestions:**
- Agent will not suggest questions that could be used to surveil ICs beyond their work context (e.g., no questions about personal life, health, or off-hours behavior)
- Questions framed to feel conversational, not evaluative
- Manager can always override or write from scratch

---

#### 4.4.3 Check-In Preview

Before publishing a question set, managers can preview the full check-in experience as an IC would see it in Slack.

**Preview Mode:**
- Renders a simulated Slack DM conversation showing the agent's exact messages
- Manager can "respond" as a test IC and see how the agent handles follow-ups
- Shows estimated time to complete (target: under 2 minutes)
- Highlights any questions flagged as potentially confusing or too long

**Preview UI location:** Accessible via "Preview as IC" button in the Question Editor, opens in a right-side panel or modal.

---

#### 4.4.4 Question Performance Insights

After at least 2 check-in cycles, the Question Editor surfaces lightweight analytics per question to help managers improve their set.

| Metric | Description |
|---|---|
| Response rate | % of ICs who answered this question |
| Avg response length | Signals engagement (very short may mean question is unclear) |
| Skip rate | % who skipped or said "N/A" |
| Sentiment signal | For scale questions: avg score and trend over last 4 cycles |

These are shown inline on each question row as small badges. No separate analytics page needed in v1.

---

#### 4.4.5 Question Set Versioning

Each time a manager publishes a change to the active question set, Ceptly saves a version snapshot.

- Versions are timestamped and labeled (e.g., "Updated May 19 — added burnout question")
- Manager can view prior versions and restore any previous set
- Digests reference the question set version active during that period, so historical data stays interpretable

---

## 5. Slack Integration

### Workspace Setup

1. Founder installs the Slack app and authenticates
2. Designates `#leadership-digest` channel for digests and alerts
3. Invites the bot to team member DMs (or team members opt in via `/checkin start`)
4. Configures check-in schedule and team roster

### Slash Commands

| Command | Description |
|---|---|
| `/checkin start` | IC opts into check-ins |
| `/checkin pause [days]` | IC pauses check-ins temporarily (PTO, etc.) |
| `/digest now` | Founder triggers an on-demand synthesis |
| `/ask [question]` | Founder queries the Q&A Agent |
| `/team status` | Returns a quick snapshot of current team health |

### Permissions Model

| Role | Can Do |
|---|---|
| Founder / Admin | Full access: digests, alerts, Q&A, configuration |
| Team Lead | Access to their direct team's digests and Q&A |
| IC | Check-in only; can view their own past responses |

---

## 6. Data Model (MVP)

```
User
  id, slack_id, name, role (founder | lead | ic), workspace_id, timezone

QuestionSet
  id, workspace_id, version, created_at, published_at, created_by (user_id), label
  questions[] → Question (ordered)

Question
  id, question_set_id, text, type (open | scale | yes_no | multiple_choice),
  options[] (for multiple_choice), follow_up_prompt, skip_logic, is_active, order_index

CheckIn
  id, user_id, question_set_version_id, timestamp,
  responses[] { question_id, answer, response_length_chars }, workload_score, mood_score

Blocker
  id, user_id, check_in_id, description, status (open | resolved), created_at, resolved_at

Digest
  id, workspace_id, period_start, period_end, content (markdown), posted_at

Alert
  id, workspace_id, type, severity, message, triggered_at, resolved_at
```

---

## 7. Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Frontend / Config UI | Next.js on Vercel | Fast to build, optimized Vercel deployment |
| Backend API | Node.js + Express on Render | Separate service, single trust boundary for all permissions |
| Database | Render Postgres | Managed Postgres, co-located with backend on Render |
| ORM | Drizzle | Type-safe queries, lightweight, pairs well with Postgres |
| AI / Agents | Anthropic Claude API (claude-sonnet-4-20250514) | Best conversational quality for check-ins |
| Slack Integration | Slack Bolt SDK (Node) | First-party SDK, handles events + slash commands |
| Job Scheduling | Inngest | Durable background jobs for scheduled check-ins and digest triggers |

### Permissions Architecture

All role and permission checks are enforced exclusively in the **Express backend API layer**. The database is a dumb data store — no Row Level Security, no database-level access policies.

**Principles:**
- The frontend (Vercel/Next.js) never queries the database directly
- Every request from the frontend goes through the backend API
- The backend validates the requesting user's role and workspace before executing any query
- Render Postgres is only accessible from the backend service — not exposed publicly
- The backend is the single trust boundary for the entire application

**Request flow:**
```
Vercel (Next.js) → REST API request with auth token
  → Render (Express) → validate token → check role/permissions → query Render Postgres
                                                                 → return filtered response
  → Vercel (Next.js) ← response
```

---

## 8. MVP Scope

### In Scope (v1)

- Check-In Agent via Slack DM (2x/week cadence)
- Synthesis Agent posting weekly digest to `#leadership-digest`
- Blocker alerts (real-time, on detection)
- Disengagement alerts (missed 2+ check-ins)
- Q&A Agent for founders via Slack DM
- Basic config UI: team roster, schedule, channel selection
- **Question Editor (Next.js):**
  - Create, edit, reorder, toggle active/inactive questions
  - AI Question Suggester (goal → suggested question set)
  - Check-in preview ("Preview as IC")
  - Question set versioning

### Out of Scope (v1)

- Email or Teams integration
- Performance reviews or firing recommendations
- Goal/OKR tracking
- Peer feedback loops
- Mobile app
- Multi-workspace enterprise features
- SSO / SAML

---

## 9. Risks & Open Questions

| Risk | Mitigation |
|---|---|
| Low IC check-in completion | Keep questions short (<3 per session); make it feel like a chat, not a form |
| ICs feeling surveilled | Transparent opt-in; IC can see their own data; no surveillance framing |
| AI hallucinating IC responses | Q&A Agent only synthesizes from stored responses; never generates unsourced claims |
| Slack rate limits during large team check-ins | Stagger DM sends; use queue |
| Founders ignoring digests | Make digest scannable in <60 seconds; mobile-friendly formatting |

---

## 10. Build Phases

### Phase 1 — Core Loop (Weeks 1–4)
- Slack app setup and OAuth
- Check-In Agent: DM flow, hardcoded default question set, response storage
- Basic digest posted to channel (manual trigger)
- Test with 1 real team

### Phase 2 — Question Editor + Intelligence (Weeks 5–8)
- Next.js app scaffolding
- Question Editor: create, edit, reorder, toggle active questions
- AI Question Suggester (goal input → suggested set via Claude API)
- Check-in preview ("Preview as IC" panel)
- Synthesis Agent: automated digest on schedule
- Blocker + disengagement alerts
- Q&A Agent (basic)

### Phase 3 — Polish & Retention (Weeks 9–12)
- Question performance insights (response rate, skip rate, avg length)
- Question set versioning + restore
- Trend tracking (workload/sentiment over time)
- Adaptive follow-up questions based on prior responses
- IC opt-in/pause commands
- Onboarding flow for new workspaces

---

## 11. Open Questions

- [ ] Should ICs see the digest, or only founders/leads?
- [ ] How do we handle contractors vs full-time employees in the roster?
- [ ] What's the right default check-in frequency — 2x/week may feel like too much for some teams
- [ ] Do we want a web dashboard at all in v1, or stay fully Slack-native?
- [ ] How do we handle very small teams (2–5 people) where patterns are harder to detect?
- [ ] Should managers be able to assign different question sets to different team members or sub-teams?
- [ ] How do we handle question set changes mid-sprint — do we notify ICs?
- [ ] Should the AI Suggester have preset goal templates (e.g. "sprint health", "culture pulse", "project risk") to speed up onboarding?