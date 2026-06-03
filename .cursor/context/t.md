---

How "training" actually works here — the honest answer

Nothing in Ceptly trains a model, and the agent does not train itself. That's worth being precise about, because "agent" can imply self-improvement that isn't happening. Here's the real picture:

What's actually under the hood

- Generation = Google Gemini via API (gemini-client.ts). Fixed model, weights never change. You rent it per call.
- Embeddings = Voyage voyage-4-lite. Also a fixed pretrained model.
- What we built (RAG) = retrieval, not learning. On each question it embeds the query, finds similar past check-ins/standups in pgvector, and pastes that context into the prompt. The model isn't smarter afterward — it just had better notes in front of it that one time.

So there's no weight update, no reinforcement learning, no reward signal, no self-modification anywhere in the system.

The three levers you do have (this is "training" in practice)

1. Prompt-level steering — your main knob. The codebase already exposes per-conversation controls:


    - agentPersona and agentNotes on scheduled conversations
    - customInstructions on standups

Editing these is how you shape tone, what it asks, what it focuses on. It takes effect on the very next run. This is the closest thing to "training the agent" and it's immediate. 2. Growing the knowledge base — automatic accumulation. Every completed check-in/standup now gets indexed (the hooks we added). So retrieval gets richer over time without you doing anything. But that's more data, not a better model — and quality of answers depends on quality of
what's indexed (garbage in, garbage out). 3. Model/prompt choices — swapping GEMINI_MODEL, editing system prompts in the agent files.

"How does it know what a good outcome is?" — it doesn't, yet

This is the key gap. Today there is no notion of a good outcome in the system:

- No thumbs-up/down or feedback capture
- No eval harness (a fixed set of questions + expected behavior to score against)
- No memory of "that answer was wrong, do better"

The plan explicitly put memory system, feedback UI, and eval harness out of scope for this build. The llm_invocations telemetry we added measures cost/latency/tokens — the plumbing for measurement — but not quality.

If you want a real improvement loop later, the order would be:

1. Capture a signal — thumbs up/down on chat answers, or implicit (did you act on the reach-out it proposed?).
2. Build an eval set — ~20–50 real questions with "what good looks like," so you can A/B prompt and model changes objectively instead of by vibes.
3. Add a memory layer — persist learned preferences/corrections as retrievable context (still RAG, still no training — just durable notes).
4. Only then, if needed, actual fine-tuning — Gemini and Voyage both support it, but it's a deliberate, separate pipeline needing labeled data. It's rarely the first move; better prompts + better retrieval usually get you most of the way.

Short version: you "train" Ceptly today by editing personas/instructions and letting the knowledge base grow — not by any self-learning. Giving it a sense of "good vs. bad" is a deliberate next project (feedback + evals), and I'd start there before anything resembling fine-tuning.
Want me to sketch what adding a feedback signal + a small eval harness would look like?
