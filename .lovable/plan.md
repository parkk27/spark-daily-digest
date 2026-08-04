# Big Data Intelligence Hub v2.0 — Phased Plan

Evolve the current MVP into a secure, multi-user intelligence platform without breaking today's experience. The dashboard stays publicly readable; sign-in unlocks personalization. Email uses Lovable's built-in sending (no third-party keys).

## What already exists today

- Pipeline edge function (ingest → filter → dedupe → tag → score → summarize → trend detect → store) with basic metrics.
- `spark_daily_snapshots` table (public read, service-role write).
- Home / News / Trends pages, "Ask Big Data Hub" copilot, trend insights, MCP server.
- No user accounts, no per-user data, no live email delivery.

Workstream 6 (AI Copilot) is largely built already — later phases refine it rather than rebuild it.

---

## Phase 1 — Authentication & user foundation

- Auth page with email/password, magic link, and Google sign-in. Public routes stay public.
- `profiles` table (display name, avatar, created via signup trigger) and `user_roles` table with an `app_role` enum + `has_role()` security-definer function (roles never on profiles).
- `user_preferences`: preferred technologies, email frequency (daily/weekly/off), notification prefs.
- `watchlists` and `saved_searches` tables, one row set per user.
- RLS on every new table, scoped to `auth.uid()`, plus explicit grants. Snapshots stay public-read.
- Navbar shows sign-in / account menu; a `/settings` page edits preferences, watchlist topics, and saved searches.
- Personalization on existing pages: watchlist topics pinned at the top of Trends and News for signed-in users. Signed-out experience unchanged.

## Phase 2 — Email intelligence

- Sender domain setup + email infrastructure (queue, send log, suppression, unsubscribe page).
- Templates: **Daily Executive Brief** and **Weekly Intelligence Report**, each with Top Insight, Key Highlights, Emerging Trends, Vendor Momentum, Strategic Implications — branded to the dark executive theme, responsive HTML.
- **Critical Alert** template triggered when a watched topic makes a large jump or a high-importance article lands.
- A scheduled dispatcher function reads subscribers from `user_preferences`, renders per-user content (their topics first), and enqueues one email per recipient. Respects frequency and unsubscribe state.
- Delivery outcomes recorded for observability.

## Phase 3 — Explainable scoring & source registry

- Extend scoring with: source credibility weight, topic importance, recency boost, vendor diversity penalty, innovation signal.
- Every article gains `importance` (0–10), `confidence`, and `reasons[]` (the human-readable factors that produced the score). Surfaced in the News card and the copilot context.
- `sources` table: name, URL, type (blog/RSS/category), weight, crawl frequency, enabled flag, failure counters. The pipeline reads sources from this table instead of a hardcoded list, making Snowflake, Confluent, Trino, ClickHouse, DuckDB, Flink, Kafka additions a data change.
- Admin-only source management screen, gated by the `admin` role via `has_role()`.

## Phase 4 — Reliability & observability

- `pipeline_runs` table storing every run's metrics: articles fetched/filtered, duplicates removed, average signal score, summary success, email success, Firecrawl latency, AI latency, total processing time, failures, retries, fallback usage.
- Retry with exponential backoff and a per-source circuit breaker (repeated failures disable a source temporarily and record it).
- Structured JSON logging with a run ID threaded through the pipeline.
- Graceful degradation preserved: a failed stage falls back to the previous snapshot rather than blanking the app.
- Admin "Pipeline health" view: recent runs, success rate, latency, failing sources.
- `audit_log` table for privileged actions, failed auth, email delivery, and crawl failures.

## Phase 5 — Copilot depth & executive framing

- Copilot context upgraded to include importance/reasons, source registry, and the user's watchlist when signed in.
- Answer templates for the six executive questions: what changed, why it matters, fastest-moving vendor, what to watch, what to evaluate next, architectural implications.
- Per-user rate limiting on copilot calls; anonymous users get a lower cap.

## Phase 6 — Commercial readiness

- Plan tiers (Free / Professional / Enterprise) modeled in the database, with feature gating driven by role + plan.
- Product analytics events: DAU/MAU, dashboard retention, topics viewed, searches, session duration, email opens, subscription conversion.
- Cost tracking per run: AI cost per summary, Firecrawl cost, cost per daily brief — recorded on `pipeline_runs`.
- Production README: architecture diagram, pipeline walkthrough, stack, deployment, environment variables, security model, secrets handling, cron config, Firecrawl and AI Gateway integration, troubleshooting, contribution guide.

Billing/payments and SSO are deliberately left out until you ask for them.

---

## Technical notes

- All new tables: `CREATE TABLE` → `GRANT` → `ENABLE ROW LEVEL SECURITY` → policies, in one migration. Anonymous grants only on intentionally public data.
- Roles live in `user_roles` and are checked through a security-definer `has_role()` function to avoid recursive policies. Never store a role on `profiles`.
- Service-role keys, Firecrawl keys, and AI gateway keys stay inside edge functions; the browser only ever uses the publishable key.
- Auth session handling registers `onAuthStateChange` early and validates with `getUser()` where trust matters.
- Email sending stays server-side and queue-backed; one recipient per send, no bulk loops.
- Existing components, design tokens, and the dark executive aesthetic are reused throughout — no visual redesign in any phase.

## Sequencing

Each phase ships and is verified before the next starts. This session covers **Phase 1** only; I'll check in before moving to Phase 2.
