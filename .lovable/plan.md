# Ask Big Data Hub — Intelligence Copilot

A focused, executive-style chat assistant grounded **only** in the project's ingested data (latest snapshot + recent historical snapshots from `spark_daily_snapshots`).

## Scope

- **Conversation shape:** one conversation (no threads — matches "session only" requirement).
- **Storage:** no persistence; state lives in React only, cleared on refresh.
- **Placement:** new section on `HomePage` below "Why It Matters", with a "Clear chat" button. No new route.

## UX

New card "Ask Big Data Hub" containing:
- Empty state with 5 suggested prompt chips (Spark week changes, Iceberg vs Delta, Fabric updates, AWS EMR, fastest-innovating vendor).
- Conversation transcript: user bubbles (primary token), assistant rendered as plain markdown on the card surface (no bubble, per design contract).
- Streaming token animation + "Thinking…" shimmer while waiting.
- Auto-focused textarea + send button (Enter to submit, Shift+Enter newline).
- Disabled state during streaming; errors surfaced inline (rate-limit / credits).

Keeps current dark minimal aesthetic — no new colors, uses existing semantic tokens.

## Backend (Edge Function: `spark-copilot`)

New Supabase Edge Function streaming via AI SDK + Lovable AI Gateway.

- **Model:** `google/gemini-3-flash-preview` (default).
- **Context build (server-side, per request):**
  1. Fetch latest snapshot from `spark_daily_snapshots` (summary, trends, all_articles).
  2. Fetch previous 6 snapshots for week-over-week / momentum context (date, trends, top headlines only — trimmed).
  3. Compose a compact JSON context block injected into the system prompt.
- **System prompt:** senior data platform analyst persona; allowed domains = Spark, Iceberg, Delta, Fabric, EMR, BigQuery, Databricks; rules: concise, insight-first, cite recent items, refuse off-topic ("No relevant ecosystem data available"), no coding help, no generic knowledge.
- Streams via `streamText().toUIMessageStreamResponse()` with CORS headers.
- No tools needed for v1 (context is pre-loaded — fast, no extra API calls).

## Frontend

- Install AI Elements: `conversation`, `message`, `prompt-input`, `shimmer`.
- New component `src/components/AskBigDataHub.tsx` using `useChat` + `DefaultChatTransport` pointed at the edge function URL (built from `VITE_SUPABASE_PROJECT_ID`, with anon key in headers).
- Render `message.parts` through `MessageResponse` (markdown).
- Suggested-prompt chips call `sendMessage({ text })`.
- Mounted in `HomePage` below existing sections.

## Files

- **New:** `supabase/functions/spark-copilot/index.ts`
- **New:** `src/components/AskBigDataHub.tsx`
- **New:** `src/components/ai-elements/*` (via AI Elements CLI)
- **Edit:** `src/pages/HomePage.tsx` (mount the new section)
- **Edit:** `supabase/functions/_shared/ai-gateway.ts` (create if missing)

## Out of scope (explicitly deferred)

Watchlists, Slack/Teams, proactive alerts, multi-agent, persistent history, separate `/copilot` route.

## Open question

Should the copilot also live as its own page (`/ask`) in the navbar, or **only** as a section on Home? Plan above assumes Home-only — confirm or I'll add the route.
