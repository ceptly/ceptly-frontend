Ceptly RAG Implementation — Final Plan

     Context

     Ceptly is a tool-augmented Gemini agent platform, not RAG today. Retrieval in the
     founder /chat team_qa agent is pure substring keyword matching over check-in
     transcripts (entryMatchesKeyword), standup transcripts aren't searchable at all,
     founder chat messages live only in React state, and LLM token usage is never recorded.

     This build adds the first real knowledge layer: Voyage embeddings + pgvector
     retrieval for check-ins and standups, persisted founder chat, and LLM
     telemetry. Gemini generation is unchanged. All work filters by workspace_id from
     the authenticated request — never from a client body.

     Repos: ceptly-backend (/home/michaelehmke/Projects/ceptly-backend) holds all
     AI/DB logic; ceptly2 (/home/michaelehmke/Projects/ceptly2) is the Next.js UI +
     SSE proxy.

     Decisions locked with the user

     - Telemetry: add a generateContentWithTelemetry() wrapper; migrate the
     high-value paths only (team-qa, checkin, standup, workspace-chat). Raw client stays
     for the long tail, migrated opportunistically later.
     - Chat persistence: the backend writes messages during the chat turn and
     returns a session_id; frontend loads history on mount. Single source of truth.
     - Backfill: build the script and run it now over full history.

     Verified facts (don't re-discover)

     - voyage-4-lite is current and supports output_dimension 256/512/1024/2048, but
     default is 1024 — the API call MUST send output_dimension: 512 to fit
     vector(512). Endpoint POST https://api.voyageai.com/v1/embeddings, returns
     data[].embedding as float arrays. VOYAGE_API_KEY already set on Render.
     - DB client is node-postgres (pg), pool in src/db/index.ts. pgvector values do
     NOT round-trip as plain JS arrays — they serialize as '[0.1,0.2,...]' strings.
     Use a custom Drizzle vector column type for this (below).
     - Migrations are drizzle-kit generated (npm run db:generate / db:migrate),
     journal at drizzle/meta/_journal.json, latest is 0036_standup_is_ephemeral.
     drizzle-kit cannot express CREATE EXTENSION or vector indexes, so 0037 is
     hand-written and appended to the journal manually.
     - No single Gemini chokepoint: getGeminiClient() returns a raw client; ~25
     client.models.generateContent() calls across 12+ files, none read usageMetadata.
     - Schema conventions (src/db/schema/): pgTable("snake_case", {...}), camelCase TS
     fields, uuid("id").primaryKey().defaultRandom(), timestamp(col,{withTimezone:true}),
     jsonb(col).$type<T>(), FKs .references(()=>t.id,{onDelete:"cascade"}), both
     $inferSelect/$inferInsert exported, all re-exported from schema/index.ts.

     ---
     Task 1 — Migration + Drizzle schemas

     Hand-write drizzle/0037_knowledge_platform.sql and append an entry to
     drizzle/meta/_journal.json (idx 37, tag 0037_knowledge_platform).

     Tables (per the design §4) with two adjustments:
     - Use an HNSW index, not ivfflat: USING hnsw (embedding vector_cosine_ops).
     Rationale: no training/data needed before it's useful, better recall for a small
     and growing corpus — right default for a solo dev. ivfflat lists=100 would need
     ~thousands of rows before it indexes well.
     - CREATE EXTENSION IF NOT EXISTS vector; first.

     Tables: knowledge_chunks (workspace_id FK cascade, source_type, source_id,
     chunk_index, content, embedding vector(512), metadata jsonb, unique
     (workspace_id, source_type, source_id, chunk_index), btree index on workspace_id,
     hnsw index on embedding), workspace_chat_sessions, workspace_chat_messages,
     llm_invocations — exactly as design §4.

     Drizzle schema files in src/db/schema/, re-exported from index.ts:
     knowledge-chunk.ts, workspace-chat-session.ts, workspace-chat-message.ts,
     llm-invocation.ts. Add a shared custom vector type (e.g.
     src/db/schema/_vector.ts):

     import { customType } from "drizzle-orm/pg-core";
     export const vector = (name: string, { dimensions }: { dimensions: number }) =>
       customType<{ data: number[]; driverData: string }>({
         dataType: () => `vector(${dimensions})`,
         toDriver: (v) => `[${v.join(",")}]`,
         fromDriver: (v) => JSON.parse(v as string),
       })(name);

     Add voyageApiKey: process.env.VOYAGE_API_KEY + isVoyageConfigured() to
     src/config/env.ts, following the geminiApiKey / isStripeConfigured() pattern.

     ---
     Task 2 — Embedding + retrieval services

     New files in src/services/:

     - knowledge-types.ts — interfaces from design §5 (KnowledgeSourceType,
     KnowledgeChunkMetadata, KnowledgeSearchFilters, KnowledgeSearchResult).
     - voyage-embedding-service.ts — embedText(text), embedBatch(texts) →
     POST https://api.voyageai.com/v1/embeddings with
     { model: "voyage-4-lite", input, output_dimension: 512, input_type: "document"|"query" }.
     Use input_type: "query" on retrieval, "document" on indexing (Voyage asymmetric
     retrieval). Returns data[].embedding. If !isVoyageConfigured(), return null
     so callers fall back to keyword.
     - knowledge-retrieval-service.ts — searchKnowledge(workspaceId, query, filters)
     embeds the query, runs cosine search scoped to workspace via a Drizzle sql template
     using the <=> operator and ORDER BY embedding <=> $query LIMIT 8, applying
     metadata filters (sourceTypes, memberId/Name, days, status) in the WHERE.
     score = 1 - distance. formatKnowledgeResults(results) reuses the existing
     transcript formatting shape from checkin-context-service.ts so output matches what
     team_qa already feeds Gemini.

     ---
     Task 3 — Indexing service + hooks + backfill

     knowledge-indexing-service.ts — indexCheckinSession(sessionId),
     indexStandupSession(sessionId), indexStandupSummary(sessionId). Each loads the
     session, builds the chunk content (reuse formatTranscriptEntry() from
     checkin-context-service.ts for check-ins), skips sessions with < 3 messages,
     embeds via voyage service, and upserts into knowledge_chunks keyed on the unique
     constraint (idempotent re-index). All writes carry workspace_id. Wrap in
     try/catch + log — indexing must never break the completion flow (fire-and-forget
     after the status write).

     Hooks (call after the existing completion writes, not on every message):
     - checkin-service.ts — right after the status → completed update (~L628), before
     integration finalizations.
     - standup-session-service.ts completeStandupSession() — after the
     summaryText/completedAt update (~L358) → indexStandupSession.
     - standup-synthesis-service.ts — after summary written → indexStandupSummary.

     scripts/backfill-knowledge-index.ts — iterate all workspaces → eligible
     completed check-in + standup sessions → call the same index functions in batches
     (use embedBatch), idempotent via the unique constraint so reruns are safe. Run it
     once after migration: npx tsx scripts/backfill-knowledge-index.ts.

     ---
     Task 4 — Semantic query_checkins

     In team-qa-agent.ts:
     - Add semantic_query: { type: "string", ... } to
     QUERY_CHECKINS_DECLARATION.parametersJsonSchema.properties (~L78).
     - In executeQueryCheckins() (~L424): if semantic_query is a non-empty string OR
     the keyword path returns nothing, call
     searchKnowledge(workspaceId, query, { days, memberName, includeInProgress });
     return formatKnowledgeResults() when it has hits. Existing keyword path stays as
     the fallback (and the fallback when Voyage is unavailable). workspaceId already
     flows in as the first arg.

     ---
     Task 5 — Persist founder chat (backend-driven)

     Backend (workspace-chat-service.ts / routes/workspace-chat.ts /
     chat-router.ts):
     - chatWorkspace() accepts an optional sessionId. On first turn create a
     workspace_chat_sessions row (workspace_id, user_id, resolved agent_id); persist
     the incoming user message and the produced assistant message (plus proposal/
     agent_id) to workspace_chat_messages. Emit the session_id in the SSE done
     event and the JSON response. Writes scoped to authenticated workspace_id/user_id.
     - New read routes (design §6): GET /api/workspaces/:workspaceId/chat/sessions and
     GET .../chat/sessions/:sessionId, workspace-scoped.

     Frontend (ceptly2):
     - lib/api/workspace-chat-history.ts — loadChatHistory(accessToken, workspaceId)
     following the lib/api/roster.ts server-fetch pattern.
     - components/chat/chat-page-content.tsx — add loadChatHistory() to the existing
     Promise.all() and pass initialMessages + sessionId down.
     - components/employee-chat-prompt.tsx — initialize messages state from
     initialMessages instead of []; thread session_id from the stream done result
     back into subsequent streamChatWorkspace calls.
     - Proxy route app/api/workspaces/[workspaceId]/chat/stream/route.ts is unchanged
     (already forwards body + Bearer token).

     ---
     Task 6 — LLM telemetry (wrapper + key paths)

     In gemini-client.ts add generateContentWithTelemetry(params, ctx) that:
     calls client.models.generateContent(params), measures latency, reads
     response.usageMetadata (promptTokenCount / candidatesTokenCount), fire-and-forget
     writes a llm_invocations row via a new llm-telemetry-service.ts
     (logInvocation({ workspaceId, agentName, model, inputTokens, outputTokens, latencyMs, sourceType, sourceId })), and returns the response unchanged. Failures in logging
     must not affect the response.

     Migrate these call sites to the wrapper (pass workspace_id + agent name):
     team-qa-agent.ts, checkin-conversation-agent.ts, standup-turn-service.ts,
     standup-synthesis-service.ts, the workspace-chat agents
     (conversation-setup-agent.ts, adhoc-conversation-agent.ts,
     channel-standup-agent.ts) and chat-router.ts. Remaining ~10 sites stay on the raw
     client for now.

     ---
     Out of scope

     Memory system, feedback UI, eval harness, document upload, Anthropic provider,
     re-ranker, check-in pre-fetch RAG, re-embedding the long-tail Gemini call sites.

     ---
     Verification (end-to-end)

     1. Migration: run npm run db:migrate; confirm \dx shows vector and the four
     tables + hnsw index exist.
     2. Backfill: run the backfill script; confirm SELECT count(*) FROM knowledge_chunks GROUP BY source_type is non-zero and embeddings are 512-dim.
     3. Semantic retrieval: in founder /chat, ask a question whose answer uses words
     NOT in the transcripts (e.g. "what's blocking the team's deployments?") — verify
     query_checkins returns relevant check-in/standup sessions via the semantic path.
     Confirm a different workspace returns nothing (tenant isolation).
     4. Chat persistence: send a few messages, refresh the page — history reloads from
     the backend; confirm rows in workspace_chat_messages with the right
     workspace_id/session_id.
     5. Telemetry: after any check-in/standup/team-qa turn, confirm a new
     llm_invocations row with non-null token counts and latency.
     6. Run the backend test/typecheck (npm run build / tsc) — surgical diffs, no
     unrelated regressions.
